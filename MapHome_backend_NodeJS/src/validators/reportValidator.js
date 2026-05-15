const { body } = require("express-validator");

/**
 * Validation rules for creating a report
 */
const createReportRules = [
  body("propertyId")
    .trim()
    .notEmpty()
    .withMessage("ID phòng trọ không được để trống")
    .isMongoId()
    .withMessage("ID phòng trọ không hợp lệ"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Lý do báo cáo không được để trống")
    .isLength({ min: 5, max: 200 })
    .withMessage("Lý do báo cáo phải từ 5 đến 200 ký tự"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Mô tả chi tiết không được quá 1000 ký tự"),
];

/**
 * Validation rules for updating report status
 */
const updateReportRules = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Trạng thái không được để trống")
    .isIn(["pending", "resolved", "dismissed"])
    .withMessage("Trạng thái không hợp lệ"),

  body("adminNotes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Ghi chú admin không được quá 500 ký tự"),
];

module.exports = {
  createReportRules,
  updateReportRules,
};
