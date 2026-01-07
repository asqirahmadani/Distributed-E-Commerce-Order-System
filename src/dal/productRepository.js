import logger from "../utils/logger.js";
import Product from "../models/product.js";

class ProductRepository {
  async create(productData) {
    try {
      const product = await Product.create(productData);
      logger.info(`Product created: ${product.id}`);
      return product;
    } catch (error) {
      logger.error("Error creating product:", error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const product = await Product.findByPk(id);
      return product;
    } catch (error) {
      logger.error(`Error finding product ${id}:`, error);
      throw error;
    }
  }

  async findAll(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        order = [["createdAt", "DESC"]],
      } = options;

      const { count, rows } = await Product.findAndCountAll({
        limit,
        offset,
        order,
      });

      return {
        products: rows,
        total: count,
        limit,
        offset,
      };
    } catch (error) {
      logger.error("Error finding products:", error);
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      const product = await Product.findByPk(id);
      if (!product) {
        return null;
      }

      await product.update(updateData);
      logger.info(`Product updated: ${id}`);
      return product;
    } catch (error) {
      logger.error(`Error updating product ${id}:`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const product = await Product.findByPk(id);
      if (!product) {
        return false;
      }

      await product.destroy();
      logger.info(`Product deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }

  async updateStock(id, quantity, operation = "increment") {
    try {
      const product = await Product.findByPk(id);
      if (!product) {
        return null;
      }

      if (operation === "increment") {
        product.stock += quantity;
      } else if (operation === "decrement") {
        if (product.stock < quantity) {
          throw new Error("Insufficient stock");
        }
        product.stock -= quantity;
      }

      await product.save();
      logger.info(`Product stock updated: ${id}, new stock: ${product.stock}`);
      return product;
    } catch (error) {
      logger.error(`Error updating stock for product ${id}:`, error);
      throw error;
    }
  }
}

export default new ProductRepository();
