const Property = require("../models/Property");
const User = require("../models/User");
const Review = require("../models/Review");
const SystemSetting = require("../models/SystemSetting");
const axios = require("axios");

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const normalizeFrontendVerificationLevel = (level) => {
  if (level === "verified") return "location-verified";
  if (level === "none") return "unverified";
  return level;
};

/**
 * Normalize location to GeoJSON Point format
 * Handles both old format [lng, lat] and new format { type: "Point", coordinates: [lng, lat] }
 */
const normalizeLocationToGeoJSON = (location) => {
  if (!location) return null;

  // Already in GeoJSON format
  if (location.type === "Point" && Array.isArray(location.coordinates)) {
    return location;
  }

  // Old format: plain array [lng, lat]
  if (Array.isArray(location) && location.length >= 2) {
    return {
      type: "Point",
      coordinates: [Number(location[0]), Number(location[1])],
    };
  }

  return null;
};

/**
 * Normalize images array
 * Handles both old format (single image) and new format (multiple images)
 */
const normalizeImages = (image, images) => {
  const imageArray = [];

  // Add from new 'images' field
  if (Array.isArray(images) && images.length > 0) {
    imageArray.push(...images.filter((img) => img && typeof img === "string"));
  }

  // Add from old 'image' field if not already included
  if (
    image &&
    typeof image === "string" &&
    !imageArray.includes(image) &&
    imageArray.length === 0
  ) {
    imageArray.push(image);
  }

  return imageArray;
};

const serializePropertyForClient = (propertyDoc) => {
  if (!propertyDoc) return propertyDoc;

  const property =
    typeof propertyDoc.toObject === "function"
      ? propertyDoc.toObject()
      : { ...propertyDoc };

  if (
    property.verificationLevel === "location-verified" ||
    property.verificationLevel === "phone-verified" ||
    property.verificationLevel === "verified"
  ) {
    property.verificationLevel = "verified";
  } else if (
    property.verificationLevel === "unverified" ||
    property.verificationLevel === "none"
  ) {
    property.verificationLevel = "none";
  }

  // Normalize location: convert GeoJSON back to [lng, lat] for frontend
  if (property.location && property.location.coordinates) {
    property.location = property.location.coordinates;
  }

  // Ensure images array exists
  if (!property.images) {
    property.images = property.image ? [property.image] : [];
  }

  return property;
};

const getPopularPriceRange = (propertyDocs) => {
  const pinnedProperties = propertyDocs.filter(
    (property) =>
      property.pinInfo &&
      (property.pinInfo.pinnedAt ||
        property.pinInfo.pinnedBy ||
        property.pinInfo.note ||
        property.pinInfo.photoAtPin),
  );

  const source = pinnedProperties.length > 0 ? pinnedProperties : propertyDocs;
  const prices = source
    .map((property) => Number(property.price))
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

/**
 * Helper to fetch real-time nearby landmarks from Goong API
 * @param {Array|Object} propertyLocation [lng, lat] or GeoJSON Point { type: "Point", coordinates: [lng, lat] }
 */
const getNearbyLandmarks = async (propertyLocation) => {
  if (!propertyLocation) return [];

  let lng, lat;

  // Handle both old [lng, lat] and new GeoJSON Point formats
  if (Array.isArray(propertyLocation) && propertyLocation.length >= 2) {
    [lng, lat] = propertyLocation;
  } else if (
    propertyLocation.type === "Point" &&
    Array.isArray(propertyLocation.coordinates) &&
    propertyLocation.coordinates.length >= 2
  ) {
    [lng, lat] = propertyLocation.coordinates;
  } else {
    return [];
  }

  // Validate coordinates to prevent "undefined,undefined"
  if (lat === undefined || lng === undefined || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return [];
  }

  try {
    // NOTE: Goong API does not natively support the /Place/NearbySearch endpoint 
    // (this is a Google Maps endpoint). Calling it will result in a 404 error.
    // For now, we return an empty array to prevent spamming errors.
    // If you need Nearby Search, consider using Google Maps Places API or 
    // implement a local geospatial query if you have POI data in your database.
    return [];

    /* 
    const GOONG_API_KEY =
      process.env.GOONG_API_KEY || "9Xau7e646cReoQa17uHw6Dp1KLPG7ahl9iDGy8V1";
    const types = "university,school,hospital,park";
    const radius = 3000; // 3km radius

    const url = `https://rsapi.goong.io/Place/NearbySearch?location=${lat},${lng}&radius=${radius}&type=${types}&api_key=${GOONG_API_KEY}`;

    const response = await axios.get(url);
    const places = response.data.results || [];

    return places
      .slice(0, 10)
      .map((place) => {
        const distance = haversineKm(
          lat,
          lng,
          place.geometry.location.lat,
          place.geometry.location.lng,
        );

        return {
          name: place.name,
          distanceKm: Number(distance.toFixed(2)),
          distanceText:
            distance < 1
              ? `${Math.round(distance * 1000)}m`
              : `${distance.toFixed(1)}km`,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
    */
  } catch (error) {
    console.error("Goong API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    return [];
  }
};

// @desc    Get all properties
// @route   GET /api/properties
const getProperties = async (req, res) => {
  try {
    // Basic filtering via query params (name, minPrice, maxPrice, minArea, maxArea, available)
    const query = {};
    if (req.query.name) {
      query.$or = [
        { name: new RegExp(req.query.name, "i") },
        { address: new RegExp(req.query.name, "i") },
      ];
    }
    if (req.query.minPrice)
      query.price = {
        ...(query.price || {}),
        $gte: Number(req.query.minPrice),
      };
    if (req.query.maxPrice)
      query.price = {
        ...(query.price || {}),
        $lte: Number(req.query.maxPrice),
      };
    if (req.query.minArea)
      query.area = { ...(query.area || {}), $gte: Number(req.query.minArea) };
    if (req.query.maxArea)
      query.area = { ...(query.area || {}), $lte: Number(req.query.maxArea) };
    if (req.query.available) {
      query.available = req.query.available === "true";
    } else if (!req.query.all) {
      // Default to only showing available properties for public users
      // query.available = true; // Bỏ lọc available mặc định để đồng nhất với Search API
    }

    // Add status and verified filters
    if (req.query.status) query.status = req.query.status;
    else if (!req.query.all) {
      query.status = "approved"; // Default to approved unless explicitly asking for all
      // Also filter out expired if only approved are requested
      query.status = { $eq: "approved" };
      query.$or = [
        { expiryDate: { $gt: new Date() } },
        { expiryDate: { $exists: false } },
        { expiryDate: null }
      ];
    }

    if (req.query.verified === "true") query["greenBadge.level"] = "verified";

    const properties = await Property.find(query).populate(
      "landlordId",
      "name phone email avatar rating",
    );

    // Augment with proximity info (Processing sequentially or with Promise.all)
    // For many properties, calling API for each one is slow.
    // We'll only augment if there are few results or it's specifically requested.
    const priceRange = getPopularPriceRange(properties || []);

    const augmentedProperties = await Promise.all(
      properties.map(async (p) => {
        const pObj = serializePropertyForClient(p);
        pObj.nearbyLandmarks = await getNearbyLandmarks(p.location);
        return pObj;
      }),
    );

    res.status(200).json(augmentedProperties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "landlordId",
      "name phone email avatar rating",
    );
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const propertyObj = serializePropertyForClient(property);
    propertyObj.nearbyLandmarks = await getNearbyLandmarks(property.location);

    res.status(200).json(propertyObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProperty = async (req, res) => {
  try {
    const payload = { ...req.body };
    const Landlord = require("../models/Landlord");

    if (req.user) {
      if (req.user.role === "broker") {
        const Broker = require("../models/Broker");
        const broker = await Broker.findOne({ userId: req.user._id });
        if (broker) {
          payload.brokerId = broker._id;
          payload.ownerName = payload.ownerName || broker.name;
          payload.phone = payload.phone || broker.phone;

          // Increment listing count
          broker.totalListings += 1;
          await broker.save();
        } else {
          return res.status(400).json({
            message: "Broker profile not found.",
            error: "BROKER_NOT_FOUND",
          });
        }
      } else {
        const landlord = await Landlord.findOne({ userId: req.user._id });
        if (landlord) {
          payload.landlordId = landlord._id;
          payload.ownerName = landlord.name;

          // Increment listing count
          landlord.totalListings += 1;
          await landlord.save();
        } else {
          // Landlord not found - return error
          return res.status(400).json({
            message:
              "Landlord profile not found. Please complete your landlord profile first.",
            error: "LANDLORD_NOT_FOUND",
          });
        }
      }
    } else {
      // Not authenticated
      return res.status(401).json({
        message: "Unauthorized. Please login first.",
        error: "NOT_AUTHENTICATED",
      });
    }

    // Set default expiry date from settings
    const settings = await SystemSetting.findOne();
    const expiryDays = settings?.automation?.defaultExpiryDays || 30;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    payload.expiryDate = expiryDate;
    payload.verificationLevel = normalizeFrontendVerificationLevel(
      payload.verificationLevel,
    );
    // Properties start as pending until admin approval
    payload.status = payload.status || "pending";

    // Normalize location to GeoJSON format
    const geoJsonLocation = normalizeLocationToGeoJSON(payload.location);
    if (geoJsonLocation) {
      payload.location = geoJsonLocation;
    } else {
      return res.status(400).json({
        message:
          "Invalid location format. Must provide coordinates as [lng, lat].",
        error: "INVALID_LOCATION",
      });
    }

    // Normalize images array
    payload.images = normalizeImages(payload.image, payload.images);
    // If no images provided, use the first image field as fallback
    if (payload.images.length === 0 && payload.image) {
      payload.images = [payload.image];
    }

    const property = await Property.create(payload);
    res.status(201).json(serializePropertyForClient(property));
  } catch (error) {
    console.error("Create property error:", error);
    res.status(400).json({
      message: error.message,
      error: error.name || "VALIDATION_ERROR",
      details: error.errors
        ? Object.keys(error.errors).map(
            (k) => `${k}: ${error.errors[k].message}`,
          )
        : undefined,
    });
  }
};

// GET /api/properties/nearby?lat=10.7&lng=106.6&radiusKm=5
const getNearbyProperties = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 5);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res
        .status(400)
        .json({ message: "lat and lng are required numbers" });
    }

    // Use MongoDB native geospatial search ($nearSphere)
    const properties = await Property.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat], // [lng, lat] format
          },
          $maxDistance: radius * 1000, // convert km to meters
        },
      },
      status: "approved",
      available: true,
    }).populate("landlordId", "name phone email avatar rating");

    // Augment with proximity info
    const result = await Promise.all(
      properties.map(async (p) => {
        const pObj = serializePropertyForClient(p);
        // Extract coordinates from GeoJSON Point
        const coords = p.location.coordinates;
        if (coords && coords.length >= 2) {
          pObj.nearbyLandmarks = await getNearbyLandmarks(coords);
          pObj.distanceToCenter = Number(
            haversineKm(lat, lng, coords[1], coords[0]).toFixed(2),
          );
        }
        return pObj;
      }),
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a property
// @route   PUT /api/properties/:id
const updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (req.user && req.user.role === "landlord") {
      const Landlord = require("../models/Landlord");
      const landlord = await Landlord.findOne({ userId: req.user._id });
      if (
        !landlord ||
        !property.landlordId ||
        property.landlordId.toString() !== landlord._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this property" });
      }
    }

    if (req.user && req.user.role === "broker") {
      const Broker = require("../models/Broker");
      const broker = await Broker.findOne({ userId: req.user._id });
      if (
        !broker ||
        !property.brokerId ||
        property.brokerId.toString() !== broker._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this property" });
      }
    }

    const updates = {
      ...req.body,
      verificationLevel: normalizeFrontendVerificationLevel(
        req.body.verificationLevel,
      ),
    };

    // Normalize location if provided
    if (updates.location) {
      const geoJsonLocation = normalizeLocationToGeoJSON(updates.location);
      if (geoJsonLocation) {
        updates.location = geoJsonLocation;
      } else {
        return res.status(400).json({
          message:
            "Invalid location format. Must provide coordinates as [lng, lat].",
          error: "INVALID_LOCATION",
        });
      }
    }

    // Normalize images if provided
    if (updates.image || updates.images) {
      updates.images = normalizeImages(updates.image, updates.images);
      if (updates.images.length === 0 && updates.image) {
        updates.images = [updates.image];
      }
    }

    property = await Property.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(serializePropertyForClient(property));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const Landlord = require("../models/Landlord");
    const Broker = require("../models/Broker");

    if (req.user && req.user.role === "landlord") {
      const landlord = await Landlord.findOne({ userId: req.user._id });
      if (
        !landlord ||
        !property.landlordId ||
        property.landlordId.toString() !== landlord._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this property" });
      }
    }

    if (req.user && req.user.role === "broker") {
      const broker = await Broker.findOne({ userId: req.user._id });
      if (
        !broker ||
        !property.brokerId ||
        property.brokerId.toString() !== broker._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this property" });
      }
    }

    if (property.landlordId) {
      await Landlord.findByIdAndUpdate(property.landlordId, {
        $inc: { totalListings: -1 },
      });
    }

    if (property.brokerId) {
      await Broker.findByIdAndUpdate(property.brokerId, {
        $inc: { totalListings: -1 },
      });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Property removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/properties/:id/favorite
const toggleFavorite = async (req, res) => {
  try {
    const { action } = req.body; // 'add' | 'remove'
    const property = await Property.findById(req.params.id);
    if (!property)
      return res.status(404).json({ message: "Property not found" });

    if (action === "add") property.favorites = (property.favorites || 0) + 1;
    else if (action === "remove")
      property.favorites = Math.max(0, (property.favorites || 0) - 1);
    else return res.status(400).json({ message: "Invalid action" });

    await property.save();
    res.status(200).json({ favorites: property.favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/properties/:id/view
const incrementView = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true },
    );
    if (!property)
      return res.status(404).json({ message: "Property not found" });
    res.status(200).json({ views: property.views });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get properties by landlord
// @route   GET /api/properties/landlord/:landlordId
const getPropertiesByLandlord = async (req, res) => {
  try {
    const landlordId = req.params.landlordId;
    const properties = await Property.find({ landlordId }).populate(
      "landlordId",
      "name phone email avatar rating",
    );
    res.status(200).json(properties.map(serializePropertyForClient));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search properties
// @route   GET /api/properties/search?q=...&location=...&page=...&limit=...
const searchProperties = async (req, res) => {
  try {
    const {
      q,
      location,
      page = 1,
      limit = 100, // Default 100 for map view
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      status,
      verified,
      amenities,
    } = req.query;

    const query = {};

    // Only approved properties for public search unless specified (and user is admin)
    if (status) {
      query.status = status;
    } else {
      query.status = "approved"; // Default to approved for public search
      query.$or = [
        { expiryDate: { $gt: new Date() } },
        { expiryDate: { $exists: false } },
        { expiryDate: null }
      ];
    }

    // Only filter by available if explicitly requested - map should show all approved listings
    if (req.query.available !== undefined) {
      query.available = req.query.available === "true";
    }
    // Note: removed forced available:true so both available and unavailable rooms show on map

    // Filter by verification
    if (verified === "true") {
      query["greenBadge.level"] = "verified";
    }

    // Search in name and address
    if (q) {
      if (req.query.lat && req.query.lng) {
        query.$or = [
          { name: new RegExp(q, "i") },
          { description: new RegExp(q, "i") },
          { address: new RegExp(q.split(",")[0], "i") },
        ];
      } else {
        query.$or = [
          { name: new RegExp(q, "i") },
          { address: new RegExp(q, "i") },
          { description: new RegExp(q, "i") },
        ];
      }
    }

    // Filter by location text (deprecated but kept for compatibility)
    if (location) {
      query.$or = query.$or || [];
      query.$or.push({ address: new RegExp(location.split(",")[0], "i") });
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Area range
    if (minArea || maxArea) {
      query.area = {};
      if (minArea) query.area.$gte = Number(minArea);
      if (maxArea) query.area.$lte = Number(maxArea);
    }

    // Amenities filter (Expected as comma-separated or array)
    if (amenities) {
      const amenityList = Array.isArray(amenities)
        ? amenities
        : amenities.split(",");
      amenityList.forEach((a) => {
        const key = a.split(":")[0]?.trim();
        if (key) {
          query[`amenities.${key}`] = true;
        }
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Check if location-based search is requested within search
    const hasGeoSearch = !!(req.query.lat && req.query.lng);

    if (hasGeoSearch) {
      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);
      const radius = Number(req.query.radius || 50); // Default 50km

      // NOTE: $nearSphere CANNOT be used with countDocuments() or .sort()
      query.location = {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radius * 1000,
        },
      };
    }

    let properties, total;

    if (hasGeoSearch) {
      // Geospatial: no sort (auto-sorted by distance), no countDocuments
      properties = await Property.find(query)
        .populate("landlordId", "name phone email avatar rating")
        .limit(Number(limit));
      total = properties.length;
    } else {
      // Text/filter search: can sort and count normally
      properties = await Property.find(query)
        .populate("landlordId", "name phone email avatar rating")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });
      total = await Property.countDocuments(query);
    }

    const priceRange = getPopularPriceRange(properties || []);

    const augmentedProperties = await Promise.all(
      properties.map(async (p) => {
        const pObj = serializePropertyForClient(p);
        // Extract coordinates from GeoJSON Point
        const coords = p.location.coordinates;
        if (coords && coords.length >= 2) {
          pObj.nearbyLandmarks = await getNearbyLandmarks(coords);
          if (hasGeoSearch) {
            pObj.distanceToCenter = Number(
              haversineKm(
                Number(req.query.lat),
                Number(req.query.lng),
                coords[1],
                coords[0],
              ).toFixed(2),
            );
          }
        }
        return pObj;
      }),
    );

    res.status(200).json({
      properties: augmentedProperties,
      priceRange,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("searchProperties error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/properties/search-multiple?locations=[{"lat":10.7,"lng":106.6,"radius":2},...]
const searchByMultipleLocations = async (req, res) => {
  try {
    const { locations } = req.query;
    if (!locations)
      return res.status(400).json({ message: "locations query is required" });

    const searchPoints = JSON.parse(locations);

    // For multiple locations, we can use $or with $centerSphere for native efficiency
    const geoQuery = {
      $or: searchPoints.map((point) => ({
        location: {
          $geoWithin: {
            $centerSphere: [
              [Number(point.lng), Number(point.lat)],
              (Number(point.radius) || 2) / 6371,
            ],
          },
        },
      })),
      status: "approved",
      available: true,
    };

    const properties = await Property.find(geoQuery).populate(
      "landlordId",
      "name phone email avatar rating",
    );

    const result = await Promise.all(
      properties.map(async (p) => {
        const pObj = serializePropertyForClient(p);
        pObj.nearbyLandmarks = await getNearbyLandmarks(p.location);
        return pObj;
      }),
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public stats for homepage
// @route   GET /api/properties/stats/public
const getPublicStats = async (req, res) => {
  try {
    const [totalProperties, totalUsers, distinctDistricts, reviews] =
      await Promise.all([
        Property.countDocuments({ status: "approved" }),
        User.countDocuments(),
        Property.distinct("district", {
          status: "approved",
          district: { $ne: null },
        }),
        Review.find().select("rating"),
      ]);

    // Calculate satisfaction rate from average review rating
    const satisfactionRate =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) /
              reviews.length /
              5) *
              100,
          )
        : 98; // Default 98% if no reviews

    res.status(200).json({
      totalProperties,
      totalUsers,
      totalDistricts: distinctDistricts.length || 12,
      satisfactionRate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stats by district for homepage
// @route   GET /api/properties/stats/districts
const getDistrictsStats = async (req, res) => {
  try {
    // Standard Hanoi districts for better mapping if address check is fuzzy
    const hanoiDistricts = [
      "Cầu Giấy",
      "Đống Đa",
      "Ba Đình",
      "Hai Bà Trưng",
      "Hoàn Kiếm",
      "Thanh Xuân",
      "Long Biên",
      "Nam Từ Liêm",
      "Bắc Từ Liêm",
      "Tây Hồ",
      "Hoàng Mai",
      "Hà Đông",
    ];

    const stats = await Promise.all(
      hanoiDistricts.map(async (name) => {
        const count = await Property.countDocuments({
          status: "approved",
          address: new RegExp(name, "i"),
        });
        return {
          name,
          count,
          image: `https://source.unsplash.com/featured/?hanoi,city,${name.replace(/ /g, "")}`,
        };
      }),
    );

    // Filter out districts with 0 properties for the landing page if desired,
    // or return all. We'll return top 6 with most properties.
    const sortedStats = stats.sort((a, b) => b.count - a.count).slice(0, 6);

    res.status(200).json(sortedStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Renew a property (extend expiry date by 30 days)
// @route   PUT /api/properties/:id/renew
const renewProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Authorization check
    if (req.user && req.user.role === "landlord") {
      const Landlord = require("../models/Landlord");
      const landlord = await Landlord.findOne({ userId: req.user._id });
      if (
        !landlord ||
        property.landlordId.toString() !== landlord._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to renew this property" });
      }
    }

    // Set new expiry date from settings
    const settings = await SystemSetting.findOne();
    const expiryDays = settings?.automation?.defaultExpiryDays || 30;

    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + expiryDays);

    property.expiryDate = newExpiryDate;
    property.status = "approved"; // Reset to approved if it was expired

    await property.save();
    res.status(200).json(serializePropertyForClient(property));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Pin a property (highlight it)
// @route   POST /api/properties/:id/pin
const pinProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Authorization check - only landlord who owns the property or admin can pin
    if (req.user && req.user.role === "landlord") {
      const Landlord = require("../models/Landlord");
      const landlord = await Landlord.findOne({ userId: req.user._id });
      if (
        !landlord ||
        property.landlordId.toString() !== landlord._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to pin this property" });
      }
    }

    const { note, photoAtPin } = req.body;

    property.pinInfo = {
      pinnedAt: new Date(),
      pinnedBy: req.user ? req.user._id : null,
      note: note || "",
      photoAtPin: photoAtPin || null,
    };

    await property.save();
    res.status(200).json({
      message: "Property pinned successfully",
      pinInfo: property.pinInfo,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Unpin a property
// @route   POST /api/properties/:id/unpin
const unpinProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Authorization check - only landlord who owns the property or admin can unpin
    if (req.user && req.user.role === "landlord") {
      const Landlord = require("../models/Landlord");
      const landlord = await Landlord.findOne({ userId: req.user._id });
      if (
        !landlord ||
        property.landlordId.toString() !== landlord._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to unpin this property" });
      }
    }

    property.pinInfo = {
      pinnedAt: null,
      pinnedBy: null,
      note: null,
      photoAtPin: null,
    };

    await property.save();
    res.status(200).json({
      message: "Property unpinned successfully",
      pinInfo: property.pinInfo,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Verify property GPS location
// @route   POST /api/properties/:id/verify-location
const verifyPropertyLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "GPS coordinates (lat, lng) are required" });
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Authorization check - only landlord who owns the property
    if (req.user && req.user.role === "landlord") {
      const Landlord = require("../models/Landlord");
      const landlord = await Landlord.findOne({ userId: req.user._id });
      if (
        !landlord ||
        property.landlordId.toString() !== landlord._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to verify this property" });
      }
    }

    // Calculate distance between pinned location and new GPS location
    // property.location is now GeoJSON Point: { type: "Point", coordinates: [lng, lat] }
    const coordinates = property.location.coordinates || [];
    const pinnedLng = coordinates[0];
    const pinnedLat = coordinates[1];

    if (!pinnedLng || !pinnedLat) {
      return res.status(400).json({
        message: "Property location is invalid",
        error: "INVALID_LOCATION",
      });
    }

    const distanceKm = haversineKm(pinnedLat, pinnedLng, lat, lng);
    const distanceM = distanceKm * 1000;
    const MISMATCH_THRESHOLD_M = 50; // 50 meters threshold

    // Update verification level based on distance
    if (distanceM <= MISMATCH_THRESHOLD_M) {
      // Location matches - verified
      property.verificationLevel = "location-verified";
      property.verifiedAt = new Date();
      property.greenBadge = {
        level: "verified",
        awardedAt: new Date(),
        awardedBy: "gps-verification",
        inspectionNotes: `Auto-verified via GPS - Distance: ${distanceM.toFixed(0)}m`,
      };
    } else {
      // Location mismatch - unverified but GPS attempted
      property.verificationLevel = "unverified";
      property.verifiedAt = new Date();
      property.greenBadge = {
        level: "none",
        awardedAt: null,
        awardedBy: null,
        inspectionNotes: `GPS mismatch detected - Distance: ${distanceM.toFixed(0)}m`,
      };
    }

    // Store accuracy from mobile device
    if (req.body.accuracy) {
      property.locationAccuracy = req.body.accuracy;
    }

    await property.save();

    const clientProperty = serializePropertyForClient(property);

    res.status(200).json({
      message:
        distanceM <= MISMATCH_THRESHOLD_M
          ? "✓ GPS verification successful - Location verified"
          : "⚠️ Location mismatch - GPS differs from pinned location",
      property: clientProperty,
      verification: {
        distance: {
          km: distanceKm.toFixed(2),
          m: distanceM.toFixed(0),
        },
        isVerified: distanceM <= MISMATCH_THRESHOLD_M,
        verificationLevel: clientProperty.verificationLevel,
        greenBadge: property.greenBadge,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  getNearbyProperties,
  updateProperty,
  deleteProperty,
  toggleFavorite,
  incrementView,
  getPropertiesByLandlord,
  searchProperties,
  searchByMultipleLocations,
  getPublicStats,
  getDistrictsStats,
  renewProperty,
  pinProperty,
  unpinProperty,
  verifyPropertyLocation,
};
