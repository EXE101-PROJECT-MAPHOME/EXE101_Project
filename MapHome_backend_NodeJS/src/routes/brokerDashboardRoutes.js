const express = require("express");
const router = express.Router();
const {
  getBrokerProfile,
  getBrokerProperties,
  getBrokerVerificationRequests,
  getBrokerBookings,
  getBrokerAnalytics,
  getBrokerLeads,
} = require("../controllers/brokerController");
const {
  authMiddleware,
  requireAnyRole,
} = require("../middleware/authMiddleware");

// Yêu cầu phân quyền môi giới cho toàn bộ router này
router.use(authMiddleware, requireAnyRole(["broker"]));

router.get("/profile", getBrokerProfile);
router.get("/properties", getBrokerProperties);
router.get("/verification-requests", getBrokerVerificationRequests);
router.get("/bookings", getBrokerBookings);
router.get("/analytics", getBrokerAnalytics);
router.get("/leads", getBrokerLeads);

module.exports = router;
