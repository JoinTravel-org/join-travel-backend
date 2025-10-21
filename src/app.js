import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { swaggerUi, specs } from "./config/swagger.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Load routes
app.use("", routes);

// Global error handler
app.use(errorHandler);

export default app;
