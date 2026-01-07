import redis from "../config/redis.js";
import logger from "../utils/logger.js";

class CacheService {
  constructor() {
    this.defaultTTL = parseInt(process.env.CACHE_TTL) || 3600;
    this.prefix = "cache:";
  }

  generateKey(type, id) {
    return `${this.prefix}${type}:${id}`;
  }

  async get(key) {
    try {
      const data = await redis.get(key);

      if (data) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(data);
      }

      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      logger.debug(`Cache set: ${key}, TTL: ${ttl}s`);
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      await redis.del(key);
      logger.debug(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async deletePattern(pattern) {
    try {
      const keys = await redis.keys(`${this.prefix}${pattern}`);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(
          `Cache pattern deleted: ${pattern}, count: ${keys.length}`
        );
      }

      return true;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return false;
    }
  }

  async clear() {
    try {
      const keys = await redis.keys(`${this.prefix}*`);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Cache cleared: ${keys.length} keys deleted`);
      }

      return true;
    } catch (error) {
      logger.error("Cache clear error:", error);
      return false;
    }
  }
}

export default new CacheService();
