import { Transaction } from "sequelize";

import orderRepository from "../dal/orderRepository.js";
import celeryClient from "../utils/celeryClient.js";
import { sequelize } from "../models/index.js";
import cacheService from "./cacheService.js";
import logger from "../utils/logger.js";

class OrderService {
  // create order with race condition safety
  async createOrder(orderData) {
    const { productId, quantity, customerEmail } = orderData;

    const transaction = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      // lock product row
      const product = await orderRepository.findProductWithLock(
        productId,
        transaction
      );

      if (!product) {
        await transaction.rollback();
        return {
          success: false,
          error: "Product not found",
          code: "PRODUCT_NOT_FOUND",
        };
      }

      // check stock availability
      if (product.stock < quantity) {
        await transaction.rollback();
        logger.warn(
          `Insufficient stock for product ${productId}. Required: ${quantity}, Available: ${product.stock}`
        );

        return {
          success: false,
          error: "Insufficient stock",
          code: "INSUFFICIENT_STOCK",
          details: {
            requested: quantity,
            available: product.stock,
          },
        };
      }

      // calculate prices
      const pricePerUnit = parseFloat(product.price);
      const totalPrice = pricePerUnit * quantity;

      // deduct stock
      const newStock = product.stock - quantity;
      await orderRepository.updateProductStock(
        productId,
        newStock,
        transaction
      );

      // create order
      const order = await orderRepository.create(
        {
          productId,
          productName: product.name,
          quantity,
          pricePerUnit,
          totalPrice,
          status: "completed",
          customerEmail,
        },
        transaction
      );

      await transaction.commit();

      const cacheKey = cacheService.generateKey("product", productId);
      await cacheService.delete(cacheKey);

      logger.info(
        `Order created succesfully: ${order.id}, Product: ${productId}, Quantity: ${quantity}, New Stock: ${newStock}`
      );

      // trigger background tasks (non-blocking)
      this.triggerBackgroundTasks(order, product).catch((error) => {
        logger.error("Background task trigger failed (non-critical):", error);
      });

      return {
        success: true,
        data: order,
      };
    } catch (error) {
      await transaction.rollback();

      logger.error("Error creating order:", error);

      return {
        success: false,
        error: "Failed to create order",
        code: "ORDER_CREATION_FAILED",
        details: error.message,
      };
    }
  }

  async getOrderById(id) {
    try {
      const order = await orderRepository.findById(id);
      return order;
    } catch (error) {
      logger.error(`Error getting order ${id}:`, error);
      throw error;
    }
  }

  async getAllOrders(options) {
    try {
      const result = await orderRepository.findAll(options);
      return result;
    } catch (error) {
      logger.error("Error getting orders:", error);
      throw error;
    }
  }

  // cancel order and restrore stock
  async cancelOrder(id) {
    const transaction = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const order = await orderRepository.findById(id);

      if (!order) {
        await transaction.rollback();
        return {
          success: false,
          error: "Order not found",
          code: "ORDER_NOT_FOUND",
        };
      }

      if (order.status === "cancelled") {
        await transaction.rollback();
        return {
          success: false,
          error: "Order already cancelled",
          code: "ALREADY_CANCELLED",
        };
      }

      // lock product
      const product = await orderRepository.findProductWithLock(
        order.productId,
        transaction
      );

      if (!product) {
        await transaction.rollback();
        return {
          success: false,
          error: "Product not found",
          code: "PRODUCT_NOT_FOUND",
        };
      }

      // restore stock
      const newStock = product.stock + order.quantity;
      await orderRepository.updateProductStock(
        order.productId,
        newStock,
        transaction
      );

      await orderRepository.updateStatus(id, "cancelled", transaction);

      await transaction.commit();

      const cacheKey = cacheService.generateKey("product", order.productId);
      await cacheService.delete(cacheKey);

      logger.info(`Order cancelled: ${id}, Stock restored: ${order.quantity}`);

      return {
        success: true,
        message: "Order cancelled successfully",
      };
    } catch (error) {
      await transaction.rollback();
      logger.error(`Error cancelling order ${id}:`, error);

      return {
        success: false,
        error: "Failed to cancel order",
        code: "CANCELLATION_FAILED",
        details: error.message,
      };
    }
  }

  /* 
  Trigger background tasks after order creation (async)
  */
  async triggerBackgroundTasks(order, product) {
    try {
      const orderData = {
        id: order.id,
        productId: order.productId,
        productName: order.productName,
        quantity: order.quantity,
        pricePerUnit: parseFloat(order.pricePerUnit),
        totalPrice: parseFloat(order.totalPrice),
        status: order.status,
        customerEmail: order.customerEmail,
        createdAt: order.createdAt,
      };

      // process order
      const processTaskId = await celeryClient.sendTask(
        "tasks.process_order",
        [],
        orderData
      );
      logger.info(`Process order task queued: ${processTaskId}`);

      // send notification (if email provided)
      if (order.customerEmail) {
        const notifyTaskId = await celeryClient.sendTask(
          "tasks.send_order_notification",
          [],
          orderData
        );
        logger.info(`Notification task queued: ${notifyTaskId}`);
      }

      // update analytics
      const analyticsTaskId = await celeryClient.sendTask(
        "tasks.update_inventory_analytics",
        [],
        {
          product_id: product.id,
          quantity_sold: order.quantity,
        }
      );
      logger.info(`Analytics task queued: ${analyticsTaskId}`);
    } catch (error) {
      logger.error("Error triggering background tasks:", error);
    }
  }
}

export default new OrderService();
