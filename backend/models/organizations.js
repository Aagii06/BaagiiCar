const Sequelize = require("sequelize");
const { Op } = Sequelize;
const moment = require("moment");

module.exports = (sequelize, DataTypes) => {
  class organizations extends Sequelize.Model {
    static associate({ users }) {
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  organizations.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      logo: { type: DataTypes.STRING },
      type: { type: DataTypes.STRING },
      register: { type: DataTypes.STRING },
      name: { type: DataTypes.STRING },
      phonenumber: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      description: { type: DataTypes.STRING },

      is_warehouse: { type: DataTypes.TINYINT },
      warehouse_start_date: { type: DataTypes.STRING },
      warehouse_expired_date: { type: DataTypes.STRING },

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
      tableName: "organizations",
      modelName: "organizations",
      timestamps: false,
    },
  );

  organizations.softDelete = true;

  organizations.beforeSave(async (data, options) => {
    let errorMessage = "";
    const {
      id,
      register,
      phonenumber,
      email,
      warehouse_expired_date,
      is_warehouse,
    } = data;
    if (register) {
      const isRegister = await organizations
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
      const isPhonenumber = await organizations
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

    if (email) {
      const isEmail = await organizations
        .count({
          where: {
            email,
            status: { [Op.ne]: "deleted" },
            id: { [Op.ne]: data.id },
          },
        })
        .then((count) => count <= 0);

      if (!isEmail) errorMessage += "Имэйл давхардаж байна";
    }

    const expired = data.warehouse_expired_date;
    if (id && is_warehouse && expired) {
      const now = moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");
      const afterWeek = moment()
        .utcOffset("+0800")
        .add(7, "days")
        .format("YYYY-MM-DD HH:mm:ss");

      const organization = await organizations
        .count({ where: { id, status: { [Op.ne]: "deleted" } } })
        .then((count) => count <= 0);
      if (organization) {
        let status = "Хэвийн";
        if (expired < now) status = "Хугацаа дууссан";
        else if (expired >= now && expired < afterWeek)
          status = "Хугацаа тулсан";
        else status = "Хэвийн";
        // update warehouse products
        await sequelize.models.warehouseProducts.update(
          { organization_status: status },
          { where: { organization_id: id }, transaction: options.transaction },
        );
      }
    }

    if (errorMessage !== "") throw errorMessage;
  });

  organizations.beforeUpdate(async (data, options) => {
    const changedFields = data.changed() || [];

    let isDelete = false;
    changedFields.forEach((field) => {
      if (field === "status" && data.dataValues[field] === "deleted")
        isDelete = true;
    });
    if (isDelete) {
      const id = data.id;

      const deliveriesCount = await sequelize.models.deliveries.count({
        where: {
          organization_id: id,
          status: { [Op.ne]: "deleted" },
        },
        transaction: options.transaction,
      });
      if (deliveriesCount > 0)
        throw "Энэ байгууллага дээр хүргэлт бүртгэгдсэн тул устгах боломжгүй";

      await sequelize.models.users.update(
        { organization_id: null },
        { where: { organization_id: id }, transaction: options.transaction },
      );
    }
    if (data && options) {
    }
  });

  return organizations;
};
