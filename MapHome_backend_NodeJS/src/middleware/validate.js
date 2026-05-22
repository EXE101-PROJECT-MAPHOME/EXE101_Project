const { validationResult } = require("express-validator");

/**
 * Middleware to check for validation errors
 * If errors exist, returns a 400 Bad Request with the errors array
 * Format: { success: false, message: "Validation failed", errors: [{ field, message }] }
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param, // Express validator uses 'path' for body/query/param
      message: err.msg,
      value: err.value, // Include the value for debugging
    }));

    console.log("[Validation Error]", {
      method: req.method,
      path: req.path,
      errors: formattedErrors,
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
  }
  next();
};

module.exports = validate;
