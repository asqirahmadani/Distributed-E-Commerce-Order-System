import couponRepository from "../dal/couponRepository.js";
import productRepository from "../dal/productRepository.js";
import logger from "../utils/logger.js";

class CouponService {
  // create coupon
  async createCoupon(couponData) {
    try {
      const product = await couponRepository.createCoupon(couponData);
      return product;
    } catch (error) {
      logger.error("Error in createCoupon service:", error);
      throw error;
    }
  }

  // validate coupon
  async validateCoupon(token, productId) {
    try {
      const coupon = await couponRepository.getCouponByToken(token);
      const product = await productRepository.findById(productId);

      const now = Date.now();
      if (
        coupon.expiredAt <= now ||
        !coupon.isActive ||
        !product ||
        product.type !== coupon.productType
      ) {
        return false;
      }

      return coupon;
    } catch (error) {
      logger.error("Error in validateCoupon service:", error);
      throw error;
    }
  }
}

export default new CouponService();
