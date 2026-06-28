const VerificationRequest = require("../models/VerificationRequest");
const SystemSetting = require("../models/SystemSetting");
const Transaction = require("../models/Transaction");

// @desc    Get all verification requests
// @route   GET /api/verifications
const getVerifications = async (req, res) => {
  try {
    const query = {};
    if (req.query.landlordId) query.landlordId = req.query.landlordId;
    if (req.query.propertyId) query.propertyId = req.query.propertyId;
    if (req.query.status) query.status = req.query.status;
    if (req.query.requesterId) query.requesterId = req.query.requesterId;

    const verifications = await VerificationRequest.find(query)
      .populate("propertyId", "name")
      .populate("landlordId", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(verifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single verification request
// @route   GET /api/verifications/:id
const getVerificationById = async (req, res) => {
  try {
    const verification = await VerificationRequest.findById(req.params.id)
      .populate("propertyId", "name")
      .populate("landlordId", "name");
    if (!verification) {
      return res
        .status(404)
        .json({ message: "Verification request not found" });
    }
    res.status(200).json(verification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a verification request
// @route   POST /api/verifications
const createVerification = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Nếu có bookingId (tenant yêu cầu xác minh trọ), bắt buộc phải đã thanh toán phí xác minh
    if (bookingId) {
      const paidTx = await Transaction.findOne({
        bookingId,
        planId: "inspection",
        status: "success",
      });
      if (!paidTx) {
        return res.status(402).json({
          message:
            "Bạn cần thanh toán phí xác minh trọ (119,000đ) trước khi tạo yêu cầu. Vui lòng sử dụng API /api/payments/create với planId='inspection'.",
        });
      }
    }

    const verification = await VerificationRequest.create(req.body);
    res.status(201).json(verification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a verification request
// @route   PUT /api/verifications/:id
const updateVerification = async (req, res) => {
  try {
    const verification = await VerificationRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!verification) {
      return res
        .status(404)
        .json({ message: "Verification request not found" });
    }
    res.status(200).json(verification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const completeInspection = async (req, res) => {
  try {
    const { badgeAwarded, inspectorNotes } = req.body;
    const verification = await VerificationRequest.findById(req.params.id);
    if (!verification) {
      return res
        .status(404)
        .json({ message: "Verification request not found" });
    }
    
    // Update verification request
    verification.status = "completed";
    verification.badgeAwarded =
      badgeAwarded || verification.badgeAwarded || "none";
    verification.inspectorNotes = inspectorNotes || verification.inspectorNotes;
    verification.completedAt = new Date();
    await verification.save();

    // Sync with Property model
    const Property = require("../models/Property");
    const property = await Property.findById(verification.propertyId);
    if (property) {
      property.verificationLevel = "location-verified";
      if (verification.badgeAwarded === "verified") {
        property.greenBadge = {
          level: "verified",
          awardedAt: new Date(),
          awardedBy: "Admin", // Should get from req.user
          inspectionNotes: inspectorNotes,
        };
      }
      await property.save();
    }

    res.status(200).json(verification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a verification request
// @route   DELETE /api/verifications/:id
const deleteVerification = async (req, res) => {
  try {
    const verification = await VerificationRequest.findByIdAndDelete(
      req.params.id,
    );
    if (!verification) {
      return res
        .status(404)
        .json({ message: "Verification request not found" });
    }
    res.status(200).json({ message: "Verification request removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/verifications/:id/notify - mark as awaiting_photos and set notifiedAt
const notifyUserAboutPhotos = async (req, res) => {
  try {
    const verification = await VerificationRequest.findById(req.params.id);
    if (!verification)
      return res
        .status(404)
        .json({ message: "Verification request not found" });

    verification.status = "awaiting_photos";
    verification.notifiedAt = new Date();
    await verification.save();
    res.status(200).json(verification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/verifications/:id/photos - user submits photos
const submitUserPhotos = async (req, res) => {
  try {
    const { photos } = req.body; // array of photo URLs/base64
    const verification = await VerificationRequest.findById(req.params.id);
    if (!verification)
      return res
        .status(404)
        .json({ message: "Verification request not found" });

    verification.userProvidedPhotos = photos || [];
    verification.photosSubmittedAt = new Date();
    verification.status = "photos_submitted";
    await verification.save();
    res.status(200).json(verification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get verification pricing
// @route   GET /api/public/verifications/pricing
const getVerificationPricing = async (req, res) => {
  try {
    const settings = await SystemSetting.findOne();
    const pricing = settings ? settings.pricing : { basicVerification: 119000, premiumVerification: 0 };
    res.status(200).json(pricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVerifications,
  getVerificationById,
  createVerification,
  updateVerification,
  deleteVerification,
  notifyUserAboutPhotos,
  submitUserPhotos,
  completeInspection,
  getVerificationPricing,
};
