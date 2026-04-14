/**
 * Centralized Error Handling Middleware
 * Ensures all API errors return a consistent JSON format
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Lỗi máy chủ nội bộ";

  // Handle specific Mongoose errors
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Tài nguyên không tìm thấy (ID không hợp lệ)";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  } else if (err.code === 11000) {
    statusCode = 400;
    message = "Dữ liệu đã tồn tại (Duplicate field error)";
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token không hợp lệ";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Phiên đăng nhập đã hết hạn";
  }

  console.error(`[Error] ${req.method} ${req.url}:`, {
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = errorHandler;
