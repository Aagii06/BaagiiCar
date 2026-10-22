const Sequelize = require("sequelize");

// Ярианы мессеж. sender: "customer" (зочин) эсвэл "user" (дилер/админ)
module.exports = (sequelize, DataTypes) => {
  class chatMessages extends Sequelize.Model {
    static associate({ conversations, cars }) {
      this.belongsTo(conversations, { as: "conversation", foreignKey: "conversation_id" });
      this.belongsTo(cars, { as: "car", foreignKey: "car_id" });
    }
  }

  chatMessages.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      conversation_id: { type: DataTypes.INTEGER },
      sender: { type: DataTypes.STRING(10) },
      sender_id: { type: DataTypes.INTEGER },
      car_id: { type: DataTypes.INTEGER },
      body: { type: DataTypes.TEXT },

      created_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "chat_messages",
      modelName: "chatMessages",
      timestamps: false,
    },
  );

  return chatMessages;
};
