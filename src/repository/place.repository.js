import { AppDataSource } from "../load/typeorm.loader.js";
import Place from "../models/place.model.js";
import Fuse from "fuse.js";

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
   * Obtiene todos los lugares con campos completos para búsqueda
   * @returns {Promise<Array>} - Array de todos los lugares
   */
  async getAllPlaces() {
    return await this.getRepository().find({
      select: [
        "id",
        "name",
        "address",
        "latitude",
        "longitude",
        "image",
        "rating",
        "createdAt",
        "updatedAt",
        "description",
        "city"
      ]
    });
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
  async searchPlaces(q, city, userLat, userLng, page = 1, limit = 20, minRating) {
    const offset = (page - 1) * limit;

    // Get all places for fuzzy search
    const allPlaces = await this.getRepository().find({
      select: [
        "id",
        "name",
        "address",
        "latitude",
        "longitude",
        "image",
        "rating",
        "createdAt",
        "updatedAt",
        "description",
        "city"
      ]
    });

    // Calculate average ratings for places with reviews
    const placesWithCalculatedRatings = await Promise.all(
      allPlaces.map(async (place) => {
        // Get reviews for this place
        const reviews = await AppDataSource.getRepository("Review").find({
          where: { placeId: place.id },
          select: ["rating"]
        });

        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : null;

        return {
          ...place,
          calculatedRating: averageRating,
          reviewCount: reviews.length
        };
      })
    );

    let filteredPlaces = placesWithCalculatedRatings;

    // Apply fuzzy search if q is provided
    if (q && q.trim().length >= 3) {
      const fuse = new Fuse(allPlaces, {
        keys: ['name', 'address', 'city'],
        threshold: 0.4, // Umbral de similitud (0.0 = exacto, 1.0 = muy permisivo)
        includeScore: true,
        shouldSort: true,
      });

      const results = fuse.search(q.trim());
      filteredPlaces = results
        .filter(result => result.score < 0.6) // Solo resultados con buena similitud
        .map(result => result.item);
    }

    // Apply city filter if provided
    if (city && city.trim().length > 0) {
      const cityLower = city.trim().toLowerCase();
      const cityFuse = new Fuse(filteredPlaces, {
        keys: ['city'],
        threshold: 0.4,
        includeScore: true,
        shouldSort: true,
      });

      const cityResults = cityFuse.search(cityLower);
      filteredPlaces = cityResults
        .filter(result => result.score < 0.6)
        .map(result => result.item);
    }

    // Apply minRating filter if provided
    if (minRating !== undefined && !isNaN(minRating)) {
      const minRatingFloat = parseFloat(minRating);
      filteredPlaces = filteredPlaces.filter(place => {
        // Exclude places without reviews if minRating > 0
        if (minRatingFloat > 0 && place.reviewCount === 0) {
          return false;
        }
        // Include places that meet the minimum rating requirement
        return place.calculatedRating >= minRatingFloat;
      });
    }

    // If no filters applied, return empty
    if ((!q || q.trim().length < 3) && (!city || city.trim().length === 0) && minRating === undefined) {
      return { places: [], totalCount: 0 };
    }

    // Calculate distances if user location provided
    if (userLat !== undefined && userLng !== undefined && !isNaN(userLat) && !isNaN(userLng)) {
      filteredPlaces = filteredPlaces.map(place => {
        const distance = this.calculateDistance(
          parseFloat(userLat),
          parseFloat(userLng),
          place.latitude,
          place.longitude
        );
        return { ...place, distance };
      });

      // Sort by distance
      filteredPlaces.sort((a, b) => a.distance - b.distance);
    } else {
      // Sort by name if no distance sorting
      filteredPlaces.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Update rating field with calculated rating for response
    const placesWithUpdatedRating = filteredPlaces.map(place => ({
      ...place,
      rating: place.calculatedRating
    }));

    // Apply pagination
    const totalCount = placesWithUpdatedRating.length;
    const paginatedPlaces = placesWithUpdatedRating.slice(offset, offset + limit);

    return { places: paginatedPlaces, totalCount };
  }

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   * @param {number} lat1 - Latitud del punto 1
   * @param {number} lng1 - Longitud del punto 1
   * @param {number} lat2 - Latitud del punto 2
   * @param {number} lng2 - Longitud del punto 2
   * @returns {number} - Distancia en kilómetros
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convierte grados a radianes
   * @param {number} degrees - Grados
   * @returns {number} - Radianes
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

export default new PlaceRepository();