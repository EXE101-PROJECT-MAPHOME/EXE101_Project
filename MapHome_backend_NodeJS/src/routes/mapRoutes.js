const express = require("express");
const router = express.Router();
const mapController = require("../controllers/mapController");
const { geocodeRules, autocompleteRules, placeDetailRules } = require("../validators/mapValidator");
const validate = require("../middleware/validate");

/**
 * @swagger
 * /api/map/reverse-geocode:
 *   get:
 *     summary: Convert coordinates (lat, lng) to human-readable address
 *     tags:
 *       - Map API
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude
 *         example: 10.7769
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude
 *         example: 106.7009
 *     responses:
 *       200:
 *         description: Geocode results
 *       400:
 *         description: Missing coordinates
 *       404:
 *         description: Address not found
 */
router.get("/reverse-geocode", geocodeRules, validate, mapController.reverseGeocode);

/**
 * @swagger
 * /api/map/autocomplete:
 *   get:
 *     summary: Get address suggestions based on input
 *     tags:
 *       - Map API
 *     parameters:
 *       - in: query
 *         name: input
 *         schema:
 *           type: string
 *         required: true
 *         description: Search text
 *         example: Đại học Bách Khoa
 *     responses:
 *       200:
 *         description: Address predictions
 *       400:
 *         description: Search input is required
 */
router.get("/autocomplete", autocompleteRules, validate, mapController.autocomplete);

/**
 * @swagger
 * /api/map/place-detail:
 *   get:
 *     summary: Get detailed info for a specific place by ID
 *     tags:
 *       - Map API
 *     parameters:
 *       - in: query
 *         name: place_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Goong Place ID
 *         example: 9Xau7e64...
 *     responses:
 *       200:
 *         description: Place details including coordinates and components
 *       400:
 *         description: Place ID is required
 *       404:
 *         description: Place not found
 */
router.get("/place-detail", placeDetailRules, validate, mapController.getPlaceDetail);

/**
 * @swagger
 * /api/map/properties-in-polygon:
 *   post:
 *     summary: Get properties inside a GeoJSON Polygon
 *     tags:
 *       - Map API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - polygon
 *             properties:
 *               polygon:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *                 description: Array of coordinate pairs [[lng, lat], [lng, lat], ...]
 *                 example: [[106.6, 10.7], [106.7, 10.7], [106.7, 10.8], [106.6, 10.7]]
 *     responses:
 *       200:
 *         description: List of properties inside the polygon
 *       400:
 *         description: Invalid polygon
 */
router.post("/properties-in-polygon", mapController.getPropertiesInPolygon);

module.exports = router;
