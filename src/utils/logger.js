import {
  createLogger,
  format as _format,
  transports as _transports,
} from "winston";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// custom format to sanitize sensitive data
const sanitizeFormat = _format((info) => {
  // remove sensitive fields
  const sensitiveFields = [
    "password",
    "token",
    "apiKey",
    "secret",
    "authorization",
    "creditCard",
    "ssn",
  ];

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    const sanitized = { ...obj };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();

      // check if key contains sensitive field names
      if (
        sensitiveFields.some((field) => lowerKey.includes(field.toLowerCase()))
      ) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof sanitized[key] === "object") {
        sanitized[key] = sanitizeObject(sanitized[key]);
      }
    }

    return sanitized;
  };

  info.message =
    typeof info.message === "object"
      ? sanitizeObject(info.message)
      : info.message;

  if (info.meta) {
    info.meta = sanitizeObject(info.meta);
  }

  return info;
});

// custom format for console output
const consoleFormat = _format.combine(
  _format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  _format.errors({ stack: true }),
  sanitizeFormat(),
  _format.colorize(),
  _format.printf(({ timestamp, level, message, context, ...meta }) => {
    let log = `${timestamp} [${level}]`;

    if (context) {
      log += ` [${context}]`;
    }

    log += `: ${message}`;

    // add metadata if present
    const metaKeys = Object.keys(meta).filter(
      (key) => !["timestamp", "level", "message", "context"].includes(key)
    );

    if (metaKeys.length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    return log;
  })
);

// JSON format for external logging
const jsonFormat = _format.combine(
  _format.timestamp(),
  _format.errors({ stack: true }),
  sanitizeFormat(),
  _format.json()
);

// create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: jsonFormat,
  defaultMeta: {
    service: "order-api",
    environment: process.env.NODE_ENV || "development",
  },
  transports: [
    // console output
    new _transports.Console({
      format: consoleFormat,
    }),

    // error log file
    new _transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
      maxsize: 10485760,
      maxFiles: 5,
    }),

    // combined log file
    new _transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
});

// extend logger with context support
logger.child = (context) => {
  return {
    debug: (message, meta = {}) => logger.debug(message, { context, ...meta }),
    info: (message, meta = {}) => logger.info(message, { context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { context, ...meta }),
    error: (message, meta = {}) => logger.error(message, { context, ...meta }),
  };
};

export default logger;
