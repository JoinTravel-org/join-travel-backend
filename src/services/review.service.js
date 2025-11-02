import reviewRepository from "../repository/review.repository.js";
import reviewMediaRepository from "../repository/reviewMedia.repository.js";
import reviewLikeRepository from "../repository/reviewLike.repository.js";
import placeRepository from "../repository/place.repository.js";
import { validateUploadedFiles, getFileUrl, deleteFile } from "../utils/fileUpload.js";
import gamificationService from "./gamification.service.js";
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
      logger.info(`Starting review creation process for user ${userId}, place ${placeId}`);

      // Crear la reseña
      logger.info(`Creating review record in database...`);
      const newReview = await reviewRepository.create({
        rating: parsedRating,
        content: content.trim(),
        placeId,
        userId,
      });
      logger.info(`Review record created with ID: ${newReview.id}`);

      // Procesar archivos multimedia si existen
      let mediaRecords = [];
      if (files && files.length > 0) {
        logger.info(`Processing ${files.length} media files...`);
        for (const file of files) {
          logger.info(`Processing media file: ${file.originalname}`);
          const mediaData = {
            reviewId: newReview.id,
            filename: file.filename || `${uuidv4()}${path.extname(file.originalname)}`,
            originalFilename: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            fileData: file.buffer, // Raw file bytes
          };

          const mediaRecord = await reviewMediaRepository.create(mediaData);
          logger.info(`Media record created with ID: ${mediaRecord.id}`);
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
        logger.info(`All ${mediaRecords.length} media files processed successfully`);
      }

      logger.info(
        `Review created successfully: ${newReview.id} for place ${placeId} by user ${userId} with ${mediaRecords.length} media files`
      );

      // Award points for creating a review (without transaction since we're already in one)
      try {
        await gamificationService.awardPoints(userId, 'review_created', { review_id: newReview.id }, false);
      } catch (gamificationError) {
        logger.error(`Failed to award points for review creation: ${gamificationError.message}`);
        // Don't fail the review creation if gamification fails
      }

      // Check for media upload badge if files were uploaded
      if (files && files.length > 0) {
        try {
          await gamificationService.awardPoints(userId, 'media_upload', { review_id: newReview.id }, false);
        } catch (gamificationError) {
          logger.error(`Failed to award points for media upload: ${gamificationError.message}`);
          // Don't fail the review creation if gamification fails
        }
      }

      logger.info(`Review creation process completed successfully`);
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

      logger.error(`Error creating review: ${error.message}`);
      logger.error(`Error stack: ${error.stack}`);
      logger.error(`Error details:`, error);

      // Log specific database error details if available
      if (error.code) {
        logger.error(`Database error code: ${error.code}`);
      }
      if (error.detail) {
        logger.error(`Database error detail: ${error.detail}`);
      }
      if (error.constraint) {
        logger.error(`Database constraint violation: ${error.constraint}`);
      }

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

      // Formatear las reseñas para incluir el email del usuario, media y likes
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

          // Obtener conteo de likes
          const likeCount = await reviewLikeRepository.countByReviewId(review.id);

          return {
            id: review.id,
            rating: review.rating,
            content: review.content,
            placeId: review.placeId,
            userId: review.userId,
            userEmail: review.user?.email || "Usuario anónimo",
            media: formattedMedia,
            likeCount,
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
  /**
   * Obtiene todas las reseñas con paginación
   * @param {number} page - Número de página (1-based, default: 1)
   * @param {number} limit - Número de reseñas por página (default: 20)
   * @returns {Promise<Object>} - Objeto con success, data (array de reseñas) y metadata de paginación
   */
  async getAllReviews(page = 1, limit = 20) {
    try {
      // Validar parámetros de paginación
      page = Math.max(1, parseInt(page));
      limit = Math.min(100, Math.max(1, parseInt(limit)));

      const offset = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        reviewRepository.findAll(offset, limit),
        reviewRepository.count(),
      ]);

      // Formatear las reseñas para incluir el email del usuario
      const formattedReviews = reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        content: review.content,
        placeId: review.placeId,
        userId: review.userId,
        userEmail: review.user?.email || "Usuario anónimo",
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        placeName: review.place?.name || "Lugar desconocido",
      }));

      logger.info(
        `Retrieved ${formattedReviews.length} reviews (page ${page}, limit ${limit})`
      );

      return {
        success: true,
        data: formattedReviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error retrieving all reviews: ${error.message}`);
      throw {
        status: 500,
        message: "Error al obtener las reseñas.",
        details: error.message,
      };
    }
  }

  /**
   * Toggle like on a review
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Like status and count
   */
  async toggleLike(reviewId, userId) {
    try {
      // Check if review exists
      const review = await reviewRepository.findById(reviewId);
      if (!review) {
        throw {
          status: 404,
          message: "Reseña no encontrada.",
        };
      }

      // Check if user is trying to like their own review
      if (review.userId === userId) {
        throw {
          status: 400,
          message: "No puedes dar like a tu propia reseña.",
        };
      }

      // Check if user already liked this review
      const existingLike = await reviewLikeRepository.findByReviewIdAndUserId(reviewId, userId);

      let liked = false;
      let likeCount = 0;

      if (existingLike) {
        // Unlike: remove the like
        await reviewLikeRepository.deleteByReviewIdAndUserId(reviewId, userId);
        liked = false;
        logger.info(`User ${userId} unliked review ${reviewId}`);
      } else {
        // Like: add the like
        await reviewLikeRepository.create({
          reviewId,
          userId,
        });
        liked = true;
        logger.info(`User ${userId} liked review ${reviewId}`);

        // Award points to the review author for receiving a like
        try {
          await gamificationService.awardPoints(review.userId, 'vote_received', { review_id: reviewId }, false);
        } catch (gamificationError) {
          logger.error(`Failed to award points for like: ${gamificationError.message}`);
          // Don't fail the like if gamification fails
        }
      }

      // Get updated like count
      likeCount = await reviewLikeRepository.countByReviewId(reviewId);

      return {
        success: true,
        data: {
          liked,
          likeCount,
          reviewId,
        },
      };
    } catch (error) {
      if (error.status) {
        throw error;
      }

      logger.error(`Error toggling like for review ${reviewId}: ${error.message}`);
      throw {
        status: 500,
        message: "Error al procesar el like.",
      };
    }
  }

  /**
   * Get like status for a review
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} - Like status and count
   */
  async getLikeStatus(reviewId, userId = null) {
    try {
      // Check if review exists
      const review = await reviewRepository.findById(reviewId);
      if (!review) {
        throw {
          status: 404,
          message: "Reseña no encontrada.",
        };
      }

      const likeCount = await reviewLikeRepository.countByReviewId(reviewId);
      let liked = false;

      if (userId) {
        liked = await reviewLikeRepository.hasUserLiked(reviewId, userId);
      }

      return {
        success: true,
        data: {
          liked,
          likeCount,
          reviewId,
        },
      };
    } catch (error) {
      if (error.status) {
        throw error;
      }

      logger.error(`Error getting like status for review ${reviewId}: ${error.message}`);
      throw {
        status: 500,
        message: "Error al obtener el estado del like.",
      };
    }
  }
}

export default new ReviewService();
