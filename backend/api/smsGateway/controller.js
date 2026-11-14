const { checkGatewayToken, touchGateway, waitForSms, takePendingSms, reportSms } = require("../../helper/smsHelper");

// Long-poll-ийн хамгийн их хугацаа (утас ?wait=-ээр багасгаж болно)
const MAX_WAIT_SECONDS = 25;
const POLL_MS = 2000;

module.exports.gatewayAuth = (req, res, next) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!checkGatewayToken(token)) return res.status(401).json({ success: false, data: null, message: "Token буруу" });
  touchGateway();
  next();
};

// Илгээх SMS-үүд. Байхгүй бол шинэ мессеж ирэх хүртэл (wait секунд) хүлээнэ.
// Буцаах: { success, data: [{ id, phonenumber, text }] }
module.exports.pending = async (req, res) => {
  let result = { success: false, data: [], message: "" };
  try {
    const wait = Math.min(Math.max(Number(req.query.wait) || 0, 0), MAX_WAIT_SECONDS);
    let items = await takePendingSms();
    // Энэ процессын sendSms шууд сэрээнэ; өөр процесст (pm2 cluster) үүссэн мессежийг DB-ээс POLL_MS тутам шалгана
    const deadline = Date.now() + wait * 1000;
    while (!items.length && Date.now() < deadline) {
      await waitForSms(Math.min(POLL_MS, deadline - Date.now()));
      touchGateway();
      items = await takePendingSms();
    }
    result = { success: true, data: items, message: "" };
  } catch (error) {
    result.message = error.message;
  }
  return res.status(200).json(result);
};

// body: { status: "sent" | "failed", error }
module.exports.status = async (req, res) => {
  let result = { success: false, data: null, message: "" };
  try {
    const { status, error } = req.body;
    if (!["sent", "failed"].includes(status)) return res.status(200).json({ ...result, message: "status буруу" });
    const found = await reportSms(req.params.id, status, error);
    result = { success: found, data: null, message: found ? "" : "Мессеж олдсонгүй" };
  } catch (error) {
    result.message = error.message;
  }
  return res.status(200).json(result);
};
