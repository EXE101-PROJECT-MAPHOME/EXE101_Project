const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Landlord = require("../models/Landlord");
const { sendEmail, getNewPasswordTemplate } = require("../utils/mailHelper");
const { sendSMS } = require("../services/smsService");
const NodeCache = require("node-cache");

// OTP cache: expires in 5 minutes (300 seconds)
const otpCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const generateRandomPassword = (length = 8) => {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const allChars = letters + digits;
  let password = "";

  // Đảm bảo có ít nhất 1 chữ cái và 1 chữ số
  password += letters.charAt(Math.floor(Math.random() * letters.length));
  password += digits.charAt(Math.floor(Math.random() * digits.length));

  for (let i = 2; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Trộn ngẫu nhiên các ký tự
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET || "refresh_secret",
    { expiresIn: "30d" },
  );

  return { accessToken, refreshToken };
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, role } = req.body;

    // Normalize role values from frontend labels if necessary
    let normalizedRole = "user";
    if (role) {
      const r = String(role).toLowerCase();
      if (
        r.includes("landlord") ||
        r.includes("chutro") ||
        r.includes("chủ") ||
        r.includes("owner")
      ) {
        normalizedRole = "landlord";
      } else if (r.includes("admin")) {
        normalizedRole = "admin";
      } else {
        normalizedRole = "user";
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashed,
      fullName,
      phone,
      role: normalizedRole,
    });

    // Auto-create Landlord profile if role is landlord
    if (normalizedRole === "landlord") {
      await Landlord.create({
        name: fullName || username,
        phone: phone || "0000000000",
        email,
        userId: user._id,
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    setRefreshTokenCookie(res, refreshToken);

    const userSafe = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      verificationLevel: user.verificationLevel,
    };

    res.status(201).json({
      message: "User registered",
      user: userSafe,
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    // Support login by username, email, or phone
    const { usernameOrEmail, username, email, phone, password } = req.body;
    const identifier = (
      usernameOrEmail ||
      email ||
      username ||
      phone ||
      ""
    ).toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Username, email, phone, or password is missing",
      });
    }

    const user = await User.findOne({
      $or: [
        { username: { $regex: `^${identifier}$`, $options: "i" } },
        { email: { $regex: `^${identifier}$`, $options: "i" } },
        { phone: identifier }, // Phone exact match
      ],
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (user.status === "blocked") {
      return res
        .status(403)
        .json({ message: "Account is blocked. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    setRefreshTokenCookie(res, refreshToken);

    const userSafe = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      verificationLevel: user.verificationLevel,
    };

    // Record login history
    const userAgent = req.headers["user-agent"] || "Unknown";
    const ip = req.ip || req.connection.remoteAddress;

    // Simple parsing for demo (real world would use 'useragent' lib)
    let browser = "Other";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      browser = "Safari";

    let os = "Other";
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad"))
      os = "iOS";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("Mac OS")) os = "MacOS";

    // Use findByIdAndUpdate to avoid version conflicts
    const newLoginEntry = {
      device: userAgent.substring(0, 50),
      ip,
      browser,
      os,
      lastLogin: new Date(),
    };

    // Update user with new login history (keep last 10)
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $push: {
          "security.loginHistory": {
            $each: [newLoginEntry],
            $slice: -10, // Keep only last 10 records
          },
        },
      },
      { new: true },
    );

    res.status(200).json({ user: userSafe, token: accessToken });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Incorrect current password" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("[Auth Error]:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User with this email not found" });

    // 1. Generate a new random password
    const newPlainPassword = generateRandomPassword(8);

    // 2. Hash and save the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPlainPassword, salt);

    // Clear any existing reset tokens for safety
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // 3. Send email with the new password
    const emailHtml = getNewPasswordTemplate(
      user.username || "Người dùng",
      newPlainPassword,
    );

    try {
      await sendEmail(email, "Mật khẩu mới của bạn từ MapHome", emailHtml);

      res.status(200).json({
        message:
          "Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác).",
      });
    } catch (mailError) {
      console.error("Failed to send email:", mailError);
      // In development, you might want to return the password in the response if mail fails
      // but for production, this should be logged and handled.
      res.status(500).json({
        message:
          "Không thể gửi email. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
        // devOnlyPassword: newPlainPassword
      });
    }
  } catch (error) {
    console.error("[Auth Error]:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/verify-reset-code
const verifyResetCode = async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ message: "Email and token required" });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    res.status(200).json({ message: "Token is valid" });
  } catch (error) {
    console.error("[Auth Error]:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password required" });
    }

    const query = {
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    };

    // Also include email in query if provided for extra safety
    if (email) query.email = email;

    const user = await User.findOne(query);

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("[Auth Error]:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { idToken, accessToken, role } = req.body;
    if (!idToken && !accessToken) {
      return res
        .status(400)
        .json({ message: "Google ID Token or Access Token required" });
    }

    let payload;
    let googleId, email, name, picture;

    if (idToken) {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else {
      // Verify using accessToken
      client.setCredentials({ access_token: accessToken });
      const userInfo = await client.request({
        url: "https://www.googleapis.com/oauth2/v3/userinfo",
      });
      payload = userInfo.data;
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Normalize role if provided
      let normalizedRole = "user";
      if (role) {
        const r = String(role).toLowerCase();
        if (
          r.includes("landlord") ||
          r.includes("chutro") ||
          r.includes("chủ") ||
          r.includes("owner")
        ) {
          normalizedRole = "landlord";
        } else if (r.includes("admin")) {
          normalizedRole = "admin";
        } else {
          normalizedRole = "user";
        }
      }

      // Create new user if not exists
      const username =
        email.split("@")[0] + "_" + Math.floor(Math.random() * 1000);
      user = await User.create({
        username,
        email,
        googleId,
        fullName: name,
        role: normalizedRole,
        avatar: picture || "",
        status: "active",
      });

      // Auto-create Landlord profile if role is landlord
      if (normalizedRole === "landlord") {
        await Landlord.create({
          name: name || username,
          email,
          userId: user._id,
        });
      }
    } else if (!user.googleId) {
      // Link googleId to existing user with same email
      user.googleId = googleId;
      await user.save();
    }

    if (user.status === "blocked") {
      return res
        .status(403)
        .json({ message: "Account is blocked. Please contact support." });
    }

    const { accessToken: generatedAccessToken, refreshToken } = generateTokens(
      user._id,
      user.role,
    );
    setRefreshTokenCookie(res, refreshToken);

    const userSafe = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      verificationLevel: user.verificationLevel,
      picture,
    };

    res.status(200).json({ user: userSafe, token: generatedAccessToken });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: "Refresh token missing" });

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || "refresh_secret",
    );
    const user = await User.findById(decoded.id);

    if (!user)
      return res.status(401).json({ message: "Invalid refresh token" });
    if (user.status === "blocked")
      return res.status(403).json({ message: "Account is blocked" });

    const tokens = generateTokens(user._id, user.role);
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({ token: tokens.accessToken });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password-phone
const forgotPasswordPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res.status(400).json({ message: "Số điện thoại là bắt buộc" });

    const user = await User.findOne({ phone });
    if (!user)
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng với số điện thoại này" });

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save OTP to cache
    otpCache.set(`otp_${phone}`, otp);

    // DEBUG: Log OTP to console
    console.log(`
╔═══════════════════════════════════════╗
║         🔐 OTP GENERATED 🔐           ║
╠═══════════════════════════════════════╣
║ Phone:  ${phone}
║ OTP:    ${otp}
║ Valid:  5 minutes
║ Cache:  Set ✓
╚═══════════════════════════════════════╝
    `);

    // 3. Send SMS
    const smsResult = await sendSMS(
      phone,
      `Ma OTP xac thuc doi mat khau MapHome cua ban la: ${otp}. Ma co hieu luc trong 5 phut.`,
    );

    if (smsResult.CodeResult !== "100") {
      const errorMsg =
        smsResult.ErrorMessage || "Lỗi khi gửi SMS. Vui lòng thử lại sau.";
      console.error("[SMS Error]:", errorMsg);
      return res.status(400).json({
        message: `Lỗi gửi SMS: ${errorMsg}. Vui lòng liên hệ Admin hoặc thử lại sau.`,
      });
    }

    // If SMS simulated in dev mode, still return success
    if (smsResult.simulated) {
      console.log("[SMS Simulated] OTP:", otp, "Phone:", phone);
    }

    res.status(200).json({
      message: "Mã OTP đã được gửi đến số điện thoại của bạn.",
    });
  } catch (error) {
    console.error("[Auth Error]:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/verify-otp-phone
const verifyOtpPhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res
        .status(400)
        .json({ message: "Số điện thoại và mã OTP là bắt buộc" });
    }

    const cachedOtp = otpCache.get(`otp_${phone}`);

    if (!cachedOtp || cachedOtp !== otp) {
      return res
        .status(400)
        .json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }

    // OTP is valid, create a temporary reset token valid for 10 minutes
    const resetToken = jwt.sign(
      { phone, type: "phone_reset" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "10m" },
    );

    res.status(200).json({
      message: "Xác thực OTP thành công",
      resetToken,
    });
  } catch (error) {
    console.error("[Auth Error]:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/reset-password-phone
const resetPasswordPhone = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token và mật khẩu mới là bắt buộc" });
    }

    // Verify reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || "secret");
    if (decoded.type !== "phone_reset") {
      return res.status(400).json({ message: "Token không hợp lệ" });
    }

    const user = await User.findOne({ phone: decoded.phone });
    if (!user)
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Clear OTP from cache just in case
    otpCache.del(`otp_${decoded.phone}`);

    res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("[Auth Error]:", error.message);
    res.status(500).json({ message: "Token đã hết hạn hoặc không hợp lệ" });
  }
};

// POST /api/auth/check-phone-exists
const checkPhoneExists = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        message: "Số điện thoại này chưa được đăng ký trong hệ thống",
      });
    }
    res.status(200).json({ message: "Số điện thoại hợp lệ" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/send-otp-phone
// Gửi OTP tới bất kỳ số điện thoại nào (dùng cho verification, booking, v.v)
const sendOtpToPhone = async (req, res) => {
  try {
    const { phone, purpose = "verification" } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Số điện thoại là bắt buộc" });
    }

    // 1. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save OTP to cache with purpose (expires in 5 minutes)
    otpCache.set(`otp_${phone}_${purpose}`, otp);

    // DEBUG: Log OTP to console
    console.log(`
╔═══════════════════════════════════════╗
║         🔐 OTP GENERATED 🔐           ║
╠═══════════════════════════════════════╣
║ Phone:   ${phone}
║ Purpose: ${purpose}
║ OTP:     ${otp}
║ Valid:   5 minutes
╚═══════════════════════════════════════╝
    `);

    // 3. Build message based on purpose
    let message;
    switch (purpose) {
      case "booking":
        message = `Ma OTP xac thuc booking MapHome: ${otp}. Co hieu luc trong 5 phut.`;
        break;
      case "verification":
        message = `Ma OTP xac thuc MapHome: ${otp}. Co hieu luc trong 5 phut.`;
        break;
      case "contact":
        message = `Ma OTP xac thuc lien he MapHome: ${otp}. Co hieu luc trong 5 phut.`;
        break;
      default:
        message = `Ma OTP MapHome: ${otp}. Co hieu luc trong 5 phut.`;
    }

    // 4. Send SMS
    const smsResult = await sendSMS(phone, message);

    if (smsResult.CodeResult !== "100") {
      const errorMsg =
        smsResult.ErrorMessage || "Lỗi khi gửi SMS. Vui lòng thử lại sau.";
      console.error("[SMS Error]:", errorMsg);
      return res.status(400).json({
        message: `Lỗi gửi SMS: ${errorMsg}. Vui lòng liên hệ Admin hoặc thử lại sau.`,
      });
    }

    // If SMS simulated in dev mode, still return success
    if (smsResult.simulated) {
      console.log(
        "[SMS Simulated] OTP:",
        otp,
        "Phone:",
        phone,
        "Purpose:",
        purpose,
      );
    }

    res.status(200).json({
      message: "Mã OTP đã được gửi đến số điện thoại.",
      purpose,
    });
  } catch (error) {
    console.error("[Auth Error]:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/verify-otp-general
// Verify OTP cho bất kỳ purpose nào (not just password reset)
const verifyOtpGeneral = async (req, res) => {
  try {
    const { phone, otp, purpose = "verification" } = req.body;

    if (!phone || !otp) {
      return res
        .status(400)
        .json({ message: "Số điện thoại và mã OTP là bắt buộc" });
    }

    const cachedOtp = otpCache.get(`otp_${phone}_${purpose}`);

    if (!cachedOtp || cachedOtp !== otp) {
      return res
        .status(400)
        .json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }

    // Clear OTP from cache after verification
    otpCache.del(`otp_${phone}_${purpose}`);

    // Return success - client can use this for their logic
    res.status(200).json({
      message: "Xác thực OTP thành công",
      phone,
      purpose,
      verified: true,
    });
  } catch (error) {
    console.error("[Auth Error]:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    // Clear the refresh token cookie
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    console.error("[Auth Error]:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/admin-exists
// Public endpoint to check if at least one admin account exists
const checkAdminExists = async (req, res, next) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    res.status(200).json({ exists: adminCount > 0, count: adminCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
  sendOtpToPhone,
  verifyOtpGeneral,
  googleLogin,
  refresh,
  logout,
  checkAdminExists,
};
