const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class carViews extends Sequelize.Model {
    static associate({ cars }) {
      this.belongsTo(cars, { as: "car", foreignKey: "car_id" });
    }
  }

  carViews.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      car_id: { type: DataTypes.INTEGER },
      customer_id: { type: DataTypes.INTEGER },
      ip: { type: DataTypes.STRING },
      // "view" - зар үзсэн, "phone" - дугаар харсан
      type: { type: DataTypes.STRING },

      created_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "carViews",
      modelName: "carViews",
      timestamps: false,
    },
  );

  return carViews;
};
