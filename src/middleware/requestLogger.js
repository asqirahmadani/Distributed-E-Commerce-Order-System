import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

const requestLogger = logger.child("Request");

export default function requestLogging(req, res, next) {
  // assign unique request ID
  req.id = uuidv4();

  // start timer
  const startTime = Date.now();

  // log request
  requestLogger.info("Incoming request", {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const logLevel =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    requestLogger[logLevel]("Request completed", {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
    });

    return originalSend.call(this, data);
  };

  next();
}
