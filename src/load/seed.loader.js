import { AppDataSource } from "./typeorm.loader.js";
import placeRepository from "../repository/place.repository.js";
import UserRepository from "../repository/user.repository.js";
import reviewRepository from "../repository/review.repository.js";
import reviewMediaRepository from "../repository/reviewMedia.repository.js";
import logger from "../config/logger.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";

export default async function seedDatabase() {
  try {
    // Check if places already exist
    const existingPlaces = await placeRepository.getRepository().count();
    if (existingPlaces > 0) {
      logger.info(
        `Database already has ${existingPlaces} places, skipping seed`
      );
      return;
    }

    logger.info("Seeding database with users, places, reviews, and media...");
    const seedData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/load/seed_data.json"), "utf8"));

    // Seed users first
    logger.info(`Found ${seedData["users"]?.length || 0} users in seed data`);
    const usersData = seedData["users"] || [];
    const createdUsers = [];
    const userRepo = new UserRepository();
    for (const userData of usersData) {
      logger.info(`Attempting to create user: ${userData.email}`);
      try {
        // Hash the password before creating user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        logger.info(`Password hashed for user: ${userData.email}`);
        const user = await userRepo.create({
          ...userData,
          password: hashedPassword
        });
        createdUsers.push(user);
        logger.info(`Seeded user: ${user.email} with ID: ${user.id}`);
      } catch (error) {
        logger.error(`Failed to seed user ${userData.email}:`, error.message);
        logger.error(`Error details:`, error);
        // Don't add to createdUsers array if creation failed
        continue;
      }
    }
    logger.info(`Total users created: ${createdUsers.length}`);
    logger.info(`Created users IDs: ${createdUsers.map(u => u.id).join(', ')}`);

    // Seed places
    const placesData = seedData["places"] || [];
    const createdPlaces = [];
    for (const placeData of placesData) {
      try {
        const place = await placeRepository.create(placeData);
        createdPlaces.push(place);
        logger.info(`Seeded place: ${place.name}`);
      } catch (error) {
        logger.error(`Failed to seed place ${placeData.name}:`, error.message);
        // Don't add to createdPlaces array if creation failed
        continue;
      }
    }
    logger.info(`Total places created: ${createdPlaces.length}`);

    // Seed reviews and media
    const reviewsData = seedData["reviews"] || [];
    for (const reviewData of reviewsData) {
      try {
        const { media, placeId: placeIndex, userId: userIndex, ...reviewFields } = reviewData;

        // Map indices to actual UUIDs (1-based indices in JSON map to 0-based array indices)
        const placeId = createdPlaces[placeIndex - 1]?.id;
        const userId = createdUsers[userIndex - 1]?.id;

        if (!placeId || !userId) {
          logger.error(`Invalid placeId (${placeIndex}) or userId (${userIndex}) for review - placeId: ${placeId}, userId: ${userId}`);
          continue;
        }

        const review = await reviewRepository.create({
          ...reviewFields,
          placeId,
          userId
        });
        logger.info(`Seeded review for place ${placeId} by user ${userId}`);

        // Seed media for this review
        if (media && media.length > 0) {
          for (const mediaData of media) {
            try {
              // Convert base64 string to Buffer if it's a string
              let fileData = mediaData.fileData;
              if (typeof fileData === 'string') {
                fileData = Buffer.from(fileData, 'base64');
              }

              const mediaRecord = await reviewMediaRepository.create({
                ...mediaData,
                reviewId: review.id,
                fileData: fileData
              });
              logger.info(`Seeded media ${mediaRecord.filename} for review ${review.id}`);
            } catch (mediaError) {
              logger.error(`Failed to seed media for review:`, mediaError.message);
            }
          }
        }
      } catch (error) {
        logger.error(`Failed to seed review:`, error.message);
      }
    }

    logger.info("Database seeding completed successfully");
  } catch (error) {
    logger.error("Database seeding failed:", error);
    throw error;
  }
}
