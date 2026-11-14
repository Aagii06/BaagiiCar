import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter/widgets.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 4-digit PIN in front of the admin half: asked when it's entered (from the customer side or at app start)
/// and when the app comes back after [timeoutMinutes] in the background. Kept on this device only, for the
/// signed-in admin / dealer; signing out removes it.
class AppLock extends ChangeNotifier {
  static const _key = 'baagii_car_admin_lock';
  static const maxAttempts = 5;
  static const timeouts = [0, 1, 5, 15, 30];

  SharedPreferences? _prefs;
  int? _userId;
  String? _salt;
  String? _hash;
  int _timeout = 15;
  bool _locked = false;
  int _failed = 0;
  DateTime? _hiddenAt;

  bool get enabled => _hash != null && _userId != null && _userId == AdminApi.session.user?.id;
  bool get locked => enabled && _locked;
  int get timeoutMinutes => _timeout;
  int get attemptsLeft => maxAttempts - _failed;

  void load(SharedPreferences prefs) {
    _prefs = prefs;
    final raw = prefs.getString(_key);
    if (raw != null) {
      try {
        final j = jsonDecode(raw) as Map<String, dynamic>;
        _userId = (j['user'] as num?)?.toInt();
        _salt = j['salt'] as String?;
        _hash = j['hash'] as String?;
        _timeout = (j['timeout'] as num?)?.toInt() ?? 15;
      } catch (_) {}
    }
    // Signing out (or a revoked session) drops the PIN with it.
    AdminApi.session.addListener(() {
      if (!AdminApi.session.signedIn && _hash != null) disable();
    });
  }

  void _save() {
    if (_hash == null) {
      _prefs?.remove(_key);
    } else {
      _prefs?.setString(_key, jsonEncode({'user': _userId, 'salt': _salt, 'hash': _hash, 'timeout': _timeout}));
    }
  }

  String _digest(String pin, String salt) => sha256.convert(utf8.encode('$salt:$pin')).toString();

  /// Turns the lock on (or changes the PIN).
  void setPin(String pin) {
    final r = Random.secure();
    _salt = base64Url.encode(List.generate(16, (_) => r.nextInt(256)));
    _hash = _digest(pin, _salt!);
    _userId = AdminApi.session.user?.id;
    _failed = 0;
    _locked = false;
    _save();
    notifyListeners();
  }

  void disable() {
    _hash = null;
    _salt = null;
    _userId = null;
    _locked = false;
    _failed = 0;
    _save();
    notifyListeners();
  }

  void setTimeout(int minutes) {
    _timeout = minutes;
    _save();
    notifyListeners();
  }

  bool check(String pin) => _hash != null && _digest(pin, _salt!) == _hash;

  /// Locks now (entering the admin half).
  void lock() {
    if (!enabled || _locked) return;
    _locked = true;
    notifyListeners();
  }

  /// Returns true when unlocked; after [maxAttempts] wrong PINs the user is signed out.
  bool unlock(String pin) {
    if (check(pin)) {
      _locked = false;
      _failed = 0;
      notifyListeners();
      return true;
    }
    _failed++;
    if (_failed >= maxAttempts) {
      AdminApi.session.signOut();
    } else {
      notifyListeners();
    }
    return false;
  }

  void appHidden() => _hiddenAt ??= DateTime.now();

  void appShown() {
    final at = _hiddenAt;
    _hiddenAt = null;
    if (at != null && DateTime.now().difference(at).inMinutes >= _timeout) lock();
  }
}

final appLock = AppLock();

/// The app's navigator, so the lock screen can cover any open page.
final rootNavigatorKey = GlobalKey<NavigatorState>();
