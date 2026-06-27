const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getVerificationRequests,
  approveVerification,
  rejectVerification,
  completeVerification,
  getAllUsers,
  getUserDetail,
  toggleUserStatus,
  deleteUser,
  getAllLandlords,
  deleteLandlord,
  getAllProperties,
  getAllBookings,
  deleteBooking,
  getAllReviews,
  deleteReview,
  getRevenueStats,
  updatePropertyStatus,
  getTopRooms,
  getChartStats,
  broadcastNotification,
  getAdminNotifications,
} = require("../controllers/adminController");
const { getAllTransactions } = require("../controllers/transactionController");
const {
  updateSubscriptionPlan,
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  resetSubscriptionPlans,
} = require("../controllers/subscriptionController");
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingController");
const {
  authMiddleware,
  requireAnyRole,
} = require("../middleware/authMiddleware");
const { 
  broadcastRules, 
  updatePropertyStatusRules, 
  approveVerificationRules, 
  rejectVerificationRules, 
  completeVerificationRules, 
  planRules, 
  updateSettingsRules 
} = require("../validators/adminValidator");
const validate = require("../middleware/validate");

// All admin routes require admin authentication
router.use(authMiddleware, requireAnyRole(["admin"]));

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get("/stats", getDashboardStats);
/**
 * @swagger
 * /api/admin/stats/revenue:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue statistics data
 */
router.get("/stats/revenue", getRevenueStats);

/**
 * @swagger
 * /api/admin/stats/top-rooms:
 *   get:
 *     summary: Get top performing rooms
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of top performing rooms
 */
router.get("/stats/top-rooms", getTopRooms);

/**
 * @swagger
 * /api/admin/stats/weekly-search:
 *   get:
 *     summary: Get weekly search trends
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly search statistics
 */
router.get("/stats/chart", getChartStats);

// User Management
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get("/users", getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get detailed user info
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 */
router.get("/users/:id", getUserDetail);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Toggle user active status
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User status toggled
 */
router.put("/users/:id/status", toggleUserStatus);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete("/users/:id", deleteUser);

// Landlord Management
/**
 * @swagger
 * /api/admin/landlords:
 *   get:
 *     summary: Get all landlords
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all landlords
 */
router.get("/landlords", getAllLandlords);

/**
 * @swagger
 * /api/admin/landlords/{id}:
 *   delete:
 *     summary: Delete a landlord profile
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Landlord deleted
 */
router.delete("/landlords/:id", deleteLandlord);

// Property Management
/**
 * @swagger
 * /api/admin/properties:
 *   get:
 *     summary: Get all properties (for management)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all properties
 */
router.get("/properties", getAllProperties);

/**
 * @swagger
 * /api/admin/properties/{id}/status:
 *   put:
 *     summary: Update property status
 *     tags: [Admin]
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
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put("/properties/:id/status", updatePropertyStatusRules, validate, updatePropertyStatus);

// Notification Management
/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Get admin notifications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admin-only notifications
 */
router.get("/notifications", getAdminNotifications);

/**
 * @swagger
 * /api/admin/notifications/broadcast:
 *   post:
 *     summary: Send notification to all users
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification broadcasted
 */
router.post("/notifications/broadcast", broadcastRules, validate, broadcastNotification);

// Booking Management
/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: Get all system bookings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of all bookings
 */
router.get("/bookings", getAllBookings);

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking removed
 */
router.delete("/bookings/:id", deleteBooking);

// Review Management
/**
 * @swagger
 * /api/admin/reviews:
 *   get:
 *     summary: Get all system reviews
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all reviews
 */
router.get("/reviews", getAllReviews);

/**
 * @swagger
 * /api/admin/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete("/reviews/:id", deleteReview);

// System Settings Management
/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current system settings
 */
router.get("/settings", getSettings);

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put("/settings", updateSettingsRules, validate, updateSettings);

// Subscription Plan Management
/**
 * @swagger
 * /api/admin/subscriptions/plans:
 *   post:
 *     summary: Create new subscription plan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Plan created
 */
router.post("/subscriptions/plans", planRules, validate, createSubscriptionPlan);

/**
 * @swagger
 * /api/admin/subscriptions/plans/{id}:
 *   put:
 *     summary: Update subscription plan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plan updated
 */
router.put("/subscriptions/plans/:id", planRules, validate, updateSubscriptionPlan);

/**
 * @swagger
 * /api/admin/subscriptions/plans/{id}:
 *   delete:
 *     summary: Delete subscription plan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plan removed
 */
router.delete("/subscriptions/plans/:id", deleteSubscriptionPlan);

/**
 * @swagger
 * /api/admin/subscriptions/reset:
 *   post:
 *     summary: Reset system default subscription plans
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plans reset to defaults
 */
router.post("/subscriptions/reset", resetSubscriptionPlans);
// Admin Transaction Management
/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Get all system transactions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get("/transactions", getAllTransactions);

/**
 * @swagger
 * /api/admin/verification-requests:
 *   get:
 *     summary: Get all verification requests
 *     tags:
 *       - Admin Verification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed]
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: Array of verification requests
 */
router.get("/verification-requests", getVerificationRequests);

/**
 * @swagger
 * /api/admin/verification/{id}/approve:
 *   put:
 *     summary: Approve a verification request
 *     tags:
 *       - Admin Verification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Verification approved
 */
router.put("/verification/:id/approve", approveVerificationRules, validate, approveVerification);

/**
 * @swagger
 * /api/admin/verification/{id}/reject:
 *   put:
 *     summary: Reject a verification request
 *     tags:
 *       - Admin Verification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification rejected
 */
router.put("/verification/:id/reject", rejectVerificationRules, validate, rejectVerification);

const { upload } = require("../middleware/uploadMiddleware");

/**
 * @swagger
 * /api/admin/verification/{id}/complete:
 *   put:
 *     summary: Complete inspection and verify property
 *     tags:
 *       - Admin Verification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification completed and property verified
 */
router.put("/verification/:id/complete", upload.array("media", 5), completeVerificationRules, validate, completeVerification);

module.exports = router;
