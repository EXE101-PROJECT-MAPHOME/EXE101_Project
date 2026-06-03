const Transaction = require("../models/Transaction");
const Subscription = require("../models/Subscription");
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

// POST /api/payments/create
const createPayment = async (req, res) => {
  try {
    const { amount, description, planId } = req.body;

    // orderCode must be a number, max 53 bits. We use timestamp + random
    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const userId = req.user.id || req.user._id;

    // We pass userId, planId, and desc in the return URL so the callback knows what to update
    const returnUrl = `${backendUrl}/api/payments/callback?userId=${userId}&planId=${planId || ""}&desc=${encodeURIComponent(description || "")}`;
    const cancelUrl = `${backendUrl}/api/payments/callback?cancel=true&userId=${userId}&planId=${planId || ""}&desc=${encodeURIComponent(description || "")}`;

    const body = {
      orderCode: orderCode,
      amount: amount,
      description: (description || `Thanh toan don hang`).substring(0, 25),
      returnUrl: returnUrl,
      cancelUrl: cancelUrl
    };

    // Tạo giao dịch nháp (pending) để Webhook có thể nhận diện được
    await Transaction.create({
      userId,
      amount,
      description: body.description,
      status: "pending",
      invoiceId: String(orderCode),
      orderId: String(orderCode),
      paymentMethod: "PayOS",
      planId: planId || ""
    });

    const paymentLinkData = await payos.createPaymentLink(body);

    res.status(200).json({ url: paymentLinkData.checkoutUrl, orderCode });
  } catch (error) {
    console.error("[PayOS Create Error]:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/callback
const paymentCallback = async (req, res) => {
  try {
    const { code, id, cancel, status, orderCode, userId, planId, desc } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // If user cancelled the payment
    if (cancel === "true") {
      if (userId) {
        await Transaction.create({
          userId,
          amount: 0,
          description: desc ? desc + " (Đã huỷ)" : "Đã huỷ thanh toán",
          status: "failed",
          orderId: orderCode ? String(orderCode) : "",
          paymentMethod: "PayOS"
        });
      }
      return res.redirect(`${frontendUrl}/payment-failure?code=${code || "cancel"}`);
    }

    // Verify payment status with PayOS server to prevent spoofing
    const paymentData = await payos.getPaymentLinkInformation(Number(orderCode));

    if (paymentData && paymentData.status === "PAID") {
      const amount = paymentData.amount;

      // Cập nhật giao dịch thành công (nếu webhook chưa làm)
      const existingTx = await Transaction.findOne({ orderId: String(orderCode) });
      if (existingTx && existingTx.status === "pending") {
        existingTx.status = "success";
        await existingTx.save();

        // Nâng cấp gói
        if (planId) {
          const plans = {
            standard: { name: "Standard", term: 30, features: ["20 tin đăng", "Ưu tiên"] },
            pro: { name: "Pro", term: 30, features: ["50 tin đăng", "Ưu tiên cao"] },
          };
          const plan = plans[planId];
          if (plan) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            await Subscription.findOneAndUpdate(
              { userId: existingTx.userId },
              { planName: plan.name, status: "active", expiryDate, features: plan.features },
              { upsert: true, new: true }
            );

            if (planId === "pro") {
              await User.findByIdAndUpdate(existingTx.userId, { verificationLevel: 3 });
            }
          }
        }

        await Notification.create({
          userId: existingTx.userId,
          title: "Thanh toán thành công",
          message: `Bạn đã thanh toán thành công đơn hàng qua PayOS. Mã GD: ${orderCode}`,
          type: "success"
        });
      }

      const successUrl = `${frontendUrl}/payment-success?orderId=${orderCode}&amount=${amount}&planId=${planId || ""}&type=subscription`;
      return res.redirect(successUrl);
    } else {
      // Payment not PAID
      return res.redirect(`${frontendUrl}/payment-failure?code=not_paid`);
    }
  } catch (error) {
    console.error("[PayOS Callback Error]:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/payment-failure?code=error`);
  }
};

// POST /api/payments/webhook
const payosWebhook = async (req, res) => {
  try {
    const webhookData = payos.verifyPaymentWebhookData(req.body);

    if (webhookData.code === "00" && webhookData.success) {
      const orderCode = webhookData.data.orderCode;
      
      const existingTx = await Transaction.findOne({ orderId: String(orderCode) });
      
      if (existingTx && existingTx.status === "pending") {
        existingTx.status = "success";
        await existingTx.save();

        const userId = existingTx.userId;
        const planId = existingTx.planId;

        // Upgrade subscription
        if (planId) {
          const plans = {
            standard: { name: "Standard", term: 30, features: ["20 tin đăng", "Ưu tiên"] },
            pro: { name: "Pro", term: 30, features: ["50 tin đăng", "Ưu tiên cao"] },
          };
          const plan = plans[planId];
          if (plan) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);

            await Subscription.findOneAndUpdate(
              { userId },
              { planName: plan.name, status: "active", expiryDate, features: plan.features },
              { upsert: true, new: true }
            );

            if (planId === "pro") {
              await User.findByIdAndUpdate(userId, { verificationLevel: 3 });
            }
          }
        }

        await Notification.create({
          userId,
          title: "Thanh toán thành công",
          message: `Bạn đã thanh toán thành công đơn hàng qua PayOS. Mã GD: ${orderCode}`,
          type: "success"
        });
      }
    }
  } catch (error) {
    console.error("[PayOS Webhook Error]:", error);
  }
  return res.status(200).json({ success: true });
};

module.exports = { createPayment, paymentCallback, payosWebhook };
