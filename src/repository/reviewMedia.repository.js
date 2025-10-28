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
}

export default new ReviewMediaRepository();