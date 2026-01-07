import productRepository from "../dal/productRepository.js";
import cacheService from "./cacheService.js";
import logger from "../utils/logger.js";

class ProductService {
  constructor() {
    this.cacheKeyPrefix = "product";
  }

  async createProduct(productData) {
    try {
      const product = await productRepository.create(productData);

      // cache the new created product
      const cacheKey = cacheService.generateKey(
        this.cacheKeyPrefix,
        product.id
      );
      await cacheService.set(cacheKey, product.toJSON());

      return product;
    } catch (error) {
      logger.error("Error in createProduct service:", error);
      throw error;
    }
  }

  async getProductById(id) {
    try {
      const cacheKey = cacheService.generateKey(this.cacheKeyPrefix, id);
      const cachedProduct = await cacheService.get(cacheKey);

      if (cachedProduct) {
        return cachedProduct;
      }

      const product = await productRepository.findById(id);
      if (product) {
        await cacheService.set(cacheKey, product.toJSON());
      }

      return product;
    } catch (error) {
      logger.error(`Error in getProductById service for ${id}:`, error);
      throw error;
    }
  }

  async getAllProducts(options) {
    try {
      const result = await productRepository.findAll(options);
      return result;
    } catch (error) {
      logger.error("Error in getAllProducts service:", error);
      throw error;
    }
  }

  async updateProduct(id, updateData) {
    try {
      const product = await productRepository.update(id, updateData);
      if (!product) {
        return null;
      }

      // invalidate cache after update
      const cacheKey = cacheService.generateKey(this.cacheKeyPrefix, id);
      await cacheService.delete(cacheKey);

      logger.info(`Cache invalidated for product: ${id}`);

      return product;
    } catch (error) {
      logger.error(`Error in updateProduct service for ${id}:`, error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const deleted = await productRepository.delete(id);
      if (deleted) {
        const cacheKey = cacheService.generateKey(this.cacheKeyPrefix, id);
        await cacheService.delete(cacheKey);

        logger.info(`Cache invalidated for deleted product: ${id}`);
      }

      return deleted;
    } catch (error) {
      logger.error(`Error in deleteProduct service for ${id}:`, error);
      throw error;
    }
  }

  async updateProductStock(id, quantity, operation) {
    try {
      const product = await productRepository.updateStock(
        id,
        quantity,
        operation
      );

      if (product) {
        const cacheKey = cacheService.generateKey(this.cacheKeyPrefix, id);
        await cacheService.delete(cacheKey);

        logger.info(`Cache invalidated for product: ${id}`);
      }

      return product;
    } catch (error) {
      logger.error(`Error in updateProductStock service for ${id}:`, error);
      throw error;
    }
  }
}

export default new ProductService();
