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

  /**
   * Delete conversation by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteById(conversationId) {
    const result = await this.repository.delete({ id: conversationId });
    return result.affected > 0;
  }

  /**
    * Find the most recent conversation for a user
    * @param {string} userId - User ID
    * @returns {Promise<Object|null>} Most recent conversation or null
    */
  async findMostRecentByUserId(userId) {
    const conversations = await this.repository.find({
      where: { userId },
      order: { updatedAt: "DESC" },
      take: 1,
    });
    return conversations[0] || null;
  }

  /**
    * Delete all conversations by user ID
    * @param {string} userId - User ID
    * @returns {Promise<number>} Number of conversations deleted
    */
  async deleteByUserId(userId) {
    const result = await this.repository.delete({ userId });
    return result.affected || 0;
  }
}

export default new ConversationRepository();