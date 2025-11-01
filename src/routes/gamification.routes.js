import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  getUserStats,
  awardPoints,
  getAllLevels,
  getAllBadges,
  getUserMilestones,
} from "../controllers/gamification.controller.js";

const router = Router();

// All gamification routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/users/{userId}/stats:
 *   get:
 *     summary: Get user gamification statistics
 *     description: Returns user points, level, progress, and badges
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                     points:
 *                       type: integer
 *                       example: 45
 *                     level:
 *                       type: integer
 *                       example: 2
 *                     levelName:
 *                       type: string
 *                       example: "Viajero Activo"
 *                     progressToNext:
 *                       type: integer
 *                       example: 67
 *                     badges:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           earned_at:
 *                             type: string
 *                             format: date-time
 *                     nextLevel:
 *                       type: object
 *                       properties:
 *                         level:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         minPoints:
 *                           type: integer
 *       403:
 *         description: Forbidden - can only view own stats
 *       404:
 *         description: User not found
 */
router.get("/users/:userId/stats", getUserStats);

/**
 * @swagger
 * /api/users/{userId}/points:
 *   post:
 *     summary: Award points for user action
 *     description: Updates user points based on action and checks for level/badge progression
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [review_created, vote_received, profile_completed, comment_posted, media_upload]
 *                 example: "review_created"
 *               metadata:
 *                 type: object
 *                 description: Additional context for the action
 *                 properties:
 *                   review_id:
 *                     type: string
 *                     description: Review ID for vote_received actions
 *     responses:
 *       200:
 *         description: Points awarded successfully
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
 *                     points:
 *                       type: integer
 *                     level:
 *                       type: integer
 *                     levelName:
 *                       type: string
 *                     progressToNext:
 *                       type: integer
 *                     badges:
 *                       type: array
 *                     notification:
 *                       type: object
 *                       properties:
 *                         newLevel:
 *                           type: integer
 *                         levelName:
 *                           type: string
 *                         message:
 *                           type: string
 *                         newBadges:
 *                           type: array
 *                           items:
 *                             type: string
 *       400:
 *         description: Invalid action or missing required fields
 *       403:
 *         description: Forbidden - can only update own points
 *       500:
 *         description: Internal server error
 */
router.post("/users/:userId/points", awardPoints);

/**
 * @swagger
 * /api/levels:
 *   get:
 *     summary: Get all gamification levels
 *     description: Returns all available levels with their requirements and rewards
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Levels retrieved successfully
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
 *                       level_number:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       min_points:
 *                         type: integer
 *                       description:
 *                         type: string
 *                       rewards:
 *                         type: object
 */
router.get("/levels", getAllLevels);

/**
 * @swagger
 * /api/badges:
 *   get:
 *     summary: Get all predefined badges
 *     description: Returns all available badges with their criteria
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Badges retrieved successfully
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       criteria:
 *                         type: object
 *                       icon_url:
 *                         type: string
 */
router.get("/badges", getAllBadges);

/**
 * @swagger
 * /api/users/{userId}/milestones:
 *   get:
 *     summary: Get user milestones for badges and leveling up
 *     description: Returns the user's current milestones for earning badges and leveling up, including progress and instructions
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User milestones retrieved successfully
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
 *                         example: "first-review"
 *                       title:
 *                         type: string
 *                         example: "Primera Reseña"
 *                       description:
 *                         type: string
 *                         example: "Escribe tu primera reseña de un lugar"
 *                       progress:
 *                         type: integer
 *                         example: 0
 *                       target:
 *                         type: integer
 *                         example: 1
 *                       isCompleted:
 *                         type: boolean
 *                         example: false
 *                       category:
 *                         type: string
 *                         enum: [badge, level]
 *                         example: "badge"
 *                       badgeName:
 *                         type: string
 *                         example: "Crítico Novato"
 *                       levelRequired:
 *                         type: integer
 *                         example: 2
 *                       instructions:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Navega a la página de un lugar que hayas visitado", "Haz clic en 'Escribir reseña'"]
 *       403:
 *         description: Forbidden - can only view own milestones
 *       404:
 *         description: User not found
 */
router.get("/users/:userId/milestones", getUserMilestones);

export default router;