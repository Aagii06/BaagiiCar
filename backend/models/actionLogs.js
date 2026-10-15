const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class actionLogs extends Sequelize.Model {
    static associate({ users }) {
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
    }
  }

  actionLogs.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      object_name: { type: DataTypes.STRING },
      object_id: { type: DataTypes.INTEGER },
      log_action: { type: DataTypes.STRING },
      log_action_mn: { type: DataTypes.STRING },
      modify_data: { type: DataTypes.TEXT },

      created_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "actionLogs",
      modelName: "actionLogs",
      timestamps: false,
    }
  );

  return actionLogs;
};
