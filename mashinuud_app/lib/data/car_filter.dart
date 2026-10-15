import 'package:mashinuud_app/data/car_data.dart';

const double maxPriceLimit = 400000000;

/// Нэг шүүлтүүрийн нөхцөл (жагсаалтад чип болж харагдана).
class FilterPart {
  final String key;
  final String label;
  final bool Function(Car car) test;

  const FilterPart(this.key, this.label, this.test);
}

/// Хайлт/шүүлтүүрийн бүх утга.
class CarQuery {
  final String query;
  final double minPrice;
  final double maxPrice;
  final String? location;
  final String? brand;
  final String? bodyType;
  final String? year;
  final String? mileage;
  final String? fuelType;
  final String? driveType;
  final String? transmission;

  const CarQuery({
    this.query = '',
    this.minPrice = 0,
    this.maxPrice = maxPriceLimit,
    this.location,
    this.brand,
    this.bodyType,
    this.year,
    this.mileage,
    this.fuelType,
    this.driveType,
    this.transmission,
  });

  /// Сонголтын жагсаалтын "бүгд" гэсэн эхний утгууд.
  static const _anyValues = {
    'Бүх байршил',
    'Бүх бренд',
    'Бүх он',
    'Бүх км',
    'Бүх төрөл',
  };

  static bool _isSet(String? v) =>
      v != null && v.isNotEmpty && !_anyValues.contains(v);

  List<FilterPart> get parts => [
    if (_isSet(location))
      FilterPart('location', location!, (c) => _matchLocation(location!, c)),
    if (_isSet(brand)) FilterPart('brand', brand!, (c) => c.brand == brand),
    if (_isSet(bodyType))
      FilterPart('body', bodyType!, (c) => c.bodyType == bodyType),
    if (_isSet(year))
      FilterPart('year', year!, (c) => _matchRange(year!, c.year)),
    if (_isSet(mileage))
      FilterPart('mileage', mileage!, (c) => _matchRange(mileage!, c.mileage)),
    if (_isSet(fuelType))
      FilterPart('fuel', fuelType!, (c) => c.fuel == fuelType),
    if (_isSet(driveType))
      FilterPart(
        'drive',
        _short(driveType!),
        (c) => _matchDrive(driveType!, c.drive),
      ),
    if (_isSet(transmission))
      FilterPart(
        'transmission',
        transmission!,
        (c) => _matchTransmission(transmission!, c.transmission),
      ),
    if (minPrice > 0)
      FilterPart(
        'minPrice',
        '${formatPrice(minPrice)}-с',
        (c) => c.price >= minPrice,
      ),
    if (maxPrice < maxPriceLimit)
      FilterPart(
        'maxPrice',
        '${formatPrice(maxPrice)} хүртэл',
        (c) => c.price <= maxPrice,
      ),
  ];

  CarQuery withText(String text) => CarQuery(
    query: text,
    minPrice: minPrice,
    maxPrice: maxPrice,
    location: location,
    brand: brand,
    bodyType: bodyType,
    year: year,
    mileage: mileage,
    fuelType: fuelType,
    driveType: driveType,
    transmission: transmission,
  );

  /// Нэг шүүлтүүрийг (FilterPart.key) хассан шинэ хайлт.
  CarQuery without(String key) => CarQuery(
    query: key == 'query' ? '' : query,
    minPrice: key == 'minPrice' ? 0 : minPrice,
    maxPrice: key == 'maxPrice' ? maxPriceLimit : maxPrice,
    location: key == 'location' ? null : location,
    brand: key == 'brand' ? null : brand,
    bodyType: key == 'body' ? null : bodyType,
    year: key == 'year' ? null : year,
    mileage: key == 'mileage' ? null : mileage,
    fuelType: key == 'fuel' ? null : fuelType,
    driveType: key == 'drive' ? null : driveType,
    transmission: key == 'transmission' ? null : transmission,
  );

  bool matches(Car car) {
    final q = query.trim().toLowerCase();
    if (q.isNotEmpty && !car.name.toLowerCase().contains(q)) return false;
    return parts.every((p) => p.test(car));
  }

  List<Car> apply(List<Car> cars) => cars.where(matches).toList();
}

/// "Бүх дугуй хөтлөгч (4WD)" -> "4WD"
String _short(String v) => RegExp(r'\(([^)]+)\)').firstMatch(v)?.group(1) ?? v;

bool _matchDrive(String option, String drive) => _short(option) == drive;

bool _matchTransmission(String option, String t) =>
    option == t || (option == 'CVT' && t == 'Вариатор');

bool _matchLocation(String option, Car car) =>
    option == 'Улаанбаатар' && districtCenters.containsKey(car.location);

/// "2010 - 2014", "150,000+ км", "2000 оноос өмнөх", "2019" зэргийг тайлна.
bool _matchRange(String option, int value) {
  final nums = RegExp(r'\d[\d,]*')
      .allMatches(option)
      .map((m) => int.parse(m.group(0)!.replaceAll(',', '')))
      .toList();
  if (nums.isEmpty) return true;
  if (option.contains('өмнөх')) return value < nums.first;
  if (option.contains('+')) return value >= nums.first;
  if (nums.length >= 2) return value >= nums[0] && value <= nums[1];
  return value == nums.first;
}

/// Хадгалсан хайлт.
class SavedSearch {
  final String title;
  final CarQuery query;

  const SavedSearch(this.title, this.query);

  String get summary {
    final labels = query.parts.map((p) => p.label).toList();
    if (query.query.isNotEmpty) labels.insert(0, '“${query.query}”');
    return labels.isEmpty ? 'Бүх зар' : labels.join(' · ');
  }
}

/// Апп ажиллаж байх үеийн хадгалсан хайлтууд.
final List<SavedSearch> savedSearches = [
  const SavedSearch('Toyota жийп', CarQuery(brand: 'Toyota', bodyType: 'Жийп')),
  const SavedSearch(
    'Хямд хайбрид',
    CarQuery(fuelType: 'Хайбрид', maxPrice: 100000000),
  ),
];
