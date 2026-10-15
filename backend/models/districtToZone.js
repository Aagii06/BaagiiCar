const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class districtToZone extends Sequelize.Model {
    static associate({ districts, zones }) {
      this.belongsTo(districts, { as: "district", foreignKey: "district_id" });
      this.belongsTo(zones, { as: "zone", foreignKey: "zone_id" });
    }
  }

  districtToZone.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      district_id: { type: DataTypes.INTEGER },
      zone_id: { type: DataTypes.INTEGER },
    },
    {
      sequelize,
      tableName: "districtToZone",
      modelName: "districtToZone",
      timestamps: false,
    },
  );

  districtToZone.beforeCreate(async (data, options) => {
    let errorMessage = "";
    const { district_id, zone_id } = data;
    if (district_id && zone_id) {
      const isDuplicate = await districtToZone
        .count({ where: { district_id, zone_id } })
        .then((count) => count <= 0);
      if (!isDuplicate) errorMessage = "Дүүрэгт бүс нэмсэн байна";
    } else {
      errorMessage = "Мэдээллээ гүйцэд оруулна уу";
    }
    if (errorMessage !== "") throw errorMessage;
  });

  return districtToZone;
};
