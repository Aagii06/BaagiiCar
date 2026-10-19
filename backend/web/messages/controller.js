const moment = require("moment");
const { messages, cars } = require("../../models");

// Вэбийн чат цонх: зочны мессежийг админд хадгална
module.exports.send = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  const { name, phonenumber, message, car_id, page_url } = req.body;
  try {
    // Устгагдсан / байхгүй зар руу заахгүй
    const car = car_id ? await cars.findByPk(car_id, { attributes: ["id"], raw: true }) : null;
    const at = moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss");
    const item = await messages.create({
      name: name || null,
      phonenumber,
      message,
      car_id: car ? car.id : null,
      page_url: page_url || null,
      status: "new",
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
