const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const slotService = require("../services/slotService");

exports.searchDoctors = catchAsync(async (req, res) => {
  const { specialization, department, minRating, search } = req.query;
  const filter = { isAvailable: true };
  if (specialization) filter.specialization = new RegExp(specialization, "i");
  if (department) filter.department = new RegExp(department, "i");
  if (minRating) filter.ratingAverage = { $gte: parseFloat(minRating) };

  let profiles = await DoctorProfile.find(filter).populate("user", "name email phone avatar");

  if (search) {
    const re = new RegExp(search, "i");
    profiles = profiles.filter(
      (p) => re.test(p.user.name) || re.test(p.specialization) || re.test(p.department)
    );
  }

  res.json({ success: true, count: profiles.length, doctors: profiles });
});

exports.getDoctor = catchAsync(async (req, res, next) => {
  const profile = await DoctorProfile.findOne({ user: req.params.id }).populate(
    "user",
    "name email phone avatar"
  );
  if (!profile) return next(new AppError("Doctor not found", 404));
  res.json({ success: true, doctor: profile });
});

exports.getSlots = catchAsync(async (req, res) => {
  const { date } = req.query;
  if (!date) throw new AppError("Date is required", 400);
  const slots = await slotService.getAvailableSlots(req.params.id, date);
  res.json({ success: true, slots });
});

exports.updateSchedule = catchAsync(async (req, res, next) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile) return next(new AppError("Doctor profile not found", 404));
  profile.schedule = req.body.schedule || profile.schedule;
  if (req.body.isAvailable !== undefined) profile.isAvailable = req.body.isAvailable;
  await profile.save();
  res.json({ success: true, profile });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile) return next(new AppError("Doctor profile not found", 404));
  const fields = [
    "specialization",
    "department",
    "qualification",
    "experienceYears",
    "bio",
    "consultationFee",
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) profile[f] = req.body[f];
  });
  await profile.save();
  res.json({ success: true, profile });
});
