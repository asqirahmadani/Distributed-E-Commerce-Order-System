import { Transaction } from "sequelize";

import {
  NotFoundError,
  InsufficientStockError,
  ConflictError,
  DatabaseError,
} from "../utils/error.js";
import orderRepository from "../dal/orderRepository.js";
import celeryClient from "../utils/celeryClient.js";
import { sequelize } from "../models/index.js";
import cacheService from "./cacheService.js";
import logger from "../utils/logger.js";

const serviceLogger = logger.child("OrderService");

class OrderService {
  // create order with race condition safety
  async createOrder(orderData) {
    const { productId, quantity, customerEmail } = orderData;

    serviceLogger.info("Creating new order", {
      productId,
      quantity,
      customerEmail: customerEmail ? "provided" : "not provided",
    });

    const transaction = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      // lock product row
      serviceLogger.debug("Acquiring product lock", { productId });
      const product = await orderRepository.findProductWithLock(
        productId,
        transaction
      );

      if (!product) {
        serviceLogger.warn("Order creation failed - Product not found", {
          productId,
        });
        throw new NotFoundError("Product", productId);
      }

      serviceLogger.debug("Product found and locked", {
        productId,
        productName: product.name,
        availableStock: product.stock,
      });

      // check stock availability
      if (product.stock < quantity) {
        serviceLogger.warn("Order creation failed - Insufficient stock", {
          productId,
          requested: quantity,
          available: product.stock,
        });

        throw new InsufficientStockError(quantity, product.stock);
      }

      // calculate prices
      const pricePerUnit = parseFloat(product.price);
      const totalPrice = pricePerUnit * quantity;

      serviceLogger.debug("Price calculated", {
        pricePerUnit,
        quantity,
        totalPrice,
      });

      // deduct stock
      const newStock = product.stock - quantity;

      serviceLogger.info("Deducting stock", {
        productId,
        previousStock: product.stock,
        quantity,
        newStock,
      });

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

      serviceLogger.info("Order record created", {
        orderId: order.id,
        productId,
        quantity,
        totalPrice,
      });

      await transaction.commit();

      serviceLogger.info("Transaction committed successfully", {
        orderId: order.id,
      });

      const cacheKey = cacheService.generateKey("product", productId);
      await cacheService.delete(cacheKey);

      serviceLogger.debug("Product cache invalidated", { productId });

      // trigger background tasks (non-blocking)
      this.triggerBackgroundTasks(order, product).catch((error) => {
        serviceLogger.error("Background task trigger failed (non-critical)", {
          orderId: order.id,
          error: error.message,
        });
      });

      serviceLogger.info("Order created successfully", {
        orderId: order.id,
        productId,
        quantity,
        totalPrice,
        newStock,
      });

      return order;
    } catch (error) {
      await transaction.rollback();

      serviceLogger.error("Order creation failed - Transaction rolled back", {
        productId,
        quantity,
        error: error.message,
      });

      if (
        error instanceof NotFoundError ||
        error instanceof InsufficientStockError
      ) {
        throw error;
      }

      throw new DatabaseError("Failed to create order", error);
    }
  }

  async getOrderById(id) {
    try {
      serviceLogger.debug("Fetching order", { orderId: id });

      const order = await orderRepository.findById(id);
      if (!order) {
        serviceLogger.warn("Order not found", { orderId: id });
        throw new NotFoundError("Order", id);
      }

      serviceLogger.debug("Order fetched successfully", { orderId: id });
      return order;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      serviceLogger.warn("Failed to fetch order", {
        orderId: id,
        error: error.message,
      });

      throw new DatabaseError("Failed to fetch order", error);
    }
  }

  async getAllOrders(options) {
    try {
      serviceLogger.debug("Fetching orders", options);

      const result = await orderRepository.findAll(options);

      serviceLogger.info("Orders fetched successfully", {
        count: result.orders.length,
        total: result.total,
      });

      return result;
    } catch (error) {
      serviceLogger.error("Failed to fetch orders", {
        error: error.message,
      });

      throw new DatabaseError("Failed to fetch orders", error);
    }
  }

  // cancel order and restrore stock
  async cancelOrder(id) {
    serviceLogger.info("Cancelling order", { orderId: id });

    const transaction = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const order = await orderRepository.findById(id);

      if (!order) {
        serviceLogger.warn("Cancel failed - Order not found", { orderId: id });
        throw new NotFoundError("Order", id);
      }

      if (order.status === "cancelled") {
        serviceLogger.warn("Cancel failed - Order already cancelled", {
          orderId: id,
        });
        throw new ConflictError("Order is already cancelled");
      }

      serviceLogger.debug("Order found, locking product", {
        orderId: id,
        productId: order.productId,
      });

      // lock product
      const product = await orderRepository.findProductWithLock(
        order.productId,
        transaction
      );

      if (!product) {
        serviceLogger.error("Cancel failed - Product not found", {
          orderId: id,
          productId: order.productId,
        });
        throw new NotFoundError("Product", order.productId);
      }

      // restore stock
      const newStock = product.stock + order.quantity;

      serviceLogger.info("Restoring stock", {
        orderId: id,
        productId: order.productId,
        previousStock: product.stock,
        quantityToRestore: order.quantity,
        newStock,
      });

      await orderRepository.updateProductStock(
        order.productId,
        newStock,
        transaction
      );

      await orderRepository.updateStatus(id, "cancelled", transaction);

      await transaction.commit();

      const cacheKey = cacheService.generateKey("product", order.productId);
      await cacheService.delete(cacheKey);

      serviceLogger.info("Order cancelled successfully", {
        orderId: id,
        stockRestored: order.quantity,
        newStock,
      });

      return true;
    } catch (error) {
      await transaction.rollback();

      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }

      serviceLogger.error("Order cancellation failed", {
        orderId: id,
        error: error.message,
      });

      throw new DatabaseError("Failed to cancel order", error);
    }
  }

  /* 
  Trigger background tasks after order creation (async)
  */
  async triggerBackgroundTasks(order, product) {
    const taskLogger = logger.child("BackgroundTasks");

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

      taskLogger.info("Queueing background tasks", { orderId: order.id });

      // process order
      const processTaskId = await celeryClient.sendTask(
        "tasks.process_order",
        [],
        orderData
      );

      taskLogger.info("Process order task queued", {
        orderId: order.id,
        taskId: processTaskId,
      });

      // send notification (if email provided)
      if (order.customerEmail) {
        const notifyTaskId = await celeryClient.sendTask(
          "tasks.send_order_notification",
          [],
          orderData
        );

        taskLogger.info("Notification task queued", {
          orderId: order.id,
          taskId: notifyTaskId,
        });
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

      taskLogger.info("Analytics task queued", {
        productId: product.id,
        taskId: analyticsTaskId,
      });
    } catch (error) {
      taskLogger.error("Failed to queue background tasks", {
        orderId: order.id,
        error: error.message,
      });
    }
  }
}

export default new OrderService();
