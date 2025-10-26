import { AppDataSource } from "../load/typeorm.loader.js";

class ConversationRepository {
  constructor() {
    this.repository = AppDataSource.getRepository("Conversation");
  }

  /**
   * Create a new conversation
   * @param {Object} conversationData - Conversation data
   * @returns {Promise<Object>} Created conversation
   */
  async create(conversationData) {
    const conversation = this.repository.create(conversationData);
    return await this.repository.save(conversation);
  }

  /**
   * Find conversations by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Conversations array
   */
  async findByUserId(userId) {
    return await this.repository.find({
      where: { userId },
      order: { updatedAt: "DESC" },
    });
  }

  /**
   * Find conversation by ID
   * @param {string} id - Conversation ID
   * @returns {Promise<Object|null>} Conversation or null
   */
  async findById(id) {
    return await this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Update conversation's last message time
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<void>}
   */
  async updateLastMessageTime(conversationId) {
    await this.repository.update(
      { id: conversationId },
      { updatedAt: new Date() }
    );
  }
}

export default new ConversationRepository();