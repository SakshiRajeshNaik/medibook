const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");
const DoctorProfile = require("../models/DoctorProfile");
const catchAsync = require("../utils/catchAsync");

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

  const appointmentsByStatus = await Appointment.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const recentAppointments = await Appointment.find()
    .populate("patient", "name")
    .populate("doctor", "name")
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    analytics: {
      totalPatients,
      totalDoctors,
      totalAppointments,
      completedAppointments,
      totalRevenue: revenue[0]?.total || 0,
      appointmentsByStatus,
      recentAppointments,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
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
  const doctors = await DoctorProfile.find().populate("user", "name email phone isActive");
  res.json({ success: true, doctors });
});
