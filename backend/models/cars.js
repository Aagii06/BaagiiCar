const Sequelize = require("sequelize");
const crypto = require("crypto");
const moment = require("moment");

module.exports = (sequelize, DataTypes) => {
  class cars extends Sequelize.Model {
    static associate({ brands, carModels, bodyTypes, dealers, locations, favorites, users }) {
      this.belongsTo(users, { as: "seller", foreignKey: "user_id" });
      this.belongsTo(dealers, { as: "dealer", foreignKey: "dealer_id" });
      this.belongsTo(brands, { as: "brand", foreignKey: "brand_id" });
      this.belongsTo(carModels, { as: "carModel", foreignKey: "car_model_id" });
      this.belongsTo(bodyTypes, { as: "bodyType", foreignKey: "body_type_id" });
      this.belongsTo(locations, { as: "location", foreignKey: "location_id" });
      this.hasMany(favorites, { as: "favorites", foreignKey: "car_id" });
      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
    }
  }

  cars.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      // Зарын дугаар: YYYYMMDD + 4 оронтой санамсаргүй тоо (beforeCreate)
      code: { type: DataTypes.STRING(12) },

      user_id: { type: DataTypes.INTEGER },
      // Зар харьяалагдах дилер (хоосон бол хувь хүний / админы зар)
      dealer_id: { type: DataTypes.INTEGER },
      brand_id: { type: DataTypes.INTEGER },
      car_model_id: { type: DataTypes.INTEGER },
      body_type_id: { type: DataTypes.INTEGER },
      location_id: { type: DataTypes.INTEGER },
      manufactured_year: { type: DataTypes.INTEGER },
      imported_year: { type: DataTypes.INTEGER },
      price: { type: DataTypes.BIGINT },
      mileage: { type: DataTypes.INTEGER },
      fuel_type: { type: DataTypes.STRING },
      transmission: { type: DataTypes.STRING },
      drive_type: { type: DataTypes.STRING },
      steering: { type: DataTypes.STRING },
      // Бүртгэлийн ангилал (autobox vehicleTypeName)
      vehicle_type: { type: DataTypes.STRING },
      // autobox.mn-ээс татсан мэдээлэл (JSON): { plate, vin, fetched_at, fields } - fields-ийг засахгүй
      autobox_data: { type: DataTypes.TEXT },
      // Улсын дугаар: config/constants.js-ийн plateTypes
      plate_type: { type: DataTypes.STRING(30) },
      engine_capacity: { type: DataTypes.DECIMAL(4, 1) },
      color: { type: DataTypes.STRING },
      // Салоны (дотор) өнгө
      interior_color: { type: DataTypes.STRING },
      vin: { type: DataTypes.STRING },
      phonenumber: { type: DataTypes.STRING },
      description: { type: DataTypes.TEXT },
      view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
      is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      sold_at: { type: DataTypes.STRING },
      // Админ буцаасан тайлбар (status = "rejected")
      reject_reason: { type: DataTypes.TEXT },
      rejected_by: { type: DataTypes.INTEGER },
      rejected_at: { type: DataTypes.STRING },

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
      tableName: "cars",
      modelName: "cars",
      timestamps: false,
    },
  );

  cars.softDelete = true;

  // Өдөрт 10000 дугаар л байх тул давхцвал дахин үүсгэнэ
  cars.beforeCreate(async (data, options) => {
    if (data.code) return;
    const day = moment().utcOffset("+0800").format("YYYYMMDD");
    for (;;) {
      const code = day + String(crypto.randomInt(10000)).padStart(4, "0");
      const taken = await cars.count({ where: { code }, transaction: options.transaction });
      if (!taken) return void (data.code = code);
    }
  });

  cars.beforeSave(async (data, options) => {
    let errorMessage = "";
    // Загвар нь сонгосон брэндэд хамаарах эсэх
    if (data.car_model_id && data.brand_id) {
      const model = await sequelize.models.carModels.findByPk(
        data.car_model_id,
        { attributes: ["brand_id"], raw: true, transaction: options.transaction },
      );
      if (!model || model.brand_id + "" !== data.brand_id + "")
        errorMessage += "Загвар сонгосон брэндэд хамаарахгүй байна";
    }
    if (errorMessage !== "") throw errorMessage;
  });

  return cars;
};
