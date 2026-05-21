const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const pdfService = require("../services/pdfService");
const notificationService = require("../services/notificationService");

exports.createPrescription = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.body.appointmentId);
  if (!appointment) return next(new AppError("Appointment not found", 404));
  if (appointment.doctor.toString() !== req.user._id.toString()) {
    return next(new AppError("Only the assigned doctor can prescribe", 403));
  }

  const prescription = await Prescription.create({
    appointment: appointment._id,
    doctor: req.user._id,
    patient: appointment.patient,
    diagnosis: req.body.diagnosis,
    medicines: req.body.medicines || [],
    notes: req.body.notes || "",
  });

  await notificationService.createNotification(
    appointment.patient,
    "New Prescription",
    "Your doctor has issued a prescription",
    "prescription"
  );

  res.status(201).json({ success: true, prescription });
});

exports.getPrescription = catchAsync(async (req, res, next) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate("patient", "name email")
    .populate("doctor", "name email");
  if (!prescription) return next(new AppError("Not found", 404));

  const uid = req.user._id.toString();
  if (
    prescription.patient._id.toString() !== uid &&
    prescription.doctor._id.toString() !== uid &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("Not authorized", 403));
  }
  res.json({ success: true, prescription });
});

exports.downloadPdf = catchAsync(async (req, res, next) => {
  // Support token via query param for direct browser <a href> links
  const jwt = require("jsonwebtoken");
  const env = require("../config/env");

  let userId = req.user?._id;
  if (!userId) {
    const token = req.query.token;
    if (!token) return next(new AppError("Authentication required", 401));
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      userId = decoded.id;
    } catch {
      return next(new AppError("Invalid or expired token", 401));
    }
  }

  const prescription = await Prescription.findById(req.params.id)
    .populate("patient", "name email phone")
    .populate("doctor", "name email");
  if (!prescription) return next(new AppError("Not found", 404));

  const uid = userId.toString();
  if (
    prescription.patient._id.toString() !== uid &&
    prescription.doctor._id.toString() !== uid &&
    req.user?.role !== "admin"
  ) {
    return next(new AppError("Not authorized", 403));
  }

  const pdf = await pdfService.generatePrescriptionPdf(prescription, prescription.patient, prescription.doctor);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=prescription-${prescription._id}.pdf`);
  res.send(pdf);
});

exports.getMyPrescriptions = catchAsync(async (req, res) => {
  const filter =
    req.user.role === "doctor" ? { doctor: req.user._id } : { patient: req.user._id };
  const prescriptions = await Prescription.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, prescriptions });
});
