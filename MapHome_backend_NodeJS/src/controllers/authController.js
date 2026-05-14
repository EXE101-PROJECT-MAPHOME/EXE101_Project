const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Landlord = require("../models/Landlord");
const { sendEmail, getNewPasswordTemplate } = require("../utils/mailHelper");

const generateRandomPassword = (length = 8) => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET || "refresh_secret",
    { expiresIn: "30d" }
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
      token: accessToken 
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, username, email, password } = req.body;
    const identifier = (
      usernameOrEmail ||
      email ||
      username ||
      ""
    ).toLowerCase();

    const user = await User.findOne({
      $or: [
        { username: { $regex: `^${identifier}$`, $options: "i" } },
        { email: { $regex: `^${identifier}$`, $options: "i" } },
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
    else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
    
    let os = "Other";
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("Mac OS")) os = "MacOS";

    user.security.loginHistory.unshift({
      device: userAgent.substring(0, 50),
      ip,
      browser,
      os,
      lastLogin: new Date(),
    });

    // Keep only last 10 records
    if (user.security.loginHistory.length > 10) {
      user.security.loginHistory = user.security.loginHistory.slice(0, 10);
    }
    await user.save();

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
    const emailHtml = getNewPasswordTemplate(user.username || "Người dùng", newPlainPassword);
    
    try {
      await sendEmail(email, "Mật khẩu mới của bạn từ MapHome", emailHtml);
      
      res.status(200).json({
        message: "Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác).",
      });
    } catch (mailError) {
      console.error("Failed to send email:", mailError);
      // In development, you might want to return the password in the response if mail fails
      // but for production, this should be logged and handled.
      res.status(500).json({ 
        message: "Không thể gửi email. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
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

    const { accessToken: generatedAccessToken, refreshToken } = generateTokens(user._id, user.role);
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
    if (!refreshToken) return res.status(401).json({ message: "Refresh token missing" });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || "refresh_secret");
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: "Invalid refresh token" });
    if (user.status === "blocked") return res.status(403).json({ message: "Account is blocked" });

    const tokens = generateTokens(user._id, user.role);
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({ token: tokens.accessToken });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = {
  register,
  login,
  changePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  googleLogin,
  refresh,
  logout
};
