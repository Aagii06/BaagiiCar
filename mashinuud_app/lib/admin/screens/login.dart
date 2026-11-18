import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/app_bar.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/app/i18n.dart';

final _phoneRe = RegExp(r'^[5-9]\d{7}$');

/// Admins / dealers sign in with phone + password (admin/src/app/login). A bad number marks only the phone
/// field; wrong credentials mark both; the fields shake once.
class AdminLoginForm extends StatefulWidget {
  /// Signed in: open the admin half.
  final VoidCallback? onDone;
  const AdminLoginForm({super.key, this.onDone});
  @override
  State<AdminLoginForm> createState() => _AdminLoginFormState();
}

class _AdminLoginFormState extends State<AdminLoginForm> {
  final _phone = TextEditingController();
  final _password = TextEditingController();
  String? _error;
  String? _invalid; // 'phone' | 'both'
  int _shakes = 0;
  bool _busy = false;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  void _fail(String message, String fields) => setState(() {
        _error = message;
        _invalid = fields;
        _shakes++;
      });

  void _clear() {
    if (_error != null) {
      setState(() {
        _error = null;
        _invalid = null;
      });
    }
  }

  Future<void> _submit() async {
    if (_busy) return;
    FocusScope.of(context).unfocus();
    if (!_phoneRe.hasMatch(_phone.text)) return _fail(tr('Утасны дугаар 5–9-өөр эхэлсэн 8 оронтой тоо байна'), 'phone');
    if (_password.text.isEmpty) return _fail(tr('Нууц үгээ оруулна уу'), 'both');
    setState(() => _busy = true);
    _clear();
    try {
      await AdminApi.session.login(_phone.text, _password.text);
      if (!mounted) return;
      (widget.onDone ?? () => Stores.mode.setAdmin(true))();
    } catch (e) {
      if (mounted) _fail(errorText(e), 'both');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Shake(
          trigger: _shakes,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            FieldLabel(label: tr('Утасны дугаар'), child: PhoneField(controller: _phone, invalid: _invalid != null, onChanged: (_) => _clear())),
            const SizedBox(height: 14),
            FieldLabel(
              label: tr('Нууц үг'),
              child: PasswordField(controller: _password, hint: tr('Нууц үг'), invalid: _invalid == 'both', onChanged: (_) => _clear(), onSubmitted: (_) => _submit()),
            ),
          ]),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ForgotPasswordScreen(phone: _phone.text))),
            child: Text(tr('Нууц үгээ мартсан уу?'), style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ),
        FormError(_error),
        const SizedBox(height: 12),
        PrimaryButton(label: _busy ? tr('Түр хүлээнэ үү…') : tr('Нэвтрэх'), busy: _busy, onTap: _submit),
      ]);
}

/// Full sign-in page of the admin half (shown when its session ends).
class AdminLoginScreen extends StatelessWidget {
  const AdminLoginScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: ListView(padding: const EdgeInsets.all(20), children: [
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 36),
              decoration: BoxDecoration(color: AppPalette.dark, borderRadius: BorderRadius.circular(28)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [const LogoMark(), const SizedBox(width: 10), Text('CARDEALER', style: displayStyle(21, color: Colors.white))]),
                const SizedBox(height: 28),
                Text.rich(TextSpan(children: [
                  TextSpan(text: tr('Удирдлагын '), style: displayStyle(28, color: Colors.white)),
                  TextSpan(text: tr('самбар'), style: displayStyle(28, color: AppPalette.primary)),
                ])),
                const SizedBox(height: 8),
                Text(tr('Админ эсвэл дилер эрхтэй утасны дугаараараа нэвтэрнэ үү.'), style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.7))),
              ]),
            ),
            Transform.translate(
              offset: const Offset(0, -16),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(28), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 24, offset: const Offset(0, 8))]),
                child: const AdminLoginForm(),
              ),
            ),
            TextButton(
              onPressed: () => Stores.mode.setAdmin(false),
              child: Text(tr('Хэрэглэгчээр үргэлжлүүлэх'), style: TextStyle(fontWeight: FontWeight.w600)),
            ),
          ]),
        ),
      );
}

/// Forgotten password: registered phone → SMS code → new password, then signed straight in.
class ForgotPasswordScreen extends StatefulWidget {
  final String phone;
  const ForgotPasswordScreen({super.key, this.phone = ''});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  late final _phone = TextEditingController(text: widget.phone);
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String _step = 'phone';
  String _resetToken = '';
  String? _error;
  bool _busy = false;
  int _cooldown = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in [_phone, _code, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  void _startCooldown() {
    _timer?.cancel();
    setState(() => _cooldown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted || _cooldown <= 1) {
        t.cancel();
        if (mounted) setState(() => _cooldown = 0);
        return;
      }
      setState(() => _cooldown--);
    });
  }

  Future<void> _attempt(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => _error = errorText(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _sendCode() async {
    if (_phone.text.length != 8) return setState(() => _error = tr('Утасны дугаар 8 оронтой байна'));
    await _attempt(() async {
      await AdminApi.forgotSend(_phone.text);
      _code.clear();
      _startCooldown();
      setState(() => _step = 'code');
    });
  }

  Future<void> _submit() async {
    if (_busy) return;
    if (_step == 'phone') return _sendCode();
    if (_step == 'code') {
      if (_code.text.trim().isEmpty) return setState(() => _error = tr('Код оруулна уу'));
      return _attempt(() async {
        _resetToken = await AdminApi.forgotVerify(_phone.text, _code.text.trim());
        setState(() => _step = 'password');
      });
    }
    if (_password.text.length < 6) return setState(() => _error = tr('Нууц үг 6-аас дээш тэмдэгттэй байна'));
    if (_password.text != _confirm.text) return setState(() => _error = tr('Нууц үг таарахгүй байна'));
    await _attempt(() async {
      await AdminApi.forgotReset(_resetToken, _password.text, _confirm.text);
      await AdminApi.session.login(_phone.text, _password.text);
      if (!mounted) return;
      Navigator.of(context).popUntil((r) => r.isFirst);
      Stores.mode.setAdmin(true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final description = switch (_step) {
      'phone' => tr('Бүртгэлтэй утасны дугаараа оруулна уу. Тэр дугаарт баталгаажуулах код илгээнэ.'),
      'code' => tr('{text} дугаарт ирсэн кодыг оруулна уу.', {'text': _phone.text}),
      _ => tr('Дугаар баталгаажлаа. Шинэ нууц үгээ оруулна уу.'),
    };
    final label = switch (_step) { 'phone' => tr('Код авах'), 'code' => tr('Баталгаажуулах'), _ => tr('Хадгалаад нэвтрэх') };
    return AdminPage(
      title: tr('Нууц үг сэргээх'),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Section(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text(description, style: const TextStyle(color: AppPalette.mutedForeground)),
            const SizedBox(height: 16),
            if (_step == 'phone') FieldLabel(label: tr('Утасны дугаар'), child: PhoneField(controller: _phone, autofocus: true)),
            if (_step == 'code') ...[
              FieldLabel(
                label: tr('Баталгаажуулах код'),
                child: TextField(
                  controller: _code,
                  autofocus: true,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: 8),
                ),
              ),
              Row(children: [
                TextButton(
                  onPressed: () => setState(() {
                    _step = 'phone';
                    _error = null;
                  }),
                  child: Text(tr('Дугаар солих')),
                ),
                const Spacer(),
                TextButton(onPressed: _busy || _cooldown > 0 ? null : _sendCode, child: Text(_cooldown > 0 ? tr('Код дахин авах ({_cooldown})', {'_cooldown': _cooldown}) : tr('Код дахин авах'))),
              ]),
            ],
            if (_step == 'password') ...[
              FieldLabel(label: tr('Шинэ нууц үг'), child: PasswordField(controller: _password)),
              const SizedBox(height: 14),
              FieldLabel(label: tr('Шинэ нууц үг давтах'), child: PasswordField(controller: _confirm, onSubmitted: (_) => _submit())),
            ],
            const SizedBox(height: 14),
            FormError(_error),
            const SizedBox(height: 12),
            PrimaryButton(label: _busy ? tr('Түр хүлээнэ үү…') : label, busy: _busy, onTap: _submit),
          ]),
        ),
      ]),
    );
  }
}
