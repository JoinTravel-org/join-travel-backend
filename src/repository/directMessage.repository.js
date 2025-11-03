import { AppDataSource } from "../load/typeorm.loader.js";
import DirectMessage from "../models/directMessage.model.js";

class DirectMessageRepository {
  constructor() {
    this.repository = AppDataSource.getRepository("DirectMessage");
  }

  /**
   * Create conversation ID from two user IDs (sorted to ensure consistency)
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {string} Conversation ID
   */
  createConversationId(userId1, userId2) {
    return [userId1, userId2].sort().join("-");
  }

  /**
   * Create a new direct message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message
   */
  async create(messageData) {
    const message = this.repository.create(messageData);
    return await this.repository.save(message);
  }

  /**
   * Get conversation history between two users
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Number of messages to retrieve
   * @param {number} offset - Pagination offset
   * @returns {Promise<Array>} Messages array
   */
  async findByConversationId(conversationId, limit = 50, offset = 0) {
    return await this.repository.find({
      where: { conversationId },
      relations: ["sender", "receiver"],
      order: { createdAt: "ASC" },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get all conversations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of conversation IDs with last message info
   */
  async findConversationsByUserId(userId) {
    const messages = await this.repository
      .createQueryBuilder("dm")
      .leftJoinAndSelect("dm.sender", "sender")
      .leftJoinAndSelect("dm.receiver", "receiver")
      .where("dm.senderId = :userId OR dm.receiverId = :userId", { userId })
      .orderBy("dm.createdAt", "DESC")
      .getMany();

    // Group by conversationId and get the latest message for each
    const conversationsMap = new Map();
    messages.forEach((msg) => {
      if (!conversationsMap.has(msg.conversationId)) {
        conversationsMap.set(msg.conversationId, {
          conversationId: msg.conversationId,
          lastMessage: msg,
          otherUser: msg.senderId === userId ? msg.receiver : msg.sender,
        });
      }
    });

    return Array.from(conversationsMap.values());
  }

  /**
   * Mark messages as read
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (receiver)
   * @returns {Promise<void>}
   */
  async markAsRead(conversationId, userId) {
    await this.repository.update(
      { conversationId, receiverId: userId, isRead: false },
      { isRead: true }
    );
  }

  /**
   * Count unread messages for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Unread message count
   */
  async countUnreadByUserId(userId) {
    return await this.repository.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  /**
   * Count unread messages in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID (receiver)
   * @returns {Promise<number>} Unread message count
   */
  async countUnreadByConversationId(conversationId, userId) {
    return await this.repository.count({
      where: { conversationId, receiverId: userId, isRead: false },
    });
  }
}

export default new DirectMessageRepository();
