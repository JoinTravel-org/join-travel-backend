import UserRepository from "../repository/user.repository.js";
import userFavoriteRepository from "../repository/userFavorite.repository.js";
import reviewMediaRepository from "../repository/reviewMedia.repository.js";
import reviewRepository from "../repository/review.repository.js";
import reviewLikeRepository from "../repository/reviewLike.repository.js";
import listRepository from "../repository/list.repository.js";
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
    if (!email || typeof email !== "string" || email.trim().length === 0) {
      throw new ValidationError(
        "El parámetro 'email' es requerido y debe ser una cadena no vacía."
      );
    }

    // Limitar la longitud del email para prevenir búsquedas demasiado amplias
    if (email.length < 2) {
      throw new ValidationError(
        "El email debe tener al menos 2 caracteres para la búsqueda."
      );
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
          logger.warn(
            `Failed to get stats for user ${user.id}:`,
            statsError.message
          );
          // Continuar sin stats si hay error
        }

        return {
          id: user.id,
          email: user.email,
          isEmailConfirmed: user.isEmailConfirmed,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          stats,
        };
      })
    );

    logger.info(
      `Search users endpoint completed successfully, found ${formattedUsers.length} users`
    );

    res.status(200).json({
      success: true,
      data: formattedUsers,
      message: null,
    });
  } catch (err) {
    logger.error(`Search users endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtiene un usuario específico por email
 * GET /api/users/email/:email
 */
export const getUserByEmail = async (req, res, next) => {
  logger.info(
    `Get user by email endpoint called with email: ${req.params.email}`
  );

  try {
    const { email } = req.params;

    // Validar que se proporcione el email
    if (!email || typeof email !== "string" || email.trim().length === 0) {
      throw new ValidationError("El email es requerido");
    }

    // Buscar el usuario
    const userRepo = new UserRepository();
    const user = await userRepo.findByEmail(email.trim());

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Usuario no encontrado",
      });
    }

    // Obtener stats del usuario si están disponibles
    let stats = null;
    try {
      stats = await gamificationService.getUserStats(user.id);
    } catch (statsError) {
      logger.warn(
        `Failed to get stats for user ${user.id}:`,
        statsError.message
      );
      // Continuar sin stats si hay error
    }

    // Formatear respuesta
    const formattedUser = {
      id: user.id,
      email: user.email,
      name: user.name || null,
      isEmailConfirmed: user.isEmailConfirmed,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      stats,
    };

    logger.info(
      `Get user by email endpoint completed successfully for user: ${user.id}`
    );

    res.status(200).json({
      success: true,
      data: formattedUser,
      message: null,
    });
  } catch (err) {
    logger.error(`Get user by email endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtiene los lugares favoritos de un usuario específico
 * GET /api/users/{userId}/favorites
 */
export const getUserFavorites = async (req, res, next) => {
  logger.info(
    `Get user favorites endpoint called for userId: ${req.params.userId}`
  );

  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Validar que el userId sea un UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
        message: "Usuario no encontrado",
      });
    }

    // Nota: Cualquier usuario autenticado puede ver los favoritos de otros usuarios
    // según los requisitos de la especificación

    // Obtener los favoritos del usuario
    const favorites = await userFavoriteRepository.getUserFavoritesWithDetails(
      userId
    );

    // Formatear la respuesta con los datos de los lugares
    const formattedFavorites = favorites.map((favorite) => ({
      id: favorite.place.id,
      name: favorite.place.name,
      address: favorite.place.address,
      latitude: parseFloat(favorite.place.latitude),
      longitude: parseFloat(favorite.place.longitude),
      image: favorite.place.image,
      city: favorite.place.city,
      description: favorite.place.description,
      createdAt: favorite.place.createdAt.toISOString(),
      updatedAt: favorite.place.updatedAt.toISOString(),
    }));

    logger.info(
      `Get user favorites endpoint completed successfully, found ${formattedFavorites.length} favorites`
    );

    res.status(200).json({
      success: true,
      data: formattedFavorites,
      message: null,
    });
  } catch (err) {
    logger.error(`Get user favorites endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtiene las listas de lugares de un usuario específico
 * GET /api/users/{userId}/lists
 */
export const getUserLists = async (req, res, next) => {
  logger.info(
    `Get user lists endpoint called for userId: ${req.params.userId}`
  );

  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Validar que el userId sea un UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
        message: "Usuario no encontrado",
      });
    }

    // Nota: Cualquier usuario autenticado puede ver las listas de otros usuarios
    // según los requisitos de la especificación

    // Obtener las listas del usuario
    const lists = await listRepository.findByUserId(userId);

    // Formatear la respuesta con los datos de las listas
    const formattedLists = lists.map((list) => ({
      id: list.id,
      title: list.title,
      description: list.description,
      userId: list.userId,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
      places: list.places.map(place => ({
        id: place.id,
        name: place.name,
        address: place.address,
        latitude: parseFloat(place.latitude),
        longitude: parseFloat(place.longitude),
        image: place.image,
        rating: place.rating,
        description: place.description,
        city: place.city,
      })),
    }));

    logger.info(
      `Get user lists endpoint completed successfully, found ${formattedLists.length} lists`
    );

    res.status(200).json({
      success: true,
      data: formattedLists,
      message: null,
    });
  } catch (err) {
    logger.error(`Get user lists endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtiene información básica de un usuario por su ID
 * GET /api/users/{userId}
 */
export const getUserById = async (req, res, next) => {
  logger.info(
    `Get user by ID endpoint called for userId: ${req.params.userId}`
  );

  try {
    const { userId } = req.params;

    // Validar que el userId sea un UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
        message: "Usuario no encontrado",
      });
    }

    // Obtener stats del usuario si están disponibles
    let stats = null;
    try {
      stats = await gamificationService.getUserStats(userId);
    } catch (statsError) {
      logger.warn(
        `Failed to get stats for user ${userId}:`,
        statsError.message
      );
      // Continuar sin stats si hay error
    }

    // Formatear respuesta
    const formattedUser = {
      id: user.id,
      email: user.email,
      isEmailConfirmed: user.isEmailConfirmed,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      stats,
    };

    logger.info(
      `Get user by ID endpoint completed successfully for user: ${userId}`
    );

    res.status(200).json({
      success: true,
      data: formattedUser,
      message: null,
    });
  } catch (err) {
    logger.error(`Get user by ID endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtiene todos los archivos multimedia públicos de un usuario
 * GET /api/users/{userId}/media
 */
export const getUserMedia = async (req, res, next) => {
  logger.info(
    `Get user media endpoint called for userId: ${req.params.userId}`
  );

  try {
    const { userId } = req.params;

    // Validar que el userId sea un UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
        message: "Usuario no encontrado",
      });
    }

    // Obtener los archivos multimedia del usuario (de sus reseñas publicadas)
    const mediaFiles = await reviewMediaRepository.getUserMedia(userId, 20);

    // Formatear la respuesta según la especificación
    const formattedMedia = mediaFiles.map((media) => ({
      id: media.id,
      filename: media.filename,
      originalFilename: media.originalFilename,
      fileSize: parseInt(media.fileSize),
      mimeType: media.mimeType,
      url: `/api/media/${media.id}`, // URL para acceder al archivo
      createdAt: media.createdAt.toISOString(),
    }));

    logger.info(
      `Get user media endpoint completed successfully, found ${formattedMedia.length} media files`
    );

    res.status(200).json({
      success: true,
      data: formattedMedia,
      message: null,
    });
  } catch (err) {
    logger.error(`Get user media endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtiene todas las reseñas de un usuario específico
 * GET /api/users/{userId}/reviews
 */
export const getUserReviews = async (req, res, next) => {
  logger.info(
    `Get user reviews endpoint called for userId: ${req.params.userId}`
  );

  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Validar que el userId sea un UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
        message: "Usuario no encontrado",
      });
    }

    // Obtener las reseñas del usuario
    const rawReviews = await reviewRepository.getUserReviews(userId);

    // Formatear la respuesta con media y likes
    const formattedReviews = await Promise.all(
      rawReviews.map(async (rawReview) => {
        // Obtener media para esta reseña
        const media = await reviewMediaRepository.findByReviewId(rawReview.review_id);

        return {
          id: rawReview.review_id,
          rating: rawReview.review_rating,
          content: rawReview.review_content,
          placeId: rawReview.review_placeId,
          userId: rawReview.review_userId,
          userEmail: rawReview.user_email,
          createdAt: rawReview.review_createdAt.toISOString(),
          updatedAt: rawReview.review_updatedAt.toISOString(),
          placeName: rawReview.place_name || null,
          media: media.map(m => ({
            id: m.id,
            filename: m.filename,
            originalFilename: m.originalFilename,
            fileSize: parseInt(m.fileSize),
            mimeType: m.mimeType,
            url: `/api/media/${m.id}`,
          })),
          likeCount: parseInt(rawReview.likeCount) || 0,
          dislikeCount: parseInt(rawReview.dislikeCount) || 0,
        };
      })
    );

    logger.info(
      `Get user reviews endpoint completed successfully, found ${formattedReviews.length} reviews`
    );

    res.status(200).json({
      success: true,
      data: formattedReviews,
      message: null,
    });
  } catch (err) {
    logger.error(`Get user reviews endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtiene estadísticas de reseñas de un usuario específico
 * GET /api/users/{userId}/reviews/stats
 */
export const getUserReviewStats = async (req, res, next) => {
  logger.info(
    `Get user review stats endpoint called for userId: ${req.params.userId}`
  );

  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    // Validar que el userId sea un UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
        message: "Usuario no encontrado",
      });
    }

    // Obtener estadísticas de reseñas del usuario
    const stats = await reviewRepository.getUserReviewStats(userId);

    logger.info(
      `Get user review stats endpoint completed successfully for user: ${userId}`
    );

    res.status(200).json({
      success: true,
      data: stats,
      message: null,
    });
  } catch (err) {
    logger.error(`Get user review stats endpoint failed: ${err.message}`);
    next(err);
  }
};
