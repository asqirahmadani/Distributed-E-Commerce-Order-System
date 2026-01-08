import compression from "compression";
import express from "express";
import helmet from "helmet";
import cors from "cors";

import errorHandler, { notFoundHandler } from "./middleware/errorHandler.js";
import requestLogging from "./middleware/requestLogger.js";
import rateLimiter from "./middleware/rateLimiter.js";
import { sequelize } from "./models/index.js";
import logger from "./utils/logger.js";
import redis from "./config/redis.js";
import routes from "./api/routes.js";

const app = express();

// security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// rate limiting
app.use("/api", rateLimiter);

// request logging
app.use(requestLogging);

// request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// health check endpoint
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    await redis.ping();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: {
        database: "connected",
        redis: "connected",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API routes
app.use("/api", routes);

// 404 handler
app.use(notFoundHandler);

// error handling middleware
app.use(errorHandler);

export default app;
