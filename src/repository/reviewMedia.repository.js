import { AppDataSource } from "../load/typeorm.loader.js";
import ReviewMedia from "../models/reviewMedia.model.js";

class ReviewMediaRepository {
  constructor() {
    this.repository = null;
  }

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    if (!this.repository) {
      this.repository = AppDataSource.getRepository(ReviewMedia);
    }
    return this.repository;
  }

  /**
   * Crea un nuevo registro de media para una reseña
   * @param {Object} mediaData - Datos del media { reviewId, filename, originalFilename, filePath, fileSize, mimeType }
   * @returns {Promise<ReviewMedia>} - Media creado
   */
  async create(mediaData) {
    const media = this.getRepository().create(mediaData);
    return await this.getRepository().save(media);
  }

  /**
   * Busca todos los media de una reseña específica
   * @param {string} reviewId - ID de la reseña
   * @returns {Promise<ReviewMedia[]>} - Lista de media
   */
  async findByReviewId(reviewId) {
    return await this.getRepository()
      .createQueryBuilder("media")
      .where("media.reviewId = :reviewId", { reviewId })
      .orderBy("media.createdAt", "ASC")
      .getMany();
  }

  /**
   * Busca un registro de media por ID
   * @param {string} id - ID del media
   * @returns {Promise<ReviewMedia|null>} - Media encontrado o null
   */
  async findById(id) {
    return await this.getRepository().findOne({ where: { id } });
  }

  /**
   * Elimina un registro de media por ID
   * @param {string} id - ID del media
   * @returns {Promise<boolean>} - True si se eliminó, false si no existía
   */
  async deleteById(id) {
    const result = await this.getRepository().delete(id);
    return result.affected > 0;
  }

  /**
   * Elimina todos los media de una reseña
   * @param {string} reviewId - ID de la reseña
   * @returns {Promise<number>} - Número de registros eliminados
   */
  async deleteByReviewId(reviewId) {
    const result = await this.getRepository().delete({ reviewId });
    return result.affected;
  }

  /**
   * Obtiene todos los media públicos de un usuario (de sus reseñas publicadas)
   * @param {string} userId - ID del usuario
   * @param {number} limit - Número máximo de resultados (default: 20)
   * @returns {Promise<ReviewMedia[]>} - Lista de media ordenada por createdAt DESC
   */
  async getUserMedia(userId, limit = 20) {
    return await this.getRepository()
      .createQueryBuilder("media")
      .innerJoin("media.review", "review")
      .where("review.userId = :userId", { userId })
      // Nota: Asumiendo que todas las reseñas son públicas por ahora
      // Si se implementa moderación, agregar: .andWhere("review.isPublished = :isPublished", { isPublished: true })
      .orderBy("media.createdAt", "DESC")
      .limit(limit)
      .getMany();
  }
}

export default new ReviewMediaRepository();