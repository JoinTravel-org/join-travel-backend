import { AppDataSource } from "../load/typeorm.loader.js";

class ReviewLikeRepository {
  constructor() {
    this.repository = AppDataSource.getRepository("ReviewLike");
  }

  /**
   * Create a new like for a review
   * @param {Object} likeData - Like data
   * @param {string} likeData.reviewId - Review ID
   * @param {string} likeData.userId - User ID
   * @returns {Promise<Object>} Created like
   */
  async create(likeData) {
    const like = this.repository.create(likeData);
    return await this.repository.save(like);
  }

  /**
   * Find a like by review ID and user ID
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Like or null
   */
  async findByReviewIdAndUserId(reviewId, userId) {
    return await this.repository.findOne({
      where: { reviewId, userId }
    });
  }

  /**
   * Delete a like by review ID and user ID
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteByReviewIdAndUserId(reviewId, userId) {
    const result = await this.repository.delete({ reviewId, userId });
    return result.affected > 0;
  }

  /**
   * Count likes for a review
   * @param {string} reviewId - Review ID
   * @returns {Promise<number>} Number of likes
   */
  async countByReviewId(reviewId) {
    return await this.repository.count({
      where: { reviewId }
    });
  }

  /**
   * Get all likes for a review with user details
   * @param {string} reviewId - Review ID
   * @returns {Promise<Array>} Array of likes with user details
   */
  async findByReviewId(reviewId) {
    return await this.repository.find({
      where: { reviewId },
      relations: ['user'],
      select: {
        id: true,
        reviewId: true,
        userId: true,
        createdAt: true,
        user: {
          id: true,
          email: true
        }
      }
    });
  }

  /**
   * Check if user has liked a review
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user has liked the review
   */
  async hasUserLiked(reviewId, userId) {
    const count = await this.repository.count({
      where: { reviewId, userId }
    });
    return count > 0;
  }
}

export default new ReviewLikeRepository();