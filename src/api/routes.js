import express from "express";

import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateCreateOrder,
  validateOrderId,
  validateOrderFilters,
  validatePagination,
  handleValidationErrors,
} from "./validator.js";
import orderController from "./controllers/orderController.js";
import productController from "./controllers/productController.js";

const router = express.Router();

// product routes
router.get(
  "/products",
  validatePagination,
  handleValidationErrors,
  productController.getAllProducts.bind(productController)
);

router.get(
  "/products/:id",
  validateProductId,
  handleValidationErrors,
  productController.getProductById.bind(productController)
);

router.post(
  "/products",
  validateCreateProduct,
  handleValidationErrors,
  productController.createProduct.bind(productController)
);

router.put(
  "/products/:id",
  validateProductId,
  validateUpdateProduct,
  handleValidationErrors,
  productController.updateProduct.bind(productController)
);

router.delete(
  "/products/:id",
  validateProductId,
  handleValidationErrors,
  productController.deleteProduct.bind(productController)
);

// order routes
router.get(
  "/orders",
  validatePagination,
  validateOrderFilters,
  handleValidationErrors,
  orderController.getAllOrders.bind(orderController)
);

router.get(
  "/orders/:id",
  validateOrderId,
  handleValidationErrors,
  orderController.getOrderById.bind(orderController)
);

router.post(
  "/orders",
  validateCreateOrder,
  handleValidationErrors,
  orderController.createOrder.bind(orderController)
);

router.post(
  "/orders/:id/cancel",
  validateOrderId,
  handleValidationErrors,
  orderController.cancelOrder.bind(orderController)
);

export default router;
