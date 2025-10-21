import { createServer } from "http";
import app from "./app.js";
import config from "./config/index.js";
import logger from "./config/logger.js";
import { AppDataSource } from "./load/typeorm.loader.js";

import connectDB from "./load/database.loader.js";
const server = createServer(app);

const PORT = config.port;

(async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);

    // Close HTTP server
    server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connection
        try {
            if (AppDataSource.isInitialized) {
                await AppDataSource.destroy();
                logger.info('Database connection closed');
            }
        } catch (error) {
            logger.error('Error closing database connection:', error);
        }

        logger.info('Process terminated');
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();
