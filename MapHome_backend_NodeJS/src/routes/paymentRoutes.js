const express = require("express");
const router = express.Router();
const {
  createPayment,
  paymentCallback,
  payosWebhook,
  getInspectionFee,
} = require("../controllers/paymentController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { createPaymentRules } = require("../validators/paymentValidator");
const validate = require("../middleware/validate");

/**
 * @swagger
 * /api/payments/create:
 *   post:
 *     summary: Create a new payment request (PayOS)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, planId]
 *             properties:
 *               amount: { type: number, example: 50000 }
 *               planId: { type: string, example: "standard" }
 *               description: { type: string, example: "Thanh toán gói Silver" }
 *               returnUrl: { type: string }
 *     responses:
 *       200:
 *         description: Redirect URL for payment
 */
/**
 * @swagger
 * /api/payments/inspection-fee:
 *   get:
 *     summary: Get the inspection/verification fee for tenants
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Inspection fee amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fee: { type: number, example: 119000 }
 *                 currency: { type: string, example: "VND" }
 */
router.get("/inspection-fee", getInspectionFee);

router.post("/create", authMiddleware, createPaymentRules, validate, createPayment);

/**
 * @swagger
 * /api/payments/callback:
 *   get:
 *     summary: Return URL callback for PayOS
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Payment processing result
 */
router.get("/callback", paymentCallback);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: PayOS Webhook endpoint
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook received successfully
 */
router.post("/webhook", payosWebhook);

module.exports = router;
