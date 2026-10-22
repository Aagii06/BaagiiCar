const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class favorites extends Sequelize.Model {
    static associate({ cars, customers }) {
      this.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
      this.belongsTo(cars, { as: "car", foreignKey: "car_id" });
    }
  }

  favorites.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      customer_id: { type: DataTypes.INTEGER },
      car_id: { type: DataTypes.INTEGER },

      created_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "favorites",
      modelName: "favorites",
      timestamps: false,
    },
  );

  return favorites;
};
