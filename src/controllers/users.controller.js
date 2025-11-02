import UserRepository from "../repository/user.repository.js";
import userFavoriteRepository from "../repository/userFavorite.repository.js";
import gamificationService from "../services/gamification.service.js";
import logger from "../config/logger.js";
import { ValidationError } from "../utils/customErrors.js";

/**
 * Busca usuarios por email
 * GET /api/users/search?email=<email>
 */
export const searchUsers = async (req, res, next) => {
  logger.info(`Search users endpoint called with email: ${req.query.email}`);

  try {
    const { email } = req.query;

    // Validar que se proporcione el parámetro email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new ValidationError("El parámetro 'email' es requerido y debe ser una cadena no vacía.");
    }

    // Limitar la longitud del email para prevenir búsquedas demasiado amplias
    if (email.length < 2) {
      throw new ValidationError("El email debe tener al menos 2 caracteres para la búsqueda.");
    }

    // Buscar usuarios
    const userRepo = new UserRepository();
    const users = await userRepo.searchByEmail(email.trim(), 20);

    // Formatear respuesta con stats si están disponibles
    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        let stats = null;
        try {
          stats = await gamificationService.getUserStats(user.id);
        } catch (statsError) {
          logger.warn(`Failed to get stats for user ${user.id}:`, statsError.message);
          // Continuar sin stats si hay error
        }

        return {
          id: user.id,
          email: user.email,
          isEmailConfirmed: user.isEmailConfirmed,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          stats
        };
      })
    );

    logger.info(`Search users endpoint completed successfully, found ${formattedUsers.length} users`);

    res.status(200).json({
      success: true,
      data: formattedUsers,
      message: null
    });

  } catch (err) {
    logger.error(`Search users endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtiene los lugares favoritos de un usuario específico
 * GET /api/users/{userId}/favorites
 */
export const getUserFavorites = async (req, res, next) => {
  logger.info(`Get user favorites endpoint called for userId: ${req.params.userId}`);

  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Validar que el userId sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new ValidationError("ID de usuario inválido");
    }

    // Verificar que el usuario existe
    const userRepo = new UserRepository();
    const targetUser = await userRepo.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Usuario no encontrado"
      });
    }

    // Nota: Cualquier usuario autenticado puede ver los favoritos de otros usuarios
    // según los requisitos de la especificación

    // Obtener los favoritos del usuario
    const favorites = await userFavoriteRepository.getUserFavoritesWithDetails(userId);

    // Formatear la respuesta con los datos de los lugares
    const formattedFavorites = favorites.map(favorite => ({
      id: favorite.place.id,
      name: favorite.place.name,
      address: favorite.place.address,
      latitude: parseFloat(favorite.place.latitude),
      longitude: parseFloat(favorite.place.longitude),
      image: favorite.place.image,
      city: favorite.place.city,
      description: favorite.place.description,
      createdAt: favorite.place.createdAt.toISOString(),
      updatedAt: favorite.place.updatedAt.toISOString()
    }));

    logger.info(`Get user favorites endpoint completed successfully, found ${formattedFavorites.length} favorites`);

    res.status(200).json({
      success: true,
      data: formattedFavorites,
      message: null
    });

  } catch (err) {
    logger.error(`Get user favorites endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtiene información básica de un usuario por su ID
 * GET /api/users/{userId}
 */
export const getUserById = async (req, res, next) => {
  logger.info(`Get user by ID endpoint called for userId: ${req.params.userId}`);

  try {
    const { userId } = req.params;

    // Validar que el userId sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new ValidationError("ID de usuario inválido");
    }

    // Buscar el usuario
    const userRepo = new UserRepository();
    const user = await userRepo.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Usuario no encontrado"
      });
    }

    // Obtener stats del usuario si están disponibles
    let stats = null;
    try {
      stats = await gamificationService.getUserStats(userId);
    } catch (statsError) {
      logger.warn(`Failed to get stats for user ${userId}:`, statsError.message);
      // Continuar sin stats si hay error
    }

    // Formatear respuesta
    const formattedUser = {
      id: user.id,
      email: user.email,
      isEmailConfirmed: user.isEmailConfirmed,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      stats
    };

    logger.info(`Get user by ID endpoint completed successfully for user: ${userId}`);

    res.status(200).json({
      success: true,
      data: formattedUser,
      message: null
    });

  } catch (err) {
    logger.error(`Get user by ID endpoint failed: ${err.message}`);
    next(err);
  }
};