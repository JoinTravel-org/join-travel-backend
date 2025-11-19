import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import logger from "./config/logger.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { swaggerUi, specs } from "./config/swagger.js";

const app = express();

// Trust proxy for rate limiting behind reverse proxy/load balancer
app.set('trust proxy', 1);

app.use(express.json());
app.use(cors());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan("dev"));

// Serve static files for uploads
app.use('/uploads/avatars', express.static(path.join(process.cwd(), 'uploads', 'avatars')));
app.use('/uploads/reviews', express.static(path.join(process.cwd(), 'uploads', 'reviews')));

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the application and database connectivity
 *     responses:
 *       200:
 *         description: Application and database are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 database:
 *                   type: string
 *                   example: connected
 *                 timestamp:
 *                   type: string
 *                   example: "2023-10-30T20:15:45.000Z"
 *       503:
 *         description: Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 database:
 *                   type: string
 *                   example: disconnected
 *                 timestamp:
 *                   type: string
 *                   example: "2023-10-30T20:15:45.000Z"
 */
app.get('/health', async (req, res) => {
  const { AppDataSource } = await import('./load/typeorm.loader.js');
  const timestamp = new Date().toISOString();

  try {
    // Check database connectivity
    await AppDataSource.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp
    });
  } catch (error) {
    logger.error('Database health check failed:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp
    });
  }
});

// Load routes
app.use("", routes);

// Global error handler
app.use(errorHandler);

export default app;
