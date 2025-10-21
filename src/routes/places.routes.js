import { Router } from "express";
import { addPlace, checkPlace, getPlaces } from "../controllers/place.controller.js";

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

export default router;