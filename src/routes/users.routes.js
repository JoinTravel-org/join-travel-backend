import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  searchUsers,
  getUserByEmail,
  getUserFavorites,
  getUserById,
  getUserMedia,
  getUserReviews,
  getUserReviewStats,
  followUser,
  unfollowUser,
  isFollowingUser,
  getUserFollowStats,
  getUserFollowers,
  getUserFollowing,
  updateUserProfile,
  uploadUserAvatar,
  deleteUserAvatar,
} from "../controllers/users.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadAvatar } from "../utils/fileUpload.js";

const router = Router();

// Rate limiter for user search endpoints
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 search requests per windowMs
  message: {
    success: false,
    message:
      "Demasiadas búsquedas de usuarios, por favor intenta de nuevo más tarde.",
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
 * /api/users/email/{email}:
 *   get:
 *     summary: Get user by exact email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email address of the user to find
 *         example: john.doe@example.com
 *     responses:
 *       200:
 *         description: User found successfully
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
 *                     name:
 *                       type: string
 *                       nullable: true
 *                       example: "John Doe"
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
 *                 message:
 *                   type: string
 *                   nullable: true
 *                   example: null
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
 */
router.get("/email/:email", authenticate, searchLimiter, getUserByEmail);

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

/**
 * @swagger
 * /api/users/{userId}/reviews:
 *   get:
 *     summary: Get reviews written by a specific user
 *     description: Retrieve all reviews written by a specific user. Requires authentication and permission to view the target user's reviews.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user whose reviews to retrieve
 *         example: "123e4567-e89b-12d3-a456-426614174000"
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
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       rating:
 *                         type: integer
 *                         example: 5
 *                       content:
 *                         type: string
 *                         example: "Great place to visit!"
 *                       placeId:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       userId:
 *                         type: string
 *                         example: "123e4567-e89b-12d3-a456-426614174000"
 *                       userEmail:
 *                         type: string
 *                         example: "john.doe@example.com"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       placeName:
 *                         type: string
 *                         nullable: true
 *                         example: "Central Park"
 *                       media:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "123e4567-e89b-12d3-a456-426614174000"
 *                             filename:
 *                               type: string
 *                               example: "photo_123.jpg"
 *                             originalFilename:
 *                               type: string
 *                               example: "my_trip_photo.jpg"
 *                             fileSize:
 *                               type: number
 *                               example: 2048576
 *                             mimeType:
 *                               type: string
 *                               example: "image/jpeg"
 *                             url:
 *                               type: string
 *                               example: "/api/media/123e4567-e89b-12d3-a456-426614174000"
 *                       likeCount:
 *                         type: integer
 *                         example: 10
 *                       dislikeCount:
 *                         type: integer
 *                         example: 2
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
router.get("/:userId/reviews", authenticate, getUserReviews);

/**
 * @swagger
 * /api/users/{userId}/reviews/stats:
 *   get:
 *     summary: Get review statistics for a specific user
 *     description: Retrieve aggregated statistics for a user's reviews including total reviews and average rating. Requires authentication and permission to view the target user's stats.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user whose review stats to retrieve
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Review statistics retrieved successfully
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
 *                     totalReviews:
 *                       type: integer
 *                       example: 15
 *                     averageRating:
 *                       type: number
 *                       format: float
 *                       example: 4.2
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
router.get("/:userId/reviews/stats", authenticate, getUserReviewStats);

/**
 * @swagger
 * /api/users/{userId}/follow:
 *   post:
 *     summary: Follow a user
 *     description: Follow another user. Cannot follow yourself.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user to follow
 *     responses:
 *       201:
 *         description: User followed successfully
 *       400:
 *         description: Bad request (already following or trying to follow yourself)
 *       404:
 *         description: User not found
 */
router.post("/:userId/follow", authenticate, followUser);

/**
 * @swagger
 * /api/users/{userId}/follow:
 *   delete:
 *     summary: Unfollow a user
 *     description: Stop following a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user to unfollow
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 *       404:
 *         description: Not following this user
 */
router.delete("/:userId/follow", authenticate, unfollowUser);

/**
 * @swagger
 * /api/users/{userId}/is-following:
 *   get:
 *     summary: Check if current user is following another user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user to check
 *     responses:
 *       200:
 *         description: Check completed successfully
 */
router.get("/:userId/is-following", authenticate, isFollowingUser);

/**
 * @swagger
 * /api/users/{userId}/follow-stats:
 *   get:
 *     summary: Get follower/following statistics for a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/:userId/follow-stats", authenticate, getUserFollowStats);

/**
 * @swagger
 * /api/users/{userId}/followers:
 *   get:
 *     summary: Get list of users following this user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip for pagination
 *     responses:
 *       200:
 *         description: Followers retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/:userId/followers", authenticate, getUserFollowers);

/**
 * @swagger
 * /api/users/{userId}/following:
 *   get:
 *     summary: Get list of users that this user is following
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip for pagination
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/:userId/following", authenticate, getUserFollowing);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile (name and age)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 30
 *                 example: "John Doe"
 *               age:
 *                 type: integer
 *                 minimum: 13
 *                 maximum: 120
 *                 nullable: true
 *                 example: 25
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 */
router.put("/profile", authenticate, updateUserProfile);

/**
 * @swagger
 * /api/users/profile/avatar:
 *   post:
 *     summary: Upload or update user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (max 5MB, JPG/PNG/GIF/WEBP only)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: Invalid file or validation error
 */
router.post("/profile/avatar", authenticate, uploadAvatar.single("avatar"), uploadUserAvatar);

/**
 * @swagger
 * /api/users/profile/avatar:
 *   delete:
 *     summary: Delete user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *       400:
 *         description: No avatar to delete
 */
router.delete("/profile/avatar", authenticate, deleteUserAvatar);

export default router;
