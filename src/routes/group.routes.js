import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import groupController from "../controllers/group.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Group management endpoints
 */

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 50
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Group name already exists
 */
router.post("/", authenticate, groupController.createGroup);

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get all groups for current user
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups retrieved successfully
 */
router.get("/", authenticate, groupController.getUserGroups);

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get a group by ID
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details retrieved successfully
 *       404:
 *         description: Group not found
 */
router.get("/:id", authenticate, groupController.getGroupById);

/**
 * @swagger
 * /api/groups/{id}/members:
 *   post:
 *     summary: Add members to a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Members added successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 */
router.post("/:id/members", authenticate, groupController.addMembers);

/**
 * @swagger
 * /api/groups/{groupId}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Group or user not found
 */
router.delete("/:groupId/members/:userId", authenticate, groupController.removeMember);

export default router;
