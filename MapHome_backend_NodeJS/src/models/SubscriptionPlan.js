const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true }, // e.g., 'free', 'basic', 'standard', 'pro'
    name: { type: String, required: true },
    price: { type: Number, required: true },
    yearlyPrice: { type: Number, required: true },
    termDays: { type: Number, default: 30 }, // Số ngày có hiệu lực sau khi kích hoạt (admin cấu hình)
    description: { type: String },
    features: [
      {
        text: { type: String, required: true },
        included: { type: Boolean, default: true },
      },
    ],
    badge: { type: String },
    badgeColor: { type: String },
    icon: { type: String }, // Icon identifier like 'Home', 'MapPin', etc.
    cta: { type: String },
    ctaVariant: { type: String, default: "default" },
    highlighted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    targetRole: {
      type: String,
      enum: ["all", "landlord", "broker"],
      default: "landlord",
    }, // Phân loại đối tượng áp dụng gói: tất cả, chủ nhà, hoặc môi giới
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
