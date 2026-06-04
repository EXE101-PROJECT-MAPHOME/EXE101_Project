const { body, param } = require("express-validator");

const createBookingRules = [
  body("propertyId")
    .notEmpty().withMessage("Property ID is required").bail()
    .isMongoId().withMessage("Invalid Property ID format"),
    
  body("customerName")
    .notEmpty().withMessage("Customer name is required").bail()
    .trim()
    .isLength({ min: 2 }).withMessage("Customer name must be at least 2 characters long"),
    
  body("customerPhone")
    .notEmpty().withMessage("Customer phone is required").bail()
    .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/).withMessage("Invalid Vietnamese phone number format"),
    
  body("bookingDate")
    .notEmpty().withMessage("Booking date is required").bail()
    .isISO8601().withMessage("Booking date must be a valid ISO8601 date (YYYY-MM-DD)"),
    
  body("bookingTime")
    .notEmpty().withMessage("Booking time is required").bail()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage("Booking time must be in HH:MM format"),
    
  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Note cannot exceed 500 characters"),
];

const updateBookingStatusRules = [
  param("id")
    .isMongoId().withMessage("Invalid Booking ID format"),
    
  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["pending", "confirmed", "cancelled", "completed"]).withMessage("Invalid status value"),
];

module.exports = {
  createBookingRules,
  updateBookingStatusRules,
};
