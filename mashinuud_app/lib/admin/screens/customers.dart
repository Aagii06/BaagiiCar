import 'package:flutter/material.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/select.dart';

class CustomerAvatar extends StatelessWidget {
  final Customer customer;
  final double size;
  const CustomerAvatar(this.customer, {super.key, this.size = 40});
  @override
  Widget build(BuildContext context) =>
      Avatar(url: catalogImage(customer.profile, 'users'), name: customer.displayName, size: size, background: AppPalette.muted, foreground: AppPalette.foreground);
}

/// Web visitors (`customers` table): they sign up themselves with a one-time code.
class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});
  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  String _q = '';
  String _status = '';
  int _reload = 0;

  Future<void> _remove(Customer c) async {
    if (!await confirmSheet(context, title: 'Хэрэглэгчийг устгах уу?', message: '${c.displayName} — дахин нэвтэрч чадахгүй болно.', confirmLabel: 'Устгах', tone: Tone.danger, icon: Icons.delete_outline_rounded)) {
      return;
    }
    try {
      await AdminApi.deleteRows('customers', [c.id]);
      if (!mounted) return;
      toast(context, 'Устгалаа');
      setState(() => _reload++);
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) => AdminPage(
        title: 'Хэрэглэгч',
        body: Column(children: [
          FilterBar(children: [
            Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: SearchBox(hint: 'Нэр, утас эсвэл и-мэйл', onSearch: (v) => setState(() => _q = v))),
            ChipTabs<String>(
              items: const [ChipTab('', 'Бүгд'), ChipTab('active', 'Идэвхтэй'), ChipTab('inactive', 'Идэвхгүй'), ChipTab('blocked', 'Блоклогдсон')],
              isOn: (v) => v == _status,
              onTap: (v) => setState(() => _status = v),
            ),
          ]),
          Expanded(
            child: Loader<ListPage<Customer>>(
              fetchKey: '$_q|$_status|$_reload',
              fetch: () => AdminApi.customers(search: _q, status: _status.isEmpty ? null : _status),
              loading: const Padding(padding: EdgeInsets.all(16), child: RowsSkeleton(count: 6)),
              builder: (context, page, _) {
                if (page.rows.isEmpty) return const EmptyView(title: 'Хэрэглэгч олдсонгүй', icon: Icons.people_outline_rounded);
                return ListView(padding: const EdgeInsets.only(bottom: 40), children: [
                  CountLine('${page.count} хэрэглэгч'),
                  RowList(children: [
                    for (final c in page.rows)
                      InkWell(
                        onTap: () async {
                          await Navigator.of(context).push(MaterialPageRoute(builder: (_) => CustomerFormScreen(customerId: c.id)));
                          if (mounted) setState(() => _reload++);
                        },
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 10, 6, 10),
                          child: Row(children: [
                            CustomerAvatar(c),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(c.displayName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
                                Text([c.phonenumber, c.email].whereType<String>().join(' · '), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                              ]),
                            ),
                            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                              if (c.lastLoginAt != null) Text(timeAgo(c.lastLoginAt), style: const TextStyle(fontSize: 10, color: AppPalette.mutedForeground)),
                              if (c.status != 'active')
                                Text(c.status == 'blocked' ? 'Блоклогдсон' : 'Идэвхгүй', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppPalette.destructive)),
                            ]),
                            IconButton(tooltip: 'Устгах', icon: const Icon(Icons.delete_outline_rounded, size: 19, color: AppPalette.destructive), onPressed: () => _remove(c)),
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

class CustomerFormScreen extends StatefulWidget {
  final int customerId;
  const CustomerFormScreen({super.key, required this.customerId});
  @override
  State<CustomerFormScreen> createState() => _CustomerFormScreenState();
}

class _CustomerFormScreenState extends State<CustomerFormScreen> {
  bool _loading = true;
  Object? _loadError;
  Customer? _c;
  final _last = TextEditingController();
  final _first = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  String _status = 'active';
  String _initial = '';
  String? _error;
  bool _busy = false;
  bool _removing = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in [_last, _first, _phone, _email]) {
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
      final c = await AdminApi.customer(widget.customerId);
      _c = c;
      if (c != null) {
        _last.text = c.lastname ?? '';
        _first.text = c.firstname ?? '';
        _phone.text = c.phonenumber ?? '';
        _email.text = c.email ?? '';
        _status = c.status == 'inactive' || c.status == 'blocked' ? c.status : 'active';
      }
      _initial = _snapshot();
    } catch (e) {
      _loadError = e;
    }
    if (mounted) setState(() => _loading = false);
  }

  String _snapshot() => [_last.text, _first.text, _phone.text, _email.text, _status].join('\u0000');
  bool get _dirty => _snapshot() != _initial;

  Future<void> _submit() async {
    if (_busy || !_dirty) return;
    // They sign in with one of these, so at least one has to stay.
    if (_phone.text.isEmpty && _email.text.trim().isEmpty) return setState(() => _error = 'Утас эсвэл и-мэйлийн аль нэгийг оруулна уу');
    setState(() {
      _busy = true;
      _error = null;
    });
    String? orNull(String v) => v.trim().isEmpty ? null : v.trim();
    try {
      await AdminApi.updateRow('customers', _c!.id, {
        'lastname': orNull(_last.text),
        'firstname': orNull(_first.text),
        'phonenumber': orNull(_phone.text),
        'email': orNull(_email.text),
        'status': _status,
      });
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

  Future<void> _remove() async {
    final c = _c!;
    if (!await confirmSheet(context, title: 'Хэрэглэгчийг устгах уу?', message: '${c.displayName} — дахин нэвтэрч чадахгүй болно.', confirmLabel: 'Устгах', tone: Tone.danger, icon: Icons.delete_outline_rounded)) {
      return;
    }
    setState(() => _removing = true);
    try {
      await AdminApi.deleteRows('customers', [c.id]);
      if (!mounted) return;
      toast(context, 'Устгалаа');
      Navigator.of(context).pop();
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    } finally {
      if (mounted) setState(() => _removing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _c;
    final gone = !_loading && _loadError == null && (c == null || c.status == 'deleted');
    const gap = SizedBox(height: 14);
    return AdminPage(
      title: c?.displayName ?? 'Хэрэглэгч',
      actions: [if (!_loading && _loadError == null && !gone) BarButton(icon: Icons.save_outlined, tooltip: 'Хадгалах', busy: _busy, onTap: _dirty ? _submit : null)],
      body: _loading
          ? const PageSkeleton()
          : _loadError != null
              ? ErrorView(message: errorText(_loadError!), onRetry: _load)
              : gone
                  ? const EmptyView(title: 'Хэрэглэгч олдсонгүй', icon: Icons.person_outline_rounded)
                  : ListView(padding: const EdgeInsets.all(16), children: [
                      Section(
                        child: Row(children: [
                          CustomerAvatar(c!, size: 56),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('Бүртгүүлсэн: ${c.createdAt?.substring(0, 10) ?? '—'}', style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                              Text('Сүүлд нэвтэрсэн: ${c.lastLoginAt != null ? timeAgo(c.lastLoginAt) : '—'}', style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                            ]),
                          ),
                        ]),
                      ),
                      gap,
                      Section(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                          Row(children: [
                            Expanded(child: FieldLabel(label: 'Овог', child: TextField(controller: _last, onChanged: (_) => setState(() {})))),
                            const SizedBox(width: 10),
                            Expanded(child: FieldLabel(label: 'Нэр', child: TextField(controller: _first, onChanged: (_) => setState(() {})))),
                          ]),
                          gap,
                          FieldLabel(label: 'Утасны дугаар', child: PhoneField(controller: _phone, onChanged: (_) => setState(() {}))),
                          gap,
                          FieldLabel(label: 'И-мэйл', child: TextField(controller: _email, keyboardType: TextInputType.emailAddress, autocorrect: false, onChanged: (_) => setState(() {}))),
                          gap,
                          FieldLabel(
                            label: 'Төлөв',
                            hint: 'Идэвхгүй хэрэглэгч вэб дээр нэвтэрч чадахгүй',
                            child: AdminSelect<String>(
                              title: 'Төлөв',
                              value: _status,
                              options: [const Option('active', 'Идэвхтэй'), const Option('inactive', 'Идэвхгүй'), if (c.status == 'blocked') const Option('blocked', 'Блоклогдсон')],
                              onChanged: (v) => setState(() => _status = v ?? _status),
                            ),
                          ),
                        ]),
                      ),
                      gap,
                      FormError(_error),
                      const SizedBox(height: 12),
                      PrimaryButton(label: _busy ? 'Хадгалж байна…' : 'Хадгалах', busy: _busy, onTap: _dirty ? _submit : null),
                      const SizedBox(height: 10),
                      SoftButton(label: _removing ? 'Устгаж байна…' : 'Устгах', background: AppPalette.destructiveSoft, color: AppPalette.destructive, onTap: _removing ? null : _remove),
                    ]),
    );
  }
}
