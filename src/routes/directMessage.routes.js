import express from "express";
import directMessageController from "../controllers/directMessage.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/direct-messages
 * @desc    Send a direct message to another user
 * @access  Private
 */
router.post("/", directMessageController.sendMessage);

/**
 * @route   GET /api/direct-messages/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get("/conversations", directMessageController.getConversations);

/**
 * @route   GET /api/direct-messages/unread-count
 * @desc    Get unread message count for the authenticated user
 * @access  Private
 */
router.get("/unread-count", directMessageController.getUnreadCount);

/**
 * @route   GET /api/direct-messages/conversation/:otherUserId
 * @desc    Get conversation history with another user
 * @access  Private
 */
router.get(
  "/conversation/:otherUserId",
  directMessageController.getConversationHistory
);

export default router;
