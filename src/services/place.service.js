import placeRepository from "../repository/place.repository.js";
import { validatePlaceData } from "../utils/validators.js";
import logger from "../config/logger.js";

class PlaceService {
  /**
   * Agrega un nuevo lugar
   * @param {Object} placeData - { name, address, latitude, longitude }
   * @returns {Promise<Object>} - { place, message }
   */
  async addPlace({ name, address, latitude, longitude }) {
    // 1. Validar datos del lugar
    const validation = validatePlaceData({ name, address, latitude, longitude });
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
}

export default new PlaceService();