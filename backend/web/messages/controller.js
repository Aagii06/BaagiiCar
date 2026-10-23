const moment = require("moment");
const { messages, cars } = require("../../models");

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
