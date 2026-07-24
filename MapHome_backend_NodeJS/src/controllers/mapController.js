const NodeCache = require("node-cache");
const Property = require("../models/Property");

// Cache TTL: 24 hours (86400 seconds)
const mapCache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });

/**
 * Map Controller - Handles integration with Goong Maps logic
 */

const GOONG_API_KEY = process.env.GOONG_API_KEY;

const normalizeAddressComponents = (components) => {
  if (!Array.isArray(components)) return [];

  return components
    .filter(
      (component) =>
        component &&
        typeof component === "object" &&
        typeof component.long_name === "string" &&
        typeof component.short_name === "string" &&
        Array.isArray(component.types),
    )
    .map((component) => ({
      long_name: component.long_name,
      short_name: component.short_name,
      types: component.types.filter((type) => typeof type === "string"),
    }));
};

// Fallback: Parse formatted_address to create synthetic address_components
const parseFormattedAddress = (formattedAddress) => {
  if (!formattedAddress || typeof formattedAddress !== "string") return [];

  // Split by comma and clean up
  const parts = formattedAddress.split(",").map((p) => p.trim());
  const components = [];

  // Vietnam location hierarchy: address, street, ward, district, province
  const vietnamProvinces = [
    "Thành phố Hồ Chí Minh",
    "TP. Hồ Chí Minh",
    "Hà Nội",
    "Đà Nẵng",
    "Thành phố Cần Thơ",
    "Thành phố Hải Phòng",
  ];
  const wardPatterns = /^(Phường|Xã|Thị trấn|P\.|X\.)/i;
  const districtPatterns = /^(Quận|Huyện|Q\.|H\.)/i;

  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];

    // Try to match province
    if (vietnamProvinces.some((prov) => part.includes(prov))) {
      components.unshift({
        long_name: part,
        short_name: part.replace("Thành phố ", "").replace("TP. ", ""),
        types: ["administrative_area_level_1"],
      });
    }
    // Try to match district
    else if (districtPatterns.test(part)) {
      components.unshift({
        long_name: part,
        short_name: part.replace(/^(Quận|Huyện|Q\.|H\.)\s*/, ""),
        types: ["administrative_area_level_2"],
      });
    }
    // Try to match ward
    else if (wardPatterns.test(part)) {
      components.unshift({
        long_name: part,
        short_name: part.replace(/^(Phường|Xã|Thị trấn|P\.|X\.)\s*/, ""),
        types: ["sublocality_level_1"],
      });
    }
    // Otherwise treat as street/locality
    else if (
      i === 0 ||
      !vietnamProvinces.some((prov) => parts[i + 1]?.includes(prov))
    ) {
      components.unshift({
        long_name: part,
        short_name: part,
        types: i === 0 ? ["route"] : ["locality"],
      });
    }
  }

  return components;
};

// @desc    Convert coordinates (lat, lng) to human-readable address
// @route   GET /api/map/reverse-geocode
const reverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const cacheKey = `reverse_${lat}_${lng}`;
    const cachedData = mapCache.get(cacheKey);
    if (cachedData) {
      console.log(`[MapCache] Hit for ${cacheKey}`);
      return res.status(200).json(cachedData);
    }

    const url = `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${GOONG_API_KEY}`;

    const response = await fetch(url);
    const responseData = await response.json();

    if (
      responseData &&
      responseData.results &&
      responseData.results.length > 0
    ) {
      const result = responseData.results[0];
      const normalizedResult = {
        ...result,
        formatted_address: result.formatted_address || "",
        address_components: normalizeAddressComponents(
          result.address_components,
        ),
      };
      mapCache.set(cacheKey, normalizedResult);
      res.status(200).json(normalizedResult);
    } else {
      res
        .status(404)
        .json({ message: "No address found for these coordinates" });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get address suggestions based on input
// @route   GET /api/map/autocomplete
const autocomplete = async (req, res, next) => {
  try {
    const { input } = req.query;

    if (!input) {
      return res.status(400).json({ message: "Search input is required" });
    }

    const cacheKey = `autocomplete_${input.toLowerCase().trim()}`;
    const cachedData = mapCache.get(cacheKey);
    if (cachedData) {
      console.log(`[MapCache] Hit for ${cacheKey}`);
      return res.status(200).json(cachedData);
    }

    // Bias results towards Ho Chi Minh City (10.7769, 106.7009) with 20km radius
    const locationBias = "10.7769,106.7009";
    const radiusBias = 20000;
    const url = `https://rsapi.goong.io/Place/Autocomplete?input=${encodeURIComponent(input)}&location=${locationBias}&radius=${radiusBias}&api_key=${GOONG_API_KEY}`;

    const response = await fetch(url);
    const responseData = await response.json();
    const predictions = responseData.predictions || [];

    mapCache.set(cacheKey, predictions);
    res.status(200).json(predictions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed info for a specific place by ID
// @route   GET /api/map/place-detail
const getPlaceDetail = async (req, res, next) => {
  try {
    const { place_id } = req.query;

    if (!place_id) {
      return res.status(400).json({ message: "Place ID is required" });
    }

    const cacheKey = `place_${place_id}`;
    const cachedData = mapCache.get(cacheKey);
    if (cachedData) {
      console.log(`[MapCache] Hit for ${cacheKey}`);
      return res.status(200).json(cachedData);
    }

    const url = `https://rsapi.goong.io/Place/Detail?place_id=${place_id}&api_key=${GOONG_API_KEY}`;

    const response = await fetch(url);
    const responseData = await response.json();

    if (responseData && responseData.result) {
      const result = responseData.result;

      // Debug logging
      console.log("[Goong Place Detail] Raw result:", {
        formatted_address: result.formatted_address,
        address_components: result.address_components,
      });

      // Extract geometry safely
      const geometry = result.geometry || {};
      const location = geometry.location || {};

      // Normalize address components, with fallback to parse formatted_address
      let addressComponents = normalizeAddressComponents(
        result.address_components,
      );

      // If no components, try to parse from formatted_address
      if (addressComponents.length === 0 && result.formatted_address) {
        console.log(
          "[Goong Place Detail] No address_components, using fallback parser",
        );
        addressComponents = parseFormattedAddress(result.formatted_address);
      }

      const normalizedResult = {
        // Return structured format that matches frontend expectations
        formatted_address: result.formatted_address || "",
        geometry: {
          location: {
            lat: location.lat || 0,
            lng: location.lng || 0,
          },
        },
        address_components: addressComponents,
        // Keep other useful fields
        place_id: result.place_id,
        name: result.name,
        types: result.types || [],
      };

      console.log("[Goong Place Detail] Final normalized result:", {
        formatted_address: normalizedResult.formatted_address,
        location: normalizedResult.geometry.location,
        components_count: normalizedResult.address_components.length,
        components: normalizedResult.address_components,
      });

      mapCache.set(cacheKey, normalizedResult);
      res.status(200).json(normalizedResult);
    } else {
      res.status(404).json({ message: "Place not found" });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get properties inside a GeoJSON Polygon (Isochrone support)
// @route   POST /api/map/properties-in-polygon
const getPropertiesInPolygon = async (req, res, next) => {
  try {
    const { polygon } = req.body;

    // Validate polygon payload
    // Expected format: Array of coordinate pairs [[lng, lat], [lng, lat], ...]
    if (!polygon || !Array.isArray(polygon) || polygon.length < 4) {
      return res.status(400).json({ 
        message: "Invalid polygon coordinates. Must be a valid GeoJSON LinearRing (array of at least 4 coordinate pairs)." 
      });
    }

    // Ensure the polygon is closed (first and last coordinate must be identical)
    const firstCoord = polygon[0];
    const lastCoord = polygon[polygon.length - 1];
    if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
      polygon.push([...firstCoord]); // Close it
    }

    // Perform geospatial query using MongoDB $geoWithin
    const properties = await Property.find({
      location: {
        $geoWithin: {
          $geometry: {
            type: "Polygon",
            coordinates: [polygon], // Polygon needs an array of rings
          },
        },
      },
      status: "approved", // Only show approved properties
      available: true
    }).populate("landlordId", "name avatar phone");

    const formattedProperties = properties.map(p => {
      const prop = typeof p.toObject === 'function' ? p.toObject() : { ...p };
      if (prop.location && prop.location.coordinates) {
        prop.location = prop.location.coordinates;
      }
      return prop;
    });

    res.status(200).json({
      success: true,
      count: formattedProperties.length,
      data: formattedProperties,
    });
  } catch (error) {
    console.error("[MapController] getPropertiesInPolygon Error:", error);
    next(error);
  }
};

module.exports = {
  reverseGeocode,
  autocomplete,
  getPlaceDetail,
  getPropertiesInPolygon,
};
