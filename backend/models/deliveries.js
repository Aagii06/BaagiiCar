const Sequelize = require("sequelize");
const { Op } = Sequelize;

module.exports = (sequelize, DataTypes) => {
  class deliveries extends Sequelize.Model {
    static associate({ organizations, zones, users, vwDriver }) {
      this.belongsTo(organizations, {
        as: "organization",
        foreignKey: "organization_id",
      });
      this.belongsTo(zones, { as: "zone", foreignKey: "zone_id" });

      this.belongsTo(vwDriver, { as: "receiveBy", foreignKey: "receive_by" });
      this.belongsTo(users, { as: "confirmBy", foreignKey: "confirm_by" });
      this.belongsTo(vwDriver, { as: "allocateBy", foreignKey: "allocate_by" });
      this.belongsTo(vwDriver, { as: "allocateTo", foreignKey: "allocate_to" });
      this.belongsTo(vwDriver, { as: "deliveryBy", foreignKey: "delivery_by" });

      this.belongsTo(users, { as: "createdBy", foreignKey: "created_by" });
      this.belongsTo(users, { as: "updatedBy", foreignKey: "updated_by" });
      this.belongsTo(users, { as: "deletedBy", foreignKey: "deleted_by" });
      this.belongsTo(users, { as: "settledBy", foreignKey: "settled_by" });
      this.belongsTo(users, {
        as: "feeSettledBy",
        foreignKey: "fee_settled_by",
      });
    }
  }

  deliveries.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      organization_id: { type: DataTypes.INTEGER },
      zone_id: { type: DataTypes.INTEGER },

      image: { type: DataTypes.STRING },
      code: { type: DataTypes.STRING },
      title: { type: DataTypes.STRING },
      product_name: { type: DataTypes.STRING },
      product_code: { type: DataTypes.STRING },

      is_paid: { type: DataTypes.TINYINT },
      paid_amount: { type: DataTypes.FLOAT },

      phonenumber: { type: DataTypes.STRING },
      phonenumber2: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      description: { type: DataTypes.STRING },
      comment: { type: DataTypes.STRING },

      created_type: { type: DataTypes.STRING },
      status: { type: DataTypes.STRING },

      receive_by: { type: DataTypes.INTEGER },
      receive_at: { type: DataTypes.STRING },

      confirm_by: { type: DataTypes.INTEGER },
      confirm_at: { type: DataTypes.STRING },
      confirm_notes: { type: DataTypes.STRING },
      confirm_cause: { type: DataTypes.STRING },
      confirm_cause_other: { type: DataTypes.STRING },

      allocate_by: { type: DataTypes.INTEGER },
      allocate_to: { type: DataTypes.INTEGER },
      allocate_at: { type: DataTypes.STRING },

      delivery_by: { type: DataTypes.INTEGER },
      delivery_at: { type: DataTypes.STRING },
      delivery_cause: { type: DataTypes.STRING },
      delivery_cause_other: { type: DataTypes.STRING },
      delivery_after: { type: DataTypes.STRING },
      delivery_after_other: { type: DataTypes.STRING },

      delivery_fee: { type: DataTypes.FLOAT, defaultValue: 6000 },

      refund_by: { type: DataTypes.INTEGER },
      refund_at: { type: DataTypes.STRING },

      // Барааны (COD) тооцоо - харилцагчид буцаах бэлэн мөнгөний тооцоо
      is_settled: { type: DataTypes.TINYINT, defaultValue: false },
      settled_by: { type: DataTypes.INTEGER },
      settled_at: { type: DataTypes.STRING },

      // Хүргэлтийн тооцоо - харилцагчаас авах хүргэлтийн хураамжийн тооцоо
      is_fee_settled: { type: DataTypes.TINYINT, defaultValue: false },
      fee_settled_by: { type: DataTypes.INTEGER },
      fee_settled_at: { type: DataTypes.STRING },

      created_by: { type: DataTypes.INTEGER },
      updated_by: { type: DataTypes.INTEGER },
      deleted_by: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.STRING },
      updated_at: { type: DataTypes.STRING },
      deleted_at: { type: DataTypes.STRING },
    },
    {
      sequelize,
      tableName: "deliveries",
      modelName: "deliveries",
      timestamps: false,
    },
  );

  deliveries.softDelete = true;

  deliveries.exportFields = ["id"];

  // Эдгээр төлөвтэй хүргэлтийг устгахыг зөвшөөрөхгүй
  deliveries.blockDeleteStatuses = [
    "Хуваарилагдсан",
    "Хүргэлтэнд гарсан",
    "Хүргэгдсэн",
    "Буцаагдсан",
  ];

  deliveries.beforeSave(async (data, options) => {
    let errorMessage = "";
    const { id, code, status, image } = data;

    // Баталгаажсан (гоодс эсвэл хүргэлтийн хураамжийн) тооцоотой хүргэлтэд
    // ямар ч өөрчлөлт (засах, устгах, төлөв солих гэх мэт) хийхийг хориглоно.
    if (id) {
      const {
        deliveriesSettlement,
        deliveriesSettlementBatch,
        deliveriesFeeSettlement,
        deliveriesFeeSettlementBatch,
      } = require("./index");

      const isSettlementLocked = await deliveriesSettlement
        .count({
          where: { delivery_id: id },
          include: [
            {
              model: deliveriesSettlementBatch,
              as: "settlementBatch",
              where: { status: "Баталгаажсан" },
              attributes: [],
            },
          ],
          transaction: options.transaction,
        })
        .then((count) => count > 0);

      const isFeeSettlementLocked =
        !isSettlementLocked &&
        (await deliveriesFeeSettlement
          .count({
            where: { delivery_id: id },
            include: [
              {
                model: deliveriesFeeSettlementBatch,
                as: "settlementBatch",
                where: { status: "Баталгаажсан" },
                attributes: [],
              },
            ],
            transaction: options.transaction,
          })
          .then((count) => count > 0));

      if (isSettlementLocked || isFeeSettlementLocked)
        throw "Баталгаажсан тооцоотой хүргэлтэд үйлдэл хийх боломжгүй";
    }

    if (code) {
      const isCode = await deliveries
        .count({
          where: { code, status: { [Op.ne]: "deleted" }, id: { [Op.ne]: id } },
        })
        .then((count) => count <= 0);

      if (!isCode) errorMessage += "Код давхардаж байна";
    }

    if (status) {
      const item = await deliveries.findByPk(id, {
        attributes: ["id", "image"],
        raw: true,
      });

      // if (
      //   [
      //     "Баталгаажуулсан",
      //     "Хуваарилагдсан",
      //     "Хүргэлтэнд гарсан",
      //     "Хүргэгдсэн",
      //     "Буцаагдсан",
      //   ].includes(data.status)
      // ) {
      //   if (!data.image && !item.image) {
      //     errorMessage += errorMessage !== "" ? ", " : "";
      //     errorMessage +=
      //       "Зураг оруулаагүй бол " + data.status + " төлөвт орох боломжгүй";
      //   }
      // }

      if (
        [
          "Баталгаажуулсан",
          "Хуваарилагдсан",
          "Хүргэлтэнд гарсан",
          "Хүргэгдсэн",
          "Буцаагдсан",
        ].includes(status) &&
        item &&
        item.image
      ) {
        if (item.image && !image) {
          errorMessage += errorMessage !== "" ? ", " : "";
          errorMessage += "Хүргэлтийн зураг устгаж болохгүй";
        }
      }

      if (
        ["Баталгаажуулсан", "Цуцалсан", "Хүлээн авсан", "Шинэ"].includes(status)
      ) {
        allocate_to = null;
      }
    }

    if (errorMessage !== "") throw errorMessage;
  });

  return deliveries;
};
