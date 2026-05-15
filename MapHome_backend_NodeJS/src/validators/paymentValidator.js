const { body } = require("express-validator");

/**
 * Validation rules for creating a payment request
 */
const createPaymentRules = [
  body("amount")
    .notEmpty()
    .withMessage("Số tiền không được để trống")
    .isNumeric()
    .withMessage("Số tiền phải là số")
    .isInt({ min: 5000 })
    .withMessage("Số tiền tối thiểu để giao dịch là 5,000 VND"),

  body("planId")
    .notEmpty()
    .withMessage("Mã gói cước không được để trống")
    .isIn(["basic", "standard", "pro"])
    .withMessage("Gói cước không hợp lệ"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Mô tả giao dịch không được quá 100 ký tự"),
];

module.exports = {
  createPaymentRules,
};
