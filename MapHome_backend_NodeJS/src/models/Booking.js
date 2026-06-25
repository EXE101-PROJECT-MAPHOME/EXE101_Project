const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: "Landlord" },
    brokerId: { type: mongoose.Schema.Types.ObjectId, ref: "Broker" },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    note: { type: String },
    bookingDate: { type: Date, required: true },
    bookingTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "landlord_proposed", "tenant_rejected"],
      default: "pending",
    },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", BookingSchema);
