import { ChatXAI } from "@langchain/xai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import conversationRepository from "../repository/conversation.repository.js";
import chatMessageRepository from "../repository/chatMessage.repository.js";
import reviewRepository from "../repository/review.repository.js";
import placeRepository from "../repository/place.repository.js";
import UserRepository from "../repository/user.repository.js";
import logger from "../config/logger.js";

class ChatService {
  constructor() {
    this.model = new ChatXAI({
      model: "grok-code-fast-1",
      apiKey: process.env.XAI_API_KEY,
      temperature: 0.7,
      maxTokens: 1000,
    });

    this.systemPrompt = `Eres un asistente virtual útil y amable para JoinTravel, una plataforma de viajes que ayuda a los usuarios a descubrir lugares turísticos y conocer las opiniones de otros viajeros.  
Tienes acceso a información detallada sobre los lugares disponibles y a reseñas y valoraciones de usuarios.

Usuario: {user_email}

Lugares:
{places_context}

Reseñas:
{reviews_context}

Instrucciones:
- Ofrece una respuesta clara, útil y precisa basada en la información de los lugares, las reseñas y tu conocimiento general sobre viajes.  
- Si la pregunta se refiere a un lugar específico, utiliza la información disponible y las opiniones relevantes para enriquecer tu respuesta.  
- Mantén un tono conversacional, cercano y positivo, como si fueras un guía turístico experto y amigable.  
- Cuando sea apropiado, sugiere actividades, recomendaciones gastronómicas, eventos o consejos prácticos relacionados con el destino.  
- Si falta información, reconoce la limitación de forma natural y ofrece alternativas o formas de obtener más detalles.
- Manten los mensajes de respuesta cortos, entre 50 y 100 palabras.`;
  }

  /**
   * Load all places context for the AI
   * @returns {Promise<string>} Formatted places context
   */
  async loadPlacesContext() {
    try {
      const { places } = await placeRepository.findPaginatedWithCount(1, 100); // Get up to 100 places to avoid token limits
      const context = places.map(place =>
        `Place: ${place.name}\nAddress: ${place.address}\nCity: ${place.city || 'Unknown City'}\nDescription: ${place.description || 'No description available'}\nRating: ${place.rating || 'Not rated'}\n---`
      ).join('\n\n');

      return context;
    } catch (error) {
      logger.error(`Error loading places context: ${error.message}`);
      return "No places available at the moment.";
    }
  }

  /**
   * Load all reviews context for the AI
   * @returns {Promise<string>} Formatted reviews context
   */
  async loadReviewsContext() {
    try {
      const reviews = await reviewRepository.findAll(0, 100); // Get up to 100 reviews to avoid token limits
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
      // Load user info
      const userRepository = new UserRepository();
      const user = await userRepository.findById(userId);
      const userEmail = user ? user.email : 'Unknown User';

      // Load places and reviews context
      const placesContext = await this.loadPlacesContext();
      const reviewsContext = await this.loadReviewsContext();

      // Build messages array
      const messages = [
        new SystemMessage(this.systemPrompt.replace('{user_email}', userEmail).replace('{places_context}', placesContext).replace('{reviews_context}', reviewsContext)),
      ];

      // Load conversation history for context
      if (conversationId) {
        const previousMessages = await chatMessageRepository.findByUserId(
          userId,
          10, // Get last 10 messages for context to reduce token usage
          0,
          conversationId
        );
        // Reverse to get chronological order (oldest first)
        const chronologicalMessages = previousMessages.reverse();

        logger.info(`Loading ${chronologicalMessages.length} previous messages for conversation ${conversationId}`);

        // Add conversation history as HumanMessage and AIMessage pairs
        chronologicalMessages.forEach((msg, index) => {
          logger.info(`Adding message ${index}: HumanMessage - ${msg.message.substring(0, 50)}...`);
          messages.push(new HumanMessage(msg.message));
          if (msg.response) {
            logger.info(`Adding message ${index}: AIMessage - ${msg.response.substring(0, 50)}...`);
            messages.push(new AIMessage(msg.response));
          } else {
            logger.warn(`Message ${msg.id} has no response, skipping AIMessage`);
          }
        });
      }

      // Add current user message
      messages.push(new HumanMessage(message));

      // Log messages being sent to AI
      logger.info(`Sending ${messages.length} messages to AI model`);
      
      // Log the complete chat history array for debugging
      logger.info(`Complete Chat History Array: ${JSON.stringify(messages.map((msg, index) => ({
        index,
        type: msg.constructor.name,
        content: msg.content
      })), null, 2)}`);
      
      // Also log each message individually for detailed inspection
      messages.forEach((msg, index) => {
        logger.info(`Message ${index}: ${msg.constructor.name} - ${msg.content ? msg.content.substring(0, 50) : 'No content'}...`);
      });

      // Generate AI response
      let response;
      try {
        logger.info('Invoking AI model...');
        response = await this.model.invoke(messages);
        logger.info(`AI Response type: ${typeof response}`);
        logger.info(`AI Response keys: ${response ? Object.keys(response).join(', ') : 'No response object'}`);
        logger.info(`AI Response content type: ${response && response.content ? typeof response.content : 'No content property'}`);
        logger.info(`AI Response content length: ${response && response.content ? response.content.length : 'No content'}`);
        logger.info(`AI Response generated successfully: ${response && response.content ? response.content.substring(0, 100) : 'No content'}...`);
      } catch (aiError) {
        logger.error(`AI model error: ${aiError.message}`);
        logger.error(`AI model error stack: ${aiError.stack}`);
        throw new Error(`AI service failed: ${aiError.message}`);
      }

      // Ensure response has content
      if (!response) {
        logger.error('AI response is null or undefined');
        throw new Error('AI service returned null response');
      }
      if (!response.content) {
        logger.error(`AI response has no content property. Response: ${JSON.stringify(response)}`);
        throw new Error('AI service returned response without content');
      }
      if (typeof response.content !== 'string') {
        logger.error(`AI response content is not a string. Type: ${typeof response.content}, Value: ${response.content}`);
        throw new Error('AI service returned non-string content');
      }

      // Create chat message record
      const chatMessage = await chatMessageRepository.create({
        userId,
        conversationId,
        message,
        response: response.content || 'Sorry, I could not generate a response at this time.',
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