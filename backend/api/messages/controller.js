const { messages } = require("../../models");
const { saveLog } = require("../../utils/logHelper");
const { isSmsConfigured, sendSms } = require("../../helper/smsHelper");
const { ownScope } = require("../base/config/messages");

// Мессежид хариулах (админ бүгдэд, дилер өөрийн дилерийн зарын мессежид). body: { id, reply }
// Хариу хадгалагдаж мессеж "done" болно; хэрэглэгч вэбийн чат цонхондоо харна, SMS холбогдсон бол SMS-ээр ч очно.
module.exports.reply = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  const { id, reply, by, at } = req.body;
  try {
    const scope = await ownScope(req);
    const item = await messages.findOne({ where: { id, type: "car", ...(scope || {}) }, raw: true });
    if (!item) return res.status(200).json({ ...result, message: "Мессеж олдсонгүй эсвэл хариулах эрхгүй байна" });

    // Устгасан мессежид хариулбал жагсаалтад буцааж гаргана
    await messages.update(
      { reply, replied_by: by, replied_at: at, status: "done", updated_by: by, updated_at: at },
      { where: { id } },
    );
    await saveLog({
      object_name: "messages",
      object_id: id,
      log_action: "replied",
      log_action_mn: "Хариулсан",
      modify_data: JSON.stringify({ reply }),
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
    result.data = { id, reply, replied_at: at, sms };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};
