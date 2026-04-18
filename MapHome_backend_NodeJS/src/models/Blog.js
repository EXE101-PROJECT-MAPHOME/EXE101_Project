const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String },
    author: { type: String, required: true },
    authorAvatar: { type: String },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: { type: String },
    image: { type: String },
    category: { type: String, required: true },
    readTime: { type: String },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false },
    // Approval system fields
    status: {
      type: String,
      enum: ["approved", "pending", "rejected", "draft"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Blog", BlogSchema);
