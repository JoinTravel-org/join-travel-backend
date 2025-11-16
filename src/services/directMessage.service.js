import directMessageRepository from "../repository/directMessage.repository.js";
import UserRepository from "../repository/user.repository.js";
import logger from "../config/logger.js";

class DirectMessageService {
  /**
   * Send a direct message to another user
   * @param {Object} messageData - Message data
   * @param {string} messageData.senderId - Sender user ID
   * @param {string} messageData.receiverId - Receiver user ID
   * @param {string} messageData.content - Message content
   * @returns {Promise<Object>} Created message
   */
  async sendMessage(messageData) {
    const { senderId, receiverId, content } = messageData;

    try {
      // Validate users exist
      const userRepository = new UserRepository();
      const sender = await userRepository.findById(senderId);
      const receiver = await userRepository.findById(receiverId);

      if (!sender) {
        throw {
          status: 404,
          message: "Sender not found",
        };
      }

      if (!receiver) {
        throw {
          status: 404,
          message: "Receiver not found",
        };
      }

      // Validate content
      if (!content || content.trim().length === 0) {
        throw {
          status: 400,
          message: "Message content cannot be empty",
        };
      }

      // Create conversation ID
      const conversationId = directMessageRepository.createConversationId(
        senderId,
        receiverId
      );

      // Create message
      const message = await directMessageRepository.create({
        senderId,
        receiverId,
        conversationId,
        content: content.trim(),
        isRead: false,
      });

      logger.info(
        `Direct message sent from ${senderId} to ${receiverId} in conversation ${conversationId}`
      );

      return {
        success: true,
        message: "Message sent successfully",
        data: message,
      };
    } catch (error) {
      if (error.status) {
        throw error;
      }
      logger.error(`Error sending direct message: ${error.message}`);
      throw {
        status: 500,
        message: "Error sending message",
        details: [error.message],
      };
    }
  }

  /**
   * Get conversation history between current user and another user
   * @param {string} userId - Current user ID
   * @param {string} otherUserId - Other user ID
   * @param {number} limit - Number of messages to retrieve
   * @param {number} offset - Pagination offset
   * @returns {Promise<Object>} Conversation history
   */
  async getConversationHistory(userId, otherUserId, limit = 50, offset = 0) {
    try {
      const conversationId = directMessageRepository.createConversationId(
        userId,
        otherUserId
      );

      const messages = await directMessageRepository.findByConversationId(
        conversationId,
        limit,
        offset
      );

      // Mark messages as read for the current user
      await directMessageRepository.markAsRead(conversationId, userId);

      logger.info(
        `Retrieved ${messages.length} messages for conversation ${conversationId}`
      );

      return {
        success: true,
        data: {
          conversationId,
          messages: messages.map((msg) => ({
            id: msg.id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            content: msg.content,
            isRead: msg.isRead,
            createdAt: msg.createdAt,
            senderEmail: msg.sender?.email,
            receiverEmail: msg.receiver?.email,
            senderName: msg.sender?.name,
            senderProfilePicture: msg.sender?.profilePicture,
            receiverName: msg.receiver?.name,
            receiverProfilePicture: msg.receiver?.profilePicture,
          })),
        },
      };
    } catch (error) {
      logger.error(`Error getting conversation history: ${error.message}`);
      throw {
        status: 500,
        message: "Error retrieving conversation history",
        details: [error.message],
      };
    }
  }

  /**
   * Get all conversations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} List of conversations
   */
  async getConversations(userId) {
    try {
      const conversations =
        await directMessageRepository.findConversationsByUserId(userId);

      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          const unreadCount =
            await directMessageRepository.countUnreadByConversationId(
              conv.conversationId,
              userId
            );

          return {
            conversationId: conv.conversationId,
            otherUser: {
              id: conv.otherUser.id,
              email: conv.otherUser.email,
              name: conv.otherUser.name,
              profilePicture: conv.otherUser.profilePicture,
            },
            lastMessage: {
              content: conv.lastMessage.content,
              createdAt: conv.lastMessage.createdAt,
              senderId: conv.lastMessage.senderId,
            },
            unreadCount,
          };
        })
      );

      logger.info(
        `Retrieved ${conversationsWithDetails.length} conversations for user ${userId}`
      );

      return {
        success: true,
        data: conversationsWithDetails,
      };
    } catch (error) {
      logger.error(`Error getting conversations: ${error.message}`);
      throw {
        status: 500,
        message: "Error retrieving conversations",
        details: [error.message],
      };
    }
  }

  /**
   * Get unread message count for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Unread count
   */
  async getUnreadCount(userId) {
      try {
        const count = await directMessageRepository.countUnreadByUserId(userId);
  
        return {
          success: true,
          data: { unreadCount: count },
        };
      } catch (error) {
        logger.error(`Error getting unread count: ${error.message}`);
        throw {
          status: 500,
          message: "Error retrieving unread count",
          details: [error.message],
        };
      }
    }
  
    /**
     * Mark messages as read in a conversation
     * @param {string} userId - Current user ID
     * @param {string} otherUserId - Other user ID
     * @returns {Promise<Object>} Success response
     */
    async markAsRead(userId, otherUserId) {
      try {
        const conversationId = directMessageRepository.createConversationId(
          userId,
          otherUserId
        );
  
        await directMessageRepository.markAsRead(conversationId, userId);
  
        logger.info(
          `Marked messages as read for conversation ${conversationId} by user ${userId}`
        );
  
        return {
          success: true,
          message: "Messages marked as read successfully",
        };
      } catch (error) {
        logger.error(`Error marking messages as read: ${error.message}`);
        throw {
          status: 500,
          message: "Error marking messages as read",
          details: [error.message],
        };
      }
    }
  }
  
  export default new DirectMessageService();
