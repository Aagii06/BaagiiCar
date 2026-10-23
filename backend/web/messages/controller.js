const moment = require("moment");
const { messages, messageReplies, cars, sequelize, op } = require("../../models");

// Вэбийн чат цонх: нэвтэрсэн хэрэглэгчийн мессежийг админд хадгална (нэр, утас нь токеноос)
module.exports.send = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  const { message, car_id, page_url } = req.body;
  const { id: userId, firstname, phonenumber } = req.loggedUser ?? {};
  try {
    // Устгагдсан / байхгүй зар руу заахгүй
    const car = car_id ? await cars.findByPk(car_id, { attributes: ["id"], raw: true }) : null;
    const at = moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");
    const item = await messages.create({
      type: "car",
      name: firstname || null,
      phonenumber,
      message,
      car_id: car ? car.id : null,
      page_url: page_url || null,
      status: "new",
      created_by: userId ?? null,
      created_at: at,
      updated_at: at,
    });
    result.success = true;
    result.data = { id: item.id };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

// Нэвтэрсэн хэрэглэгчийн өөрийн илгээсэн мессежүүд (профайлын "Мессеж" цэс), шинэ нь эхэндээ
module.exports.mine = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  try {
    const rows = await messages.findAll({
      where: { created_by: req.loggedUser?.id ?? 0, deleted_at: { [op.is]: null } },
      // reply / replied_at: хамгийн сүүлийн хариу; replies: бүх хариу (api/messages/reply)
      attributes: ["id", "type", "message", "reply", "replied_at", "car_id", "status", "created_at"],
      order: [["id", "DESC"]],
      limit: 200,
      raw: true,
    });
    const replies = rows.length
      ? await messageReplies.findAll({
          where: { message_id: { [op.in]: rows.map((m) => m.id) } },
          attributes: ["id", "message_id", "reply", "read_at", "created_at", "updated_at"],
          order: [["id", "ASC"]],
          raw: true,
        })
      : [];
    result.success = true;
    result.data = {
      rows: rows.map((m) => {
        const own = replies.filter((r) => r.message_id === m.id);
        // unread: хэрэглэгчийн хараахан нээгээгүй хариуны тоо
        return { ...m, replies: own, unread: own.filter((r) => !r.read_at).length };
      }),
      count: rows.length,
    };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

// Нэвтэрсэн хэрэглэгчийн мессежүүдийн хариунаас уншаагүйн тоо (badge)
const ownMessageIds = (userId, where = {}) =>
  sequelize.literal(
    `(SELECT id FROM messages WHERE created_by = ${sequelize.escape(userId)} AND deleted_at IS NULL${
      "car_id" in where ? ` AND car_id ${where.car_id ? `= ${sequelize.escape(where.car_id)}` : "IS NULL"}` : ""
    })`,
  );

module.exports.unread = async (req, res) => {
  let result = { success: false, data: { count: 0 }, message: "Амжилттай" };
  try {
    const count = await messageReplies.count({
      where: { message_id: { [op.in]: ownMessageIds(req.loggedUser?.id ?? 0) }, read_at: { [op.is]: null } },
    });
    result.success = true;
    result.data = { count };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

// Нэг ярианы (зар бүрийн, car_id хоосон бол ерөнхий) хариуг уншсан болгоно. body: { car_id }
module.exports.markRead = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  try {
    const at = moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");
    const [affected] = await messageReplies.update(
      { read_at: at },
      {
        where: {
          message_id: { [op.in]: ownMessageIds(req.loggedUser?.id ?? 0, { car_id: req.body.car_id || null }) },
          read_at: { [op.is]: null },
        },
      },
    );
    result.success = true;
    result.data = { count: affected };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};
