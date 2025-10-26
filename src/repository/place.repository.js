import { AppDataSource } from "../load/typeorm.loader.js";
import Place from "../models/place.model.js";

class PlaceRepository {
  constructor() {
    this.repository = null;
  }

  // Inicializa el repositorio cuando TypeORM esté listo
  getRepository() {
    if (!this.repository) {
      this.repository = AppDataSource.getRepository(Place);
    }
    return this.repository;
  }

  /**
   * Busca un lugar por nombre y coordenadas exactas
   * @param {string} name - Nombre del lugar
   * @param {number} latitude - Latitud
   * @param {number} longitude - Longitud
   * @returns {Promise<Place|null>} - Lugar encontrado o null
   */
  async findByNameAndCoordinates(name, latitude, longitude) {
    return await this.getRepository().findOne({
      where: {
        name,
        latitude,
        longitude,
      },
    });
  }

  /**
   * Busca un lugar por nombre y dirección exactas
   * @param {string} name - Nombre del lugar
   * @param {string} address - Dirección del lugar
   * @returns {Promise<Place|null>} - Lugar encontrado o null
   */
  async findByNameAndAddress(name, address) {
    return await this.getRepository().findOne({
      where: {
        name,
        address,
      },
    });
  }

  /**
   * Busca un lugar por ID
   * @param {string} id - ID del lugar
   * @returns {Promise<Place|null>} - Lugar encontrado o null
   */
  async findById(id) {
    return await this.getRepository().findOne({ where: { id } });
  }

  /**
   * Crea un nuevo lugar
   * @param {Object} placeData - Datos del lugar
   * @returns {Promise<Place>} - Lugar creado
   */
  async create(placeData) {
    const place = this.getRepository().create(placeData);
    return await this.getRepository().save(place);
  }

  /**
   * Actualiza un lugar
   * @param {string} id - ID del lugar
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Place>} - Lugar actualizado
   */
  async update(id, updateData) {
    await this.getRepository().update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Elimina un lugar
   * @param {string} id - ID del lugar
   * @returns {Promise<boolean>} - True si se eliminó, false si no
   */
  async delete(id) {
    const result = await this.getRepository().delete(id);
    return result.affected > 0;
  }

  /**
   * Obtiene lugares paginados para el feed con conteo total
   * @param {number} page - Número de página (1-based)
   * @param {number} limit - Número de lugares por página
   * @returns {Promise<Object>} - { places: Array, totalCount: number }
   */
  async findPaginatedWithCount(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [places, totalCount] = await Promise.all([
      this.getRepository().find({
        select: ['id', 'name', 'address', 'latitude', 'longitude', 'image', 'rating'],
        skip: offset,
        take: limit,
        order: { createdAt: 'DESC' },
      }),
      this.getRepository().count()
    ]);

    return { places, totalCount };
  }
}

export default new PlaceRepository();