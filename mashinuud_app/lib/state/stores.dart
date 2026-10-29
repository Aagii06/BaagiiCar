import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:mashinuud_app/api/api.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/api/models.dart';
import 'package:mashinuud_app/app/constant.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// App-wide state, kept on the device like the website keeps it in the browser.
/// Call [Stores.load] once before `runApp`.
class Stores {
  static final favorites = FavoritesStore();
  static final compare = CompareStore();
  static final auth = AuthStore();
  static final shell = ShellController();
  static final mode = AppModeStore();

  static Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    favorites._load(prefs);
    compare._load(prefs);
    auth._load(prefs);
    mode._load(prefs);
  }
}

/// Saved ads; the list is dropped 30 days after the last add (each add restarts the clock).
class FavoritesStore extends ChangeNotifier {
  static const _key = 'baagii_car_saved';
  static const _ttl = Duration(days: 30);
  SharedPreferences? _prefs;
  final Set<int> _ids = {};
  int _addedAt = 0;

  Set<int> get ids => Set.unmodifiable(_ids);
  bool has(int id) => _ids.contains(id);

  void _load(SharedPreferences prefs) {
    _prefs = prefs;
    try {
      final raw = jsonDecode(prefs.getString(_key) ?? 'null');
      if (raw is Map) {
        final at = (raw['addedAt'] as num?)?.toInt() ?? 0;
        final ids = (raw['ids'] as List? ?? []).whereType<num>().map((n) => n.toInt());
        if (DateTime.now().millisecondsSinceEpoch - at <= _ttl.inMilliseconds) {
          _ids.addAll(ids);
          _addedAt = at;
        } else {
          prefs.remove(_key);
        }
      }
    } catch (_) {}
  }

  void toggle(int id) {
    if (!_ids.remove(id)) {
      _ids.add(id);
      _addedAt = DateTime.now().millisecondsSinceEpoch;
    }
    if (_ids.isEmpty) {
      _prefs?.remove(_key);
    } else {
      _prefs?.setString(_key, jsonEncode({'ids': _ids.toList(), 'addedAt': _addedAt}));
    }
    notifyListeners();
  }
}

/// Cars picked for side-by-side comparison, in the order they were added.
class CompareStore extends ChangeNotifier {
  static const _key = 'baagii_car_compare';
  SharedPreferences? _prefs;
  final List<int> _ids = [];

  List<int> get ids => List.unmodifiable(_ids);
  bool has(int id) => _ids.contains(id);
  bool get full => _ids.length >= AppConstants.compareMax;

  void _load(SharedPreferences prefs) {
    _prefs = prefs;
    try {
      final raw = jsonDecode(prefs.getString(_key) ?? '[]');
      if (raw is List) _ids.addAll(raw.whereType<num>().map((n) => n.toInt()).take(AppConstants.compareMax));
    } catch (_) {}
  }

  void _save() {
    if (_ids.isEmpty) {
      _prefs?.remove(_key);
    } else {
      _prefs?.setString(_key, jsonEncode(_ids));
    }
    notifyListeners();
  }

  void toggle(int id) {
    if (!_ids.remove(id)) {
      if (full) return;
      _ids.add(id);
    }
    _save();
  }

  void remove(int id) {
    _ids.remove(id);
    _save();
  }

  void clear() {
    _ids.clear();
    _save();
  }
}

/// Phone + code sign-in. The token (7 days) is kept on the device and re-checked against the backend on start.
class AuthStore extends ChangeNotifier {
  static const _key = 'baagii_car_auth';
  SharedPreferences? _prefs;
  Session? _session;

  WebUser? get user => _session?.user;
  String? get token => _session?.token;

  void _load(SharedPreferences prefs) {
    _prefs = prefs;
    try {
      final raw = jsonDecode(prefs.getString(_key) ?? 'null');
      if (raw is Map && raw['token'] is String && raw['user'] is Map) {
        _session = Session(raw['token'] as String, WebUser.fromJson(Map<String, dynamic>.from(raw['user'] as Map)));
        _refresh(_session!.token);
      }
    } catch (_) {}
  }

  Future<void> _refresh(String token) async {
    try {
      final user = await Api.getMe(token);
      if (_session?.token == token) signIn(Session(token, user));
    } on ApiError catch (e) {
      // Expired token or removed account; offline keeps the cached session.
      if (e.status == 401 && _session?.token == token) signOut();
    }
  }

  void signIn(Session session) {
    _session = session;
    _prefs?.setString(_key, jsonEncode({'token': session.token, 'user': session.user.toJson()}));
    notifyListeners();
  }

  void signOut() {
    _session = null;
    _prefs?.remove(_key);
    notifyListeners();
  }
}

/// Bottom-bar tabs, and filters handed to the "Хайх" tab from elsewhere (hero search, brand tiles…).
class ShellController extends ChangeNotifier {
  static const home = 0, cars = 1, compare = 2, profile = 3;
  int tab = home;

  /// Set before switching to [cars]; the list picks it up once.
  CarSearch? pendingSearch;

  void go(int index) {
    tab = index;
    notifyListeners();
  }

  void openCars([CarSearch search = const CarSearch()]) {
    pendingSearch = search;
    go(cars);
  }
}

/// Which half of the app is showing: the customer screens, or the admin panel (admins / dealers).
/// Kept on the device, so a signed-in dealer lands back in the panel on the next start.
class AppModeStore extends ChangeNotifier {
  static const _key = 'baagii_car_admin_mode';
  SharedPreferences? _prefs;
  bool _admin = false;

  bool get admin => _admin;

  void _load(SharedPreferences prefs) {
    _prefs = prefs;
    _admin = prefs.getBool(_key) ?? false;
  }

  void setAdmin(bool value) {
    if (_admin == value) return;
    _admin = value;
    if (value) {
      _prefs?.setBool(_key, true);
    } else {
      _prefs?.remove(_key);
    }
    notifyListeners();
  }
}
