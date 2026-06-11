const Subscription = require("../models/Subscription");
const User = require("../models/User");
const Property = require("../models/Property");

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("favorites");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Lấy subscription thực tế từ DB theo userId (không dựa vào subscriptionId trên User)
    // để đảm bảo luôn phản ánh trạng thái mới nhất sau thanh toán
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: "active",
    }).populate({ path: "planId", select: "planId name" });

    let subscriptionTier = "Free";
    let verificationLevel = 0;
    let verificationLevelLabel = "Chưa xác thực";

    if (subscription && subscription.status === "active") {
      // Lấy planName thực tế từ Subscription (do admin tạo trong DB)
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

    const userResponse = user.toObject();
    userResponse.id = userResponse._id;
    userResponse.verificationLevel = verificationLevel;
    userResponse.verificationLevelLabel = verificationLevelLabel;
    userResponse.subscriptionTier = subscriptionTier; // planName thực tế từ DB
    userResponse.subscriptionPlanId = subscription?.planId?.planId || null;
    userResponse.subscriptionExpiry = subscription?.expiryDate || null;

    res.status(200).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // password changes via dedicated flow

    // If username is being updated, check for uniqueness
    if (updates.username) {
      const existingUser = await User.findOne({
        username: updates.username,
        _id: { $ne: req.params.id },
      });
      if (existingUser) {
        return res
          .status(400)
          .json({
            message:
              "Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.",
          });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleFavoriteProperty = async (req, res) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId)
      return res.status(400).json({ message: "propertyId is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const exists = user.favorites.some(
      (id) => String(id) === String(propertyId),
    );
    if (exists) {
      user.favorites = user.favorites.filter(
        (id) => String(id) !== String(propertyId),
      );
      await Property.findByIdAndUpdate(propertyId, { $inc: { favorites: -1 } });
    } else {
      user.favorites.push(propertyId);
      await Property.findByIdAndUpdate(propertyId, { $inc: { favorites: 1 } });
    }
    await user.save();
    await user.populate("favorites");

    res.status(200).json({
      favorites: user.favorites,
      action: exists ? "removed" : "added",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("favorites");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user.favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's bookings
// @route   GET /api/user/bookings
const getMyBookings = async (req, res) => {
  try {
    const Booking = require("../models/Booking");
    const bookings = await Booking.find({ userId: req.user._id })
      .populate("propertyId", "name address image images")
      .populate("landlordId", "name phone email userId")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's inspections
// @route   GET /api/user/inspections
const getMyInspections = async (req, res) => {
  try {
    const VerificationRequest = require("../models/VerificationRequest");
    const inspections = await VerificationRequest.find({ userId: req.user._id })
      .populate("propertyId", "name address")
      .populate("landlordId", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json(inspections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserById,
  updateUser,
  getMyProfile,
  getMyFavorites,
  toggleFavoriteProperty,
  getMyBookings,
  getMyInspections,
};
