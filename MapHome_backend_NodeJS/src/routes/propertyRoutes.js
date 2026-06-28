const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/propertyController");
const {
  createPropertyRules,
  updatePropertyRules,
  searchPropertiesRules,
  nearbyPropertiesRules,
} = require("../validators/propertyValidator");
const validate = require("../middleware/validate");

const {
  authMiddleware,
  requireAnyRole,
} = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/properties/stats/public:
 *   get:
 *     summary: Get public stats for homepage
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: Public statistics
 */
router.get("/stats/public", getPublicStats);

/**
 * @swagger
 * /api/properties/stats/districts:
 *   get:
 *     summary: Get stats by district for homepage
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: Property counts by district
 */
router.get("/stats/districts", getDistrictsStats);

/**
 * @swagger
 * /api/properties/search:
 *   get:
 *     summary: Search and filter properties
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Keywords for name or address
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *         description: District or area
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *         description: User's current latitude for proximity search
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *         description: User's current longitude for proximity search
 *       - in: query
 *         name: radius
 *         schema: { type: number }
 *         description: Search radius in KM
 *         default: 5
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/search", searchPropertiesRules, validate, searchProperties);

/**
 * @swagger
 * /api/properties/nearby:
 *   get:
 *     summary: Find properties near coordinates
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *         required: true
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *         required: true
 *       - in: query
 *         name: radius
 *         schema: { type: number }
 *         default: 5
 *     responses:
 *       200:
 *         description: Nearby properties
 */
router.get("/nearby", nearbyPropertiesRules, validate, getNearbyProperties);

/**
 * @swagger
 * /api/properties/search-multiple:
 *   get:
 *     summary: Search properties near multiple workplace locations
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: locations
 *         schema: { type: string }
 *         description: JSON string of points [{"lat":10.7,"lng":106.6,"radius":2},...]
 *     responses:
 *       200:
 *         description: Matching properties
 */
router.get("/search-multiple", searchByMultipleLocations);

/**
 * @swagger
 * /api/properties/landlord/{landlordId}:
 *   get:
 *     summary: Get properties by landlord ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: landlordId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Landlord's properties
 */
router.get("/landlord/:landlordId", getPropertiesByLandlord);

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all approved properties with basic filters
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: List of properties
 *   post:
 *     summary: Create a new property listing
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, area, address, location]
 *     responses:
 *       201:
 *         description: Property created successfully
 */
router
  .route("/")
  .get(getProperties)
  .post(
    authMiddleware,
    requireAnyRole(["landlord", "broker"]),
    createPropertyRules,
    validate,
    createProperty,
  );

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get single property details by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detailed property info
 *   put:
 *     summary: Update an existing propertylisting
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property updated
 *   delete:
 *     summary: Delete a propertylisting
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property removed
 */
router
  .route("/:id")
  .get(getPropertyById)
  .put(
    authMiddleware,
    requireAnyRole(["landlord", "broker"]),
    updatePropertyRules,
    validate,
    updateProperty,
  )
  .delete(authMiddleware, requireAnyRole(["landlord", "broker"]), deleteProperty);

/**
 * @swagger
 * /api/properties/{id}/favorite:
 *   post:
 *     summary: Toggle favorite status for a property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [add, remove]
 *     responses:
 *       200:
 *         description: Updated favorite count
 */
router.post("/:id/favorite", authMiddleware, toggleFavorite);

/**
 * @swagger
 * /api/properties/{id}/view:
 *   post:
 *     summary: Increment view count for a property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated view count
 */
router.post("/:id/view", incrementView);

/**
 * @swagger
 * /api/properties/{id}/renew:
 *   put:
 *     summary: Renew an expired propertylisting
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property renewed with new expiry date
 */
router.put(
  "/:id/renew",
  authMiddleware,
  requireAnyRole(["landlord", "broker"]),
  renewProperty,
);

/**
 * @swagger
 * /api/properties/{id}/pin:
 *   post:
 *     summary: Pin a property to highlight it
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 description: Optional note about the pin
 *               photoAtPin:
 *                 type: string
 *                 description: Optional photo URL at pin time
 *     responses:
 *       200:
 *         description: Property pinned successfully
 */
router.post(
  "/:id/pin",
  authMiddleware,
  requireAnyRole(["landlord", "broker"]),
  pinProperty,
);

/**
 * @swagger
 * /api/properties/{id}/unpin:
 *   post:
 *     summary: Unpin a property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property unpinned successfully
 */
router.post(
  "/:id/unpin",
  authMiddleware,
  requireAnyRole(["landlord", "broker"]),
  unpinProperty,
);

/**
 * @swagger
 * /api/properties/{id}/verify-location:
 *   post:
 *     summary: Verify property GPS location
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat: { type: number, example: 10.7769 }
 *               lng: { type: number, example: 106.6965 }
 *               accuracy: { type: number, example: 12.5 }
 *     responses:
 *       200:
 *         description: GPS verification completed
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.post(
  "/:id/verify-location",
  authMiddleware,
  requireAnyRole(["landlord", "broker"]),
  verifyPropertyLocation,
);

module.exports = router;
