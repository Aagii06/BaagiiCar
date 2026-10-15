const {
  deliveries,
  deliveriesSettlement,
  deliveriesSettlementBatch,
  sequelize,
} = require("../../models");
const { saveLog } = require("../../utils/logHelper");

// Тооцоог буцаах (тооцоогүй болгох)
module.exports.revert = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { id, by, at } = req.body;

  const t = await sequelize.transaction();
  try {
    if (id) {
      const item = await deliveriesSettlement.findByPk(id, {
        include: [
          {
            model: deliveriesSettlementBatch,
            as: "settlementBatch",
            attributes: ["id", "status"],
          },
        ],
      });
      if (
        item &&
        item.settlementBatch &&
        item.settlementBatch.status !== "Баталгаажаагүй"
      ) {
        await t.rollback();
        result.success = false;
        result.message =
          item.settlementBatch.status === "Хаагдсан"
            ? "Хаагдсан тооцооноос хүргэлт буцаах боломжгүй"
            : "Баталгаажсан тооцооноос хүргэлт буцаах боломжгүй";
        return res.status(200).json(result);
      }
      if (item) {
        await deliveriesSettlement.destroy({
          where: { id },
          transaction: t,
        });
        await deliveriesSettlementBatch.decrement(
          { total_count: 1, total_amount: parseFloat(item.paid_amount) || 0 },
          { where: { id: item.settlement_batch_id }, transaction: t },
        );
        await deliveries.update(
          { is_settled: false, settled_by: null, settled_at: null },
          {
            where: { id: item.delivery_id },
            transaction: t,
            individualHooks: true,
          },
        );
        await saveLog(
          {
            object_name: "deliveries",
            object_id: item.delivery_id,
            log_action: "unsettled",
            log_action_mn: "Тооцоог буцаасан",
            modify_data: JSON.stringify({ id: item.delivery_id }),
            created_by: by,
            created_at: at,
          },
          t,
        );

        await t.commit();
        result.success = true;
        result.message = "Амжилттай";
        return res.status(200).json(result);
      } else {
        await t.rollback();
        result.success = false;
        result.message = "Тооцооны мэдээлэл олдсонгүй";
      }
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Буцаах тооцоогоо сонгоно уу";
    }
    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.success = false;
    result.message = "Алдаа!";
    return res.status(200).json(result);
  }
};
