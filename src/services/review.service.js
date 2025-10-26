import reviewRepository from "../repository/review.repository.js";
import reviewMediaRepository from "../repository/reviewMedia.repository.js";
import placeRepository from "../repository/place.repository.js";
import { validateUploadedFiles, getFileUrl, deleteFile } from "../utils/fileUpload.js";
import logger from "../config/logger.js";
import path from "path";
import { v4 as uuidv4 } from "uuid";

class ReviewService {
  /**
   * Crea una nueva reseña
   * @param {Object} reviewData - Datos de la reseña
   * @param {number} reviewData.rating - Calificación (1-5)
   * @param {string} reviewData.content - Contenido de la reseña
   * @param {string} reviewData.placeId - ID del lugar
   * @param {string} reviewData.userId - ID del usuario
   * @param {Array} reviewData.files - Archivos multimedia (opcional)
   * @returns {Promise<Object>} - Objeto con success, message y data
   */
  async createReview(reviewData) {
    const { rating, content, placeId, userId, files } = reviewData;
    let parsedRating = parseInt(rating);
    // Validar rating
    if (!parsedRating || parsedRating < 1 || parsedRating > 5 || !Number.isInteger(parsedRating)) {
      throw {
        status: 400,
        message: "La calificación debe ser un número entero entre 1 y 5.",
        details: ["rating: debe ser un entero entre 1 y 5"],
      };
    }

    // Validar contenido
    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      throw {
        status: 400,
        message: "El contenido de la reseña es requerido.",
        details: ["content: no puede estar vacío"],
      };
    }

    if (content.trim().length < 10) {
      throw {
        status: 400,
        message: "La reseña debe tener al menos 10 caracteres.",
        details: ["content: mínimo 10 caracteres"],
      };
    }

    if (content.trim().length > 1000) {
      throw {
        status: 400,
        message: "La reseña no puede exceder 1000 caracteres.",
        details: ["content: máximo 1000 caracteres"],
      };
    }

    // Verificar que el lugar existe
    logger.info(`Checking if place exists: ${placeId}`);
    const place = await placeRepository.findById(placeId);
    if (!place) {
      throw {
        status: 404,
        message: "El lugar especificado no existe.",
        details: ["placeId: lugar no encontrado"],
      };
    }
    logger.info(`Place found: ${place.id}`);

    // Verificar si el usuario ya reseñó este lugar
    const existingReview = await reviewRepository.findByPlaceIdAndUserId(
      placeId,
      userId
    );
    if (existingReview) {
      throw {
        status: 409,
        message: "Ya has reseñado este lugar.",
        details: ["review: ya existe una reseña del usuario para este lugar"],
      };
    }

    // Validar archivos multimedia si se proporcionaron
    if (files && files.length > 0) {
      const validation = validateUploadedFiles(files);
      if (!validation.isValid) {
        throw {
          status: 400,
          message: "Errores en los archivos multimedia.",
          details: validation.errors,
        };
      }
    }

    try {
      // Crear la reseña
      const newReview = await reviewRepository.create({
        rating: parsedRating,
        content: content.trim(),
        placeId,
        userId,
      });

      // Procesar archivos multimedia si existen
      let mediaRecords = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const mediaData = {
            reviewId: newReview.id,
            filename: file.filename || `${uuidv4()}${path.extname(file.originalname)}`,
            originalFilename: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            fileData: file.buffer, // Raw file bytes
          };

          const mediaRecord = await reviewMediaRepository.create(mediaData);
          mediaRecords.push({
            id: mediaRecord.id,
            filename: mediaRecord.filename,
            originalFilename: mediaRecord.originalFilename,
            fileSize: mediaRecord.fileSize,
            mimeType: mediaRecord.mimeType,
            url: getFileUrl(mediaRecord.filename),
            createdAt: mediaRecord.createdAt,
          });
        }
      }

      logger.info(
        `Review created successfully: ${newReview.id} for place ${placeId} by user ${userId} with ${mediaRecords.length} media files`
      );

      return {
        success: true,
        message: "Reseña creada exitosamente",
        data: {
          ...newReview,
          media: mediaRecords,
        },
      };
    } catch (error) {
      // No need to delete files since they're stored in memory/database now

      logger.error(`Error creating review: ${error.message}, stack: ${error.stack}`);
      throw {
        status: 500,
        message: "Error al guardar la reseña.",
        details: ["database: error interno del servidor"],
      };
    }
  }

  /**
   * Obtiene todas las reseñas de un lugar
   * @param {string} placeId - ID del lugar
   * @returns {Promise<Object>} - Objeto con success y data (array de reseñas)
   */
  async getReviewsByPlaceId(placeId) {
    try {
      // Verificar que el lugar existe
      const place = await placeRepository.findById(placeId);
      if (!place) {
        throw {
          status: 404,
          message: "El lugar especificado no existe.",
        };
      }

      const reviews = await reviewRepository.findByPlaceId(placeId);

      // Formatear las reseñas para incluir el email del usuario y media
      const formattedReviews = await Promise.all(
        reviews.map(async (review) => {
          // Obtener media de la reseña
          const media = await reviewMediaRepository.findByReviewId(review.id);
          const formattedMedia = media.map((m) => ({
            id: m.id,
            filename: m.filename,
            originalFilename: m.originalFilename,
            fileSize: m.fileSize,
            mimeType: m.mimeType,
            url: `/api/media/${m.id}`, // URL to serve file from database
            createdAt: m.createdAt,
          }));

          return {
            id: review.id,
            rating: review.rating,
            content: review.content,
            placeId: review.placeId,
            userId: review.userId,
            userEmail: review.user?.email || "Usuario anónimo",
            media: formattedMedia,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
          };
        })
      );

      logger.info(
        `Retrieved ${formattedReviews.length} reviews for place ${placeId}`
      );

      return {
        success: true,
        data: formattedReviews,
      };
    } catch (error) {
      if (error.status) {
        throw error;
      }

      logger.error(
        `Error retrieving reviews for place ${placeId}: ${error.message}`
      );
      throw {
        status: 500,
        message: "Error al obtener las reseñas.",
      };
    }
  }

  /**
   * Obtiene estadísticas de reseñas para un lugar
   * @param {string} placeId - ID del lugar
   * @returns {Promise<Object>} - Estadísticas de reseñas
   */
  async getReviewStats(placeId) {
    try {
      // Verificar que el lugar existe
      const place = await placeRepository.findById(placeId);
      if (!place) {
        throw {
          status: 404,
          message: "El lugar especificado no existe.",
        };
      }

      const stats = await reviewRepository.getReviewStats(placeId);

      logger.info(
        `Retrieved review stats for place ${placeId}: ${stats.totalReviews} reviews, ${stats.averageRating} avg rating`
      );

      return {
        success: true,
        data: {
          totalReviews: stats.totalReviews,
          averageRating: Math.round(stats.averageRating * 10) / 10, // Redondear a 1 decimal
        },
      };
    } catch (error) {
      if (error.status) {
        throw error;
      }

      logger.error(
        `Error retrieving review stats for place ${placeId}: ${error.message}`
      );
      throw {
        status: 500,
        message: "Error al obtener las estadísticas de reseñas.",
      };
    }
  }
}

export default new ReviewService();
