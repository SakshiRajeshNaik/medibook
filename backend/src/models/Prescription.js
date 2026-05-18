const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    diagnosis: { type: String, default: "" },
    medicines: [medicineSchema],
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
