import { Router } from "express";
import {
  createAnswer,
  getAnswersByQuestion,
  voteAnswer,
  getAnswerVoteStatus,
} from "../controllers/answer.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/questions/{questionId}/answers:
 *   post:
 *     summary: Create a new answer for a question
 *     description: Creates a new answer for a specific question. Requires user authentication.
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the question to answer
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
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Answer content
 *                 example: "The opening hours are from 9 AM to 6 PM."
 *     responses:
 *       201:
 *         description: Answer created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: User already answered this question
 *   get:
 *     summary: Get all answers for a question
 *     description: Retrieves all answers for a specific question, ordered by votes and date
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the question
 *     responses:
 *       200:
 *         description: Answers retrieved successfully
 *       404:
 *         description: Question not found
 */

/**
 * @swagger
 * /api/answers/{answerId}/vote:
 *   post:
 *     summary: Vote for an answer
 *     description: Upvote or remove vote from an answer. Requires user authentication.
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the answer to vote for
 *     responses:
 *       200:
 *         description: Vote toggled successfully
 *       400:
 *         description: Invalid answer ID
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Answer not found
 *   get:
 *     summary: Get vote status for an answer
 *     description: Get the current vote status and count for an answer
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the answer
 *     responses:
 *       200:
 *         description: Vote status retrieved successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Answer not found
 */
router.post("/questions/:questionId/answers", authenticate, createAnswer);
router.get("/questions/:questionId/answers", getAnswersByQuestion);
router.post("/:answerId/vote", authenticate, voteAnswer);
router.get("/:answerId/vote", authenticate, getAnswerVoteStatus);

export default router;