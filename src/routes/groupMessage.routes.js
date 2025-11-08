import { Router } from "express";
import groupMessageController from "../controllers/groupMessage.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/groups/{groupId}/messages:
 *   post:
 *     summary: Send a message to a group
 *     tags: [Group Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *                 example: "Hola a todos!"
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not a member of the group
 *       404:
 *         description: Group not found
 */
router.post("/:groupId/messages", authenticate, groupMessageController.sendMessage);

/**
 * @swagger
 * /api/groups/{groupId}/messages:
 *   get:
 *     summary: Get messages from a group
 *     tags: [Group Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       403:
 *         description: Not a member of the group
 *       404:
 *         description: Group not found
 */
router.get("/:groupId/messages", authenticate, groupMessageController.getMessages);

export default router;
