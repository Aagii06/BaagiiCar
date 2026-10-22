const Sequelize = require("sequelize");
const { Op } = Sequelize;
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class users extends Sequelize.Model {
    static associate({ cars, dealers, favorites, users }) {
      this.hasMany(cars, { as: "cars", foreignKey: "user_id" });
      this.hasMany(favorites, { as: "favorites", foreignKey: "user_id" });
      this.belongsTo(dealers, { as: "dealer", foreignKey: "dealer_id" });
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

  users.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      profile: { type: DataTypes.STRING },
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
      // ADMIN / DEALER эрхтэй хэрэглэгчийн харьяалах дилер
      dealer_id: { type: DataTypes.INTEGER },

      status: { type: DataTypes.STRING },
      created_by: { type: DataTypes.INTEGER },
      updated_by: { type: DataTypes.INTEGER },
      deleted_by: { type: DataTypes.INTEGER },
      pass_changed_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
      deleted_at: { type: DataTypes.STRING },
      pass_changed_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "users",
      modelName: "users",
      timestamps: false,
    },
  );

  users.softDelete = true;

  users.beforeSave(async (data, options) => {
    // Зөвхөн нууц үг өөрчлөгдсөн үед hash хийнэ (давхар hash хийхээс сэргийлнэ)
    if (data.password && data.changed("password")) {
      const salt = await bcrypt.genSalt(8);
      const hashedPassword = await bcrypt.hash(data.password, salt);
      data.password = hashedPassword;
    }
    let errorMessage = "";
    if (data.phonenumber) {
      const isPhonenumber = await users
        .count({
          where: {
            phonenumber: data.phonenumber,
            status: { [Op.ne]: "deleted" },
            id: { [Op.ne]: data.id },
          },
        })
        .then((count) => count <= 0);

      if (!isPhonenumber) errorMessage += "Утасны дугаар давхардаж байна";
    }

    if (data.email) {
      // Email duplicate check
      const isEmail = await users
        .count({
          where: {
            email: data.email,
            status: { [Op.ne]: "deleted" },
            id: { [Op.ne]: data.id },
          },
        })
        .then((count) => count <= 0);
      if (!isEmail) {
        errorMessage += errorMessage !== "" ? ", " : "";
        errorMessage += "И-мэйл хаяг давхардаж байна";
      }
    }

    if (errorMessage !== "") throw errorMessage;
  });

  users.beforeUpdate(async (data, options) => {
    const changedFields = data.changed() || [];

    let isDelete = false;
    changedFields.forEach((field) => {
      if (field === "status" && data.dataValues[field] === "deleted")
        isDelete = true;
    });
    if (isDelete) {
      // Хэрэглэгчийг устгахад түүний идэвхтэй зарууд мөн устгагдана
      await sequelize.models.cars.update(
        {
          status: "deleted",
          deleted_by: data.deleted_by,
          deleted_at: data.deleted_at,
        },
        {
          where: { user_id: data.id, status: "active" },
          transaction: options.transaction,
        },
      );
    }
  });

  return users;
};
