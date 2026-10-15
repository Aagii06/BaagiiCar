const Sequelize = require("sequelize");
const { Op } = Sequelize;
const moment = require("moment");

module.exports = (sequelize, DataTypes) => {
  class organizationRequests extends Sequelize.Model {
    static associate({ users }) {
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  organizationRequests.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      type: { type: DataTypes.STRING },
      register: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      phonenumber: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
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
      tableName: "organizationRequests",
      modelName: "organizationRequests",
      timestamps: false,
    },
  );

  organizationRequests.softDelete = true;

  organizationRequests.beforeCreate(async (data, options) => {
    let errorMessage = "";
    const { id, register, phonenumber, warehouse_expired_date, is_warehouse } =
      data;
    if (register) {
      const isRegister = await organizationRequests
        .count({
          where: {
            register,
            status: { [Op.ne]: "deleted" },
            id: { [Op.ne]: data.id },
          },
        })
        .then((count) => count <= 0);

      if (!isRegister) errorMessage += "Регистр давхардаж байна";
    }

    if (phonenumber) {
      const isPhonenumber = await organizationRequests
        .count({
          where: {
            phonenumber,
            status: { [Op.ne]: "deleted" },
            id: { [Op.ne]: data.id },
          },
        })
        .then((count) => count <= 0);

      if (!isPhonenumber) errorMessage += "Утасны дугаар давхардаж байна";
    }

    if (errorMessage !== "") throw errorMessage;
  });

  return organizationRequests;
};
