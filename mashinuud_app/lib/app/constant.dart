import 'dart:io';

class AppConstants {
  /// `flutter run --dart-define=API_URL=https://...` гэж өөрчилж болно.
  static const String api = String.fromEnvironment('API_URL');
  static const String appName = 'Mashinuud';

  /// Android эмулятор дээр хост машины localhost нь 10.0.2.2 байдаг.
  static String get apiUrl => api.isNotEmpty
      ? api
      : Platform.isAndroid
      ? 'http://10.0.2.2:5011'
      : 'http://localhost:5011';
}
