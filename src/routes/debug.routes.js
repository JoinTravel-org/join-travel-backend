import { Router } from "express";
import { AppDataSource } from "../load/typeorm.loader.js";
import logger from "../config/logger.js";
import seedDatabase from "../load/seed.loader.js";

const router = Router();

/**
 * @swagger
 * /api/debug/reset-database:
 *   delete:
 *     summary: Reset all database tables
 *     description: Completely resets the database by dropping all tables and recreating the schema. This endpoint is for development and testing purposes only.
 *     tags: [Debug]
 *     responses:
 *       200:
 *         description: Database reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Database reset successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "All tables dropped and schema recreated"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Detailed error information"
 */
router.delete("/reset-database", async (req, res, next) => {
  try {
    logger.warn("Database reset requested via debug endpoint");

    // Drop all tables
    await AppDataSource.dropDatabase();
    logger.info("All tables dropped");

    // Recreate schema
    await AppDataSource.synchronize();
    logger.info("Database schema recreated");

    res.status(200).json({
      success: true,
      message: "Database reset successfully",
      data: {
        message: "All tables dropped and schema recreated"
      }
    });
  } catch (err) {
    logger.error("Database reset failed:", err.message);
    next(err);
  }
});

/**
 * @swagger
 * /api/debug/seed-database:
 *   post:
 *     summary: Seed database with initial data
 *     description: Seeds the database with initial data. This endpoint is for development and testing purposes only.
 *     tags: [Debug]
 *     responses:
 *       200:
 *         description: Database seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Database seeded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Database seeded with initial data"
 *       409:
 *         description: Database already contains data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Database already contains data"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Detailed error information"
 */
router.post("/seed-database", async (req, res, next) => {
  try {
    logger.info("Database seeding requested via debug endpoint");

    // Seed the database
    await seedDatabase();

    res.status(200).json({
      success: true,
      message: "Database seeded successfully",
      data: {
        message: "Database seeded with initial data"
      }
    });
  } catch (err) {
    logger.error("Database seeding failed:", err.message);
    if (err.message.includes("already has")) {
      return res.status(409).json({
        success: false,
        message: "Database already contains data"
      });
    }
    next(err);
  }
});

export default router;