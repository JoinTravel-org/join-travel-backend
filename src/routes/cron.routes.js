import { Router } from "express";
import cronService from "../services/cron.service.js";
import logger from "../config/logger.js";

const router = Router();

/**
 * POST /api/cron/daily-maintenance
 * Manually trigger daily maintenance tasks (for testing/admin purposes)
 * In production, this should be called by a cron job scheduler
 */
router.post("/daily-maintenance", async (req, res, next) => {
  // In production, add authentication and admin-only access
  // For now, allowing unauthenticated access for testing

  logger.info("Manual daily maintenance triggered");

  try {
    const result = await cronService.runDailyMaintenance();

    logger.info("Manual daily maintenance completed", result);
    res.status(200).json({
      success: true,
      message: "Daily maintenance completed successfully",
      data: result,
    });
  } catch (err) {
    logger.error("Manual daily maintenance failed:", err.message);

    res.status(500).json({
      success: false,
      message: "Daily maintenance failed",
      error: err.message,
    });
  }
});

/**
 * POST /api/cron/recalculate-stats
 * Manually trigger user stats recalculation
 */
router.post("/recalculate-stats", async (req, res, next) => {
  logger.info("Manual stats recalculation triggered");

  try {
    const result = await cronService.recalculateAllUserStats();

    logger.info("Manual stats recalculation completed", result);
    res.status(200).json({
      success: true,
      message: "Stats recalculation completed successfully",
      data: result,
    });
  } catch (err) {
    logger.error("Manual stats recalculation failed:", err.message);

    res.status(500).json({
      success: false,
      message: "Stats recalculation failed",
      error: err.message,
    });
  }
});

export default router;