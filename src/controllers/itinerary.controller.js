import itineraryService from "../services/itinerary.service.js";
import logger from "../config/logger.js";

/**
 * Creates a new itinerary
 * POST /api/itineraries
 * Body: { name, items: [{ placeId, date }] }
 */
export const createItinerary = async (req, res, next) => {
  logger.info(`Create itinerary endpoint called for user: ${req.user.id}`);
  try {
    const { name, items } = req.body;

    // Validate required fields
    if (!name || !items) {
      return res.status(400).json({
        success: false,
        message: "Nombre del itinerario e items son requeridos.",
      });
    }

    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El nombre del itinerario es requerido.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El itinerario debe tener al menos un lugar.",
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.placeId || !item.date) {
        return res.status(400).json({
          success: false,
          message: "Cada lugar debe tener un ID de lugar y una fecha.",
        });
      }
    }

    const itineraryData = {
      name: name.trim(),
      userId: req.user.id,
      items,
    };

    const result = await itineraryService.createItinerary(itineraryData);

    logger.info(`Create itinerary endpoint completed successfully for user: ${req.user.id}`);
    res.status(201).json(result);
  } catch (err) {
    logger.error(`Create itinerary endpoint failed for user: ${req.user.id}, error: ${err.message}`);
    
    if (err.status && err.message) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    
    next(err);
  }
};

/**
 * Gets an itinerary by ID
 * GET /api/itineraries/:id
 */
export const getItineraryById = async (req, res, next) => {
  logger.info(`Get itinerary by ID endpoint called: ${req.params.id} for user: ${req.user.id}`);
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID del itinerario es requerido.",
      });
    }

    const result = await itineraryService.getItineraryById(id, req.user.id);

    logger.info(`Get itinerary by ID endpoint completed successfully: ${id}`);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Get itinerary by ID endpoint failed: ${req.params.id}, error: ${err.message}`);
    
    if (err.status && err.message) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    
    next(err);
  }
};

/**
 * Gets all itineraries for the authenticated user
 * GET /api/itineraries
 */
export const getUserItineraries = async (req, res, next) => {
  logger.info(`Get user itineraries endpoint called for user: ${req.user.id}`);
  try {
    const result = await itineraryService.getUserItineraries(req.user.id);

    logger.info(`Get user itineraries endpoint completed successfully for user: ${req.user.id}`);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Get user itineraries endpoint failed for user: ${req.user.id}, error: ${err.message}`);
    
    if (err.status && err.message) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    
    next(err);
  }
};

/**
 * Updates an itinerary
 * PUT /api/itineraries/:id
 * Body: { name?, items?: [{ placeId, date }] }
 */
export const updateItinerary = async (req, res, next) => {
  logger.info(`Update itinerary endpoint called: ${req.params.id} for user: ${req.user.id}`);
  try {
    const { id } = req.params;
    const { name, items } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID del itinerario es requerido.",
      });
    }

    // Validate that at least one field is being updated
    if (!name && !items) {
      return res.status(400).json({
        success: false,
        message: "Al menos un campo debe ser actualizado (nombre o items).",
      });
    }

    // Validate name if provided
    if (name && (typeof name !== "string" || name.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "El nombre del itinerario no puede estar vacío.",
      });
    }

    // Validate items if provided
    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "El itinerario debe tener al menos un lugar.",
        });
      }

      for (const item of items) {
        if (!item.placeId || !item.date) {
          return res.status(400).json({
            success: false,
            message: "Cada lugar debe tener un ID de lugar y una fecha.",
          });
        }
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (items) updateData.items = items;

    const result = await itineraryService.updateItinerary(id, updateData, req.user.id);

    logger.info(`Update itinerary endpoint completed successfully: ${id}`);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Update itinerary endpoint failed: ${req.params.id}, error: ${err.message}`);
    
    if (err.status && err.message) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    
    next(err);
  }
};

/**
 * Deletes an itinerary
 * DELETE /api/itineraries/:id
 */
export const deleteItinerary = async (req, res, next) => {
  logger.info(`Delete itinerary endpoint called: ${req.params.id} for user: ${req.user.id}`);
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID del itinerario es requerido.",
      });
    }

    const result = await itineraryService.deleteItinerary(id, req.user.id);

    logger.info(`Delete itinerary endpoint completed successfully: ${id}`);
    res.status(200).json(result);
  } catch (err) {
    logger.error(`Delete itinerary endpoint failed: ${req.params.id}, error: ${err.message}`);
    
    if (err.status && err.message) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    
    next(err);
  }
};
