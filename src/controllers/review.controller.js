import reviewService from "../services/review.service.js";
import { uploadReviewMedia } from "../utils/fileUpload.js";
import logger from "../config/logger.js";

/**
 * Crea una nueva reseña para un lugar
 * POST /api/places/:placeId/reviews
 * Content-Type: multipart/form-data
 * Body: rating, content, media[] (files)
 * Headers: Authorization: Bearer <token>
 */
export const createReview = [
  uploadReviewMedia.any(), // Accept any fields for debugging
  (req, res, next) => {
    logger.info(`Multer middleware completed for place: ${req.params.placeId}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    logger.info(`All files received: ${JSON.stringify(req.files?.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, size: f.size, mimetype: f.mimetype })))}`);

    // Group files by fieldname for processing
    const mediaFiles = req.files?.filter(f => f.fieldname.startsWith('media')) || [];
    req.files = mediaFiles; // Set req.files to just the media files

    logger.info(`Processed media files: ${mediaFiles.length}`);
    next();
  },
  async (req, res, next) => {
    const { placeId } = req.params;
    const { rating, content } = req.body;
    const userId = req.user?.id;
    const files = req.files || [];

    logger.info(
      `Create review endpoint called for place: ${placeId} by user: ${userId} with ${files.length} media files`
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
        files,
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
            media: result.data.media,
            createdAt: result.data.createdAt,
            updatedAt: result.data.updatedAt,
          },
        });
    } catch (err) {
       logger.error(
         `Create review endpoint failed for place: ${placeId}, user: ${userId}, error: ${err.message}, stack: ${err.stack}`
       );

       // Log multer-specific errors
       if (err.code === 'LIMIT_UNEXPECTED_FILE') {
         logger.error(`Multer unexpected field error. Field: ${err.field}, received: ${Object.keys(req.body || {})}`);
       }

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
  }
];

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
