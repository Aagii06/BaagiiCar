const Sequelize = require("sequelize");

// Дилер (автосалон): вэб дээр нэр, логотойгоо харагдана.
// ADMIN / DEALER эрхтэй хэрэглэгч users.dealer_id-аар, зар cars.dealer_id-аар харьяалагдана.
module.exports = (sequelize, DataTypes) => {
  class dealers extends Sequelize.Model {
    static associate({ cars, users }) {
      this.hasMany(users, { as: "users", foreignKey: "dealer_id" });
      this.hasMany(cars, { as: "cars", foreignKey: "dealer_id" });
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  dealers.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      name: { type: DataTypes.STRING },
      // public/uploads/dealers доторх файлын нэр
      logo: { type: DataTypes.STRING },
      // Эхний (анх бүртгэсэн) дугаар; phonenumbers-аас api/base/config/dealers.js бөглөнө
      phonenumber: { type: DataTypes.STRING },
      // Бүх дугаар (JSON массив, 5 хүртэл): зар оруулахдаа эндээс сонгоно
      phonenumbers: { type: DataTypes.TEXT },
      email: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      description: { type: DataTypes.TEXT },

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
      tableName: "dealers",
      modelName: "dealers",
      timestamps: false,
    },
  );

  dealers.softDelete = true;

  dealers.maxPhones = 5;

  // Дилерийн бүх дугаар (raw мөрөөс): phonenumbers хоосон бол хуучин ганц phonenumber
  dealers.phonesOf = (row) => {
    let list = [];
    try {
      list = JSON.parse(row?.phonenumbers || "[]");
    } catch {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    if (!list.length && row?.phonenumber) list = [row.phonenumber];
    return list.map(String);
  };

  return dealers;
};
