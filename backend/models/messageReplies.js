const Sequelize = require("sequelize");

// Мессежийн хариу (админ / дилер бичнэ). Нэг мессежид олон хариу байж болно.
module.exports = (sequelize, DataTypes) => {
  class messageReplies extends Sequelize.Model {
    static associate({ messages }) {
      this.belongsTo(messages, { as: "message", foreignKey: "message_id" });
    }
  }

  messageReplies.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      message_id: { type: DataTypes.INTEGER },
      reply: { type: DataTypes.TEXT },
      created_by: { type: DataTypes.INTEGER },
      updated_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "messageReplies",
      modelName: "messageReplies",
      timestamps: false,
    },
  );

  return messageReplies;
};
