import { DataTypes, Model } from "sequelize";

import sequelize from "../config/database.js";

class Coupon extends Model {}

Coupon.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Token is required",
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    productType: {
      type: DataTypes.ENUM(["electronic", "food", "fashion", "common"]),
      allowNull: false,
      defaultValue: "common",
    },
    totalDiscount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: "Discount must be a valid decimal number",
        },
        min: {
          args: [0.01],
          msg: "Discount must be greater than 0",
        },
        max: {
          args: [0.8],
          msg: "Discount must be lower than 0.8",
        },
      },
    },
    expiredAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Coupon",
    tableName: "Coupon",
    timestamps: true,
    indexes: [
      {
        fields: ["token"],
      },
    ],
  }
);

export default Coupon;
