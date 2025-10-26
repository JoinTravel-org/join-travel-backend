import { Router } from "express";
import {
  createItinerary,
  getItineraryById,
  getUserItineraries,
  updateItinerary,
  deleteItinerary,
} from "../controllers/itinerary.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/itineraries:
 *   post:
 *     summary: Create a new itinerary
 *     description: Creates a new travel itinerary with places and dates for the authenticated user.
 *     tags: [Itineraries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - items
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the itinerary
 *                 example: "My European Adventure"
 *               items:
 *                 type: array
 *                 description: Array of places to visit with dates
 *                 items:
 *                   type: object
 *                   required:
 *                     - placeId
 *                     - date
 *                   properties:
 *                     placeId:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the place to visit
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     date:
 *                       type: string
 *                       format: date
 *                       description: Date to visit the place
 *                       example: "2024-06-15"
 *     responses:
 *       201:
 *         description: Itinerary created successfully
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
 *                   example: "Itinerario creado exitosamente."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           placeId:
 *                             type: string
 *                             format: uuid
 *                           date:
 *                             type: string
 *                             format: date
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation error
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
 *                   example: "El itinerario debe tener al menos un lugar."
 *       401:
 *         description: Unauthorized - authentication required
 *       409:
 *         description: Conflict - itinerary name already exists
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
 *                   example: "Ya existe un itinerario con este nombre."
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticate, createItinerary);

/**
 * @swagger
 * /api/itineraries:
 *   get:
 *     summary: Get user's itineraries
 *     description: Retrieves all itineraries for the authenticated user.
 *     tags: [Itineraries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Itineraries retrieved successfully
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
 *                   example: "Itinerarios obtenidos exitosamente."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             placeId:
 *                               type: string
 *                               format: uuid
 *                             date:
 *                               type: string
 *                               format: date
 *                             place:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                 name:
 *                                   type: string
 *                                 address:
 *                                   type: string
 *                                 latitude:
 *                                   type: number
 *                                 longitude:
 *                                   type: number
 *                                 image:
 *                                   type: string
 *                                 rating:
 *                                   type: number
 *                                 description:
 *                                   type: string
 *                                 city:
 *                                   type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticate, getUserItineraries);

/**
 * @swagger
 * /api/itineraries/{id}:
 *   get:
 *     summary: Get itinerary by ID
 *     description: Retrieves a specific itinerary by ID for the authenticated user.
 *     tags: [Itineraries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Itinerary ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Itinerary retrieved successfully
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
 *                   example: "Itinerario obtenido exitosamente."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           placeId:
 *                             type: string
 *                             format: uuid
 *                           date:
 *                             type: string
 *                             format: date
 *                           place:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               address:
 *                                 type: string
 *                               latitude:
 *                                 type: number
 *                               longitude:
 *                                 type: number
 *                               image:
 *                                 type: string
 *                               rating:
 *                                 type: number
 *                               description:
 *                                 type: string
 *                               city:
 *                                 type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - invalid ID
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user doesn't own this itinerary
 *       404:
 *         description: Itinerary not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authenticate, getItineraryById);

/**
 * @swagger
 * /api/itineraries/{id}:
 *   put:
 *     summary: Update an itinerary
 *     description: Updates an existing itinerary for the authenticated user.
 *     tags: [Itineraries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Itinerary ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New name for the itinerary
 *                 example: "Updated European Adventure"
 *               items:
 *                 type: array
 *                 description: Updated array of places to visit with dates
 *                 items:
 *                   type: object
 *                   required:
 *                     - placeId
 *                     - date
 *                   properties:
 *                     placeId:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the place to visit
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     date:
 *                       type: string
 *                       format: date
 *                       description: Date to visit the place
 *                       example: "2024-06-15"
 *     responses:
 *       200:
 *         description: Itinerary updated successfully
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
 *                   example: "Itinerario actualizado exitosamente."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           placeId:
 *                             type: string
 *                             format: uuid
 *                           date:
 *                             type: string
 *                             format: date
 *                           place:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               address:
 *                                 type: string
 *                               latitude:
 *                                 type: number
 *                               longitude:
 *                                 type: number
 *                               image:
 *                                 type: string
 *                               rating:
 *                                 type: number
 *                               description:
 *                                 type: string
 *                               city:
 *                                 type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user doesn't own this itinerary
 *       404:
 *         description: Itinerary not found
 *       409:
 *         description: Conflict - itinerary name already exists
 *       500:
 *         description: Internal server error
 */
router.put("/:id", authenticate, updateItinerary);

/**
 * @swagger
 * /api/itineraries/{id}:
 *   delete:
 *     summary: Delete an itinerary
 *     description: Deletes an itinerary for the authenticated user.
 *     tags: [Itineraries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Itinerary ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Itinerary deleted successfully
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
 *                   example: "Itinerario eliminado exitosamente."
 *       400:
 *         description: Bad request - invalid ID
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user doesn't own this itinerary
 *       404:
 *         description: Itinerary not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticate, deleteItinerary);

export default router;
