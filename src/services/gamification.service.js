import { AppDataSource } from "../load/typeorm.loader.js";
import logger from "../config/logger.js";
import emailService from "./email.service.js";

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
      'media_upload': 5, // Bonus points for uploading media
      'place_added': 15, // Points for adding a new place
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
    * @param {boolean} useTransaction - Whether to use a transaction (default: true)
    * @returns {Promise<Object>} Updated stats and notifications
    */
   async awardPoints(userId, actionType, metadata = {}, useTransaction = true) {
     // Check if AppDataSource is initialized
     if (!AppDataSource.isInitialized) {
       throw new Error("Database connection not established");
     }

     let queryRunner;
     let shouldManageTransaction = useTransaction;

     if (useTransaction) {
       queryRunner = AppDataSource.createQueryRunner();
       await queryRunner.connect();
       await queryRunner.startTransaction();
     } else {
       // Use the default manager when not using transactions
       queryRunner = {
         manager: AppDataSource.manager,
         commitTransaction: () => {},
         rollbackTransaction: () => {},
         release: () => {}
       };
     }

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
       logger.info(`Awarding ${pointsToAward} points to user ${userId} for action: ${actionType}`);

       // Record the action
       const userActionData = {
         userId,
         actionType,
         pointsAwarded: pointsToAward,
         metadata
       };
       try {
         await queryRunner.manager.save("UserAction", userActionData);
         logger.info(`Action ${actionType} recorded for user ${userId}`);
       } catch (saveError) {
         logger.error(`Failed to record action ${actionType} for user ${userId}:`, saveError);
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
         const newLevel = await this.calculateNewLevel(userId);
         let levelUpNotification = null;

         if (newLevel && newLevel.levelNumber !== user.level) {
           logger.info(`User ${userId} level change from ${user.level} to ${newLevel.levelNumber}: ${newLevel.name}`);
           await queryRunner.manager.update("User", userId, {
             level: newLevel.levelNumber,
             levelName: newLevel.name
           });

           if (newLevel.levelNumber > user.level) {
             levelUpNotification = {
               newLevel: newLevel.levelNumber,
               levelName: newLevel.name,
               message: `¡Felicidades! Has alcanzado el Nivel ${newLevel.levelNumber}: ${newLevel.name}.`
             };
           }
         } else {
           logger.info(`User ${userId} level check - current: ${user.level}, calculated: ${newLevel?.levelNumber}`);
         }
       } catch (levelError) {
         logger.error(`Level calculation failed for user ${userId}:`, levelError);
         // Continue with the transaction even if level calculation fails
       }

       if (shouldManageTransaction) {
         await queryRunner.commitTransaction();
       }

       // Force level recalculation after transaction to ensure consistency
       try {
         const finalLevel = await this.calculateNewLevel(userId);
         if (finalLevel && finalLevel.levelNumber !== user.level) {
           logger.info(`Post-transaction level correction for user ${userId}: ${user.level} -> ${finalLevel.levelNumber}`);
           await this.userRepository.update(userId, {
             level: finalLevel.levelNumber,
             levelName: finalLevel.name
           });
         }
       } catch (postCommitError) {
         logger.error(`Post-commit level correction failed for user ${userId}:`, postCommitError);
       }

       // Check for new badges after transaction commit
       let newBadges = [];
       try {
         if (shouldManageTransaction) {
           // Create a new queryRunner for badge operations since the previous one was committed
           const badgeQueryRunner = AppDataSource.createQueryRunner();
           await badgeQueryRunner.connect();
           await badgeQueryRunner.startTransaction();

           newBadges = await this.checkAndAwardBadges(badgeQueryRunner, userId, actionType, metadata);
           await badgeQueryRunner.commitTransaction();
           await badgeQueryRunner.release();
         } else {
           // Use the same manager for badge operations when not using transactions
           newBadges = await this.checkAndAwardBadges(queryRunner, userId, actionType, metadata);
         }

         logger.info(`Badge check completed for user ${userId}: ${newBadges.length} new badges awarded`);
       } catch (badgeError) {
         logger.error(`Badge check failed for user ${userId}:`, badgeError);
         // Continue with the transaction even if badge check fails
       }
       const badgeNotifications = newBadges.map(badge => badge.name);

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
         logger.info(`Notification prepared for user ${userId}: levelUp=${!!levelUpNotification}, badges=${badgeNotifications.length}`);
       }

       return response;

     } catch (error) {
       if (shouldManageTransaction) {
         await queryRunner.rollbackTransaction();
       }
       throw error;
     } finally {
       if (shouldManageTransaction) {
         await queryRunner.release();
       }
     }
   }

  /**
   * Calculate new level based on points and specific conditions
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Level data
   */
  async calculateNewLevel(userId) {
    const levels = await this.levelRepository.find({
      order: { levelNumber: 'ASC' }
    });

    if (levels.length === 0) {
      throw new Error("No levels configured in database. Please run database seeding.");
    }

    // Find the highest level the user qualifies for
    let highestQualifiedLevel = null;

    for (const level of levels) {
      const qualifies = await this.checkLevelCriteria(userId, level.levelNumber);
      if (qualifies) {
        highestQualifiedLevel = level;
        logger.debug(`User ${userId} qualifies for level ${level.levelNumber}: ${level.name}`);
      } else {
        logger.debug(`User ${userId} does not qualify for level ${level.levelNumber}: ${level.name}`);
      }
    }

    if (highestQualifiedLevel) {
      logger.info(`User ${userId} highest qualified level: ${highestQualifiedLevel.levelNumber} - ${highestQualifiedLevel.name}`);
      return highestQualifiedLevel;
    }

    // Default to level 1 if no level qualifies
    const defaultLevel = await this.levelRepository.findOne({ where: { levelNumber: 1 } });
    if (!defaultLevel) {
      throw new Error("Level 1 not found in database. Please run database seeding.");
    }
    logger.info(`User ${userId} defaults to level 1: ${defaultLevel.name}`);
    return defaultLevel;
  }

  /**
   * Check if user meets level criteria
   * @param {string} userId - User ID
   * @param {number} levelNumber - Level number to check
   * @returns {Promise<boolean>} Whether user qualifies
   */
  async checkLevelCriteria(userId, levelNumber) {
    switch (levelNumber) {
      case 1:
        // Level 1: Registrarse y completar perfil (has profile_completed action)
        const profileCompleted = await this.userActionRepository.count({
          where: { userId, actionType: 'profile_completed' }
        });
        logger.debug(`User ${userId} profile completed actions: ${profileCompleted}`);
        return profileCompleted > 0;

      case 2:
        // Level 2: Tener al menos 3 reseñas (at least 3 review_created actions)
        // AND must have completed profile (level 1 requirement)
        const profileCompleted2 = await this.userActionRepository.count({
          where: { userId, actionType: 'profile_completed' }
        });
        const reviewCount = await this.userActionRepository.count({
          where: { userId, actionType: 'review_created' }
        });
        logger.info(`User ${userId} level 2 check - profile: ${profileCompleted2}, reviews: ${reviewCount}`);
        const qualifiesForLevel2 = profileCompleted2 > 0 && reviewCount >= 3;
        logger.info(`User ${userId} qualifies for level 2: ${qualifiesForLevel2}`);
        return qualifiesForLevel2;

      case 3:
        // Level 3: Obtener al menos 10 likes (at least 10 vote_received actions)
        // AND must qualify for level 2 (profile completed + 3 reviews)
        const profileCompleted3 = await this.userActionRepository.count({
          where: { userId, actionType: 'profile_completed' }
        });
        const reviewCount3 = await this.userActionRepository.count({
          where: { userId, actionType: 'review_created' }
        });
        const likeCount = await this.userActionRepository.count({
          where: { userId, actionType: 'vote_received' }
        });
        logger.debug(`User ${userId} level 3 check - profile: ${profileCompleted3}, reviews: ${reviewCount3}, likes: ${likeCount}`);
        return profileCompleted3 > 0 && reviewCount3 >= 3 && likeCount >= 10;

      case 4:
        // Level 4: Alcanzar 25 reseñas y 50 likes
        // AND must qualify for level 3 (all previous requirements)
        const profileCompleted4 = await this.userActionRepository.count({
          where: { userId, actionType: 'profile_completed' }
        });
        const reviewCount4 = await this.userActionRepository.count({
          where: { userId, actionType: 'review_created' }
        });
        const likeCount4 = await this.userActionRepository.count({
          where: { userId, actionType: 'vote_received' }
        });
        logger.debug(`User ${userId} level 4 check - profile: ${profileCompleted4}, reviews: ${reviewCount4}, likes: ${likeCount4}`);
        return profileCompleted4 > 0 && reviewCount4 >= 25 && likeCount4 >= 50;

      default:
        return false;
    }
  }

  /**
   * Check and award badges based on criteria
   * @param {QueryRunner} queryRunner - Database transaction runner (optional)
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
    return user && user.badges ? user.badges.some(badge => badge.name === badgeName) : false;
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

    // Specific badge criteria based on user story requirements
    if (badge.name === '🌍 Primera Reseña') {
      // Check if user has no previous reviews
      const reviewCount = await queryRunner.manager.count("Review", {
        where: { userId }
      });
      return reviewCount === 1; // Just created their first review
    }

    if (badge.name === '📸 Fotógrafo') {
      // Check if user has uploaded any media
      const mediaCount = await queryRunner.manager.count("ReviewMedia", {
        where: { review: { userId } }
      });
      return mediaCount > 0;
    }

    if (badge.name === '⭐ Popular') {
      // Check if user has received at least 5 likes on their reviews
      const likeCount = await queryRunner.manager.count("UserAction", {
        where: { actionType: 'vote_received', userId }
      });
      return likeCount >= 5;
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
      select: ['badges', 'email']
    });

    const newBadge = {
      name: badge.name,
      description: badge.description,
      earned_at: new Date().toISOString()
    };

    const updatedBadges = [...(user && user.badges ? user.badges : []), newBadge];

    await queryRunner.manager.update("User", userId, {
      badges: updatedBadges
    });

    // Send email notification asynchronously (don't block the transaction)
    try {
      if (user && user.email) {
        setImmediate(async () => {
          try {
            await emailService.sendBadgeNotification(user.email, badge);
            logger.info(`Badge notification sent to user ${userId} for badge: ${badge.name}`);
          } catch (emailError) {
            logger.error(`Failed to send badge notification email to user ${userId}:`, emailError);
          }
        });
      }
    } catch (error) {
      logger.error(`Error preparing badge notification for user ${userId}:`, error);
      // Don't throw - we don't want email failures to break badge assignment
    }
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

      // Calculate new level based on actions, not just points
      const newLevel = await this.calculateNewLevel(userId);

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