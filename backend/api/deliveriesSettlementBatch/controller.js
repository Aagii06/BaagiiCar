const {
  deliveries,
  deliveriesSettlement,
  deliveriesSettlementBatch,
  sequelize,
  op,
} = require("../../models");
const { saveLog } = require("../../utils/logHelper");

// Тооцоог баталгаажуулах
module.exports.confirm = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { id, by, at } = req.body;

  const t = await sequelize.transaction();
  try {
    if (id) {
      const item = await deliveriesSettlementBatch.findByPk(id, {
        raw: true,
      });
      if (item) {
        if (item.status === "Баталгаажсан") {
          await t.rollback();
          result.success = false;
          result.message = "Тооцоо аль хэдийн баталгаажсан байна";
          return res.status(200).json(result);
        }
        if (item.status === "Хаагдсан") {
          await t.rollback();
          result.success = false;
          result.message = "Хаагдсан тооцоог баталгаажуулах боломжгүй";
          return res.status(200).json(result);
        }

        await deliveriesSettlementBatch.update(
          { status: "Баталгаажсан", confirmed_by: by, confirmed_at: at },
          { where: { id }, transaction: t },
        );
        await saveLog(
          {
            object_name: "deliveriesSettlementBatch",
            object_id: id,
            log_action: "confirmed",
            log_action_mn: "Тооцоо баталгаажуулсан",
            modify_data: JSON.stringify({ id }),
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
      result.message = "Баталгаажуулах тооцоогоо сонгоно уу";
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

// Баталгаажсан тооцоог хаах
module.exports.close = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { id, by, at } = req.body;

  const t = await sequelize.transaction();
  try {
    if (id) {
      const item = await deliveriesSettlementBatch.findByPk(id, {
        raw: true,
      });
      if (item) {
        if (item.status !== "Баталгаажсан") {
          await t.rollback();
          result.success = false;
          result.message = "Эхлээд тооцоог баталгаажуулна уу";
          return res.status(200).json(result);
        }

        await deliveriesSettlementBatch.update(
          { status: "Хаагдсан" },
          { where: { id }, transaction: t },
        );
        await saveLog(
          {
            object_name: "deliveriesSettlementBatch",
            object_id: id,
            log_action: "closed",
            log_action_mn: "Тооцоо хаасан",
            modify_data: JSON.stringify({ id }),
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
      result.message = "Хаах тооцоогоо сонгоно уу";
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

// Баталгаажаагүй тооцооны багцад хүргэлт нэмэх (нэг буюу олноор)
// Зөвхөн "Хүргэгдсэн" төлөвтэй, төлбөр (COD) авсан (is_paid=true, paid_amount>0),
// одоогоор өөр тооцоонд ороогүй (is_settled=false) хүргэлтийг нэмэх боломжтой.
module.exports.addDelivery = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { id, ids, by, at } = req.body;

  const t = await sequelize.transaction();
  try {
    if (id && ids && Array.isArray(ids) && ids.length > 0) {
      const batch = await deliveriesSettlementBatch.findByPk(id, {
        transaction: t,
      });

      if (!batch) {
        await t.rollback();
        result.success = false;
        result.message = "Тооцооны багц олдсонгүй";
        return res.status(200).json(result);
      }

      if (batch.status !== "Баталгаажаагүй") {
        await t.rollback();
        result.success = false;
        result.message =
          batch.status === "Хаагдсан"
            ? "Хаагдсан тооцоонд хүргэлт нэмэх боломжгүй"
            : "Баталгаажсан тооцоонд хүргэлт нэмэх боломжгүй";
        return res.status(200).json(result);
      }

      const items = await deliveries.findAll({
        where: {
          id: ids,
          status: "Хүргэгдсэн",
          is_paid: true,
          paid_amount: { [op.gt]: 0 },
          is_settled: { [op.ne]: true },
        },
        transaction: t,
        raw: true,
      });

      if (!items || items.length === 0) {
        await t.rollback();
        result.success = false;
        result.message = "Тооцоонд нэмэх боломжтой хүргэлт сонгогдоогүй байна";
        return res.status(200).json(result);
      }

      const totalAmount = items.reduce(
        (sum, item) => sum + (parseFloat(item.paid_amount) || 0),
        0,
      );

      for (let i = 0; i < items.length; i++) {
        const { id: deliveryId, ...rest } = items[i];
        await deliveriesSettlement.create(
          {
            ...rest,
            delivery_id: deliveryId,
            settlement_batch_id: id,
            settled_by: by,
            settled_at: at,
          },
          { transaction: t },
        );
        await deliveries.update(
          { is_settled: true, settled_by: by, settled_at: at },
          { where: { id: deliveryId }, transaction: t, individualHooks: true },
        );
        await saveLog(
          {
            object_name: "deliveries",
            object_id: deliveryId,
            log_action: "settled",
            log_action_mn: "Тооцооны багцад нэмсэн",
            modify_data: JSON.stringify({ id: deliveryId, batch_id: id }),
            created_by: by,
            created_at: at,
          },
          t,
        );
      }

      await deliveriesSettlementBatch.increment(
        { total_count: items.length, total_amount: totalAmount },
        { where: { id }, transaction: t },
      );

      await t.commit();
      result.success = true;
      result.message = "Амжилттай";
      return res.status(200).json(result);
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Тооцооны багц болон нэмэх хүргэлтүүдээ сонгоно уу";
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
