const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const {
  authMiddleware,
  requireAnyRole,
} = require("../middleware/authMiddleware");
const { contactRules } = require("../validators/contactValidator");
const validate = require("../middleware/validate");

// Public route to submit
/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a contact/support message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               subject: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Message submitted
 */
router.post("/", contactRules, validate, contactController.submitContact);

/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: Get all contact messages (Admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get(
  "/",
  authMiddleware,
  requireAnyRole(["admin"]),
  contactController.getMessages,
);

/**
 * @swagger
 * /api/contact/{id}:
 *   delete:
 *     summary: Delete a contact message (Admin only)
 *     tags: [Contact]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Message deleted
 */
router.delete(
  "/:id",
  authMiddleware,
  requireAnyRole(["admin"]),
  contactController.deleteMessage,
);

/**
 * @swagger
 * /api/contact/{id}/reply:
 *   put:
 *     summary: Reply to a contact message (Admin only)
 *     tags: [Contact]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [replyMessage]
 *             properties:
 *               replyMessage: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reply sent
 */
router.put(
  "/:id/reply",
  authMiddleware,
  requireAnyRole(["admin"]),
  contactController.replyContact,
);

module.exports = router;
