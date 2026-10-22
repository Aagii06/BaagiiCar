const fetch = require("node-fetch");
const { brands, carModels, op } = require("../models");

// autobox.mn (ХУР / Xyp) - улсын дугаар эсвэл арлын дугаараар тээврийн хэрэгслийн мэдээлэл.
// Нэвтрэлт шаардахгүй нийтийн API.
const AUTOBOX_URL = "https://www.autobox.mn/api/services/app/Xyp/GetAutoboxInfo";
const TIMEOUT_MS = 15000;

// Нэг дугаарыг дахин дахин асуухгүйн тулд түр санах ой
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map();

const fromCache = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
};
const toCache = (key, value) => {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), value });
};

const toInt = (value) => {
  const n = parseInt(String(value ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

// "Бензин - Hybrid" → config/constants.js-ийн fuelTypes
const mapFuel = (name) => {
  const s = (name || "").toLowerCase();
  if (!s) return null;
  if (s.includes("hybrid") || s.includes("хайбрид") || s.includes("хосолсон")) return "Хайбрид";
  if (s.includes("цахилгаан") || s.includes("electric")) return "Цахилгаан";
  if (s.includes("дизель") || s.includes("diesel")) return "Дизель";
  if (s.includes("газ") || s.includes("lpg")) return "Газ";
  if (s.includes("бензин")) return "Бензин";
  return null;
};

// "4x4" → "4WD". "4x2" нь FWD эсвэл RWD аль нь болохыг хэлэхгүй тул хоосон үлдээнэ.
const mapDrive = (name) => (/4\s*[xх]\s*4/i.test(name || "") ? "4WD" : null);

const mapSteering = (name) => (["Зүүн", "Баруун"].includes(name) ? name : null);

// 1496 (cc) → 1.5 (л)
const mapEngine = (cc) => {
  const n = toInt(cc);
  return n ? Math.round(n / 100) / 10 : null;
};

// Каталогоос үйлдвэр, загварыг нэрээр нь тааруулна (MySQL collation том жижиг үсэг ялгахгүй)
const matchCatalog = async (markName, modelName) => {
  if (!markName) return { brand_id: null, car_model_id: null };
  const brand = await brands.findOne({
    where: { name: markName.trim(), status: { [op.ne]: "deleted" } },
    attributes: ["id"],
    raw: true,
  });
  if (!brand || !modelName) return { brand_id: brand?.id ?? null, car_model_id: null };
  const model = await carModels.findOne({
    where: { brand_id: brand.id, name: modelName.trim(), status: { [op.ne]: "deleted" } },
    attributes: ["id"],
    raw: true,
  });
  return { brand_id: brand.id, car_model_id: model?.id ?? null };
};

const formatPlate = (plate) => (plate && /^\d{4}/.test(plate) ? `${plate.slice(0, 4)} ${plate.slice(4)}` : plate || null);

// Буцаах: { success, message, data } - data нь зарын талбаруудтай ижил нэртэй
module.exports.getVehicleInfo = async ({ plate, vin }) => {
  const searchType = plate ? "plate" : "cabin";
  const searchValue = plate || vin;
  const key = `${searchType}:${searchValue}`;

  const cached = fromCache(key);
  if (cached) return cached;

  const url = `${AUTOBOX_URL}?searchType=${searchType}&searchValue=${encodeURIComponent(searchValue)}`;
  const response = await fetch(url, { headers: { Accept: "application/json" }, timeout: TIMEOUT_MS });
  if (!response.ok) throw new Error(`autobox HTTP ${response.status}`);
  const body = await response.json();
  if (!body?.success) throw new Error(`autobox: ${body?.error?.message || "амжилтгүй"}`);

  const info = body.result || {};
  const v = info.vehicle;
  if (!v) {
    // Олдоогүй хариуг ч санах ойд хадгална
    const notFound = { success: false, data: null, message: "Бүртгэлтэй машин олдсонгүй" };
    toCache(key, notFound);
    return notFound;
  }

  // Хамгийн сүүлийн оношлогоо (огноогоор эрэмбэлэгдсэн ирдэг ч найдвартай байлгахын тулд эрэмбэлнэ)
  const inspections = [...(info.inspectionHistory?.items || [])].sort((a, b) =>
    String(b.inspectionDate).localeCompare(String(a.inspectionDate)),
  );
  const lastInspection = inspections[0] || null;

  const importYear = toInt(String(v.importDate || "").slice(0, 4));
  const result = {
    success: true,
    message: "Амжилттай",
    data: {
      plate: formatPlate(v.plateNo),
      vin: v.cabinNo || null,
      brand: v.markName || null,
      model: v.modelName || null,
      ...(await matchCatalog(v.markName, v.modelName)),
      manufactured_year: toInt(v.buildYear),
      imported_year: importYear,
      fuel_type: mapFuel(v.fuelName),
      // autobox хурдны хайрцгийн мэдээлэл өгдөггүй
      transmission: null,
      drive_type: mapDrive(v.steeringTypeName),
      steering: mapSteering(v.wheelName),
      engine_capacity: mapEngine(v.engineCapacity),
      door_count: null,
      seat_count: toInt(v.seatCount),
      color: v.colorName || null,
      // Сүүлийн оношлогооны гүйлт ("220,735 км")
      mileage: lastInspection ? toInt(lastInspection.odometer) : null,
      inspection: lastInspection && {
        date: lastInspection.inspectionDate,
        expire_date: lastInspection.expireDate,
        is_passed: lastInspection.isPassed,
        is_expired: lastInspection.isExpired,
        status: lastInspection.statusText,
      },
      // Өмчлөгчийн нэрийг гаргахгүй, зөвхөн тоо
      owner_count: info.ownershipHistory?.items?.length ?? null,
      source: "autobox",
    },
  };
  toCache(key, result);
  return result;
};
