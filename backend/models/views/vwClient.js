const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class vwClient extends Sequelize.Model {
    static associate({ organizations, zones, users }) {
      this.belongsTo(organizations, {
        as: "organization",
        foreignKey: "organization_id",
      });
      this.belongsTo(zones, { as: "zone", foreignKey: "zone_id" });
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
    toJSON() {
      let values = Object.assign({}, this.get());
      delete values.password;
      return values;
    }
  }

  vwClient.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      profile: { type: DataTypes.STRING },
      organization_id: { type: DataTypes.INTEGER },
      zone_id: { type: DataTypes.INTEGER },
      username: { type: DataTypes.STRING },
      phonenumber: { type: DataTypes.STRING },
      firstname: { type: DataTypes.STRING },
      lastname: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      password: { type: DataTypes.STRING },
      forgot_pass_token: { type: DataTypes.STRING },
      forgot_pass_expire_date: { type: DataTypes.STRING },
      language: { type: DataTypes.STRING },
      role: { type: DataTypes.STRING },

      status: { type: DataTypes.STRING },
      created_by: { type: DataTypes.INTEGER },
      updated_by: { type: DataTypes.INTEGER },
      deleted_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
      deleted_at: { type: DataTypes.STRING },

      name_and_phone: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "vwClient",
      modelName: "vwClient",
      timestamps: false,
    },
  );

  return vwClient;
};
