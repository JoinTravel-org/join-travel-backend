import { AppDataSource } from "../load/typeorm.loader.js";

class GroupMessageRepository {
  constructor() {
    this.repository = AppDataSource.getRepository("GroupMessage");
  }

  /**
   * Crea un nuevo mensaje grupal
   * @param {Object} messageData - { groupId, senderId, content }
   * @returns {Promise<Object>} Mensaje creado con información del remitente
   */
  async create(messageData) {
    const message = this.repository.create(messageData);
    const savedMessage = await this.repository.save(message);
    
    // Cargar relaciones
    return await this.repository.findOne({
      where: { id: savedMessage.id },
      relations: ["sender", "group"],
    });
  }

  /**
   * Obtiene todos los mensajes de un grupo
   * @param {string} groupId - ID del grupo
   * @param {number} limit - Número de mensajes a obtener
   * @param {number} offset - Offset para paginación
   * @returns {Promise<Array>} Lista de mensajes
   */
  async findByGroupId(groupId, limit = 50, offset = 0) {
    return await this.repository.find({
      where: { groupId },
      relations: ["sender"],
      order: { createdAt: "ASC" },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Cuenta los mensajes de un grupo
   * @param {string} groupId - ID del grupo
   * @returns {Promise<number>} Cantidad de mensajes
   */
  async countByGroupId(groupId) {
    return await this.repository.count({
      where: { groupId },
    });
  }

  /**
   * Elimina todos los mensajes de un grupo
   * @param {string} groupId - ID del grupo
   * @returns {Promise<void>}
   */
  async deleteByGroupId(groupId) {
    await this.repository.delete({ groupId });
  }

  /**
   * Obtiene el último mensaje de un grupo
   * @param {string} groupId - ID del grupo
   * @returns {Promise<Object|null>} Último mensaje o null
   */
  async findLastByGroupId(groupId) {
    return await this.repository.findOne({
      where: { groupId },
      relations: ["sender"],
      order: { createdAt: "DESC" },
    });
  }
}

export default new GroupMessageRepository();
