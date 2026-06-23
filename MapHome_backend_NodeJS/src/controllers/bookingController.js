const Booking = require("../models/Booking");
const Property = require("../models/Property");
const Landlord = require("../models/Landlord");
const User = require("../models/User");
const {
  notifyLandlordNewBooking,
  notifyTenantBookingConfirmed,
  notifyTenantBookingCancelled,
  notifyTenantBookingCompleted,
  notifyLandlordBookingCancelledByTenant,
} = require("../utils/notificationHelper");

// ─── Helper: format date for display ────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getBookings = async (req, res) => {
  try {
    const query = {};
    if (req.query.propertyId) query.propertyId = req.query.propertyId;
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.landlordId) query.landlordId = req.query.landlordId;
    if (req.query.status) query.status = req.query.status;

    const bookings = await Booking.find(query)
      .populate("propertyId", "name address")
      .populate("userId", "username fullName phone")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("propertyId", "name address")
      .populate("userId", "username fullName phone");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new booking and notify the landlord
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (req.user) {
      payload.userId = req.user._id;
    }

    // Auto-resolve landlordId and brokerId from Property if not provided in payload
    let property = null;
    if (payload.propertyId) {
      property = await Property.findById(payload.propertyId);
      if (!property) return res.status(404).json({ message: "Property not found" });
      
      if (!payload.landlordId && property.landlordId) {
        payload.landlordId = property.landlordId;
      }
      if (!payload.brokerId && property.brokerId) {
        payload.brokerId = property.brokerId;
      }

      // ── Check for Overlapping Confirmed Bookings ──
      const existingBooking = await Booking.findOne({
        propertyId: payload.propertyId,
        bookingDate: payload.bookingDate,
        bookingTime: payload.bookingTime,
        status: "confirmed"
      });

      if (existingBooking) {
        return res.status(400).json({ 
          message: `This time slot (${payload.bookingTime}) on this date is already booked and confirmed. Please choose another time.` 
        });
      }
    }

    const booking = await Booking.create(payload);

    // ── Notify the Landlord or Broker ──
    if (property) {
      if (payload.brokerId) {
        try {
          const Broker = require("../models/Broker");
          const broker = await Broker.findById(payload.brokerId);
          if (broker && broker.userId) {
            await notifyLandlordNewBooking({
              landlordUserId: broker.userId,
              propertyName: property.name,
              customerName: payload.customerName || "Guest",
              bookingDate: formatDate(payload.bookingDate),
              bookingTime: payload.bookingTime || "",
              propertyId: property._id,
            });
          }
        } catch (notifErr) {
          console.error("[createBooking] Failed to send notification to broker:", notifErr.message);
        }
      } else if (payload.landlordId) {
        try {
          const landlord = await Landlord.findById(payload.landlordId);
          if (landlord && landlord.userId) {
            await notifyLandlordNewBooking({
              landlordUserId: landlord.userId,
              propertyName: property.name,
              customerName: payload.customerName || "Guest",
              bookingDate: formatDate(payload.bookingDate),
              bookingTime: payload.bookingTime || "",
              propertyId: property._id,
            });
          }
        } catch (notifErr) {
          console.error("[createBooking] Failed to send notification to landlord:", notifErr.message);
        }
      }
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Ownership check for landlord or broker
    if (req.user.role === "landlord") {
      const landlord = await Landlord.findOne({ userId: req.user._id });
      if (!landlord || String(booking.landlordId) !== String(landlord._id)) {
        return res.status(403).json({ message: "Not authorized to update this booking" });
      }
    } else if (req.user.role === "broker") {
      const Broker = require("../models/Broker");
      const broker = await Broker.findOne({ userId: req.user._id });
      if (!broker || !booking.brokerId || String(booking.brokerId) !== String(broker._id)) {
        return res.status(403).json({ message: "Not authorized to update this booking" });
      }
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Ownership check for landlord or broker
    if (req.user.role === "landlord") {
      const landlord = await Landlord.findOne({ userId: req.user._id });
      if (!landlord || String(booking.landlordId) !== String(landlord._id)) {
        return res.status(403).json({ message: "Not authorized to delete this booking" });
      }
    } else if (req.user.role === "broker") {
      const Broker = require("../models/Broker");
      const broker = await Broker.findOne({ userId: req.user._id });
      if (!broker || !booking.brokerId || String(booking.brokerId) !== String(broker._id)) {
        return res.status(403).json({ message: "Not authorized to delete this booking" });
      }
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Booking removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Tenant cancels their own pending booking and notifies the landlord
// @route   PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "Only pending bookings can be cancelled." });
    }

    booking.status = "cancelled";
    await booking.save();

    // ── Notify the Landlord or Broker ──
    try {
      const property = await Property.findById(booking.propertyId);
      if (property) {
        if (booking.brokerId) {
          const Broker = require("../models/Broker");
          const broker = await Broker.findById(booking.brokerId);
          if (broker && broker.userId) {
            await notifyLandlordBookingCancelledByTenant({
              landlordUserId: broker.userId,
              propertyName: property.name,
              customerName: booking.customerName || "Guest",
              bookingDate: formatDate(booking.bookingDate),
              bookingTime: booking.bookingTime || "",
            });
          }
        } else if (booking.landlordId) {
          const landlord = await Landlord.findById(booking.landlordId);
          if (landlord && landlord.userId) {
            await notifyLandlordBookingCancelledByTenant({
              landlordUserId: landlord.userId,
              propertyName: property.name,
              customerName: booking.customerName || "Guest",
              bookingDate: formatDate(booking.bookingDate),
              bookingTime: booking.bookingTime || "",
            });
          }
        }
      }
    } catch (notifErr) {
      console.error("[cancelBooking] Failed to send notification:", notifErr.message);
    }

    res.status(200).json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Landlord/Admin updates booking status and notifies the tenant
// @route   PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Allowed values: " + validStatuses.join(", ") });
    }

    const query = { _id: req.params.id };
    if (req.user.role === "landlord") {
      const landlord = await Landlord.findOne({ userId: req.user._id });
      if (!landlord) {
        return res.status(403).json({ message: "Landlord profile not found" });
      }
      query.landlordId = landlord._id;
    } else if (req.user.role === "broker") {
      const Broker = require("../models/Broker");
      const broker = await Broker.findOne({ userId: req.user._id });
      if (!broker) {
        return res.status(403).json({ message: "Broker profile not found" });
      }
      query.brokerId = broker._id;
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found or unauthorized to change status" });
    }

    booking.status = status;
    await booking.save();

    // ── Notify the Tenant (if userId is present) ──
    if (booking.userId) {
      try {
        const property = await Property.findById(booking.propertyId);
        const propertyName = property ? property.name : "the property";
        const propertyId = property ? property._id : null;
        const bookingDate = formatDate(booking.bookingDate);
        const bookingTime = booking.bookingTime || "";

        if (status === "confirmed") {
          await notifyTenantBookingConfirmed({
            tenantUserId: booking.userId,
            propertyName,
            bookingDate,
            bookingTime,
            propertyId,
          });
        } else if (status === "cancelled") {
          await notifyTenantBookingCancelled({
            tenantUserId: booking.userId,
            propertyName,
            cancelledBy: "landlord",
            propertyId,
          });
        } else if (status === "completed") {
          await notifyTenantBookingCompleted({
            tenantUserId: booking.userId,
            propertyName,
            propertyId,
          });
        }
      } catch (notifErr) {
        console.error("[updateBookingStatus] Failed to send notification:", notifErr.message);
      }
    }

    res.status(200).json({ message: "Booking status updated successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  cancelBooking,
  updateBookingStatus,
};
