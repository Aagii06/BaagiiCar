"use strict";

// Жишээ зарууд — ЗӨВХӨН локал хөгжүүлэлтэд. Сервер дээр ажиллуулахгүй:
// seeders/ биш dev/seeders/ дотор тул `npm run seed`-д орохгүй, production-д өөрөө татгалзана.
// Ажиллуулах: npm run seed:sample   Устгах: npm run seed:sample:undo Үнэ, он, хөдөлгүүрийг 1000mashin.mn, unegui.mn дээрх
// бодит зарын түвшинд ойролцоогоор авсан; утас, тайлбар нь зохиомол.
// Зураг: dev/sample-cars/*.jpg (Wikimedia Commons, CREDITS.txt) — public/uploads/cars руу
// 4 хэмжээгээр хуулж, allFiles-д бүртгэнэ.
// Дахин ажиллуулахад давхардахгүй: жишээ борлуулагчид зартай бол алгасна.

const fs = require("fs");
const path = require("path");
const { saveSharpConverter } = require("../../helper/fileHelper");

const IMAGE_DIR = path.join(__dirname, "../sample-cars");
const UPLOAD_DIR = path.join(__dirname, "../../public/uploads/cars");

const sellers = [
  { key: "dealer1", phonenumber: "90000001", firstname: "Авто Плаза", role: "DEALER" },
  { key: "dealer2", phonenumber: "90000002", firstname: "Хаан Моторс", role: "DEALER" },
  { key: "person", phonenumber: "90000003", firstname: "Бат-Эрдэнэ", lastname: "Ганбаатар", role: "CUSTOMER" },
];

// [зураг, борлуулагч, брэнд, загвар, биеийн хэлбэр, үйлдвэрлэсэн, орж ирсэн, үнэ (сая ₮), гүйлт (км),
//  шатахуун, хурдны хайрцаг, хөтлөгч, хүрд, хөдөлгүүр (л), өнгө, байршил, тэмдэглэгээ]
const listings = [
  ["lc300", "dealer1", "Toyota", "Land Cruiser", "Жийп", 2023, 2025, 299, 12000, "Бензин", "Автомат", "4WD", "Зүүн", 3.4, "Цагаан", "Улаанбаатар", "featured"],
  ["prado150", "dealer1", "Toyota", "Land Cruiser Prado", "Жийп", 2023, 2025, 158, 18000, "Бензин", "Автомат", "4WD", "Зүүн", 2.7, "Хар", "Улаанбаатар", "featured"],
  ["prius30", "person", "Toyota", "Prius", "Суудлын тэрэг", 2014, 2025, 21, 112000, "Хайбрид", "CVT", "FWD", "Баруун", 1.8, "Цагаан", "Улаанбаатар"],
  ["prius50", "dealer2", "Toyota", "Prius", "Суудлын тэрэг", 2016, 2024, 32.5, 86000, "Хайбрид", "CVT", "FWD", "Баруун", 1.8, "Цэнхэр", "Улаанбаатар"],
  ["harrier", "dealer1", "Toyota", "Harrier", "Жийп", 2017, 2025, 78, 64000, "Хайбрид", "CVT", "AWD", "Баруун", 2.5, "Мөнгөлөг", "Улаанбаатар", "featured"],
  ["rav4", "dealer2", "Toyota", "RAV4", "Жийп", 2019, 2025, 84, 52000, "Хайбрид", "CVT", "AWD", "Баруун", 2.5, "Саарал", "Улаанбаатар"],
  ["crown", "dealer1", "Toyota", "Crown", "Суудлын тэрэг", 2019, 2025, 83, 47000, "Хайбрид", "CVT", "RWD", "Баруун", 2.5, "Цагаан", "Улаанбаатар"],
  ["fielder", "person", "Toyota", "Corolla Fielder", "Суудлын тэрэг", 2008, 2016, 6.5, 198000, "Бензин", "CVT", "FWD", "Баруун", 1.8, "Мөнгөлөг", "Дархан-Уул"],
  ["priusalpha", "person", "Toyota", "Prius Alpha", "Суудлын тэрэг", 2013, 2022, 19, 134000, "Хайбрид", "CVT", "FWD", "Баруун", 1.8, "Цагаан", "Улаанбаатар"],
  ["alphard", "dealer2", "Toyota", "Alphard", "Гэр бүлийн", 2016, 2024, 72, 91000, "Бензин", "CVT", "FWD", "Баруун", 2.5, "Хар", "Улаанбаатар"],
  ["camry", "dealer2", "Toyota", "Camry", "Суудлын тэрэг", 2018, 2023, 55, 73000, "Бензин", "Автомат", "FWD", "Зүүн", 2.5, "Саарал", "Улаанбаатар"],
  ["hilux", "dealer1", "Toyota", "Hilux", "Ачааны машин", 2020, 2024, 95, 68000, "Дизель", "Механик", "4WD", "Зүүн", 2.8, "Цагаан", "Өмнөговь"],
  ["aqua", "person", "Toyota", "Aqua", "Суудлын тэрэг", 2016, 2023, 15.8, 104000, "Хайбрид", "CVT", "FWD", "Баруун", 1.5, "Улаан", "Улаанбаатар"],
  ["hiace", "dealer2", "Toyota", "Hiace", "Гэр бүлийн", 2017, 2024, 68, 156000, "Дизель", "Автомат", "RWD", "Баруун", 2.8, "Мөнгөлөг", "Орхон"],
  ["rx", "dealer1", "Lexus", "RX", "Жийп", 2016, 2025, 119, 59000, "Бензин", "Автомат", "AWD", "Зүүн", 3.5, "Хар", "Улаанбаатар", "featured"],
  ["nx", "dealer2", "Lexus", "NX", "Жийп", 2015, 2025, 72, 77000, "Хайбрид", "CVT", "AWD", "Баруун", 2.5, "Цагаан", "Улаанбаатар"],
  ["lx", "dealer1", "Lexus", "LX", "Жийп", 2017, 2023, 245, 83000, "Бензин", "Автомат", "4WD", "Зүүн", 5.7, "Хар", "Улаанбаатар"],
  ["es", "dealer2", "Lexus", "ES", "Суудлын тэрэг", 2019, 2024, 105, 41000, "Хайбрид", "CVT", "FWD", "Зүүн", 2.5, "Саарал", "Улаанбаатар"],
  ["xtrail", "person", "Nissan", "X-Trail", "Жийп", 2015, 2024, 22, 121000, "Бензин", "CVT", "4WD", "Баруун", 2.0, "Хүрэн", "Улаанбаатар"],
  ["leaf", "dealer2", "Nissan", "Leaf", "Суудлын тэрэг", 2018, 2024, 28, 54000, "Цахилгаан", "Автомат", "FWD", "Баруун", null, "Цэнхэр", "Улаанбаатар"],
  ["note", "person", "Nissan", "Note", "Суудлын тэрэг", 2017, 2023, 16.5, 88000, "Хайбрид", "Автомат", "FWD", "Баруун", 1.2, "Цагаан", "Улаанбаатар", "sold"],
  ["outlander", "dealer1", "Mitsubishi", "Outlander", "Жийп", 2015, 2025, 45.5, 96000, "Хайбрид", "Автомат", "4WD", "Баруун", 2.0, "Мөнгөлөг", "Улаанбаатар"],
  ["forester", "person", "Subaru", "Forester", "Жийп", 2016, 2025, 45, 79000, "Бензин", "CVT", "AWD", "Баруун", 2.0, "Цагаан", "Улаанбаатар"],
  ["tucson", "dealer2", "Hyundai", "Tucson", "Жийп", 2021, 2024, 68, 39000, "Бензин", "Автомат", "FWD", "Зүүн", 2.0, "Саарал", "Улаанбаатар"],
  ["santafe", "dealer2", "Hyundai", "Santa Fe", "Жийп", 2019, 2023, 75, 62000, "Дизель", "Автомат", "AWD", "Зүүн", 2.2, "Хар", "Улаанбаатар"],
  ["sonata", "person", "Hyundai", "Sonata", "Суудлын тэрэг", 2020, 2024, 39, 87000, "Газ", "Автомат", "FWD", "Зүүн", 2.0, "Цагаан", "Улаанбаатар"],
  ["elantra", "person", "Hyundai", "Elantra", "Суудлын тэрэг", 2019, 2023, 32, 71000, "Бензин", "Автомат", "FWD", "Зүүн", 1.6, "Мөнгөлөг", "Сэлэнгэ", "sold"],
  ["sorento", "dealer2", "Kia", "Sorento", "Жийп", 2020, 2024, 82, 48000, "Дизель", "Автомат", "AWD", "Зүүн", 2.2, "Саарал", "Улаанбаатар"],
  ["k5", "person", "Kia", "K5", "Суудлын тэрэг", 2021, 2024, 48, 66000, "Газ", "Автомат", "FWD", "Зүүн", 2.0, "Цэнхэр", "Улаанбаатар"],
  ["wrangler", "dealer1", "Jeep", "Wrangler", "Жийп", 2020, 2025, 125, 34000, "Бензин", "Автомат", "4WD", "Зүүн", 2.0, "Саарал", "Улаанбаатар"],
  ["x6", "dealer1", "BMW", "X6", "Жийп", 2017, 2025, 100, 58000, "Бензин", "Автомат", "AWD", "Зүүн", 3.0, "Цагаан", "Улаанбаатар", "featured"],
  ["a7", "dealer2", "Audi", "A7", "Суудлын тэрэг", 2016, 2025, 79, 61000, "Бензин", "Автомат", "AWD", "Зүүн", 2.0, "Хар", "Улаанбаатар"],
  ["continental", "dealer2", "Lincoln", "Continental", "Суудлын тэрэг", 2017, 2025, 48.5, 72000, "Бензин", "Автомат", "AWD", "Зүүн", 2.7, "Шампань", "Улаанбаатар"],
  ["eclass", "dealer1", "Mercedes-Benz", "E-Class", "Суудлын тэрэг", 2018, 2024, 98, 53000, "Бензин", "Автомат", "RWD", "Зүүн", 2.0, "Саарал", "Улаанбаатар"],
  ["model3", "dealer2", "Tesla", "Model 3", "Суудлын тэрэг", 2021, 2024, 89, 37000, "Цахилгаан", "Автомат", "RWD", "Зүүн", null, "Улаан", "Улаанбаатар"],
  ["fit", "person", "Honda", "Fit", "Суудлын тэрэг", 2015, 2022, 14.5, 118000, "Хайбрид", "Автомат", "FWD", "Баруун", 1.5, "Мөнгөлөг", "Улаанбаатар"],
  ["songplus", "dealer1", "BYD", "Song Plus", "Жийп", 2023, 2024, 78, 21000, "Хайбрид", "Автомат", "FWD", "Зүүн", 1.5, "Цагаан", "Улаанбаатар"],
];

const description = (l) => {
  const [, seller, brand, model, , year, imported, , mileage, fuel, gearbox, drive, steering] = l;
  const lines = [
    `${brand} ${model} ${year} он, ${imported} онд орж ирсэн.`,
    `${fuel}, ${gearbox} хурдны хайрцагтай, ${drive}, ${steering.toLowerCase()} жолоотой. Гүйлт ${mileage.toLocaleString("en-US")} км.`,
    seller === "person"
      ? "Өөрөө унаж байгаа, засвар үйлчилгээг цаг тухайд нь хийлгэсэн. Үзлэгт оруулж болно."
      : "Гаалийн бичиг баримт бүрэн. Лизинг, бартер боломжтой. Оношилгоонд оруулж үзүүлнэ.",
  ];
  return lines.join("\n");
};

const pad = (n) => String(n).padStart(2, "0");
// Сүүлийн ~5 долоо хоногт тархсан огноо (хамгийн эхнийх нь хамгийн шинэ)
const dateAgo = (i) => {
  const d = new Date(Date.UTC(2026, 9, 20, 9, 0, 0) - i * 22 * 3600 * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    if (process.env.NODE_ENV === "production") throw new Error("Жишээ зарыг production-д оруулахгүй");
    const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements }).then(([rows]) => rows);
    const createdAt = "2026-10-20 00:00:00";

    // Борлуулагчид
    const sellerIds = {};
    for (const s of sellers) {
      let [row] = await q("SELECT id FROM users WHERE phonenumber = :phone AND status <> 'deleted'", { phone: s.phonenumber });
      if (!row) {
        await queryInterface.bulkInsert("users", [
          { phonenumber: s.phonenumber, firstname: s.firstname, lastname: s.lastname ?? null, role: s.role, status: "active", created_at: createdAt },
        ]);
        [row] = await q("SELECT id FROM users WHERE phonenumber = :phone AND status <> 'deleted'", { phone: s.phonenumber });
      }
      sellerIds[s.key] = row.id;
    }

    const [{ n }] = await q("SELECT COUNT(*) n FROM cars WHERE user_id IN (:ids)", { ids: Object.values(sellerIds) });
    if (n > 0) return;

    const idMap = async (sql) => new Map((await q(sql)).map((r) => [r.k, r.id]));
    const brandIds = await idMap("SELECT MIN(id) id, name k FROM brands WHERE status <> 'deleted' GROUP BY name");
    const modelIds = await idMap("SELECT MIN(id) id, CONCAT(brand_id, ':', name) k FROM carModels WHERE status <> 'deleted' GROUP BY brand_id, name");
    const bodyTypeIds = await idMap("SELECT id, name k FROM bodyTypes WHERE status <> 'deleted'");
    const locationIds = await idMap("SELECT id, name k FROM locations WHERE status <> 'deleted'");

    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });

    for (const [i, l] of listings.entries()) {
      const [image, seller, brand, model, bodyType, year, imported, price, mileage, fuel, gearbox, drive, steering, engine, color, location, flag] = l;
      const brandId = brandIds.get(brand);
      const at = dateAgo(i);
      const sellerPhone = sellers.find((s) => s.key === seller).phonenumber;

      await queryInterface.bulkInsert("cars", [
        {
          user_id: sellerIds[seller],
          brand_id: brandId,
          car_model_id: modelIds.get(`${brandId}:${model}`) ?? null,
          body_type_id: bodyTypeIds.get(bodyType) ?? null,
          location_id: locationIds.get(location) ?? null,
          manufactured_year: year,
          imported_year: imported,
          price: Math.round(price * 1000000),
          mileage,
          fuel_type: fuel,
          transmission: gearbox,
          drive_type: drive,
          steering,
          engine_capacity: engine,
          color,
          phonenumber: sellerPhone,
          description: description(l),
          view_count: 40 + ((i * 137) % 900),
          is_featured: flag === "featured",
          sold_at: flag === "sold" ? at : null,
          status: flag === "sold" ? "sold" : "active",
          created_by: sellerIds[seller],
          created_at: at,
        },
      ]);
      const [{ id: carId }] = await q("SELECT MAX(id) id FROM cars WHERE user_id = :uid", { uid: sellerIds[seller] });

      // Зураг: зар бүрт тусдаа файл (нэг зарын зургийг устгахад бусдад нөлөөлөхгүй)
      const fileName = `sample_${carId}_${image}.jpg`;
      const source = path.join(IMAGE_DIR, `${image}.jpg`);
      await saveSharpConverter(source, UPLOAD_DIR, fileName);
      await queryInterface.bulkInsert("allFiles", [
        {
          generated_name: fileName,
          data_id: carId,
          object_name: "cars",
          field_name: "image",
          extension: "jpg",
          size: (await fs.promises.stat(source)).size,
          original_name: `${image}.jpg`,
          order: 1,
          status: "active",
          created_by: sellerIds[seller],
          created_at: at,
        },
      ]);
    }
  },

  async down(queryInterface) {
    const q = (sql, replacements) => queryInterface.sequelize.query(sql, { replacements }).then(([rows]) => rows);
    const users = await q("SELECT id FROM users WHERE phonenumber IN (:phones)", { phones: sellers.map((s) => s.phonenumber) });
    if (!users.length) return;
    const ids = users.map((u) => u.id);
    const cars = await q("SELECT id FROM cars WHERE user_id IN (:ids)", { ids });
    if (cars.length) {
      const carIds = cars.map((c) => c.id);
      const files = await q("SELECT generated_name FROM allFiles WHERE object_name = 'cars' AND data_id IN (:carIds)", { carIds });
      for (const { generated_name } of files) {
        for (const prefix of ["", "icon_", "thumb_", "grid_"]) {
          await fs.promises.rm(path.join(UPLOAD_DIR, prefix + generated_name), { force: true });
        }
      }
      await q("DELETE FROM allFiles WHERE object_name = 'cars' AND data_id IN (:carIds)", { carIds });
      await q("DELETE FROM favorites WHERE car_id IN (:carIds)", { carIds });
      await q("DELETE FROM cars WHERE id IN (:carIds)", { carIds });
    }
    await q("DELETE FROM users WHERE id IN (:ids)", { ids });
  },
};
