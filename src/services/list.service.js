import listRepository from "../repository/list.repository.js";
import placeRepository from "../repository/place.repository.js";
import { validateListData, validatePlaceId } from "../utils/validators.js";
import logger from "../config/logger.js";

class ListService {
  /**
   * Crea una nueva lista
   * @param {Object} listData - { title, description?, userId }
   * @returns {Promise<Object>} - { list, message }
   */
  async createList({ title, description, userId }) {
    // Validar datos de la lista
    const validation = validateListData({ title, description });
    if (!validation.isValid) {
      const error = new Error("Invalid list data");
      error.status = 400;
      error.details = validation.errors;
      throw error;
    }

    try {
      const list = await listRepository.create({
        title: title.trim(),
        description: description ? description.trim() : null,
        userId,
      });

      logger.info(`List created successfully: ${list.id} - ${list.title}`);

      return {
        list,
        message: "List created successfully",
      };
    } catch (err) {
      logger.error(`Error creating list: ${err.message}`);
      throw err;
    }
  }

  /**
   * Obtiene listas de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} - Listas del usuario
   */
  async getUserLists(userId) {
    try {
      const lists = await listRepository.findByUserId(userId);

      logger.info(`Retrieved ${lists.length} lists for user ${userId}`);

      return lists;
    } catch (err) {
      logger.error(`Error getting lists for user ${userId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Obtiene las listas públicas de un autor (para uso público)
   * @param {string} authorId
   * @returns {Promise<Array>} listas ordenadas por createdAt desc
   */
  async getListsByAuthor(authorId) {
    try {
      const lists = await listRepository.findByUserId(authorId);

      logger.info(`Retrieved ${lists.length} lists for author ${authorId}`);

      return lists;
    } catch (err) {
      logger.error(`Error getting lists for author ${authorId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Obtiene una lista por ID
   * @param {string} id - ID de la lista
   * @param {string} userId - ID del usuario (para verificar propiedad)
   * @returns {Promise<Object>} - Lista encontrada
   */
  async getListById(id, userId) {
    try {
      const list = await listRepository.findById(id);

      if (!list) {
        const error = new Error("List not found");
        error.status = 404;
        throw error;
      }

      logger.info(`Retrieved list by ID: ${id}`);

      return list;
    } catch (err) {
      logger.error(`Error getting list by ID ${id}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Actualiza una lista
   * @param {string} id - ID de la lista
   * @param {Object} updateData - { title?, description? }
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Lista actualizada
   */
  async updateList(id, updateData, userId) {
    try {
      // Verificar que la lista existe y pertenece al usuario
      const existingList = await listRepository.findById(id);
      if (!existingList) {
        const error = new Error("List not found");
        error.status = 404;
        throw error;
      }

      if (existingList.userId !== userId) {
        const error = new Error("Access denied");
        error.status = 403;
        throw error;
      }

      // Validar datos si se proporcionan
      if (updateData.title || updateData.description !== undefined) {
        const validation = validateListData({
          title: updateData.title || existingList.title,
          description: updateData.description !== undefined ? updateData.description : existingList.description,
        });
        if (!validation.isValid) {
          const error = new Error("Invalid list data");
          error.status = 400;
          error.details = validation.errors;
          throw error;
        }
      }

      const updatedList = await listRepository.update(id, {
        title: updateData.title ? updateData.title.trim() : undefined,
        description: updateData.description !== undefined ? (updateData.description ? updateData.description.trim() : null) : undefined,
      });

      logger.info(`Updated list ID: ${id}`);

      return {
        list: updatedList,
        message: "List updated successfully",
      };
    } catch (err) {
      logger.error(`Error updating list ID ${id}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Elimina una lista
   * @param {string} id - ID de la lista
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - { message }
   */
  async deleteList(id, userId) {
    try {
      // Verificar que la lista existe y pertenece al usuario
      const existingList = await listRepository.findById(id);
      if (!existingList) {
        const error = new Error("List not found");
        error.status = 404;
        throw error;
      }

      if (existingList.userId !== userId) {
        const error = new Error("Access denied");
        error.status = 403;
        throw error;
      }

      await listRepository.delete(id);

      logger.info(`Deleted list ID: ${id}`);

      return {
        message: "List deleted successfully",
      };
    } catch (err) {
      logger.error(`Error deleting list ID ${id}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Agrega un lugar a una lista
   * @param {string} listId - ID de la lista
   * @param {string} placeId - ID del lugar
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - { list, message }
   */
  async addPlaceToList(listId, placeId, userId) {
    try {
      // Validar placeId
      const placeIdValidation = validatePlaceId(placeId);
      if (!placeIdValidation.isValid) {
        const error = new Error("Invalid place ID");
        error.status = 400;
        error.details = placeIdValidation.errors;
        throw error;
      }

      // Verificar que el lugar existe
      const place = await placeRepository.findById(placeId);
      if (!place) {
        const error = new Error("Place not found");
        error.status = 404;
        throw error;
      }

      // Verificar que la lista existe y pertenece al usuario
      const list = await listRepository.findById(listId);
      if (!list) {
        const error = new Error("List not found");
        error.status = 404;
        throw error;
      }

      if (list.userId !== userId) {
        const error = new Error("Access denied");
        error.status = 403;
        throw error;
      }

      // Agregar lugar a la lista
      const updatedList = await listRepository.addPlace(listId, placeId);

      logger.info(`Added place ${placeId} to list ${listId}`);

      return {
        list: updatedList,
        message: "Place added to list successfully",
      };
    } catch (err) {
      logger.error(`Error adding place ${placeId} to list ${listId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Remueve un lugar de una lista
   * @param {string} listId - ID de la lista
   * @param {string} placeId - ID del lugar
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - { list, message }
   */
  async removePlaceFromList(listId, placeId, userId) {
    try {
      // Validar placeId
      const placeIdValidation = validatePlaceId(placeId);
      if (!placeIdValidation.isValid) {
        const error = new Error("Invalid place ID");
        error.status = 400;
        error.details = placeIdValidation.errors;
        throw error;
      }

      // Verificar que la lista existe y pertenece al usuario
      const list = await listRepository.findById(listId);
      if (!list) {
        const error = new Error("List not found");
        error.status = 404;
        throw error;
      }

      if (list.userId !== userId) {
        const error = new Error("Access denied");
        error.status = 403;
        throw error;
      }

      // Remover lugar de la lista
      const updatedList = await listRepository.removePlace(listId, placeId);

      logger.info(`Removed place ${placeId} from list ${listId}`);

      return {
        list: updatedList,
        message: "Place removed from list successfully",
      };
    } catch (err) {
      logger.error(`Error removing place ${placeId} from list ${listId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Busca listas públicas por título o ciudad (usa repository.searchPublic)
   * @param {string} query
   * @param {string} city
   * @returns {Promise<Array>} listas encontradas
   */
  async searchPublicLists(query, city) {
    try {
      const lists = await listRepository.searchPublic(query, city);
      logger.info(`searchPublicLists returned ${lists.length} lists`);
      return lists;
    } catch (err) {
      logger.error(`Error in searchPublicLists: ${err.message}`);
      throw err;
    }
  }
}

export default new ListService();