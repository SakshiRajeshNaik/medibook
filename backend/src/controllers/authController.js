const jwt = require("jsonwebtoken");
const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const env = require("../config/env");

const signToken = (id) => jwt.sign({ id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const sendAuthResponse = (user, res, statusCode = 200) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !phone || !password) {
    return next(new AppError("All fields are required", 400));
  }
  const allowedRole = role === "doctor" ? "doctor" : "patient";
  const existing = await User.findOne({ email });
  if (existing) return next(new AppError("Email already registered", 400));

  const user = await User.create({ name, email, phone, password, role: allowedRole });

  if (allowedRole === "doctor") {
    const { specialization, department, qualification, experienceYears, bio, consultationFee } =
      req.body;
    await DoctorProfile.create({
      user: user._id,
      specialization: specialization || "General Medicine",
      department: department || "General",
      qualification: qualification || "",
      experienceYears: experienceYears || 0,
      bio: bio || "",
      consultationFee: consultationFee || env.consultationFee,
      schedule: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 60 },
        { dayOfWeek: 1, startTime: "14:00", endTime: "17:00", slotDurationMinutes: 60 },
        { dayOfWeek: 3, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 60 },
        { dayOfWeek: 5, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 60 },
      ],
    });
  }

  sendAuthResponse(user, res, 201);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError("Email and password required", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Invalid email or password", 401));
  }
  sendAuthResponse(user, res);
});

exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  let profile = null;
  if (user.role === "doctor") {
    profile = await DoctorProfile.findOne({ user: user._id });
  }
  res.json({ success: true, user, profile });
});
