const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class allFiles extends Sequelize.Model {
    static associate({ users }) {
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  allFiles.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      generated_name: { type: DataTypes.STRING },
      data_id: { type: DataTypes.INTEGER },
      object_name: { type: DataTypes.STRING },
      field_name: { type: DataTypes.STRING },
      extension: { type: DataTypes.STRING },
      size: { type: DataTypes.INTEGER },
      original_name: { type: DataTypes.STRING },
      order: { type: DataTypes.INTEGER },

      status: { type: DataTypes.STRING },
      created_by: { type: DataTypes.INTEGER },
      deleted_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      deleted_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "allFiles",
      modelName: "allFiles",
      timestamps: false,
    }
  );

  return allFiles;
};
