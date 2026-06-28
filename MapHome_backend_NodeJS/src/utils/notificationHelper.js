const Notification = require("../models/Notification");

/**
 * Creates a notification in the DB for a specific user.
 * @param {object} options
 * @param {string} options.userId    - Recipient's user ID
 * @param {string} options.title     - Notification title
 * @param {string} options.message   - Notification message
 * @param {string} [options.type]    - Type: "info"|"success"|"warning"|"error"|"booking"|"verification"
 * @param {string} [options.link]    - Related page link (e.g. /room/123)
 */
const { getIO } = require("./socket");

const createNotification = async ({
  userId,
  title,
  message,
  type = "info",
  link,
}) => {
  try {
    const notif = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
    });

    // Emit real-time event if socket.io is available
    try {
      const io = getIO();
      if (io && userId) {
        io.to(`user_${userId}`).emit("notification", notif);
      }
      // also broadcast to role-based room if type suggests landlord notification
      if (io && type === "booking") {
        io.to("role_landlord").emit("notification", notif);
      }
    } catch (emitErr) {
      console.error(
        "[NotificationHelper] Failed to emit socket notification:",
        emitErr.message,
      );
    }

    return notif;
  } catch (err) {
    // Log error but do not throw to avoid disrupting the main flow
    console.error(
      "[NotificationHelper] Failed to create notification:",
      err.message,
    );
    return null;
  }
};

// ─── Booking Notifications ─────────────────────────────────────────────────

/**
 * Notify LANDLORD when a new booking is created by a tenant
 */
const notifyLandlordNewBooking = async ({
  landlordUserId,
  propertyName,
  customerName,
  bookingDate,
  bookingTime,
  propertyId,
}) => {
  await createNotification({
    userId: landlordUserId,
    title: "📅 Lịch hẹn xem phòng mới!",
    message: `${customerName} đã yêu cầu xem "${propertyName}" vào ngày ${bookingDate} lúc ${bookingTime}.`,
    type: "booking",
    link: propertyId ? `/room/${propertyId}` : undefined,
  });
};

/**
 * Notify TENANT when the landlord confirms their booking
 */
const notifyTenantBookingConfirmed = async ({
  tenantUserId,
  propertyName,
  bookingDate,
  bookingTime,
  propertyId,
}) => {
  await createNotification({
    userId: tenantUserId,
    title: "✅ Lịch hẹn đã được xác nhận!",
    message: `Lịch xem "${propertyName}" vào ngày ${bookingDate} lúc ${bookingTime} của bạn đã được xác nhận. Vui lòng đến đúng giờ!`,
    type: "success",
    link: propertyId ? `/room/${propertyId}` : undefined,
  });
};

/**
 * Notify TENANT when landlord cancels their booking
 */
const notifyTenantBookingCancelled = async ({
  tenantUserId,
  propertyName,
  cancelledBy,
  propertyId,
}) => {
  const messageText =
    cancelledBy === "landlord"
      ? `Chủ trọ đã hủy lịch xem "${propertyName}" của bạn. Bạn có thể đặt lại lịch hoặc tìm phòng khác.`
      : `Lịch hẹn xem "${propertyName}" của bạn đã bị hủy. Bạn có thể đặt lại lịch hoặc tìm phòng khác.`;
  await createNotification({
    userId: tenantUserId,
    title: "❌ Lịch hẹn đã bị hủy",
    message: messageText,
    type: "warning",
    link: propertyId ? `/room/${propertyId}` : undefined,
  });
};

/**
 * Notify TENANT when their booking is marked as completed (prompt them to leave a review)
 */
const notifyTenantBookingCompleted = async ({
  tenantUserId,
  propertyName,
  propertyId,
}) => {
  await createNotification({
    userId: tenantUserId,
    title: "🏠 Đã xem phòng xong!",
    message: `Bạn đã xem xong "${propertyName}". Hãy để lại đánh giá để giúp những người thuê khác nhé!`,
    type: "info",
    link: propertyId ? `/room/${propertyId}` : undefined,
  });
};

/**
 * Notify LANDLORD when a tenant cancels their own booking
 */
const notifyLandlordBookingCancelledByTenant = async ({
  landlordUserId,
  propertyName,
  customerName,
  bookingDate,
  bookingTime,
}) => {
  await createNotification({
    userId: landlordUserId,
    title: "🔔 Khách thuê đã hủy lịch",
    message: `${customerName} đã hủy lịch xem "${propertyName}" vào ngày ${bookingDate} lúc ${bookingTime}.`,
    type: "warning",
  });
};

/**
 * Notify BOTH LANDLORD AND TENANT 1 hour before the appointment
 */
const notifyBookingReminder = async ({
  userId,
  propertyName,
  bookingTime,
  isLandlord,
  propertyId,
}) => {
  const roleText = isLandlord
    ? "Bạn có lịch cho khách xem"
    : "Đừng quên lịch hẹn xem";
  await createNotification({
    userId,
    title: "⏰ Nhắc nhở lịch hẹn",
    message: `${roleText} "${propertyName}" lúc ${bookingTime}.`,
    type: "info",
    link: propertyId ? `/room/${propertyId}` : undefined,
  });
};

/**
 * Notify LANDLORD when their property listing is about to expire (3 days before)
 */
const notifyPropertyExpiryWarning = async ({
  userId,
  propertyName,
  propertyId,
  daysRemaining = 3,
}) => {
  await createNotification({
    userId,
    title: "⚠️ Tin đăng sắp hết hạn!",
    message: `Tin đăng "${propertyName}" của bạn sẽ hết hạn sau ${daysRemaining} ngày nữa. Hãy gia hạn ngay để không bị gián đoạn khách thuê!`,
    type: "warning",
    link: "/landlord-dashboard", // Lead to dashboard where they can renew
  });
};

/**
 * Notify TENANT when landlord proposes a new schedule
 */
const notifyTenantBookingRescheduled = async ({
  tenantUserId,
  propertyName,
  bookingDate,
  bookingTime,
  propertyId,
}) => {
  await createNotification({
    userId: tenantUserId,
    title: "🔄 Chủ trọ đề xuất lịch hẹn mới",
    message: `Chủ trọ đã đề xuất dời lịch xem "${propertyName}" sang ngày ${bookingDate} lúc ${bookingTime}. Vui lòng xác nhận hoặc từ chối.`,
    type: "info",
    link: propertyId ? `/room/${propertyId}` : undefined,
  });
};

/**
 * Notify LANDLORD when tenant rejects proposed schedule
 */
const notifyLandlordBookingRejectedByTenant = async ({
  landlordUserId,
  propertyName,
  customerName,
  propertyId,
}) => {
  await createNotification({
    userId: landlordUserId,
    title: "❌ Khách đã từ chối lịch đề xuất",
    message: `${customerName} đã từ chối lịch xem "${propertyName}" mà bạn đề xuất. Bạn có thể hẹn một lịch khác.`,
    type: "warning",
    link: propertyId ? `/room/${propertyId}` : undefined,
  });
};

/**
 * Notify LANDLORD when tenant confirms proposed schedule
 */
const notifyLandlordBookingConfirmedByTenant = async ({
  landlordUserId,
  propertyName,
  customerName,
  bookingDate,
  bookingTime,
  propertyId,
}) => {
  await createNotification({
    userId: landlordUserId,
    title: "✅ Khách đã đồng ý lịch hẹn",
    message: `${customerName} đã đồng ý lịch xem "${propertyName}" vào ngày ${bookingDate} lúc ${bookingTime} mà bạn đề xuất.`,
    type: "success",
    link: propertyId ? `/room/${propertyId}` : undefined,
  });
};

module.exports = {
  createNotification,
  notifyLandlordNewBooking,
  notifyTenantBookingConfirmed,
  notifyTenantBookingCancelled,
  notifyLandlordBookingCancelledByTenant,
  notifyTenantBookingCompleted,
  notifyBookingReminder,
  notifyPropertyExpiryWarning,
  notifyTenantBookingRescheduled,
  notifyLandlordBookingRejectedByTenant,
  notifyLandlordBookingConfirmedByTenant,
};
