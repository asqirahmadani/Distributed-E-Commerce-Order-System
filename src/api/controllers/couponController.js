import couponService from "../../services/couponService.js";
import logger from "../../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

class CouponController {
  /* 
    Create a new coupon
    */
  async createCoupon(req, res, next) {
    try {
      let {
        isActive = true,
        totalDiscount,
        expiredAt,
        productType = "common",
      } = req.body;
      const now = new Date();
      const token = uuidv4();

      if (!expiredAt || expiredAt <= now) {
        expiredAt = new Date();
        expiredAt.setTime(now.getTime() + 7 * 86400000); // plus 7 days
      }

      const coupon = await couponService.createCoupon({
        token,
        productType,
        isActive,
        totalDiscount,
        expiredAt,
      });
      logger.info(`Coupon created successfully: ${coupon.id}`);

      res.status(201).json({
        success: true,
        message: "Coupon created successfully",
        data: coupon,
      });
    } catch (error) {
      logger.error("Error in createCoupon controller:", error);
      next(error);
    }
  }

  /* 
  Validate Coupon
  */
  async validateCoupon(req, res, next) {
    try {
      const { token, productId } = req.body;

      const coupon = await couponService.validateCoupon(token, productId);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: "Coupon not found or expired or invalid",
        });
      }

      res.status(200).json({
        success: true,
        message: "Coupon is valid!",
        data: coupon,
      });
    } catch (error) {
      logger.error("Error in validateCoupon controller:", error);
      next(error);
    }
  }
}

export default new CouponController();
