const express = require("express");
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/doctor/:doctorId", reviewController.getDoctorReviews);
router.post("/", protect, reviewController.createReview);

module.exports = router;
