import UserRepository from "../repository/user.repository.js";
import userFavoriteRepository from "../repository/userFavorite.repository.js";
import reviewMediaRepository from "../repository/reviewMedia.repository.js";
import reviewRepository from "../repository/review.repository.js";
import reviewLikeRepository from "../repository/reviewLike.repository.js";
import gamificationService from "../services/gamification.service.js";
import UserFollowerRepository from "../repository/userFollower.repository.js";
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

/**
 * Seguir a un usuario
 * POST /api/users/{userId}/follow
 */
export const followUser = async (req, res, next) => {
  logger.info(
    `Follow user endpoint called - follower: ${req.user.id}, followed: ${req.params.userId}`
  );

  try {
    const followerId = req.user.id;
    const followedId = req.params.userId;

    // Validar que el userId sea un UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(followedId)) {
      throw new ValidationError("ID de usuario inválido");
    }

    // Verificar que el usuario a seguir existe
    const userRepo = new UserRepository();
    const targetUser = await userRepo.findById(followedId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Usuario no encontrado",
      });
    }

    // Crear la relación de seguimiento
    const followerRepo = new UserFollowerRepository();
    const follow = await followerRepo.follow(followerId, followedId);

    logger.info(
      `Follow user endpoint completed successfully - follower: ${followerId}, followed: ${followedId}`
    );

    res.status(201).json({
      success: true,
      data: follow,
      message: "Usuario seguido exitosamente",
    });
  } catch (err) {
    if (err.message === "Ya sigues a este usuario") {
      return res.status(400).json({
        success: false,
        data: null,
        message: err.message,
      });
    }
    if (err.message === "No puedes seguirte a ti mismo") {
      return res.status(400).json({
        success: false,
        data: null,
        message: err.message,
      });
    }
    logger.error(`Follow user endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Dejar de seguir a un usuario
 * DELETE /api/users/{userId}/follow
 */
export const unfollowUser = async (req, res, next) => {
  logger.info(
    `Unfollow user endpoint called - follower: ${req.user.id}, unfollowed: ${req.params.userId}`
  );

  try {
    const followerId = req.user.id;
    const followedId = req.params.userId;

    // Validar que el userId sea un UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(followedId)) {
      throw new ValidationError("ID de usuario inválido");
    }

    // Eliminar la relación de seguimiento
    const followerRepo = new UserFollowerRepository();
    const success = await followerRepo.unfollow(followerId, followedId);

    if (!success) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "No sigues a este usuario",
      });
    }

    logger.info(
      `Unfollow user endpoint completed successfully - follower: ${followerId}, unfollowed: ${followedId}`
    );

    res.status(200).json({
      success: true,
      data: null,
      message: "Has dejado de seguir al usuario",
    });
  } catch (err) {
    logger.error(`Unfollow user endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Verificar si el usuario actual sigue a otro usuario
 * GET /api/users/{userId}/is-following
 */
export const isFollowingUser = async (req, res, next) => {
  logger.info(
    `Is following user endpoint called - follower: ${req.user.id}, target: ${req.params.userId}`
  );

  try {
    const followerId = req.user.id;
    const followedId = req.params.userId;

    // Validar que el userId sea un UUID válido
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(followedId)) {
      throw new ValidationError("ID de usuario inválido");
    }

    // Verificar la relación de seguimiento
    const followerRepo = new UserFollowerRepository();
    const isFollowing = await followerRepo.isFollowing(followerId, followedId);

    logger.info(
      `Is following user endpoint completed - follower: ${followerId}, target: ${followedId}, result: ${isFollowing}`
    );

    res.status(200).json({
      success: true,
      data: { isFollowing },
      message: null,
    });
  } catch (err) {
    logger.error(`Is following user endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtener estadísticas de seguimiento de un usuario
 * GET /api/users/{userId}/follow-stats
 */
export const getUserFollowStats = async (req, res, next) => {
  logger.info(
    `Get user follow stats endpoint called for userId: ${req.params.userId}`
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

    // Obtener estadísticas de seguimiento
    const followerRepo = new UserFollowerRepository();
    const stats = await followerRepo.getUserFollowStats(userId);

    logger.info(
      `Get user follow stats endpoint completed successfully for user: ${userId}`
    );

    res.status(200).json({
      success: true,
      data: stats,
      message: null,
    });
  } catch (err) {
    logger.error(`Get user follow stats endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtener lista de seguidores de un usuario
 * GET /api/users/{userId}/followers
 */
export const getUserFollowers = async (req, res, next) => {
  logger.info(
    `Get user followers endpoint called for userId: ${req.params.userId}`
  );

  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

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

    // Obtener lista de seguidores
    const followerRepo = new UserFollowerRepository();
    const followers = await followerRepo.getFollowers(userId, limit, offset);

    // Formatear respuesta
    const formattedFollowers = followers.map((follow) => ({
      id: follow.follower.id,
      email: follow.follower.email,
      isEmailConfirmed: follow.follower.isEmailConfirmed,
      followedAt: follow.createdAt,
    }));

    logger.info(
      `Get user followers endpoint completed successfully, found ${formattedFollowers.length} followers`
    );

    res.status(200).json({
      success: true,
      data: formattedFollowers,
      message: null,
    });
  } catch (err) {
    logger.error(`Get user followers endpoint failed: ${err.message}`);
    next(err);
  }
};

/**
 * Obtener lista de usuarios seguidos por un usuario
 * GET /api/users/{userId}/following
 */
export const getUserFollowing = async (req, res, next) => {
  logger.info(
    `Get user following endpoint called for userId: ${req.params.userId}`
  );

  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

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

    // Obtener lista de usuarios seguidos
    const followerRepo = new UserFollowerRepository();
    const following = await followerRepo.getFollowing(userId, limit, offset);

    // Formatear respuesta
    const formattedFollowing = following.map((follow) => ({
      id: follow.followed.id,
      email: follow.followed.email,
      isEmailConfirmed: follow.followed.isEmailConfirmed,
      followedAt: follow.createdAt,
    }));

    logger.info(
      `Get user following endpoint completed successfully, found ${formattedFollowing.length} following`
    );

    res.status(200).json({
      success: true,
      data: formattedFollowing,
      message: null,
    });
  } catch (err) {
    logger.error(`Get user following endpoint failed: ${err.message}`);
    next(err);
  }
};
