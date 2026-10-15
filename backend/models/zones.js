const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class zones extends Sequelize.Model {
    static associate({ users }) {
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  zones.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      name: { type: DataTypes.STRING },
      zone_name: { type: DataTypes.STRING },
      district: { type: DataTypes.STRING },
      description: { type: DataTypes.STRING },

      status: { type: DataTypes.STRING },
      created_by: { type: DataTypes.INTEGER },
      updated_by: { type: DataTypes.INTEGER },
      deleted_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
      deleted_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "zones",
      modelName: "zones",
      timestamps: false,
    },
  );

  zones.softDelete = true;

  zones.beforeSave(async (data, options) => {
    let errorMessage = "";
    if (errorMessage !== "") throw errorMessage;
  });

  return zones;
};
