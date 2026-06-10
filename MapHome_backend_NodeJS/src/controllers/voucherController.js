const Voucher = require("../models/Voucher");
const SubscriptionPlan = require("../models/SubscriptionPlan");

// @desc    Create a new voucher
// @route   POST /api/vouchers
// @access  Private/Admin
const createVoucher = async (req, res) => {
  try {
    const {
      code,
      discountPercentage,
      applicablePlans,
      startDate,
      endDate,
      isActive,
      maxUses,
      title,
      description,
      bannerImage,
      showOnHome,
    } = req.body;

    // Check if code already exists
    const existingVoucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (existingVoucher) {
      return res.status(400).json({ message: "Mã voucher này đã tồn tại." });
    }

    const voucher = await Voucher.create({
      code,
      discountPercentage,
      applicablePlans,
      startDate,
      endDate,
      isActive: isActive !== undefined ? isActive : true,
      maxUses: maxUses || null,
      title,
      description,
      bannerImage,
      showOnHome,
    });

    res.status(201).json(voucher);
  } catch (error) {
    console.error("Create voucher error:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi tạo voucher", error: error.message });
  }
};

// @desc    Get all vouchers
// @route   GET /api/vouchers
// @access  Private/Admin
const getVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find()
      .populate("applicablePlans", "name planId")
      .sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (error) {
    console.error("Get vouchers error:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy danh sách voucher", error: error.message });
  }
};

// @desc    Get voucher by ID
// @route   GET /api/vouchers/:id
// @access  Private/Admin
const getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id).populate("applicablePlans", "name planId");
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }
    res.json(voucher);
  } catch (error) {
    console.error("Get voucher error:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// @desc    Update voucher
// @route   PUT /api/vouchers/:id
// @access  Private/Admin
const updateVoucher = async (req, res) => {
  try {
    const {
      code,
      discountPercentage,
      applicablePlans,
      startDate,
      endDate,
      isActive,
      maxUses,
      title,
      description,
      bannerImage,
      showOnHome,
    } = req.body;

    let voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }

    // Check if new code conflicts
    if (code && code.toUpperCase() !== voucher.code) {
      const existingCode = await Voucher.findOne({ code: code.toUpperCase() });
      if (existingCode) {
        return res.status(400).json({ message: "Mã voucher này đã được sử dụng." });
      }
      voucher.code = code.toUpperCase();
    }

    if (discountPercentage !== undefined) voucher.discountPercentage = discountPercentage;
    if (applicablePlans) voucher.applicablePlans = applicablePlans;
    if (startDate) voucher.startDate = startDate;
    if (endDate) voucher.endDate = endDate;
    if (isActive !== undefined) voucher.isActive = isActive;
    if (maxUses !== undefined) voucher.maxUses = maxUses;
    if (title !== undefined) voucher.title = title;
    if (description !== undefined) voucher.description = description;
    if (bannerImage !== undefined) voucher.bannerImage = bannerImage;
    if (showOnHome !== undefined) voucher.showOnHome = showOnHome;

    const updatedVoucher = await voucher.save();
    res.json(updatedVoucher);
  } catch (error) {
    console.error("Update voucher error:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi cập nhật voucher", error: error.message });
  }
};

// @desc    Delete voucher
// @route   DELETE /api/vouchers/:id
// @access  Private/Admin
const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }

    await voucher.deleteOne();
    res.json({ message: "Đã xóa voucher thành công" });
  } catch (error) {
    console.error("Delete voucher error:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi xóa voucher", error: error.message });
  }
};

// @desc    Validate a voucher code for a given plan
// @route   POST /api/vouchers/validate
// @access  Private (User)
const validateVoucher = async (req, res) => {
  try {
    const { code, planId } = req.body;

    if (!code || !planId) {
      return res.status(400).json({ message: "Vui lòng cung cấp mã voucher và gói đăng ký." });
    }

    const voucher = await Voucher.findOne({ code: code.toUpperCase() });

    if (!voucher) {
      return res.status(404).json({ message: "Mã voucher không tồn tại." });
    }

    if (!voucher.isActive) {
      return res.status(400).json({ message: "Mã voucher này đã bị vô hiệu hóa." });
    }

    const now = new Date();
    if (now < voucher.startDate) {
      return res.status(400).json({ message: "Mã voucher chưa đến thời gian áp dụng." });
    }

    if (now > voucher.endDate) {
      return res.status(400).json({ message: "Mã voucher đã hết hạn." });
    }

    if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
      return res.status(400).json({ message: "Mã voucher đã hết lượt sử dụng." });
    }

    // Check if applicable for this plan
    if (voucher.applicablePlans && voucher.applicablePlans.length > 0) {
      const isApplicable = voucher.applicablePlans.some(pId => pId.toString() === planId.toString());
      if (!isApplicable) {
        return res.status(400).json({ message: "Mã voucher này không áp dụng cho gói đăng ký bạn đã chọn." });
      }
    }

    res.json({
      valid: true,
      discountPercentage: voucher.discountPercentage,
      voucherId: voucher._id,
      message: "Mã voucher hợp lệ!"
    });
  } catch (error) {
    console.error("Validate voucher error:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi kiểm tra voucher", error: error.message });
  }
};

// @desc    Get promoted active vouchers for home page
// @route   GET /api/vouchers/promoted
// @access  Public
const getPromotedVouchers = async (req, res) => {
  try {
    const now = new Date();
    const promotedVouchers = await Voucher.find({
      showOnHome: true,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).select("code discountPercentage title description bannerImage endDate maxUses usedCount");
    
    // Filter out fully used vouchers
    const availableVouchers = promotedVouchers.filter(v => 
      v.maxUses === null || v.usedCount < v.maxUses
    );
    
    res.json(availableVouchers);
  } catch (error) {
    console.error("Get promoted vouchers error:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

module.exports = {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
  getPromotedVouchers,
};
