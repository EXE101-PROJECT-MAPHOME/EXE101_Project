const express = require("express");
const router = express.Router();
const { getSettings } = require("../controllers/settingController");

// Public access to basic settings (banners, seo, etc.)
router.get("/public", getSettings);

module.exports = router;
