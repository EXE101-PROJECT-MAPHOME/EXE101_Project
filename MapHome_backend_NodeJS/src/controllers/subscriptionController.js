const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Property = require("../models/Property");
const Landlord = require("../models/Landlord");
const VerificationRequest = require("../models/VerificationRequest");
const User = require("../models/User");

// Helper: ensure generated planId is unique in the collection
const ensureUniquePlanId = async (baseId) => {
  if (!baseId) return baseId;
  let candidate = baseId;
  let suffix = 0;
  while (await SubscriptionPlan.findOne({ planId: candidate })) {
    suffix += 1;
    candidate = `${baseId}-${suffix}`;
  }
  return candidate;
};

// @desc    Get current user's subscription
// @route   GET /api/subscriptions/me
const getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    });

    // Find landlord profile to get their properties
    const landlord = await Landlord.findOne({ userId: req.user._id });

    let listingCount = 0;
    let totalViews = 0;
    let verificationCount = 0;

    if (landlord) {
      // 1. Count listings
      listingCount = await Property.countDocuments({
        landlordId: landlord._id,
      });

      // 2. Sum views
      const properties = await Property.find(
        { landlordId: landlord._id },
        "views",
      );
      totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0);

      // 3. Count completed verifications
      verificationCount = await VerificationRequest.countDocuments({
        landlordId: landlord._id,
        status: "completed",
      });
    }

    // Get plan details (limits)
    const planName = subscription ? subscription.planName : "Free";
    const planDetails = await SubscriptionPlan.findOne({
      planId: planName.toLowerCase(),
    });

    const responseData = subscription
      ? subscription.toObject()
      : {
          planName: "Free",
          status: "active",
          startDate: req.user.createdAt,
          expiryDate: null,
          features: ["1 tin đăng miễn phí"],
        };

    // Add usage stats to response
    const limits = {
      free: 1,
      basic: 1,
      standard: 20,
      pro: 50,
      "broker-lite": 20,
      "broker-pro": 60,
      "broker-agency": 150,
    };
    const currentLimit = limits[planName.toLowerCase()] || 1;

    responseData.usageStats = [
      {
        label: "Tin đã đăng",
        value: `${listingCount}/${currentLimit}`,
        icon: "TrendingUp",
        color: "text-blue-600",
        subtitle: "Gói hiện tại",
      },
      {
        label: "Lượt xem",
        value: totalViews.toString(),
        icon: "TrendingUp",
        color: "text-green-600",
        subtitle: "Tổng lượt xem",
      },
      {
        label: "Xác thực",
        value: verificationCount.toString(),
        icon: "Star",
        color: "text-amber-600",
        subtitle: "Đã hoàn tất",
      },
    ];

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available plans (filtered by role if provided)
// @route   GET /api/subscriptions/plans?role=landlord|broker
const getAvailablePlans = async (req, res) => {
  try {
    const { role } = req.query;

    // === BƯỚC 1: Auto-migrate plans cũ chưa có targetRole ===
    // Plans tạo trước khi thêm trường targetRole sẽ không có field này.
    // Ta tự động gán: free -> "all", còn lại -> "landlord"
    const plansWithoutRole = await SubscriptionPlan.countDocuments({
      isActive: true,
      targetRole: { $exists: false },
    });
    if (plansWithoutRole > 0) {
      await SubscriptionPlan.updateMany(
        { isActive: true, targetRole: { $exists: false }, planId: "free" },
        { $set: { targetRole: "all" } }
      );
      await SubscriptionPlan.updateMany(
        { isActive: true, targetRole: { $exists: false } },
        { $set: { targetRole: "landlord" } }
      );
    }

    // === BƯỚC 2: Query plans theo role ===
    let query = { isActive: true };
    if (role && ["landlord", "broker"].includes(role)) {
      query.targetRole = { $in: [role, "all"] };
    }

    let plans = await SubscriptionPlan.find(query).sort({ price: 1 });

    // === BƯỚC 3: Fallback nếu filter không ra kết quả nhưng DB có dữ liệu ===
    // Trường hợp này xảy ra khi plans trong DB chưa được migrate đủ
    if ((!plans || plans.length === 0) && role) {
      console.warn(`[getAvailablePlans] No plans for role="${role}", falling back to all active plans`);
      plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
    }

    // === BƯỚC 4: Seed mặc định nếu DB hoàn toàn trống ===
    if (!plans || plans.length === 0) {
      const defaultPlans = [
        {
          planId: "free",
          name: "Gói Cơ bản (Miễn phí)",
          price: 0,
          yearlyPrice: 0,
          description: "Đăng tin thường, hiển thị trên bảng lọc cơ bản.",
          features: [
            { text: "Đăng tin thường", included: true },
            { text: "Hiển thị bảng lọc cơ bản", included: true },
            { text: "Tự động gỡ sau 7 ngày", included: true },
            { text: "Tạo cơ sở upsell", included: true },
          ],
          badge: "Miễn phí",
          badgeColor: "bg-gray-100 text-gray-700",
          icon: "Home",
          cta: "Bắt đầu ngay",
          ctaVariant: "outline",
          isActive: true,
          targetRole: "all",
        },
        {
          planId: "basic",
          name: "Gói Basic",
          price: 50000,
          yearlyPrice: 480000,
          description: "GPS xác thực trong 50m.",
          features: [
            { text: "GPS xác thực trong 50m", included: true },
            { text: "Huy hiệu xanh (Tích xanh)", included: true },
            { text: "Highlight nhẹ tin đăng", included: true },
            { text: "Yêu cầu Admin kiểm tra", included: true },
            { text: "Tin hiển thị 30 ngày", included: true },
          ],
          icon: "MapPin",
          cta: "Chọn Basic",
          badge: "Ổn định",
          badgeColor: "bg-blue-100 text-blue-700",
          ctaVariant: "secondary",
          isActive: true,
          targetRole: "landlord",
        },
        {
          planId: "standard",
          name: "Gói Standard",
          price: 100000,
          yearlyPrice: 960000,
          description: "Đầy đủ tính năng Basic + Video 360°.",
          features: [
            { text: "Toàn bộ tính năng Basic", included: true },
            { text: "Video 360° phòng trọ", included: true },
            { text: "Thống kê lượt xem", included: true },
            { text: "Ưu tiên Top tìm kiếm", included: true },
            { text: "Hiển thị vĩnh viễn", included: true },
          ],
          badge: "Phổ biến",
          badgeColor: "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
          icon: "Star",
          cta: "Chọn Standard",
          ctaVariant: "default",
          highlighted: true,
          isActive: true,
          targetRole: "landlord",
        },
        {
          planId: "pro",
          name: "Gói Pro",
          price: 200000,
          yearlyPrice: 1920000,
          description: "Đầy đủ tính năng Standard + Boost vị trí.",
          features: [
            { text: "Toàn bộ Standard", included: true },
            { text: "Boost vị trí tin đăng", included: true },
            { text: "Concierge hỗ trợ đăng tin", included: true },
            { text: "Hỗ trợ chụp ảnh & mô tả", included: true },
            { text: "Kiểm tra tin ưu tiên", included: true },
            { text: "Hiển thị vĩnh viễn", included: true },
          ],
          badge: "Ưu việt",
          badgeColor: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
          icon: "Rocket",
          cta: "Chọn Pro",
          ctaVariant: "default",
          isActive: true,
          targetRole: "landlord",
        },
      ];
      // Dùng bulkWrite upsert để tránh lỗi duplicate key khi planId đã tồn tại
      const ops = defaultPlans.map((p) => ({
        updateOne: {
          filter: { planId: p.planId },
          update: { $setOnInsert: p },
          upsert: true,
        },
      }));
      await SubscriptionPlan.bulkWrite(ops);
      plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
    }

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Subscribe to a plan
// @route   POST /api/subscriptions/subscribe
const subscribe = async (req, res) => {
  try {
    const { planId } = req.body;

    // Bước 1: Kiểm tra gói cước tồn tại trong DB
    const planDoc = await SubscriptionPlan.findOne({
      planId: planId.toLowerCase(),
      isActive: true,
    });

    if (!planDoc && planId.toLowerCase() !== "free") {
      return res
        .status(400)
        .json({ message: "Gói dịch vụ không tồn tại hoặc đã ngừng hoạt động." });
    }

    // Bước 2: Kiểm tra phân quyền chéo giữa role người dùng và targetRole của gói
    if (planDoc && planDoc.targetRole !== "all") {
      const userRole = req.user.role; // "landlord" | "broker" | "user" | "admin"
      if (planDoc.targetRole !== userRole) {
        return res.status(403).json({
          message: `Tài khoản vai trò "${userRole}" không được phép đăng ký gói dành cho "${planDoc.targetRole}".`,
        });
      }
    }

    // Bước 3: Thực hiện đăng ký
    const plan = planDoc
      ? {
          name: planDoc.name,
          term: planDoc.termDays || 30,
          features: (planDoc.features || []).map((f) =>
            typeof f === "string" ? f : f.text
          ),
        }
      : { name: "Free", features: ["1 tin đăng miễn phí"] };

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (plan.term || 365));

    let subscription = await Subscription.findOne({ userId: req.user._id });

    if (subscription) {
      subscription.planName = plan.name;
      subscription.planId = planDoc?._id || null;
      subscription.status = "active";
      subscription.expiryDate = expiryDate;
      subscription.features = plan.features;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        userId: req.user._id,
        planId: planDoc?._id || null,
        planName: plan.name,
        expiryDate,
        features: plan.features,
      });
    }

    // Bước 4: Cập nhật verificationLevel dựa theo slug gói
    let verificationLevel = 0;
    const slug = planId.toLowerCase();
    if (slug === "basic") {
      verificationLevel = 1;
    } else if (slug === "standard" || slug === "broker-lite") {
      verificationLevel = 2;
    } else if (slug === "pro" || slug === "broker-pro" || slug === "broker-agency") {
      verificationLevel = 3;
    } else {
      verificationLevel = 0;
    }

    // Cập nhật User's subscriptionId, verificationLevel và subscriptionTier
    await User.findByIdAndUpdate(req.user._id, {
      subscriptionId: subscription._id,
      verificationLevel,
      subscriptionTier: plan.name,
    });

    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a plan - Versioning (Creates new, deactivates old)
// @route   PUT /api/admin/subscriptions/plans/:id
const updateSubscriptionPlan = async (req, res) => {
  try {
    const oldPlan = await SubscriptionPlan.findById(req.params.id);
    if (!oldPlan) return res.status(404).json({ message: "Plan not found" });

    // Mark old as inactive
    oldPlan.isActive = false;
    await oldPlan.save();

    // Create new version. Merge old plan defaults with incoming payload
    const oldObj = oldPlan.toObject();
    const newPlanData = {
      ...oldObj,
      ...req.body,
      isActive: true,
    };

    // Remove mongoose metadata / ids
    delete newPlanData._id;
    delete newPlanData.__v;
    delete newPlanData.createdAt;
    delete newPlanData.updatedAt;

    if (!newPlanData.planId && newPlanData.name) {
      newPlanData.planId = newPlanData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
    }

    // Ensure planId is unique to avoid Mongo duplicate key errors
    if (newPlanData.planId) {
      newPlanData.planId = await ensureUniquePlanId(newPlanData.planId);
    }

    try {
      const newPlan = await SubscriptionPlan.create(newPlanData);
      res.status(200).json(newPlan);
    } catch (innerErr) {
      if (innerErr && innerErr.code === 11000) {
        console.error("duplicate planId on create (race):", innerErr.keyValue);
        return res
          .status(409)
          .json({ message: "Duplicate planId", keyValue: innerErr.keyValue });
      }
      throw innerErr;
    }
  } catch (error) {
    console.error("updateSubscriptionPlan error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new plan
// @route   POST /api/admin/subscriptions/plans
const createSubscriptionPlan = async (req, res) => {
  try {
    const planData = { ...req.body };
    if (!planData.planId) {
      // Auto-generate a planId slug if missing
      planData.planId = planData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    const plan = await SubscriptionPlan.create(planData);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a plan - Soft Delete
// @route   DELETE /api/admin/subscriptions/plans/:id
const deleteSubscriptionPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    plan.isActive = false;
    await plan.save();

    res.status(200).json({ message: "Plan deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset plans to official tiers (4 Landlord + 3 Broker)
// @route   POST /api/admin/subscriptions/reset
const resetSubscriptionPlans = async (req, res) => {
  try {
    // 1. Vô hiệu hóa TẤT CẢ các gói hiện tại
    await SubscriptionPlan.updateMany({}, { isActive: false });

    // 2. Nạp lại các gói chính thức (4 gói Landlord + 3 gói Broker)
    const officialPlans = [
      // === GÓI DÀNH CHO CHỦ NHÀ (LANDLORD) ===
      {
        planId: "free",
        name: "Gói Cơ bản (Miễn phí)",
        price: 0,
        yearlyPrice: 0,
        description: "Đăng tin thường, hiển thị trên bảng lọc cơ bản.",
        features: [
          { text: "Đăng tin thường", included: true },
          { text: "Hiển thị bảng lọc cơ bản", included: true },
          { text: "Tự động gỡ sau 7 ngày", included: true },
          { text: "Tạo cơ sở upsell", included: true },
        ],
        badge: "Miễn phí",
        badgeColor: "bg-gray-100 text-gray-700",
        icon: "Home",
        cta: "Bắt đầu ngay",
        ctaVariant: "outline",
        targetRole: "all", // Gói dùng chung cho cả hai vai trò
      },
      {
        planId: "basic",
        name: "Gói Basic",
        price: 50000,
        yearlyPrice: 480000,
        description: "GPS xác thực trong 50m.",
        features: [
          { text: "GPS xác thực trong 50m", included: true },
          { text: "Huy hiệu xanh (Tích xanh)", included: true },
          { text: "Highlight nhẹ tin đăng", included: true },
          { text: "Yêu cầu Admin kiểm tra", included: true },
          { text: "Tin hiển thị 30 ngày", included: true },
        ],
        icon: "MapPin",
        cta: "Chọn Basic",
        badge: "Ổn định",
        badgeColor: "bg-blue-100 text-blue-700",
        ctaVariant: "secondary",
        targetRole: "landlord",
      },
      {
        planId: "standard",
        name: "Gói Standard",
        price: 100000,
        yearlyPrice: 960000,
        description: "Đầy đủ tính năng Basic + Video 360°.",
        features: [
          { text: "Toàn bộ tính năng Basic", included: true },
          { text: "Video 360° phòng trọ", included: true },
          { text: "Thống kê lượt xem", included: true },
          { text: "Ưu tiên Top tìm kiếm", included: true },
          { text: "Hiển thị vĩnh viễn", included: true },
        ],
        badge: "Phổ biến",
        badgeColor: "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
        icon: "Star",
        cta: "Chọn Standard",
        ctaVariant: "default",
        highlighted: true,
        targetRole: "landlord",
      },
      {
        planId: "pro",
        name: "Gói Pro",
        price: 200000,
        yearlyPrice: 1920000,
        description: "Đầy đủ tính năng Standard + Boost vị trí.",
        features: [
          { text: "Toàn bộ Standard", included: true },
          { text: "Boost vị trí tin đăng", included: true },
          { text: "Concierge hỗ trợ đăng tin", included: true },
          { text: "Hỗ trợ chụp ảnh & mô tả", included: true },
          { text: "Kiểm tra tin ưu tiên", included: true },
          { text: "Hiển thị vĩnh viễn", included: true },
        ],
        badge: "Ưu việt",
        badgeColor: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
        icon: "Rocket",
        cta: "Chọn Pro",
        ctaVariant: "default",
        targetRole: "landlord",
      },

      // === GÓI DÀNH CHO MÔI GIỚI (BROKER) ===
      {
        planId: "broker-lite",
        name: "Broker Lite",
        price: 299000,
        yearlyPrice: 2880000,
        description: "Dành cho môi giới tự do, quản lý tối đa 20 tin đăng.",
        features: [
          { text: "Tối đa 20 tin đăng đồng thời", included: true },
          { text: "Tích xanh GPS xác thực", included: true },
          { text: "Boost tự động 5 lượt/tuần", included: true },
          { text: "Thống kê hiệu quả tin đăng cơ bản", included: true },
          { text: "Hiển thị vĩnh viễn", included: true },
        ],
        badge: "Môi giới",
        badgeColor: "bg-sky-100 text-sky-700",
        icon: "MapPin",
        cta: "Chọn Broker Lite",
        ctaVariant: "secondary",
        targetRole: "broker",
      },
      {
        planId: "broker-pro",
        name: "Broker Pro",
        price: 599000,
        yearlyPrice: 5760000,
        description: "Môi giới chuyên nghiệp, tối đa 60 tin đăng + tiếp cận lead.",
        features: [
          { text: "Tối đa 60 tin đăng đồng thời", included: true },
          { text: "Boost tự động 20 lượt/tuần", included: true },
          { text: "Mở khóa tiếp cận Lead khách hàng", included: true },
          { text: "Ưu tiên hiển thị Top bản đồ", included: true },
          { text: "Thống kê nâng cao & báo cáo", included: true },
          { text: "Hiển thị vĩnh viễn", included: true },
        ],
        badge: "Phổ biến",
        badgeColor: "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
        icon: "Star",
        cta: "Chọn Broker Pro",
        ctaVariant: "default",
        highlighted: true,
        targetRole: "broker",
      },
      {
        planId: "broker-agency",
        name: "Broker Agency",
        price: 1199000,
        yearlyPrice: 11520000,
        description: "Văn phòng môi giới, 150 tin + tài khoản cộng tác viên.",
        features: [
          { text: "Tối đa 150 tin đăng đồng thời", included: true },
          { text: "3 tài khoản cộng tác viên (Sub-accounts)", included: true },
          { text: "Boost tự động không giới hạn", included: true },
          { text: "Ghim VIP Marker trên bản đồ", included: true },
          { text: "Chăm sóc tài khoản riêng biệt", included: true },
          { text: "Báo cáo doanh số định kỳ", included: true },
          { text: "Hiển thị vĩnh viễn", included: true },
        ],
        badge: "Agency",
        badgeColor: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white",
        icon: "Shield",
        cta: "Chọn Agency",
        ctaVariant: "default",
        targetRole: "broker",
      },
    ];

    const plans = await SubscriptionPlan.insertMany(officialPlans);
    res.status(200).json({
      message: "Plans reset to official 7 tiers (4 Landlord + 3 Broker)",
      plans,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel current user's active subscription
// @route   POST /api/subscriptions/cancel
const cancelMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    });

    if (!subscription) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy gói đăng ký nào đang hoạt động." });
    }

    subscription.status = "cancelled";
    await subscription.save();

    // Revert user to free / level 0 in DB
    await User.findByIdAndUpdate(req.user._id, {
      subscriptionId: null,
      verificationLevel: 0,
      subscriptionTier: "Free",
    });

    res.status(200).json({
      message:
        "Đã hủy gói dịch vụ thành công! Tài khoản của bạn đã quay về gói Free với cấp độ xác thực 0.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMySubscription,
  getAvailablePlans,
  subscribe,
  updateSubscriptionPlan,
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  resetSubscriptionPlans,
  cancelMySubscription,
};
