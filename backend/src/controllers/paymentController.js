const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const paymentService = require("../services/paymentService");
const notificationService = require("../services/notificationService");
const env = require("../config/env");

exports.createCheckout = catchAsync(async (req, res, next) => {
  const { appointmentId } = req.body;
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return next(new AppError("Appointment not found", 404));
  if (appointment.patient.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorized", 403));
  }

  const baseUrl = env.clientUrl;
  const result = await paymentService.createCheckoutSession({
    userId: req.user._id,
    appointmentId: appointment._id,
    amount: appointment.amount,
    successUrl: `${baseUrl}/payments/success?appointmentId=${appointment._id}`,
    cancelUrl: `${baseUrl}/payments/cancel?appointmentId=${appointment._id}`,
  });

  appointment.paymentId = result.paymentId;
  await appointment.save();

  res.json({ success: true, ...result, amount: appointment.amount });
});

exports.confirmMockPayment = catchAsync(async (req, res, next) => {
  const { paymentId, appointmentId } = req.body;
  const payment = await paymentService.confirmMockPayment(paymentId);
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return next(new AppError("Appointment not found", 404));

  appointment.paymentStatus = "paid";
  appointment.paymentId = payment._id;
  await appointment.save();

  await notificationService.createNotification(
    req.user._id,
    "Payment Successful",
    `Payment of ₹${payment.amount} confirmed`,
    "success"
  );

  res.json({ success: true, payment, appointment });
});

exports.getPaymentHistory = catchAsync(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, payments });
});

exports.stripeWebhook = catchAsync(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const payment = await paymentService.handleStripeWebhook(req.body, sig);
  if (payment?.appointment) {
    await Appointment.findByIdAndUpdate(payment.appointment, {
      paymentStatus: "paid",
      paymentId: payment._id,
    });
  }
  res.json({ received: true });
});
