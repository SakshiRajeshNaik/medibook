const express = require("express");
const appointmentController = require("../controllers/appointmentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/suggestions", appointmentController.getSuggestions);
router.post("/lock", appointmentController.lockSlot);
router.post("/release", appointmentController.releaseSlot);
router.post("/", appointmentController.bookAppointment);
router.get("/", appointmentController.getMyAppointments);
router.patch("/:id/status", appointmentController.updateStatus);
router.delete("/:id", appointmentController.cancelAppointment);
router.get("/:id/video", appointmentController.getVideoRoom);

module.exports = router;
