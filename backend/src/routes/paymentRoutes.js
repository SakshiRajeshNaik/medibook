const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/webhook", paymentController.stripeWebhook);

router.use(protect);
router.post("/checkout", paymentController.createCheckout);
router.post("/mock-confirm", paymentController.confirmMockPayment);
router.get("/history", paymentController.getPaymentHistory);

module.exports = router;
