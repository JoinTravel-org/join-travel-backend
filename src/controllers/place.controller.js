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
    const { name, address, latitude, longitude, image } = req.body;

    // Validar que se envíen los campos requeridos
    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Nombre, dirección, latitud y longitud son requeridos.",
      });
    }

    const result = await placeService.addPlace({ name, address, latitude, longitude, image });

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
        image: result.place.image,
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

/**
 * Obtiene lugares paginados para el feed
 * GET /api/places?page=<page>&limit=<limit>
 */
export const getPlaces = async (req, res, next) => {
  logger.info(`Get places endpoint called with page: ${req.query.page}, limit: ${req.query.limit}`);
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await placeService.getPlacesForFeed(page, limit);

    logger.info(`Get places endpoint completed successfully, returned ${result.places.length} places out of ${result.totalCount} total`);
    res.status(200).json({
      places: result.places,
      totalCount: result.totalCount,
    });
  } catch (err) {
    logger.error(`Get places endpoint failed: ${err.message}`);
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
 * Obtiene un lugar por su ID
 * GET /api/places/:id
 */
export const getPlaceById = async (req, res, next) => {
  logger.info(`Get place by ID endpoint called with id: ${req.params.id}`);
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "El ID del lugar es requerido.",
      });
    }

    const place = await placeService.getPlaceById(id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Lugar no encontrado.",
      });
    }

    logger.info(`Get place by ID endpoint completed successfully for id: ${id}`);
    res.status(200).json({
      success: true,
      data: place
    });
  } catch (err) {
    logger.error(`Get place by ID endpoint failed for id: ${req.params.id}, error: ${err.message}`);
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


