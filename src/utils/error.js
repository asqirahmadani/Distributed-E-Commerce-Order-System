export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV !== "production" && { stack: this.stack }),
    };
  }
}

/* 
Not found error (404)
*/
export class NotFoundError extends AppError {
  constructor(resource, identifier = null) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND");
    this.resource = resource;
    this.identifier = identifier;
  }
}

/* 
Conflict error (409)
*/
export class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, "CONFLICT");
    this.details = details;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(this.details && { details: this.details }),
    };
  }
}

/* 
Insufficient stock error (409)
*/
export class InsufficientStockError extends ConflictError {
  constructor(requested, available) {
    super("Insufficient stock available", {
      requested,
      available,
    });
    this.code = "INSUFFICIENT_STOCK";
  }
}

/* 
Database error (500)
*/
export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, "DATABASE_ERROR");
    this.originalError = originalError;
  }
}

/* 
External service error (503)
*/
export class ExternalServiceError extends AppError {
  constructor(serviceName, message = "External service unavailable") {
    super(message, 503, "SERVICE_UNAVAILABLE");
    this.serviceName = serviceName;
  }
}
