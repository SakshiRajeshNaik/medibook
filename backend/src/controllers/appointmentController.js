const Appointment = require("../models/Appointment");
const DoctorProfile = require("../models/DoctorProfile");
const User = require("../models/User");
const SlotLock = require("../models/SlotLock");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const slotService = require("../services/slotService");
const emailService = require("../services/emailService");
const smsService = require("../services/smsService");
const notificationService = require("../services/notificationService");
const crypto = require("crypto");

function generateRoomId() {
  return `medibook-${crypto.randomUUID()}`;
}

async function notifyPatientSlotChange(patient, appointment, message) {
  await notificationService.createNotification(
    patient._id,
    "Appointment time update",
    message,
    "warning",
    { appointmentId: appointment._id }
  );
  await emailService.sendAppointmentUpdate(patient, "Appointment time update", message);
  await smsService.sendSlotUpdateSms(patient.phone, message);
  notificationService.notifySlotTimingUpdate(patient._id.toString(), {
    appointmentId: appointment._id,
    message,
    date: appointment.date,
    time: appointment.time,
    delayMinutes: appointment.delayMinutes,
  });
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

  const profile = await DoctorProfile.findOne({ user: doctorId });
  if (!profile) return next(new AppError("Doctor not found", 404));

  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
  const worksThatDay = profile.schedule?.some((s) => s.dayOfWeek === dayOfWeek);
  if (profile.schedule?.length && !worksThatDay) {
    return next(new AppError("Doctor is not available on this day of the week", 400));
  }

  const bookedCount = await Appointment.countDocuments({
    doctor: doctorId,
    date,
    time,
    status: { $nin: ["cancelled"] },
  });
  const capacity = slotService.getCapacity();
  if (bookedCount >= capacity) {
    const suggestions = await slotService.findSuggestions(doctorId, date, time);
    return res.status(409).json({
      success: false,
      message: `This hour is full (${capacity} patients per slot)`,
      suggestions,
    });
  }

  const duplicate = await Appointment.findOne({
    patient: req.user._id,
    doctor: doctorId,
    date,
    time,
    status: { $nin: ["cancelled"] },
  });
  if (duplicate) {
    return next(new AppError("You already booked this time slot", 409));
  }

  const lock = await SlotLock.findOne({ doctor: doctorId, date, time, expiresAt: { $gt: new Date() } });
  if (lock && lock.lockedBy.toString() !== req.user._id.toString()) {
    return next(new AppError("Slot is locked by another user", 409));
  }

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
  const doctor = await User.findById(doctorId);
  const confirmMsg = `Your appointment with Dr. ${doctor?.name || "your doctor"} is confirmed for ${date} at ${time}. Queue #${appointment.queuePosition}.`;

  await emailService.sendBookingConfirmation(patient, appointment);
  await smsService.sendBookingConfirmationSms(patient.phone, appointment);
  await notificationService.createNotification(
    req.user._id,
    "Booking confirmed",
    confirmMsg,
    "success",
    { appointmentId: appointment._id }
  );
  await notificationService.createNotification(
    doctorId,
    "New Appointment",
    `${patient.name} booked ${date} at ${time}`,
    "appointment"
  );

  notificationService.notifySlotUpdate(doctorId, date);
  notificationService.notifyAppointmentsUpdate(req.user._id);
  notificationService.notifyQueueUpdate(doctorId, date, time);

  res.status(201).json({ success: true, appointment, confirmationMessage: confirmMsg });
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
  const isPatient =
    appointment.patient.toString() === req.user._id.toString() &&
    ["scheduled", "waiting", "in-progress"].includes(appointment.status);

  if (!isDoctor && !isPatient && req.user.role !== "admin") {
    return next(new AppError("Not authorized to update this appointment", 403));
  }

  const { status, delayMinutes, earlyMinutes } = req.body;
  if (status) appointment.status = status;

  let adjustment = 0;
  if (earlyMinutes && earlyMinutes > 0) adjustment = -earlyMinutes;
  else if (delayMinutes && delayMinutes > 0) adjustment = delayMinutes;

  if (adjustment !== 0) {
    appointment.delayMinutes = Math.max(0, (appointment.delayMinutes || 0) + adjustment);
    await appointment.save();

    const slotAppointments = await Appointment.find({
      doctor: appointment.doctor,
      date: appointment.date,
      time: appointment.time,
      status: { $in: ["scheduled", "waiting", "in-progress"] },
    }).populate("patient", "name email phone");

    const timingMsg =
      adjustment > 0
        ? `Your appointment on ${appointment.date} at ${appointment.time} is delayed by ${adjustment} minutes. Updated wait: ~${appointment.delayMinutes} min.`
        : `Your appointment on ${appointment.date} at ${appointment.time} may start up to ${Math.abs(adjustment)} minutes earlier.`;

    for (const apt of slotAppointments) {
      apt.delayMinutes = appointment.delayMinutes;
      if (apt.status === "scheduled") apt.status = "waiting";
      await apt.save();
      if (apt.patient && apt._id.toString() !== appointment._id.toString()) {
        await notifyPatientSlotChange(apt.patient, apt, timingMsg);
      }
    }

    notificationService.notifySlotUpdate(appointment.doctor, appointment.date);
    notificationService.notifyQueueUpdate(appointment.doctor, appointment.date, appointment.time);
  } else {
    await appointment.save();
  }

  res.json({ success: true, appointment });
});

exports.cancelAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id).populate("patient", "name email phone");
  if (!appointment) return next(new AppError("Appointment not found", 404));
  const isOwner =
    appointment.patient._id.toString() === req.user._id.toString() ||
    appointment.doctor.toString() === req.user._id.toString() ||
    req.user.role === "admin";
  if (!isOwner) return next(new AppError("Not authorized", 403));

  appointment.status = "cancelled";
  await appointment.save();

  // If already paid, apply 10% cancellation fee (refund 90%)
  let refundInfo = null;
  if (appointment.paymentStatus === "paid" && appointment.paymentId) {
    const Payment = require("../models/Payment");
    const payment = await Payment.findById(appointment.paymentId);
    if (payment) {
      const cancellationFee = Math.round(payment.amount * 0.10);
      const refundAmount = payment.amount - cancellationFee;
      payment.status = "refunded";
      payment.refundAmount = refundAmount;
      payment.cancellationFee = cancellationFee;
      await payment.save();
      appointment.paymentStatus = "refunded";
      await appointment.save();
      refundInfo = { cancellationFee, refundAmount, originalAmount: payment.amount };

      // Notify patient
      await notificationService.createNotification(
        appointment.patient._id,
        "Appointment Cancelled",
        `Your appointment has been cancelled. A 10% cancellation fee of ₹${cancellationFee} applies. Refund of ₹${refundAmount} will be processed.`,
        "warning",
        { appointmentId: appointment._id }
      );
      // Send email and SMS
      await emailService.sendCancellationConfirmation(appointment.patient, appointment, refundInfo);
      await smsService.sendCancellationSms(appointment.patient.phone, appointment, refundInfo);
    }
  }

  notificationService.notifySlotUpdate(appointment.doctor, appointment.date);
  res.json({ success: true, appointment, refundInfo });
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
