class FilterData {
  static const List<String> locations = [
    'Бүх байршил',
    'Улаанбаатар',
    'Дархан-Уул',
    'Орхон',
    'Сэлэнгэ',
    'Дорнод',
    'Ховд',
  ];

  static const List<String> brands = [
    'Бүх бренд',
    'Toyota',
    'Lexus',
    'Nissan',
    'Hyundai',
    'Kia',
    'Mercedes-Benz',
    'BMW',
    'Honda',
    'Mitsubishi',
    'Mazda',
    'Ford',
  ];

  static const List<String> years = [
    'Бүх он',
    '2024',
    '2023',
    '2022',
    '2021',
    '2020',
    '2019',
    '2018',
    '2017',
    '2016',
    '2015',
    '2010 - 2014',
    '2005 - 2009',
    '2000 - 2004',
    '2000 оноос өмнөх',
  ];

  static const List<String> mileages = [
    'Бүх км',
    '0 - 5,000 км',
    '5,000 - 20,000 км',
    '20,000 - 50,000 км',
    '50,000 - 100,000 км',
    '100,000 - 150,000 км',
    '150,000+ км',
  ];

  static const List<String> fuelTypes = [
    'Бүх төрөл',
    'Бензин',
    'Дизель',
    'Хайбрид',
    'Газ',
    'Цахилгаан',
  ];

  static const List<String> driveTypes = [
    'Бүх төрөл',
    'Урд хөтлөгч (FWD)',
    'Хойд хөтлөгч (RWD)',
    'Бүх дугуй хөтлөгч (4WD)',
    'Бүх дугуй хөтлөгч (AWD)',
  ];

  static const List<String> transmissions = [
    'Бүх төрөл',
    'Автомат',
    'Механик',
    'CVT',
    'Типтроник',
  ];

  static List<String> getOptionsByTypeName(String typeName) {
    switch (typeName) {
      case 'location':
        return locations;
      case 'brand':
        return brands;
      case 'year':
        return years;
      case 'mileage':
        return mileages;
      case 'fuel':
        return fuelTypes;
      case 'drive':
        return driveTypes;
      case 'transmission':
        return transmissions;
      default:
        return [];
    }
  }
}
