const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const env = require("../config/env");

exports.protect = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Login required", 401));
  }
  const decoded = jwt.verify(header.slice(7), env.jwtSecret);
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return next(new AppError("User no longer exists", 401));
  }
  req.user = user;
  next();
});

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError("You do not have permission", 403));
  }
  next();
};
