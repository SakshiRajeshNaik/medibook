const express = require("express");
const doctorController = require("../controllers/doctorController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.get("/", doctorController.searchDoctors);

router.patch("/profile/me", protect, restrictTo("doctor"), doctorController.updateProfile);
router.patch("/profile/schedule", protect, restrictTo("doctor"), doctorController.updateSchedule);

router.get("/:id/slots", doctorController.getSlots);
router.get("/:id", doctorController.getDoctor);

module.exports = router;
