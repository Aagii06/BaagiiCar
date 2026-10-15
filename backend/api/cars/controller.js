const {
  cars,
  vwCars,
  favorites,
  allFiles,
  sequelize,
  op,
} = require("../../models");

const { uploadFiles } = require("../../helper/fileHelper");
const { saveLog } = require("../../utils/logHelper");
const { roles, carStatuses } = require("../../config/constants");

// Зөвхөн админ өөрчилж болох талбарууд
const adminOnlyFields = ["user_id", "is_featured", "view_count", "status", "sold_at"];

// Зар олдох бөгөөд нэвтэрсэн хэрэглэгч засах эрхтэй эсэх
const findOwnCar = async (id, loggedUser) => {
  const car = await cars.findOne({
    where: { id, status: { [op.ne]: carStatuses.deleted } },
    raw: true,
  });
  if (!car) return { error: "Зарын мэдээлэл олдсонгүй" };
  if (loggedUser?.role !== roles.admin && car.user_id !== loggedUser?.id)
    return { error: "Зөвхөн өөрийн зарыг засах боломжтой" };
  return { car };
};

// Шинэ зар нэмэх / засах (зурагтай хамт multipart-аар)
// fields: data = JSON, file0..N = зураг, file0Info..N = { id } (хуучин) эсвэл { original_name } (шинэ)
module.exports.save = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  let { id, modifyData, by, at, ...body } = req.body;
  const { loggedUser, fields, files } = req;

  if (loggedUser?.role !== roles.admin)
    adminOnlyFields.forEach((field) => delete body[field]);

  if (id) {
    const { error } = await findOwnCar(id, loggedUser);
    if (error) return res.status(200).json({ ...result, message: error });
  }

  const t = await sequelize.transaction();
  try {
    const action = id ? "updated" : "created";

    let item = null;
    if (id) {
      // update
      item = await cars
        .update(
          { ...body, updated_by: by, updated_at: at },
          { where: { id }, transaction: t, individualHooks: true },
        )
        .then(async () => await cars.findByPk(id, { raw: true, transaction: t }));
    } else {
      // create
      item = await cars.create(
        {
          user_id: loggedUser.id,
          phonenumber: loggedUser.phonenumber,
          ...body,
          status: carStatuses.active,
          created_by: by,
          created_at: at,
        },
        { transaction: t },
      );
    }

    // Зураг: хадгалагдаагүй хуучин зургийг устгаж, шинийг нэмнэ
    if (fields) {
      const { createFiles, nowFiles, notDeleteFiles } = await uploadFiles(
        allFiles,
        op,
        fields,
        files,
        id,
        "cars",
        "image",
      );
      const newFiles = createFiles.filter((s) => s.generated_name);
      for (let i = 0; i < newFiles.length; i++) {
        await allFiles.create(
          {
            ...newFiles[i],
            data_id: item.id,
            order: notDeleteFiles.length + i + 1,
            status: "active",
            created_by: by,
            created_at: at,
          },
          { transaction: t },
        );
      }
      const deleteIds = nowFiles
        .map((s) => s.id)
        .filter((fileId) => !notDeleteFiles.includes(fileId));
      if (deleteIds.length > 0) {
        await allFiles.update(
          { status: "deleted", deleted_by: by, deleted_at: at },
          { where: { id: deleteIds }, transaction: t },
        );
      }
    }

    await saveLog(
      {
        object_name: "cars",
        object_id: item.id,
        log_action: action,
        modify_data: JSON.stringify(modifyData || body),
        created_by: by,
        created_at: at,
      },
      t,
    );

    await t.commit();
    result.success = true;
    result.data = { id: item.id };
    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.success = false;
    result.message = typeof error === "string" ? error : "Алдаа";
    return res.status(200).json(result);
  }
};

// Зарагдсан гэж тэмдэглэх
module.exports.markSold = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  const { id, by, at } = req.body;
  try {
    const { car, error } = await findOwnCar(id, req.loggedUser);
    if (error) return res.status(200).json({ ...result, message: error });
    if (car.status === carStatuses.sold)
      return res
        .status(200)
        .json({ ...result, message: "Зар аль хэдийн зарагдсан байна" });

    await cars.update(
      { status: carStatuses.sold, sold_at: at, updated_by: by, updated_at: at },
      { where: { id } },
    );
    await saveLog({
      object_name: "cars",
      object_id: id,
      log_action: "sold",
      log_action_mn: "Зарагдсан",
      created_by: by,
      created_at: at,
    });

    result.success = true;
    result.data = { id };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = typeof error === "string" ? error : "Алдаа";
    return res.status(200).json(result);
  }
};

// Хадгалсан зар нэмэх / хасах (toggle)
module.exports.toggleFavorite = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  const { car_id, at } = req.body;
  const user_id = req.loggedUser.id;
  try {
    const car = await cars.findOne({
      where: { id: car_id, status: { [op.ne]: carStatuses.deleted } },
      attributes: ["id"],
      raw: true,
    });
    if (!car)
      return res
        .status(200)
        .json({ ...result, message: "Зарын мэдээлэл олдсонгүй" });

    const deleted = await favorites.destroy({ where: { user_id, car_id } });
    if (!deleted) await favorites.create({ user_id, car_id, created_at: at });

    result.success = true;
    result.data = { car_id, is_favorite: !deleted };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

// Нэвтэрсэн хэрэглэгчийн хадгалсан зарууд
module.exports.getFavorites = async (req, res) => {
  let result = { success: false, data: { rows: [], count: 0 }, message: "" };
  try {
    const rows = await vwCars.findAll({
      where: {
        status: { [op.ne]: carStatuses.deleted },
        id: {
          [op.in]: sequelize.literal(
            `(SELECT car_id FROM favorites WHERE user_id = ${Number(req.loggedUser.id)})`,
          ),
        },
      },
      order: [["created_at", "DESC"]],
    });
    result.success = true;
    result.data = { rows, count: rows.length };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};
