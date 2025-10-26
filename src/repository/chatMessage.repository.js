import { AppDataSource } from "../load/typeorm.loader.js";

class ChatMessageRepository {
  constructor() {
    this.repository = AppDataSource.getRepository("ChatMessage");
  }

  /**
   * Create a new chat message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message
   */
  async create(messageData) {
    const message = this.repository.create(messageData);
    return await this.repository.save(message);
  }

  /**
   * Find messages by user ID with pagination
   * @param {string} userId - User ID
   * @param {number} limit - Number of messages to retrieve
   * @param {number} offset - Pagination offset
   * @param {string} conversationId - Filter by conversation (optional)
   * @returns {Promise<Array>} Messages array
   */
  async findByUserId(userId, limit = 50, offset = 0, conversationId = null) {
    const where = { userId };
    if (conversationId) {
      where.conversationId = conversationId;
    }

    return await this.repository.find({
      where,
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
      relations: ["conversation"],
    });
  }

  /**
   * Count messages by user ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Filter by conversation (optional)
   * @returns {Promise<number>} Total count
   */
  async countByUserId(userId, conversationId = null) {
    const where = { userId };
    if (conversationId) {
      where.conversationId = conversationId;
    }

    return await this.repository.count({ where });
  }

  /**
   * Find last message by conversation ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object|null>} Last message or null
   */
  async findLastByConversationId(conversationId) {
    const messages = await this.repository.find({
      where: { conversationId },
      order: { createdAt: "DESC" },
      take: 1,
    });
    return messages[0] || null;
  }

  /**
   * Count messages by conversation ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<number>} Total count
   */
  async countByConversationId(conversationId) {
    return await this.repository.count({
      where: { conversationId },
    });
  }

  /**
   * Delete all messages by conversation ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<number>} Number of messages deleted
   */
  async deleteByConversationId(conversationId) {
    const result = await this.repository.delete({ conversationId });
    return result.affected || 0;
  }
}

export default new ChatMessageRepository();