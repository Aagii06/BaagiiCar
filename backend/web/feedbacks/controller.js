const moment = require("moment");
const { feedbacks } = require("../../models");
const { readToken } = require("../../middleware/auth");

// "Бидэнд бичих" маягт: нэвтэрсэн бол customer_id-тай хадгална
module.exports.send = async (req, res) => {
  let result = { success: false, data: null, message: "" };
  try {
    const user = readToken(req);
    const { name, phonenumber, email, message } = req.body;
    await feedbacks.create({
      customer_id: user?.customer ? user.id : null,
      name: name || null,
      phonenumber: phonenumber || null,
      email: email ? email.toLowerCase() : null,
      message,
      status: "new",
      created_at: moment().utcOffset("+0800").format("YYYY-MM-DD HH:mm:ss"),
    });
    result.success = true;
    result.message = "Амжилттай илгээлээ";
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};
