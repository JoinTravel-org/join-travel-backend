import { AppDataSource } from "../load/typeorm.loader.js";
import logger from "../config/logger.js";

class GamificationService {
  constructor() {
    this.userRepository = AppDataSource.getRepository("User");
    this.userActionRepository = AppDataSource.getRepository("UserAction");
    this.levelRepository = AppDataSource.getRepository("Level");
    this.badgeRepository = AppDataSource.getRepository("Badge");
  }

  // Point calculation rules
  getPointsForAction(actionType) {
    const pointRules = {
      'review_created': 10,
      'vote_received': 1,
      'profile_completed': 5,
      'comment_posted': 2,
    };
    return pointRules[actionType] || 0;
  }

  /**
   * Get user stats with caching
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User stats
   */
  async getUserStats(userId) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'points', 'level', 'levelName', 'badges', 'lastActivity']
      });

      if (!user) {
        throw { status: 404, message: "Usuario no encontrado" };
      }

      // Get next level info
      const nextLevel = await this.levelRepository.findOne({
        where: { levelNumber: user.level + 1 }
      });

      // Calculate progress to next level
      let progressToNext = 0;
      if (nextLevel) {
        const currentLevel = await this.levelRepository.findOne({
          where: { levelNumber: user.level }
        });
        if (currentLevel) {
          const levelRange = nextLevel.minPoints - currentLevel.minPoints;
          const userProgress = user.points - currentLevel.minPoints;
          progressToNext = Math.min(100, Math.round((userProgress / levelRange) * 100));
        }
      } else {
        progressToNext = 100; // Max level reached
      }

      return {
        points: user.points,
        level: user.level,
        levelName: user.levelName,
        progressToNext,
        badges: user.badges || [],
        nextLevel: nextLevel ? {
          level: nextLevel.levelNumber,
          name: nextLevel.name,
          minPoints: nextLevel.minPoints
        } : null
      };
    } catch (error) {
      logger.error(`Error getting user stats for ${userId}:`, error);
      throw error;
    }
  }

  /**
    * Award points and check for level/badge progression
    * @param {string} userId - User ID
    * @param {string} actionType - Action type
    * @param {Object} metadata - Additional metadata
    * @returns {Promise<Object>} Updated stats and notifications
    */
   async awardPoints(userId, actionType, metadata = {}) {
     // Check if AppDataSource is initialized
     if (!AppDataSource.isInitialized) {
       throw new Error("Database connection not established");
     }

     const queryRunner = AppDataSource.createQueryRunner();
     await queryRunner.connect();
     await queryRunner.startTransaction();

     try {
       // Get current user data
       const user = await queryRunner.manager.findOne("User", {
         where: { id: userId },
         select: ['id', 'points', 'level', 'levelName', 'badges', 'lastActivity']
       });

       if (!user) {
         throw { status: 404, message: "Usuario no encontrado" };
       }

       // Calculate points to award
       const pointsToAward = this.getPointsForAction(actionType);
       if (pointsToAward === 0) {
         throw { status: 400, message: "Tipo de acción inválido" };
       }

       // Record the action
       const userActionData = {
         userId,
         actionType,
         pointsAwarded: pointsToAward,
         metadata
       };
       try {
         await queryRunner.manager.save("UserAction", userActionData);
       } catch (saveError) {
         // Continue with transaction even if action logging fails
       }

       // Update user points and last activity
       const newPoints = user.points + pointsToAward;
       await queryRunner.manager.update("User", userId, {
         points: newPoints,
         lastActivity: new Date()
       });

       // Check for level progression
       try {
         const newLevel = await this.calculateNewLevel(newPoints);
         let levelUpNotification = null;

         if (newLevel && newLevel.levelNumber > user.level) {
           await queryRunner.manager.update("User", userId, {
             level: newLevel.levelNumber,
             levelName: newLevel.name
           });

           levelUpNotification = {
             newLevel: newLevel.levelNumber,
             levelName: newLevel.name,
             message: `¡Felicidades! Has alcanzado el Nivel ${newLevel.levelNumber}: ${newLevel.name}.`
           };
         }
       } catch (levelError) {
         // Continue with the transaction even if level calculation fails
       }

       // Check for new badges
       const newBadges = await this.checkAndAwardBadges(queryRunner, userId, actionType, metadata);
       const badgeNotifications = newBadges.map(badge => badge.name);

       await queryRunner.commitTransaction();

       // Get updated stats
       const updatedStats = await this.getUserStats(userId);

       const response = {
         points: updatedStats.points,
         level: updatedStats.level,
         levelName: updatedStats.levelName,
         progressToNext: updatedStats.progressToNext,
         badges: updatedStats.badges
       };

       if (levelUpNotification || badgeNotifications.length > 0) {
         response.notification = {
           ...levelUpNotification,
           newBadges: badgeNotifications
         };
       }

       return response;

     } catch (error) {
       await queryRunner.rollbackTransaction();
       throw error;
     } finally {
       await queryRunner.release();
     }
   }

  /**
   * Calculate new level based on points
   * @param {number} points - Total points
   * @returns {Promise<Object>} Level data
   */
  async calculateNewLevel(points) {
    const levels = await this.levelRepository.find({
      order: { levelNumber: 'DESC' }
    });

    if (levels.length === 0) {
      throw new Error("No levels configured in database. Please run database seeding.");
    }

    for (const level of levels) {
      if (points >= level.minPoints) {
        return level;
      }
    }

    // Default to level 1 if no level found
    const defaultLevel = await this.levelRepository.findOne({ where: { levelNumber: 1 } });
    if (!defaultLevel) {
      throw new Error("Level 1 not found in database. Please run database seeding.");
    }
    return defaultLevel;
  }

  /**
   * Check and award badges based on criteria
   * @param {QueryRunner} queryRunner - Database transaction runner
   * @param {string} userId - User ID
   * @param {string} actionType - Action type
   * @param {Object} metadata - Action metadata
   * @returns {Promise<Array>} New badges awarded
   */
  async checkAndAwardBadges(queryRunner, userId, actionType, metadata) {
    const newBadges = [];
    const badges = await this.badgeRepository.find();

    for (const badge of badges) {
      const alreadyHasBadge = await this.userHasBadge(queryRunner, userId, badge.name);
      if (alreadyHasBadge) continue;

      const qualifies = await this.checkBadgeCriteria(queryRunner, userId, badge, actionType, metadata);
      if (qualifies) {
        await this.awardBadge(queryRunner, userId, badge);
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  /**
   * Check if user already has a badge
   * @param {QueryRunner} queryRunner - Database transaction runner
   * @param {string} userId - User ID
   * @param {string} badgeName - Badge name
   * @returns {Promise<boolean>} Whether user has badge
   */
  async userHasBadge(queryRunner, userId, badgeName) {
    const user = await queryRunner.manager.findOne("User", {
      where: { id: userId },
      select: ['badges']
    });
    return user.badges.some(badge => badge.name === badgeName);
  }

  /**
   * Check if user qualifies for a badge
   * @param {QueryRunner} queryRunner - Database transaction runner
   * @param {string} userId - User ID
   * @param {Object} badge - Badge data
   * @param {string} actionType - Action type
   * @param {Object} metadata - Action metadata
   * @returns {Promise<boolean>} Whether user qualifies
   */
  async checkBadgeCriteria(queryRunner, userId, badge, actionType, metadata) {
    const criteria = badge.criteria;

    if (criteria.level) {
      const user = await queryRunner.manager.findOne("User", {
        where: { id: userId },
        select: ['level']
      });
      return user.level >= criteria.level;
    }

    if (criteria.action_type && criteria.count) {
      const actionCount = await queryRunner.manager.count("UserAction", {
        where: { userId, actionType: criteria.action_type }
      });
      return actionCount >= criteria.count;
    }

    if (criteria.action_type === 'vote_received' && criteria.per_review) {
      // Check if this specific review has enough votes
      if (metadata.review_id) {
        const voteCount = await queryRunner.manager.count("UserAction", {
          where: {
            actionType: 'vote_received',
            metadata: { review_id: metadata.review_id }
          }
        });
        return voteCount >= criteria.per_review;
      }
    }

    return false;
  }

  /**
   * Award a badge to user
   * @param {QueryRunner} queryRunner - Database transaction runner
   * @param {string} userId - User ID
   * @param {Object} badge - Badge data
   */
  async awardBadge(queryRunner, userId, badge) {
    const user = await queryRunner.manager.findOne("User", {
      where: { id: userId },
      select: ['badges']
    });

    const newBadge = {
      name: badge.name,
      earned_at: new Date().toISOString()
    };

    const updatedBadges = [...(user.badges || []), newBadge];

    await queryRunner.manager.update("User", userId, {
      badges: updatedBadges
    });
  }

  /**
   * Get all levels
   * @returns {Promise<Array>} All levels
   */
  async getAllLevels() {
    return await this.levelRepository.find({
      order: { levelNumber: 'ASC' }
    });
  }

  /**
   * Get all badges
   * @returns {Promise<Array>} All badges
   */
  async getAllBadges() {
    return await this.badgeRepository.find();
  }

  /**
   * Recalculate user stats (for cron job)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Recalculated stats
   */
  async recalculateUserStats(userId) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Recalculate total points from user_actions
      const totalPointsResult = await queryRunner.manager
        .createQueryBuilder("UserAction", "ua")
        .select("SUM(ua.pointsAwarded)", "total")
        .where("ua.userId = :userId", { userId })
        .getRawOne();

      const totalPoints = parseInt(totalPointsResult.total) || 0;

      // Calculate new level
      const newLevel = await this.calculateNewLevel(totalPoints);

      // Update user
      await queryRunner.manager.update("User", userId, {
        points: totalPoints,
        level: newLevel.levelNumber,
        levelName: newLevel.name
      });

      await queryRunner.commitTransaction();

      return { points: totalPoints, level: newLevel.levelNumber, levelName: newLevel.name };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

export default new GamificationService();