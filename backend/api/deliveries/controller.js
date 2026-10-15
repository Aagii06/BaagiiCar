const excelJS = require("exceljs");
const xlsx = require("node-xlsx");
const path = require("path");
const str = require("@supercharge/strings");
const moment = require("moment");

const {
  deliveries,
  deliveriesSettlement,
  deliveriesSettlementBatch,
  deliveriesFeeSettlement,
  deliveriesFeeSettlementBatch,
  users,
  zones,
  organizations,
  vwDriver,
  sequelize,
  op,
} = require("../../models");

// 1 хүргэлтийн хураамж
const DELIVERY_FEE = 6000;

const { uploadImage, uploadExcel } = require("../../helper/fileHelper");
const { saveLog } = require("../../utils/logHelper");
const { getSelect } = require("../../utils/modelHelper");
const {
  convertCapitalize,
  isValidDate,
  parseExcelDate,
} = require("../../helper/helper");

module.exports.save = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  let { id, modifyData, by, at, ...body } = req.body;
  let { files } = req;

  const t = await sequelize.transaction();
  try {
    const action = id ? "updated" : "created";

    const image = await uploadImage("deliveries", files);
    if (image) body = Object.assign(body, { image });

    let item = null;
    if (id) {
      // update
      item = await deliveries
        .update(
          { ...body, updated_by: by, updated_at: at },
          {
            where: { id, status: { [op.ne]: "deleted" } },
            transaction: t,
            individualHooks: true,
          },
        )
        .then(async () => await deliveries.findByPk(id, { raw: true }));
    } else {
      // create
      item = await deliveries.create(
        { ...body, created_type: "Гараар", created_by: by, created_at: at },
        { transaction: t, individualHooks: true },
      );
    }

    if (item) {
      {
        await saveLog(
          {
            object_name: "deliveries",
            object_id: item.id,
            log_action: action,
            modify_data: JSON.stringify(modifyData),
            created_by: by,
            created_at: at,
          },
          t,
        );
      }
    }

    await t.commit();
    result.success = true;
    result.data = { id };
    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.success = false;
    result.data = error;
    result.message = typeof error === "string" ? error : "Алдаа";
    return res.status(200).json(result);
  }
};

// Нэг байгууллагад олон хүргэлт зэрэг үүсгэх
module.exports.multiCreate = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  const { organization_id, items, by, at } = req.body;

  const t = await sequelize.transaction();
  try {
    const createdIds = [];
    for (let i = 0; i < items.length; i++) {
      const { phonenumber, phonenumber2, address, is_paid, paid_amount } =
        items[i];

      const item = await deliveries.create(
        {
          organization_id,
          phonenumber,
          phonenumber2,
          address,
          is_paid: !!is_paid,
          paid_amount: is_paid ? paid_amount : null,
          status: "Шинэ",
          created_type: "Гараар",
          created_by: by,
          created_at: at,
        },
        { transaction: t, individualHooks: true },
      );

      createdIds.push(item.id);

      await saveLog(
        {
          object_name: "deliveries",
          object_id: item.id,
          log_action: "created",
          modify_data: JSON.stringify(items[i]),
          created_by: by,
          created_at: at,
        },
        t,
      );
    }

    await t.commit();
    result.success = true;
    result.data = { ids: createdIds };
    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.success = false;
    result.data = error;
    result.message = typeof error === "string" ? error : "Алдаа";
    return res.status(200).json(result);
  }
};

// Хүлээн авах
module.exports.receive = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { by, at, ...body } = req.body;
  let { loggedUser, files } = req;

  const t = await sequelize.transaction();
  try {
    const { id, receive_by } = body;
    if (id && loggedUser) {
      const item = await deliveries.findOne({
        where: { id, status: "Шинэ" },
        raw: true,
      });
      if (item) {
        if (item.status === "Шинэ") {
          const image = await uploadImage("deliveries", files);
          if (image) data = Object.assign(data, { image });

          let updateData = {
            receive_by,
            receive_at: at,
            status: "Хүлээн авсан",
          };
          if (image) updateData = { ...updateData, image };
          await deliveries.update(updateData, {
            where: { id },
            transaction: t,
            individualHooks: true,
          });
          await saveLog(
            {
              object_name: "deliveries",
              object_id: item.id,
              log_action: "receive",
              log_action_mn: "Хүлээн авсан",
              modify_data: JSON.stringify({ id }),
              created_by: by,
              created_at: at,
            },
            t,
          );
        }
        await t.commit();
        result.success = true;
        result.message = "Амжилттай";
        return res.status(200).json(result);
      } else {
        await t.rollback();
        result.success = false;
        result.message = "Хүргэлтийн мэдээлэл олдсонгүй";
      }
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Хүргэлтийн мэдээлэл олдсонгүй";
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

// Олон тоогоор хүлээн авах
module.exports.bulkReceive = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { ids, receive_by, by, at } = req.body;

  const t = await sequelize.transaction();
  try {
    if (ids) {
      const items = await deliveries.findAll({
        attributes: ["id", "status"],
        where: { id: ids, status: "Шинэ" },
        raw: true,
      });
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.status === "Шинэ") {
            await deliveries.update(
              { receive_by, receive_at: at, status: "Хүлээн авсан" },
              { where: { id: item.id }, transaction: t, individualHooks: true },
            );
            await saveLog(
              {
                object_name: "deliveries",
                object_id: item.id,
                log_action: "receive",
                log_action_mn: "Хүлээн авсан",
                modify_data: JSON.stringify({ id: item.id }),
                created_by: by,
                created_at: at,
              },
              t,
            );
          }
        }
        await t.commit();
        result.success = true;
        result.message = "Амжилттай";
        return res.status(200).json(result);
      } else {
        await t.rollback();
        result.success = false;
        result.message = "Хүргэлтийн мэдээлэл олдсонгүй";
      }
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Хүргэлтүүдээ сонгоно уу";
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

// Цуцлах
module.exports.cancel = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { id, cancelled_by, by, at } = req.body;
  let { loggedUser } = req;

  const t = await sequelize.transaction();
  try {
    if (id && cancelled_by && loggedUser) {
      const item = await deliveries.findOne({
        where: { id, status: { [op.in]: ["Хүлээн авсан", "Баталгаажуулсан"] } },
        raw: true,
      });
      if (item) {
        if (["Хүлээн авсан", "Баталгаажуулсан"].includes(item.status)) {
          await deliveries.update(
            { cancelled_by, cancelled_at: at, status: "Цуцалсан" },
            { where: { id }, transaction: t, individualHooks: true },
          );
          await saveLog(
            {
              object_name: "deliveries",
              object_id: item.id,
              log_action: "cancelled",
              log_action_mn: "Цуцалсан",
              modify_data: JSON.stringify({ id }),
              created_by: by,
              created_at: at,
            },
            t,
          );
        } else {
          await t.rollback();
          result.success = false;
          result.message = "Буцаах хүргэлт олдсонгүй";
        }

        await t.commit();
        result.success = true;
        result.message = "Амжилттай";
        return res.status(200).json(result);
      } else {
        await t.rollback();
        result.success = false;
        result.message = "Хүргэлтийн мэдээлэл олдсонгүй";
      }
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Хүргэлтийн мэдээлэл олдсонгүй";
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

// Буцаах
module.exports.refund = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { id, refund_by, by, at } = req.body;
  let { loggedUser } = req;

  const t = await sequelize.transaction();
  try {
    if (id && refund_by && loggedUser) {
      const item = await deliveries.findOne({
        where: {
          id,
          status: { [op.in]: ["Хуваарилагдсан", "Хүргэлтэнд гарсан"] },
        },
        raw: true,
      });
      if (item) {
        if (["Хуваарилагдсан", "Хүргэлтэнд гарсан"].includes(item.status)) {
          await deliveries.update(
            { refund_by, refund_at: at, status: "Буцаасан" },
            { where: { id }, transaction: t, individualHooks: true },
          );
          await saveLog(
            {
              object_name: "deliveries",
              object_id: item.id,
              log_action: "refund",
              log_action_mn: "Буцаасан",
              modify_data: JSON.stringify({ id }),
              created_by: by,
              created_at: at,
            },
            t,
          );
        } else {
          await t.rollback();
          result.success = false;
          result.message = "Буцаах хүргэлт олдсонгүй";
        }

        await t.commit();
        result.success = true;
        result.message = "Амжилттай";
        return res.status(200).json(result);
      } else {
        await t.rollback();
        result.success = false;
        result.message = "Хүргэлтийн мэдээлэл олдсонгүй";
      }
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Хүргэлтийн мэдээлэл олдсонгүй";
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

// Баталгаажуулах & Цуцлах
module.exports.confirm = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const {
    ids,
    status,
    confirm_notes,
    confirm_cause,
    confirm_cause_other,
    by,
    at,
  } = req.body;

  const t = await sequelize.transaction();
  try {
    if (ids) {
      const items = await deliveries.findAll({
        attributes: ["id", "image", "status"],
        where: { id: ids, status: "Хүлээн авсан" },
        raw: true,
      });
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.status === "Хүлээн авсан") {
            await deliveries.update(
              {
                confirm_by: by,
                confirm_at: at,
                confirm_notes,
                status,
                confirm_cause,
                confirm_cause_other,
              },
              { where: { id: item.id }, transaction: t, individualHooks: true },
            );
            await saveLog(
              {
                object_name: "deliveries",
                object_id: item.id,
                log_action: "receive",
                log_action_mn: status,
                modify_data: JSON.stringify({ id: item.id }),
                created_by: by,
                created_at: at,
              },
              t,
            );
          }
        }

        await t.commit();
        result.success = true;
        result.message = "Амжилттай";
        return res.status(200).json(result);
      } else {
        await t.rollback();
        result.success = false;
        result.message = "Хүргэлтийн мэдээлэл олдсонгүй";
      }
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Хүргэлтүүдээ сонгоно уу";
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

// Хуваарилах
module.exports.allocate = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { ids, allocate_to, by, at } = req.body;
  const { loggedUser } = req;

  const t = await sequelize.transaction();
  try {
    if (ids && loggedUser) {
      const driver = await users.findOne({
        where: { id: allocate_to },
        attributes: ["id", "phonenumber", "role"],
        raw: true,
      });

      if (!driver) {
        result.success = false;
        result.message = "Жолоочийн мэдээлэл олдсонгүй";
        return res.status(200).json(result);
      }

      if (driver.role !== "Жолооч") {
        result.success = false;
        result.message = `Сонгосон хэрэглэгч "Жолооч" биш байна`;
        return res.status(200).json(result);
      }

      const items = await deliveries.findAll({
        where: {
          id: ids,
          status: [
            "Баталгаажуулсан",
            "Хуваарилагдсан",
            "Дахин хуваарилах",
            "Хойшлуулсан",
          ],
        },
        attributes: ["id", "status"],
        raw: true,
      });
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (
            [
              "Баталгаажуулсан",
              "Хуваарилагдсан",
              "Дахин хуваарилах",
              "Хойшлуулсан",
            ].includes(item.status)
          ) {
            await deliveries.update(
              {
                allocate_to,
                allocate_by: by,
                allocate_at: at,
                status: "Хуваарилагдсан",
              },
              { where: { id: item.id }, transaction: t, individualHooks: true },
            );
            await saveLog(
              {
                object_name: "deliveries",
                object_id: item.id,
                log_action: "allocate",
                log_action_mn: "Хуваарилагдсан",
                modify_data: JSON.stringify({ id: item.id }),
                created_by: by,
                created_at: at,
              },
              t,
            );
          }
        }

        await t.commit();
        result.success = true;
        result.message = "Амжилттай";
        return res.status(200).json(result);
      } else {
        await t.rollback();
        result.success = false;
        result.message = "Хуваарилах боломжтой хүргэлт сонгогдоогүй байна";
      }
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Хуваарилах хүргэлтүүдээ сонгоно уу";
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

// Хүргэлт хийх
module.exports.delivery = async (req, res) => {
  let result = { success: true, data: null, message: "" };
  const { id, status, delivery_cause, delivery_cause_other, by, at } = req.body;
  const { loggedUser } = req;

  const t = await sequelize.transaction();
  try {
    if (id && loggedUser) {
      const item = await deliveries.findOne({
        where: { id, status: "Хуваарилагдсан" },
        raw: true,
      });
      if (item) {
        await deliveries.update(
          {
            delivery_by: by,
            delivery_at: at,
            status,
            delivery_cause,
            delivery_cause_other,
            ...(status === "Хүргэгдсэн" && item.delivery_fee == null
              ? { delivery_fee: DELIVERY_FEE }
              : {}),
          },
          { where: { id }, transaction: t, individualHooks: true },
        );
        await saveLog(
          {
            object_name: "deliveries",
            object_id: item.id,
            log_action: "delivery",
            log_action_mn: status,
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
        result.message = "Хүргэлтийн мэдээлэл олдсонгүй";
      }
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Хүргэлтийн дугаар олдсонгүй";
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

module.exports.bulkDelivery = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { ids, delivery_by, by, at } = req.body;

  const t = await sequelize.transaction();
  try {
    if (ids && delivery_by) {
      const items = await deliveries.findAll({
        attributes: ["id", "status", "delivery_fee"],
        where: { id: ids, status: "Хуваарилагдсан" },
        raw: true,
      });
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.status === "Хуваарилагдсан") {
            await deliveries.update(
              {
                delivery_by,
                delivery_at: at,
                status: "Хүргэгдсэн",
                ...(item.delivery_fee == null
                  ? { delivery_fee: DELIVERY_FEE }
                  : {}),
              },
              { where: { id: item.id }, transaction: t, individualHooks: true },
            );
            await saveLog(
              {
                object_name: "deliveries",
                object_id: item.id,
                log_action: "delivery",
                log_action_mn: "Хүргэгдсэн",
                modify_data: JSON.stringify({ id: item.id }),
                created_by: by,
                created_at: at,
              },
              t,
            );
          }
        }
        await t.commit();
        result.success = true;
        result.message = "Амжилттай";
        return res.status(200).json(result);
      } else {
        await t.rollback();
        result.success = false;
        result.message = "Хүргэлтийн мэдээлэл олдсонгүй";
      }
      return res.status(200).json(result);
    } else {
      result.success = false;
      result.message = "Мэдээлэл дутуу байна";
      return res.status(200).json(result);
    }
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.success = false;
    result.message = "Алдаа!";
    return res.status(200).json(result);
  }
};

// Тооцоо хийх
module.exports.settle = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { ids, by, at } = req.body;

  const t = await sequelize.transaction();
  try {
    if (ids && Array.isArray(ids)) {
      const items = await deliveries.findAll({
        where: {
          id: ids,
          status: "Хүргэгдсэн",
          is_paid: true,
          is_settled: { [op.ne]: true },
        },
        raw: true,
      });
      if (items && items.length > 0) {
        const totalAmount = items.reduce(
          (sum, item) => sum + (parseFloat(item.paid_amount) || 0),
          0,
        );
        const batch = await deliveriesSettlementBatch.create(
          {
            total_count: items.length,
            total_amount: totalAmount,
            status: "Баталгаажаагүй",
            created_by: by,
            created_at: at,
          },
          { transaction: t },
        );

        for (let i = 0; i < items.length; i++) {
          const { id, ...rest } = items[i];
          await deliveriesSettlement.create(
            {
              ...rest,
              delivery_id: id,
              settlement_batch_id: batch.id,
              settled_by: by,
              settled_at: at,
            },
            { transaction: t },
          );
          await deliveries.update(
            { is_settled: true, settled_by: by, settled_at: at },
            { where: { id }, transaction: t, individualHooks: true },
          );
          await saveLog(
            {
              object_name: "deliveries",
              object_id: id,
              log_action: "settled",
              log_action_mn: "Тооцоо хийсэн",
              modify_data: JSON.stringify({ id }),
              created_by: by,
              created_at: at,
            },
            t,
          );
        }
        await t.commit();
        result.success = true;
        result.message = "Амжилттай";
        return res.status(200).json(result);
      } else {
        await t.rollback();
        result.success = false;
        result.message = "Тооцоо хийх боломжтой хүргэлт сонгогдоогүй байна";
      }
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Хүргэлтүүдээ сонгоно уу";
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

// Хүргэлтийн хураамжийн тооцоо хийх
module.exports.settleFee = async (req, res) => {
  let result = { success: true, data: null, message: "" };

  const { ids, by, at } = req.body;

  const t = await sequelize.transaction();
  try {
    if (ids && Array.isArray(ids)) {
      const items = await deliveries.findAll({
        where: {
          id: ids,
          status: "Хүргэгдсэн",
          is_fee_settled: { [op.ne]: true },
        },
        raw: true,
      });
      if (items && items.length > 0) {
        const totalAmount = items.reduce(
          (sum, item) => sum + (parseFloat(item.delivery_fee) || 0),
          0,
        );
        const batch = await deliveriesFeeSettlementBatch.create(
          {
            total_count: items.length,
            total_amount: totalAmount,
            status: "Баталгаажаагүй",
            created_by: by,
            created_at: at,
          },
          { transaction: t },
        );

        for (let i = 0; i < items.length; i++) {
          const { id, ...rest } = items[i];
          await deliveriesFeeSettlement.create(
            {
              ...rest,
              delivery_id: id,
              settlement_batch_id: batch.id,
              settled_by: by,
              settled_at: at,
            },
            { transaction: t },
          );
          await deliveries.update(
            { is_fee_settled: true, fee_settled_by: by, fee_settled_at: at },
            { where: { id }, transaction: t, individualHooks: true },
          );
          await saveLog(
            {
              object_name: "deliveries",
              object_id: id,
              log_action: "fee_settled",
              log_action_mn: "Хүргэлтийн хураамжийн тооцоо хийсэн",
              modify_data: JSON.stringify({ id }),
              created_by: by,
              created_at: at,
            },
            t,
          );
        }
        await t.commit();
        result.success = true;
        result.message = "Амжилттай";
        return res.status(200).json(result);
      } else {
        await t.rollback();
        result.success = false;
        result.message = "Тооцоо хийх боломжтой хүргэлт сонгогдоогүй байна";
      }
    } else {
      await t.rollback();
      result.success = false;
      result.message = "Хүргэлтүүдээ сонгоно уу";
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

// excel
// import
module.exports.importExcel = async (req, res) => {
  let { organization_id } = req.body;

  const statuses = [
    "Шинэ",
    "Хүлээн авсан",
    "Баталгаажуулсан",
    "Цуцалсан",
    "Хуваарилагдсан",
    "Хүргэлтэнд гарсан",
    "Хүргэгдсэн",
    "Дахин хуваарилах",
    "Хойшлуулсан",
    "Буцаагдсан",
  ];

  const t = await sequelize.transaction();
  try {
    let { files } = req;
    const { newFilePath } = await uploadExcel("deliveries", files);
    // console.log({ newFilePath });
    let createData = [];
    if (newFilePath) {
      const obj = await xlsx.parse(newFilePath);
      const data = Array.isArray(obj) && obj.length > 0 ? obj[0].data : [];

      // let drivers = [];
      const drivers = await vwDriver.findAll({
        where: { status: { [op.ne]: "deleted" } },
        attributes: ["id", "firstname", "phonenumber", "name_and_phone"],
        raw: true,
      });
      const zoneData = await zones.findAll({
        where: { status: { [op.ne]: "deleted" } },
        attributes: ["id", "name"],
        raw: true,
      });

      const organizationData = await organizations.findAll({
        where: { status: { [op.ne]: "deleted" } },
        attributes: ["id", "name", "register", "phonenumber"],
        raw: true,
      });

      let allocate_to = null;
      let delivery_by = null;
      let delivery_at = null;
      let paid_amount = null;
      let is_paid = true;

      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          let status = null;
          let driver_phonenumber = null;
          let zoneName = null;
          let organizationName = null;
          let driver = null;
          let zone = null;
          let organization = null;
          let phonenumber = null;
          let phonenumber2 = null;
          let phones = [];
          if (data[i][0] !== "№" && !isNaN(parseInt(data[i][0]))) {
            status = data[i][7] ? data[i][7] + "" : null;

            console.log({ status });
            status = status ? status.trim() : null;
            if (status) {
              status = statuses.includes(convertCapitalize(status))
                ? convertCapitalize(status)
                : "Тодорхойгүй";
            } else {
              status = "Шинэ";
            }

            driver_phonenumber = data[i][6] ? data[i][6] + "" : null;
            driver_phonenumber = driver_phonenumber
              ? driver_phonenumber.replace(" ", "").trim()
              : null;
            if (driver_phonenumber) {
              driver = drivers.find(
                (s) => parseInt(s.phonenumber) === parseInt(driver_phonenumber),
              );
            }
            zoneName = data[i][8] ? data[i][8] + "" : null;
            zoneName = zoneName ? zoneName.trim() : null;
            if (zoneName) {
              zone = zoneData.find((s) => s.name === zoneName);
            }

            organizationName = data[i][2] ? data[i][2] + "" : null;
            organizationName = organizationName
              ? organizationName.trim()
              : null;
            if (organizationName) {
              organization = organizationData.find(
                (s) => s.name === organizationName,
              );
            }

            phonenumber = data[i][3] ? data[i][3] + "" : "";
            phonenumber = phonenumber.trim();

            phones = phonenumber.split(" ");
            if (phones.length > 1) {
              phonenumber = phones[0];
              if (phones.length === 2) phonenumber2 = phones[1];
            }

            allocate_to = null;
            delivery_by = null;
            if (status === "Хуваарилагдсан")
              allocate_to = driver ? driver.id : null;

            if (status === "Хүргэгдсэн") {
              delivery_by = driver ? driver.id : null;
              delivery_at = isValidDate(data[i][1])
                ? moment(parseExcelDate(data[i][1])).format(
                    "YYYY-MM-DD HH:mm:ss",
                  )
                : null;
            }

            paid_amount = null;
            paid_amount = data[i][9] ? parseFloat(data[i][9]) : null;
            if (!isNaN(paid_amount) && paid_amount > 0) {
              is_paid = true;
              paid_amount = parseFloat(paid_amount);
            } else {
              is_paid = false;
              paid_amount = null;
            }

            // organization && console.log({ organization });

            createData.push({
              number: parseInt(data[i][0]),
              organization_id: organization ? organization.id : null,
              zone_id: zone ? zone.id : null,
              created_type: "Экселээс",
              created_at: isValidDate(data[i][1])
                ? moment(parseExcelDate(data[i][1])).format(
                    "YYYY-MM-DD HH:mm:ss",
                  )
                : moment().format("YYYY-MM-DD HH:mm:ss"),
              phonenumber,
              phonenumber2,
              address: data[i][4],
              product_code: data[i][5],
              allocate_to,
              delivery_by,
              delivery_at,
              is_paid,
              paid_amount,
              status,
              comment: data[i][9] || "",
            });
          }
        }
      }

      // const [rows] = await sequelize.query(`
      //     SHOW VARIABLES WHERE Variable_name IN (
      //     'character_set_client',
      //     'character_set_connection',
      //     'character_set_results',
      //     'collation_connection'
      //     )
      // `);

      // console.log({ rows });

      // for (const row of createData) {
      //   await deliveries.create(row, {
      //     transaction: t,
      //     validate: true,
      //     individualHooks: true,
      //   });
      // }

      await deliveries.bulkCreate(createData, {
        transaction: t,
        validate: true,
        individualHooks: false,
      });
    }

    await t.commit();
    return res
      .status(200)
      .json({ message: "Амжилттай", success: true, data: createData });
  } catch (error) {
    console.log(error);
    await t.rollback();
    return res
      .status(200)
      .json({ success: false, data: null, message: "Алдаа" });
  }
};

// export
module.exports.exportExcel = async (req, res) => {
  const { limit, offset, where, select, order, group } = req;
  try {
    let modelSelect = {};
    getSelect(select, deliveries, modelSelect);
    let rows = await deliveries.findAll({
      ...modelSelect,
      limit,
      offset,
      where,
      order: order ? order : [],
      raw: true,
      logging: (q) => console.log(q),
    });

    rows = rows.map((row) => ({
      ...row,
      full_phone: `${row.phonenumber} ${row.phonenumber2}`,
    }));

    let excelFile = null;

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Хүргэлт");

    worksheet.columns = [
      { header: "Огноо", key: "created_at", width: 15 },
      { header: "Байгууллага", key: "organization.name", width: 15 },
      { header: "Утасны дугаар", key: "full_phone", width: 18 },
      // { header: "Барааны нэр", key: "title", },
      { header: "Тооцоо хийх дүн", key: "paid_amount", width: 17 },
      { header: "Хаяг", key: "address", width: 30 },
      {
        header: "Хүргэлт хийх жолооч",
        key: "allocateTo.phonenumber",
        width: 20,
      },
      { header: "Төлөв", key: "status", width: 19 },
      { header: "Бэлэн тооцоо", key: "paid_amount", width: 19 },
      { header: "Тайлбар", key: "comment", width: 30 },
    ];

    if (rows.length > 0) {
      for (let i = 0; i < rows.length; i++) {
        let item = JSON.parse(JSON.stringify(rows[i]));
        Object.keys(item).forEach((e) => {
          if (e === "created_at" || e === "delivery_at") {
            item[e] = isValidDate(item[e])
              ? moment(item[e]).format("YYYY-MM-DD")
              : item[e];
          }
          if (typeof item[e] === "string" && item[e].includes("null")) {
            item[e] = item[e].replace("null", "");
          }
        });
        worksheet.addRow(item);
        worksheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => (cell.alignment = { wrapText: true }));
        });
      }
    }

    const fileDir = path.join(__dirname, `../../excel/`);
    const fileName = `export-${str.random()}.xlsx`;
    const filePath = fileDir + fileName;
    // save under export.xlsx
    await workbook.xlsx.writeFile(filePath);
    excelFile = await workbook.xlsx.readFile(filePath);
    if (excelFile) {
      res.contentType(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.download(filePath);
      return;
    } else {
      return res
        .status(200)
        .json({ success: false, message: "Файл үүсгэж чадсангүй" });
    }
  } catch (error) {
    console.log(error);
    return res.status(200).json({ success: false, message: "Алдаа" });
  }
};

module.exports.changeSwitch = async (req, res) => {};
