import chatService from "../services/chat.service.js";
import logger from "../config/logger.js";

/**
 * Send a chat message
 * POST /api/chat/messages
 * Body: { userId, message, conversationId?, timestamp }
 */
export const sendMessage = async (req, res, next) => {
  logger.info(`Send message endpoint called for user: ${req.user.id}`);
  try {
    const { message, conversationId, timestamp } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!message || !timestamp) {
      return res.status(400).json({
        success: false,
        message: "message and timestamp are required.",
      });
    }

    // Validate message length
    if (message.trim().length < 1 || message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 1 and 2000 characters.",
      });
    }

    const result = await chatService.sendMessage({
      userId,
      message: message.trim(),
      conversationId,
      timestamp,
    });

    logger.info(`Send message endpoint completed successfully for user: ${userId}`);
    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (err) {
    logger.error(`Send message endpoint failed for user: ${req.body.userId}, error: ${err.message}`);
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
        ...(err.details && { errors: err.details }),
      });
    }
    next(err);
  }
};

/**
 * Get chat history for a user
 * GET /api/chat/messages/:userId
 * Query params: limit?, offset?, conversationId?
 */
export const getChatHistory = async (req, res, next) => {
  logger.info(`Get chat history endpoint called for user: ${req.user.id}`);
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, conversationId } = req.query;

    // Validate limit and offset
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const parsedOffset = Math.max(0, parseInt(offset));

    const result = await chatService.getChatHistory(
      userId,
      parsedLimit,
      parsedOffset,
      conversationId
    );

    logger.info(`Get chat history endpoint completed successfully for user: ${userId}`);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    logger.error(`Get chat history endpoint failed for user: ${req.params.userId}, error: ${err.message}`);
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
        ...(err.details && { errors: err.details }),
      });
    }
    next(err);
  }
};

/**
 * Get conversations for a user
 * GET /api/chat/conversations/:userId
 */
export const getConversations = async (req, res, next) => {
  logger.info(`Get conversations endpoint called for user: ${req.user.id}`);
  try {
    const userId = req.user.id;

    const conversations = await chatService.getConversations(userId);

    logger.info(`Get conversations endpoint completed successfully for user: ${userId}`);
    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (err) {
    logger.error(`Get conversations endpoint failed for user: ${req.params.userId}, error: ${err.message}`);
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
        ...(err.details && { errors: err.details }),
      });
    }
    next(err);
  }
};

/**
 * Create a new conversation
 * POST /api/chat/conversations
 * Body: { userId, title? }
 */
export const createConversation = async (req, res, next) => {
  logger.info(`Create conversation endpoint called for user: ${req.user.id}`);
  try {
    const { title } = req.body;
    const userId = req.user.id;

    const result = await chatService.createConversation({
      userId,
      title,
    });

    logger.info(`Create conversation endpoint completed successfully for user: ${userId}`);
    res.status(201).json({
      success: true,
      conversation: result,
    });
  } catch (err) {
    logger.error(`Create conversation endpoint failed for user: ${req.body.userId}, error: ${err.message}`);
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
        ...(err.details && { errors: err.details }),
      });
    }
    next(err);
  }
};