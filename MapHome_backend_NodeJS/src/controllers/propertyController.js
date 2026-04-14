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

/**
 * Helper to fetch real-time nearby landmarks from Goong API
 * @param {Array} propertyLocation [lng, lat]
 */
const getNearbyLandmarks = async (propertyLocation) => {
  if (!Array.isArray(propertyLocation) || propertyLocation.length < 2) return [];
  const [lng, lat] = propertyLocation;
  
  const GOONG_API_KEY = process.env.GOONG_API_KEY || "9Xau7e646cReoQa17uHw6Dp1KLPG7ahl9iDGy8V1";
  
  try {
    // Types to search for near the property
    const types = "university,school,hospital,park";
    const radius = 3000; // 3km radius
    
    const url = `https://rsapi.goong.io/Place/NearbySearch?location=${lat},${lng}&radius=${radius}&type=${types}&api_key=${GOONG_API_KEY}`;
    
    const response = await axios.get(url);
    const places = response.data.results || [];

    return places.slice(0, 10).map(place => {
      // Calculate distance manually if API doesn't provide it in the results directly in a way we want
      // Actually Goong NearbySearch doesn't always provide distance in the main results array
      const distance = haversineKm(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
      
      return {
        name: place.name,
        distanceKm: Number(distance.toFixed(2)),
        distanceText: distance < 1 
          ? `${Math.round(distance * 1000)}m` 
          : `${distance.toFixed(1)}km`
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  } catch (error) {
    console.error("Goong API Error:", error.message);
    return []; // Return empty array on failure to avoid breaking the whole response
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
      query.available = true;
    }

    // Add status and verified filters
    if (req.query.status) query.status = req.query.status;
    else if (!req.query.all) {
      query.status = "approved"; // Default to approved unless explicitly asking for all
      // Also filter out expired if only approved are requested
      query.status = { $eq: "approved" }; 
    }

    if (req.query.verified === "true") query["greenBadge.level"] = "verified";

    const properties = await Property.find(query).populate(
      "landlordId",
      "name phone email avatar rating",
    );

    // Augment with proximity info (Processing sequentially or with Promise.all)
    // For many properties, calling API for each one is slow. 
    // We'll only augment if there are few results or it's specifically requested.
    const augmentedProperties = await Promise.all(properties.map(async p => {
      const pObj = p.toObject();
      pObj.nearbyLandmarks = await getNearbyLandmarks(p.location);
      return pObj;
    }));

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
    
    const propertyObj = property.toObject();
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
      const landlord = await Landlord.findOne({ userId: req.user._id });
      if (landlord) {
        payload.landlordId = landlord._id;
        payload.ownerName = landlord.name;

        // Increment listing count
        landlord.totalListings += 1;
        await landlord.save();
      }
    }

    // Set default expiry date from settings
    const settings = await SystemSetting.findOne();
    const expiryDays = settings?.automation?.defaultExpiryDays || 30;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    payload.expiryDate = expiryDate;

    const property = await Property.create(payload);
    res.status(201).json(property);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    const result = await Promise.all(properties.map(async (p) => {
      const pObj = p.toObject();
      pObj.nearbyLandmarks = await getNearbyLandmarks(p.location);
      // Actual distance from search center
      if (p.location && p.location.length >= 2) {
        pObj.distanceToCenter = Number(haversineKm(lat, lng, p.location[1], p.location[0]).toFixed(2));
      }
      return pObj;
    }));

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
        property.landlordId.toString() !== landlord._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this property" });
      }
    }

    property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(property);
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
    if (req.user && req.user.role === "landlord") {
      const landlord = await Landlord.findOne({ userId: req.user._id });
      if (
        !landlord ||
        property.landlordId.toString() !== landlord._id.toString()
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
    res.status(200).json(properties);
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
      limit = 10,
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
    }

    // Default to only showing available properties for public search
    if (req.query.available) {
      query.available = req.query.available === "true";
    } else {
      query.available = true;
    }

    // Filter by verification
    if (verified === "true") {
      query["greenBadge.level"] = "verified";
    }

    // Search in name and address
    // IMPROVEMENT: If lat/lng are present, treat q more like a property-specific filter (name/desc) 
    // instead of an absolute address requirement, as the geospatial filter handles the address/area.
    if (q) {
      if (req.query.lat && req.query.lng) {
        // If searching by location, q should search in names/description
        // We make it a bit more flexible to avoid "Quận 1, HCM" failing to match "Quận 1" in DB
        query.$or = [
          { name: new RegExp(q, "i") },
          { description: new RegExp(q, "i") },
          { address: new RegExp(q.split(",")[0], "i") }, // Try matching only the first part of the search string (e.g. "Quận 1")
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
        const key = a.split(":")[0]?.trim(); // Handle key or key:value format
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
      const radius = Number(req.query.radius || 5);
      
      // NOTE: $nearSphere CANNOT be used with countDocuments() or .sort()
      // MongoDB handles sorting by distance automatically with $nearSphere
      query.location = {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radius * 1000
        }
      };
    }

    // When using $nearSphere, we CANNOT call countDocuments or .sort()
    // MongoDB restriction: $near/$nearSphere is incompatible with count() and explicit sort
    let properties, total;
    
    if (hasGeoSearch) {
      // Geospatial: no sort (auto-sorted by distance), no countDocuments
      properties = await Property.find(query)
        .populate("landlordId", "name phone email avatar rating")
        .limit(Number(limit));
      total = properties.length; // Approximate count from results
    } else {
      // Text/filter search: can sort and count normally
      properties = await Property.find(query)
        .populate("landlordId", "name phone email avatar rating")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });
      total = await Property.countDocuments(query);
    }

    const augmentedProperties = await Promise.all(properties.map(async p => {
      const pObj = p.toObject();
      pObj.nearbyLandmarks = await getNearbyLandmarks(p.location);
      if (hasGeoSearch) {
        pObj.distanceToCenter = Number(haversineKm(Number(req.query.lat), Number(req.query.lng), p.location[1], p.location[0]).toFixed(2));
      }
      return pObj;
    }));

    res.status(200).json({
      properties: augmentedProperties,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
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
      $or: searchPoints.map(point => ({
        location: {
          $geoWithin: {
            $centerSphere: [[Number(point.lng), Number(point.lat)], (Number(point.radius) || 2) / 6371]
          }
        }
      })),
      status: "approved",
      available: true
    };

    const properties = await Property.find(geoQuery).populate(
      "landlordId",
      "name phone email avatar rating",
    );

    const result = await Promise.all(properties.map(async (p) => {
      const pObj = p.toObject();
      pObj.nearbyLandmarks = await getNearbyLandmarks(p.location);
      return pObj;
    }));

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
    res.status(200).json(property);
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
};
