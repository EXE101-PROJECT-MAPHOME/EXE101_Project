const { body } = require("express-validator");

/**
 * Validation rules for submitting a contact message
 */
const contactRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Tên không được để trống")
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên phải từ 2 đến 100 ký tự"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không đúng định dạng"),

  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Tiêu đề không được để trống")
    .isLength({ min: 5, max: 200 })
    .withMessage("Tiêu đề phải từ 5 đến 200 ký tự"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Nội dung tin nhắn không được để trống")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Nội dung tin nhắn phải từ 10 đến 2000 ký tự"),
];

module.exports = {
  contactRules,
};
