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
      // "car" - зартай холбоотой (админ / дилер хариулна), "ai" - AI туслахтай яриа
      type: { type: DataTypes.STRING(10), defaultValue: "car" },

      name: { type: DataTypes.STRING(100) },
      phonenumber: { type: DataTypes.STRING(20) },
      message: { type: DataTypes.TEXT },
      // Админ / дилерийн хариу (хэрэглэгч вэбийн чатад харна)
      reply: { type: DataTypes.TEXT },
      replied_by: { type: DataTypes.INTEGER },
      replied_at: { type: DataTypes.STRING },
      car_id: { type: DataTypes.INTEGER },
      page_url: { type: DataTypes.STRING(500) },
      status: { type: DataTypes.STRING(20) },

      created_by: { type: DataTypes.INTEGER },
      updated_by: { type: DataTypes.INTEGER },
      deleted_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
      deleted_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "messages",
      modelName: "messages",
      timestamps: false,
    },
  );

  // Устгахад status = "deleted" болно (base destroy)
  messages.softDelete = true;

  return messages;
};
