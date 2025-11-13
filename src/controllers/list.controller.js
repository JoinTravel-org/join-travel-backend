import listService from "../services/list.service.js";
import logger from "../config/logger.js";

/**
 * Crea una nueva lista
 * POST /api/lists
 * Body: { title, description? }
 */
export const createList = async (req, res, next) => {
  logger.info(`Create list endpoint called by user: ${req.user.id}`);
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    // Validar campos requeridos
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "El título es requerido.",
      });
    }

    const result = await listService.createList({ title, description, userId });

    logger.info(`Create list endpoint completed successfully for list: ${result.list.id}`);
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        id: result.list.id,
        title: result.list.title,
        description: result.list.description,
        userId: result.list.userId,
        createdAt: result.list.createdAt,
        updatedAt: result.list.updatedAt,
      },
    });
  } catch (err) {
    logger.error(`Create list endpoint failed for user: ${req.user.id}, error: ${err.message}`);
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
 * Obtiene todas las listas del usuario autenticado
 * GET /api/lists
 */
export const getUserLists = async (req, res, next) => {
  logger.info(`Get user lists endpoint called by user: ${req.user.id}`);
  try {
    const userId = req.user.id;

    const lists = await listService.getUserLists(userId);

    logger.info(`Get user lists endpoint completed successfully, returned ${lists.length} lists`);
    res.status(200).json({
      success: true,
      data: lists.map(list => ({
        id: list.id,
        title: list.title,
        description: list.description,
        userId: list.userId,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        places: list.places.map(place => ({
          id: place.id,
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          image: place.image,
          rating: place.rating,
          description: place.description,
          city: place.city,
        })),
      })),
    });
  } catch (err) {
    logger.error(`Get user lists endpoint failed for user: ${req.user.id}, error: ${err.message}`);
    next(err);
  }
};

/**
 * Obtiene una lista específica por ID
 * GET /api/lists/:id
 */
export const getListById = async (req, res, next) => {
  logger.info(`Get list by ID endpoint called with id: ${req.params.id}, user: ${req.user.id}`);
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "El ID de la lista es requerido.",
      });
    }

    const list = await listService.getListById(id, userId);

    logger.info(`Get list by ID endpoint completed successfully for id: ${id}`);
    res.status(200).json({
      success: true,
      data: {
        id: list.id,
        title: list.title,
        description: list.description,
        userId: list.userId,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        places: list.places.map(place => ({
          id: place.id,
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          image: place.image,
          rating: place.rating,
          description: place.description,
          city: place.city,
        })),
      },
    });
  } catch (err) {
    logger.error(`Get list by ID endpoint failed for id: ${req.params.id}, user: ${req.user.id}, error: ${err.message}`);
    if (err.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Lista no encontrada.",
      });
    }
    if (err.status === 403) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado.",
      });
    }
    next(err);
  }
};

/**
 * Actualiza una lista
 * PUT /api/lists/:id
 * Body: { title?, description? }
 */
export const updateList = async (req, res, next) => {
  logger.info(`Update list endpoint called with id: ${req.params.id}, user: ${req.user.id}`);
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "El ID de la lista es requerido.",
      });
    }

    const result = await listService.updateList(id, { title, description }, userId);

    logger.info(`Update list endpoint completed successfully for id: ${id}`);
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        id: result.list.id,
        title: result.list.title,
        description: result.list.description,
        userId: result.list.userId,
        updatedAt: result.list.updatedAt,
      },
    });
  } catch (err) {
    logger.error(`Update list endpoint failed for id: ${req.params.id}, user: ${req.user.id}, error: ${err.message}`);
    if (err.details) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.message,
        errors: err.details,
      });
    }
    if (err.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Lista no encontrada.",
      });
    }
    if (err.status === 403) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado.",
      });
    }
    next(err);
  }
};

/**
 * Elimina una lista
 * DELETE /api/lists/:id
 */
export const deleteList = async (req, res, next) => {
  logger.info(`Delete list endpoint called with id: ${req.params.id}, user: ${req.user.id}`);
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "El ID de la lista es requerido.",
      });
    }

    const result = await listService.deleteList(id, userId);

    logger.info(`Delete list endpoint completed successfully for id: ${id}`);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    logger.error(`Delete list endpoint failed for id: ${req.params.id}, user: ${req.user.id}, error: ${err.message}`);
    if (err.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Lista no encontrada.",
      });
    }
    if (err.status === 403) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado.",
      });
    }
    next(err);
  }
};

/**
 * Agrega un lugar a una lista
 * POST /api/lists/:listId/places/:placeId
 */
export const addPlaceToList = async (req, res, next) => {
  logger.info(`Add place to list endpoint called with listId: ${req.params.listId}, placeId: ${req.params.placeId}, user: ${req.user.id}`);
  try {
    const { listId, placeId } = req.params;
    const userId = req.user.id;

    if (!listId || !placeId) {
      return res.status(400).json({
        success: false,
        message: "Los IDs de lista y lugar son requeridos.",
      });
    }

    const result = await listService.addPlaceToList(listId, placeId, userId);

    logger.info(`Add place to list endpoint completed successfully for list: ${listId}, place: ${placeId}`);
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        id: result.list.id,
        title: result.list.title,
        places: result.list.places.map(place => ({
          id: place.id,
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          image: place.image,
          rating: place.rating,
          description: place.description,
          city: place.city,
        })),
      },
    });
  } catch (err) {
    logger.error(`Add place to list endpoint failed for list: ${req.params.listId}, place: ${req.params.placeId}, user: ${req.user.id}, error: ${err.message}`);
    if (err.message === "Place already in list") {
      return res.status(409).json({
        success: false,
        message: "El lugar ya está en la lista.",
      });
    }
    if (err.message === "List cannot have more than 20 places") {
      return res.status(400).json({
        success: false,
        message: "Límite alcanzado.",
      });
    }
    if (err.status === 404) {
      return res.status(404).json({
        success: false,
        message: err.message === "Place not found" ? "Lugar no encontrado." : "Lista no encontrada.",
      });
    }
    if (err.status === 403) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado.",
      });
    }
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
 * Remueve un lugar de una lista
 * DELETE /api/lists/:listId/places/:placeId
 */
export const removePlaceFromList = async (req, res, next) => {
  logger.info(`Remove place from list endpoint called with listId: ${req.params.listId}, placeId: ${req.params.placeId}, user: ${req.user.id}`);
  try {
    const { listId, placeId } = req.params;
    const userId = req.user.id;

    if (!listId || !placeId) {
      return res.status(400).json({
        success: false,
        message: "Los IDs de lista y lugar son requeridos.",
      });
    }

    const result = await listService.removePlaceFromList(listId, placeId, userId);

    logger.info(`Remove place from list endpoint completed successfully for list: ${listId}, place: ${placeId}`);
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        id: result.list.id,
        title: result.list.title,
        places: result.list.places.map(place => ({
          id: place.id,
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          image: place.image,
          rating: place.rating,
          description: place.description,
          city: place.city,
        })),
      },
    });
  } catch (err) {
    logger.error(`Remove place from list endpoint failed for list: ${req.params.listId}, place: ${req.params.placeId}, user: ${req.user.id}, error: ${err.message}`);
    if (err.status === 404) {
      return res.status(404).json({
        success: false,
        message: err.message === "Place not found" ? "Lugar no encontrado." : "Lista no encontrada.",
      });
    }
    if (err.status === 403) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado.",
      });
    }
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