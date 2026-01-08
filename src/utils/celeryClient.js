import { v4 as uuidv4 } from "uuid";

import redis from "../config/redis.js";
import logger from "./logger.js";

class CeleryClient {
  constructor() {
    this.redis = redis;
    this.taskQueue = "celery";
  }

  /* 
  Send task to celery worker
  */
  async sendTask(taskName, args = [], kwargs = {}, options = {}) {
    try {
      const taskId = options.taskId || uuidv4();

      const taskMessage = {
        id: taskId,
        task: taskName,
        args: args,
        kwargs: kwargs,
        retries: 0,
        eta: options.eta || null,
        expires: options.expires || null,
        ...options,
      };

      const message = JSON.stringify([
        taskMessage.args,
        taskMessage.kwargs,
        {
          callbacks: null,
          errbacks: null,
          chain: null,
          chord: null,
        },
      ]);

      const headers = {
        id: taskId,
        task: taskName,
        lang: "js",
        root_id: taskId,
        parent_id: null,
        group: null,
        retries: 0,
        eta: taskMessage.eta,
        expires: taskMessage.expires,
      };

      const celeryMessage = {
        body: Buffer.from(message).toString("base64"),
        "content-encoding": "utf-8",
        "content-type": "application/json",
        headers: headers,
        properties: {
          correlation_id: taskId,
          reply_to: uuidv4(),
          delivery_mode: 2,
          delivery_info: {
            exchange: "",
            routing_key: this.taskQueue,
          },
          priority: 0,
          body_encoding: "base64",
          delivery_tag: uuidv4(),
        },
      };

      // push to redis list (celery broker)
      await this.redis.lpush(this.taskQueue, JSON.stringify(celeryMessage));

      logger.info(`Celery task queued: ${taskName} (ID: ${taskId})`);

      return taskId;
    } catch (error) {
      logger.error("Error sending Celery task:", error);
      throw error;
    }
  }

  /* 
  Get task result
  */
  async getTaskResult(taskId) {
    try {
      const resultKey = `celery-task-meta-${taskId}`;
      const result = await this.redis.get(resultKey);

      if (!result) {
        return null;
      }

      return JSON.parse(result);
    } catch (error) {
      logger.error(`Error getting task result for ${taskId}:`, error);
      throw error;
    }
  }

  /* 
  Check if task is completed
  */
  async isTaskComplete(taskId) {
    try {
      const result = await this.getTaskResult(taskId);
      return result && result.status === "SUCCESS";
    } catch (error) {
      return false;
    }
  }
}

export default new CeleryClient();
