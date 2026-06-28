const express = require("express");
const router = express.Router();
const {
  getMySubscription,
  getAvailablePlans,
  subscribe,
  cancelMySubscription,
} = require("../controllers/subscriptionController");
const { authMiddleware } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/subscriptions/me:
 *   get:
 *     summary: Get current user's active subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active subscription data
 */
router.get("/me", authMiddleware, getMySubscription);

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: Get all available subscription plans
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: List of available plans
 */
router.get("/plans", getAvailablePlans);

/**
 * @swagger
 * /api/subscriptions/subscribe:
 *   post:
 *     summary: Subscribe to a plan
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId: { type: string }
 *     responses:
 *       200:
 *         description: Subscription successful
 */
router.post("/subscribe", authMiddleware, subscribe);

/**
 * @swagger
 * /api/subscriptions/cancel:
 *   post:
 *     summary: Cancel current active subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 */
router.post("/cancel", authMiddleware, cancelMySubscription);

module.exports = router;
