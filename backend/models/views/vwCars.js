const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class vwCars extends Sequelize.Model {
    static associate({ brands, carModels, bodyTypes, locations, users }) {
      this.belongsTo(users, { as: "seller", foreignKey: "user_id" });
      this.belongsTo(brands, { as: "brand", foreignKey: "brand_id" });
      this.belongsTo(carModels, { as: "carModel", foreignKey: "car_model_id" });
      this.belongsTo(bodyTypes, { as: "bodyType", foreignKey: "body_type_id" });
      this.belongsTo(locations, { as: "location", foreignKey: "location_id" });
    }
  }

  vwCars.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING },

      user_id: { type: DataTypes.INTEGER },
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
      vehicle_type: { type: DataTypes.STRING },
      autobox_data: { type: DataTypes.TEXT },
      plate_type: { type: DataTypes.STRING },
      engine_capacity: { type: DataTypes.DECIMAL(4, 1) },
      color: { type: DataTypes.STRING },
      interior_color: { type: DataTypes.STRING },
      vin: { type: DataTypes.STRING },
      phonenumber: { type: DataTypes.STRING },
      description: { type: DataTypes.TEXT },
      view_count: { type: DataTypes.INTEGER },
      is_featured: { type: DataTypes.BOOLEAN },
      sold_at: { type: DataTypes.STRING },
      reject_reason: { type: DataTypes.TEXT },
      rejected_at: { type: DataTypes.STRING },

      status: { type: DataTypes.STRING },
      created_by: { type: DataTypes.INTEGER },
      updated_by: { type: DataTypes.INTEGER },
      deleted_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
      deleted_at: { type: DataTypes.STRING },

      name: { type: DataTypes.STRING },
      brand_name: { type: DataTypes.STRING },
      brand_logo: { type: DataTypes.STRING },
      model_name: { type: DataTypes.STRING },
      body_type_name: { type: DataTypes.STRING },
      location_name: { type: DataTypes.STRING },
      seller_name: { type: DataTypes.STRING },
      seller_phone: { type: DataTypes.STRING },
      // Зар оруулсан хэрэглэгчийн эрх (DEALER бол дилерийг нь админ солихгүй)
      seller_role: { type: DataTypes.STRING },
      dealer_name: { type: DataTypes.STRING },
      dealer_logo: { type: DataTypes.STRING },
      image: { type: DataTypes.STRING },
      image_count: { type: DataTypes.INTEGER },
      favorite_count: { type: DataTypes.INTEGER },
    },
    {
      sequelize,
      tableName: "vwCars",
      modelName: "vwCars",
      timestamps: false,
    },
  );

  return vwCars;
};
