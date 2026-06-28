const { body, param } = require("express-validator");

const updateUserRules = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage("Full name must be at least 2 characters long"),
    
  body("phone")
    .optional({ values: "falsy" })
    .matches(/^(?:\+?84|0)(3|5|7|8|9)[0-9]{8}$/).withMessage("Invalid Vietnamese phone number format"),
    
  body("avatar")
    .optional()
    .isURL().withMessage("Avatar must be a valid URL"),
];

const toggleFavoriteRules = [
  body("propertyId")
    .notEmpty().withMessage("Property ID is required")
    .isMongoId().withMessage("Invalid Property ID format"),
];

const getUserByIdRules = [
  param("id")
    .isMongoId().withMessage("Invalid User ID format"),
];

module.exports = {
  updateUserRules,
  toggleFavoriteRules,
  getUserByIdRules,
};
