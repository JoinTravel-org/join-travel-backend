import { AppDataSource } from "../load/typeorm.loader.js";
import User from "../models/user.model.js";

class UserRepository {
  constructor() {
    this.repository = null;
  }

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    if (!this.repository) {
      this.repository = AppDataSource.getRepository(User);
    }
    return this.repository;
  }

  /**
   * Busca un usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<User|null>} - Usuario encontrado o null
   */
  async findByEmail(email) {
    return await this.getRepository().findOne({ where: { email } });
  }

  /**
   * Busca un usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Promise<User|null>} - Usuario encontrado o null
   */
  async findById(id) {
    return await this.getRepository().findOne({ where: { id } });
  }

  /**
   * Busca un usuario por token de confirmación
   * @param {string} token - Token de confirmación
   * @returns {Promise<User|null>} - Usuario encontrado o null
   */
  async findByConfirmationToken(token) {
    return await this.getRepository().findOne({
      where: { emailConfirmationToken: token },
    });
  }

  /**
   * Crea un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<User>} - Usuario creado
   */
  async create(userData) {
    const user = this.getRepository().create(userData);
    return await this.getRepository().save(user);
  }

  /**
   * Actualiza un usuario
   * @param {string} id - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<User>} - Usuario actualizado
   */
  async update(id, updateData) {
    await this.getRepository().update(id, updateData);
    return await this.findById(id);
  }

  async findAtus() {
    return {
      "atus?": "yes, atus",
    };
  }
}

export default new UserRepository();
