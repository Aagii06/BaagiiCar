import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';

class Car {
  final String id;
  final String name;
  final String brand;
  final String bodyType;
  final int year;
  final int importYear;
  final int mileage;
  final int price;
  final String fuel;
  final String engine;
  final String transmission;
  final String steering;
  final String drive;
  final String color;
  final String location;
  final String postedAgo;
  final String description;
  final bool verified;
  final bool leasing;
  final String? badge;
  final Color tint;

  const Car({
    required this.id,
    required this.name,
    required this.brand,
    required this.bodyType,
    required this.year,
    required this.importYear,
    required this.mileage,
    required this.price,
    required this.fuel,
    required this.engine,
    required this.transmission,
    required this.steering,
    required this.drive,
    required this.color,
    required this.location,
    required this.postedAgo,
    required this.description,
    this.verified = false,
    this.leasing = false,
    this.badge,
    this.tint = AppPalette.tintBlue,
  });

  /// "2016 · 120,000 км · Дизель"
  String get summary => '$year · ${formatNumber(mileage)} км · $fuel';

  String get priceLabel => formatPrice(price);
}

String formatNumber(num value) => value
    .toStringAsFixed(0)
    .replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );

String formatPrice(num value) => '${formatNumber(value)}₮';

const List<Car> carData = [
  Car(
    id: '1',
    name: 'Toyota Land Cruiser 300',
    brand: 'Toyota',
    bodyType: 'Жийп',
    year: 2022,
    importYear: 2023,
    mileage: 18000,
    price: 385000000,
    fuel: 'Бензин',
    engine: '3.5 л',
    transmission: 'Автомат',
    steering: 'Зүүн',
    drive: '4WD',
    color: 'Цагаан',
    location: 'Баянзүрх',
    postedAgo: '1 цагийн өмнө',
    description: 'Шинэвтэр, бүрэн комплектлэлтэй. Албан ёсны засвар үйлчилгээтэй.',
    verified: true,
    leasing: true,
    badge: 'Шалгагдсан',
    tint: AppPalette.tintBlue,
  ),
  Car(
    id: '2',
    name: 'Lexus RX 450h',
    brand: 'Lexus',
    bodyType: 'Жийп',
    year: 2019,
    importYear: 2021,
    mileage: 64000,
    price: 128000000,
    fuel: 'Хайбрид',
    engine: '3.5 л',
    transmission: 'Автомат',
    steering: 'Зүүн',
    drive: 'AWD',
    color: 'Хар',
    location: 'Хан-Уул',
    postedAgo: '3 цагийн өмнө',
    description: 'Машины байдал маш сайн. Бүх үйлчилгээ хийлгэсэн.',
    leasing: true,
    badge: 'Онцлох',
    tint: AppPalette.tintYellow,
  ),
  Car(
    id: '3',
    name: 'Toyota Land Cruiser 200',
    brand: 'Toyota',
    bodyType: 'Жийп',
    year: 2016,
    importYear: 2019,
    mileage: 120000,
    price: 165000000,
    fuel: 'Дизель',
    engine: '4.5 л',
    transmission: 'Автомат',
    steering: 'Зүүн',
    drive: '4WD',
    color: 'Хар',
    location: 'Баянзүрх',
    postedAgo: '2 цагийн өмнө',
    description:
        'Нэг эзэмшигчтэй, албан ёсны засвар үйлчилгээтэй. Будаггүй, осолгүй. Өвлийн дугуй нэмэлтээр өгнө.',
    verified: true,
    leasing: true,
    tint: AppPalette.tintBlue,
  ),
  Car(
    id: '4',
    name: 'Toyota RAV4',
    brand: 'Toyota',
    bodyType: 'Жийп',
    year: 2019,
    importYear: 2020,
    mileage: 70000,
    price: 78000000,
    fuel: 'Бензин',
    engine: '2.5 л',
    transmission: 'Автомат',
    steering: 'Зүүн',
    drive: 'AWD',
    color: 'Саарал',
    location: 'Хан-Уул',
    postedAgo: 'Өчигдөр',
    description: 'Цэвэрхэн, хотын хэрэглээнд тохиромжтой.',
    tint: AppPalette.tintYellow,
  ),
  Car(
    id: '5',
    name: 'Lexus LX 570',
    brand: 'Lexus',
    bodyType: 'Жийп',
    year: 2015,
    importYear: 2017,
    mileage: 150000,
    price: 175000000,
    fuel: 'Бензин',
    engine: '5.7 л',
    transmission: 'Автомат',
    steering: 'Зүүн',
    drive: '4WD',
    color: 'Цагаан',
    location: 'Сүхбаатар',
    postedAgo: '3 өдрийн өмнө',
    description: 'Явах эд анги асуудалгүй, салон цэвэрхэн.',
    verified: true,
    tint: AppPalette.tintGreen,
  ),
  Car(
    id: '6',
    name: 'Toyota Highlander',
    brand: 'Toyota',
    bodyType: 'Жийп',
    year: 2018,
    importYear: 2020,
    mileage: 88000,
    price: 92000000,
    fuel: 'Хайбрид',
    engine: '3.5 л',
    transmission: 'Вариатор',
    steering: 'Зүүн',
    drive: 'AWD',
    color: 'Мөнгөлөг',
    location: 'Чингэлтэй',
    postedAgo: '4 өдрийн өмнө',
    description: 'Гэр бүлийн хэрэглээнд тохиромжтой, 7 суудалтай.',
    tint: AppPalette.tintLavender,
  ),
  Car(
    id: '7',
    name: 'Toyota Prado 150',
    brand: 'Toyota',
    bodyType: 'Жийп',
    year: 2017,
    importYear: 2018,
    mileage: 110000,
    price: 118000000,
    fuel: 'Дизель',
    engine: '2.8 л',
    transmission: 'Автомат',
    steering: 'Зүүн',
    drive: '4WD',
    color: 'Хар',
    location: 'Сонгинохайрхан',
    postedAgo: '5 өдрийн өмнө',
    description: 'Хөдөө, хотод аль алинд нь тохиромжтой.',
    verified: true,
    tint: AppPalette.tintPink,
  ),
  Car(
    id: '8',
    name: 'Toyota Prius 30',
    brand: 'Toyota',
    bodyType: 'Седан',
    year: 2012,
    importYear: 2016,
    mileage: 140000,
    price: 19500000,
    fuel: 'Хайбрид',
    engine: '1.8 л',
    transmission: 'Автомат',
    steering: 'Баруун',
    drive: 'FWD',
    color: 'Цагаан',
    location: 'Баянгол',
    postedAgo: '30 минутын өмнө',
    description: 'Шатахуун бага зарцуулдаг, батарей шинэчилсэн.',
    tint: AppPalette.tintGreen,
  ),
];

Car findCar(String id) =>
    carData.firstWhere((c) => c.id == id, orElse: () => carData.first);
