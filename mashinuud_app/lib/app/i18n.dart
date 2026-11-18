/// App translations (customer and admin sides), the same way as the web (src/lib/i18n): keys are the Mongolian
/// text itself, so Mongolian needs no dictionary and a missing translation falls back to Mongolian.
/// `{name}` marks a variable. Changing the language remounts the screens (main.dart, admin/shell.dart), so every
/// `tr()` runs again.
library;

import 'package:flutter/foundation.dart';
import 'package:mashinuud_app/app/i18n_en.dart';
import 'package:mashinuud_app/app/i18n_ru.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppLang extends ChangeNotifier {
  static const _key = 'baagii_car_lang';
  static const codes = ['mn', 'en', 'ru'];
  static const labels = {'mn': 'Монгол', 'en': 'English', 'ru': 'Русский'};
  SharedPreferences? _prefs;
  String _code = 'mn';

  String get code => _code;

  void load(SharedPreferences prefs) {
    _prefs = prefs;
    // Одоогоор зөвхөн монгол хэл: хадгалсан сонголтыг уншихгүй. Хэл солих товчийг буцааж нээхдээ сэргээнэ.
    // final saved = prefs.getString(_key);
    // if (saved != null && codes.contains(saved)) _code = saved;
  }

  void set(String code) {
    if (!codes.contains(code) || code == _code) return;
    _code = code;
    _prefs?.setString(_key, code);
    notifyListeners();
  }
}

final appLang = AppLang();

final _dictionaries = <String, Map<String, String>>{'en': appEn, 'ru': appRu};

/// The admin text in the chosen language. Translating an already translated text returns it unchanged.
String tr(String key, [Map<String, Object?>? vars]) {
  var s = _dictionaries[appLang.code]?[key] ?? key;
  if (vars != null) {
    vars.forEach((k, v) => s = s.replaceAll('{$k}', '${v ?? ''}'));
  }
  return s;
}

/// A stored Mongolian value (fuel type, colour…) shown in the chosen language; unknown values stay as they are.
String trValue(String? value) => value == null ? '' : tr(value);
