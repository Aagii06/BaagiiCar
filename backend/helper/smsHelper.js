// SMS илгээх үйлчилгээ.
// Одоогоор холбогдоогүй: isSmsConfigured() false үед утасны OTP нь .env-ийн OTP_DEV_CODE
// (анхдагч "2222") тогтмол кодыг ашиглана (helper/otpHelper.js).
//
// Холбох үед:
//   1. .env-д SMS_API_URL, SMS_API_KEY (үйлчилгээ үзүүлэгчийн шаардсан бусад утга) нэмнэ
//   2. Доорх sendSms-ийг тухайн үйлчилгээний API-аар илгээдэг болгоно
// Үүний дараа otpHelper санамсаргүй код үүсгэж SMS-ээр илгээнэ - өөр газар өөрчлөх шаардлагагүй.

module.exports.isSmsConfigured = () => Boolean(process.env.SMS_API_URL && process.env.SMS_API_KEY);

// phonenumber: 8 оронтой дугаар. Амжилтгүй бол алдаа шиднэ.
module.exports.sendSms = async (phonenumber, text) => {
  // TODO: SMS үйлчилгээний API дуудах, жишээ нь:
  // const res = await fetch(process.env.SMS_API_URL, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SMS_API_KEY}` },
  //   body: JSON.stringify({ to: phonenumber, text }),
  // });
  // if (!res.ok) throw new Error(`SMS илгээж чадсангүй (${res.status})`);
  throw new Error("SMS илгээх үйлчилгээ холбогдоогүй байна");
};
