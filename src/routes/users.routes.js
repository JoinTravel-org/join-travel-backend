import { Router } from "express";
import rateLimit from "express-rate-limit";
import { searchUsers, getUserFavorites, getUserById, getUserMedia } from "../controllers/users.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Rate limiter for user search endpoints
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 search requests per windowMs
  message: {
    success: false,
    message: "Demasiadas búsquedas de usuarios, por favor intenta de nuevo más tarde."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users by email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email address to search for (supports partial matching)
 *         example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Users found successfully
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
 *                         example: "user-123"
 *                       email:
 *                         type: string
 *                         example: "john.doe@example.com"
 *                       isEmailConfirmed:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-11-02T15:45:00Z"
 *                       stats:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           points:
 *                             type: integer
 *                             example: 1250
 *                           level:
 *                             type: integer
 *                             example: 3
 *                           levelName:
 *                             type: string
 *                             example: "Explorador Experto"
 *                           progressToNext:
 *                             type: integer
 *                             example: 75
 *                           badges:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                   example: "Primer Viaje"
 *                                 description:
 *                                   type: string
 *                                   example: "Completaste tu primer itinerario"
 *                                 earned_at:
 *                                   type: string
 *                                   format: date-time
 *                                   example: "2024-02-01T08:00:00Z"
 *                                 iconUrl:
 *                                   type: string
 *                                   nullable: true
 *                                   example: null
 *                 message:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
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
 *                   example: "Demasiadas búsquedas de usuarios, por favor intenta de nuevo más tarde."
 */
router.get("/search", authenticate, searchLimiter, searchUsers);

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve basic information for a specific user by their ID. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user to retrieve
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user-123"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     isEmailConfirmed:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-11-02T15:45:00Z"
 *                     stats:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         points:
 *                           type: integer
 *                           example: 1250
 *                         level:
 *                           type: integer
 *                           example: 3
 *                         levelName:
 *                           type: string
 *                           example: "Explorador Experto"
 *                         progressToNext:
 *                           type: integer
 *                           example: 75
 *                         badges:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "Primer Viaje"
 *                               description:
 *                                 type: string
 *                                 example: "Completaste tu primer itinerario"
 *                               earned_at:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2024-02-01T08:00:00Z"
 *                               iconUrl:
 *                                 type: string
 *                                 nullable: true
 *                                 example: null
 *                 message:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       400:
 *         description: Invalid user ID
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
 *                   example: "ID de usuario inválido"
 *       401:
 *         description: Not authenticated
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
 *                   example: "Authentication required"
 *       404:
 *         description: User not found
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
 *                   example: "Usuario no encontrado"
 *       429:
 *         description: Too many requests
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
 *                   example: "Demasiadas solicitudes, por favor intenta de nuevo más tarde."
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
 *                   example: "Error interno del servidor"
 */
router.get("/:userId", authenticate, getUserById);

/**
 * @swagger
 * /api/users/{userId}/favorites:
 *   get:
 *     summary: Get favorite places of a specific user
 *     description: Retrieve all favorite places of a specific user. Requires authentication and permission to view the target user's favorites.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user whose favorites to retrieve
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
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
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       name:
 *                         type: string
 *                         example: "Central Park"
 *                       address:
 *                         type: string
 *                         example: "New York, NY"
 *                       latitude:
 *                         type: number
 *                         format: float
 *                         example: 40.7829
 *                       longitude:
 *                         type: number
 *                         format: float
 *                         example: -73.9654
 *                       image:
 *                         type: string
 *                         nullable: true
 *                         example: "/uploads/central-park.jpg"
 *                       city:
 *                         type: string
 *                         nullable: true
 *                         example: "New York"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: "Beautiful urban park"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                 message:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       400:
 *         description: Invalid user ID
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
 *                   example: "ID de usuario inválido"
 *       401:
 *         description: Not authenticated
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
 *                   example: "Authentication required"
 *       403:
 *         description: Forbidden - No permission to view user's favorites
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
 *                   example: "No tienes permiso para ver los favoritos de este usuario"
 *       404:
 *         description: User not found
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
 *                   example: "Usuario no encontrado"
 *       429:
 *         description: Too many requests
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
 *                   example: "Demasiadas solicitudes, por favor intenta de nuevo más tarde."
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
 *                   example: "Error interno del servidor"
 */
router.get("/:userId/favorites", authenticate, getUserFavorites);

/**
 * @swagger
 * /api/users/{userId}/media:
 *   get:
 *     summary: Get public media files uploaded by a specific user
 *     description: Retrieve all public media files (images and videos) uploaded by a specific user from their published reviews. This endpoint is public and does not require authentication.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user whose media to retrieve
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Media files retrieved successfully
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
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       filename:
 *                         type: string
 *                         example: "photo_123.jpg"
 *                       originalFilename:
 *                         type: string
 *                         example: "my_trip_photo.jpg"
 *                       fileSize:
 *                         type: number
 *                         example: 2048576
 *                       mimeType:
 *                         type: string
 *                         example: "image/jpeg"
 *                       url:
 *                         type: string
 *                         example: "/api/media/123e4567-e89b-12d3-a456-426614174000"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                 message:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *       400:
 *         description: Invalid user ID
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
 *                   example: "ID de usuario inválido"
 *       404:
 *         description: User not found
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
 *                   example: "Usuario no encontrado"
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
 *                   example: "Error interno del servidor"
 */
router.get("/:userId/media", getUserMedia);

export default router;