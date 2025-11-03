import directMessageService from "../services/directMessage.service.js";
import logger from "../config/logger.js";

class DirectMessageController {
  /**
   * Send a direct message
   * POST /api/direct-messages
   */
  async sendMessage(req, res, next) {
    try {
      const senderId = req.user.id; // From auth middleware
      const { receiverId, content } = req.body;

      if (!receiverId) {
        return res.status(400).json({
          success: false,
          message: "Receiver ID is required",
        });
      }

      if (!content) {
        return res.status(400).json({
          success: false,
          message: "Message content is required",
        });
      }

      const result = await directMessageService.sendMessage({
        senderId,
        receiverId,
        content,
      });

      res.status(201).json(result);
    } catch (error) {
      logger.error(`Error in sendMessage controller: ${error.message}`);
      next(error);
    }
  }

  /**
   * Get conversation history with another user
   * GET /api/direct-messages/conversation/:otherUserId
   */
  async getConversationHistory(req, res, next) {
    try {
      const userId = req.user.id; // From auth middleware
      const { otherUserId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          message: "Other user ID is required",
        });
      }

      const result = await directMessageService.getConversationHistory(
        userId,
        otherUserId,
        parseInt(limit),
        parseInt(offset)
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error(
        `Error in getConversationHistory controller: ${error.message}`
      );
      next(error);
    }
  }

  /**
   * Get all conversations for the authenticated user
   * GET /api/direct-messages/conversations
   */
  async getConversations(req, res, next) {
    try {
      const userId = req.user.id; // From auth middleware

      const result = await directMessageService.getConversations(userId);

      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error in getConversations controller: ${error.message}`);
      next(error);
    }
  }

  /**
   * Get unread message count
   * GET /api/direct-messages/unread-count
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id; // From auth middleware

      const result = await directMessageService.getUnreadCount(userId);

      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error in getUnreadCount controller: ${error.message}`);
      next(error);
    }
  }
}

export default new DirectMessageController();
