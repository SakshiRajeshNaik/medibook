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
  // Public registration is for patients only; doctors are created by admin
  const allowedRole = "patient";
  const existing = await User.findOne({ email });
  if (existing) return next(new AppError("Email already registered", 400));

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    phone,
    password,
    role: allowedRole,
  });

  res.status(201).json({
    success: true,
    message: "Registration successful. Please sign in with your email and password.",
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError("Email and password required", 400));

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user) {
    return next(new AppError("User not found. Please register first.", 404));
  }
  if (!(await user.comparePassword(password))) {
    return next(new AppError("Incorrect password", 401));
  }
  if (!user.isActive) {
    return next(new AppError("Account is deactivated", 403));
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
