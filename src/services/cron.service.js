import gamificationService from "./gamification.service.js";
import { AppDataSource } from "../load/typeorm.loader.js";
import logger from "../config/logger.js";

class CronService {
  /**
   * Recalculate user stats for all users
   * This should be run daily to ensure data consistency
   */
  async recalculateAllUserStats() {
    try {
      logger.info("Starting daily user stats recalculation");

      const userRepository = AppDataSource.getRepository("User");
      const users = await userRepository.find({
        select: ['id']
      });

      let processed = 0;
      let errors = 0;

      for (const user of users) {
        try {
          await gamificationService.recalculateUserStats(user.id);
          processed++;
        } catch (error) {
          logger.error(`Failed to recalculate stats for user ${user.id}:`, error.message);
          errors++;
        }
      }

      logger.info(`Daily recalculation completed: ${processed} users processed, ${errors} errors`);
      return { processed, errors };

    } catch (error) {
      logger.error("Failed to run daily user stats recalculation:", error);
      throw error;
    }
  }

  /**
   * Clean up old user actions (optional maintenance)
   * Remove actions older than 1 year to keep database size manageable
   */
  async cleanupOldUserActions() {
    try {
      logger.info("Starting cleanup of old user actions");

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const userActionRepository = AppDataSource.getRepository("UserAction");
      // Use query builder for date comparison
      const result = await userActionRepository
        .createQueryBuilder()
        .delete()
        .from("UserAction")
        .where("created_at < :date", { date: oneYearAgo })
        .execute();

      logger.info(`Cleaned up ${result.affected || 0} old user actions`);
      return result.affected || 0;

    } catch (error) {
      logger.error("Failed to cleanup old user actions:", error);
      throw error;
    }
  }

  /**
   * Run all daily maintenance tasks
   */
  async runDailyMaintenance() {
    try {
      logger.info("Starting daily maintenance tasks");

      const statsResult = await this.recalculateAllUserStats();
      const cleanupResult = await this.cleanupOldUserActions();

      logger.info("Daily maintenance tasks completed", {
        statsRecalculated: statsResult,
        actionsCleaned: cleanupResult
      });

      return {
        statsRecalculated: statsResult,
        actionsCleaned: cleanupResult
      };

    } catch (error) {
      logger.error("Failed to run daily maintenance:", error);
      throw error;
    }
  }
}

export default new CronService();