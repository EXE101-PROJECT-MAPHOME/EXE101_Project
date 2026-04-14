const mongoose = require("mongoose");

const SystemSettingSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: "MapHome" },
    contactPhone: { type: String, default: "0123456789" },
    contactEmail: { type: String, default: "support@maphome.com" },
    maintenanceMode: { type: Boolean, default: false },
    pricing: {
      basicVerification: { type: Number, default: 0 },
      premiumVerification: { type: Number, default: 0 },
      postRoomFee: { type: Number, default: 0 },
      pushRoomFee: { type: Number, default: 0 },
      urgentRoomFee: { type: Number, default: 0 },
      commissionRate: { type: Number, default: 0 }, // percentage
    },
    broadcastMessage: { type: String, default: "" },
    isBroadcastEnabled: { type: Boolean, default: false },
    banners: [
      {
        title: { type: String },
        imageUrl: { type: String, required: true },
        link: { type: String },
        active: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
      },
    ],
    seo: {
      title: { type: String, default: "MapHome - Tìm trọ thông minh" },
      description: {
        type: String,
        default: "Nền tảng tìm kiếm và xác thực phòng trọ hàng đầu.",
      },
      keywords: { type: String, default: "phòng trọ, tìm trọ, maphome" },
    },
    policies: {
      termsOfService: { type: String, default: "" },
      privacyPolicy: { type: String, default: "" },
    },
    automation: {
      defaultExpiryDays: { type: Number, default: 30 },
      urgentDurationDays: { type: Number, default: 7 },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemSetting", SystemSettingSchema);
