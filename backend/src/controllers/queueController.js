const Appointment = require("../models/Appointment");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const notificationService = require("../services/notificationService");

exports.getQueue = catchAsync(async (req, res) => {
  const { doctorId, date, time } = req.query;
  if (!doctorId || !date || !time) throw new AppError("doctorId, date, time required", 400);

  const queue = await Appointment.find({
    doctor: doctorId,
    date,
    time,
    status: { $in: ["scheduled", "waiting", "in-progress"] },
  })
    .populate("patient", "name phone")
    .sort({ queuePosition: 1 });

  res.json({ success: true, queue });
});

exports.advanceQueue = catchAsync(async (req, res, next) => {
  const { appointmentId } = req.body;
  const current = await Appointment.findById(appointmentId);
  if (!current) return next(new AppError("Appointment not found", 404));
  if (current.doctor.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorized", 403));
  }

  current.status = "in-progress";
  await current.save();

  const waiting = await Appointment.find({
    doctor: current.doctor,
    date: current.date,
    time: current.time,
    status: "scheduled",
    queuePosition: { $gt: current.queuePosition },
  }).sort({ queuePosition: 1 });

  for (const apt of waiting) {
    apt.status = "waiting";
    await apt.save();
    await notificationService.createNotification(
      apt.patient,
      "Queue Update",
      `You are now #${apt.queuePosition} in queue`,
      "queue"
    );
  }

  notificationService.notifyQueueUpdate(current.doctor, current.date, current.time);
  res.json({ success: true, current });
});

exports.completeAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError("Not found", 404));
  if (appointment.doctor.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorized", 403));
  }
  appointment.status = "completed";
  await appointment.save();
  notificationService.notifyQueueUpdate(appointment.doctor, appointment.date, appointment.time);
  res.json({ success: true, appointment });
});
