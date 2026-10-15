const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class cars extends Sequelize.Model {
    static associate({ brands, carModels, bodyTypes, locations, favorites, users }) {
      this.belongsTo(users, { as: "seller", foreignKey: "user_id" });
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

      user_id: { type: DataTypes.INTEGER },
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
      engine_capacity: { type: DataTypes.DECIMAL(4, 1) },
      color: { type: DataTypes.STRING },
      vin: { type: DataTypes.STRING },
      phonenumber: { type: DataTypes.STRING },
      description: { type: DataTypes.TEXT },
      view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
      is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      sold_at: { type: DataTypes.STRING },

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
