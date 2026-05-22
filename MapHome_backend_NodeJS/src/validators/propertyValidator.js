const { body, query, param } = require("express-validator");

const createPropertyRules = [
  body("name")
    .notEmpty()
    .withMessage("Tên phòng trọ/căn hộ là bắt buộc")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Tên phải từ 5 đến 100 ký tự"),

  body("address")
    .notEmpty()
    .withMessage("Địa chỉ là bắt buộc")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Địa chỉ phải từ 5 đến 200 ký tự"),

  body("price")
    .notEmpty()
    .withMessage("Giá thuê là bắt buộc")
    .isNumeric()
    .withMessage("Giá thuê phải là số")
    .isFloat({ min: 0 })
    .withMessage("Giá thuê phải là số dương"),

  body("area")
    .notEmpty()
    .withMessage("Diện tích là bắt buộc")
    .isNumeric()
    .withMessage("Diện tích phải là số")
    .isFloat({ min: 0.1, max: 10000 })
    .withMessage("Diện tích phải từ 0.1 đến 10000 m²"),

  body("location")
    .notEmpty()
    .withMessage("Vị trí là bắt buộc")
    .isArray({ min: 2, max: 2 })
    .withMessage("Vị trí phải là mảng [longitude, latitude]")
    .custom((value) => {
      if (typeof value[0] !== "number" || typeof value[1] !== "number") {
        throw new Error("Kinh độ và vĩ độ phải là số");
      }
      if (value[0] < -180 || value[0] > 180)
        throw new Error("Kinh độ không hợp lệ (phải từ -180 đến 180)");
      if (value[1] < -90 || value[1] > 90)
        throw new Error("Vĩ độ không hợp lệ (phải từ -90 đến 90)");
      return true;
    }),

  body("phone")
    .notEmpty()
    .withMessage("Số điện thoại là bắt buộc")
    .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)
    .withMessage(
      "Số điện thoại không hợp lệ (VD: 0912345678 hoặc 84912345678)",
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Mô tả không được vượt quá 2000 ký tự"),

  body("status")
    .optional()
    .isIn(["pending", "approved", "rejected", "reported"])
    .withMessage("Trạng thái không hợp lệ"),
];

const updatePropertyRules = [
  param("id").isMongoId().withMessage("ID bất động sản không hợp lệ"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Tên phải từ 5 đến 100 ký tự"),
  body("address")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Địa chỉ phải từ 5 đến 200 ký tự"),
  body("price")
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage("Giá thuê phải là số dương"),
  body("area")
    .optional()
    .isNumeric()
    .isFloat({ min: 0.1, max: 10000 })
    .withMessage("Diện tích phải từ 0.1 đến 10000 m²"),
  body("location")
    .optional()
    .isArray({ min: 2, max: 2 })
    .custom((value) => {
      if (typeof value[0] !== "number" || typeof value[1] !== "number") {
        throw new Error("Kinh độ và vĩ độ phải là số");
      }
      if (value[0] < -180 || value[0] > 180)
        throw new Error("Kinh độ không hợp lệ");
      if (value[1] < -90 || value[1] > 90)
        throw new Error("Vĩ độ không hợp lệ");
      return true;
    }),
  body("phone")
    .optional()
    .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)
    .withMessage("Số điện thoại không hợp lệ"),
  body("status")
    .optional()
    .isIn(["pending", "approved", "rejected", "reported"])
    .withMessage("Trạng thái không hợp lệ"),
];

const nearbyPropertiesRules = [
  query("lat")
    .notEmpty()
    .withMessage("Vĩ độ (lat) là bắt buộc")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Vĩ độ không hợp lệ (phải từ -90 đến 90)"),

  query("lng")
    .notEmpty()
    .withMessage("Kinh độ (lng) là bắt buộc")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Kinh độ không hợp lệ (phải từ -180 đến 180)"),

  query("radius")
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage("Bán kính tìm kiếm phải từ 0.1km đến 100km"),
];

const searchPropertiesRules = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Trang phải lớn hơn hoặc bằng 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Giới hạn phải từ 1 đến 100"),
  query("minPrice")
    .optional()
    .isNumeric()
    .withMessage("Giá tối thiểu phải là số"),
  query("maxPrice").optional().isNumeric().withMessage("Giá tối đa phải là số"),
  query("minArea")
    .optional()
    .isNumeric()
    .withMessage("Diện tích tối thiểu phải là số"),
  query("maxArea")
    .optional()
    .isNumeric()
    .withMessage("Diện tích tối đa phải là số"),
  query("lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Vĩ độ không hợp lệ"),
  query("lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Kinh độ không hợp lệ"),
  query("radius")
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage("Bán kính không hợp lệ"),
];

module.exports = {
  createPropertyRules,
  updatePropertyRules,
  nearbyPropertiesRules,
  searchPropertiesRules,
};
