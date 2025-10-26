import { Repository } from "typeorm";
import { AppDataSource } from "../load/typeorm.loader.js";
import Itinerary, { ItineraryItemSchema } from "../models/itinerary.model.js";
import logger from "../config/logger.js";

class ItineraryRepository {
  constructor() {
    this.itineraryRepository = AppDataSource.getRepository(Itinerary);
    this.itineraryItemRepository = AppDataSource.getRepository(ItineraryItemSchema);
  }

  /**
   * Creates a new itinerary with its items
   * @param {Object} itineraryData - The itinerary data
   * @param {string} itineraryData.name - The itinerary name
   * @param {string} itineraryData.userId - The user ID
   * @param {Array} itineraryData.items - Array of itinerary items
   * @returns {Promise<Object>} The created itinerary
   */
  async createItinerary(itineraryData) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      logger.info(`Creating itinerary: ${itineraryData.name} for user: ${itineraryData.userId}`);

      // Create the itinerary
      const itinerary = this.itineraryRepository.create({
        name: itineraryData.name,
        userId: itineraryData.userId,
      });

      const savedItinerary = await queryRunner.manager.save(Itinerary, itinerary);

      // Create itinerary items
      const items = itineraryData.items.map(item => 
        this.itineraryItemRepository.create({
          itineraryId: savedItinerary.id,
          placeId: item.placeId,
          date: item.date,
        })
      );

      const savedItems = await queryRunner.manager.save(ItineraryItemSchema, items);

      await queryRunner.commitTransaction();

      logger.info(`Itinerary created successfully: ${savedItinerary.id}`);

      return {
        ...savedItinerary,
        items: savedItems,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error(`Error creating itinerary: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Gets an itinerary by ID with its items and place details
   * @param {string} itineraryId - The itinerary ID
   * @returns {Promise<Object|null>} The itinerary with items and places
   */
  async getItineraryById(itineraryId) {
    try {
      logger.info(`Getting itinerary by ID: ${itineraryId}`);

      const itinerary = await this.itineraryRepository.findOne({
        where: { id: itineraryId },
        relations: ["items", "items.place", "user"],
      });

      if (!itinerary) {
        logger.warn(`Itinerary not found: ${itineraryId}`);
        return null;
      }

      logger.info(`Itinerary retrieved successfully: ${itineraryId}`);
      return itinerary;
    } catch (error) {
      logger.error(`Error getting itinerary by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets all itineraries for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of user's itineraries
   */
  async getUserItineraries(userId) {
    try {
      logger.info(`Getting itineraries for user: ${userId}`);

      const itineraries = await this.itineraryRepository.find({
        where: { userId },
        relations: ["items", "items.place"],
        order: { createdAt: "DESC" },
      });

      logger.info(`Retrieved ${itineraries.length} itineraries for user: ${userId}`);
      return itineraries;
    } catch (error) {
      logger.error(`Error getting user itineraries: ${error.message}`);
      throw error;
    }
  }

  /**
   * Checks if an itinerary name already exists for a user
   * @param {string} name - The itinerary name
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>} True if name exists, false otherwise
   */
  async checkItineraryNameExists(name, userId) {
    try {
      logger.info(`Checking if itinerary name exists: ${name} for user: ${userId}`);

      const existingItinerary = await this.itineraryRepository.findOne({
        where: { name, userId },
      });

      const exists = !!existingItinerary;
      logger.info(`Itinerary name exists: ${exists}`);
      return exists;
    } catch (error) {
      logger.error(`Error checking itinerary name: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates an itinerary
   * @param {string} itineraryId - The itinerary ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} The updated itinerary
   */
  async updateItinerary(itineraryId, updateData) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      logger.info(`Updating itinerary: ${itineraryId}`);

      // Update itinerary basic info
      if (updateData.name) {
        await queryRunner.manager.update(Itinerary, itineraryId, {
          name: updateData.name,
        });
      }

      // Update items if provided
      if (updateData.items) {
        // Delete existing items
        await queryRunner.manager.delete(ItineraryItemSchema, { itineraryId });

        // Create new items
        const items = updateData.items.map(item => 
          this.itineraryItemRepository.create({
            itineraryId,
            placeId: item.placeId,
            date: item.date,
          })
        );

        await queryRunner.manager.save(ItineraryItemSchema, items);
      }

      await queryRunner.commitTransaction();

      // Return updated itinerary
      const updatedItinerary = await this.getItineraryById(itineraryId);
      logger.info(`Itinerary updated successfully: ${itineraryId}`);
      return updatedItinerary;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error(`Error updating itinerary: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deletes an itinerary
   * @param {string} itineraryId - The itinerary ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteItinerary(itineraryId) {
    try {
      logger.info(`Deleting itinerary: ${itineraryId}`);

      const result = await this.itineraryRepository.delete(itineraryId);
      const deleted = result.affected > 0;

      if (deleted) {
        logger.info(`Itinerary deleted successfully: ${itineraryId}`);
      } else {
        logger.warn(`Itinerary not found for deletion: ${itineraryId}`);
      }

      return deleted;
    } catch (error) {
      logger.error(`Error deleting itinerary: ${error.message}`);
      throw error;
    }
  }
}

export default new ItineraryRepository();
