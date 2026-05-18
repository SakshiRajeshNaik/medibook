const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "DoctorProfile", required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["scheduled", "waiting", "in-progress", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    queuePosition: { type: Number, default: 1 },
    delayMinutes: { type: Number, default: 0 },
    videoRoomId: { type: String, default: "" },
    paymentStatus: { type: String, enum: ["pending", "paid", "refunded"], default: "pending" },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    amount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1, time: 1 });
appointmentSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
