import 'dart:io';

class AppConstants {
  /// `flutter run --dart-define=API_URL=https://...` гэж өөрчилж болно.
  static const String api = String.fromEnvironment('API_URL');

  /// Public website, for share links (`--dart-define=SITE_URL=...`).
  static const String siteUrl = String.fromEnvironment('SITE_URL', defaultValue: 'https://cardealer.mn');

  /// Help-desk phone shown under the chat code form (`--dart-define=CONTACT_PHONE=...`).
  static const String contactPhone = String.fromEnvironment('CONTACT_PHONE');

  static const String appName = 'Cardealer';

  /// Android эмулятор дээр хост машины localhost нь 10.0.2.2 байдаг.
  static String get apiUrl => (api.isNotEmpty
          ? api
          : Platform.isAndroid
              ? 'http://10.0.2.2:5011'
              : 'https://cardealer.mn:8898/')
              // : 'http://localhost:5011')
      .replaceAll(RegExp(r'/$'), '');

  static const int pageSize = 12;
  static const int compareMax = 4;
}

/// Leasing estimate: illustrative terms until a partner's real rates are wired in (same as the website).
class Leasing {
  static const double downPaymentRate = 0.3;
  static const double monthlyRate = 0.018;
  static const List<int> terms = [12, 24, 36, 48];

  /// Highest down payment (%) the calculator accepts.
  static const int maxDownPercent = 90;

  static double monthly(double price, int months, {double downRate = downPaymentRate}) {
    final principal = price * (1 - downRate);
    if (principal == 0 || months == 0) return 0;
    var growth = 1.0;
    for (var i = 0; i < months; i++) {
      growth *= 1 + monthlyRate;
    }
    return principal * monthlyRate / (1 - 1 / growth);
  }
}

// Stored as is (Mongolian); must match backend/config/constants.js.
const fuelTypes = ['Бензин', 'Дизель', 'Хайбрид', 'Газ', 'Цахилгаан'];
const steerings = ['Зүүн', 'Баруун'];
