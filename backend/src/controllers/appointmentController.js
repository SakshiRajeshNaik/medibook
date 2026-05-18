const Appointment = require("../models/Appointment");
const DoctorProfile = require("../models/DoctorProfile");
const User = require("../models/User");
const SlotLock = require("../models/SlotLock");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const slotService = require("../services/slotService");
const emailService = require("../services/emailService");
const notificationService = require("../services/notificationService");
const crypto = require("crypto");

function generateRoomId() {
  return `medibook-${crypto.randomUUID()}`;
}

exports.lockSlot = catchAsync(async (req, res, next) => {
  const { doctorId, date, time } = req.body;
  if (!doctorId || !date || !time) return next(new AppError("doctorId, date, time required", 400));
  try {
    const lock = await slotService.lockSlot(doctorId, date, time, req.user._id);
    notificationService.notifySlotUpdate(doctorId, date);
    res.json({ success: true, lock });
  } catch (e) {
    return next(new AppError(e.message, 409));
  }
});

exports.releaseSlot = catchAsync(async (req, res) => {
  const { doctorId, date, time } = req.body;
  await slotService.releaseSlot(doctorId, date, time, req.user._id);
  notificationService.notifySlotUpdate(doctorId, date);
  res.json({ success: true });
});

exports.getSuggestions = catchAsync(async (req, res) => {
  const { doctorId, date, time } = req.query;
  const suggestions = await slotService.findSuggestions(doctorId, date, time);
  res.json({ success: true, suggestions });
});

exports.bookAppointment = catchAsync(async (req, res, next) => {
  const { doctorId, date, time, reason } = req.body;
  if (!doctorId || !date || !time) return next(new AppError("doctorId, date, time required", 400));

  const existing = await Appointment.findOne({
    doctor: doctorId,
    date,
    time,
    status: { $nin: ["cancelled"] },
  });
  if (existing) {
    const suggestions = await slotService.findSuggestions(doctorId, date, time);
    return res.status(409).json({
      success: false,
      message: "Slot unavailable",
      suggestions,
    });
  }

  const lock = await SlotLock.findOne({ doctor: doctorId, date, time, expiresAt: { $gt: new Date() } });
  if (lock && lock.lockedBy.toString() !== req.user._id.toString()) {
    return next(new AppError("Slot is locked by another user", 409));
  }

  const profile = await DoctorProfile.findOne({ user: doctorId });
  if (!profile) return next(new AppError("Doctor not found", 404));

  const queueCount = await Appointment.countDocuments({
    doctor: doctorId,
    date,
    time,
    status: { $nin: ["cancelled", "completed"] },
  });

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctorId,
    doctorProfile: profile._id,
    date,
    time,
    reason: reason || "",
    queuePosition: queueCount + 1,
    amount: profile.consultationFee,
    videoRoomId: generateRoomId(),
  });

  await slotService.releaseSlot(doctorId, date, time, req.user._id);
  await SlotLock.deleteOne({ doctor: doctorId, date, time });

  const patient = await User.findById(req.user._id);
  await emailService.sendBookingConfirmation(patient, appointment);
  await notificationService.createNotification(
    doctorId,
    "New Appointment",
    `${patient.name} booked ${date} at ${time}`,
    "appointment"
  );
  notificationService.notifySlotUpdate(doctorId, date);
  notificationService.notifyAppointmentsUpdate(req.user._id);
  notificationService.notifyQueueUpdate(doctorId, date, time);

  res.status(201).json({ success: true, appointment });
});

exports.getMyAppointments = catchAsync(async (req, res) => {
  const filter =
    req.user.role === "doctor"
      ? { doctor: req.user._id }
      : req.user.role === "admin"
        ? {}
        : { patient: req.user._id };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) filter.date = req.query.date;

  const appointments = await Appointment.find(filter)
    .populate("patient", "name email phone")
    .populate("doctor", "name email phone")
    .sort({ date: -1, time: 1 });

  res.json({ success: true, count: appointments.length, appointments });
});

exports.updateStatus = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError("Appointment not found", 404));

  const isDoctor = req.user.role === "doctor" && appointment.doctor.toString() === req.user._id.toString();
  const isPatient = appointment.patient.toString() === req.user._id.toString();
  if (!isDoctor && !isPatient && req.user.role !== "admin") {
    return next(new AppError("Not authorized", 403));
  }

  const { status, delayMinutes } = req.body;
  if (status) appointment.status = status;
  if (delayMinutes !== undefined) appointment.delayMinutes = delayMinutes;
  await appointment.save();

  if (delayMinutes > 0) {
    const patient = await User.findById(appointment.patient);
    await emailService.sendAppointmentUpdate(
      patient,
      "Appointment Delay",
      `Your appointment is delayed by ${delayMinutes} minutes.`
    );
    await notificationService.createNotification(
      appointment.patient,
      "Delay Notice",
      `Appointment delayed by ${delayMinutes} min`,
      "warning"
    );
  }

  notificationService.notifyQueueUpdate(appointment.doctor, appointment.date, appointment.time);
  res.json({ success: true, appointment });
});

exports.cancelAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError("Appointment not found", 404));
  const isOwner =
    appointment.patient.toString() === req.user._id.toString() ||
    appointment.doctor.toString() === req.user._id.toString() ||
    req.user.role === "admin";
  if (!isOwner) return next(new AppError("Not authorized", 403));

  appointment.status = "cancelled";
  await appointment.save();
  notificationService.notifySlotUpdate(appointment.doctor, appointment.date);
  res.json({ success: true, appointment });
});

exports.getVideoRoom = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError("Appointment not found", 404));
  const uid = req.user._id.toString();
  if (
    appointment.patient.toString() !== uid &&
    appointment.doctor.toString() !== uid &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("Not authorized", 403));
  }
  res.json({
    success: true,
    roomId: appointment.videoRoomId,
    jitsiUrl: `https://meet.jit.si/${appointment.videoRoomId}`,
  });
});
