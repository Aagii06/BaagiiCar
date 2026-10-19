const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class messages extends Sequelize.Model {
    static associate({ cars }) {
      this.belongsTo(cars, { as: "car", foreignKey: "car_id" });
    }
  }

  messages.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      name: { type: DataTypes.STRING(100) },
      phonenumber: { type: DataTypes.STRING(20) },
      message: { type: DataTypes.TEXT },
      car_id: { type: DataTypes.INTEGER },
      page_url: { type: DataTypes.STRING(500) },
      status: { type: DataTypes.STRING(20) },

      created_by: { type: DataTypes.INTEGER },
      updated_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "messages",
      modelName: "messages",
      timestamps: false,
    },
  );

  return messages;
};
