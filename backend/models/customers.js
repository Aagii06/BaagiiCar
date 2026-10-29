const Sequelize = require("sequelize");

// Вэбийн зочин хэрэглэгч: утас (эсвэл имэйл) + нэг удаагийн кодоор нэвтэрнэ, нууц үггүй.
// Зар оруулахгүй — зөвхөн зар үзэж, хадгалж, дилер/админтай чатлана.
module.exports = (sequelize, DataTypes) => {
  class customers extends Sequelize.Model {
    static associate({ favorites, conversations }) {
      this.hasMany(favorites, { as: "favorites", foreignKey: "customer_id" });
      this.hasMany(conversations, { as: "conversations", foreignKey: "customer_id" });
    }
  }

  customers.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      phonenumber: { type: DataTypes.STRING(20) },
      // SMS кодоор баталгаажсан огноо (null - баталгаажаагүй)
      phone_verified_at: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING(254) },
      firstname: { type: DataTypes.STRING },
      lastname: { type: DataTypes.STRING },
      profile: { type: DataTypes.STRING },

      status: { type: DataTypes.STRING(20) },
      updated_by: { type: DataTypes.INTEGER },
      deleted_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
      deleted_at: { type: DataTypes.STRING },
      last_login_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "customers",
      modelName: "customers",
      timestamps: false,
    },
  );

  customers.softDelete = true;

  // Дугаар солигдвол дахин баталгаажуулна
  customers.beforeSave((data) => {
    if (!data.isNewRecord && data.changed("phonenumber") && !data.changed("phone_verified_at"))
      data.phone_verified_at = null;
  });

  return customers;
};
