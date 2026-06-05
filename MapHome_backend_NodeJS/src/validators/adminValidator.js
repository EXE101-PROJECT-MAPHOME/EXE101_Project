const { body } = require("express-validator");

/**
 * Validation rules for broadcasting notifications
 */
const broadcastRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Tiêu đề không được để trống")
    .isLength({ min: 5, max: 100 })
    .withMessage("Tiêu đề phải từ 5 đến 100 ký tự"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Nội dung không được để trống")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Nội dung phải từ 10 đến 1000 ký tự"),

  body("type")
    .optional()
    .isIn(["info", "warning", "success", "error", "promotion"])
    .withMessage("Loại thông báo không hợp lệ"),

  body("targetRole")
    .optional()
    .isIn(["all", "user", "landlord", "admin"])
    .withMessage("Đối tượng nhận không hợp lệ"),

  body("link")
    .optional()
    .trim()
    .custom((value) => {
      if (value && value !== "" && !value.startsWith("/") && !value.startsWith("http")) {
        throw new Error("Link phải là đường dẫn nội bộ hoặc URL hợp lệ");
      }
      return true;
    }),
];

/**
 * Validation rules for updating property status
 */
const updatePropertyStatusRules = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Trạng thái không được để trống")
    .isIn(["pending", "approved", "rejected", "reported"])
    .withMessage("Trạng thái không hợp lệ"),
];

/**
 * Validation rules for verification approval/rejection
 */
const approveVerificationRules = [
  body("scheduledDate")
    .notEmpty()
    .withMessage("Ngày hẹn không được để trống")
    .isISO8601()
    .withMessage("Ngày hẹn không đúng định dạng")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Ngày hẹn phải ở tương lai");
      }
      return true;
    }),
];

const rejectVerificationRules = [
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Lý do từ chối không được để trống")
    .isLength({ min: 5, max: 500 })
    .withMessage("Lý do từ chối phải từ 5 đến 500 ký tự"),
];

const completeVerificationRules = [
  body("badgeAwarded")
    .trim()
    .notEmpty()
    .withMessage("Kết quả huy hiệu không được để trống")
    .isIn(["none", "verified", "premium"])
    .withMessage("Loại huy hiệu không hợp lệ"),

  body("inspectorNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Ghi chú thanh tra không được quá 1000 ký tự"),
];

/**
 * Validation rules for subscription plans
 */
const planRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Tên gói không được để trống")
    .isLength({ min: 3, max: 50 })
    .withMessage("Tên gói phải từ 3 đến 50 ký tự"),

  body("price")
    .notEmpty()
    .withMessage("Giá không được để trống")
    .isNumeric()
    .withMessage("Giá phải là số")
    .custom((value) => value >= 0)
    .withMessage("Giá không được âm"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Mô tả không được để trống"),

  body("features")
    .optional()
    .isArray()
    .withMessage("Tính năng phải là một mảng"),
];

/**
 * Validation rules for system settings
 */
const updateSettingsRules = [
  body("siteName").optional().trim().notEmpty(),
  body("contactEmail").optional().trim().isEmail().withMessage("Email không hợp lệ"),
  body("contactPhone").optional().trim().notEmpty(),
  body("maintenanceMode").optional().isBoolean(),

  // Pricing fields
  body("pricing.basicVerification")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Phí xác minh cơ bản phải là số nguyên không âm"),
  body("pricing.premiumVerification")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Phí xác minh cao cấp phải là số nguyên không âm"),
  body("pricing.postRoomFee")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Phí đăng phòng phải là số nguyên không âm"),
  body("pricing.pushRoomFee")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Phí đẩy tin phải là số nguyên không âm"),
];

module.exports = {
  broadcastRules,
  updatePropertyStatusRules,
  approveVerificationRules,
  rejectVerificationRules,
  completeVerificationRules,
  planRules,
  updateSettingsRules,
};
