import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/lock.dart';
import 'package:mashinuud_app/admin/screens/lock_screen.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/screens/catalog.dart';
import 'package:mashinuud_app/admin/screens/customers.dart';
import 'package:mashinuud_app/admin/screens/dealers.dart';
import 'package:mashinuud_app/admin/screens/feedbacks.dart';
import 'package:mashinuud_app/admin/screens/users.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/select.dart';

/// Профайл tab: the signed-in user, the admin sections, switching to the customer side, sign-out.
class AdminProfileTab extends StatelessWidget {
  const AdminProfileTab({super.key});

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: AdminApi.session,
        builder: (context, _) {
          final user = AdminApi.session.user;
          if (user == null) return const SizedBox();
          void push(Widget page) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
          Widget iconBtn(IconData icon, String tip, Widget page) => Material(
                color: Colors.white.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: InkWell(
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  onTap: () => push(page),
                  child: Tooltip(message: tip, child: SizedBox(width: 40, height: 40, child: Icon(icon, size: 18, color: AppPalette.primary))),
                ),
              );
          final menu = [
            (Icons.library_books_outlined, 'Каталог', 'Үйлдвэр, загвар, төрөл, байршил', const Color(0xFFFEF3C7), const Color(0xFFD97706), const CatalogScreen() as Widget),
            (Icons.storefront_outlined, 'Дилерүүд', 'Авто худалдааны төвүүдийг бүртгэх, засах', const Color(0xFFE0F2FE), const Color(0xFF0284C7), const DealersScreen()),
            (Icons.admin_panel_settings_outlined, 'Admin & Dealer', 'Админ, дилерийн хэрэглэгчид', const Color(0xFFEDE9FE), const Color(0xFF7C3AED), const UsersScreen()),
            (Icons.people_outline_rounded, 'Хэрэглэгч', 'Вэбээр бүртгүүлсэн хэрэглэгчид', const Color(0xFFD1FAE5), const Color(0xFF059669), const CustomersScreen()),
            (Icons.forum_outlined, 'Санал хүсэлт', 'Вэбийн “Бидэнд бичих” маягтаар ирсэн захидал', const Color(0xFFFFE4E6), const Color(0xFFE11D48), const FeedbacksScreen()),
          ];
          return ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 100), children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppPalette.primarySoft, Color(0xFFFFF7ED), Color(0xFFFEF3C7)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: const Color(0xFFFED7AA)),
              ),
              child: Row(children: [
                UserAvatar(user, size: 48),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(user.firstname ?? user.fullName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text('${user.phonenumber ?? ''} · ${Roles.label(user.role)}', style: const TextStyle(fontSize: 13, color: AppPalette.mutedForeground)),
                  ]),
                ),
                iconBtn(Icons.edit_outlined, 'Профайл засах', const ProfileEditScreen()),
                const SizedBox(width: 8),
                iconBtn(Icons.key_outlined, 'Нууц үг солих', const ChangePasswordScreen()),
              ]),
            ),
            if (user.isAdmin) ...[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.lg),
                child: Container(
                  color: AppPalette.card,
                  child: Column(children: [
                    for (var i = 0; i < menu.length; i++) ...[
                      if (i > 0) const Divider(height: 1),
                      InkWell(
                        onTap: () => push(menu[i].$6),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          child: Row(children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(color: menu[i].$4, borderRadius: BorderRadius.circular(AppRadius.lg)),
                              child: Icon(menu[i].$1, size: 20, color: menu[i].$5),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(menu[i].$2, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                                Text(menu[i].$3, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: AppPalette.mutedForeground)),
                              ]),
                            ),
                            const Icon(Icons.chevron_right_rounded, color: AppPalette.mutedForeground),
                          ]),
                        ),
                      ),
                    ],
                  ]),
                ),
              ),
            ],
            const SizedBox(height: 16),
            const _LockSettings(),
            const SizedBox(height: 16),
            _action('Хэрэглэгч рүү шилжих', Icons.swap_horiz_rounded, AppPalette.foreground, () => Stores.mode.setAdmin(false)),
            const SizedBox(height: 8),
            _action('Гарах', Icons.logout_rounded, AppPalette.destructive, () {
              AdminApi.session.signOut();
            }),
          ]);
        },
      );

  Widget _action(String label, IconData icon, Color color, VoidCallback onTap) => Material(
        color: AppPalette.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
            child: Row(children: [Expanded(child: Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: color))), Icon(icon, size: 18, color: color)]),
          ),
        ),
      );
}

/// "Апп түгжих": a 4-digit PIN asked when entering the admin half and after the chosen time in the background.
class _LockSettings extends StatelessWidget {
  const _LockSettings();

  String _label(int m) => m == 0 ? 'Шууд' : '$m минут';

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: appLock,
        builder: (context, _) {
          final on = appLock.enabled;
          Widget row(IconData icon, String label, {String? value, VoidCallback? onTap}) => InkWell(
                onTap: onTap,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(children: [
                    Icon(icon, size: 20, color: AppPalette.mutedForeground),
                    const SizedBox(width: 12),
                    Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600))),
                    if (value != null) Text(value, style: const TextStyle(color: AppPalette.mutedForeground)),
                    const Icon(Icons.chevron_right_rounded, color: AppPalette.mutedForeground),
                  ]),
                ),
              );
          return ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.lg),
            child: Container(
              color: AppPalette.card,
              child: Column(children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 6, 16, 6),
                  child: SwitchRow(
                    label: 'Апп түгжих',
                    hint: 'Админ хэсэг рүү ороход 4 оронтой PIN асууна',
                    value: on,
                    onChanged: (v) async {
                      if (v) {
                        if (await setPinSheet(context) && context.mounted) toast(context, 'PIN тохирууллаа');
                      } else if (await confirmSheet(context, title: 'Апп түгжихийг унтраах уу?', message: 'Админ хэсэг рүү ороход PIN асуухаа болино.', confirmLabel: 'Унтраах', tone: Tone.danger, icon: Icons.lock_open_rounded)) {
                        appLock.disable();
                      }
                    },
                  ),
                ),
                if (on) ...[
                  const Divider(height: 1),
                  row(Icons.timer_outlined, 'Ар талд байх хугацаа', value: _label(appLock.timeoutMinutes), onTap: () async {
                    final picked = await pickOption<int>(context,
                        title: 'Апп ар талд хэдэн минут байвал түгжих вэ?', options: [for (final m in AppLock.timeouts) Option(m, _label(m))], selected: appLock.timeoutMinutes);
                    if (picked?.value != null) appLock.setTimeout(picked!.value!);
                  }),
                  const Divider(height: 1),
                  row(Icons.pin_outlined, 'PIN солих', onTap: () async {
                    if (await setPinSheet(context, verifyCurrent: true) && context.mounted) toast(context, 'PIN солигдлоо');
                  }),
                ],
              ]),
            ),
          );
        },
      );
}

/// The signed-in user's own details and photo. Phone and e-mail change only through a code sent to the new one.
class ProfileEditScreen extends StatefulWidget {
  const ProfileEditScreen({super.key});
  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  late AUser me = AdminApi.session.user!;
  late final _last = TextEditingController(text: me.lastname ?? '');
  late final _first = TextEditingController(text: me.firstname ?? '');
  late final _phone = TextEditingController(text: me.phonenumber ?? '');
  late final _email = TextEditingController(text: me.email ?? '');
  late String _profile = me.profile ?? '';
  late String _verifiedPhone = me.phonenumber ?? '';
  late String _verifiedEmail = me.email ?? '';
  late bool _phoneVerified = me.phoneVerifiedAt != null;
  String? _error;
  bool _busy = false;
  bool _sending = false;
  List<Dealer> _dealers = [];

  @override
  void initState() {
    super.initState();
    if (!me.isAdmin) AdminApi.dealers().then((d) => mounted ? setState(() => _dealers = d) : null, onError: (_) {});
  }

  @override
  void dispose() {
    for (final c in [_last, _first, _phone, _email]) {
      c.dispose();
    }
    super.dispose();
  }

  String get _newEmail => _email.text.trim().toLowerCase();
  bool get _phoneChanged => _phone.text != _verifiedPhone;
  bool get _emailChanged => _newEmail != _verifiedEmail.toLowerCase();
  bool get _dirty => _last.text != (me.lastname ?? '') || _first.text != (me.firstname ?? '') || _profile != (me.profile ?? '') || _phoneChanged || _emailChanged;

  Future<void> _send(Future<void> Function() action) async {
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => _error = errorText(e));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _afterVerify(String done) async {
    await AdminApi.session.refresh();
    if (!mounted) return;
    setState(() => me = AdminApi.session.user ?? me);
    toast(context, done);
  }

  Future<void> _changePhone() => _send(() async {
        final phone = _phone.text;
        if (phone.length != 8) throw 'Утасны дугаар 8 оронтой байна';
        final wait = await AdminApi.sendPhoneChangeCode(phone);
        if (!mounted) return;
        final ok = await otpSheet(context,
            icon: Icons.smartphone_rounded,
            title: 'Утасны дугаар солих',
            target: phone,
            length: 4,
            resendIn: wait,
            resend: () => AdminApi.sendPhoneChangeCode(phone),
            verify: (code) => AdminApi.verifyPhoneChange(phone, code));
        if (!ok) return;
        setState(() {
          _verifiedPhone = phone;
          _phoneVerified = true;
        });
        await _afterVerify('Утасны дугаар солигдлоо');
      });

  Future<void> _verifyPhone() => _send(() async {
        final wait = await AdminApi.sendPhoneVerifyCode();
        if (!mounted) return;
        final ok = await otpSheet(context,
            icon: Icons.smartphone_rounded, title: 'Утас баталгаажуулах', target: _verifiedPhone, length: 4, resendIn: wait, resend: AdminApi.sendPhoneVerifyCode, verify: AdminApi.verifyPhone);
        if (!ok) return;
        setState(() => _phoneVerified = true);
        await _afterVerify('Утас баталгаажлаа');
      });

  Future<void> _changeEmail() => _send(() async {
        final email = _newEmail;
        if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) throw 'Имэйл хаяг буруу байна';
        final wait = await AdminApi.sendEmailChangeCode(email);
        if (!mounted) return;
        final ok = await otpSheet(context,
            icon: Icons.mark_email_read_outlined,
            title: 'Имэйл баталгаажуулах',
            target: email,
            length: 6,
            resendIn: wait,
            resend: () => AdminApi.sendEmailChangeCode(email),
            verify: (code) => AdminApi.verifyEmailChange(email, code));
        if (!ok) return;
        setState(() {
          _verifiedEmail = email;
          _email.text = email;
        });
        await _afterVerify('Имэйл баталгаажиж шинэчлэгдлээ');
      });

  Future<void> _submit() async {
    if (_busy || !_dirty) return;
    if (_phoneChanged) return setState(() => _error = 'Шинэ дугаараа кодоор баталгаажуулна уу');
    if (_emailChanged) return setState(() => _error = _newEmail.isNotEmpty ? 'Шинэ имэйлээ кодоор баталгаажуулна уу' : 'Имэйлийг хоосон болгох боломжгүй');
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await AdminApi.updateRow('users', me.id, {
        'lastname': _last.text.trim().isEmpty ? null : _last.text.trim(),
        'firstname': _first.text.trim().isEmpty ? null : _first.text.trim(),
        'phonenumber': _verifiedPhone,
        'profile': _profile.isEmpty ? null : _profile,
        'role': me.role,
      });
      await AdminApi.session.refresh();
      if (!mounted) return;
      toast(context, 'Хадгаллаа');
      Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = errorText(e);
          _busy = false;
        });
      }
    }
  }

  Widget _codeButton(VoidCallback onTap) => Padding(
        padding: const EdgeInsets.all(6),
        child: ActionChip2(label: _sending ? '…' : 'Код авах', background: AppPalette.primarySoft, foreground: AppPalette.primary, onTap: _sending ? () {} : onTap),
      );

  @override
  Widget build(BuildContext context) {
    const verified = Icon(Icons.verified_rounded, color: AppPalette.success, size: 20);
    final gap = const SizedBox(height: 14);
    return AdminPage(
      title: 'Профайл засах',
      actions: [BarButton(icon: Icons.save_outlined, tooltip: 'Хадгалах', busy: _busy, onTap: _dirty ? _submit : null)],
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Section(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            ImageUploadField(value: _profile, folder: 'users', label: 'Зураг оруулах', hint: 'Дөрвөлжин зураг хамгийн сайн харагдана', round: true, onChanged: (v) => setState(() => _profile = v)),
            gap,
            Row(children: [
              Expanded(child: FieldLabel(label: 'Овог', child: TextField(controller: _last, onChanged: (_) => setState(() {})))),
              const SizedBox(width: 10),
              Expanded(child: FieldLabel(label: 'Нэр', child: TextField(controller: _first, onChanged: (_) => setState(() {})))),
            ]),
            gap,
            FieldLabel(
              label: 'Утасны дугаар *',
              hint: _phoneChanged
                  ? 'Шинэ дугаар руу SMS код илгээгдэнэ'
                  : _phoneVerified
                      ? null
                      : me.phoneVerifyDeadline != null
                          ? 'Утсаа баталгаажуулна уу. ${me.phoneVerifyDeadline!.substring(0, 16)} хүртэл баталгаажуулаагүй бол бүртгэл блоклогдоно'
                          : 'Утсаа SMS кодоор баталгаажуулна уу',
              child: PhoneField(
                controller: _phone,
                onChanged: (_) => setState(() {}),
                suffix: _phoneChanged
                    ? (_phone.text.length == 8 ? _codeButton(_changePhone) : null)
                    : _phoneVerified
                        ? verified
                        : IconButton(tooltip: 'Утас баталгаажуулах', icon: const Icon(Icons.gpp_maybe_outlined, color: AppPalette.primary), onPressed: _sending ? null : _verifyPhone),
              ),
            ),
            gap,
            FieldLabel(
              label: 'И-мэйл',
              hint: _emailChanged
                  ? 'Шинэ хаяг руу баталгаажуулах код илгээгдэнэ'
                  : _verifiedEmail.isEmpty
                      ? 'Имэйл нэмэхэд баталгаажуулах код илгээгдэнэ'
                      : null,
              child: TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(suffixIcon: _emailChanged && _newEmail.isNotEmpty ? _codeButton(_changeEmail) : (!_emailChanged && _verifiedEmail.isNotEmpty ? verified : null)),
              ),
            ),
            if (!me.isAdmin) ...[
              gap,
              FieldLabel(
                label: 'Дилер',
                hint: 'Таны зарууд энэ дилерт харьяалагдана. Солихыг админаас хүснэ үү',
                child: AdminSelect<int>(
                  value: me.dealerId,
                  enabled: false,
                  placeholder: me.dealerId == null ? '-- Сонгох --' : '#${me.dealerId} (идэвхгүй)',
                  options: [for (final d in _dealers) Option(d.id, d.name)],
                  onChanged: (_) {},
                ),
              ),
            ],
            gap,
            Text('Эрх: ${Roles.label(me.role)}', style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
          ]),
        ),
        gap,
        FormError(_error),
      ]),
    );
  }
}

/// The signed-in user's password: the current one, then the new one twice; confirmed by a code e-mailed to them.
class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});
  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _submitted = false;
  bool _sending = false;
  int _shakes = 0;

  @override
  void dispose() {
    for (final c in [_current, _next, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Map<String, String> get _body => {'old_password': _current.text, 'password': _next.text, 'password_confirm': _confirm.text};

  Future<void> _submit() async {
    setState(() => _submitted = true);
    if (_current.text.isEmpty || _next.text.length < 6 || _confirm.text != _next.text) return setState(() => _shakes++);
    if (_sending) return;
    setState(() => _sending = true);
    try {
      final body = _body;
      final (wait, email) = await AdminApi.sendPasswordChangeCode(body);
      if (!mounted) return;
      toast(context, 'Код илгээлээ');
      final ok = await otpSheet(context,
          icon: Icons.key_outlined,
          title: 'Баталгаажуулах код',
          target: email ?? AdminApi.session.user?.email ?? '',
          length: 6,
          resendIn: wait,
          resend: () async => (await AdminApi.sendPasswordChangeCode(body)).$1,
          verify: (code) => AdminApi.verifyPasswordChange(body, code));
      if (ok && mounted) {
        toast(context, 'Нууц үг солигдлоо');
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        toast(context, errorText(e), error: true);
        setState(() => _shakes++);
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasEmail = AdminApi.session.user?.email != null;
    final currentError = _submitted && _current.text.isEmpty ? 'Одоогийн нууц үгээ оруулна уу' : null;
    final newError = _submitted && _next.text.length < 6 ? 'Нууц үг 6-аас дээш тэмдэгттэй байна' : null;
    final confirmError = _submitted && newError == null && _confirm.text != _next.text ? 'Нууц үг таарахгүй байна' : null;
    final dirty = _current.text.isNotEmpty || _next.text.isNotEmpty || _confirm.text.isNotEmpty;
    final gap = const SizedBox(height: 14);
    return AdminPage(
      title: 'Нууц үг солих',
      actions: [BarButton(icon: Icons.save_outlined, tooltip: 'Хадгалах', busy: _sending, onTap: hasEmail && dirty ? _submit : null)],
      body: ListView(padding: const EdgeInsets.all(16), children: [
        if (hasEmail)
          const Text('Солихын өмнө бүртгэлтэй имэйл рүү тань баталгаажуулах код илгээнэ.', style: TextStyle(fontSize: 14, color: AppPalette.mutedForeground))
        else
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppPalette.amberSoft, borderRadius: BorderRadius.circular(AppRadius.lg)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Нууц үг солихын тулд эхлээд профайлдаа имэйл хаягаа нэмнэ үү.', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppPalette.amberInk)),
              TextButton(
                onPressed: () => Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const ProfileEditScreen())),
                child: const Text('Имэйл нэмэх', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ]),
          ),
        gap,
        Opacity(
          opacity: hasEmail ? 1 : 0.6,
          child: Shake(
            trigger: _shakes,
            child: Section(
              child: Column(children: [
                FieldLabel(label: 'Одоогийн нууц үг', error: currentError, child: PasswordField(controller: _current, enabled: hasEmail, invalid: currentError != null, onChanged: (_) => setState(() {}))),
                gap,
                FieldLabel(label: 'Шинэ нууц үг', error: newError, hint: '6-аас дээш тэмдэгт', child: PasswordField(controller: _next, enabled: hasEmail, invalid: newError != null, onChanged: (_) => setState(() {}))),
                gap,
                FieldLabel(
                  label: 'Шинэ нууц үг давтах',
                  error: confirmError,
                  child: PasswordField(controller: _confirm, enabled: hasEmail, invalid: confirmError != null, onChanged: (_) => setState(() {}), onSubmitted: (_) => _submit()),
                ),
              ]),
            ),
          ),
        ),
      ]),
    );
  }
}
