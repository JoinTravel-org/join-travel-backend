import gamificationService from "../services/gamification.service.js";
import logger from "../config/logger.js";

/**
 * GET /api/users/{userId}/stats
 * Returns user statistics, current level, and progress
 */
export const getUserStats = async (req, res, next) => {
  const { userId } = req.params;
  const requestingUserId = req.user?.id;

  logger.info(`Get user stats endpoint called for user: ${userId} by user: ${requestingUserId}`);

  try {
    // Allow access if:
    // 1. userId matches the authenticated user ID, OR
    // 2. userId is "temp-id" (frontend placeholder), OR
    // 3. user is admin
    const effectiveUserId = (userId === 'temp-id') ? requestingUserId : userId;
    const isOwner = effectiveUserId === requestingUserId;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para ver las estadísticas de este usuario.",
      });
    }

    const stats = await gamificationService.getUserStats(effectiveUserId);

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
    // 2. userId is "temp-id" (frontend placeholder), OR
    // 3. user is admin
    const effectiveUserId = (userId === 'temp-id') ? requestingUserId : userId;
    const isOwner = effectiveUserId === requestingUserId;
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
    const validActions = ['review_created', 'vote_received', 'profile_completed', 'comment_posted', 'media_upload', 'place_added'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de acción inválido.",
        details: [`action: debe ser uno de ${validActions.join(', ')}`],
      });
    }

    const result = await gamificationService.awardPoints(effectiveUserId, action, metadata || {});

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