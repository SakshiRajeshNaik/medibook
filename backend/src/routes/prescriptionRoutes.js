const express = require("express");
const prescriptionController = require("../controllers/prescriptionController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", prescriptionController.getMyPrescriptions);
router.get("/:id/pdf", prescriptionController.downloadPdf);
router.get("/:id", prescriptionController.getPrescription);
router.post("/", restrictTo("doctor"), prescriptionController.createPrescription);

module.exports = router;
