const User = require("../models/User");

/**
 * Map subscription plan to verification level and label
 * @param {Object} subscription - Subscription object with planId and planName
 * @returns {Object} { level: number, label: string, tier: string }
 */
const getVerificationLevelFromSubscription = (subscription) => {
  if (!subscription) {
    return { level: 1, label: "Level 1", tier: "Standard" };
  }

  const planId =
    subscription.planId?.planId ||
    subscription.planName?.toLowerCase() ||
    "free";

  const levelMap = {
    free: { level: 1, label: "Level 1", tier: "Standard" },
    basic: { level: 1, label: "Level 1", tier: "Standard" },
    standard: { level: 2, label: "Level 2", tier: "Standard" },
    pro: { level: 3, label: "Level 3", tier: "Premium" },
    premium: { level: 3, label: "Level 3", tier: "Premium" },
  };

  return (
    levelMap[planId.toLowerCase()] || {
      level: 1,
      label: "Level 1",
      tier: "Standard",
    }
  );
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

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("favorites")
      .populate({
        path: "subscriptionId",
        populate: { path: "planId", select: "planId name" },
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Calculate verification level and tier based on subscription
    const verificationInfo = getVerificationLevelFromSubscription(
      user.subscriptionId,
    );

    const userResponse = user.toObject();
    userResponse.verificationLevel = verificationInfo.level;
    userResponse.verificationLevelLabel = verificationInfo.label;
    userResponse.subscriptionTier = verificationInfo.tier;

    res.status(200).json(userResponse);
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
    } else {
      user.favorites.push(propertyId);
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
      .populate("propertyId", "name address")
      .populate("landlordId", "name phone")
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
