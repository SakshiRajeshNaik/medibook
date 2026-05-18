const Stripe = require("stripe");
const env = require("../config/env");
const Payment = require("../models/Payment");
const AppError = require("../utils/AppError");

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

exports.createCheckoutSession = async ({ userId, appointmentId, amount, successUrl, cancelUrl }) => {
  const payment = await Payment.create({
    user: userId,
    appointment: appointmentId,
    amount,
    status: "pending",
    mockPayment: !stripe,
  });

  if (!stripe) {
    return { paymentId: payment._id, mock: true, checkoutUrl: null };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: { name: "Consultation Fee" },
          unit_amount: amount * 100,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { paymentId: payment._id.toString(), appointmentId: appointmentId.toString() },
  });

  payment.stripeSessionId = session.id;
  await payment.save();

  return { paymentId: payment._id, checkoutUrl: session.url, mock: false };
};

exports.confirmMockPayment = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new AppError("Payment not found", 404);
  payment.status = "succeeded";
  payment.mockPayment = true;
  await payment.save();
  return payment;
};

exports.handleStripeWebhook = async (rawBody, signature) => {
  if (!stripe || !env.stripeWebhookSecret) return null;
  const event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const payment = await Payment.findById(session.metadata.paymentId);
    if (payment) {
      payment.status = "succeeded";
      payment.stripePaymentIntentId = session.payment_intent;
      await payment.save();
    }
    return payment;
  }
  return null;
};
