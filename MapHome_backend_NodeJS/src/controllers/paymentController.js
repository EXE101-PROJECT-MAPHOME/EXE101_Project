const Transaction = require("../models/Transaction");
const Subscription = require("../models/Subscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const User = require("../models/User");
const Notification = require("../models/Notification");
const PayOS = require("@payos/node");
const payosClass = PayOS.default || PayOS.PayOS || PayOS;

// Initialize PayOS
const payos = new payosClass({
  clientId: process.env.PAYOS_CLIENT_ID || "CLIENT_ID",
  apiKey: process.env.PAYOS_API_KEY || "API_KEY",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "CHECKSUM_KEY"
});

/**
 * Helper: Tra cứu plan từ DB và kích hoạt/cập nhật subscription cho user.
 * Dùng chung cho cả callback và webhook để tránh trùng lặp logic.
 *
 * @param {string} planSlug  - planId slug trong DB (vd: "basic", "standard", "pro")
 * @param {ObjectId} userId  - _id của user cần kích hoạt
 * @returns {Promise<boolean>} - true nếu kích hoạt thành công, false nếu plan không tìm thấy
 */
const activateSubscription = async (planSlug, userId) => {
  if (!planSlug || planSlug === "inspection") return false;

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

  // Cập nhật subscriptionId trên User
  await User.findByIdAndUpdate(userId, { subscriptionId: updatedSub._id });

  // Nếu là gói Pro → nâng verificationLevel lên 3
  if (planSlug.toLowerCase() === "pro") {
    await User.findByIdAndUpdate(userId, { verificationLevel: 3 });
  }

  console.log(
    `[activateSubscription] User ${userId} upgraded to plan "${planDoc.name}" (expires ${expiryDate.toISOString()})`
  );
  return true;
};

// ─── POST /api/payments/create ────────────────────────────────────────────────
const createPayment = async (req, res) => {
  try {
    const { amount, description, planId } = req.body;

    // orderCode must be a number, max 53 bits. We use timestamp + random
    const orderCode = Number(
      String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000)
    );

    const backendUrl =
      process.env.API_URL ||
      process.env.BACKEND_URL ||
      `http://localhost:${process.env.PORT || 5000}`;
    const userId = req.user.id || req.user._id;

    // Pass userId & planId in return URL so callback knows what to activate
    const returnUrl = `${backendUrl}/api/payments/callback?userId=${userId}&planId=${
      planId || ""
    }&desc=${encodeURIComponent(description || "")}`;
    const cancelUrl = `${backendUrl}/api/payments/callback?cancel=true&userId=${userId}&planId=${
      planId || ""
    }&desc=${encodeURIComponent(description || "")}`;

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
    const { cancel, orderCode, planId } = req.query;
    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");

    // Người dùng huỷ thanh toán
    if (cancel === "true") {
      if (orderCode) {
        await Transaction.findOneAndUpdate(
          { orderId: String(orderCode), status: "pending" },
          { status: "cancelled", description: "Người dùng đã huỷ thanh toán" }
        );
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

        // Kích hoạt subscription từ DB plan (không hardcode)
        const effectivePlanId = planId || existingTx.planId;
        await activateSubscription(effectivePlanId, existingTx.userId);

        // Tạo thông báo nếu chưa có
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

      const successUrl = `${frontendUrl}/payment-success?orderId=${orderCode}&amount=${amount}&planId=${
        planId || ""
      }&type=subscription`;
      return res.redirect(successUrl);
    } else {
      return res.redirect(`${frontendUrl}/payment-failure?code=not_paid`);
    }
  } catch (error) {
    console.error("[PayOS Callback Error]:", error);
    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");
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

        // Kích hoạt subscription từ DB plan (không hardcode)
        await activateSubscription(planId, userId);

        await Notification.create({
          userId,
          title: "Thanh toán thành công",
          message: `Bạn đã thanh toán thành công đơn hàng qua PayOS. Mã GD: ${orderCode}`,
          type: "success",
        });
      }
    }
  } catch (error) {
    console.error("[PayOS Webhook Error]:", error);
  }

  return res.status(200).json({ success: true });
};

module.exports = { createPayment, paymentCallback, payosWebhook };
