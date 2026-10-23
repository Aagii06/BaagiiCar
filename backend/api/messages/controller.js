const { messages, messageReplies, op } = require("../../models");
const { saveLog } = require("../../utils/logHelper");
const { isSmsConfigured, sendSms } = require("../../helper/smsHelper");
const { ownScope } = require("../base/config/messages");

// Хамрах хүрээнд байгаа (админ бүгд, дилер өөрийн дилерийн зарын) мессеж
const findOwnMessage = async (req, id) => {
  const scope = await ownScope(req);
  return messages.findOne({ where: { id, type: "car", ...(scope || {}) }, raw: true });
};

// Яриа: нэг хэрэглэгчийн (created_by, байхгүй бол утас) нэг зарын (car_id) тухай мессежүүд
const threadOf = (item) => ({
  type: "car",
  car_id: item.car_id ?? null,
  ...(item.created_by ? { created_by: item.created_by } : { phonenumber: item.phonenumber }),
});

// messages.reply / replied_at-д хамгийн сүүлийн хариуг хадгална (жагсаалт, вэбийн хуучин код)
const syncLatest = async (messageId, extra = {}) => {
  const last = await messageReplies.findOne({ where: { message_id: messageId }, order: [["id", "DESC"]], raw: true });
  await messages.update(
    { reply: last?.reply ?? null, replied_by: last?.created_by ?? null, replied_at: last?.created_at ?? null, ...extra },
    { where: { id: messageId } },
  );
};

// Мессежид шинэ хариу нэмэх. body: { id, reply }
// Мессеж "done" болно; хэрэглэгч вэб дээр харна, SMS холбогдсон бол SMS-ээр ч очно.
module.exports.reply = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  const { id, reply, by, at } = req.body;
  try {
    const item = await findOwnMessage(req, id);
    if (!item) return res.status(200).json({ ...result, message: "Мессеж олдсонгүй эсвэл хариулах эрхгүй байна" });

    const row = await messageReplies.create({ message_id: id, reply, created_by: by, created_at: at, updated_at: at });
    // Устгасан мессежид хариулбал жагсаалтад буцааж гаргана
    await syncLatest(id, { status: "done", updated_by: by, updated_at: at });
    // Нэг яриа (нэг хэрэглэгч, нэг зар) дахь хариулаагүй (шинэ / үзсэн) бусад мессеж ч хариулагдсан болно
    await messages.update(
      { status: "done", updated_by: by, updated_at: at },
      { where: { ...threadOf(item), status: { [op.in]: ["new", "seen"] } } },
    );
    await saveLog({
      object_name: "messages",
      object_id: id,
      log_action: "replied",
      log_action_mn: "Хариулсан",
      modify_data: JSON.stringify({ reply_id: row.id, reply }),
      created_by: by,
      created_at: at,
    });

    // SMS нь нэмэлт суваг: амжилтгүй болсон ч хариу хадгалагдсан хэвээр
    let sms = false;
    if (isSmsConfigured() && /^\d{8}$/.test(item.phonenumber || "")) {
      try {
        await sendSms(item.phonenumber, `CarDealer: ${reply}`.slice(0, 480));
        sms = true;
      } catch (error) {
        console.log("reply sms failed:", error?.message);
      }
    }

    result.success = true;
    result.data = { id: row.id, message_id: id, reply, created_at: at, sms };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

// Хариуг засах. body: { reply_id, reply }
module.exports.editReply = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  const { reply_id, reply, by, at } = req.body;
  try {
    const row = await messageReplies.findByPk(reply_id, { raw: true });
    const item = row && (await findOwnMessage(req, row.message_id));
    if (!item) return res.status(200).json({ ...result, message: "Хариу олдсонгүй эсвэл засах эрхгүй байна" });

    await messageReplies.update({ reply, updated_by: by, updated_at: at }, { where: { id: reply_id } });
    await syncLatest(row.message_id);
    await saveLog({
      object_name: "messages",
      object_id: row.message_id,
      log_action: "reply_edited",
      log_action_mn: "Хариу зассан",
      modify_data: JSON.stringify({ reply_id, from: row.reply, reply }),
      created_by: by,
      created_at: at,
    });

    result.success = true;
    result.data = { id: reply_id, reply, updated_at: at };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

// Мессежүүдийн хариунууд (хуучин нь эхэндээ). query: ids=1,2,3 - хамрах хүрээнд байгаагийнх л буцна
module.exports.replies = async (req, res) => {
  let result = { success: false, data: [], message: "Амжилттай" };
  const ids = String(req.query.ids || "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 500);
  try {
    if (!ids.length) return res.status(200).json({ ...result, success: true });
    const scope = await ownScope(req);
    const own = await messages.findAll({ where: { id: { [op.in]: ids }, ...(scope || {}) }, attributes: ["id"], raw: true });
    const rows = own.length
      ? await messageReplies.findAll({
          where: { message_id: { [op.in]: own.map((m) => m.id) } },
          attributes: ["id", "message_id", "reply", "created_at", "updated_at"],
          order: [["id", "ASC"]],
          raw: true,
        })
      : [];
    result.success = true;
    result.data = rows;
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};
