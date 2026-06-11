const express = require('express');
const router = express.Router();
const { getProvinces, getDistricts, getWards } = require('../controllers/locationController');

router.get('/provinces', getProvinces);
router.get('/districts/:provinceCode', getDistricts);
router.get('/wards/:districtCode', getWards);

module.exports = router;
