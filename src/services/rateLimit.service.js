import userRateLimitRepository from "../repository/userRateLimit.repository.js";
import logger from "../config/logger.js";

// Environment-based configuration
const getMinuteLimit = () => parseInt(process.env.CHAT_MINUTE_LIMIT);
const getDailyLimit = () => parseInt(process.env.CHAT_DAILY_LIMIT);
const getBlockDurationMinutes = () => parseInt(process.env.CHAT_BLOCK_DURATION_MINUTES);
const getWindowSizeDaily = () => parseInt(process.env.CHAT_WINDOW_SIZE_DAILY_MINUTES);

class RateLimitService {
  // Constants for rate limits
  static get MINUTE_LIMIT() { return getMinuteLimit(); }
  static get DAILY_LIMIT() { return getDailyLimit(); }
  static get BLOCK_DURATION_MINUTES() { return getBlockDurationMinutes(); } // 60 seconds = 1 minute
  static get WINDOW_SIZE_MINUTES() { return 1; } // 1 minute window
  static get WINDOW_SIZE_DAILY() { return getWindowSizeDaily(); } // 24 hours in minutes

  /**
   * Check if a user can send a message
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { canSend: boolean, reason?: string, blockedUntil?: Date }
   */
  async checkLimits(userId) {
    try {
      const now = new Date();
      let rateLimit = await userRateLimitRepository.findByUserId(userId);

      // If no record exists, create one
      if (!rateLimit) {
        rateLimit = await userRateLimitRepository.upsert(userId, {
          minuteCount: 0,
          minuteWindowStart: now,
          dailyCount: 0,
          dailyWindowStart: now,
          blockedUntil: null,
        });
      }

      // Check if user is currently blocked
      if (rateLimit.blockedUntil && rateLimit.blockedUntil > now) {
        const remainingTime = Math.ceil((rateLimit.blockedUntil - now) / 1000);
        return {
          canSend: false,
          reason: "blocked",
          blockedUntil: rateLimit.blockedUntil,
          remainingSeconds: remainingTime,
          message: `Has alcanzado el límite de ${RateLimitService.MINUTE_LIMIT} mensajes por minuto. Espera ${remainingTime} segundos antes de continuar.`,
        };
      }

      // Reset expired windows
      const updatedRateLimit = await this.resetExpiredWindows(rateLimit, now);

      // Check minute limit
      if (updatedRateLimit.minuteCount >= RateLimitService.MINUTE_LIMIT) {
        const blockedUntil = new Date(now.getTime() + RateLimitService.BLOCK_DURATION_MINUTES * 60 * 1000);
        await userRateLimitRepository.update(userId, {
          blockedUntil,
        });

        return {
          canSend: false,
          reason: "minute_limit",
          blockedUntil,
          remainingSeconds: 60,
          message: `Has alcanzado el límite de ${RateLimitService.MINUTE_LIMIT} mensajes por minuto. Espera unos segundos antes de continuar.`,
        };
      }

      // Check daily limit
      if (updatedRateLimit.dailyCount >= RateLimitService.DAILY_LIMIT) {
        // Calculate when the current daily window expires
        const windowExpiry = new Date(updatedRateLimit.dailyWindowStart.getTime() + RateLimitService.WINDOW_SIZE_DAILY * 60 * 1000);

        await userRateLimitRepository.update(userId, {
          blockedUntil: windowExpiry,
        });

        const remainingTime = Math.ceil((windowExpiry - now) / 1000);
        return {
          canSend: false,
          reason: "daily_limit",
          blockedUntil: windowExpiry,
          remainingSeconds: remainingTime,
          message: `Has alcanzado el límite diario de ${RateLimitService.DAILY_LIMIT} mensajes. Espera ${remainingTime} segundos antes de continuar.`,
        };
      }
      // Check daily limit
      if (updatedRateLimit.dailyCount >= RateLimitService.DAILY_LIMIT) {
        // Calculate next day reset (midnight UTC-3)
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        // Adjust for UTC-3
        nextDay.setHours(nextDay.getHours() + 3);

        await userRateLimitRepository.update(userId, {
          blockedUntil: nextDay,
        });

        return {
          canSend: false,
          reason: "daily_limit",
          blockedUntil: nextDay,
          message: `Has alcanzado el límite diario de ${RateLimitService.DAILY_LIMIT} mensajes. Intenta nuevamente mañana.`,
        };
      }

      return { canSend: true };
    } catch (error) {
      logger.error(`Error checking rate limits for user ${userId}: ${error.message}`);
      // Allow message in case of error to avoid blocking users due to system issues
      return { canSend: true };
    }
  }

  /**
   * Record a message sent by a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async recordMessage(userId) {
    try {
      const now = new Date();
      let rateLimit = await userRateLimitRepository.findByUserId(userId);

      if (!rateLimit) {
        rateLimit = await userRateLimitRepository.upsert(userId, {
          minuteCount: 1,
          minuteWindowStart: now,
          dailyCount: 1,
          dailyWindowStart: now,
          blockedUntil: null,
        });
        return;
      }

      // Reset expired windows before incrementing
      const updatedRateLimit = await this.resetExpiredWindows(rateLimit, now);

      // Increment counters
      const newMinuteCount = updatedRateLimit.minuteCount + 1;
      const newDailyCount = updatedRateLimit.dailyCount + 1;

      await userRateLimitRepository.update(userId, {
        minuteCount: newMinuteCount,
        dailyCount: newDailyCount,
      });

      logger.info(`Recorded message for user ${userId}: minute=${newMinuteCount}, daily=${newDailyCount}`);
    } catch (error) {
      logger.error(`Error recording message for user ${userId}: ${error.message}`);
      // Don't throw error to avoid breaking chat functionality
    }
  }

  /**
   * Reset expired windows for a rate limit record
   * @param {Object} rateLimit - Rate limit record
   * @param {Date} now - Current timestamp
   * @returns {Promise<Object>} - Updated rate limit record
   */
  async resetExpiredWindows(rateLimit, now) {
    let needsUpdate = false;
    const updates = {};

    // Check minute window
    const minuteWindowEnd = new Date(rateLimit.minuteWindowStart.getTime() + RateLimitService.WINDOW_SIZE_MINUTES * 60 * 1000);
    if (now >= minuteWindowEnd) {
      updates.minuteCount = 0;
      updates.minuteWindowStart = now;
      needsUpdate = true;
    }

    // Check daily window
    const dailyWindowEnd = new Date(rateLimit.dailyWindowStart.getTime() + RateLimitService.WINDOW_SIZE_DAILY * 60 * 1000);
    if (now >= dailyWindowEnd) {
      updates.dailyCount = 0;
      updates.dailyWindowStart = now;
      needsUpdate = true;
    }

    // Clear expired blocks
    if (rateLimit.blockedUntil && rateLimit.blockedUntil <= now) {
      updates.blockedUntil = null;
      needsUpdate = true;
    }

    if (needsUpdate) {
      return await userRateLimitRepository.update(rateLimit.userId, updates);
    }

    return rateLimit;
  }

  /**
   * Get rate limit status for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Rate limit status
   */
  async getStatus(userId) {
    try {
      const rateLimit = await userRateLimitRepository.findByUserId(userId);
      if (!rateLimit) {
        return {
          minuteCount: 0,
          dailyCount: 0,
          blockedUntil: null,
        };
      }

      const now = new Date();
      const updatedRateLimit = await this.resetExpiredWindows(rateLimit, now);

      return {
        minuteCount: updatedRateLimit.minuteCount,
        dailyCount: updatedRateLimit.dailyCount,
        blockedUntil: updatedRateLimit.blockedUntil,
        minuteLimit: RateLimitService.MINUTE_LIMIT,
        dailyLimit: RateLimitService.DAILY_LIMIT,
      };
    } catch (error) {
      logger.error(`Error getting rate limit status for user ${userId}: ${error.message}`);
      return {
        minuteCount: 0,
        dailyCount: 0,
        blockedUntil: null,
        minuteLimit: RateLimitService.MINUTE_LIMIT,
        dailyLimit: RateLimitService.DAILY_LIMIT,
      };
    }
  }

  /**
   * Clean up expired rate limits (for maintenance)
   * @returns {Promise<number>} - Number of records cleaned up
   */
  async cleanupExpiredLimits() {
    try {
      const now = new Date();
      const affected = await userRateLimitRepository.resetExpiredLimits(now);
      logger.info(`Cleaned up ${affected} expired rate limit records`);
      return affected;
    } catch (error) {
      logger.error(`Error cleaning up expired rate limits: ${error.message}`);
      return 0;
    }
  }
}

export default new RateLimitService();