const cron = require("node-cron");
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const Landlord = require("../models/Landlord");
const { notifyBookingReminder, notifyPropertyExpiryWarning } = require("./notificationHelper");

/**
 * Scheduled tasks to manage property lifecycles automatically.
 */
const initCronJobs = () => {
    console.log("⏰ Initializing automatic tasks (Cron Jobs)...");

    // Task 1: Expire properties daily at 00:00
    cron.schedule("0 0 * * *", async () => {
        try {
            console.log("🚦 Starting scan for expired properties...");
            const now = new Date();
            
            const result = await Property.updateMany(
                {
                    status: "approved",
                    expiryDate: { $lt: now }
                },
                {
                    $set: { status: "expired" }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`✅ Moved ${result.modifiedCount} properties to 'expired' status.`);
            } else {
                console.log("ℹ️ No properties expired today.");
            }
        } catch (error) {
            console.error("❌ Error scanning for expired properties:", error.message);
        }
    });

    // Task 2: Send appointment reminders every 30 minutes
    cron.schedule("*/30 * * * *", async () => {
        try {
            console.log("⏰ Checking for upcoming appointments (Reminders)...");
            const now = new Date();
            const todayStr = now.toISOString().split("T")[0];
            
            // Find confirmed bookings for today that haven't sent reminders yet
            // Note: In real app, we should parse bookingTime string to compare strictly.
            // For now, we find bookings for 'today'.
            const upcomingBookings = await Booking.find({
                status: "confirmed",
                reminderSent: false,
                bookingDate: {
                    $gte: new Date(todayStr),
                    $lt: new Date(new Date(todayStr).getTime() + 24 * 60 * 60 * 1000)
                }
            }).populate("propertyId", "name");

            for (const booking of upcomingBookings) {
                // Send to Tenant
                if (booking.userId) {
                    await notifyBookingReminder({
                        userId: booking.userId,
                        propertyName: booking.propertyId?.name || "the room",
                        bookingTime: booking.bookingTime,
                        isLandlord: false,
                        propertyId: booking.propertyId?._id
                    });
                }

                // Send to Landlord
                if (booking.landlordId) {
                    const landlord = await Landlord.findById(booking.landlordId);
                    if (landlord && landlord.userId) {
                        await notifyBookingReminder({
                            userId: landlord.userId,
                            propertyName: booking.propertyId?.name || "the room",
                            bookingTime: booking.bookingTime,
                            isLandlord: true,
                            propertyId: booking.propertyId?._id
                        });
                    }
                }

                // Mark as sent
                booking.reminderSent = true;
                await booking.save();
            }

            if (upcomingBookings.length > 0) {
                console.log(`🔔 Sent ${upcomingBookings.length} appointment reminders.`);
            }
        } catch (error) {
            console.error("❌ Error sending reminders:", error.message);
        }
    });

    // Task 3: Notify Landlords 3 days before property expiry
    cron.schedule("5 0 * * *", async () => {
        try {
            console.log("🚦 Scanning for properties expiring in 3 days...");
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            
            // Set range for that specific day
            const startOfDay = new Date(threeDaysFromNow.setHours(0, 0, 0, 0));
            const endOfDay = new Date(threeDaysFromNow.setHours(23, 59, 59, 999));

            const expiringSoon = await Property.find({
                status: "approved",
                expiryDate: { $gte: startOfDay, $lte: endOfDay }
            });

            for (const property of expiringSoon) {
                if (property.landlordId) {
                    const landlord = await Landlord.findById(property.landlordId);
                    if (landlord && landlord.userId) {
                        await notifyPropertyExpiryWarning({
                            userId: landlord.userId,
                            propertyName: property.name,
                            propertyId: property._id
                        });
                    }
                }
            }

            if (expiringSoon.length > 0) {
                console.log(`🔔 Sent ${expiringSoon.length} expiry warnings.`);
            }
        } catch (error) {
            console.error("❌ Error scanning for expiring properties:", error.message);
        }
    });

    console.log("✅ Scheduled expired properties scan: 00:00 daily.");
    console.log("✅ Scheduled property expiry warnings: 00:05 daily.");
    console.log("✅ Scheduled appointment reminders: every 30 minutes.");
};

module.exports = { initCronJobs };
