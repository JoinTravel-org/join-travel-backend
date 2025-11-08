import gamificationService from "../services/gamification.service.js";
import reviewService from "../services/review.service.js";
import UserRepository from "../repository/user.repository.js";
import logger from "../config/logger.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

/**
 * GET /api/users/{userId}/stats
 * Returns user statistics, current level, and progress
 */
export const getUserStats = async (req, res, next) => {
  const { userId } = req.params;
  const requestingUserId = req.user?.id;

  logger.info(`Get user stats endpoint called for user: ${userId} by user: ${requestingUserId}`);

  try {
    // Allow access for all authenticated users (no permission restrictions)

    const stats = await gamificationService.getUserStats(userId);

    logger.info(`Get user stats endpoint completed successfully for user: ${userId}`);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    logger.error(`Get user stats endpoint failed for user: ${userId}, error: ${err.message}`);

    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
};

/**
 * POST /api/users/{userId}/points
 * Updates user points based on action, checks for level up and badges
 */
export const awardPoints = async (req, res, next) => {
  const { userId } = req.params;
  const { action, metadata } = req.body;
  const requestingUserId = req.user?.id;

  logger.info(`Award points endpoint called for user: ${userId} by user: ${requestingUserId}, action: ${action}`);

  try {
    // Allow access if:
    // 1. userId matches the authenticated user ID, OR
    // 2. user is admin
    const isOwner = userId === requestingUserId;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para actualizar los puntos de este usuario.",
      });
    }

    // Validate required fields
    if (!action) {
      return res.status(400).json({
        success: false,
        message: "El campo 'action' es requerido.",
        details: ["action: es requerido"],
      });
    }

    // Validate action type
    const validActions = ['review_created', 'vote_received', 'profile_completed', 'comment_posted', 'media_upload', 'place_added', 'expense_created'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de acción inválido.",
        details: [`action: debe ser uno de ${validActions.join(', ')}`],
      });
    }

    const result = await gamificationService.awardPoints(userId, action, metadata || {});

    logger.info(`Award points endpoint completed successfully for user: ${userId}, action: ${action}`);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error(`Award points endpoint failed for user: ${userId}, action: ${action}, error: ${err.message}`);

    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    // Return generic error for database issues
    res.status(500).json({
      success: false,
      message: "Error temporal de actualización. Inténtalo de nuevo más tarde.",
    });
  }
};

/**
 * GET /api/levels
 * Returns all levels for frontend display
 */
export const getAllLevels = async (req, res, next) => {
  logger.info("Get all levels endpoint called");

  try {
    const levels = await gamificationService.getAllLevels();

    logger.info(`Get all levels endpoint completed successfully, returned ${levels.length} levels`);
    res.status(200).json({
      success: true,
      data: levels.map(level => ({
        level_number: level.levelNumber,
        name: level.name,
        min_points: level.minPoints,
        description: level.description,
        rewards: level.rewards,
      })),
    });
  } catch (err) {
    logger.error(`Get all levels endpoint failed: ${err.message}`);

    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
};

/**
 * POST /api/reviews/{reviewId}/bulk-likes
 * Creates verified users and makes them like a specific review
 * @param {string} reviewId - Review ID to like
 * @param {number} count - Number of likes to create (1 user = 1 like)
 */
export const createBulkLikes = async (req, res, next) => {
  const { reviewId } = req.params;
  const { count } = req.body;
  const requestingUserId = req.user?.id;

  logger.info(`Bulk likes endpoint called for review: ${reviewId} by user: ${requestingUserId}, count: ${count}`);

  try {
    // Allow any authenticated user to use this endpoint for testing purposes

    // Validate required fields
    if (!count || count < 1 || count > 1000) {
      return res.status(400).json({
        success: false,
        message: "El campo 'count' debe ser un número entre 1 y 1000.",
        details: ["count: debe ser un entero entre 1 y 1000"],
      });
    }

    // Check if review exists
    const review = await reviewService.getLikeStatus(reviewId, null);
    if (!review.success) {
      return res.status(404).json({
        success: false,
        message: "Reseña no encontrada.",
      });
    }

    const userRepo = new UserRepository();
    const createdUsers = [];
    const successfulLikes = [];

    // Create users and like the review
    for (let i = 0; i < count; i++) {
      try {
        // Generate random email using UUID
        const randomEmail = `${uuidv4()}@test.example.com`;

        // Hash a default password
        const hashedPassword = await bcrypt.hash("testpassword123", 10);

        // Create verified user
        const newUser = await userRepo.create({
          email: randomEmail,
          password: hashedPassword,
          isEmailConfirmed: true,
          role: 'user'
        });

        createdUsers.push(newUser);

        // Make the user like the review
        const likeResult = await reviewService.toggleLike(reviewId, newUser.id);
        if (likeResult.success) {
          successfulLikes.push({
            userId: newUser.id,
            email: randomEmail,
            liked: likeResult.data.liked
          });
        }

        logger.info(`Created user ${newUser.id} (${randomEmail}) and liked review ${reviewId}`);

      } catch (userError) {
        logger.error(`Failed to create user and like review: ${userError.message}`);
        // Continue with next iteration
      }
    }

    logger.info(`Bulk likes endpoint completed: created ${createdUsers.length} users, ${successfulLikes.length} successful likes`);

    res.status(200).json({
      success: true,
      data: {
        reviewId,
        requestedCount: count,
        createdUsers: createdUsers.length,
        successfulLikes: successfulLikes.length,
        users: successfulLikes
      },
      message: `Se crearon ${createdUsers.length} usuarios y ${successfulLikes.length} likes exitosamente.`
    });

  } catch (err) {
    logger.error(`Bulk likes endpoint failed for review ${reviewId}, error: ${err.message}`);

    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
};

/**
 * GET /api/badges
 * Returns all predefined badges
 */
export const getAllBadges = async (req, res, next) => {
  logger.info("Get all badges endpoint called");

  try {
    const badges = await gamificationService.getAllBadges();

    logger.info(`Get all badges endpoint completed successfully, returned ${badges.length} badges`);
    res.status(200).json({
      success: true,
      data: badges.map(badge => ({
        name: badge.name,
        description: badge.description,
        criteria: badge.criteria,
        icon_url: badge.iconUrl,
      })),
    });
  } catch (err) {
    logger.error(`Get all badges endpoint failed: ${err.message}`);

    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
};

/**
 * GET /api/users/{userId}/milestones
 * Returns user's current milestones for earning badges and leveling up
 */
export const getUserMilestones = async (req, res, next) => {
  const { userId } = req.params;
  const requestingUserId = req.user?.id;

  logger.info(`Get user milestones endpoint called for user: ${userId} by user: ${requestingUserId}`);

  try {
    // Allow access for all authenticated users (no permission restrictions)

    const milestones = await gamificationService.getUserMilestones(userId);

    logger.info(`Get user milestones endpoint completed successfully for user: ${userId}, returned ${milestones.length} milestones`);
    res.status(200).json({
      success: true,
      data: milestones,
    });
  } catch (err) {
    logger.error(`Get user milestones endpoint failed for user: ${userId}, error: ${err.message}`);

    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  }
};