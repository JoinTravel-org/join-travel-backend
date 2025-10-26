import { AppDataSource } from "./typeorm.loader.js";
import placeRepository from "../repository/place.repository.js";
import logger from "../config/logger.js";
import fs from "fs";
import path from "path";

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

    logger.info("Seeding database with places...");
    const seedData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/load/seed_data.json"), "utf8"));
    const placesData = seedData["places"];

    for (const placeData of placesData) {
      try {
        await placeRepository.create(placeData);
        logger.info(`Seeded place: ${JSON.stringify(placeData)}`);
      } catch (error) {
        logger.error(`Failed to seed place ${placeData.name}:`, error.message);
      }
    }

    logger.info("Database seeding completed successfully");
  } catch (error) {
    logger.error("Database seeding failed:", error);
    throw error;
  }
}
