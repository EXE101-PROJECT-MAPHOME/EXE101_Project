const { body } = require("express-validator");

/**
 * Validation rules for AI Chat
 */
const chatRules = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Tin nhắn không được để trống")
    .isLength({ min: 2, max: 1000 })
    .withMessage("Tin nhắn phải từ 2 đến 1000 ký tự"),

  body("propertyId")
    .optional()
    .isMongoId()
    .withMessage("ID phòng trọ không hợp lệ"),

  body("history")
    .optional()
    .isArray()
    .withMessage("Lịch sử trò chuyện phải là một mảng")
    .custom((history) => {
      if (history) {
        for (const msg of history) {
          if (!msg.role || !msg.content) {
            throw new Error("Mỗi tin nhắn trong lịch sử phải có role và content");
          }
          if (!["user", "assistant", "system"].includes(msg.role)) {
            throw new Error("Role của tin nhắn không hợp lệ");
          }
        }
      }
      return true;
    }),
];

module.exports = {
  chatRules,
};
