const Blog = require("../models/Blog");
const User = require("../models/User");

// Get all approved blog posts (public)
exports.getBlogs = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { status: "approved" }; // Only show approved blogs

    if (category && category !== "Tất cả") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all blogs for admin (all statuses)
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const { category, search, status } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (category && category !== "Tất cả") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const blogs = await Blog.find(query)
      .populate("createdBy", "username fullName")
      .populate("reviewedBy", "username fullName")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my blogs (for landlord/admin to see their own posts)
exports.getMyBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending blogs (for admin review)
exports.getPendingBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "pending" })
      .populate("createdBy", "username fullName email")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single blog post
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // Only show approved blogs to public
    // Allow admin/owner to see any status
    const isAdmin = req.user && req.user.role === "admin";
    const isOwner =
      req.user && blog.createdBy.toString() === req.user._id.toString();

    if (blog.status !== "approved" && !isAdmin && !isOwner) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create blog post (Admin and Landlord)
exports.createBlog = async (req, res) => {
  try {
    const blogData = { ...req.body };

    // Set createdBy
    blogData.createdBy = req.user._id;
    blogData.authorId = req.user._id;

    // Auto-fill author info if missing
    if (!blogData.author && req.user) {
      blogData.author = req.user.fullName || req.user.username;
      blogData.authorAvatar = req.user.avatar;
    }

    // Auto-fill date if missing
    if (!blogData.date) {
      blogData.date = new Date().toLocaleDateString("vi-VN");
    }

    // Set status based on role and request
    // If status is "draft", keep it as draft regardless of role
    if (req.body.status === "draft") {
      blogData.status = "draft";
    } else if (req.user.role === "admin") {
      // Admin: auto-approved
      blogData.status = "approved";
      blogData.reviewedBy = req.user._id;
      blogData.reviewedAt = new Date();
    } else {
      // Landlord & User: pending review
      blogData.status = "pending";
    }

    const newBlog = new Blog(blogData);
    const savedBlog = await newBlog.save();

    // Send notification to admins if pending
    if (blogData.status === "pending") {
      const Notification = require("../models/Notification");
      const admins = await User.find({ role: "admin" });
      const notifications = admins.map((admin) => ({
        userId: admin._id,
        title: "Bài blog mới chờ duyệt",
        message: `Chủ trọ ${req.user.fullName || req.user.username} vừa đăng bài blog: "${savedBlog.title}".`,
        type: "info",
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    const message =
      req.user.role === "admin"
        ? "Blog created successfully"
        : "Blog submitted for review. It will be published after approval.";

    res.status(201).json({ blog: savedBlog, message });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update blog post (Admin or Owner)
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const isAdmin = req.user.role === "admin";
    const isOwner = blog.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this blog" });
    }

    // Landlord can only update their own pending/rejected blogs
    if (!isAdmin && blog.status === "approved") {
      return res
        .status(403)
        .json({
          message: "Cannot update approved blog. Contact admin for changes.",
        });
    }

    // Prevent changing critical fields by non-admin
    const updateData = { ...req.body };
    if (!isAdmin) {
      // Landlord/User can set to 'draft' or 'pending' (when submitting a draft)
      if (updateData.status && !["draft", "pending"].includes(updateData.status)) {
        delete updateData.status;
      }
      delete updateData.reviewedBy;
      delete updateData.reviewedAt;
      delete updateData.rejectionReason;
      delete updateData.featured;
      delete updateData.views;
      delete updateData.createdBy;
    }

    // If landlord updates a rejected blog, reset to pending
    if (!isAdmin && blog.status === "rejected") {
      updateData.status = "pending";
      updateData.rejectionReason = null;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );
    res.json(updatedBlog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete blog post (Admin or Owner)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const isAdmin = req.user.role === "admin";
    const isOwner = blog.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this blog" });
    }

    // Landlord can only delete their own pending/rejected blogs
    if (!isAdmin && blog.status === "approved") {
      return res
        .status(403)
        .json({
          message: "Cannot delete approved blog. Contact admin for removal.",
        });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve blog post (Admin only)
exports.approveBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.status = "approved";
    blog.reviewedBy = req.user._id;
    blog.reviewedAt = new Date();
    blog.rejectionReason = null;

    await blog.save();

    // Notify author
    const Notification = require("../models/Notification");
    await Notification.create({
      userId: blog.createdBy,
      title: "Blog đã được duyệt",
      message: `Bài blog "${blog.title}" của bạn đã được duyệt và hiển thị trên hệ thống.`,
      type: "success",
    });

    res.json({ message: "Blog approved successfully", blog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject blog post (Admin only)
exports.rejectBlog = async (req, res) => {
  try {
    const { reason } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.status = "rejected";
    blog.reviewedBy = req.user._id;
    blog.reviewedAt = new Date();
    blog.rejectionReason = reason || "Không đạt yêu cầu";

    await blog.save();

    // Notify author
    const Notification = require("../models/Notification");
    await Notification.create({
      userId: blog.createdBy,
      title: "Blog bị từ chối",
      message: `Bài blog "${blog.title}" của bạn đã bị từ chối. Lý do: ${blog.rejectionReason}`,
      type: "error",
    });

    res.json({ message: "Blog rejected", blog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle save blog (Bookmark)
exports.toggleSaveBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isSaved = user.savedBlogs.includes(blogId);

    if (isSaved) {
      // Remove from favorites
      user.savedBlogs = user.savedBlogs.filter((id) => id.toString() !== blogId);
      await user.save();
      return res.json({ message: "Removed from saved blogs", isSaved: false });
    } else {
      // Add to favorites
      user.savedBlogs.push(blogId);
      await user.save();
      return res.json({ message: "Added to saved blogs", isSaved: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get saved blogs
exports.getSavedBlogs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedBlogs",
      match: { status: "approved" }, // Only show approved blogs in saved list
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.savedBlogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
