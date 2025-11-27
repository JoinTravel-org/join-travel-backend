import { AppDataSource } from "../load/typeorm.loader.js";
import UserRateLimit from "../models/userRateLimit.model.js";

class UserRateLimitRepository {
  constructor() {}

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    return AppDataSource.getRepository(UserRateLimit);
  }

  /**
   * Busca el registro de rate limit para un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<UserRateLimit|null>} - Registro encontrado o null
   */
  async findByUserId(userId) {
    return await this.getRepository().findOne({ where: { userId } });
  }

  /**
   * Crea o actualiza el registro de rate limit para un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} rateLimitData - Datos del rate limit
   * @returns {Promise<UserRateLimit>} - Registro creado/actualizado
   */
  async upsert(userId, rateLimitData) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      await this.getRepository().update(existing.id, {
        ...rateLimitData,
        updatedAt: new Date(),
      });
      return await this.findByUserId(userId);
    } else {
      const newRecord = this.getRepository().create({
        userId,
        ...rateLimitData,
      });
      return await this.getRepository().save(newRecord);
    }
  }

  /**
   * Actualiza el registro de rate limit para un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<UserRateLimit>} - Registro actualizado
   */
  async update(userId, updateData) {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      throw new Error(`Rate limit record not found for user ${userId}`);
    }
    await this.getRepository().update(existing.id, {
      ...updateData,
      updatedAt: new Date(),
    });
    return await this.findByUserId(userId);
  }

  /**
   * Elimina el registro de rate limit para un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} - True si se eliminó
   */
  async delete(userId) {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      return false;
    }
    const result = await this.getRepository().delete(existing.id);
    return result.affected > 0;
  }

  /**
   * Obtiene todos los usuarios bloqueados
   * @returns {Promise<UserRateLimit[]>} - Lista de usuarios bloqueados
   */
  async findBlockedUsers() {
    return await this.getRepository()
      .createQueryBuilder("rateLimit")
      .where("rateLimit.blockedUntil IS NOT NULL")
      .andWhere("rateLimit.blockedUntil > :now", { now: new Date() })
      .getMany();
  }

  /**
   * Resetea contadores expirados
   * @param {Date} now - Fecha actual
   * @returns {Promise<number>} - Número de registros actualizados
   */
  async resetExpiredLimits(now) {
    const result = await this.getRepository()
      .createQueryBuilder()
      .update(UserRateLimit)
      .set({
        minuteCount: 0,
        dailyCount: 0,
        blockedUntil: null,
        updatedAt: now,
      })
      .where("minuteWindowStart < :minuteThreshold", {
        minuteThreshold: new Date(now.getTime() - 60 * 1000),
      })
      .andWhere("dailyWindowStart < :dailyThreshold", {
        dailyThreshold: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      })
      .execute();

    return result.affected;
  }
}

export default new UserRateLimitRepository();