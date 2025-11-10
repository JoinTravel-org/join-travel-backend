import { Router } from "express";
import {
  createQuestion,
  getQuestionsByPlace,
  voteQuestion,
  getQuestionVoteStatus,
} from "../controllers/question.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/questions/{questionId}/vote:
 *   post:
 *     summary: Vote for a question
 *     description: Upvote or remove vote from a question. Requires user authentication.
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the question to vote for
 *     responses:
 *       200:
 *         description: Vote toggled successfully
 *       400:
 *         description: Invalid question ID
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Question not found
 *   get:
 *     summary: Get vote status for a question
 *     description: Get the current vote status and count for a question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the question
 *     responses:
 *       200:
 *         description: Vote status retrieved successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Question not found
 */
router.post("/:questionId/vote", authenticate, voteQuestion);
router.get("/:questionId/vote", authenticate, getQuestionVoteStatus);

export default router;