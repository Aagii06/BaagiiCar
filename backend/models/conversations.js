const Sequelize = require("sequelize");

// Зочин хэрэглэгч (customer_id) ба дилер/админ (user_id)-ын яриа. Хос бүрт нэг л яриа.
module.exports = (sequelize, DataTypes) => {
  class conversations extends Sequelize.Model {
    static associate({ customers, users, cars, chatMessages }) {
      this.belongsTo(customers, { as: "customer", foreignKey: "customer_id" });
      this.belongsTo(users, { as: "user", foreignKey: "user_id" });
      this.belongsTo(cars, { as: "car", foreignKey: "car_id" });
      this.hasMany(chatMessages, { as: "messages", foreignKey: "conversation_id" });
    }
  }

  conversations.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      customer_id: { type: DataTypes.INTEGER },
      user_id: { type: DataTypes.INTEGER },
      car_id: { type: DataTypes.INTEGER },
      last_message: { type: DataTypes.STRING(500) },
      last_message_at: { type: DataTypes.STRING },
      customer_unread: { type: DataTypes.INTEGER, defaultValue: 0 },
      user_unread: { type: DataTypes.INTEGER, defaultValue: 0 },

      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "conversations",
      modelName: "conversations",
      timestamps: false,
    },
  );

  return conversations;
};
