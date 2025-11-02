import { Router } from "express";
import rateLimit from "express-rate-limit";
import { searchUsers } from "../controllers/users.controller.js";
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

export default router;