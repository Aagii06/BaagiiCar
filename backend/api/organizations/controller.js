const { organizations, sequelize, op } = require("../../models");

const { uploadImage } = require("../../helper/fileHelper");
const { saveLog } = require("../../utils/logHelper");

module.exports.save = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  let { id, modifyData, by, at, ...body } = req.body;
  let { files } = req;

  const t = await sequelize.transaction();
  try {
    const action = id ? "updated" : "created";

    const image = await uploadImage("organizations", files);
    if (image) body = Object.assign(body, { logo: image });

    let item = null;
    if (id) {
      // update
      item = await organizations
        .update(
          { ...body, updated_by: by, updated_at: at },
          {
            where: { id, status: { [op.ne]: "deleted" } },
            transaction: t,
            individualHooks: true,
          },
        )
        .then(async () => await organizations.findByPk(id, { raw: true }));
    } else {
      // create
      item = await organizations.create(
        { ...body, status: "active", created_by: by, created_at: at },
        { transaction: t, individualHooks: true },
      );
    }

    if (item) {
      await saveLog(
        {
          object_name: "organizations",
          object_id: item.id,
          log_action: action,
          modify_data: JSON.stringify(modifyData),
          created_by: by,
          created_at: at,
        },
        t,
      );
    }

    await t.commit();
    result.success = true;
    result.data = { id };
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
