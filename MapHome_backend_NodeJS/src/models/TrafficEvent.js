const mongoose = require("mongoose");

const TrafficEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["flood", "construction", "accident", "other"],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point", "LineString", "Polygon"],
        required: true,
      },
      coordinates: {
        type: mongoose.Schema.Types.Mixed, // Can be [Number], [[Number]], or [[[Number]]] based on type
        required: true,
      },
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    active: { type: Boolean, default: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
TrafficEventSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("TrafficEvent", TrafficEventSchema);
