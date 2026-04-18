const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },

    fullName: { type: String },
    phone: { type: String },
    role: {
      type: String,
      enum: ["admin", "landlord", "user"],
      default: "user",
    },
    avatar: { type: String, default: "" }, // user profile picture URL
    verificationLevel: { type: Number, default: 1 },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    savedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Personalized settings
    searchPreferences: {
      districts: [{ type: String }],
      priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 50000000 },
      },
    },
    privacySettings: {
      showPhoneBeforeBooking: { type: Boolean, default: true },
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      loginHistory: [
        {
          device: String,
          ip: String,
          browser: String,
          os: String,
          lastLogin: { type: Date, default: Date.now },
        },
      ],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
