import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import conversationRepository from "../repository/conversation.repository.js";
import chatMessageRepository from "../repository/chatMessage.repository.js";
import reviewRepository from "../repository/review.repository.js";
import logger from "../config/logger.js";

class ChatService {
  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.5-flash",
      apiKey: process.env.GOOGLE_AI_API_KEY,
      temperature: 0.7,
      maxOutputTokens: 1000,
    });

    this.promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful AI assistant for JoinTravel, a travel platform. You have access to user reviews and ratings for various places.

Context from reviews:
{reviews_context}

User question: {question}

Please provide a helpful, accurate response based on the reviews and general travel knowledge. If the question is about specific places, reference the reviews when relevant. Keep your response conversational and friendly.
`);

    this.chain = RunnableSequence.from([
      this.promptTemplate,
      this.model,
    ]);
  }

  /**
   * Load all reviews context for the AI
   * @returns {Promise<string>} Formatted reviews context
   */
  async loadReviewsContext() {
    try {
      const reviews = await reviewRepository.findAll(0, 1000); // Get up to 1000 reviews
      const context = reviews.map(review =>
        `Place: ${review.place?.name || 'Unknown Place'}\nRating: ${review.rating}/5\nReview: ${review.content}\nUser: ${review.user?.email || 'Anonymous'}\n---`
      ).join('\n\n');

      return context;
    } catch (error) {
      logger.error(`Error loading reviews context: ${error.message}`);
      return "No reviews available at the moment.";
    }
  }

  /**
    * Send a message and get AI response
    * @param {Object} messageData - Message data
    * @param {string} messageData.userId - User ID
    * @param {string} messageData.message - User message
    * @param {string} messageData.conversationId - Conversation ID (optional)
    * @param {number} messageData.timestamp - Timestamp
    * @returns {Promise<Object>} Message with AI response
    */
  async sendMessage(messageData) {
    const { userId, message, conversationId, timestamp } = messageData;

    try {
      // Load conversation history for context
      let conversationHistory = "";
      if (conversationId) {
        const previousMessages = await chatMessageRepository.findByUserId(
          userId,
          10, // Get last 10 messages for context
          0,
          conversationId
        );
        // Reverse to get chronological order (oldest first)
        const chronologicalMessages = previousMessages.reverse();
        conversationHistory = chronologicalMessages
          .map(msg => `User: ${msg.message}\nAssistant: ${msg.response}`)
          .join('\n\n');
      }

      // Load reviews context
      const reviewsContext = await this.loadReviewsContext();

      // Generate AI response with conversation history
      const response = await this.chain.invoke({
        reviews_context: reviewsContext,
        question: conversationHistory ? `${conversationHistory}\n\nCurrent question: ${message}` : message,
      });

      // Create chat message record
      const chatMessage = await chatMessageRepository.create({
        userId,
        conversationId,
        message,
        response: response.content,
        timestamp,
      });

      // Update conversation's last message time
      if (conversationId) {
        await conversationRepository.updateLastMessageTime(conversationId);
      }

      return {
        id: chatMessage.id,
        userId: chatMessage.userId,
        message: chatMessage.message,
        response: chatMessage.response,
        conversationId: chatMessage.conversationId,
        timestamp: chatMessage.timestamp,
        createdAt: chatMessage.createdAt,
      };
    } catch (error) {
      logger.error(`Error sending message: ${error.message}`);
      throw {
        status: 500,
        message: "Error processing chat message",
        details: [error.message],
      };
    }
  }

  /**
    * Get chat history for a user
    * @param {string} userId - User ID
    * @param {number} limit - Number of messages to retrieve
    * @param {number} offset - Pagination offset
    * @param {string} conversationId - Filter by conversation (optional)
    * @returns {Promise<Object>} Chat history
    */
  async getChatHistory(userId, limit = 50, offset = 0, conversationId = null) {
    try {
      const messages = await chatMessageRepository.findByUserId(
        userId,
        limit,
        offset,
        conversationId
      );

      const total = await chatMessageRepository.countByUserId(userId, conversationId);
      const hasMore = offset + messages.length < total;

      return {
        messages,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error(`Error getting chat history: ${error.message}`);
      throw {
        status: 500,
        message: "Error retrieving chat history",
        details: [error.message],
      };
    }
  }

  /**
   * Get user's conversations
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of conversations
   */
  async getConversations(userId) {
    try {
      const conversations = await conversationRepository.findByUserId(userId);

      // Get last message for each conversation
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          const lastMessage = await chatMessageRepository.findLastByConversationId(conversation.id);
          const messageCount = await chatMessageRepository.countByConversationId(conversation.id);

          return {
            id: conversation.id,
            userId: conversation.userId,
            title: conversation.title,
            lastMessage: lastMessage?.message || null,
            lastMessageTime: lastMessage?.timestamp || null,
            messageCount,
          };
        })
      );

      return conversationsWithDetails;
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
   * Create a new conversation
   * @param {Object} conversationData - Conversation data
   * @param {string} conversationData.userId - User ID
   * @param {string} conversationData.title - Conversation title (optional)
   * @returns {Promise<Object>} Created conversation
   */
  async createConversation(conversationData) {
    const { userId, title } = conversationData;

    try {
      const conversation = await conversationRepository.create({
        userId,
        title: title || `Conversation ${new Date().toLocaleDateString()}`,
      });

      return {
        id: conversation.id,
        userId: conversation.userId,
        title: conversation.title,
        createdAt: conversation.createdAt,
      };
    } catch (error) {
      logger.error(`Error creating conversation: ${error.message}`);
      throw {
        status: 500,
        message: "Error creating conversation",
        details: [error.message],
      };
    }
  }

  /**
    * Delete the current conversation for a user
    * @param {string} userId - User ID
    * @returns {Promise<Object>} Deletion result
    */
  async deleteCurrentConversation(userId) {
    try {
      // Find the most recent conversation for the user
      const currentConversation = await conversationRepository.findMostRecentByUserId(userId);

      if (!currentConversation) {
        throw {
          status: 404,
          message: "No active conversation found for this user",
        };
      }

      // Delete all messages in the conversation
      await chatMessageRepository.deleteByConversationId(currentConversation.id);

      // Delete the conversation itself
      const deleted = await conversationRepository.deleteById(currentConversation.id);

      if (!deleted) {
        throw {
          status: 500,
          message: "Failed to delete conversation",
        };
      }

      return {
        message: "Conversation deleted successfully",
      };
    } catch (error) {
      logger.error(`Error deleting current conversation: ${error.message}`);
      if (error.status) {
        throw error;
      }
      throw {
        status: 500,
        message: "Error deleting conversation",
        details: [error.message],
      };
    }
  }

  /**
    * Delete all chat history for a user
    * @param {string} userId - User ID
    * @returns {Promise<Object>} Deletion result
    */
  async deleteAllChatHistory(userId) {
    try {
      // Delete all messages for the user
      const deletedMessages = await chatMessageRepository.deleteByUserId(userId);

      // Delete all conversations for the user
      const deletedConversations = await conversationRepository.deleteByUserId(userId);

      return {
        message: "All chat history deleted successfully",
        deletedMessages: deletedMessages,
        deletedConversations: deletedConversations,
      };
    } catch (error) {
      logger.error(`Error deleting all chat history: ${error.message}`);
      throw {
        status: 500,
        message: "Error deleting chat history",
        details: [error.message],
      };
    }
  }
}

export default new ChatService();