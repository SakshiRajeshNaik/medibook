const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");
const DoctorProfile = require("../models/DoctorProfile");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const env = require("../config/env");

exports.getAnalytics = catchAsync(async (req, res) => {
  const [totalPatients, totalDoctors, totalAppointments, completedAppointments, revenue] =
    await Promise.all([
      User.countDocuments({ role: "patient" }),
      User.countDocuments({ role: "doctor" }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "completed" }),
      Payment.aggregate([
        { $match: { status: "succeeded" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

  res.json({
    success: true,
    analytics: {
      totalPatients,
      totalDoctors,
      totalAppointments,
      completedAppointments,
      totalRevenue: revenue[0]?.total || 0,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res) => {
  const { role, isActive } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
  res.json({ success: true, users });
});

exports.toggleUserStatus = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  ).select("-password");
  res.json({ success: true, user });
});

exports.getAllDoctors = catchAsync(async (req, res) => {
  const doctors = await DoctorProfile.find()
    .populate("user", "name email phone isActive")
    .sort({ createdAt: -1 });
  res.json({ success: true, doctors });
});

exports.getDoctorAvailability = catchAsync(async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const doctors = await DoctorProfile.find()
    .populate("user", "name email isActive")
    .sort({ specialization: 1 });

  // Find doctors who have an in-progress appointment today
  const busyDoctorIds = await Appointment.distinct("doctor", {
    date: today,
    status: "in-progress",
  });

  const result = doctors.map((d) => ({
    _id: d._id,
    userId: d.user._id,
    name: d.user.name,
    email: d.user.email,
    isActive: d.user.isActive,
    specialization: d.specialization,
    department: d.department,
    consultationFee: d.consultationFee,
    ratingAverage: d.ratingAverage,
    isAvailable: d.isAvailable,
    isBusy: busyDoctorIds.some((id) => id.toString() === d.user._id.toString()),
  }));

  res.json({ success: true, doctors: result });
});

exports.deleteDoctor = catchAsync(async (req, res, next) => {
  const profile = await DoctorProfile.findById(req.params.id);
  if (!profile) return next(new AppError("Doctor profile not found", 404));
  const userId = profile.user;
  await DoctorProfile.findByIdAndDelete(req.params.id);
  await User.findByIdAndDelete(userId);
  res.json({ success: true, message: "Doctor deleted successfully" });
});

exports.createDoctor = catchAsync(async (req, res, next) => {
  const { name, email, phone, password, specialization, department, qualification, experienceYears, bio, consultationFee } = req.body;
  if (!name || !email || !phone || !password || !specialization || !department) {
    return next(new AppError("name, email, phone, password, specialization and department are required", 400));
  }
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) return next(new AppError("Email already registered", 400));

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    phone,
    password,
    role: "doctor",
  });

  const profile = await DoctorProfile.create({
    user: user._id,
    specialization,
    department,
    qualification: qualification || "",
    experienceYears: experienceYears || 0,
    bio: bio || "",
    consultationFee: consultationFee || (env.consultationFee || 500),
    schedule: [
      { dayOfWeek: 1, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 60 },
      { dayOfWeek: 1, startTime: "14:00", endTime: "17:00", slotDurationMinutes: 60 },
      { dayOfWeek: 3, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 60 },
      { dayOfWeek: 5, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 60 },
    ],
  });

  res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role }, profile });
});
