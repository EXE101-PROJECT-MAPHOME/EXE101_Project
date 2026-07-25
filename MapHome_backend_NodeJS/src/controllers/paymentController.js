const Transaction = require("../models/Transaction");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Booking = require("../models/Booking");
const VerificationRequest = require("../models/VerificationRequest");
const Property = require("../models/Property");
const PayOS = require("@payos/node");
const payosClass = PayOS.default || PayOS.PayOS || PayOS;

// Initialize PayOS
const payos = new payosClass({
  clientId: process.env.PAYOS_CLIENT_ID || "CLIENT_ID",
  apiKey: process.env.PAYOS_API_KEY || "API_KEY",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "CHECKSUM_KEY"
});

/**
 * Helper: Sau khi thanh toán phí xác minh (planId="inspection") thành công,
 * tự động tạo VerificationRequest nếu chưa có.
 *
 * @param {object} transaction  - Document Transaction đã saved
 * @returns {Promise<boolean>}
 */
const handleInspectionPayment = async (transaction) => {
  try {
    const booking = await Booking.findById(transaction.bookingId);
    if (!booking) {
      console.warn(`[handleInspectionPayment] Booking ${transaction.bookingId} not found`);
      return false;
    }
    if (booking.status !== "confirmed") {
      console.warn(`[handleInspectionPayment] Booking ${booking._id} is not confirmed (status: ${booking.status})`);
      return false;
    }

    // Tránh tạo trùng VerificationRequest cho cùng một booking
    const existing = await VerificationRequest.findOne({ bookingId: booking._id });
    if (existing) {
      console.log(`[handleInspectionPayment] VerificationRequest already exists for booking ${booking._id}`);
      return true;
    }

    // Lấy thông tin property để bổ sung vào VerificationRequest
    const property = await Property.findById(booking.propertyId);
    const propertyName = property ? property.name : "N/A";
    const address = property ? property.address : "N/A";

    // Lấy thông tin landlord (landlordId trong booking là ObjectId của Landlord)
    const Landlord = require("../models/Landlord");
    const landlord = await Landlord.findById(booking.landlordId);
    const landlordName = landlord ? (landlord.businessName || landlord.name || "N/A") : "N/A";

    await VerificationRequest.create({
      propertyId: booking.propertyId,
      propertyName,
      landlordId: booking.landlordId,
      landlordName,
      phone: booking.customerPhone,
      address,
      scheduledDate: booking.bookingDate,
      scheduledTime: booking.bookingTime,
      notes: booking.note || "",
      status: "pending",
      requesterType: "user",
      requesterId: String(booking.userId),
      requesterName: booking.customerName,
      requesterPhone: booking.customerPhone,
      amount: transaction.amount,
      packageType: "basic",
      bookingId: booking._id,
      transactionId: transaction._id,
      paymentStatus: "paid",
    });

    // Notify tenant
    await Notification.create({
      userId: booking.userId,
      title: "🏠 Yêu cầu xác minh đã được tạo!",
      message: `Thanh toán thành công. Yêu cầu xác minh phòng "${propertyName}" đã được gửi đến hệ thống. Chúng tôi sẽ liên hệ với bạn sớm.`,
      type: "success",
      link: `/room/${booking.propertyId}`,
    });

    console.log(`[handleInspectionPayment] VerificationRequest created for booking ${booking._id}`);
    return true;
  } catch (err) {
    console.error("[handleInspectionPayment] Error:", err.message);
    return false;
  }
};

/**
 * Helper: Sau khi thanh toán gói xác thực thực tế (planId="premium_verification") thành công,
 * cập nhật paymentStatus cho VerificationRequest.
 */
const handlePremiumVerificationPayment = async (transaction) => {
  try {
    const vr = await VerificationRequest.findById(transaction.verificationId);
    if (!vr) {
      console.warn(`[handlePremiumVerificationPayment] VerificationRequest ${transaction.verificationId} not found`);
      return false;
    }
    
    vr.paymentStatus = "paid";
    vr.transactionId = transaction._id;
    await vr.save();
    
    // Notify landlord
    await Notification.create({
      userId: transaction.userId,
      title: "✅ Thanh toán yêu cầu xác thực thành công!",
      message: `Đã thanh toán thành công phí Xác thực Thực tế cho phòng "${vr.propertyName}". Admin sẽ liên hệ bạn sớm.`,
      type: "success",
    });
    
    console.log(`[handlePremiumVerificationPayment] VerificationRequest ${vr._id} marked as paid`);
    return true;
  } catch (err) {
    console.error("[handlePremiumVerificationPayment] Error:", err.message);
    return false;
  }
};

/**
 * Helper: Tra cứu plan từ DB và kích hoạt/cập nhật subscription cho user.
 * Dùng chung cho cả callback và webhook để tránh trùng lặp logic.
 *
 * @param {string} planSlug  - planId slug trong DB (vd: "basic", "standard", "pro")
 * @param {ObjectId} userId  - _id của user cần kích hoạt
 * @returns {Promise<boolean>} - true nếu kích hoạt thành công, false nếu plan không tìm thấy
 */
const activateSubscription = async (planSlug, userId, transaction = null) => {
  // Nếu là thanh toán phí xác minh thực địa → chạy handler riêng
  if (planSlug === "inspection") {
    if (transaction) {
      return await handleInspectionPayment(transaction);
    }
    console.warn("[activateSubscription] inspection planId nhưng không có transaction object");
    return false;
  }

  // Nếu là thanh toán gói xác thực thực tế (premium) của landlord
  if (planSlug === "premium_verification") {
    if (transaction) {
      return await handlePremiumVerificationPayment(transaction);
    }
    console.warn("[activateSubscription] premium_verification planId nhưng không có transaction object");
    return false;
  }

  if (!planSlug) return false;

  // Lấy plan từ DB (admin đã tạo)
  const planDoc = await SubscriptionPlan.findOne({
    planId: planSlug.toLowerCase(),
    isActive: true,
  });

  if (!planDoc) {
    console.warn(`[activateSubscription] Plan not found in DB: "${planSlug}"`);
    return false;
  }

  // Kiểm tra xem subscription hiện tại đã đúng gói chưa (tránh ghi đè không cần thiết)
  const existingSub = await Subscription.findOne({ userId });
  const alreadyUpgraded =
    existingSub &&
    String(existingSub.planId) === String(planDoc._id) &&
    existingSub.status === "active" &&
    existingSub.expiryDate > new Date();

  if (alreadyUpgraded) return true; // đã được xử lý rồi (webhook chạy trước)

  // Tính ngày hết hạn dựa theo term (mặc định 30 ngày)
  const termDays = planDoc.termDays || 30;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + termDays);

  // Lấy danh sách features dưới dạng mảng string để lưu vào Subscription
  const featureTexts = (planDoc.features || [])
    .filter((f) => f.included !== false)
    .map((f) => (typeof f === "string" ? f : f.text));

  // Upsert subscription
  const updatedSub = await Subscription.findOneAndUpdate(
    { userId },
    {
      planId: planDoc._id,
      planName: planDoc.name,
      status: "active",
      startDate: new Date(),
      expiryDate,
      features: featureTexts,
    },
    { upsert: true, new: true }
  );

  // Xác định verification level dựa theo slug gói đăng ký
  let verificationLevel = 0;
  const slug = planSlug.toLowerCase();
  if (slug === "basic") {
    verificationLevel = 1;
  } else if (slug === "standard") {
    verificationLevel = 2;
  } else if (slug === "pro") {
    verificationLevel = 3;
  } else {
    verificationLevel = 0;
  }

  // Cập nhật subscriptionId và verificationLevel trên User trong DB
  await User.findByIdAndUpdate(userId, {
    subscriptionId: updatedSub._id,
    verificationLevel,
  });

  // Tìm Landlord profile của User và gia hạn toàn bộ bài đăng
  const Landlord = require("../models/Landlord");
  const Property = require("../models/Property");
  const landlord = await Landlord.findOne({ userId });
  if (landlord) {
    await Property.updateMany(
      { landlordId: landlord._id },
      { $set: { expiryDate: expiryDate, status: "approved" } }
    );
    console.log(`[activateSubscription] Extended expiry date for properties of landlord ${landlord._id}`);
  }

  console.log(
    `[activateSubscription] User ${userId} upgraded to plan "${planDoc.name}" (expires ${expiryDate.toISOString()})`
  );
  return true;
};

// ─── POST /api/payments/create ────────────────────────────────────────────────
const createPayment = async (req, res) => {
  try {
    const { amount, description, planId, bookingId, appReturnUrl, verificationId } = req.body;

    // ── Validate: nếu là inspection thì booking phải tồn tại và đã confirmed ──
    if (planId === "inspection") {
      if (!bookingId) {
        return res.status(400).json({ message: "bookingId là bắt buộc khi thanh toán phí xác minh trọ." });
      }
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy lịch hẹn." });
      }
      if (booking.status !== "confirmed") {
        return res.status(400).json({ 
          message: "Lịch hẹn chưa được landlord xác nhận. Bạn chỉ có thể thanh toán xác minh sau khi lịch hẹn được xác nhận." 
        });
      }
      // Kiểm tra đã có VerificationRequest cho booking này chưa
      const existingVR = await VerificationRequest.findOne({ bookingId });
      if (existingVR) {
        return res.status(400).json({ message: "Yêu cầu xác minh cho lịch hẹn này đã tồn tại." });
      }
    }

    // ── Validate: nếu là premium_verification thì phải có verificationId ──
    if (planId === "premium_verification") {
      if (!verificationId) {
        return res.status(400).json({ message: "verificationId là bắt buộc khi thanh toán gói xác thực thực tế." });
      }
      const existingVR = await VerificationRequest.findById(verificationId);
      if (!existingVR) {
        return res.status(404).json({ message: "Không tìm thấy yêu cầu xác minh." });
      }
      if (existingVR.paymentStatus === "paid") {
        return res.status(400).json({ message: "Yêu cầu này đã được thanh toán." });
      }
    }

    // orderCode must be a number, max 53 bits. We use timestamp + random
    const orderCode = Number(
      String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000)
    );

    const backendUrl =
      process.env.API_URL ||
      process.env.BACKEND_URL ||
      `http://localhost:${process.env.PORT || 5000}`;
    const userId = req.user.id || req.user._id;

    // Pass userId & planId & appReturnUrl in return URL so callback knows what to activate and where to redirect
    const returnUrl = `${backendUrl}/api/payments/callback?userId=${userId}&planId=${
      planId || ""
    }&desc=${encodeURIComponent(description || "")}&appReturnUrl=${encodeURIComponent(appReturnUrl || "")}`;
    const cancelUrl = `${backendUrl}/api/payments/callback?cancel=true&userId=${userId}&planId=${
      planId || ""
    }&desc=${encodeURIComponent(description || "")}&appReturnUrl=${encodeURIComponent(appReturnUrl || "")}`;

    const body = {
      orderCode,
      amount,
      description: (description || "Thanh toan don hang").substring(0, 25),
      returnUrl,
      cancelUrl,
    };

    // Tạo giao dịch nháp (pending) — webhook dùng orderId này để tìm lại
    await Transaction.create({
      userId,
      amount,
      description: body.description,
      status: "pending",
      invoiceId: String(orderCode),
      orderId: String(orderCode),
      paymentMethod: "PayOS",
      planId: planId || "",
      bookingId: bookingId || null,
      verificationId: verificationId || null,
    });

    const paymentLinkData = await payos.paymentRequests.create(body);

    res.status(200).json({ url: paymentLinkData.checkoutUrl, orderCode });
  } catch (error) {
    console.error("[PayOS Create Error]:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/payments/callback ───────────────────────────────────────────────
const paymentCallback = async (req, res) => {
  try {
    const { cancel, orderCode, planId, appReturnUrl } = req.query;
    
    // Nếu có appReturnUrl từ query thì dùng nó làm base URL (hỗ trợ Mobile Deep Link)
    let frontendUrl = "";
    if (appReturnUrl && appReturnUrl.trim() !== "") {
      try {
        const urlObj = new URL(decodeURIComponent(appReturnUrl));
        frontendUrl = urlObj.origin;
      } catch (e) {
        frontendUrl = decodeURIComponent(appReturnUrl).replace(/\/$/, "");
      }
    } else {
      frontendUrl = (
        process.env.FRONTEND_URL || "http://localhost:5173"
      ).trim().replace(/^['"]|['"]$/g, "").replace(/\/$/, "");
    }

    // Người dùng huỷ thanh toán
    if (cancel === "true") {
      let cancelledTx = null;
      if (orderCode) {
        cancelledTx = await Transaction.findOneAndUpdate(
          { orderId: String(orderCode), status: "pending" },
          { status: "cancelled", description: "Người dùng đã huỷ thanh toán" },
          { new: true } // lấy document sau khi update để đọc planId, bookingId
        );
      }

      // Gửi notification nếu là inspection
      if (cancelledTx && cancelledTx.planId === "inspection" && cancelledTx.userId) {
        try {
          await Notification.create({
            userId: cancelledTx.userId,
            title: "❌ Thanh toán xác minh bị huỷ",
            message: "Bạn đã huỷ thanh toán phí xác minh trọ. Lịch hẹn vẫn còn hiệu lực — bạn có thể thanh toán lại bất cứ lúc nào.",
            type: "warning",
          });
        } catch (notifErr) {
          console.error("[Cancel] Failed to send notification:", notifErr.message);
        }
      }

      // Redirect đúng trang tuỳ loại thanh toán
      const isInspection = cancelledTx && cancelledTx.planId === "inspection";
      const isPremiumVerification = cancelledTx && cancelledTx.planId === "premium_verification";
      if (isInspection && cancelledTx.bookingId) {
        return res.redirect(`${frontendUrl}/user/dashboard?tab=appointments&bookingId=${cancelledTx.bookingId}&payment=cancelled`);
      }
      if (isPremiumVerification) {
        return res.redirect(`${frontendUrl}/landlord/dashboard?tab=verification&payment=cancelled`);
      }
      return res.redirect(`${frontendUrl}/pricing?cancelled=true`);
    }

    // Xác minh trạng thái với PayOS để tránh giả mạo
    const paymentData = await payos.paymentRequests.get(Number(orderCode));

    if (paymentData && paymentData.status === "PAID") {
      const amount = paymentData.amount;

      const existingTx = await Transaction.findOne({
        orderId: String(orderCode),
      });

      if (existingTx) {
        // Cập nhật trạng thái transaction nếu vẫn còn pending
        if (existingTx.status === "pending") {
          existingTx.status = "success";
          await existingTx.save();
        }

        // Kích hoạt subscription hoặc tạo VerificationRequest tùy loại thanh toán
        const effectivePlanId = planId || existingTx.planId;
        await activateSubscription(effectivePlanId, existingTx.userId, existingTx);

        // Chỉ tạo thông báo chung với subscription (inspection đã có thông báo riêng trong handleInspectionPayment)
        if (effectivePlanId !== "inspection" && effectivePlanId !== "premium_verification") {
          const existingNotif = await Notification.findOne({
            userId: existingTx.userId,
            message: { $regex: String(orderCode) },
          });
          if (!existingNotif) {
            await Notification.create({
              userId: existingTx.userId,
              title: "Thanh toán thành công",
              message: `Bạn đã thanh toán thành công đơn hàng qua PayOS. Mã GD: ${orderCode}`,
              type: "success",
            });
          }
        }
      }

      const paymentType = (planId === "inspection" || (existingTx && existingTx.planId === "inspection"))
        ? "inspection"
        : (planId === "premium_verification" || (existingTx && existingTx.planId === "premium_verification"))
          ? "premium_verification"
          : "subscription";
      const successUrl = `${frontendUrl}/payment-success?orderId=${orderCode}&amount=${amount}&planId=${
        planId || ""
      }&type=${paymentType}`;
      return res.redirect(successUrl);
    } else {
      return res.redirect(`${frontendUrl}/payment-failure?code=not_paid`);
    }
  } catch (error) {
    console.error("[PayOS Callback Error]:", error);
    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).trim().replace(/^['"]|['"]$/g, "").replace(/\/$/, "");
    res.redirect(`${frontendUrl}/payment-failure?code=error`);
  }
};

// ─── POST /api/payments/webhook ───────────────────────────────────────────────
const payosWebhook = async (req, res) => {
  try {
    const webhookData = await payos.webhooks.verify(req.body);

    if (webhookData.code === "00") {
      const orderCode = webhookData.orderCode;

      const existingTx = await Transaction.findOne({
        orderId: String(orderCode),
      });

      if (existingTx && existingTx.status === "pending") {
        existingTx.status = "success";
        await existingTx.save();

        const { userId, planId } = existingTx;

        // Kích hoạt subscription hoặc tạo VerificationRequest tùy loại thanh toán
        await activateSubscription(planId, userId, existingTx);

        // Chỉ tạo thông báo chung với subscription (inspection đã có thông báo riêng)
        if (planId !== "inspection" && planId !== "premium_verification") {
          await Notification.create({
            userId,
            title: "Thanh toán thành công",
            message: `Bạn đã thanh toán thành công đơn hàng qua PayOS. Mã GD: ${orderCode}`,
            type: "success",
          });
        }
      }
    }
  } catch (error) {
    console.error("[PayOS Webhook Error]:", error);
  }

  return res.status(200).json({ success: true });
};

// ─── GET /api/payments/inspection-fee ────────────────────────────────────────
const getInspectionFee = async (req, res) => {
  try {
    const SystemSetting = require("../models/SystemSetting");
    const settings = await SystemSetting.findOne();
    const fee =
      settings && settings.pricing && settings.pricing.basicVerification
        ? settings.pricing.basicVerification
        : 119000; // Mức phí mặc định: 119,000đ
    res.status(200).json({ fee, currency: "VND" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPayment, paymentCallback, payosWebhook, getInspectionFee };
