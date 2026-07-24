const express = require("express");
const router = express.Router();
const trafficController = require("../controllers/trafficController");

/**
 * @swagger
 * /api/traffic:
 *   post:
 *     summary: Create a new traffic event
 *     tags:
 *       - Traffic API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [flood, construction, accident, other]
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point, LineString, Polygon]
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       201:
 *         description: Event created
 */
router.post("/", trafficController.createEvent);

/**
 * @swagger
 * /api/traffic:
 *   get:
 *     summary: Get all active traffic events
 *     tags:
 *       - Traffic API
 *     responses:
 *       200:
 *         description: List of events
 */
router.get("/", trafficController.getActiveEvents);

/**
 * @swagger
 * /api/traffic/check-route:
 *   post:
 *     summary: Check if a given route intersects with any active traffic events
 *     tags:
 *       - Traffic API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - route
 *             properties:
 *               route:
 *                 type: object
 *                 description: GeoJSON LineString of the route
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: LineString
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: array
 *                       items:
 *                         type: number
 *     responses:
 *       200:
 *         description: Intersection check result
 */
router.post("/check-route", trafficController.checkRouteIntersection);

module.exports = router;
