const express = require("express");
const router = express.Router();
const {
  register,
  login,
  changePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  forgotPasswordPhone,
  verifyOtpPhone,
  resetPasswordPhone,
  checkPhoneExists,
  googleLogin,
  refresh,
  logout,
  checkAdminExists,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  verifyResetCodeRules,
  resetPasswordRules,
  changePasswordRules,
} = require("../validators/authValidator");

const validate = require("../middleware/validate");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               username:
 *                 type: string
 *                 example: chutro123
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               confirmPassword:
 *                 type: string
 *                 example: password123
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               phone:
 *                 type: string
 *                 example: +84912345678
 *               role:
 *                 type: string
 *                 description: Role value (e.g. "landlord" or "user")
 *                 example: landlord
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Bad request or user already exists
 */
router.post("/register", registerRules, validate, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usernameOrEmail
 *               - password
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 description: Username or Email
 *                 example: user123
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginRules, validate, login);

/**
 * @swagger
 * /api/auth/refresh:
 *   get:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token from cookies
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Refresh token missing or invalid
 */
router.get("/refresh", refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Clear authentication cookies
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", logout);

// GET /api/auth/admin-exists - Public: check if an admin account already exists
router.get("/admin-exists", checkAdminExists);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Get the profile of the currently authenticated user
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get("/me", authMiddleware, (req, res) => res.status(200).json(req.user));

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Google login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       500:
 *         description: Error verifying token
 */
router.post("/google", googleLogin);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Incorrect current password
 */
router.put(
  "/change-password",
  authMiddleware,
  changePasswordRules,
  validate,
  changePassword,
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token sent
 */
router.post("/forgot-password", forgotPasswordRules, validate, forgotPassword);

/**
 * @swagger
 * /api/auth/verify-reset-code:
 *   post:
 *     summary: Verify password reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *             properties:
 *               email:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/verify-reset-code",
  verifyResetCodeRules,
  validate,
  verifyResetCode,
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 description: Optional email for extra verification
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post("/reset-password", resetPasswordRules, validate, resetPassword);

/**
 * @swagger
 * /api/auth/forgot-password-phone:
 *   post:
 *     summary: Request OTP via phone
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post("/forgot-password-phone", forgotPasswordPhone);

/**
 * @swagger
 * /api/auth/verify-otp-phone:
 *   post:
 *     summary: Verify OTP from phone
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP valid, returns reset token
 */
router.post("/verify-otp-phone", verifyOtpPhone);

/**
 * @swagger
 * /api/auth/reset-password-phone:
 *   post:
 *     summary: Reset password with phone reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post("/reset-password-phone", resetPasswordPhone);

// Phone Auth Routes
router.post("/check-phone-exists", checkPhoneExists);

module.exports = router;
