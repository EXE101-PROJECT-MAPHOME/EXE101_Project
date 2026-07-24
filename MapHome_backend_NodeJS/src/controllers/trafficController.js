const TrafficEvent = require("../models/TrafficEvent");

// @desc    Create a new traffic event
// @route   POST /api/traffic
const createEvent = async (req, res, next) => {
  try {
    const event = new TrafficEvent(req.body);
    // If auth is implemented, you could set event.reportedBy = req.user._id
    await event.save();
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active traffic events
// @route   GET /api/traffic
const getActiveEvents = async (req, res, next) => {
  try {
    const events = await TrafficEvent.find({ active: true });
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if a given route intersects with any active traffic events
// @route   POST /api/traffic/check-route
const checkRouteIntersection = async (req, res, next) => {
  try {
    const { route } = req.body;

    // Expected format: GeoJSON LineString for the route
    if (!route || route.type !== "LineString" || !Array.isArray(route.coordinates)) {
      return res.status(400).json({
        success: false,
        message: "Invalid route. Must be a valid GeoJSON LineString.",
      });
    }

    // Use $geoIntersects to find any active traffic events that cross the given route
    const intersectingEvents = await TrafficEvent.find({
      active: true,
      location: {
        $geoIntersects: {
          $geometry: route,
        },
      },
    });

    res.status(200).json({
      success: true,
      hasIntersections: intersectingEvents.length > 0,
      intersectingEvents,
    });
  } catch (error) {
    console.error("[TrafficController] checkRouteIntersection Error:", error);
    next(error);
  }
};

module.exports = {
  createEvent,
  getActiveEvents,
  checkRouteIntersection,
};
