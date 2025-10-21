import placeRepository from "../repository/place.repository.js";
import { validatePlaceData } from "../utils/validators.js";
import logger from "../config/logger.js";

class PlaceService {
  /**
   * Agrega un nuevo lugar
   * @param {Object} placeData - { name, address, latitude, longitude }
   * @returns {Promise<Object>} - { place, message }
   */
  async addPlace({ name, address, latitude, longitude, image }) {
    // 1. Validar datos del lugar
    const validation = validatePlaceData({ name, address, latitude, longitude, image });
    if (!validation.isValid) {
      const error = new Error("Invalid place data");
      error.status = 400;
      error.details = validation.errors;
      throw error;
    }

    // 2. Verificar si el lugar ya existe (por nombre y coordenadas exactas)
    const existingPlace = await placeRepository.findByNameAndCoordinates(name, latitude, longitude);
    if (existingPlace) {
      const error = new Error("Este lugar ya está registrado.");
      error.status = 409;
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
  async checkPlaceExistence(name, latitude, longitude) {
    // 1. Validar coordenadas
    const coordValidation = validatePlaceData({ name, address: "dummy", latitude, longitude });
    if (!coordValidation.isValid) {
      const error = new Error("Invalid coordinates");
      error.status = 400;
      error.details = coordValidation.errors;
      throw error;
    }

    try {
      // 2. Buscar lugar por nombre y coordenadas exactas
      const place = await placeRepository.findByNameAndCoordinates(name, latitude, longitude);

      if (place) {
        return {
          exists: true,
          place: {
            id: place.id,
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
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

      const result = await placeRepository.findPaginatedWithCount(pageNum, limitNum);

      logger.info(`Retrieved ${result.places.length} places for feed (page: ${pageNum}, limit: ${limitNum}, total: ${result.totalCount})`);

      return result;
    } catch (err) {
      logger.error(`Error getting places for feed: ${err.message}`);
      throw err;
    }
  }
}

export default new PlaceService();