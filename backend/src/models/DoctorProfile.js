const mongoose = require("mongoose");

const scheduleSlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDurationMinutes: { type: Number, default: 60 },
  },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialization: { type: String, required: true },
    department: { type: String, required: true },
    qualification: { type: String, default: "" },
    experienceYears: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    consultationFee: { type: Number, default: 500 },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    schedule: [scheduleSlotSchema],
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorProfileSchema.index({ specialization: 1, department: 1 });

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
