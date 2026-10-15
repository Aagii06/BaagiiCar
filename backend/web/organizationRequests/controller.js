const { organizationRequests } = require("../../models");
const { saveLog } = require("../../utils/logHelper");

module.exports.save = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  const { id, modifyData, at, recaptchaToken, ...body } = req.body;

  try {
    const item = await organizationRequests.create({
      ...body,
      status: "pending",
      created_at: at,
    });

    await saveLog({
      object_name: "organizationRequests",
      object_id: item.id,
      log_action: "created",
      modify_data: JSON.stringify(modifyData),
      created_at: at,
    });

    result.success = true;
    result.data = { id: item.id };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.success = false;
    result.data = error;
    result.message = typeof error === "string" ? error : "Алдаа";
    return res.status(200).json(result);
  }
};
