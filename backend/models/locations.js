const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class locations extends Sequelize.Model {
    static associate({ cars, users }) {
      this.hasMany(cars, { as: "cars", foreignKey: "location_id" });
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  locations.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      name: { type: DataTypes.STRING },
      sort_order: { type: DataTypes.INTEGER },

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
      tableName: "locations",
      modelName: "locations",
      timestamps: false,
    },
  );

  locations.softDelete = true;

  return locations;
};
