import { body, param, query, validationResult } from "express-validator";

// product validators
export const validateCreateProduct = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 3, max: 255 })
    .withMessage("Product name must be between 3 and 255 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number greater than 0"),

  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("type")
    .optional()
    .isIn(["electronic", "food", "fashion", "common"])
    .withMessage("Invalid product type"),
];

export const validateUpdateProduct = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Product name must be between 3 and 255 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number greater than 0"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
];

export const validateProductId = [
  param("id").isUUID().withMessage("Invalid product ID format"),
];

// order validators
export const validateCreateOrder = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isUUID()
    .withMessage("Invalid product ID format"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),

  body("customerEmail")
    .optional()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
];

export const validateOrderId = [
  param("id").isUUID().withMessage("Invalid order ID format"),
];

export const validateOrderFilters = [
  query("status")
    .optional()
    .isIn(["pending", "completed", "cancelled", "failed"])
    .withMessage(
      "Invalid status. Must be: pending, completed, cancelled, or failed"
    ),

  query("productId")
    .optional()
    .isUUID()
    .withMessage("Invalid product ID format"),
];

// coupon validators
export const validateCreateCoupon = [
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Invalid isActive. Must be boolean"),

  body("totalDiscount")
    .notEmpty()
    .isFloat({ min: 0.01, max: 0.8 })
    .withMessage(
      "Price must be a positive number greater than 0 and less than 0.8"
    ),

  body("productType")
    .optional()
    .isIn(["electronic", "food", "fashion", "common"])
    .withMessage("Invalid product type"),

  body("expiredAt").optional().isDate(),
];
export const validateCoupon = [
  body("token")
    .notEmpty()
    .withMessage("Token is required")
    .isString()
    .withMessage("Coupon must be a string"),

  body("productId")
    .isUUID()
    .withMessage("Invalid product ID format")
    .notEmpty()
    .withMessage("productId is required"),
];

export const validatePagination = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be a non-negative integer"),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }

  next();
};
