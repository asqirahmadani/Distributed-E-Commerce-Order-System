import { ValidationError as SequelizeValidationError } from "sequelize";
import { AppError } from "../utils/error.js";
import logger from "../utils/logger.js";

const errorLogger = logger.child("ErrorHandler");

/* 
Error handler middleware
*/
function errorHandler(err, req, res, next) {
  // log error with context
  const errorContext = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    requestId: req.id || "unknown",
  };

  if (err.isOperational) {
    errorLogger.warn(err.message, {
      code: err.code,
      statusCode: err.statusCode,
      ...errorContext,
    });
  } else {
    errorLogger.error("Unexpected error occured", {
      error: err.message,
      stack: err.stack,
      ...errorContext,
    });
  }

  // handle specific error types
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // handle sequelize validation errors
  if (err instanceof SequelizeValidationError) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
        value: e.value,
      })),
    });
  }

  // handle sequelize database errors
  if (err.name === "SequelizeDatabaseError") {
    return res.status(500).json({
      success: false,
      error: "Database error occurred",
      code: "DATABASE_ERROR",
      ...(process.env.NODE_ENV !== "production" && { details: err.message }),
    });
  }

  // handle sequlize unique constraint errors
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      error: "Resource already exists",
      code: "DUPLICATE_RESOURCE",
      details: err.errors.map((e) => ({
        field: e.path,
        message: "Must be unique",
      })),
    });
  }

  // handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expired",
      code: "TOKEN_EXPIRED",
    });
  }

  // default error (500)
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    code: "INTERNAL_ERROR",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

/* 
404 not found handler
*/
export function notFoundHandler(req, res) {
  const errorContext = {
    method: req.method,
    path: req.path,
    ip: req.ip,
  };

  errorLogger.warn("Route not found", errorContext);

  res.status(404).json({
    success: false,
    error: "Route not found",
    code: "ROUTE_NOT_FOUND",
    path: req.path,
  });
}

/* 
Async handler wrapper to catch promise rejection
*/
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default errorHandler;
