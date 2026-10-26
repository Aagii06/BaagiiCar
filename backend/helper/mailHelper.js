const nodemailer = require("nodemailer");

// local хэсэг: 1-64 тэмдэгт, цэгээр эхлэх/төгсөх болон ".." хориотой
// домэйн: label бүр 1-63 тэмдэгт, "-"-ээр эхлэх/төгсөхгүй, TLD үсгээр эхэлнэ
const emailRegex =
  /^(?!\.)(?!.*\.\.)[A-Za-z0-9!#$%&'*+\/=?^_`{|}~.-]{1,64}(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z][A-Za-z0-9-]{0,61}[A-Za-z0-9]$/;

const isValidEmail = (email) =>
  typeof email === "string" && email.length <= 254 && emailRegex.test(email);

module.exports.isValidEmail = isValidEmail;

// Холболтыг нэг удаа үүсгээд дахин ашиглана (имэйл бүрт TLS + нэвтрэлт хийхгүй)
let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 3,
      tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
      auth: { user: process.env.MAIL_USER_NAME, pass: process.env.MAIL_USER_PASS },
    });
  }
  return transporter;
};

module.exports.sendMail = (mail, data) => {
  try {
    if (isValidEmail(mail)) {
      return getTransporter().sendMail({ from: `Cardealer <${process.env.MAIL_USER_NAME}>`, to: mail, ...data });
    } else {
      return null;
    }
  } catch (ex) {
    return null;
  }
};
