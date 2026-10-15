const { warehouseProducts } = require("../../models");

const { uploadImage } = require("../../helper/fileHelper");
const { saveLog } = require("../../utils/logHelper");

module.exports.save = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  let { id, modifyData, by, at, ...body } = req.body;
  let { files } = req;

  try {
    const action = id ? "updated" : "created";

    const image = await uploadImage("warehouseProducts", files);
    if (image) body = Object.assign(body, { image });

    let item = null;
    if (id) {
      // update
      item = await warehouseProducts
        .update(
          { ...body, updated_by: by, updated_at: at },
          { where: { id }, individualHooks: true },
        )
        .then(async () => await warehouseProducts.findByPk(id, { raw: true }));
    } else {
      // create
      item = await warehouseProducts.create(
        {
          ...body,
          organization_status: "Хэвийн",
          status: "active",
          created_by: by,
          created_at: at,
        },
        { individualHooks: true },
      );
    }

    if (item) {
      await saveLog({
        object_name: "warehouseProducts",
        object_id: item.id,
        log_action: action,
        modify_data: JSON.stringify(modifyData),
        created_by: by,
        created_at: at,
      });
    }

    result.success = true;
    result.data = { id };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.success = false;
    result.data = error;
    result.message = typeof error === "string" ? error : "Алдаа";
    return res.status(200).json(result);
  }
};
