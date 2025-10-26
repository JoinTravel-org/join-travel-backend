import { Router } from "express";
import {
  addPlace,
  checkPlace,
  getPlaces,
  getPlaceById,
  updatePlaceDescription,
} from "../controllers/place.controller.js";
import {
  createReview,
  getReviewsByPlace,
  getReviewStats,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/places:
 *   get:
 *     summary: Get paginated list of places for feed display
 *     description: Retrieves a paginated list of available places for the feed display with infinite scroll support.
 *     tags: [Places]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: The page number to retrieve
 *         example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of places per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Places retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 places:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique identifier for the place
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       name:
 *                         type: string
 *                         description: Display name of the place
 *                         example: "Eiffel Tower"
 *                       image:
 *                         type: string
 *                         nullable: true
 *                         description: URL to the place's image (optional)
 *                         example: "https://example.com/image.jpg"
 *                       rating:
 *                         type: number
 *                         format: float
 *                         nullable: true
 *                         description: Numeric rating value (1-5 scale)
 *                         example: 4.5
 *                 totalCount:
 *                   type: integer
 *                   description: Total number of places across all pages
 *                   example: 150
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Add a new place from Google Maps
 *     description: Create a new place in the database using data from Google Maps. Checks for duplicates by name and exact coordinates.
 *     tags: [Places]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 description: Place name from Google Maps
 *                 example: "Eiffel Tower"
 *               address:
 *                 type: string
 *                 description: Formatted address from Google Maps
 *                 example: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France"
 *               latitude:
 *                 type: number
 *                 format: float
 *                 description: Latitude coordinate
 *                 example: 48.8584
 *                 minimum: -90
 *                 maximum: 90
 *               longitude:
 *                 type: number
 *                 format: float
 *                 description: Longitude coordinate
 *                 example: 2.2945
 *                 minimum: -180
 *                 maximum: 180
 *               image:
 *                 type: string
 *                 description: Image URL from Google Maps (optional)
 *                 example: "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=..."
 *     responses:
 *       201:
 *         description: Place added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Place added successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Place'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Place already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Este lugar ya está registrado."
 *       503:
 *         description: External service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Servicio externo no disponible."
 */
router.get("/", getPlaces);
router.post("/", addPlace);

/**
 * @swagger
 * /api/places/check:
 *   get:
 *     summary: Check if a place already exists
 *     description: Verify if a place already exists before attempting to add it. Checks by exact name and coordinates.
 *     tags: [Places]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Place name to check
 *         example: "Eiffel Tower"
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Latitude coordinate
 *         example: 48.8584
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Longitude coordinate
 *         example: 2.2945
 *     responses:
 *       200:
 *         description: Place existence check completed
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     exists:
 *                       type: boolean
 *                       example: true
 *                     place:
 *                       $ref: '#/components/schemas/Place'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     exists:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: External service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Servicio externo no disponible."
 */
router.get("/check", checkPlace);

/**
 * @swagger
 * /api/places/{id}:
 *   get:
 *     summary: Get a place by ID
 *     description: Retrieves detailed information about a specific place using its ID.
 *     tags: [Places]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the place
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Place retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Place'
 *       404:
 *         description: Place not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Lugar no encontrado."
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", getPlaceById);

/**
 * @swagger
 * /api/places/{id}/description:
 *   put:
 *     summary: Update place description
 *     description: Updates the description of an existing place. Requires authentication.
 *     tags: [Places]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the place
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 minLength: 30
 *                 maxLength: 1000
 *                 description: New description for the place
 *                 example: "This is a beautiful historical monument located in the heart of the city. It features stunning architecture and offers panoramic views of the surrounding area."
 *     responses:
 *       200:
 *         description: Description updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Description updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     name:
 *                       type: string
 *                       example: "Eiffel Tower"
 *                     description:
 *                       type: string
 *                       example: "This is a beautiful historical monument..."
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-10-24T21:26:10.748Z"
 *       400:
 *         description: Invalid description
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid description"
 *                 error:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["La descripción debe tener al menos 30 caracteres"]
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Access denied. No token provided."
 *       404:
 *         description: Place not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Place not found"
 *                 error:
 *                   type: string
 *                   example: "Place with given ID not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Detailed error information"
 */
router.put("/:id/description", authenticate, updatePlaceDescription);

/**
 * @swagger
 * /api/places/{placeId}/reviews:
 *   post:
 *     summary: Create a new review for a place
 *     description: Creates a new review for a specific place. Requires user authentication.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the place to review
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - content
 *             properties:
 *               rating:
 *                 type: integer
 *                 description: Rating value (1-5 stars)
 *                 example: "5"
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Review content (minimum 10 characters)
 *                 example: "Great place to visit with family"
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Media files to upload (JPEG, PNG, GIF, WEBP, MP4, MOV) - maximum 10 files, 50MB each
 *                 maxItems: 10
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Reseña creada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "uuid"
 *                     rating:
 *                       type: integer
 *                       example: 4
 *                     content:
 *                       type: string
 *                       example: "Great place to visit"
 *                     placeId:
 *                       type: string
 *                       example: "uuid"
 *                     userId:
 *                       type: string
 *                       example: "uuid"
 *                     media:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "uuid"
 *                           filename:
 *                             type: string
 *                             example: "abc123.jpg"
 *                           originalFilename:
 *                             type: string
 *                             example: "photo1.jpg"
 *                           fileSize:
 *                             type: integer
 *                             example: 2048576
 *                           mimeType:
 *                             type: string
 *                             example: "image/jpeg"
 *                           url:
 *                             type: string
 *                             example: "http://localhost:3000/uploads/reviews/abc123.jpg"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Place not found
 *       409:
 *         description: User already reviewed this place
 *   get:
 *     summary: Get all reviews for a place
 *     description: Retrieves all reviews for a specific place
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the place
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       rating:
 *                         type: integer
 *                       content:
 *                         type: string
 *                       userEmail:
 *                         type: string
 *                       media:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             filename:
 *                               type: string
 *                             originalFilename:
 *                               type: string
 *                             fileSize:
 *                               type: integer
 *                             mimeType:
 *                               type: string
 *                             url:
 *                               type: string
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Place not found
 */
router.post("/:placeId/reviews", authenticate, createReview);
router.get("/:placeId/reviews", getReviewsByPlace);

/**
 * @swagger
 * /api/places/{placeId}/reviews/stats:
 *   get:
 *     summary: Get review statistics for a place
 *     description: Get total number of reviews and average rating for a place
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: placeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the place
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalReviews:
 *                   type: integer
 *                   example: 25
 *                 averageRating:
 *                   type: number
 *                   format: float
 *                   example: 4.2
 *       404:
 *         description: Place not found
 */
router.get("/:placeId/reviews/stats", getReviewStats);

export default router;
