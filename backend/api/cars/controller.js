const {
  cars,
  dealers,
  users,
  vwCars,
  favorites,
  allFiles,
  actionLogs,
  sequelize,
  op,
} = require("../../models");

const { uploadFiles } = require("../../helper/fileHelper");
const { notifyNewCar } = require("../../helper/notifyHelper");
const { saveLog } = require("../../utils/logHelper");
const { roles, carStatuses, nonPublicCarStatuses } = require("../../config/constants");

// Дилер засахад дахин батлуулах ("pending") төлөвүүд
const resubmitStatuses = [carStatuses.active, carStatuses.hidden, carStatuses.rejected];

// Засаад дахин илгээсэн (өмнө нь нийтлэгдсэн) зар эсэх: батлахад "шинэ зар" мэдэгдэл дахин явуулахгүй
const wasResubmitted = async (id, transaction) =>
  (await actionLogs.count({ where: { object_name: "cars", object_id: id, log_action: "resubmitted" }, transaction })) > 0;

// Зөвхөн админ өөрчилж болох талбарууд
const adminOnlyFields = ["user_id", "dealer_id", "is_featured", "view_count", "status", "sold_at", "reject_reason", "rejected_by", "rejected_at"];

// autobox.mn-ээс бөглөгдөж, дараа нь засагдахгүй байж болох талбарууд
const autoboxFields = ["brand_id", "car_model_id", "manufactured_year", "imported_year", "fuel_type", "transmission", "drive_type", "steering", "vehicle_type", "engine_capacity", "mileage", "color", "vin"];

const parseAutobox = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

// autobox-оос татсан талбаруудыг хадгална (зарт өмнө нь байхгүй бол), байгаа бол хадгалсан утгаар нь буцааж тавина.
// Ирэх: autobox_data = { plate, vin, fields: ["brand_id", ...] } - утгыг нь body-оос авна.
const applyAutobox = (body, prevCar, at) => {
  const incoming = parseAutobox(body.autobox_data);
  delete body.autobox_data;

  const saved = parseAutobox(prevCar?.autobox_data);
  if (saved?.fields) {
    for (const k of autoboxFields) if (k in saved.fields) body[k] = saved.fields[k];
    return;
  }
  if (!Array.isArray(incoming?.fields)) return;

  const fields = {};
  for (const k of autoboxFields)
    if (incoming.fields.includes(k) && body[k] !== undefined && body[k] !== null && body[k] !== "") fields[k] = body[k];
  if (!Object.keys(fields).length) return;
  const text = (v) => (v ? String(v).slice(0, 32) : null);
  body.autobox_data = JSON.stringify({ plate: text(incoming.plate), vin: text(incoming.vin), fetched_at: at, fields });
};

// Нэвтэрсэн хэрэглэгчийн дилер (токен хуучин байж болох тул баазаас уншина)
const dealerIdOf = async (loggedUser) => {
  if (!loggedUser?.id) return null;
  const user = await users.findByPk(loggedUser.id, { attributes: ["dealer_id"], raw: true });
  return user?.dealer_id || null;
};

// Зар олдох бөгөөд нэвтэрсэн хэрэглэгч засах эрхтэй эсэх:
// админ бүгдийг, бусад нь өөрийн эсвэл өөрийн дилерийн зарыг
const findOwnCar = async (id, loggedUser) => {
  const car = await cars.findOne({
    where: { id, status: { [op.ne]: carStatuses.deleted } },
    raw: true,
  });
  if (!car) return { error: "Зарын мэдээлэл олдсонгүй" };
  if (loggedUser?.role !== roles.admin && car.user_id !== loggedUser?.id) {
    const dealerId = car.dealer_id ? await dealerIdOf(loggedUser) : null;
    if (!dealerId || dealerId !== car.dealer_id) return { error: "Зөвхөн өөрийн зарыг засах боломжтой" };
  }
  return { car };
};

// Зар заавал дилерт харьяалагдана: идэвхтэй дилер байх ёстой
const resolveDealer = async (dealerId) => {
  if (!dealerId) return { error: "Дилер сонгоно уу" };
  const dealer = await dealers.findOne({
    where: { id: dealerId, status: "active" },
    attributes: ["id", "phonenumber"],
    raw: true,
  });
  if (!dealer) return { error: "Сонгосон дилер олдсонгүй эсвэл идэвхгүй байна" };
  return { dealer };
};

// Шинэ зар нэмэх / засах (зурагтай хамт multipart-аар)
// Зарын эзэн (user_id) нь оруулсан хэрэглэгч, засахад өөрчлөгдөхгүй. Зар заавал дилертэй.
// Админ: dealer_id-аар дилер сонгоно, шууд нийтлэгдэнэ.
// Дилер: зар өөрийн дилерт автоматаар харьяалагдана, админ батлахыг хүлээнэ.
// fields: data = JSON, file0..N = зураг, file0Info..N = { id } (хуучин) эсвэл { original_name } (шинэ)
module.exports.save = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };

  let { id, modifyData, by, at, ...body } = req.body;
  const { loggedUser, fields, files } = req;

  if (loggedUser?.role !== roles.admin)
    adminOnlyFields.forEach((field) => delete body[field]);

  const isAdmin = loggedUser?.role === roles.admin;
  let prevStatus = null;
  let prevCar = null;
  if (id) {
    const { car, error } = await findOwnCar(id, loggedUser);
    if (error) return res.status(200).json({ ...result, message: error });
    prevStatus = car.status;
    prevCar = car;
  }
  applyAutobox(body, prevCar, at);

  delete body.user_id;
  // Дилер өөрөө оруулсан зарын дилерийг админ солихгүй
  if (isAdmin && prevCar && body.dealer_id !== undefined && body.dealer_id !== null) {
    const seller = await users.findByPk(prevCar.user_id, { attributes: ["role"], raw: true });
    if (seller?.role === roles.dealer) {
      if (Number(body.dealer_id) !== prevCar.dealer_id)
        return res.status(200).json({ ...result, message: "Дилер өөрөө оруулсан зарын дилерийг солих боломжгүй" });
      delete body.dealer_id;
    }
  }
  // Дилер. Засахдаа dealer_id ирээгүй бол өөрчлөгдөхгүй.
  let dealer = null;
  if (isAdmin && (!id || body.dealer_id !== undefined)) {
    const resolved = await resolveDealer(body.dealer_id);
    if (resolved.error) return res.status(200).json({ ...result, message: resolved.error });
    dealer = resolved.dealer;
    body.dealer_id = dealer?.id ?? null;
  } else if (!isAdmin && !id) {
    body.dealer_id = await dealerIdOf(loggedUser);
    if (!body.dealer_id)
      return res.status(200).json({ ...result, message: "Таны бүртгэл дилерт харьяалагдаагүй байна. Админд хандана уу" });
  }

  const t = await sequelize.transaction();
  try {
    const action = id ? "updated" : "created";

    let item = null;
    if (id) {
      // Дилер (админ биш) зараа засвал дахин батлуулна: идэвхтэй / нуусан / буцаасан зар "pending" болно.
      // Админ засвал төлөв хэвээр (идэвхтэй нь идэвхтэй).
      const resubmit = !isAdmin && resubmitStatuses.includes(prevStatus) ? { status: carStatuses.pending } : {};
      // update
      item = await cars
        .update(
          { ...body, ...resubmit, updated_by: by, updated_at: at },
          { where: { id }, transaction: t, individualHooks: true },
        )
        .then(async () => await cars.findByPk(id, { raw: true, transaction: t }));
      // Өмнө нь нийтлэгдсэн зар: батлахад "шинэ зар" мэдэгдэл дахин явуулахгүйн тулд тэмдэглэнэ
      if (resubmit.status && prevStatus !== carStatuses.rejected)
        await saveLog(
          {
            object_name: "cars",
            object_id: id,
            log_action: "resubmitted",
            log_action_mn: "Засаад дахин илгээсэн",
            modify_data: JSON.stringify({ from: prevStatus, status: carStatuses.pending }),
            created_by: by,
            created_at: at,
          },
          t,
        );
    } else {
      // create
      item = await cars.create(
        {
          ...body,
          user_id: loggedUser.id,
          // Утас оруулаагүй бол дилерийн, эсвэл оруулсан хэрэглэгчийн дугаар
          phonenumber: body.phonenumber || dealer?.phonenumber || loggedUser.phonenumber,
          // Админ шууд нийтэлнэ, бусдынх админ батлахыг хүлээнэ
          status: isAdmin ? carStatuses.active : carStatuses.pending,
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

    // Шинэ зар нийтлэгдэх (шууд эсвэл батлагдах) үед мэдэгдлийг ар талд илгээнэ (засаад дахин илгээсэн зарт биш)
    const published = id
      ? prevStatus === carStatuses.pending && item.status === carStatuses.active && !(await wasResubmitted(id, t))
      : item.status === carStatuses.active;
    await t.commit();
    if (published) setImmediate(() => notifyNewCar(item.id));
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

// Хүлээгдэж буй зарыг батлаж нийтлэх (зөвхөн админ)
module.exports.approve = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  const { id, by, at } = req.body;
  if (req.loggedUser?.role !== roles.admin)
    return res.status(200).json({ ...result, message: "Зөвхөн админ батлах боломжтой" });

  const t = await sequelize.transaction();
  try {
    const [affected] = await cars.update(
      { status: carStatuses.active, reject_reason: null, rejected_by: null, rejected_at: null, updated_by: by, updated_at: at },
      { where: { id, status: carStatuses.pending }, transaction: t },
    );
    if (!affected) {
      await t.rollback();
      return res
        .status(200)
        .json({ ...result, message: "Батлах хүлээгдэж буй зар олдсонгүй" });
    }
    await saveLog(
      {
        object_name: "cars",
        object_id: id,
        log_action: "approved",
        modify_data: JSON.stringify({ status: carStatuses.active }),
        created_by: by,
        created_at: at,
      },
      t,
    );
    const republished = await wasResubmitted(id, t);
    await t.commit();
    if (!republished) setImmediate(() => notifyNewCar(id));
    result.success = true;
    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

// Хүлээгдэж буй зарыг тайлбартай буцаах (зөвхөн админ). body: { id, reason }
module.exports.reject = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  const { id, by, at } = req.body;
  const reason = String(req.body.reason || "").trim();
  if (req.loggedUser?.role !== roles.admin)
    return res.status(200).json({ ...result, message: "Танд энэ үйлдлийг хийх эрх байхгүй" });
  if (!reason) return res.status(200).json({ ...result, message: "Буцаах шалтгаанаа бичнэ үү" });

  const t = await sequelize.transaction();
  try {
    const [affected] = await cars.update(
      { status: carStatuses.rejected, reject_reason: reason, rejected_by: by, rejected_at: at, updated_by: by, updated_at: at },
      { where: { id, status: carStatuses.pending }, transaction: t },
    );
    if (!affected) {
      await t.rollback();
      return res.status(200).json({ ...result, message: "Буцаах хүлээгдэж буй зар олдсонгүй" });
    }
    await saveLog(
      {
        object_name: "cars",
        object_id: id,
        log_action: "rejected",
        modify_data: JSON.stringify({ status: carStatuses.rejected, reason }),
        created_by: by,
        created_at: at,
      },
      t,
    );
    await t.commit();
    result.success = true;
    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

// Зарыг түр нуух / буцааж ил гаргах (зөвхөн админ). body: { id, hidden: true|false }
module.exports.setHidden = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  const { id, hidden, by, at } = req.body;
  // Админ бүх зарыг, дилер зөвхөн өөрийн дилерийн зарыг нууна / ил гаргана
  if (req.loggedUser?.role !== roles.admin) {
    const { error } = await findOwnCar(id, req.loggedUser);
    if (error) return res.status(200).json({ ...result, message: error });
  }

  const [from, to] = hidden
    ? [carStatuses.active, carStatuses.hidden]
    : [carStatuses.hidden, carStatuses.active];
  const t = await sequelize.transaction();
  try {
    const [affected] = await cars.update(
      { status: to, updated_by: by, updated_at: at },
      { where: { id, status: from }, transaction: t },
    );
    if (!affected) {
      await t.rollback();
      return res.status(200).json({
        ...result,
        message: hidden ? "Зөвхөн идэвхтэй зарыг нуух боломжтой" : "Нуусан зар олдсонгүй",
      });
    }
    await saveLog(
      {
        object_name: "cars",
        object_id: id,
        log_action: hidden ? "hidden" : "unhidden",
        modify_data: JSON.stringify({ status: to }),
        created_by: by,
        created_at: at,
      },
      t,
    );
    await t.commit();
    result.success = true;
    return res.status(200).json(result);
  } catch (error) {
    await t.rollback();
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};

// Зарагдсан гэж тэмдэглэх (зөвхөн админ; дилер идэвхтэй зараа зөвхөн нууж, засна)
module.exports.markSold = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  const { id, by, at } = req.body;
  if (req.loggedUser?.role !== roles.admin)
    return res.status(200).json({ ...result, message: "Танд энэ үйлдлийг хийх эрх байхгүй" });
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
      where: { id: car_id, status: { [op.notIn]: nonPublicCarStatuses } },
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
        status: { [op.notIn]: nonPublicCarStatuses },
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

module.exports.dealerIdOf = dealerIdOf;
