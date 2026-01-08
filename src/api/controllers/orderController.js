import { asyncHandler } from "../../middleware/errorHandler.js";
import orderService from "../../services/orderService.js";
import logger from "../../utils/logger.js";

const controllerLogger = logger.child("OrderController");

class OrderController {
  /* 
  Create a new order 
  */
  async createOrder(req, res, next) {
    const { productId, quantity, customerEmail } = req.body;

    controllerLogger.info("Order creation request received", {
      requestId: req.id,
      productId,
      quantity,
    });

    const result = await orderService.createOrder({
      productId,
      quantity,
      customerEmail,
    });

    controllerLogger.info("Order created successfully", {
      requestId: req.id,
      orderId: result.id,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: result,
    });
  }

  /* 
  Get order by ID
  */
  async getOrderById(req, res, next) {
    const { id } = req.params;

    const order = await orderService.getOrderById(id);

    res.status(200).json({
      success: true,
      data: order,
    });
  }

  /* 
  Get all orders with filters
  */
  async getAllOrders(req, res, next) {
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
  }

  /* 
  Cancel order
  */
  async cancelOrder(req, res, next) {
    const { id } = req.params;

    controllerLogger.info("Order cancellation requested", {
      requestId: req.id,
      orderId: id,
    });

    await orderService.cancelOrder(id);

    controllerLogger.info("Order cancelled successfully", {
      requestId: req.id,
      orderId: id,
    });

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  }
}

export default new OrderController();
