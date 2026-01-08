import Coupon from "../models/coupon.js";
import logger from "../utils/logger.js";

class CouponRepository {
  async createCoupon(couponData) {
    try {
      //   const { isActive, totalDiscount, expiredAt } = couponData;
      const coupon = await Coupon.create(couponData);
      logger.info(`Coupon created: ${coupon.id}`);
      return coupon;
    } catch (error) {
      logger.error("Error creating coupon:", error);
      throw error;
    }
  }

  async getCouponByToken(token) {
    try {
      const coupon = await Coupon.findOne({ where: { token: token } });
      return coupon;
    } catch (error) {
      logger.error(`Error finding coupon: ${token}:`, error);
      throw error;
    }
  }
}

export default new CouponRepository();
