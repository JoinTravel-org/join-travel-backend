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
    const usersData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/load/seed_data/users.json"), "utf8"));
    const placesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/load/seed_data/places.json"), "utf8"));
    const reviewsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/load/seed_data/reviews.json"), "utf8"));

    // Seed users first
    logger.info(`Found ${usersData.length} users in seed data`);
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
              // Check if filePath exists and try to read actual file, otherwise use placeholder
              let fileData = mediaData.fileData;
              if (mediaData.filePath) {
                try {
                  const fullPath = path.join(process.cwd(), mediaData.filePath);
                  if (fs.existsSync(fullPath)) {
                    fileData = fs.readFileSync(fullPath);
                    logger.info(`Loaded actual file: ${mediaData.filePath}`);
                  } else {
                    logger.warn(`File not found: ${mediaData.filePath}, using placeholder`);
                    if (typeof fileData === 'string' && fileData.startsWith('PLACEHOLDER_')) {
                      fileData = Buffer.from(fileData, 'utf8');
                    } else {
                      fileData = Buffer.from(fileData, 'base64');
                    }
                  }
                } catch (fileError) {
                  logger.error(`Error reading file ${mediaData.filePath}:`, fileError.message);
                  if (typeof fileData === 'string' && fileData.startsWith('PLACEHOLDER_')) {
                    fileData = Buffer.from(fileData, 'utf8');
                  } else {
                    fileData = Buffer.from(fileData, 'base64');
                  }
                }
              } else if (typeof fileData === 'string') {
                if (fileData.startsWith('PLACEHOLDER_')) {
                  fileData = Buffer.from(fileData, 'utf8');
                } else {
                  fileData = Buffer.from(fileData, 'base64');
                }
              }

              const mediaRecord = await reviewMediaRepository.create({
                reviewId: review.id,
                filename: mediaData.filename,
                originalFilename: mediaData.originalFilename,
                fileSize: mediaData.fileSize,
                mimeType: mediaData.mimeType,
                fileData: fileData,
                filePath: null // Don't store filePath in database, only raw binary data
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
