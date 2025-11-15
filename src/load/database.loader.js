import logger from "../config/logger.js";
import { AppDataSource } from "./typeorm.loader.js";
import { createDatabase } from "typeorm-extension";
import seedDatabase from "./seed.loader.js";

export default async function connectDB(maxRetries = 5, retryDelay = 2000) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // First, try to create the database if it doesn't exist
      await createDatabase({
        ifNotExist: true,
        options: {
          type: "postgres",
          host: process.env.POSTGRES_HOST,
          port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: "postgres", // Connect to default postgres database first
        },
        initialDatabase: process.env.POSTGRES_DB,
      });

      // Now connect to the actual database
      await AppDataSource.initialize();
      logger.info("Database connected successfully");

      // Seed the database with initial data
      await seedDatabase();

      return;
    } catch (err) {
      retries++;
      console.error(`Database connection attempt ${retries}/${maxRetries} failed:`, err.message);

      if (retries < maxRetries) {
        logger.info(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error("Database connection failed after all retries:", err);
        process.exit(1);
      }
    }
  }
}
