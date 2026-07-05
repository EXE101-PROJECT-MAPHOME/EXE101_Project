const Property = require("../models/Property");
const User = require("../models/User");
const Landlord = require("../models/Landlord");
const VerificationRequest = require("../models/VerificationRequest");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Transaction = require("../models/Transaction");
const Subscription = require("../models/Subscription");
const { uploadToCloudinary } = require("../services/cloudinaryService");


const getDashboardStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = {};

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const [
      totalProperties,
      totalUsers,
      totalLandlords,
      totalVerifications,
      totalBookings,
      pendingVerifications,
      completedVerifications,
      pendingBookings,
      distinctDistricts,
      reviews,
      totalViewsData,
      newUsers,
      totalTransactions,
      totalRevenueData,
    ] = await Promise.all([
      Property.countDocuments({}), // Global total
      User.countDocuments({}),     // Global total
      Landlord.countDocuments({}), // Global total
      VerificationRequest.countDocuments(query),
      Booking.countDocuments(query),
      VerificationRequest.countDocuments({ ...query, status: "pending" }),
      VerificationRequest.countDocuments({ ...query, status: "completed" }),
      Booking.countDocuments({ ...query, status: "pending" }),
      Property.distinct("district"),
      Review.find().select("rating"),
      Property.aggregate([
        { $group: { _id: null, total: { $sum: "$views" } } },
      ]),
      User.countDocuments(query),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: { status: "success", ...query } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalViews =
      totalViewsData.length > 0 ? totalViewsData[0].total : 0;

    // Calculate satisfaction rate from average review rating
    const satisfactionRate =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) /
              reviews.length /
              5) *
              100,
          )
        : 98; // Default 98% if no reviews

    const averageRating =
      reviews.length > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : 4.9;

    const totalRevenue =
      totalRevenueData && totalRevenueData.length > 0 ? totalRevenueData[0].total : 0;

    res.status(200).json({
      totalProperties,
      totalUsers,
      totalLandlords,
      totalVerifications,
      totalBookings,
      pendingVerifications,
      completedVerifications,
      pendingBookings,
      uniqueDistricts: distinctDistricts.filter((d) => d).length, // Count unique districts, exclude null
      satisfactionRate,
      averageRating,
      totalViews,
      newUsers,
      totalTransactions,
      totalRevenue,
      totalReviews: reviews.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all verification requests for admin
// @route   GET /api/admin/verification-requests
const getVerificationRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const requests = await VerificationRequest.find(query)
      .populate("landlordId", "name phone email")
      .populate("propertyId", "name address")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve verification request
// @route   PUT /api/admin/verification/:id/approve
const approveVerification = async (req, res) => {
  try {
    const { scheduledDate } = req.body;

    const verification = await VerificationRequest.findByIdAndUpdate(
      req.params.id,
      { status: "approved", scheduledDate },
      { new: true },
    );

    if (!verification) {
      return res
        .status(404)
        .json({ message: "Verification request not found" });
    }

    res.status(200).json({
      message: "Verification approved",
      verification,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject verification request
// @route   PUT /api/admin/verification/:id/reject
const rejectVerification = async (req, res) => {
  try {
    const { reason } = req.body;

    const verification = await VerificationRequest.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason: reason },
      { new: true },
    );

    if (!verification) {
      return res
        .status(404)
        .json({ message: "Verification request not found" });
    }

    res.status(200).json({
      message: "Verification rejected",
      verification,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeVerification = async (req, res) => {
  try {
    const { badgeAwarded, inspectorNotes, inspectionChecklist } = req.body;

    // Process files if any
    let uploadedMediaUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, "maphome/verification_media");
        uploadedMediaUrls.push(result.secure_url);
      }
    }

    let parsedChecklist = {};
    if (inspectionChecklist) {
      try {
        parsedChecklist = typeof inspectionChecklist === "string" ? JSON.parse(inspectionChecklist) : inspectionChecklist;
      } catch (e) {
        console.error("Parse checklist error", e);
      }
    }

    const updateData = {
      status: badgeAwarded === "none" ? "rejected" : "completed",
      completedAt: new Date(),
      inspectorNotes: inspectorNotes || "",
    };
    
    if (uploadedMediaUrls.length > 0) {
      updateData.inspectionMedia = uploadedMediaUrls;
    }
    if (Object.keys(parsedChecklist).length > 0) {
      updateData.inspectionChecklist = parsedChecklist;
    }

    const verification = await VerificationRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    if (!verification) {
      return res
        .status(404)
        .json({ message: "Verification request not found" });
    }

    // Update property with verified badge if awarded
    if (badgeAwarded === "verified") {
      await Property.findByIdAndUpdate(verification.propertyId, {
        greenBadge: {
          level: "verified",
          awardedAt: new Date(),
          awardedBy: "admin", // Or req.user.id if available
          inspectionNotes: inspectorNotes || "",
          inspectionMedia: uploadedMediaUrls,
          inspectionChecklist: parsedChecklist,
        },
      });
    }

    res.status(200).json({
      message: "Verification completed and property verified",
      verification,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user status (active/blocked)
// @route   PUT /api/admin/users/:id/status
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === "blocked" ? "active" : "blocked";
    await user.save();

    res
      .status(200)
      .json({ message: `User status changed to ${user.status}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user detail for admin
// @route   GET /api/admin/users/:id
const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Lấy subscription thực tế
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: "active",
    }).populate({ path: "planId", select: "planId name" });

    let subscriptionTier = "Free";
    let verificationLevel = 0;
    let verificationLevelLabel = "Chưa xác thực";

    if (subscription && subscription.status === "active") {
      subscriptionTier = subscription.planName || "Free";

      const planSlug = (
        subscription.planId?.planId ||
        subscription.planName ||
        ""
      ).toLowerCase();

      if (planSlug.includes("pro")) {
        verificationLevel = 3;
        verificationLevelLabel = "Cấp 3";
      } else if (planSlug.includes("standard")) {
        verificationLevel = 2;
        verificationLevelLabel = "Cấp 2";
      } else if (planSlug.includes("basic")) {
        verificationLevel = 1;
        verificationLevelLabel = "Cấp 1";
      } else {
        // Fallback cho các gói khác hoặc theo user.verificationLevel
        verificationLevel = user.verificationLevel || 1;
        verificationLevelLabel = `Cấp ${verificationLevel}`;
      }
    }

    const userObj = user.toObject();
    userObj.verificationLevel = verificationLevel;
    userObj.verificationLevelLabel = verificationLevelLabel;
    userObj.subscriptionTier = subscriptionTier;
    userObj.subscriptionPlanId = subscription?.planId?.planId || null;
    userObj.subscriptionExpiry = subscription?.expiryDate || null;

    let properties = [];
    if (user.role === "landlord") {
      properties = await Property.find({ landlordId: user._id });
    }

    // Fetch bookings related to this user (either as tenant or landlord)
    const bookings = await Booking.find({
      $or: [{ userId: user._id }, { landlordId: user._id }],
    })
      .populate("propertyId", "name address")
      .populate("userId", "username fullName email")
      .populate("landlordId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      user: userObj,
      properties,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all landlords
// @route   GET /api/admin/landlords
const getAllLandlords = async (req, res) => {
  try {
    const landlords = await Landlord.find().sort({ createdAt: -1 });
    res.status(200).json(landlords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete landlord
// @route   DELETE /api/admin/landlords/:id
const deleteLandlord = async (req, res) => {
  try {
    const landlord = await Landlord.findByIdAndDelete(req.params.id);
    if (!landlord)
      return res.status(404).json({ message: "Landlord not found" });
    res.status(200).json({ message: "Landlord removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all properties for admin
// @route   GET /api/admin/properties
const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate("landlordId", "name phone")
      .sort({ createdAt: -1 });
    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("propertyId", "name address")
      .populate("userId", "username fullName")
      .populate("landlordId", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a booking (admin)
// @route   DELETE /api/admin/bookings/:id
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json({ message: "Booking removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews
// @route   GET /api/admin/reviews
const getAllReviews = async (req, res) => {
  try {
    const Review = require("../models/Review");
    const reviews = await Review.find()
      .populate("propertyId", "name")
      .populate("userId", "username")
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a review (admin)
// @route   DELETE /api/admin/reviews/:id
const deleteReview = async (req, res) => {
  try {
    const Review = require("../models/Review");
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.status(200).json({ message: "Review removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get platform revenue stats
// @route   GET /api/admin/revenue-stats
const getRevenueStats = async (req, res) => {
  try {
    const { month, year, range } = req.query;
    const matchQuery = { status: "completed" };
    const today = new Date();

    if (range) {
      if (range === "day") {
         const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
         matchQuery.completedAt = { $gte: start };
      } else if (range === "week") {
         const start = new Date(today);
         start.setDate(today.getDate() - 6);
         start.setHours(0,0,0,0);
         matchQuery.completedAt = { $gte: start };
      } else if (range === "month") {
         const start = new Date(today);
         start.setDate(today.getDate() - 29);
         start.setHours(0,0,0,0);
         matchQuery.completedAt = { $gte: start };
      } else if (range === "quarter") {
         const start = new Date(today);
         start.setMonth(today.getMonth() - 2);
         start.setDate(1);
         start.setHours(0,0,0,0);
         matchQuery.completedAt = { $gte: start };
      } else if (range === "year") {
         const start = new Date(today.getFullYear(), 0, 1);
         matchQuery.completedAt = { $gte: start };
      }
    } else if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      matchQuery.completedAt = { $gte: startDate, $lte: endDate };
    }


    const Transaction = require("../models/Transaction");

    const completedVerifications = await VerificationRequest.find(matchQuery);

    const transMatch = { status: "success" };
    if (matchQuery.completedAt) {
      transMatch.createdAt = matchQuery.completedAt;
    }

    const trans = await Transaction.aggregate([
      { $match: transMatch },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalRevenue = trans.length > 0 ? trans[0].total : 0;

    // Group by packageType
    const revenueByPackage = completedVerifications.reduce((acc, v) => {
      const type = v.packageType || "other";
      if (!acc[type]) acc[type] = { amount: 0, count: 0 };
      acc[type].amount += v.amount || 0;
      acc[type].count += 1;
      return acc;
    }, {});

    // Last 10 transactions
    const latestTransactions = await VerificationRequest.find(matchQuery)
      .sort({ completedAt: -1 })
      .limit(10)
      .populate("landlordId", "name");

    // Last 6 months trends
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyTrends = await Transaction.aggregate([
      {
        $match: {
          status: "success",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Calculate revenue change percentage
    let revenueChange = "+0.0%";
    if (monthlyTrends.length >= 2) {
      const currentMonth = monthlyTrends[monthlyTrends.length - 1].revenue;
      const prevMonth = monthlyTrends[monthlyTrends.length - 2].revenue;
      if (prevMonth > 0) {
        const change = ((currentMonth - prevMonth) / prevMonth) * 100;
        revenueChange = (change >= 0 ? "+" : "") + change.toFixed(1) + "%";
      } else if (currentMonth > 0) {
        revenueChange = "+100%";
      }
    }

    // Pending transactions count
    const pendingCount = await VerificationRequest.countDocuments({
      status: "pending",
    });

    // Simulate "Chi phí Maps API" based on total properties
    const totalProperties = await Property.countDocuments();
    const mapsApiCost = totalProperties * 5000; // 5k VND/property as a simulation factor

    res.status(200).json({
      totalRevenue,
      revenueByPackage,
      latestTransactions,
      monthlyTrends,
      revenueChange,
      pendingCount,
      mapsApiCost,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update property status (Approved/Rejected/Reported)
// @route   PUT /api/admin/properties/:id/status
const updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "rejected", "reported"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updates = { status };
    
    // When status is approved, set/reset expiry date to 30 days from now
    if (status === "approved") {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      updates.expiryDate = expiryDate;
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true },
    );

    if (!property)
      return res.status(404).json({ message: "Property not found" });

    res
      .status(200)
      .json({ message: `Property status updated to ${status}`, property });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top rooms by views
// @route   GET /api/admin/stats/top-rooms
const getTopRooms = async (req, res) => {
  try {
    const topProperties = await Property.find()
      .sort({ views: -1 })
      .limit(10)
      .populate("landlordId", "name");
    res.status(200).json(topProperties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dynamic chart stats (Revenue, Transactions, Users)
// @route   GET /api/admin/stats/chart
const getChartStats = async (req, res) => {
  try {
    const Transaction = require("../models/Transaction");
    const User = require("../models/User");
    const { range = "week" } = req.query;

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const stats = [];
    let startDate;

    const formatLocalDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    if (range === "day") {
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      for (let i = 0; i < 24; i++) {
        const hourStr = `${String(i).padStart(2, "0")}:00`;
        stats.push({ label: hourStr, revenue: 0, transactions: 0, users: 0, matchKey: i });
      }
    } else if (range === "week") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        stats.push({ label: days[d.getDay()], revenue: 0, transactions: 0, users: 0, matchKey: formatLocalDate(d) });
      }
    } else if (range === "month") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      for (let i = 0; i < 30; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        stats.push({ label: `${d.getDate()}/${d.getMonth()+1}`, revenue: 0, transactions: 0, users: 0, matchKey: formatLocalDate(d) });
      }
    } else if (range === "year") {
      startDate = new Date(today.getFullYear(), 0, 1);
      for (let i = 0; i < 12; i++) {
        stats.push({ label: `Th${i + 1}`, revenue: 0, transactions: 0, users: 0, matchKey: i });
      }
    }

    const [transactions, users] = await Promise.all([
      Transaction.find({ createdAt: { $gte: startDate, $lte: today } }),
      User.find({ createdAt: { $gte: startDate, $lte: today } })
    ]);

    transactions.forEach(t => {
      const d = new Date(t.createdAt);
      let matchKey = range === "day" ? d.getHours() : range === "year" ? d.getMonth() : formatLocalDate(d);

      const statObj = stats.find(s => s.matchKey === matchKey);
      if (statObj) {
        if (t.status === "success") {
          statObj.revenue += t.amount || 0;
        }
        statObj.transactions += 1;
      }
    });

    users.forEach(u => {
      const d = new Date(u.createdAt);
      let matchKey = range === "day" ? d.getHours() : range === "year" ? d.getMonth() : formatLocalDate(d);

      const statObj = stats.find(s => s.matchKey === matchKey);
      if (statObj) {
        statObj.users += 1;
      }
    });

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Broadcast notification to multiple users
// @route   POST /api/admin/notifications/broadcast
const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type, targetRole, link } = req.body;
    if (!title || !message) {
      return res
        .status(400)
        .json({ message: "Title and message are required" });
    }

    const Notification = require("../models/Notification");

    // Filter users based on targetRole
    const userQuery = {};
    if (targetRole && targetRole !== "all") {
      userQuery.role = targetRole;
    }

    const users = await User.find(userQuery, "_id");

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found for this target role" });
    }

    const notifications = users.map((user) => ({
      userId: user._id,
      title,
      message,
      type: type || "info",
      link: link || "",
      isRead: false,
    }));

    await Notification.insertMany(notifications);

    res.status(200).json({
      message: `Đã gửi thông báo thành công đến ${users.length} người dùng (${targetRole || "tất cả"})`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminNotifications = async (req, res) => {
  try {
    const Blog = require("../models/Blog");
    // Get latest system events across models
    const [newUsers, newProperties, newVerifications, newBookings, newBlogs] =
      await Promise.all([
        User.find().sort({ createdAt: -1 }).limit(5),
        Property.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("landlordId", "name"),
        VerificationRequest.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("landlordId", "name"),
        Booking.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("userId", "fullName"),
        Blog.find({ status: "pending" })
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    // Format all events into a unified notification structure
    const notifications = [
      ...newUsers.map((u) => ({
        id: `user-${u._id}`,
        title: "Người dùng mới",
        message: `Tài khoản '${u.username}' vừa mới đăng ký.`,
        time: u.createdAt,
        type: "user",
        icon: "👤",
      })),
      ...newProperties.map((p) => ({
        id: `property-${p._id}`,
        title: "Tin đăng mới",
        message: `Căn hộ '${p.name}' vừa được đăng bởi ${p.landlordId?.name || "Ẩn danh"}.`,
        time: p.createdAt,
        type: "property",
        icon: "🏠",
      })),
      ...newVerifications.map((v) => ({
        id: v._id,
        title: "Yêu cầu Tích Xanh",
        message: `${v.landlordId?.name || "Chủ trọ"} yêu cầu kiểm tra cho '${v.propertyName}'.`,
        time: v.createdAt,
        type: "verification",
        icon: "✅",
      })),
      ...newBookings.map((b) => ({
        id: b._id,
        title: "Lịch hẹn mới",
        message: `${b.userId?.fullName || "Khách"} vừa đặt lịch xem phòng.`,
        time: b.createdAt,
        type: "booking",
        icon: "📅",
      })),
      ...newBlogs.map((b) => ({
        id: `blog-${b._id}`,
        title: "Bài blog chờ duyệt",
        message: `Bài blog "${b.title}" từ ${b.author || "chủ trọ"} đang chờ duyệt.`,
        time: b.createdAt,
        type: "blog",
        icon: "📝",
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 20);

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
