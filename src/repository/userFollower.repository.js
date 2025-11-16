import { AppDataSource } from "../load/typeorm.loader.js";
import UserFollower from "../models/userFollower.model.js";

class UserFollowerRepository {
  constructor() {}

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    return AppDataSource.getRepository(UserFollower);
  }

  /**
   * Sigue a un usuario
   * @param {string} followerId - ID del usuario que sigue
   * @param {string} followedId - ID del usuario seguido
   * @returns {Promise<UserFollower>} - Relación de seguimiento creada
   */
  async follow(followerId, followedId) {
    // Verificar que no se siga a sí mismo
    if (followerId === followedId) {
      throw new Error("No puedes seguirte a ti mismo");
    }

    // Verificar si ya existe la relación
    const existing = await this.getRepository().findOne({
      where: { followerId, followedId },
    });

    if (existing) {
      throw new Error("Ya sigues a este usuario");
    }

    const follow = this.getRepository().create({
      followerId,
      followedId,
    });

    return await this.getRepository().save(follow);
  }

  /**
   * Deja de seguir a un usuario
   * @param {string} followerId - ID del usuario que deja de seguir
   * @param {string} followedId - ID del usuario que se deja de seguir
   * @returns {Promise<boolean>} - true si se eliminó la relación
   */
  async unfollow(followerId, followedId) {
    const result = await this.getRepository().delete({
      followerId,
      followedId,
    });

    return result.affected > 0;
  }

  /**
   * Verifica si un usuario sigue a otro
   * @param {string} followerId - ID del usuario que podría estar siguiendo
   * @param {string} followedId - ID del usuario que podría estar siendo seguido
   * @returns {Promise<boolean>} - true si existe la relación
   */
  async isFollowing(followerId, followedId) {
    const count = await this.getRepository().count({
      where: { followerId, followedId },
    });

    return count > 0;
  }

  /**
   * Obtiene el número de seguidores de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<number>} - Número de seguidores
   */
  async getFollowersCount(userId) {
    return await this.getRepository().count({
      where: { followedId: userId },
    });
  }

  /**
   * Obtiene el número de usuarios que sigue un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<number>} - Número de usuarios seguidos
   */
  async getFollowingCount(userId) {
    return await this.getRepository().count({
      where: { followerId: userId },
    });
  }

  /**
   * Obtiene la lista de seguidores de un usuario
   * @param {string} userId - ID del usuario
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Promise<UserFollower[]>} - Lista de relaciones de seguimiento
   */
  async getFollowers(userId, limit = 20, offset = 0) {
    return await this.getRepository().find({
      where: { followedId: userId },
      relations: ["follower"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Obtiene la lista de usuarios seguidos por un usuario
   * @param {string} userId - ID del usuario
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Promise<UserFollower[]>} - Lista de relaciones de seguimiento
   */
  async getFollowing(userId, limit = 20, offset = 0) {
    return await this.getRepository().find({
      where: { followerId: userId },
      relations: ["followed"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Obtiene estadísticas de seguimiento de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<{followersCount: number, followingCount: number}>}
   */
  async getUserFollowStats(userId) {
    const [followersCount, followingCount] = await Promise.all([
      this.getFollowersCount(userId),
      this.getFollowingCount(userId),
    ]);

    return {
      followersCount,
      followingCount,
    };
  }
}

export default UserFollowerRepository;
