const { Province, District, Ward } = require("../models/Location");

// GET /api/locations/provinces
const getProvinces = async (req, res) => {
  try {
    const provinces = await Province.find().sort({ name: 1 });
    res.status(200).json(provinces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/locations/districts/:provinceCode
const getDistricts = async (req, res) => {
  try {
    const { provinceCode } = req.params;
    const districts = await District.find({ province_code: Number(provinceCode) }).sort({ name: 1 });
    res.status(200).json(districts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/locations/wards/:districtCode
const getWards = async (req, res) => {
  try {
    const { districtCode } = req.params;
    const wards = await Ward.find({ district_code: Number(districtCode) }).sort({ name: 1 });
    res.status(200).json(wards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProvinces,
  getDistricts,
  getWards,
};
