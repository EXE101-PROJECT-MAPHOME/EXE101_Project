const express = require("express");
const router = express.Router();
const { createReport, getReports, updateReportStatus } = require("../controllers/reportController");
const { authMiddleware, requireAnyRole } = require("../middleware/authMiddleware");
const { createReportRules, updateReportRules } = require("../validators/reportValidator");
const validate = require("../middleware/validate");

// Create report (Any logged in user)
/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create a new abuse/issue report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyId, reason]
 *             properties:
 *               propertyId: { type: string, description: "ID of property being reported" }
 *               reason: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Report submitted
 */
router.post("/", authMiddleware, createReportRules, validate, createReport);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all reports (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all reports
 */
router.get("/", authMiddleware, requireAnyRole(["admin"]), getReports);

/**
 * @swagger
 * /api/reports/{id}:
 *   put:
 *     summary: Update report status (Admin only)
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [pending, resolved, dismissed] }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report status updated
 */
router.put("/:id", authMiddleware, requireAnyRole(["admin"]), updateReportRules, validate, updateReportStatus);

module.exports = router;
