import { AppDataSource } from "./typeorm.loader.js";

export default async function connectDB(maxRetries = 5, retryDelay = 2000) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await AppDataSource.initialize();
      console.log("Database connected successfully");
      return;
    } catch (err) {
      retries++;
      console.error(`Database connection attempt ${retries}/${maxRetries} failed:`, err.message);

      if (retries < maxRetries) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error("Database connection failed after all retries:", err);
        process.exit(1);
      }
    }
  }
}
