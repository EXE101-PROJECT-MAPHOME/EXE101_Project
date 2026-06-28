const { body } = require("express-validator");
const User = require("../models/User");

const registerRules = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .custom(async (value) => {
      const user = await User.findOne({ username: value });
      if (user) {
        throw new Error("Username already in use");
      }
      return true;
    })
    .trim(),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email format")
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error("Email already in use");
      }
      return true;
    })
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),

  body("confirmPassword")
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Full name must be at least 2 characters long"),

  body("phone")
    .optional({ values: "falsy" })
    .matches(/^(?:\+?84|0)(3|5|7|8|9)[0-9]{8}$/)
    .withMessage("Invalid Vietnamese phone number format"),

  body("role")
    .optional()
    .isIn(["user", "landlord", "admin", "broker"])
    .withMessage("Invalid role. Must be 'user', 'landlord', 'admin', or 'broker'"),
];

const loginRules = [
  body("usernameOrEmail")
    .notEmpty()
    .withMessage("Username or email is required")
    .trim(),

  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordRules = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email format")
    .normalizeEmail(),
];

const verifyResetCodeRules = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email format")
    .normalizeEmail(),
  body("token").notEmpty().withMessage("Token is required").trim(),
];

const resetPasswordRules = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Must be a valid email format")
    .normalizeEmail(),

  body("token").notEmpty().withMessage("Token is required").trim(),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),

  body("confirmPassword")
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

const changePasswordRules = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),

  body("confirmPassword")
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

module.exports = {
  registerRules,
  loginRules,
  forgotPasswordRules,
  verifyResetCodeRules,
  resetPasswordRules,
  changePasswordRules,
};
