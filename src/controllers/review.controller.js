import reviewService from "../services/review.service.js";
import logger from "../config/logger.js";

/**
 * Crea una nueva reseña para un lugar
 * POST /api/places/:placeId/reviews
 * Body: { rating, content }
 * Headers: Authorization: Bearer <token>
 */
export const createReview = async (req, res, next) => {
  const { placeId } = req.params;
  const { rating, content } = req.body;
  const userId = req.user?.id;

  logger.info(
    `Create review endpoint called for place: ${placeId} by user: ${userId}`
  );

  try {
    // Verificar que el usuario esté autenticado
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Usuario no está autenticado.",
      });
    }

    // Validar que se envíen los campos requeridos
    if (!rating || !content) {
      return res.status(400).json({
        success: false,
        message: "Calificación y contenido son requeridos.",
        details: [
          ...(!rating ? ["rating: es requerido"] : []),
          ...(!content ? ["content: es requerido"] : []),
        ],
      });
    }

    const result = await reviewService.createReview({
      rating,
      content,
      placeId,
      userId,
    });

    logger.info(
      `Create review endpoint completed successfully for review: ${result.data.id}`
    );
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        id: result.data.id,
        rating: result.data.rating,
        content: result.data.content,
        placeId: result.data.placeId,
        userId: result.data.userId,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      },
    });
  } catch (err) {
    logger.error(
      `Create review endpoint failed for place: ${placeId}, user: ${userId}, error: ${err.message}`
    );

    // Si el error tiene detalles (errores de validación)
    if (err.details) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.message,
        details: err.details,
      });
    }

    // Si es un error conocido con status
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
};

/**
 * Obtiene todas las reseñas de un lugar específico
 * GET /api/places/:placeId/reviews
 */
export const getReviewsByPlace = async (req, res, next) => {
  const { placeId } = req.params;

  logger.info(`Get reviews endpoint called for place: ${placeId}`);

  try {
    const result = await reviewService.getReviewsByPlaceId(placeId);

    logger.info(
      `Get reviews endpoint completed successfully for place: ${placeId}, returned ${result.data.length} reviews`
    );
    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    logger.error(
      `Get reviews endpoint failed for place: ${placeId}, error: ${err.message}`
    );

    // Si es un error conocido con status
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
};

/**
 * Obtiene estadísticas de reseñas de un lugar
 * GET /api/places/:placeId/reviews/stats
 */
export const getReviewStats = async (req, res, next) => {
  const { placeId } = req.params;

  logger.info(`Get review stats endpoint called for place: ${placeId}`);

  try {
    const result = await reviewService.getReviewStats(placeId);

    logger.info(
      `Get review stats endpoint completed successfully for place: ${placeId}`
    );
    res.status(200).json(result.data);
  } catch (err) {
    logger.error(
      `Get review stats endpoint failed for place: ${placeId}, error: ${err.message}`
    );

    // Si es un error conocido con status
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
};

/**
 * Obtiene todas las reseñas con paginación
 * GET /api/reviews
 */
export const getAllReviews = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  logger.info(`Get all reviews endpoint called with page: ${page}, limit: ${limit}`);

  try {
    const result = await reviewService.getAllReviews(page, limit);

    logger.info(
      `Get all reviews endpoint completed successfully. Retrieved ${result.data.length} reviews`
    );

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    logger.error(`Get all reviews endpoint failed: ${err.message}`);

    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
        details: err.details
      });
    }

    next(err);
  }
};