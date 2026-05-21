const express = require("express");
const prescriptionController = require("../controllers/prescriptionController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

// PDF download — auth handled inside the controller (supports ?token= query param)
router.get("/:id/pdf", prescriptionController.downloadPdf);

// All other routes require normal JWT auth
router.use(protect);

router.get("/", prescriptionController.getMyPrescriptions);
router.get("/:id", prescriptionController.getPrescription);
router.post("/", restrictTo("doctor"), prescriptionController.createPrescription);

module.exports = router;
