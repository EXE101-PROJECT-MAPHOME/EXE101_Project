const axios = require("axios");
const NodeCache = require("node-cache");

// Cache TTL: 24 hours (86400 seconds)
const mapCache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });

/**
 * Map Controller - Handles integration with Goong Maps logic
 */

const GOONG_API_KEY = process.env.GOONG_API_KEY;

// @desc    Convert coordinates (lat, lng) to human-readable address
// @route   GET /api/map/reverse-geocode
const reverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const cacheKey = `reverse_${lat}_${lng}`;
    const cachedData = mapCache.get(cacheKey);
    if (cachedData) {
      console.log(`[MapCache] Hit for ${cacheKey}`);
      return res.status(200).json(cachedData);
    }

    const url = `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${GOONG_API_KEY}`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      mapCache.set(cacheKey, result);
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "No address found for these coordinates" });
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
    
    const response = await axios.get(url);
    const predictions = response.data.predictions || [];
    
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
    
    const response = await axios.get(url);
    
    if (response.data && response.data.result) {
      const result = response.data.result;
      mapCache.set(cacheKey, result);
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: "Place not found" });
    }
  } catch (error) {
    next(error);
  }
};


module.exports = {
  reverseGeocode,
  autocomplete,
  getPlaceDetail,
};
