const express = require("express");
const authRoutes = require("./authRoutes");
const doctorRoutes = require("./doctorRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const paymentRoutes = require("./paymentRoutes");
const prescriptionRoutes = require("./prescriptionRoutes");
const reviewRoutes = require("./reviewRoutes");
const adminRoutes = require("./adminRoutes");
const notificationRoutes = require("./notificationRoutes");
const queueRoutes = require("./queueRoutes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "medibook-api", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/payments", paymentRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);
router.use("/notifications", notificationRoutes);
router.use("/queue", queueRoutes);

module.exports = router;
