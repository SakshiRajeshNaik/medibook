const Review = require("../models/Review");
const DoctorProfile = require("../models/DoctorProfile");
const Appointment = require("../models/Appointment");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

async function updateDoctorRating(doctorId) {
  const reviews = await Review.find({ doctor: doctorId });
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  await DoctorProfile.findOneAndUpdate(
    { user: doctorId },
    { ratingAverage: Math.round(avg * 10) / 10, ratingCount: count }
  );
}

exports.createReview = catchAsync(async (req, res, next) => {
  const { appointmentId, rating, comment } = req.body;
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return next(new AppError("Appointment not found", 404));
  if (appointment.patient.toString() !== req.user._id.toString()) {
    return next(new AppError("Only patient can review", 403));
  }
  if (appointment.status !== "completed") {
    return next(new AppError("Complete appointment before reviewing", 400));
  }

  const review = await Review.create({
    patient: req.user._id,
    doctor: appointment.doctor,
    appointment: appointmentId,
    rating,
    comment: comment || "",
  });

  await updateDoctorRating(appointment.doctor);
  res.status(201).json({ success: true, review });
});

exports.getDoctorReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ doctor: req.params.doctorId })
    .populate("patient", "name")
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews });
});
