import { AppDataSource } from "../load/typeorm.loader.js";
import List from "../models/list.model.js";

class ListRepository {
  constructor() {
    this.repository = null;
  }

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    if (!this.repository) {
      this.repository = AppDataSource.getRepository(List);
    }
    return this.repository;
  }

  /**
   * Busca una lista por ID
   * @param {string} id - ID de la lista
   * @returns {Promise<List|null>} - Lista encontrada o null
   */
  async findById(id) {
    return await this.getRepository().findOne({
      where: { id },
      relations: ["user", "places"]
    });
  }

  /**
   * Busca listas por usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} - Listas del usuario
   */
  async findByUserId(userId) {
    return await this.getRepository().find({
      where: { userId },
      relations: ["places"],
      order: { createdAt: "DESC" }
    });
  }

  /**
   * Crea una nueva lista
   * @param {Object} listData - Datos de la lista
   * @returns {Promise<List>} - Lista creada
   */
  async create(listData) {
    const list = this.getRepository().create(listData);
    return await this.getRepository().save(list);
  }

  /**
   * Actualiza una lista
   * @param {string} id - ID de la lista
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<List>} - Lista actualizada
   */
  async update(id, updateData) {
    await this.getRepository().update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Elimina una lista
   * @param {string} id - ID de la lista
   * @returns {Promise<boolean>} - True si se eliminó, false si no
   */
  async delete(id) {
    const result = await this.getRepository().delete(id);
    return result.affected > 0;
  }

  /**
   * Agrega un lugar a una lista
   * @param {string} listId - ID de la lista
   * @param {string} placeId - ID del lugar
   * @returns {Promise<List>} - Lista actualizada
   */
  async addPlace(listId, placeId) {
    const list = await this.findById(listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Verificar si el lugar ya está en la lista
    const placeExists = list.places.some(place => place.id === placeId);
    if (placeExists) {
      throw new Error("Place already in list");
    }

    // Verificar límite de 20 lugares
    if (list.places.length >= 20) {
      throw new Error("List cannot have more than 20 places");
    }

    await this.getRepository()
      .createQueryBuilder()
      .relation(List, "places")
      .of(listId)
      .add(placeId);

    return await this.findById(listId);
  }

  /**
   * Remueve un lugar de una lista
   * @param {string} listId - ID de la lista
   * @param {string} placeId - ID del lugar
   * @returns {Promise<List>} - Lista actualizada
   */
  async removePlace(listId, placeId) {
    const list = await this.findById(listId);
    if (!list) {
      throw new Error("List not found");
    }

    await this.getRepository()
      .createQueryBuilder()
      .relation(List, "places")
      .of(listId)
      .remove(placeId);

    return await this.findById(listId);
  }

  /**
   * Verifica si un lugar está en una lista
   * @param {string} listId - ID de la lista
   * @param {string} placeId - ID del lugar
   * @returns {Promise<boolean>} - True si el lugar está en la lista
   */
  async hasPlace(listId, placeId) {
    const list = await this.findById(listId);
    if (!list) {
      return false;
    }
    return list.places.some(place => place.id === placeId);
  }
}

export default new ListRepository();