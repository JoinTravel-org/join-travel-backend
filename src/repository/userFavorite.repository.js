import { AppDataSource } from "../load/typeorm.loader.js";
import UserFavorite from "../models/userFavorite.model.js";

class UserFavoriteRepository {
  constructor() {
    this.repository = null;
  }

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    if (!this.repository) {
      this.repository = AppDataSource.getRepository(UserFavorite);
    }
    return this.repository;
  }

  /**
   * Verifica si un lugar está en favoritos de un usuario
   * @param {string} userId - ID del usuario
   * @param {string} placeId - ID del lugar
   * @returns {Promise<boolean>} - True si está en favoritos
   */
  async isFavorite(userId, placeId) {
    const favorite = await this.getRepository().findOne({
      where: {
        userId,
        placeId,
      },
    });
    return !!favorite;
  }

  /**
   * Agrega un lugar a favoritos
   * @param {string} userId - ID del usuario
   * @param {string} placeId - ID del lugar
   * @returns {Promise<UserFavorite>} - Favorito creado
   */
  async addFavorite(userId, placeId) {
    const favorite = this.getRepository().create({
      userId,
      placeId,
    });
    return await this.getRepository().save(favorite);
  }

  /**
   * Remueve un lugar de favoritos
   * @param {string} userId - ID del usuario
   * @param {string} placeId - ID del lugar
   * @returns {Promise<boolean>} - True si se eliminó
   */
  async removeFavorite(userId, placeId) {
    const result = await this.getRepository().delete({
      userId,
      placeId,
    });
    return result.affected > 0;
  }

  /**
   * Toggle favorite status (add if not exists, remove if exists)
   * @param {string} userId - ID del usuario
   * @param {string} placeId - ID del lugar
   * @returns {Promise<{isFavorite: boolean, created: boolean}>} - Estado final y si se creó o eliminó
   */
  async toggleFavorite(userId, placeId) {
    const existing = await this.isFavorite(userId, placeId);

    if (existing) {
      await this.removeFavorite(userId, placeId);
      return { isFavorite: false, created: false };
    } else {
      await this.addFavorite(userId, placeId);
      return { isFavorite: true, created: true };
    }
  }

  /**
   * Obtiene todos los lugares favoritos de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} - Lista de lugares favoritos
   */
  async getUserFavorites(userId) {
    return await this.getRepository().find({
      where: { userId },
      relations: ['place'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene el conteo de favoritos de un lugar
   * @param {string} placeId - ID del lugar
   * @returns {Promise<number>} - Número de favoritos
   */
  async getFavoriteCount(placeId) {
    return await this.getRepository().count({
      where: { placeId },
    });
  }

  /**
   * Obtiene todos los lugares favoritos de un usuario con detalles completos
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} - Lista de lugares favoritos con detalles
   */
  async getUserFavoritesWithDetails(userId) {
    return await this.getRepository().find({
      where: { userId },
      relations: ['place'],
      order: { createdAt: 'DESC' },
    });
  }
}

export default new UserFavoriteRepository();