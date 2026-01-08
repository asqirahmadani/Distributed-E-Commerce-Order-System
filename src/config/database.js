import { Sequelize } from "sequelize";
import dotenv from "dotenv";

import logger from "../utils/logger.js";

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging:
    process.env.NODE_ENV === "development" ? (msg) => logger.debug(msg) : false,
  pool: {
    max: process.env.NODE_ENV === "production" ? 20 : 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
