const { query } = require("express-validator");

/**
 * Validation rules for Map API
 */
const geocodeRules = [
  query("lat")
    .notEmpty().withMessage("Vĩ độ (lat) là bắt buộc")
    .isFloat({ min: -90, max: 90 }).withMessage("Vĩ độ không hợp lệ"),
    
  query("lng")
    .notEmpty().withMessage("Kinh độ (lng) là bắt buộc")
    .isFloat({ min: -180, max: 180 }).withMessage("Kinh độ không hợp lệ"),
];

const autocompleteRules = [
  query("input")
    .trim()
    .notEmpty().withMessage("Nội dung tìm kiếm không được để trống")
    .isLength({ min: 2 }).withMessage("Nội dung tìm kiếm quá ngắn"),
];

const placeDetailRules = [
  query("place_id")
    .notEmpty().withMessage("Place ID là bắt buộc"),
];

module.exports = {
  geocodeRules,
  autocompleteRules,
  placeDetailRules,
};
