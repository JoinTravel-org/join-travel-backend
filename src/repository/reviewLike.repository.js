import { AppDataSource } from "../load/typeorm.loader.js";

class ReviewLikeRepository {
  constructor() {
    this.repository = AppDataSource.getRepository("ReviewLike");
  }

  /**
    * Create a new like/dislike for a review
    * @param {Object} likeData - Like data
    * @param {string} likeData.reviewId - Review ID
    * @param {string} likeData.userId - User ID
    * @param {string} likeData.type - Type ('like' or 'dislike')
    * @returns {Promise<Object>} Created like
    */
   async create(likeData) {
     const like = this.repository.create(likeData);
     return await this.repository.save(like);
   }

  /**
    * Find a like/dislike by review ID and user ID
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
       where: { reviewId, type: "like" }
     });
   }

   /**
    * Count dislikes for a review
    * @param {string} reviewId - Review ID
    * @returns {Promise<number>} Number of dislikes
    */
   async countDislikesByReviewId(reviewId) {
     return await this.repository.count({
       where: { reviewId, type: "dislike" }
     });
   }

   /**
    * Get counts for both likes and dislikes for a review
    * @param {string} reviewId - Review ID
    * @returns {Promise<{likes: number, dislikes: number}>} Object with like and dislike counts
    */
   async getCountsByReviewId(reviewId) {
     const [likes, dislikes] = await Promise.all([
       this.countByReviewId(reviewId),
       this.countDislikesByReviewId(reviewId)
     ]);
     return { likes, dislikes };
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
       where: { reviewId, userId, type: "like" }
     });
     return count > 0;
   }

   /**
    * Check if user has disliked a review
    * @param {string} reviewId - Review ID
    * @param {string} userId - User ID
    * @returns {Promise<boolean>} Whether user has disliked the review
    */
   async hasUserDisliked(reviewId, userId) {
     const count = await this.repository.count({
       where: { reviewId, userId, type: "dislike" }
     });
     return count > 0;
   }

   /**
    * Get user's reaction type for a review
    * @param {string} reviewId - Review ID
    * @param {string} userId - User ID
    * @returns {Promise<string|null>} 'like', 'dislike', or null if no reaction
    */
   async getUserReaction(reviewId, userId) {
     const reaction = await this.repository.findOne({
       where: { reviewId, userId },
       select: ['type']
     });
     return reaction ? reaction.type : null;
   }
}

export default new ReviewLikeRepository();