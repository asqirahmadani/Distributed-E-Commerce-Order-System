import productService from "../../services/productService.js";
import logger from "../../utils/logger.js";

class ProductController {
  /* 
  Create a new product
  */
  async createProduct(req, res, next) {
    const { name, price, stock, type = "common" } = req.body;

    const product = await productService.createProduct({
      name,
      price,
      stock,
      type,
    });
    logger.info(`Product created successfully: ${product.id}`);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
    try {
    } catch (error) {
      logger.error("Error in createProduct controller:", error);
      next(error);
    }
  }

  /* 
  Get product by ID
  */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      const product = await productService.getProductById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      logger.error("Error in getProductById controller:", error);
      next(error);
    }
  }

  /* 
  Get all products with pagination
  */
  async getAllProducts(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const result = await productService.getAllProducts({
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          pages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      logger.error("Error in getAllProducts controller:", error);
      next(error);
    }
  }

  /* 
  Update product
  */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await productService.updateProduct(id, updateData);

      if (!product) {
        res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (error) {
      logger.error("Error in updateProduct controller:", error);
      next(error);
    }
  }

  /* 
  Delete product
  */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      const deleted = await productService.deleteProduct(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      logger.info(`Product deleted successfully: ${id}`);

      res.status(200).json({
        success: true,
        message: "Product deleted succesfully",
      });
    } catch (error) {
      logger.error("Error in deleteProduct controller:", error);
      next(error);
    }
  }
}

export default new ProductController();
