const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    address: { type: String, required: true },
    district: { type: String }, // Quận/Huyện
    price: { type: Number, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude] per GeoJSON spec
        required: true,
      },
    },
    amenities: {
      type: Map,
      of: Boolean,
      default: {},
    },
    image: { type: String }, // Deprecated: kept for backward compatibility. Use 'images' instead.
    images: {
      type: [String],
      default: [],
    },
    area: { type: Number, required: true },
    available: { type: Boolean, default: true },
    phone: { type: String, required: true },
    ownerName: { type: String, required: true },
    verificationLevel: {
      type: String,
      enum: ["unverified", "phone-verified", "location-verified"],
      default: "unverified",
    },
    verifiedAt: { type: Date },
    locationAccuracy: { type: Number },
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: "Landlord" },
    pinInfo: {
      pinnedAt: { type: Date },
      pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Landlord" },
      note: { type: String },
      photoAtPin: { type: String },
    },
    greenBadge: {
      level: { type: String, enum: ["none", "verified"], default: "none" },
      awardedAt: { type: Date },
      awardedBy: { type: String },
      inspectionNotes: { type: String },
    },
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "reported", "expired"],
      default: "pending",
    },
    expiryDate: { type: Date },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

PropertySchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Property", PropertySchema);
