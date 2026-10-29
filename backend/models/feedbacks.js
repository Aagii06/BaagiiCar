const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class feedbacks extends Sequelize.Model {
    static associate({ customers }) {
      this.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
    }
  }

  feedbacks.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      customer_id: { type: DataTypes.INTEGER },
      name: { type: DataTypes.STRING },
      phonenumber: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      message: { type: DataTypes.TEXT },
      // new - шинэ, seen - уншсан
      status: { type: DataTypes.STRING, defaultValue: "new" },

      created_at: { type: DataTypes.STRING },
      updated_by: { type: DataTypes.INTEGER },
      updated_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "feedbacks",
      modelName: "feedbacks",
      timestamps: false,
    },
  );

  return feedbacks;
};
