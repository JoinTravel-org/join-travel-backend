import placeService from "../services/place.service.js";
import logger from "../config/logger.js";

/**
 * Agrega un nuevo lugar
 * POST /api/places
 * Body: { name, address, latitude, longitude }
 */
export const addPlace = async (req, res, next) => {
  logger.info(`Add place endpoint called with name: ${req.body.name}`);
  try {
    const { name, address, latitude, longitude } = req.body;

    // Validar que se envíen los campos requeridos
    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Nombre, dirección, latitud y longitud son requeridos.",
      });
    }

    const result = await placeService.addPlace({ name, address, latitude, longitude });

    logger.info(`Add place endpoint completed successfully for place: ${result.place.id}`);
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        id: result.place.id,
        name: result.place.name,
        address: result.place.address,
        latitude: result.place.latitude,
        longitude: result.place.longitude,
        createdAt: result.place.createdAt,
      },
    });
  } catch (err) {
    logger.error(`Add place endpoint failed for name: ${req.body.name}, error: ${err.message}`);
    // Si el error tiene detalles (errores de validación)
    if (err.details) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.message,
        errors: err.details,
      });
    }
    next(err);
  }
};

/**
 * Verifica si un lugar existe
 * GET /api/places/check?name=<name>&latitude=<lat>&longitude=<lng>
 */
export const checkPlace = async (req, res, next) => {
  logger.info(`Check place endpoint called with name: ${req.query.name}`);
  try {
    const { name, latitude, longitude } = req.query;

    // Validar parámetros requeridos
    if (!name || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Nombre, latitud y longitud son requeridos como parámetros de consulta.",
      });
    }

    // Convertir strings a números
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: "Latitud y longitud deben ser números válidos.",
      });
    }

    const result = await placeService.checkPlaceExistence(name, lat, lng);

    logger.info(`Check place endpoint completed successfully for name: ${name}`);
    res.status(200).json({
      success: true,
      exists: result.exists,
      ...(result.exists && { place: result.place }),
    });
  } catch (err) {
    logger.error(`Check place endpoint failed for name: ${req.query.name}, error: ${err.message}`);
    // Si el error tiene detalles (errores de validación)
    if (err.details) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.message,
        errors: err.details,
      });
    }
    next(err);
  }
};