import itineraryRepository from "../repository/itinerary.repository.js";
import logger from "../config/logger.js";

class ItineraryService {
  /**
   * Creates a new itinerary
   * @param {Object} itineraryData - The itinerary data
   * @param {string} itineraryData.name - The itinerary name
   * @param {string} itineraryData.userId - The user ID
   * @param {Array} itineraryData.items - Array of itinerary items
   * @returns {Promise<Object>} The created itinerary
   */
  async createItinerary(itineraryData) {
    try {
      logger.info(`Creating itinerary service call: ${itineraryData.name} for user: ${itineraryData.userId}`);

      // Validate required fields
      if (!itineraryData.name || !itineraryData.userId || !itineraryData.items) {
        throw {
          status: 400,
          message: "Nombre del itinerario, ID de usuario e items son requeridos.",
        };
      }

      // Validate items
      if (!Array.isArray(itineraryData.items) || itineraryData.items.length === 0) {
        throw {
          status: 400,
          message: "El itinerario debe tener al menos un lugar.",
        };
      }

      // Validate each item
      for (const item of itineraryData.items) {
        if (!item.placeId || !item.date) {
          throw {
            status: 400,
            message: "Cada lugar debe tener un ID de lugar y una fecha.",
          };
        }
      }

      // Check if itinerary name already exists for this user
      const nameExists = await itineraryRepository.checkItineraryNameExists(
        itineraryData.name,
        itineraryData.userId
      );

      if (nameExists) {
        throw {
          status: 409,
          message: "Ya existe un itinerario con este nombre.",
        };
      }

      // Create the itinerary
      const itinerary = await itineraryRepository.createItinerary(itineraryData);

      logger.info(`Itinerary created successfully: ${itinerary.id}`);

      return {
        success: true,
        message: "Itinerario creado exitosamente.",
        data: {
          id: itinerary.id,
          name: itinerary.name,
          userId: itinerary.userId,
          items: itinerary.items.map(item => ({
            id: item.id,
            placeId: item.placeId,
            date: item.date,
          })),
          createdAt: itinerary.createdAt,
          updatedAt: itinerary.updatedAt,
        },
      };
    } catch (error) {
      logger.error(`Error in createItinerary service: ${error.message}`);
      
      // If it's already a structured error, re-throw it
      if (error.status && error.message) {
        throw error;
      }

      // Otherwise, wrap it in a generic error
      throw {
        status: 500,
        message: "Error interno del servidor al crear el itinerario.",
      };
    }
  }

  /**
   * Gets an itinerary by ID
   * @param {string} itineraryId - The itinerary ID
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<Object>} The itinerary
   */
  async getItineraryById(itineraryId, userId) {
    try {
      logger.info(`Getting itinerary service call: ${itineraryId} for user: ${userId}`);

      const itinerary = await itineraryRepository.getItineraryById(itineraryId);

      if (!itinerary) {
        throw {
          status: 404,
          message: "Itinerario no encontrado.",
        };
      }

      // Check if user owns this itinerary OR is member of a group that has it assigned
      const isOwner = itinerary.userId === userId;
      
      if (!isOwner) {
        // Check if user is member of any group with this itinerary assigned
        const { default: groupRepository } = await import("../repository/group.repository.js");
        const userGroups = await groupRepository.findByUserId(userId);
        const hasAccessThroughGroup = userGroups.some(
          group => group.assignedItineraryId === itineraryId
        );

        if (!hasAccessThroughGroup) {
          throw {
            status: 403,
            message: "No tienes permisos para acceder a este itinerario.",
          };
        }
      }

      logger.info(`Itinerary retrieved successfully: ${itineraryId}`);

      return {
        success: true,
        message: "Itinerario obtenido exitosamente.",
        data: {
          id: itinerary.id,
          name: itinerary.name,
          userId: itinerary.userId,
          items: itinerary.items.map(item => ({
            id: item.id,
            placeId: item.placeId,
            date: item.date,
            place: item.place ? {
              id: item.place.id,
              name: item.place.name,
              address: item.place.address,
              latitude: item.place.latitude,
              longitude: item.place.longitude,
              image: item.place.image,
              rating: item.place.rating,
              description: item.place.description,
              city: item.place.city,
            } : null,
          })),
          createdAt: itinerary.createdAt,
          updatedAt: itinerary.updatedAt,
        },
      };
    } catch (error) {
      logger.error(`Error in getItineraryById service: ${error.message}`);
      
      if (error.status && error.message) {
        throw error;
      }

      throw {
        status: 500,
        message: "Error interno del servidor al obtener el itinerario.",
      };
    }
  }

  /**
   * Gets all itineraries for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Array of user's itineraries
   */
  async getUserItineraries(userId) {
    try {
      logger.info(`Getting user itineraries service call for user: ${userId}`);

      const itineraries = await itineraryRepository.getUserItineraries(userId);

      logger.info(`Retrieved ${itineraries.length} itineraries for user: ${userId}`);

      return {
        success: true,
        message: "Itinerarios obtenidos exitosamente.",
        data: itineraries.map(itinerary => ({
          id: itinerary.id,
          name: itinerary.name,
          userId: itinerary.userId,
          items: itinerary.items.map(item => ({
            id: item.id,
            placeId: item.placeId,
            date: item.date,
            place: item.place ? {
              id: item.place.id,
              name: item.place.name,
              address: item.place.address,
              latitude: item.place.latitude,
              longitude: item.place.longitude,
              image: item.place.image,
              rating: item.place.rating,
              description: item.place.description,
              city: item.place.city,
            } : null,
          })),
          createdAt: itinerary.createdAt,
          updatedAt: itinerary.updatedAt,
        })),
      };
    } catch (error) {
      logger.error(`Error in getUserItineraries service: ${error.message}`);
      
      throw {
        status: 500,
        message: "Error interno del servidor al obtener los itinerarios.",
      };
    }
  }

  /**
   * Updates an itinerary
   * @param {string} itineraryId - The itinerary ID
   * @param {Object} updateData - The data to update
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<Object>} The updated itinerary
   */
  async updateItinerary(itineraryId, updateData, userId) {
    try {
      logger.info(`Updating itinerary service call: ${itineraryId} for user: ${userId}`);

      // First check if itinerary exists and user owns it
      const existingItinerary = await itineraryRepository.getItineraryById(itineraryId);
      
      if (!existingItinerary) {
        throw {
          status: 404,
          message: "Itinerario no encontrado.",
        };
      }

      if (existingItinerary.userId !== userId) {
        throw {
          status: 403,
          message: "No tienes permisos para modificar este itinerario.",
        };
      }

      // Validate update data
      if (updateData.name && updateData.name.trim() === "") {
        throw {
          status: 400,
          message: "El nombre del itinerario no puede estar vacío.",
        };
      }

      // Check if new name already exists (if name is being updated)
      if (updateData.name && updateData.name !== existingItinerary.name) {
        const nameExists = await itineraryRepository.checkItineraryNameExists(
          updateData.name,
          userId
        );

        if (nameExists) {
          throw {
            status: 409,
            message: "Ya existe un itinerario con este nombre.",
          };
        }
      }

      // Validate items if provided
      if (updateData.items) {
        if (!Array.isArray(updateData.items) || updateData.items.length === 0) {
          throw {
            status: 400,
            message: "El itinerario debe tener al menos un lugar.",
          };
        }

        for (const item of updateData.items) {
          if (!item.placeId || !item.date) {
            throw {
              status: 400,
              message: "Cada lugar debe tener un ID de lugar y una fecha.",
            };
          }
        }
      }

      const updatedItinerary = await itineraryRepository.updateItinerary(itineraryId, updateData);

      logger.info(`Itinerary updated successfully: ${itineraryId}`);

      return {
        success: true,
        message: "Itinerario actualizado exitosamente.",
        data: {
          id: updatedItinerary.id,
          name: updatedItinerary.name,
          userId: updatedItinerary.userId,
          items: updatedItinerary.items.map(item => ({
            id: item.id,
            placeId: item.placeId,
            date: item.date,
            place: item.place ? {
              id: item.place.id,
              name: item.place.name,
              address: item.place.address,
              latitude: item.place.latitude,
              longitude: item.place.longitude,
              image: item.place.image,
              rating: item.place.rating,
              description: item.place.description,
              city: item.place.city,
            } : null,
          })),
          createdAt: updatedItinerary.createdAt,
          updatedAt: updatedItinerary.updatedAt,
        },
      };
    } catch (error) {
      logger.error(`Error in updateItinerary service: ${error.message}`);
      
      if (error.status && error.message) {
        throw error;
      }

      throw {
        status: 500,
        message: "Error interno del servidor al actualizar el itinerario.",
      };
    }
  }

  /**
   * Deletes an itinerary
   * @param {string} itineraryId - The itinerary ID
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<Object>} Success message
   */
  async deleteItinerary(itineraryId, userId) {
    try {
      logger.info(`Deleting itinerary service call: ${itineraryId} for user: ${userId}`);

      // First check if itinerary exists and user owns it
      const existingItinerary = await itineraryRepository.getItineraryById(itineraryId);
      
      if (!existingItinerary) {
        throw {
          status: 404,
          message: "Itinerario no encontrado.",
        };
      }

      if (existingItinerary.userId !== userId) {
        throw {
          status: 403,
          message: "No tienes permisos para eliminar este itinerario.",
        };
      }

      const deleted = await itineraryRepository.deleteItinerary(itineraryId);

      if (!deleted) {
        throw {
          status: 404,
          message: "Itinerario no encontrado.",
        };
      }

      logger.info(`Itinerary deleted successfully: ${itineraryId}`);

      return {
        success: true,
        message: "Itinerario eliminado exitosamente.",
      };
    } catch (error) {
      logger.error(`Error in deleteItinerary service: ${error.message}`);
      
      if (error.status && error.message) {
        throw error;
      }

      throw {
        status: 500,
        message: "Error interno del servidor al eliminar el itinerario.",
      };
    }
  }

  /**
   * Gets all groups where an itinerary is assigned
   * @param {string} itineraryId - The itinerary ID
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<Object>} Array of groups
   */
  async getItineraryGroups(itineraryId, userId) {
    try {
      logger.info(`Getting groups for itinerary: ${itineraryId} for user: ${userId}`);

      // Check if itinerary exists and user owns it
      const itinerary = await itineraryRepository.getItineraryById(itineraryId);

      if (!itinerary) {
        throw {
          status: 404,
          message: "Itinerario no encontrado.",
        };
      }

      if (itinerary.userId !== userId) {
        throw {
          status: 403,
          message: "No tienes permisos para acceder a este itinerario.",
        };
      }

      // Import here to avoid circular dependency
      const groupRepository = (await import("../repository/group.repository.js")).default;
      
      // Get all groups where this itinerary is assigned
      const groups = await groupRepository
        .getRepository()
        .createQueryBuilder("group")
        .leftJoinAndSelect("group.admin", "admin")
        .leftJoinAndSelect("group.members", "members")
        .where("group.assignedItineraryId = :itineraryId", { itineraryId })
        .getMany();

      logger.info(`Found ${groups.length} groups for itinerary: ${itineraryId}`);

      return {
        success: true,
        message: "Grupos obtenidos exitosamente.",
        data: groups.map(group => ({
          id: group.id,
          name: group.name,
          description: group.description,
          adminId: group.adminId,
          memberCount: group.members ? group.members.length : 0,
        })),
      };
    } catch (error) {
      logger.error(`Error in getItineraryGroups service: ${error.message}`);
      
      if (error.status && error.message) {
        throw error;
      }

      throw {
        status: 500,
        message: "Error interno del servidor al obtener los grupos.",
      };
    }
  }
}

export default new ItineraryService();
