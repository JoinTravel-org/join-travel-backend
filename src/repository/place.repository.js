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

  /**
   * Busca lugares con filtros opcionales, paginación y ordenamiento por proximidad
   * @param {string|null} q - Término de búsqueda (nombre, opcional)
   * @param {string|null} city - Ciudad para filtrar (opcional)
   * @param {number|undefined} userLat - Latitud del usuario para ordenar por distancia (opcional)
   * @param {number|undefined} userLng - Longitud del usuario para ordenar por distancia (opcional)
   * @param {number} page - Número de página (1-based, default 1)
   * @param {number} limit - Número de resultados por página (default 20)
   * @returns {Promise<Object>} - { places: Array, totalCount: number }
   */
  async searchPlaces(q, city, userLat, userLng, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    // Build count query
    const countBuilder = this.getRepository().createQueryBuilder("place");
    let hasFilter = false;

    if (q && q.trim().length >= 3) {
      countBuilder.where("LOWER(place.name) LIKE :qPattern", { qPattern: `%${q.trim().toLowerCase()}%` });
      hasFilter = true;
    }

    if (city && city.trim().length > 0) {
      const cityPattern = `%${city.trim().toLowerCase()}%`;
      if (hasFilter) {
        countBuilder.andWhere("LOWER(place.city) LIKE :cityPattern", { cityPattern });
      } else {
        countBuilder.where("LOWER(place.city) LIKE :cityPattern", { cityPattern });
        hasFilter = true;
      }
    }

    const totalCount = hasFilter ? await countBuilder.getCount() : 0;

    // If no filters, return empty
    if (!hasFilter) {
      return { places: [], totalCount: 0 };
    }

    // Build main query
    const queryBuilder = this.getRepository()
      .createQueryBuilder("place")
      .select([
        "place.id",
        "place.name",
        "place.address",
        "place.latitude",
        "place.longitude",
        "place.image",
        "place.rating",
        "place.createdAt",
        "place.updatedAt",
        "place.description",
        "place.city"
      ])
      .skip(offset)
      .take(limit);

    // Apply filters
    if (q && q.trim().length >= 3) {
      queryBuilder.where("LOWER(place.name) LIKE :qPattern", { qPattern: `%${q.trim().toLowerCase()}%` });
    }

    if (city && city.trim().length > 0) {
      const cityPattern = `%${city.trim().toLowerCase()}%`;
      if (q && q.trim().length >= 3) {
        queryBuilder.andWhere("LOWER(place.city) LIKE :cityPattern", { cityPattern });
      } else {
        queryBuilder.where("LOWER(place.city) LIKE :cityPattern", { cityPattern });
      }
    }

    // Sorting
    if (userLat !== undefined && userLng !== undefined && !isNaN(userLat) && !isNaN(userLng)) {
      const distanceExpr = `(6371 * 2 * ASIN(SQRT(
        POWER(SIN((RADIANS(place.latitude - :userLat)) * 0.5), 2) +
        COS(RADIANS(:userLat)) * COS(RADIANS(place.latitude)) *
        POWER(SIN((RADIANS(place.longitude - :userLng)) * 0.5), 2)
      ))) AS distance`;
      queryBuilder.addSelect(distanceExpr);
      queryBuilder.addOrderBy("distance", "ASC");
      queryBuilder.setParameter("userLat", parseFloat(userLat));
      queryBuilder.setParameter("userLng", parseFloat(userLng));
    } else {
      queryBuilder.orderBy("place.name", "ASC");
    }

    const places = await queryBuilder.getMany();

    return { places, totalCount };
  }
}

export default new PlaceRepository();