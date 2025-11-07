import placeRepository from "../repository/place.repository.js";
import userFavoriteRepository from "../repository/userFavorite.repository.js";
import { validatePlaceData, validateDescription } from "../utils/validators.js";
import logger from "../config/logger.js";

class PlaceService {
  /**
   * Agrega un nuevo lugar
   * @param {Object} placeData - { name, address, latitude, longitude, image?, description?, city? }
   * @returns {Promise<Object>} - { place, message }
   */
  async addPlace({ name, address, latitude, longitude, image, description, city }) {





    // 2. Verificar si el lugar ya existe (por nombre y dirección exactas)
    const existingPlace = await placeRepository.findByNameAndAddress(
      name,
      address
    );
    if (existingPlace) {
      const error = new Error("Este lugar ya está registrado.");
      error.status = 409;
      throw error;
    }
    // 1. Validar datos del lugar
    const validation = validatePlaceData({
      name,
      address,
      latitude,
      longitude,
      image,
      description,
      city,
    });
    if (!validation.isValid) {
      const error = new Error("Invalid place data");
      error.status = 400;
      error.details = validation.errors;
      throw error;
    }



    // 3. Crear el lugar
    try {
      const place = await placeRepository.create({
        name: name.trim(),
        address: address.trim(),
        latitude,
        longitude,
        image: image ? image.trim() : null,
        description: description ? description.trim() : null,
        city: city ? city.trim() : null,
      });

      logger.info(`Place added successfully: ${place.id} - ${place.name}`);

      // 4. Retornar lugar sin datos sensibles (aunque no hay ninguno)
      return {
        place,
        message: "Place added successfully",
      };
    } catch (err) {
      logger.error(`Error adding place: ${err.message}`);
      // Simular error de servicio externo si es necesario
      const error = new Error("Servicio externo no disponible.");
      error.status = 503;
      throw error;
    }
  }

  /**
   * Verifica si un lugar existe
   * @param {string} name - Nombre del lugar
   * @param {number} latitude - Latitud
   * @param {number} longitude - Longitud
   * @returns {Promise<Object>} - { exists: boolean, place?: Object }
   */
  async checkPlaceExistence(name, address) {
    // 1. Validar datos básicos
    const validation = validatePlaceData({
      name,
      address,
      latitude: 0, // dummy values for validation
      longitude: 0,
    });
    if (!validation.isValid) {
      const error = new Error("Invalid place data");
      error.status = 400;
      error.details = validation.errors;
      throw error;
    }

    try {
      // 2. Buscar lugar por nombre y dirección exactas
      const place = await placeRepository.findByNameAndAddress(
        name,
        address
      );

      if (place) {
        return {
          exists: true,
          place: {
            id: place.id,
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            rating: place.rating,
          },
        };
      } else {
        return {
          exists: false,
        };
      }
    } catch (err) {
      logger.error(`Error checking place existence: ${err.message}`);
      // Simular error de servicio externo
      const error = new Error("Servicio externo no disponible.");
      error.status = 503;
      throw error;
    }
  }

  /**
   * Obtiene lugares paginados para el feed con conteo total
   * @param {number} page - Número de página (1-based, default: 1)
   * @param {number} limit - Número de lugares por página (default: 20)
   * @returns {Promise<Object>} - { places: Array, totalCount: number }
   */
  async getPlacesForFeed(page = 1, limit = 20) {
    try {
      // Validar parámetros
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        const error = new Error("Invalid page number");
        error.status = 400;
        throw error;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const error = new Error("Invalid limit (must be between 1 and 100)");
        error.status = 400;
        throw error;
      }

      const result = await placeRepository.findPaginatedWithCount(
        pageNum,
        limitNum
      );

      logger.info(
        `Retrieved ${result.places.length} places for feed (page: ${pageNum}, limit: ${limitNum}, total: ${result.totalCount})`
      );

      return result;
    } catch (err) {
      logger.error(`Error getting places for feed: ${err.message}`);
      throw err;
    }
  }

  /**
    * Actualiza la descripción de un lugar
    * @param {string} id - ID del lugar a actualizar
    * @param {string} description - Nueva descripción
    * @returns {Promise<Object>} - Lugar actualizado
    * @throws {Error} - Si el lugar no existe, validación falla o hay error en la actualización
    */
  async updateDescription(id, description) {
    try {
      if (!id) {
        const error = new Error("ID is required");
        error.status = 400;
        throw error;
      }

      // Validar descripción
      const validation = validateDescription(description);
      if (!validation.isValid) {
        const error = new Error("Invalid description");
        error.status = 400;
        error.details = validation.errors;
        throw error;
      }

      // Verificar que el lugar existe
      const existingPlace = await placeRepository.findById(id);
      if (!existingPlace) {
        const error = new Error("Place not found");
        error.status = 404;
        throw error;
      }

      // Actualizar descripción
      const updatedPlace = await placeRepository.update(id, {
        description: description.trim(),
      });

      logger.info(`Updated description for place ID: ${id}`);

      return {
        id: updatedPlace.id,
        name: updatedPlace.name,
        description: updatedPlace.description,
        updatedAt: updatedPlace.updatedAt,
      };
    } catch (err) {
      logger.error(`Error updating description for place ID ${id}: ${err.message}`);
      throw err;
    }
  }

  /**
     * Obtiene un lugar por su ID
     * @param {string} id - ID del lugar a buscar
     * @returns {Promise<Object>} - Lugar encontrado
     * @throws {Error} - Si el lugar no existe o hay un error en la búsqueda
     */
  async getPlaceById(id) {
    try {
      if (!id) {
        const error = new Error("ID is required");
        error.status = 400;
        throw error;
      }

      const place = await placeRepository.findById(id);

      if (!place) {
        const error = new Error("Place not found");
        error.status = 404;
        throw error;
      }

      logger.info(`Retrieved place by ID: ${id}`);

      return {
        id: place.id,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        image: place.image,
        rating: place.rating,
        description: place.description,
        city: place.city,
        createdAt: place.createdAt,
      };
    } catch (err) {
      logger.error(`Error getting place by ID ${id}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Toggle favorite status for a place
   * @param {string} userId - ID del usuario
   * @param {string} placeId - ID del lugar
   * @returns {Promise<Object>} - { isFavorite: boolean, message: string }
   * @throws {Error} - Si hay error en la operación
   */
  async toggleFavorite(userId, placeId) {
    try {
      if (!userId || !placeId) {
        const error = new Error("User ID and Place ID are required");
        error.status = 400;
        throw error;
      }

      // Verificar que el lugar existe
      const place = await placeRepository.findById(placeId);
      if (!place) {
        const error = new Error("Place not found");
        error.status = 404;
        throw error;
      }

      const result = await userFavoriteRepository.toggleFavorite(userId, placeId);

      const message = result.isFavorite ? "Place favorited successfully" : "Place unfavorited successfully";

      logger.info(`User ${userId} ${result.isFavorite ? 'favorited' : 'unfavorited'} place ${placeId}`);

      return {
        isFavorite: result.isFavorite,
        message,
      };
    } catch (err) {
      logger.error(`Error toggling favorite for user ${userId} and place ${placeId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Check if a place is favorited by a user
   * @param {string} userId - ID del usuario
   * @param {string} placeId - ID del lugar
   * @returns {Promise<Object>} - { isFavorite: boolean }
   * @throws {Error} - Si hay error en la operación
   */
  async getFavoriteStatus(userId, placeId) {
    try {
      if (!userId || !placeId) {
        const error = new Error("User ID and Place ID are required");
        error.status = 400;
        throw error;
      }

      // Verificar que el lugar existe
      const place = await placeRepository.findById(placeId);
      if (!place) {
        const error = new Error("Place not found");
        error.status = 404;
        throw error;
      }

      const isFavorite = await userFavoriteRepository.isFavorite(userId, placeId);

      logger.info(`Retrieved favorite status for user ${userId} and place ${placeId}: ${isFavorite}`);

      return {
        isFavorite,
      };
    } catch (err) {
      logger.error(`Error getting favorite status for user ${userId} and place ${placeId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get all favorite places for a user
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - { favorites: Array, message: string }
   * @throws {Error} - Si hay error en la operación
   */
  async getUserFavorites(userId) {
    try {
      if (!userId) {
        const error = new Error("User ID is required");
        error.status = 400;
        throw error;
      }

      const favorites = await userFavoriteRepository.getUserFavoritesWithDetails(userId);

      // Extraer solo los datos del lugar, filtrando lugares que ya no existen
      const places = favorites
        .filter(fav => fav.place !== null)
        .map(fav => ({
          id: fav.place.id,
          name: fav.place.name,
          address: fav.place.address,
          latitude: fav.place.latitude,
          longitude: fav.place.longitude,
          image: fav.place.image,
          rating: fav.place.rating,
          createdAt: fav.place.createdAt,
          updatedAt: fav.place.updatedAt,
          description: fav.place.description,
          city: fav.place.city,
        }));

      logger.info(`Retrieved ${places.length} favorites for user ${userId}`);

      return {
        favorites: places,
        message: "Favorites retrieved successfully",
      };
    } catch (err) {
      logger.error(`Error getting favorites for user ${userId}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Busca lugares por nombre con filtros opcionales y ordenamiento por proximidad
   * @param {string} q - Término de búsqueda (nombre, mínimo 3 caracteres)
   * @param {string} city - Ciudad para filtrar (opcional)
   * @param {number} latitude - Latitud del usuario para ordenar por distancia (opcional)
   * @param {number} longitude - Longitud del usuario para ordenar por distancia (opcional)
   * @returns {Promise<Array>} - Array de lugares encontrados
   * @throws {Error} - Si la consulta es inválida
   */
  async searchPlaces(q, city, latitude, longitude, page = 1, limit = 20) {
    try {
      // Validar si se proporciona al menos un parámetro de filtro
      const hasQ = q && q.trim().length > 0;
      const hasCity = city && city.trim().length > 0;
      const hasCoords = latitude !== undefined && longitude !== undefined;
      if (!hasQ && !hasCity && !hasCoords) {
        const error = new Error("Se debe proporcionar al menos un parámetro de filtro (q, city, o coordenadas)");
        error.status = 400;
        throw error;
      }

      // Validar q si proporcionado
      if (hasQ && q.trim().length < 3) {
        const error = new Error("La consulta de búsqueda debe tener al menos 3 caracteres");
        error.status = 400;
        throw error;
      }

      // Validar coordenadas si se proporcionan
      if (hasCoords) {
        if (isNaN(latitude) || latitude < -90 || latitude > 90) {
          const error = new Error("Latitud inválida");
          error.status = 400;
          throw error;
        }
        if (isNaN(longitude) || longitude < -180 || longitude > 180) {
          const error = new Error("Longitud inválida");
          error.status = 400;
          throw error;
        }
      } else if (latitude !== undefined || longitude !== undefined) {
        const error = new Error("Ambas coordenadas (latitud y longitud) deben proporcionarse para el ordenamiento por proximidad");
        error.status = 400;
        throw error;
      }

      // Validar paginación
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        const error = new Error("Número de página inválido");
        error.status = 400;
        throw error;
      }
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const error = new Error("Límite inválido (debe estar entre 1 y 100)");
        error.status = 400;
        throw error;
      }

      const result = await placeRepository.searchPlaces(
        hasQ ? q.trim() : null,
        hasCity ? city.trim() : null,
        latitude,
        longitude,
        pageNum,
        limitNum
      );

      logger.info(`Search completed for query "${q || ''}", city: "${city || ''}", page: ${pageNum}, limit: ${limitNum}, found ${result.places.length} places`);

      return result;
    } catch (err) {
      logger.error(`Error searching places: ${err.message}`);
      throw err;
    }
  }
}

export default new PlaceService();
