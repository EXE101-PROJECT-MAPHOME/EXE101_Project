const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const {
  authMiddleware,
  requireAnyRole,
} = require("../middleware/authMiddleware");
const { blogRules, rejectBlogRules } = require("../validators/blogValidator");
const validate = require("../middleware/validate");

// Helper middleware to require auth for optional routes
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authMiddleware(req, res, next);
  }
  next();
};

// Public routes (only show approved blogs)
/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get all approved blog posts
 *     tags: [Blog]
 *     responses:
 *       200:
 *         description: List of approved blog posts
 */
router.get("/", blogController.getBlogs);

// Protected routes for Admin and Landlord

/**
 * @swagger
 * /api/blogs/my-blogs:
 *   get:
 *     summary: Get my blog posts (all statuses)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of my blog posts
 */
router.get(
  "/my-blogs",
  authMiddleware,
  requireAnyRole(["admin", "landlord", "user"]),
  blogController.getMyBlogs,
);

/**
 * @swagger
 * /api/blogs/pending:
 *   get:
 *     summary: Get pending blog posts (Admin only)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending blog posts
 */
router.get(
  "/pending",
  authMiddleware,
  requireAnyRole(["admin"]),
  blogController.getPendingBlogs,
);

/**
 * @swagger
 * /api/blogs/admin/all:
 *   get:
 *     summary: Get all blog posts with filters (Admin only)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all blog posts
 */
router.get(
  "/admin/all",
  authMiddleware,
  requireAnyRole(["admin"]),
  blogController.getAllBlogsAdmin,
);

// Admin and Landlord routes

/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Create a new blog post (Admin auto-approved, Landlord pending)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, excerpt, category]
 *             properties:
 *               title: { type: string }
 *               excerpt: { type: string }
 *               content: { type: string }
 *               category: { type: string }
 *               image: { type: string }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Blog created or submitted for review
 */
router.post(
  "/",
  authMiddleware,
  requireAnyRole(["admin", "landlord", "user"]),
  blogRules,
  validate,
  blogController.createBlog,
);

/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     summary: Update a blog post (Admin any, Landlord only their pending/rejected)
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blog updated
 */
router.put(
  "/:id",
  authMiddleware,
  requireAnyRole(["admin", "landlord", "user"]),
  blogRules,
  validate,
  blogController.updateBlog,
);

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Delete a blog post (Admin any, Landlord only their pending/rejected)
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blog deleted
 */
router.delete(
  "/:id",
  authMiddleware,
  requireAnyRole(["admin", "landlord", "user"]),
  blogController.deleteBlog,
);

// Admin approval routes

/**
 * @swagger
 * /api/blogs/{id}/approve:
 *   put:
 *     summary: Approve a pending blog post (Admin only)
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blog approved
 */
router.put(
  "/:id/approve",
  authMiddleware,
  requireAnyRole(["admin"]),
  blogController.approveBlog,
);

/**
 * @swagger
 * /api/blogs/{id}/reject:
 *   put:
 *     summary: Reject a pending blog post (Admin only)
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blog rejected
 */
router.put(
  "/:id/reject",
  authMiddleware,
  requireAnyRole(["admin"]),
  rejectBlogRules,
  validate,
  blogController.rejectBlog,
);

// Bookmark/Save routes

/**
 * @swagger
 * /api/blogs/me/saved:
 *   get:
 *     summary: Get current user's saved blog posts
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved blog posts
 */
router.get("/me/saved", authMiddleware, blogController.getSavedBlogs);

/**
 * @swagger
 * /api/blogs/{id}/save:
 *   post:
 *     summary: Toggle save/bookmark for a blog post
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success message with save status
 */
router.post("/:id/save", authMiddleware, blogController.toggleSaveBlog);

/**
 * @swagger
 * /api/blogs/{id}:
 *   get:
 *     summary: Get single blog post by ID
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blog post data
 */
router.get("/:id", optionalAuthMiddleware, blogController.getBlogById);

module.exports = router;
