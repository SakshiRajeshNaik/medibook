const express = require("express");
const queueController = require("../controllers/queueController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", queueController.getQueue);
router.post("/advance", restrictTo("doctor"), queueController.advanceQueue);
router.post("/:id/complete", restrictTo("doctor"), queueController.completeAppointment);

module.exports = router;
