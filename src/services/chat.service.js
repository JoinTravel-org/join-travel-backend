import { ChatXAI } from "@langchain/xai";
import { z } from "zod";
import { createAgent, tool, HumanMessage, AIMessage, SystemMessage } from "langchain";
import conversationRepository from "../repository/conversation.repository.js";
import chatMessageRepository from "../repository/chatMessage.repository.js";
import reviewRepository from "../repository/review.repository.js";
import placeRepository from "../repository/place.repository.js";
import UserRepository from "../repository/user.repository.js";
import itineraryRepository from "../repository/itinerary.repository.js";
import logger from "../config/logger.js";


class ChatService {
  constructor() {
    this.systemPrompt = `Eres un asistente virtual útil y amable para JoinTravel llamado Viajitus, una plataforma de viajes que ayuda a los usuarios a descubrir lugares turísticos y conocer las opiniones de otros viajeros.
Tienes acceso a información detallada sobre los lugares disponibles y a reseñas y valoraciones de usuarios.

Usuario: {user_email}
Hora actual (UTC-3): {current_time}

Lugares:
{places_context}

Reseñas:
{reviews_context}

Información de la página:
- Los itinerarios se pueden acceder en [Colecciones > Itinerarios](${process.env.FRONTEND_URL}/collections?type=itineraries)

Instrucciones:
- Ofrece una respuesta clara, útil y precisa basada en la información de los lugares, las reseñas y tu conocimiento general sobre viajes.
- Si la pregunta se refiere a un lugar específico, utiliza la información disponible y las opiniones relevantes para enriquecer tu respuesta.
- Mantén un tono conversacional, cercano y positivo, como si fueras un guía turístico experto y amigable.
- Cuando sea apropiado, sugiere actividades, recomendaciones gastronómicas, eventos o consejos prácticos relacionados con el destino.
- Si falta información, reconoce la limitación de forma natural y ofrece alternativas o formas de obtener más detalles.
- Manten los mensajes de respuesta cortos, entre 50 y 100 palabras. No hace falta que menciones la cantidad de palabras.
- Si el usuario pregunta por el clima o condiciones meteorológicas, debes llamar la herramienta get_weather.
- Si el usuario pide crear un itinerario o ruta con lugares específicos, utiliza la herramienta propose_itinerary para crear una propuesta organizada por días.
- Si el usuario está de acuerdo con la propuesta, utiliza la herramienta create_itinerary para guardarlo en la base de datos. SIEMPRE PRIMERO PROPONE, ESPERA INPUT DEL USUARIO Y DESPUÉS CREA ÚNICAMENTE CUANDO EL USUARIO LO APRUEBE.
- También puedes crear un itinerario directamente usando la herramienta create_itinerary con nombres de lugares y el email del usuario.
- Una vez creado exitosamente el itinerario le dices al usuario dónde puede acceder a él.
`;

    const model = new ChatXAI({
      model: "grok-code-fast-1",
      apiKey: process.env.XAI_API_KEY,
    });

    this.agent = createAgent({
      model: model,
      tools: this.buildTools()
    });
  }

  static async propose_itinerary(params) {
    const { placeNames, itineraryName } = params;
    logger.info(
      `Tool called: propose_itinerary(placeNames: ${JSON.stringify(placeNames)}, itineraryName: ${itineraryName})`
    );

    try {
      // Look up places by name using search
      logger.info(`Searching for ${placeNames.length} places for proposal: ${JSON.stringify(placeNames)}`);
      const places = [];
      for (const placeName of placeNames) {
        try {
          const searchResult = await placeRepository.searchPlaces(placeName, null, undefined, undefined, 1, 5);
          if (searchResult.places && searchResult.places.length > 0) {
            // Take the first (best) match
            places.push(searchResult.places[0]);
            logger.info(`Found place "${placeName}" -> "${searchResult.places[0].name}" (ID: ${searchResult.places[0].id})`);
          } else {
            logger.warn(`No places found for search term: "${placeName}"`);
          }
        } catch (placeError) {
          logger.error(`Error searching for place "${placeName}": ${placeError.message}`);
        }
      }

      if (places.length === 0) {
        logger.error(`No valid places found for proposal. Searched terms: ${JSON.stringify(placeNames)}`);
        return "No se encontraron lugares con esos nombres. Por favor verifica los nombres de los lugares.";
      }
      logger.info(`Created proposal with ${places.length} places out of ${placeNames.length} searched terms`);

      // Create a simple itinerary proposal with dates starting from tomorrow
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Start tomorrow

      const items = places.map((place, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + Math.floor(index / 2)); // 2 places per day
        return {
          placeName: place.name,
          placeId: place.id,
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          description: place.description || 'Sin descripción disponible'
        };
      });

      // Group by date for display
      const groupedByDate = items.reduce((acc, item) => {
        if (!acc[item.date]) {
          acc[item.date] = [];
        }
        acc[item.date].push(item);
        return acc;
      }, {});

      // Create formatted text response
      let response = `¡He creado una propuesta de itinerario para ti!\n\n`;
      response += `**Itinerario: ${itineraryName}**\n\n`;

      Object.keys(groupedByDate).sort().forEach(date => {
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
        const formattedDate = dateObj.toLocaleDateString('es-ES');
        response += `**${dayName} ${formattedDate}:**\n`;

        groupedByDate[date].forEach((item, index) => {
          response += `${index + 1}. ${item.placeName} - ${item.description}\n`;
        });
        response += '\n';
      });

      response += `¿Te gusta esta propuesta? Si estás de acuerdo, puedo guardarla como tu itinerario.\n\n`;

      // Add metadata for frontend parsing
      const metadata = {
        name: itineraryName,
        items: items.map(item => ({
          placeName: item.placeName,
          placeId: item.placeId,
          date: item.date
        }))
      };

      response += "Información de propuesta de itinerario:"
      response += `[ITINERARY_PROPOSAL:${JSON.stringify(metadata)}]`;

      response += "\n Ahora puedes proponer este itinerario al usuario dandole un formato mas amigable para el humano! Preguntale si le parece bien."

      return response;
    } catch (error) {
      logger.error(`Error in propose_itinerary: ${error.message}`);
      return "Lo siento, hubo un error al crear la propuesta de itinerario. Por favor intenta de nuevo.";
    }
  }

  static async create_itinerary(params) {
    const { name, places, userEmail } = params;
    logger.info(
      `Tool called: create_itinerary(name: ${name}, places: ${JSON.stringify(places)}, userEmail: ${userEmail})`
    );

    try {
      // Validate that we have the required data
      if (!name || !places || !Array.isArray(places) || places.length === 0 || !userEmail) {
        return "Datos incompletos para crear el itinerario.";
      }

      // Look up user by email
      logger.info(`Looking up user by email: ${userEmail}`);
      const userRepository = new UserRepository();
      const user = await userRepository.findByEmail(userEmail);
      if (!user) {
        logger.error(`User not found with email: ${userEmail}`);
        return "No se encontró el usuario con ese email.";
      }
      logger.info(`Found user: ${user.id} for email: ${userEmail}`);

      // Look up places by name using fuzzy search and pair with provided dates
      logger.info(`Searching for ${places.length} places with dates`);
      const itineraryItems = [];
      for (const placeData of places) {
        const { placeName, date } = placeData;
        try {
          const searchResult = await placeRepository.searchPlaces(placeName, null, undefined, undefined, 1, 5);
          if (searchResult.places && searchResult.places.length > 0) {
            const foundPlace = searchResult.places[0]; // Take the best match
            itineraryItems.push({
              placeId: foundPlace.id,
              date: date
            });
            logger.info(`Found place "${placeName}" -> "${foundPlace.name}" (ID: ${foundPlace.id}) for date: ${date}`);
          } else {
            logger.warn(`No places found for search term: "${placeName}"`);
          }
        } catch (placeError) {
          logger.error(`Error searching for place "${placeName}": ${placeError.message}`);
        }
      }

      if (itineraryItems.length === 0) {
        logger.error(`No valid places found for itinerary. Searched places: ${JSON.stringify(places)}`);
        return "No se encontraron lugares válidos para crear el itinerario.";
      }
      logger.info(`Created ${itineraryItems.length} itinerary items out of ${places.length} requested places`);

      // Create the itinerary
      const itineraryData = {
        name,
        userId: user.id,
        items: itineraryItems
      };

      logger.info(`Creating itinerary "${name}" for user ${user.id} with ${itineraryItems.length} items`);
      logger.debug(`Itinerary data: ${JSON.stringify(itineraryData)}`);

      const result = await itineraryRepository.createItinerary(itineraryData);
      logger.info(`Successfully created itinerary "${name}" with ID: ${result.data.id}`);
      return `¡Perfecto! He creado el itinerario "${name}" con ${itineraryItems.length} lugares.`;
    
    } catch (error) {
      logger.error(`Unexpected error in create_itinerary: ${error.message}`, {
        stack: error.stack,
        name,
        userEmail,
        places: JSON.stringify(places),
        userId: user?.id
      });
      return `Lo siento, hubo un error al guardar el itinerario: ${error.message}`;
    }
  }

  buildTools() {
    const proposeItineraryTool = tool(ChatService.propose_itinerary, {
      name: "propose_itinerary",
      description: "Create a proposed itinerary from a list of place names",
      schema: z.object({
        placeNames: z.array(z.string()).describe("Array of place names to include in the itinerary"),
        itineraryName: z.string().describe("Name for the proposed itinerary"),
      }),
    });

    const createItineraryTool = tool(ChatService.create_itinerary, {
      name: "create_itinerary",
      description: "Create and save an itinerary in the database using place names with dates and user email",
      schema: z.object({
        name: z.string().describe("Name of the itinerary"),
        places: z.array(z.object({
          placeName: z.string().describe("Name of the place"),
          date: z.string().describe("Date for this place in YYYY-MM-DD format"),
        })).describe("Array of places with their names and dates"),
        userEmail: z.string().describe("Email of the user who owns the itinerary"),
      }),
    });

    return [proposeItineraryTool, createItineraryTool];
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

      // Get current time in UTC-3
      const now = new Date();
      const utcMinus3 = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // Subtract 3 hours
      const currentTime = utcMinus3.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Build messages array
      const messages = [
        new SystemMessage(this.systemPrompt
          .replace('{user_email}', userEmail)
          .replace('{current_time}', currentTime)
          .replace('{places_context}', placesContext)
          .replace('{reviews_context}', reviewsContext)),
      ];
      // Load entire chat history for the user from all conversations
      logger.info(`Loading entire chat history for userId: ${userId}`);

      // Get total count of all messages for this user
      const totalMessages = await chatMessageRepository.countByUserId(userId);
      logger.info(`Total messages for user across all conversations: ${totalMessages}`);

      if (totalMessages > 0) {
        const allUserMessages = await chatMessageRepository.findByUserId(
          userId,
          totalMessages, // Get all messages for full context
          0,
          null // No conversation filter - get all conversations
        );
        logger.info(`Found ${allUserMessages.length} total messages for user`);

        // Reverse to get chronological order (oldest first)
        const chronologicalMessages = allUserMessages.reverse();
        logger.info(`After reversing, chronological messages: ${chronologicalMessages.length}`);

        // Add entire chat history as HumanMessage and AIMessage pairs
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

        logger.info(`Added ${chronologicalMessages.length} message pairs from entire chat history to context`);
      } else {
        logger.info(`No previous messages found for user`);
      }

      // Add current user message
      messages.push(new HumanMessage(message));

      // Log messages being sent to AI
      logger.info(`Sending ${messages.length} messages to AI model`);
      
      // COMMENTED WHEN NEEDED TO DEBUG AGENT MESSAGE HISTORY PROCESSING
      // DO NOT REMOVE

      // Log the complete chat history array for debugging
      // logger.info(`Complete Chat History Array: ${JSON.stringify(messages.map((msg, index) => ({
      //   index,
      //   type: msg.constructor.name,
      //   content: msg.content
      // })), null, 2)}`);
      
      // Also log each message individually for detailed inspection
      // messages.forEach((msg, index) => {
      //   logger.info(`Message ${index}: ${msg.constructor.name} - ${msg.content ? msg.content.substring(0, 50) : 'No content'}...`);
      // });
      
      // DO NOT REMOVE

      // Generate AI response
      let response;
      try {
        logger.info('Invoking AI agent...');
        const agentResponse = await this.agent.invoke({ messages });

        response = agentResponse.messages[agentResponse.messages.length - 1]; // Get the last message
        logger.info(`AI Response type: ${typeof response}`);
        logger.info(`AI Response keys: ${response ? Object.keys(response).join(', ') : 'No response object'}`);
        logger.info(`AI Response content type: ${response && response.content ? typeof response.content : 'No content property'}`);
        logger.info(`AI Response content length: ${response && response.content ? response.content.length : 'No content'}`);
        logger.info(`AI Response generated successfully: ${response && response.content ? response.content.substring(0, 100) : 'No content'}...`);
      } catch (aiError) {
        logger.error(`AI agent error: ${aiError.message}`);
        logger.error(`AI agent error stack: ${aiError.stack}`);
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