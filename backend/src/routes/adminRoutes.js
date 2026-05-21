const express = require("express");
const adminController = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.get("/analytics", adminController.getAnalytics);
router.get("/users", adminController.getAllUsers);
router.patch("/users/:id", adminController.toggleUserStatus);
router.get("/doctors", adminController.getAllDoctors);
router.get("/doctors/availability", adminController.getDoctorAvailability);
router.post("/doctors", adminController.createDoctor);
router.delete("/doctors/:id", adminController.deleteDoctor);

module.exports = router;
