const fetch = require("node-fetch");

module.exports.verifyRecaptcha = async (req, res, next) => {
  const { recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return res
      .status(200)
      .json({ success: false, data: null, message: "Роботын шалгалтыг бөглөнө үү" });
  }

  try {
    const params = new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: recaptchaToken,
    });

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: params,
    });
    const result = await response.json();

    if (!result.success) {
      return res
        .status(200)
        .json({ success: false, data: null, message: "Роботын шалгалт амжилтгүй боллоо" });
    }

    return next();
  } catch (error) {
    console.log(error);
    return res
      .status(200)
      .json({ success: false, data: null, message: "Роботын шалгалт хийхэд алдаа гарлаа" });
  }
};
