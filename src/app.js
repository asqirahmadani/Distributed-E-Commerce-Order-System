import compression from "compression";
import express from "express";
import helmet from "helmet";
import cors from "cors";

import errorHandler from "./middleware/errorHandler.js";
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
app.use(express.urlencoded({ extended: true }));

// rate limiting
app.use(rateLimiter);

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
app.use((req, res) => {
  res.status(404).json({ error: "Route not found!" });
});

// error handling middleware
app.use(errorHandler);

export default app;
