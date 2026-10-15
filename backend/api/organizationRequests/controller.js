const { organizationRequests, organizations, sequelize, op } = require("../../models");
const { saveLog } = require("../../utils/logHelper");

module.exports.confirm = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  const { id, status, by, at } = req.body;

  const t = await sequelize.transaction();
  try {
    const request = await organizationRequests.findOne({
      where: { id, status: { [op.ne]: "deleted" } },
      raw: true,
    });

    if (!request) {
      await t.rollback();
      result.message = "Хүсэлт олдсонгүй";
      return res.status(200).json(result);
    }

    if (status === "notConfirmed") {
      await organizationRequests.update(
        { status: "notConfirmed", updated_by: by, updated_at: at },
        { where: { id }, transaction: t, individualHooks: true },
      );

      await saveLog(
        {
          object_name: "organizationRequests",
          object_id: id,
          log_action: "notConfirmed",
          log_action_mn: "Татгалзсан",
          modify_data: JSON.stringify({}),
          created_by: by,
          created_at: at,
        },
        t,
      );

      await t.commit();
      result.success = true;
      result.data = { id };
      return res.status(200).json(result);
    }

    const { type, register, name, phonenumber, email, address, description } =
      request;

    const organization = await organizations.create(
      {
        type,
        register,
        name,
        phonenumber,
        email,
        address,
        description,
        status: "active",
        created_by: by,
        created_at: at,
      },
      { transaction: t, individualHooks: true },
    );

    await organizationRequests.update(
      { status: "confirmed", updated_by: by, updated_at: at },
      { where: { id }, transaction: t, individualHooks: true },
    );

    await saveLog(
      {
        object_name: "organizationRequests",
        object_id: id,
        log_action: "confirmed",
        log_action_mn: "Баталгаажуулсан",
        modify_data: JSON.stringify({ organization_id: organization.id }),
        created_by: by,
        created_at: at,
      },
      t,
    );

    await t.commit();
    result.success = true;
    result.data = { id: organization.id };
    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.success = false;
    result.data = error;
    result.message = typeof error === "string" ? error : "Алдаа";
    return res.status(200).json(result);
  }
};
