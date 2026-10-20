// TODO: Тээврийн хэрэгслийн бүртгэлийн жинхэнэ сервис холбогдох хүртэл жишээ өгөгдөл буцаана.
// Жинхэнэ сервис холбосны дараа энэ endpoint-ийг нэвтрэлттэй (protect) болгох хэрэгтэй.
const mockVehicles = [
  {
    brand: "Toyota",
    model: "Prius 30",
    manufactured_year: 2012,
    imported_year: 2018,
    fuel_type: "Хайбрид",
    transmission: "Автомат",
    drive_type: "FWD",
    steering: "Баруун",
    engine_capacity: 1.8,
    door_count: 5,
    color: "Цагаан",
  },
  {
    brand: "Lexus",
    model: "RX 450h",
    manufactured_year: 2019,
    imported_year: 2021,
    fuel_type: "Хайбрид",
    transmission: "Автомат",
    drive_type: "4WD",
    steering: "Зүүн",
    engine_capacity: 3.5,
    door_count: 5,
    color: "Хар",
  },
  {
    brand: "Hyundai",
    model: "Tucson",
    manufactured_year: 2017,
    imported_year: 2019,
    fuel_type: "Дизель",
    transmission: "Автомат",
    drive_type: "4WD",
    steering: "Зүүн",
    engine_capacity: 2.0,
    door_count: 5,
    color: "Саарал",
  },
  {
    brand: "Toyota",
    model: "Land Cruiser 200",
    manufactured_year: 2015,
    imported_year: 2016,
    fuel_type: "Бензин",
    transmission: "Автомат",
    drive_type: "4WD",
    steering: "Зүүн",
    engine_capacity: 4.6,
    door_count: 5,
    color: "Мөнгөлөг",
  },
  {
    brand: "Nissan",
    model: "X-Trail",
    manufactured_year: 2014,
    imported_year: 2017,
    fuel_type: "Бензин",
    transmission: "CVT",
    drive_type: "4WD",
    steering: "Баруун",
    engine_capacity: 2.0,
    door_count: 5,
    color: "Цэнхэр",
  },
];

const normalizePlate = (plate) =>
  plate ? plate.replace(/\s+/g, "").toUpperCase() : null;
const normalizeVin = (vin) => (vin ? vin.trim().toUpperCase() : null);

// Ижил дугаарт үргэлж ижил машин буцаахын тулд энгийн hash
const hash = (text) =>
  [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

module.exports.vehicleLookup = async (req, res) => {
  let result = { success: false, data: null, message: "Амжилттай" };
  try {
    const plate = normalizePlate(req.query.plate);
    const vin = normalizeVin(req.query.vin);

    // "0000" дугаар = бүртгэлгүй машины жишээ
    if (plate?.startsWith("0000"))
      return res
        .status(200)
        .json({ ...result, message: "Бүртгэлтэй машин олдсонгүй" });

    const vehicle = mockVehicles[hash(plate || vin) % mockVehicles.length];
    result.success = true;
    result.data = {
      ...vehicle,
      plate: plate ? `${plate.slice(0, 4)} ${plate.slice(4)}` : null,
      vin,
      source: "mock",
    };
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    result.message = "Алдаа";
    return res.status(200).json(result);
  }
};
