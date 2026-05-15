const express = require("express");
const router = express.Router();
const {
  createPayment,
  paymentCallback,
} = require("../controllers/paymentController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { createPaymentRules } = require("../validators/paymentValidator");
const validate = require("../middleware/validate");

/**
 * @swagger
 * /api/payments/create:
 *   post:
 *     summary: Create a new payment request (VNPay)
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
router.post("/create", authMiddleware, createPaymentRules, validate, createPayment);

/**
 * @swagger
 * /api/payments/callback:
 *   get:
 *     summary: Return URL callback for VNPay
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Payment processing result
 */
router.get("/callback", paymentCallback);

module.exports = router;
