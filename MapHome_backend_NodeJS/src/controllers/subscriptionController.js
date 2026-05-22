const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Property = require("../models/Property");
const Landlord = require("../models/Landlord");
const VerificationRequest = require("../models/VerificationRequest");

// Helper: ensure generated planId is unique in the collection
const ensureUniquePlanId = async (baseId) => {
  if (!baseId) return baseId;
  let candidate = baseId;
  let suffix = 0;
  // loop until we find a candidate that does not exist
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

// @desc    Get available plans
// @route   GET /api/subscriptions/plans
const getAvailablePlans = async (req, res) => {
  try {
    let plans = await SubscriptionPlan.find({ isActive: true });

    // Seed default plans if none exist (initial setup)
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
          badgeColor:
            "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
          icon: "Star",
          cta: "Chọn Standard",
          ctaVariant: "default",
          highlighted: true,
          isActive: true,
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
          badgeColor:
            "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
          icon: "Rocket",
          cta: "Chọn Pro",
          ctaVariant: "default",
          isActive: true,
        },
      ];
      plans = await SubscriptionPlan.insertMany(defaultPlans);
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
    // In a real app, this would be called after a successful payment callback
    // For now, we manually create/update the subscription
    const plans = {
      free: { name: "Free", features: ["5 tin đăng"] },
      standard: {
        name: "Standard",
        term: 30,
        features: ["20 tin đăng", "Ưu tiên"],
      },
      pro: { name: "Pro", term: 30, features: ["50 tin đăng", "Ưu tiên cao"] },
    };

    const plan = plans[planId];
    if (!plan) return res.status(400).json({ message: "Invalid plan" });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (plan.term || 365));

    let subscription = await Subscription.findOne({ userId: req.user._id });

    if (subscription) {
      subscription.planName = plan.name;
      subscription.status = "active";
      subscription.expiryDate = expiryDate;
      subscription.features = plan.features;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        userId: req.user._id,
        planId:
          planId.toLowerCase() === "free"
            ? null
            : (
                await SubscriptionPlan.findOne({
                  planId: planId.toLowerCase(),
                  isActive: true,
                })
              )?._id,
        planName: plan.name,
        expiryDate,
        features: plan.features,
      });
    }

    // Update User's subscriptionId to link to the subscription
    await User.findByIdAndUpdate(req.user._id, {
      subscriptionId: subscription._id,
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

// @desc    Reset plans to 4 official tiers
// @route   POST /api/admin/subscriptions/reset
const resetSubscriptionPlans = async (req, res) => {
  try {
    // 1. Deactivate ALL current plans
    await SubscriptionPlan.updateMany({}, { isActive: false });

    // 2. Insert 4 Official Tiers
    const officialPlans = [
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
      },
    ];

    const plans = await SubscriptionPlan.insertMany(officialPlans);
    res.status(200).json({ message: "Plans reset to official 4 tiers", plans });
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
};
