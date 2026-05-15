const { body } = require("express-validator");

/**
 * Validation rules for creating and updating blog posts
 */
const blogRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Tiêu đề không được để trống")
    .isLength({ min: 10, max: 200 })
    .withMessage("Tiêu đề phải từ 10 đến 200 ký tự"),

  body("excerpt")
    .trim()
    .notEmpty()
    .withMessage("Tóm tắt không được để trống")
    .isLength({ min: 20, max: 500 })
    .withMessage("Tóm tắt phải từ 20 đến 500 ký tự"),

  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Nội dung không được để trống nếu cung cấp"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Danh mục không được để trống"),

  body("image")
    .optional()
    .trim()
    .isURL()
    .withMessage("Link ảnh không hợp lệ"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags phải là một mảng các chuỗi"),

  body("status")
    .optional()
    .isIn(["approved", "pending", "rejected", "draft"])
    .withMessage("Trạng thái không hợp lệ"),
];

/**
 * Validation rules for rejecting a blog post
 */
const rejectBlogRules = [
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Lý do từ chối không được để trống")
    .isLength({ min: 5, max: 500 })
    .withMessage("Lý do từ chối phải từ 5 đến 500 ký tự"),
];

module.exports = {
  blogRules,
  rejectBlogRules,
};
