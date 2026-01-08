import sequelize from "../config/database.js";
import Product from "./product.js";
import Order from "./order.js";

// define relations
Product.hasMany(Order, {
  foreignKey: "productId",
  as: "orders",
});

Order.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

export { sequelize, Product, Order };
