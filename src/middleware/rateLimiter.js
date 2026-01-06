import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

import redis from "../config/redis.js";

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => {
      const [command, ...params] = args;
      return redis.call(command, ...params);
    },
    prefix: "rl:",
  }),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again.",
  standardHeaders: true,
  legacyHeaders: false,
});

export default limiter;
