const express = require("express");
const router = express.Router();
const {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  cancelBooking,
  updateBookingStatus,
} = require("../controllers/bookingController");
const { createBookingRules, updateBookingStatusRules } = require("../validators/bookingValidator");
const validate = require("../middleware/validate");

const {
  authMiddleware,
  requireAnyRole,
} = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings (Admin/Landlord only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *   post:
 *     summary: Create a new booking request
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyId, bookingDate, bookingTime]
 *     responses:
 *       201:
 *         description: Booking request created
 */
router
  .route("/")
  .get(authMiddleware, requireAnyRole(["admin", "landlord", "broker"]), getBookings)
  .post(authMiddleware, createBookingRules, validate, createBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking details by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking details
 *   put:
 *     summary: Update booking details
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking updated
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking removed
 */
router
  .route("/:id")
  .get(authMiddleware, getBookingById)
  .put(authMiddleware, requireAnyRole(["admin", "landlord", "broker"]), updateBooking)
  .delete(authMiddleware, requireAnyRole(["admin", "landlord", "broker"]), deleteBooking);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: User can cancel their own pending booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.put("/:id/cancel", authMiddleware, requireAnyRole(["user"]), cancelBooking);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   put:
 *     summary: Landlord or Admin can update booking status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put("/:id/status", authMiddleware, requireAnyRole(["admin", "landlord", "broker"]), updateBookingStatusRules, validate, updateBookingStatus);

/**
 * @swagger
 * /api/bookings/{id}/reschedule:
 *   put:
 *     summary: Landlord or Broker reschedules a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id/reschedule", authMiddleware, requireAnyRole(["admin", "landlord", "broker"]), require("../controllers/bookingController").rescheduleBooking);

/**
 * @swagger
 * /api/bookings/{id}/tenant-response:
 *   put:
 *     summary: Tenant responds to a rescheduled booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id/tenant-response", authMiddleware, requireAnyRole(["user"]), require("../controllers/bookingController").tenantResponseBooking);

module.exports = router;
