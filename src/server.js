import app from "./app.js";

import logger from "./utils/logger.js";

const PORT = process.env.API_PORT || 3000;

async function startServer() {
  try {
    // test database connection
    logger.info("Database connection later...");

    // start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error("Unable to start server:", error);
    process.exit(1);
  }
}

// graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

startServer();
