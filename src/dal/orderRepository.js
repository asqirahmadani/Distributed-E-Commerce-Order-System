import { Order, Product, sequelize } from "../models/index.js";
import logger from "../utils/logger.js";

class OrderRepository {
  // create order with transaction support
  async create(orderData, transaction = null) {
    try {
      const order = await Order.create(orderData, { transaction });
      logger.info(`Order created: ${order.id}`);
      return order;
    } catch (error) {
      logger.error("Error create order:", error);
      throw error;
    }
  }

  async findProductWithLock(productId, transaction) {
    try {
      const product = await Product.findByPk(productId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      return product;
    } catch (error) {
      logger.error(`Error finding product with lock ${productId}:`.error);
      throw error;
    }
  }

  // update product stock within a transaction
  async updateProductStock(productId, newStock, transaction) {
    try {
      const [updatedRows] = await Product.update(
        { stock: newStock },
        {
          where: { id: productId },
          transaction,
        }
      );

      return updatedRows > 0;
    } catch (error) {
      logger.error(`Error updating product stock ${productId}:`, error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const order = await Order.findByPk(id, {
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "price", "stock"],
          },
        ],
      });

      return order;
    } catch (error) {
      logger.error(`Error finding order ${id}:`, error);
      throw error;
    }
  }

  async findAll(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = null,
        productId = null,
      } = options;

      const where = {};
      if (status) where.status = status;
      if (productId) where.productId = productId;

      const { count, rows } = await Order.findAndCountAll({
        where,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "price", "stock"],
          },
        ],
      });

      return {
        orders: rows,
        total: count,
        limit,
        offset,
      };
    } catch (error) {
      logger.error("Error finding orders:", error);
      throw error;
    }
  }

  async updateStatus(id, status, transaction = null) {
    try {
      const [updatedRows] = await Order.update(
        { status },
        {
          where: { id },
          transaction,
        }
      );

      if (updatedRows > 0) {
        logger.info(`Order ${id} status updated to ${status}`);
      }

      return updatedRows > 0;
    } catch (error) {
      logger.error(`Error updating order status ${id}:`, error);
      throw error;
    }
  }
}

export default new OrderRepository();
