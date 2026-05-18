const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "inr" },
    status: { type: String, enum: ["pending", "succeeded", "failed", "refunded"], default: "pending" },
    stripeSessionId: { type: String, default: "" },
    stripePaymentIntentId: { type: String, default: "" },
    mockPayment: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
