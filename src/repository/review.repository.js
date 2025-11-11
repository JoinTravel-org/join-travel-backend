import { AppDataSource } from "../load/typeorm.loader.js";
import Review from "../models/review.model.js";

class ReviewRepository {
  constructor() {
    this.repository = null;
  }

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    if (!this.repository) {
      this.repository = AppDataSource.getRepository(Review);
    }
    return this.repository;
  }

  /**
   * Crea una nueva reseña
   * @param {Object} reviewData - Datos de la reseña { rating, content, placeId, userId }
   * @returns {Promise<Review>} - Reseña creada
   */
  async create(reviewData) {
    const review = this.getRepository().create(reviewData);
    return await this.getRepository().save(review);
  }

  /**
   * Busca todas las reseñas de un lugar específico
   * @param {string} placeId - ID del lugar
   * @returns {Promise<Review[]>} - Lista de reseñas
   */
  async findByPlaceId(placeId) {
    return await this.getRepository()
      .createQueryBuilder("review")
      .leftJoinAndSelect("review.user", "user")
      .where("review.placeId = :placeId", { placeId })
      .orderBy("review.createdAt", "DESC")
      .select([
        "review.id",
        "review.rating",
        "review.content",
        "review.placeId",
        "review.userId",
        "review.createdAt",
        "review.updatedAt",
        "user.email", // Solo incluimos el email del usuario
      ])
      .getMany();
  }

  /**
   * Obtiene estadísticas de reseñas para un lugar
   * @param {string} placeId - ID del lugar
   * @returns {Promise<Object>} - Objeto con totalReviews y averageRating
   */
  async getReviewStats(placeId) {
    const result = await this.getRepository()
      .createQueryBuilder("review")
      .where("review.placeId = :placeId", { placeId })
      .select("COUNT(*)", "totalReviews")
      .addSelect("COALESCE(AVG(review.rating), 0)", "averageRating")
      .getRawOne();

    return {
      totalReviews: parseInt(result.totalReviews, 10),
      averageRating: parseFloat(result.averageRating),
    };
  }

  /**
   * Busca una reseña por ID
   * @param {string} id - ID de la reseña
   * @returns {Promise<Review|null>} - Reseña encontrada o null
   */
  async findById(id) {
    return await this.getRepository().findOne({ where: { id } });
  }

  /**
   * Verifica si un usuario ya reseñó un lugar específico
   * @param {string} placeId - ID del lugar
   * @param {string} userId - ID del usuario
   * @returns {Promise<Review|null>} - Reseña existente o null
   */
  async findByPlaceIdAndUserId(placeId, userId) {
    return await this.getRepository().findOne({
      where: {
        placeId,
        userId,
      },
    });
  }

  /**
   * Encuentra todas las reseñas con paginación
   * @param {number} offset - Número de reseñas a saltar
   * @param {number} limit - Número de reseñas a retornar
   * @returns {Promise<Review[]>} Array de reseñas
   */
  async findAll(offset = 0, limit = 20) {
    return await this.getRepository()
      .createQueryBuilder("review")
      .leftJoinAndSelect("review.user", "user")
      .leftJoinAndSelect("review.place", "place") // Add join with place
      .select([
        "review.id",
        "review.rating",
        "review.content",
        "review.placeId",
        "review.userId",
        "review.createdAt",
        "review.updatedAt",
        "user.email",
        "place.id",
        "place.name",
        "place.image",
        "place.city",
      ])
      .orderBy("review.createdAt", "DESC")
      .skip(offset)
      .take(limit)
      .getMany();
  }

  /**
   * Cuenta el total de reseñas
   * @returns {Promise<number>} Total de reseñas
   */
  async count() {
    return await this.getRepository().count();
  }

  /**
   * Obtiene todas las reseñas de un usuario específico
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} - Lista de reseñas con detalles
   */
  async getUserReviews(userId) {
    return await this.getRepository()
      .createQueryBuilder("review")
      .leftJoin("review.place", "place")
      .leftJoin("review.user", "user")
      .leftJoin("review.reviewMedia", "media")
      .leftJoin("review.reviewLikes", "likes")
      .where("review.userId = :userId", { userId })
      .select([
        "review.id",
        "review.rating",
        "review.content",
        "review.placeId",
        "review.userId",
        "review.createdAt",
        "review.updatedAt",
        "user.email",
        "place.name",
      ])
      .addSelect("COUNT(DISTINCT media.id)", "mediaCount")
      .addSelect("COUNT(CASE WHEN likes.type = 'like' THEN 1 END)", "likeCount")
      .addSelect("COUNT(CASE WHEN likes.type = 'dislike' THEN 1 END)", "dislikeCount")
      .groupBy("review.id")
      .addGroupBy("review.rating")
      .addGroupBy("review.content")
      .addGroupBy("review.placeId")
      .addGroupBy("review.userId")
      .addGroupBy("review.createdAt")
      .addGroupBy("review.updatedAt")
      .addGroupBy("user.email")
      .addGroupBy("place.name")
      .orderBy("review.createdAt", "DESC")
      .getRawMany();
  }

  /**
   * Obtiene estadísticas de reseñas para un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Objeto con totalReviews y averageRating
   */
  async getUserReviewStats(userId) {
    const result = await this.getRepository()
      .createQueryBuilder("review")
      .where("review.userId = :userId", { userId })
      .select("COUNT(*)", "totalReviews")
      .addSelect("COALESCE(AVG(review.rating), 0)", "averageRating")
      .getRawOne();

    return {
      totalReviews: parseInt(result.totalReviews, 10),
      averageRating: Math.round(parseFloat(result.averageRating) * 10) / 10, // Round to 1 decimal
    };
  }
}

export default new ReviewRepository();
