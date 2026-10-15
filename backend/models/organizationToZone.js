const Sequelize = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class organizationToZone extends Sequelize.Model {
    static associate({ organizations, zones }) {
      this.belongsTo(organizations, {
        as: "organization",
        foreignKey: "organization_id",
      });
      this.belongsTo(zones, { as: "zone", foreignKey: "zone_id" });
    }
  }

  organizationToZone.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      organization_id: { type: DataTypes.INTEGER },
      zone_id: { type: DataTypes.INTEGER },
    },
    {
      sequelize,
      tableName: "organizationToZone",
      modelName: "organizationToZone",
      timestamps: false,
    },
  );

  organizationToZone.beforeCreate(async (data, options) => {
    let errorMessage = "";
    const { organization_id, zone_id } = data;
    if (organization_id && zone_id) {
      const isDuplicate = await organizationToZone
        .count({ where: { organization_id, zone_id } })
        .then((count) => count <= 0);
      if (!isDuplicate) errorMessage = "Байгууллагад бүс нэмсэн байна";
    } else {
      errorMessage = "Мэдээллээ гүйцэд оруулна уу";
    }
    if (errorMessage !== "") throw errorMessage;
  });

  return organizationToZone;
};
