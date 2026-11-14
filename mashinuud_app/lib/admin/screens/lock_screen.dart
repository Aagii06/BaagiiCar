import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/lock.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/common.dart';

const _pinLength = 4;

/// Four dots and a number pad; [onComplete] gets the PIN once 4 digits are in.
/// [error] turns the dots red; [shake] changing shakes them.
class PinPad extends StatefulWidget {
  final String title;
  final String? subtitle;
  final String? error;
  final int shake;
  final ValueChanged<String> onComplete;
  const PinPad({
    super.key,
    required this.title,
    this.subtitle,
    this.error,
    this.shake = 0,
    required this.onComplete,
  });
  @override
  State<PinPad> createState() => _PinPadState();
}

class _PinPadState extends State<PinPad> {
  String _pin = '';

  @override
  void didUpdateWidget(PinPad old) {
    super.didUpdateWidget(old);
    // A rejected PIN (or a new step) starts over.
    if (widget.shake != old.shake || widget.title != old.title) _pin = '';
  }

  void _tap(String d) {
    if (_pin.length >= _pinLength) return;
    HapticFeedback.selectionClick();
    setState(() => _pin += d);
    if (_pin.length == _pinLength) {
      final pin = _pin;
      Future.delayed(
        const Duration(milliseconds: 120),
        () => widget.onComplete(pin),
      );
    }
  }

  void _back() {
    if (_pin.isEmpty) return;
    setState(() => _pin = _pin.substring(0, _pin.length - 1));
  }

  Widget _key(String label, {VoidCallback? onTap, Widget? child}) => SizedBox(
    width: 76,
    height: 76,
    child: Material(
      color: child == null ? AppPalette.card : Colors.transparent,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Center(
          child:
              child ??
              Text(label, style: displayStyle(28, weight: FontWeight.w500)),
        ),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final red = widget.error != null && _pin.isEmpty;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          widget.title,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        if (widget.subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            widget.subtitle!,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13,
              color: AppPalette.mutedForeground,
            ),
          ),
        ],
        const SizedBox(height: 22),
        Shake(
          trigger: widget.shake,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var i = 0; i < _pinLength; i++)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 120),
                  margin: const EdgeInsets.symmetric(horizontal: 9),
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i < _pin.length
                        ? AppPalette.primary
                        : (red
                              ? AppPalette.destructiveSoft
                              : Colors.transparent),
                    border: Border.all(
                      color: red
                          ? AppPalette.destructive
                          : (i < _pin.length
                                ? AppPalette.primary
                                : AppPalette.input),
                      width: 2,
                    ),
                  ),
                ),
            ],
          ),
        ),
        SizedBox(
          height: 36,
          child: Center(
            child: widget.error == null
                ? null
                : Text(
                    widget.error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppPalette.destructive,
                    ),
                  ),
          ),
        ),
        for (final row in const [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ])
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final d in row)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: _key(d, onTap: () => _tap(d)),
                  ),
              ],
            ),
          ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: SizedBox(width: 76, height: 76),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: _key('0', onTap: () => _tap('0')),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: _key(
                '',
                onTap: _back,
                child: const Icon(
                  Icons.backspace_outlined,
                  color: AppPalette.mutedForeground,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Shown over the admin half while it's locked.
class LockScreen extends StatefulWidget {
  const LockScreen({super.key});
  @override
  State<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends State<LockScreen> {
  String? _error;
  int _shake = 0;

  void _submit(String pin) {
    if (appLock.unlock(pin)) return;
    if (!mounted) return;
    setState(() {
      _error = 'PIN буруу байна. ${appLock.attemptsLeft} оролдлого үлдлээ';
      _shake++;
    });
    HapticFeedback.heavyImpact();
  }

  Future<void> _forgot() async {
    if (!await confirmSheet(
      context,
      title: 'PIN мартсан уу?',
      message:
          'Гараад нууц үгээрээ дахин нэвтэрнэ. Дараа нь профайлаас шинэ PIN тохируулна.',
      confirmLabel: 'Гарах',
      icon: Icons.lock_reset_rounded,
    )) {
      return;
    }
    AdminApi.session.signOut();
  }

  @override
  Widget build(BuildContext context) {
    final user = AdminApi.session.user;
    // Android back can't get past the lock.
    return PopScope(
      canPop: false,
      child: Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  UserAvatar(user, size: 64),
                  const SizedBox(height: 10),
                  Text(
                    user?.firstname ?? user?.fullName ?? '',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppPalette.mutedForeground,
                    ),
                  ),
                  const SizedBox(height: 18),
                  PinPad(
                    title: 'PIN кодоо оруулна уу',
                    error: _error,
                    shake: _shake,
                    onComplete: _submit,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextButton(
                        onPressed: _forgot,
                        child: const Text(
                          'PIN мартсан',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: () => Stores.mode.setAdmin(false),
                        style: TextButton.styleFrom(
                          foregroundColor: AppPalette.mutedForeground,
                        ),
                        child: const Text(
                          'Хэрэглэгч рүү буцах',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// New PIN, typed twice. Resolves true once set. With [verifyCurrent], the current PIN is asked first.
Future<bool> setPinSheet(
  BuildContext context, {
  bool verifyCurrent = false,
}) async {
  final ok = await Navigator.of(context).push<bool>(
    MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => _SetPinScreen(verifyCurrent: verifyCurrent),
    ),
  );
  return ok == true;
}

class _SetPinScreen extends StatefulWidget {
  final bool verifyCurrent;
  const _SetPinScreen({required this.verifyCurrent});
  @override
  State<_SetPinScreen> createState() => _SetPinScreenState();
}

class _SetPinScreenState extends State<_SetPinScreen> {
  late String _step = widget.verifyCurrent ? 'current' : 'new';
  String _first = '';
  String? _error;
  int _shake = 0;

  void _fail(String message) => setState(() {
    _error = message;
    _shake++;
  });

  void _done(String pin) {
    switch (_step) {
      case 'current':
        if (!appLock.check(pin)) return _fail('PIN буруу байна');
        setState(() {
          _step = 'new';
          _error = null;
        });
      case 'new':
        if (RegExp(r'^(\d)\1{3}$').hasMatch(pin) ||
            '0123456789'.contains(pin) ||
            '9876543210'.contains(pin)) {
          return _fail('Хялбар PIN байна. Өөр PIN сонгоно уу');
        }
        setState(() {
          _first = pin;
          _step = 'confirm';
          _error = null;
        });
      default:
        if (pin != _first) {
          setState(() => _step = 'new');
          return _fail('PIN таарахгүй байна. Дахин оруулна уу');
        }
        appLock.setPin(pin);
        Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = switch (_step) {
      'current' => 'Одоогийн PIN',
      'new' => 'Шинэ PIN',
      _ => 'PIN давтах',
    };
    final subtitle = switch (_step) {
      'current' => 'Одоогийн PIN кодоо оруулна уу',
      'new' => '4 оронтой PIN код сонгоно уу',
      _ => 'Баталгаажуулахын тулд дахин оруулна уу',
    };
    return Scaffold(
      appBar: AppBar(title: const Text('Апп түгжих PIN')),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: PinPad(
              title: title,
              subtitle: subtitle,
              error: _error,
              shake: _shake,
              onComplete: _done,
            ),
          ),
        ),
      ),
    );
  }
}
