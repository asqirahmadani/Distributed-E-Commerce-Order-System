import orderService from "../../services/orderService.js";
import logger from "../../utils/logger.js";

class OrderController {
  /* 
  Create a new order 
  */
  async createOrder(req, res, next) {
    try {
      const { productId, quantity, customerEmail } = req.body;

      logger.info(
        `Order request received - Product: ${productId}, Quantity: ${quantity}`
      );

      const result = await orderService.createOrder({
        productId,
        quantity,
        customerEmail,
      });

      if (!result.success) {
        const statusCodes = {
          PRODUCT_NOT_FOUND: 404,
          INSUFFICIENT_STOCK: 409,
          ORDER_CREATION_FAILED: 500,
        };

        const statusCode = statusCodes[result.code] || 400;

        return res.status(statusCode).json({
          success: false,
          error: result.error,
          code: result.code,
          ...(result.details && { details: result.details }),
        });
      }

      logger.info(`Order created successfully: ${result.data.id}`);

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: result.data,
      });
    } catch (error) {
      logger.error("Error in createOrder controller:", error);
      next(error);
    }
  }

  /* 
  Get order by ID
  */
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;

      const order = await orderService.getOrderById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error("Error in getOrderById controller:", error);
      next(error);
    }
  }

  /* 
  Get all orders with filters
  */
  async getAllOrders(req, res, next) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = null,
        productId = null,
      } = req.query;

      const result = await orderService.getAllOrders({
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
        productId,
      });

      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          pages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      logger.error("Error in getAllOrders controller:", error);
      next(error);
    }
  }

  /* 
  Cancel order
  */
  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;

      logger.info(`Cancel order request: ${id}`);

      const result = await orderService.cancelOrder(id);

      if (!result.success) {
        const statusCodes = {
          ORDER_NOT_FOUND: 404,
          ALREADY_CANCELLED: 400,
          PRODUCT_NOT_FOUND: 404,
          CANCELLATION_FAILED: 500,
        };

        const statusCode = statusCodes[result.code] || 400;

        return res.status(statusCode).json({
          success: false,
          error: result.error,
          code: result.code,
          ...(result.details && { details: result.details }),
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error("Error in cancelOrder controller:", error);
      next(error);
    }
  }
}

export default new OrderController();
