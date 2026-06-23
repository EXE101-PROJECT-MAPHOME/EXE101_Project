const Broker = require("../models/Broker");
const Lead = require("../models/Lead");

const getOrCreateBroker = async (user) => {
  let broker = await Broker.findOne({ userId: user._id });
  if (!broker) {
    broker = await Broker.create({
      userId: user._id,
      name: user.fullName || user.username || "Người môi giới",
      email: user.email || "",
      phone: user.phone || "0000000000",
    });
  }
  return broker;
};

// @desc    Get current broker profile
// @route   GET /api/broker/profile
const getBrokerProfile = async (req, res) => {
  try {
    const broker = await getOrCreateBroker(req.user);
    res.status(200).json(broker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current broker's properties
// @route   GET /api/broker/properties
const getBrokerProperties = async (req, res) => {
  try {
    const Property = require("../models/Property");
    const broker = await getOrCreateBroker(req.user);

    const properties = await Property.find({ brokerId: broker._id });
    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current broker's bookings
// @route   GET /api/broker/bookings
const getBrokerBookings = async (req, res) => {
  try {
    const Booking = require("../models/Booking");
    const broker = await getOrCreateBroker(req.user);

    const bookings = await Booking.find({ brokerId: broker._id })
      .populate("propertyId", "name address")
      .populate("userId", "username fullName phone")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current broker's verification requests
// @route   GET /api/broker/verification-requests
const getBrokerVerificationRequests = async (req, res) => {
  try {
    const VerificationRequest = require("../models/VerificationRequest");
    const broker = await getOrCreateBroker(req.user);

    const requests = await VerificationRequest.find({
      requesterId: req.user._id,
    })
      .populate("propertyId", "name address")
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current broker's relevant leads (matching districts)
// @route   GET /api/broker/leads
const getBrokerLeads = async (req, res) => {
  try {
    const Property = require("../models/Property");
    const broker = await getOrCreateBroker(req.user);

    // 1. Lấy tất cả các Quận mà môi giới này quản lý phòng
    const properties = await Property.find({ brokerId: broker._id });
    
    const districts = [
      ...new Set(
        properties
          .map((p) => {
            const parts = p.address.split(",");
            const districtPart = parts.find(
              (part) =>
                part.trim().includes("Quận") || part.trim().includes("Huyện"),
            );
            return districtPart ? districtPart.trim() : null;
          })
          .filter((d) => d !== null),
      ),
    ];

    // 2. Tìm các Lead có yêu cầu trùng với các Quận này
    const leads = await Lead.find({
      "requirements.district": { $in: districts },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      districts,
      count: leads.length,
      leads,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current broker's analytics
// @route   GET /api/broker/analytics
const getBrokerAnalytics = async (req, res) => {
  try {
    const Property = require("../models/Property");
    const Booking = require("../models/Booking");
    const VerificationRequest = require("../models/VerificationRequest");

    const broker = await getOrCreateBroker(req.user);

    const totalProperties = await Property.countDocuments({
      brokerId: broker._id,
    });
    const approvedProperties = await Property.countDocuments({
      brokerId: broker._id,
      status: "approved",
    });
    const pendingProperties = await Property.countDocuments({
      brokerId: broker._id,
      status: "pending",
    });
    const totalBookings = await Booking.countDocuments({
      brokerId: broker._id,
    });
    const totalVerifications = await VerificationRequest.countDocuments({
      requesterId: req.user._id,
    });
    const verifiedProperties = await Property.countDocuments({
      brokerId: broker._id,
      "greenBadge.level": "verified",
    });

    const propertyStats = await Property.aggregate([
      { $match: { brokerId: broker._id } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
          totalFavorites: { $sum: "$favorites" },
        },
      },
    ]);

    // Trend: Bookings per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const bookingTrend = await Booking.aggregate([
      { $match: { brokerId: broker._id, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Trend: 7 Days comparison
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const propertiesThisWeek = await Property.countDocuments({
      brokerId: broker._id,
      createdAt: { $gte: sevenDaysAgo },
    });
    const propertiesLastWeek = await Property.countDocuments({
      brokerId: broker._id,
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
    });
    const totalPostsTrend = propertiesThisWeek - propertiesLastWeek;

    res.status(200).json({
      totalProperties,
      approvedProperties,
      pendingProperties,
      totalBookings,
      totalVerifications,
      verifiedProperties,
      totalViews: propertyStats[0]?.totalViews || 0,
      totalFavorites: propertyStats[0]?.totalFavorites || 0,
      bookingTrend,
      trends: {
        totalPostsTrend,
        approvedPostsTrend: 0,
        pendingPostsTrend: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBrokerProfile,
  getBrokerProperties,
  getBrokerBookings,
  getBrokerVerificationRequests,
  getBrokerLeads,
  getBrokerAnalytics,
};
