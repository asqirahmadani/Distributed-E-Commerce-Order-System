import { DataTypes, Model } from "sequelize";

import sequelize from "../config/database.js";

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "product_id",
      references: {
        model: "products",
        key: "id",
      },
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "product_name",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: "Quantity must be an integer",
        },
        min: {
          args: [1],
          msg: "Quantity must be at least 1",
        },
      },
    },
    pricePerUnit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "price_per_unit",
      validate: {
        isDecimal: {
          msg: "Price must be a valid decimal number",
        },
        min: {
          args: [0.01],
          msg: "Price must be greater than 0",
        },
      },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "total_price",
      validate: {
        isDecimal: {
          msg: "Total price must be a valid decimal number",
        },
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "cancelled", "failed"),
      defaultValue: "pending",
      allowNull: false,
    },
    customerEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "customer_email",
      validate: {
        isEmail: {
          msg: "Must be a valid email address",
        },
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
    timestamps: true,
    indexes: [
      {
        fields: ["product_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

export default Order;
