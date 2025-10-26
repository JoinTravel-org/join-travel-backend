import reviewRepository from "../repository/review.repository.js";
import placeRepository from "../repository/place.repository.js";
import logger from "../config/logger.js";

class ReviewService {
  /**
   * Crea una nueva reseña
   * @param {Object} reviewData - Datos de la reseña
   * @param {number} reviewData.rating - Calificación (1-5)
   * @param {string} reviewData.content - Contenido de la reseña
   * @param {string} reviewData.placeId - ID del lugar
   * @param {string} reviewData.userId - ID del usuario
   * @returns {Promise<Object>} - Objeto con success, message y data
   */
  async createReview(reviewData) {
    const { rating, content, placeId, userId } = reviewData;

    // Validar rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
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
    const place = await placeRepository.findById(placeId);
    if (!place) {
      throw {
        status: 404,
        message: "El lugar especificado no existe.",
        details: ["placeId: lugar no encontrado"],
      };
    }

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

    try {
      // Crear la reseña
      const newReview = await reviewRepository.create({
        rating,
        content: content.trim(),
        placeId,
        userId,
      });

      logger.info(
        `Review created successfully: ${newReview.id} for place ${placeId} by user ${userId}`
      );

      return {
        success: true,
        message: "Reseña creada exitosamente",
        data: newReview,
      };
    } catch (error) {
      logger.error(`Error creating review: ${error.message}`);
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
      }));

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
}

export default new ReviewService();
