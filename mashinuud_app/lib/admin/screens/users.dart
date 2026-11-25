import 'package:flutter/material.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/shell.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/select.dart';
import 'package:mashinuud_app/app/i18n.dart';
import 'package:mashinuud_app/widgets/phone_input.dart';

/// Admin & Dealer accounts; the last tab lists blocked ones.
class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});
  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  String _q = '';
  String _role = '';
  int _reload = 0;

  Future<void> _open(int? id) async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => UserFormScreen(userId: id)));
    if (mounted) setState(() => _reload++);
  }

  @override
  Widget build(BuildContext context) {
    final blocked = _role == 'blocked';
    return AdminPage(
      title: 'Admin & Dealer',
      actions: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: ActionChip2(label: tr('Нэмэх'), icon: Icons.add_rounded, background: AppPalette.primary, foreground: Colors.white, onTap: () => _open(null)),
        ),
      ],
      body: Column(children: [
        FilterBar(children: [
          Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: SearchBox(hint: tr('Нэр эсвэл утас'), onSearch: (v) => setState(() => _q = v))),
          ChipTabs<String>(
            items: [ChipTab('', tr('Бүгд')), for (final r in Roles.list) ChipTab(r, Roles.label(r)), ChipTab('blocked', tr('Блоклогдсон'))],
            isOn: (v) => v == _role,
            onTap: (v) => setState(() => _role = v),
          ),
        ]),
        Expanded(
          child: Loader<ListPage<AUser>>(
            fetchKey: '$_q|$_role|$_reload',
            fetch: () => AdminApi.users(search: _q, excludeId: AdminApi.session.user?.id, role: blocked || _role.isEmpty ? null : _role, status: blocked ? 'blocked' : null),
            loading: const Padding(padding: EdgeInsets.all(16), child: RowsSkeleton(count: 6)),
            builder: (context, page, _) {
              if (page.rows.isEmpty) return EmptyView(title: tr('Хэрэглэгч олдсонгүй'), icon: Icons.person_outline_rounded);
              return ListView(padding: const EdgeInsets.only(bottom: 40), children: [
                RowList(children: [
                  for (final u in page.rows)
                    InkWell(
                      onTap: () => _open(u.id),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Row(children: [
                          UserAvatar(u),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(u.fullName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
                              Text([u.phonenumber, u.email].whereType<String>().join(' · '), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                            ]),
                          ),
                          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                            Badge2(Roles.label(u.role), background: u.isAdmin ? AppPalette.dark : AppPalette.amber, foreground: u.isAdmin ? Colors.white : AppPalette.dark),
                            if (u.status != 'active')
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(u.status == 'blocked' ? tr('Блоклогдсон') : tr('Идэвхгүй'), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppPalette.destructive)),
                              ),
                          ]),
                        ]),
                      ),
                    ),
                ]),
              ]);
            },
          ),
        ),
      ]),
    );
  }
}

/// Create (no [userId]) / edit an admin or dealer account.
class UserFormScreen extends StatefulWidget {
  final int? userId;
  const UserFormScreen({super.key, this.userId});
  @override
  State<UserFormScreen> createState() => _UserFormScreenState();
}

class _UserFormScreenState extends State<UserFormScreen> {
  bool _loading = true;
  Object? _loadError;
  AUser? _user;
  final _last = TextEditingController();
  final _first = TextEditingController();
  final _phone = PhoneController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String _role = Roles.dealer;
  String _status = 'active';
  String _profile = '';
  int? _dealerId;
  String _initial = '';
  List<Dealer> _dealers = [];
  String? _error;
  bool _busy = false;
  bool _removing = false;

  bool get _isNew => widget.userId == null;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in [_last, _first, _phone, _email, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final r = await Future.wait([AdminApi.dealers(), if (!_isNew) AdminApi.user(widget.userId!)]);
      _dealers = r[0] as List<Dealer>;
      if (!_isNew) {
        final u = r[1] as AUser?;
        _user = u;
        if (u != null) {
          _last.text = u.lastname ?? '';
          _first.text = u.firstname ?? '';
          _phone.text = u.phonenumber ?? '';
          _email.text = u.email ?? '';
          _role = u.role ?? Roles.dealer;
          _status = u.status;
          _profile = u.profile ?? '';
          _dealerId = u.dealerId;
        }
      }
      _initial = _snapshot();
    } catch (e) {
      _loadError = e;
    }
    if (mounted) setState(() => _loading = false);
  }

  String _snapshot() => [_last.text, _first.text, _phone.text, _email.text, _role, _status, _profile, _dealerId, _password.text, _confirm.text].join('\u0000');
  bool get _dirty => _snapshot() != _initial;

  Future<void> _submit() async {
    if (_busy || !_dirty) return;
    if (_password.text != _confirm.text) return setState(() => _error = tr('Нууц үгийн давталт таарахгүй байна'));
    if (_isNew && _password.text.length < 6) return setState(() => _error = tr('Нууц үг хамгийн багадаа 6 тэмдэгт байна'));
    if (_role == Roles.dealer && _dealerId == null) return setState(() => _error = tr('Дилер эрхтэй хэрэглэгчид дилер сонгоно уу'));
    setState(() {
      _busy = true;
      _error = null;
    });
    String? orNull(String v) => v.trim().isEmpty ? null : v.trim();
    final profile = <String, Object?>{
      'lastname': orNull(_last.text),
      'firstname': orNull(_first.text),
      'phonenumber': _phone.text,
      'email': orNull(_email.text),
      'role': _role,
      'status': _status,
      'profile': _profile.isEmpty ? null : _profile,
      'dealer_id': _dealerId,
    };
    try {
      if (_user != null) {
        await AdminApi.updateRow('users', _user!.id, profile);
        if (_password.text.isNotEmpty) await AdminApi.changePassword(_user!.id, _password.text, _confirm.text);
      } else {
        await AdminApi.createUser({...profile, 'password': _password.text, 'password_confirm': _confirm.text});
      }
      if (!mounted) return;
      toast(context, tr('Хадгаллаа'));
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

  Future<void> _remove() async {
    final u = _user!;
    if (!await confirmSheet(context, title: tr('Хэрэглэгчийг устгах уу?'), message: tr('{fullName} — түүний идэвхтэй зарууд мөн устгагдана.', {'fullName': u.fullName}), confirmLabel: tr('Устгах'), tone: Tone.danger, icon: Icons.delete_outline_rounded)) {
      return;
    }
    setState(() => _removing = true);
    try {
      await AdminApi.deleteRows('users', [u.id]);
      if (!mounted) return;
      toast(context, tr('Устгалаа'));
      Navigator.of(context).pop();
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    } finally {
      if (mounted) setState(() => _removing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final u = _user;
    final gone = !_isNew && !_loading && _loadError == null && (u == null || u.status == 'deleted');
    final isMe = u != null && u.id == AdminApi.session.user?.id;
    // A registered non-admin isn't made an admin here: delete it and register the number again as admin.
    final lockedOutOfAdmin = u != null && u.role != Roles.admin;
    const gap = SizedBox(height: 14);
    String? phoneHint;
    if (u != null && u.role != Roles.admin && u.phoneVerifiedAt == null) {
      phoneHint = u.status == 'blocked'
          ? tr('Утсаа баталгаажуулаагүй · Төлөвийг идэвхтэй болговол дахин 7 хоног өгнө')
          : tr('Утсаа баталгаажуулаагүй') + (u.phoneVerifyDeadline != null ? ' · ${tr('{date}-д бүртгэл блоклогдоно', {'date': u.phoneVerifyDeadline!.substring(0, 16)})}' : '');
    }
    final dealerKnown = _dealerId == null || _dealers.any((d) => d.id == _dealerId);

    return AdminPage(
      title: _isNew ? tr('Шинэ админ, дилер') : (u?.fullName ?? 'Admin & Dealer'),
      actions: [if (!_loading && _loadError == null && !gone) BarButton(icon: Icons.save_outlined, tooltip: tr('Хадгалах'), busy: _busy, onTap: _dirty ? _submit : null)],
      body: _loading
          ? const PageSkeleton()
          : _loadError != null
              ? ErrorView(message: errorText(_loadError!), onRetry: _load)
              : gone
                  ? EmptyView(title: tr('Хэрэглэгч олдсонгүй'), icon: Icons.person_outline_rounded)
                  : ListView(padding: const EdgeInsets.all(16), children: [
                      Section(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                          ImageUploadField(value: _profile, folder: 'users', label: tr('Зураг оруулах'), hint: tr('Дөрвөлжин зураг хамгийн сайн харагдана'), round: true, onChanged: (v) => setState(() => _profile = v)),
                          gap,
                          Row(children: [
                            Expanded(child: FieldLabel(label: tr('Овог'), child: TextField(controller: _last, onChanged: (_) => setState(() {})))),
                            const SizedBox(width: 10),
                            Expanded(child: FieldLabel(label: tr('Нэр'), child: TextField(controller: _first, onChanged: (_) => setState(() {})))),
                          ]),
                          gap,
                          FieldLabel(
                            label: tr('Утасны дугаар *'),
                            hint: phoneHint,
                            child: PhoneField(
                              controller: _phone,
                              onChanged: (_) => setState(() {}),
                              suffix: u?.phoneVerifiedAt != null && _phone.text == u!.phonenumber ? const Icon(Icons.verified_rounded, color: AppPalette.success, size: 20) : null,
                            ),
                          ),
                          gap,
                          FieldLabel(label: tr('И-мэйл'), child: TextField(controller: _email, keyboardType: TextInputType.emailAddress, autocorrect: false, onChanged: (_) => setState(() {}))),
                          gap,
                          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Expanded(
                              child: FieldLabel(
                                label: tr('Эрх'),
                                hint: lockedOutOfAdmin ? tr('Админ болгохдоо устгаад дахин админаар бүртгэнэ') : null,
                                child: AdminSelect<String>(
                                  title: tr('Эрх'),
                                  value: _role,
                                  enabled: !isMe,
                                  options: [for (final r in Roles.list) if (!(lockedOutOfAdmin && r == Roles.admin)) Option(r, Roles.label(r))],
                                  onChanged: (v) => setState(() => _role = v ?? _role),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: FieldLabel(
                                label: tr('Төлөв'),
                                child: AdminSelect<String>(
                                  title: tr('Төлөв'),
                                  value: _status,
                                  enabled: !isMe,
                                  options: [Option('active', tr('Идэвхтэй')), Option('inactive', tr('Идэвхгүй')), if (u?.status == 'blocked') Option('blocked', tr('Блоклогдсон'))],
                                  onChanged: (v) => setState(() => _status = v ?? _status),
                                ),
                              ),
                            ),
                          ]),
                          gap,
                          FieldLabel(
                            label: _role == Roles.dealer ? tr('Дилер *') : tr('Дилер'),
                            hint: _role == Roles.dealer ? tr('Энэ хэрэглэгчийн оруулсан зар уг дилерт харьяалагдана') : tr('Админ аль дилерийнх болох'),
                            child: AdminSelect<int>(
                              title: tr('Дилер'),
                              value: _dealerId,
                              placeholder: tr('-- Сонгох --'),
                              searchable: true,
                              options: [
                                Option<int>(null, tr('-- Сонгох --')),
                                if (!dealerKnown) Option(_dealerId, tr('#{_dealerId} (идэвхгүй)', {'_dealerId': _dealerId})),
                                for (final d in _dealers) Option(d.id, d.name),
                              ],
                              onChanged: (v) => setState(() => _dealerId = v),
                            ),
                          ),
                        ]),
                      ),
                      gap,
                      Section(
                        title: u != null ? tr('Нууц үг солих') : tr('Нууц үг *'),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                          FieldLabel(label: tr('Нууц үг'), hint: u != null ? tr('Хоосон орхивол өөрчлөгдөхгүй') : null, child: PasswordField(controller: _password, onChanged: (_) => setState(() {}))),
                          gap,
                          FieldLabel(label: tr('Нууц үг давтах'), child: PasswordField(controller: _confirm, onChanged: (_) => setState(() {}))),
                        ]),
                      ),
                      gap,
                      FormError(_error),
                      const SizedBox(height: 12),
                      PrimaryButton(label: _busy ? tr('Хадгалж байна…') : tr('Хадгалах'), busy: _busy, onTap: _dirty ? _submit : null),
                      if (u != null) ...[
                        const SizedBox(height: 10),
                        Row(children: [
                          Expanded(
                            child: SoftButton(
                              label: tr('Зарууд'),
                              background: AppPalette.card,
                              onTap: () {
                                adminNav.openCars();
                                Navigator.of(context).popUntil((r) => r.isFirst);
                              },
                            ),
                          ),
                          if (!isMe) ...[
                            const SizedBox(width: 8),
                            Expanded(child: SoftButton(label: _removing ? tr('Устгаж байна…') : tr('Устгах'), background: AppPalette.destructiveSoft, color: AppPalette.destructive, onTap: _removing ? null : _remove)),
                          ],
                        ]),
                      ],
                    ]),
    );
  }
}
