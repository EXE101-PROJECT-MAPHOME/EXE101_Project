const { body, query, param } = require("express-validator");

const createPropertyRules = [
  body("name")
    .notEmpty().withMessage("Property name is required")
    .trim()
    .isLength({ min: 5, max: 100 }).withMessage("Name must be between 5 and 100 characters"),
    
  body("address")
    .notEmpty().withMessage("Address is required")
    .trim(),
    
  body("price")
    .notEmpty().withMessage("Price is required")
    .isNumeric().withMessage("Price must be a number")
    .isFloat({ min: 0 }).withMessage("Price must be a positive number"),
    
  body("area")
    .notEmpty().withMessage("Area is required")
    .isNumeric().withMessage("Area must be a number")
    .isFloat({ min: 0 }).withMessage("Area must be a positive number"),
    
  body("location")
    .isArray({ min: 2, max: 2 }).withMessage("Location must be an array of [latitude, longitude]")
    .custom((value) => {
      if (typeof value[0] !== "number" || typeof value[1] !== "number") {
        throw new Error("Latitude and longitude must be numbers");
      }
      if (value[0] < -180 || value[0] > 180) throw new Error("Invalid longitude");
      if (value[1] < -90 || value[1] > 90) throw new Error("Invalid latitude");
      return true;
    }),
    
  body("phone")
    .notEmpty().withMessage("Phone number is required")
    .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/).withMessage("Invalid Vietnamese phone number format"),
    
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters"),

  body("status")
    .optional()
    .isIn(["pending", "approved", "rejected", "reported"]).withMessage("Invalid status"),
];

const updatePropertyRules = [
  param("id")
    .isMongoId().withMessage("Invalid Property ID format"),
    
  body("name").optional().trim().isLength({ min: 5, max: 100 }),
  body("address").optional().trim(),
  body("price").optional().isNumeric().isFloat({ min: 0 }),
  body("area").optional().isNumeric().isFloat({ min: 0 }),
  body("location")
    .optional()
    .isArray({ min: 2, max: 2 })
    .custom((value) => {
      if (typeof value[0] !== "number" || typeof value[1] !== "number") {
        throw new Error("Latitude and longitude must be numbers");
      }
      if (value[0] < -180 || value[0] > 180) throw new Error("Invalid longitude");
      if (value[1] < -90 || value[1] > 90) throw new Error("Invalid latitude");
      return true;
    }),
  body("phone").optional().matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/),
  body("status").optional().isIn(["pending", "approved", "rejected", "reported"]),
];

const nearbyPropertiesRules = [
  query("lat")
    .notEmpty().withMessage("Vĩ độ (lat) là bắt buộc")
    .isFloat({ min: -90, max: 90 }).withMessage("Vĩ độ không hợp lệ (phải từ -90 đến 90)"),
    
  query("lng")
    .notEmpty().withMessage("Kinh độ (lng) là bắt buộc")
    .isFloat({ min: -180, max: 180 }).withMessage("Kinh độ không hợp lệ (phải từ -180 đến 180)"),
    
  query("radius")
    .optional()
    .isFloat({ min: 0.1, max: 100 }).withMessage("Bán kính tìm kiếm phải từ 0.1km đến 100km"),
];

const searchPropertiesRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be at least 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("minPrice").optional().isNumeric(),
  query("maxPrice").optional().isNumeric(),
  query("minArea").optional().isNumeric(),
  query("maxArea").optional().isNumeric(),
  query("lat").optional().isFloat({ min: -90, max: 90 }).withMessage("Vĩ độ không hợp lệ"),
  query("lng").optional().isFloat({ min: -180, max: 180 }).withMessage("Kinh độ không hợp lệ"),
  query("radius").optional().isFloat({ min: 0.1, max: 100 }).withMessage("Bán kính không hợp lệ"),
];

module.exports = {
  createPropertyRules,
  updatePropertyRules,
  nearbyPropertiesRules,
  searchPropertiesRules,
};
