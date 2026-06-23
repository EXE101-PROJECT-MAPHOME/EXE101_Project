const mongoose = require("mongoose");

const BrokerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String, default: "" },
    totalListings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    joinedDate: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Broker", BrokerSchema);
