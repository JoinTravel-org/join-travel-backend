import { AppDataSource } from "../load/typeorm.loader.js";
import User from "../models/user.model.js";
import Fuse from "fuse.js";

class UserRepository {
  constructor() {
  }

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    return AppDataSource.getRepository(User);
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

  /**
   * Busca usuarios por email con búsqueda fuzzy (aproximada)
   * @param {string} email - Email a buscar
   * @param {number} limit - Límite de resultados (default: 20)
   * @returns {Promise<User[]>} - Lista de usuarios encontrados
   */
  async searchByEmail(email, limit = 20) {
    // Primero obtener todos los usuarios (limitado para performance)
    const allUsers = await this.getRepository()
      .createQueryBuilder("user")
      .select(["user.id", "user.email", "user.name", "user.age", "user.profilePicture", "user.isEmailConfirmed", "user.createdAt", "user.updatedAt"])
      .orderBy("user.email", "ASC")
      .limit(1000) // Limitar para evitar cargar demasiados usuarios
      .getMany();

    // Configurar Fuse.js para búsqueda fuzzy
    const fuse = new Fuse(allUsers, {
      keys: ['email'],
      threshold: 0.4, // Umbral de similitud (0.0 = exacto, 1.0 = muy permisivo)
      includeScore: true,
      shouldSort: true,
    });

    // Realizar búsqueda fuzzy
    const results = fuse.search(email);

    // Filtrar y limitar resultados
    const matchedUsers = results
      .filter(result => result.score < 0.6) // Solo resultados con buena similitud
      .slice(0, limit)
      .map(result => result.item);

    return matchedUsers;
  }

  /**
   * Alias para findById - Busca un usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Promise<User|null>} - Usuario encontrado o null
   */
  async findUserById(id) {
    return await this.findById(id);
  }

  /**
   * Alias para update - Actualiza un usuario
   * @param {string} id - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<User>} - Usuario actualizado
   */
  async updateUser(id, updateData) {
    return await this.update(id, updateData);
  }

  async findAtus() {
    return {
      "atus?": "yes, atus",
    };
  }
}

export default UserRepository;
