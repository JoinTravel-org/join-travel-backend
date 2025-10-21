import { AppDataSource } from "./typeorm.loader.js";

export default async function connectDB() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}
