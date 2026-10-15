const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class areaToZone extends Sequelize.Model {
    static associate({ areas, zones }) {
      this.belongsTo(areas, { as: "area", foreignKey: "area_id" });
      this.belongsTo(zones, { as: "zone", foreignKey: "zone_id" });
    }
  }

  areaToZone.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      area_id: { type: DataTypes.INTEGER },
      zone_id: { type: DataTypes.INTEGER },
    },
    {
      sequelize,
      tableName: "areaToZone",
      modelName: "areaToZone",
      timestamps: false,
    },
  );

  areaToZone.beforeCreate(async (data, options) => {
    let errorMessage = "";
    const { area_id, zone_id } = data;
    if (area_id && zone_id) {
      const isDuplicate = await areaToZone
        .count({ where: { area_id, zone_id } })
        .then((count) => count <= 0);
      if (!isDuplicate) errorMessage = "Байгууллагад бүс нэмсэн байна";
    } else {
      errorMessage = "Мэдээллээ гүйцэд оруулна уу";
    }
    if (errorMessage !== "") throw errorMessage;
  });

  return areaToZone;
};
