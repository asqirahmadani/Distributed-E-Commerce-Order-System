import express from "express";

import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validatePagination,
  handleValidationErrors,
} from "./validator.js";
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

export default router;
