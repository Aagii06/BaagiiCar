import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/screens/cars.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/select.dart';

/// Dealer registry: showrooms that ads and admin / dealer users belong to.
class DealersScreen extends StatefulWidget {
  const DealersScreen({super.key});
  @override
  State<DealersScreen> createState() => _DealersScreenState();
}

class _DealersScreenState extends State<DealersScreen> {
  String _q = '';
  int _reload = 0;

  Future<void> _open(Widget page) async {
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
    if (mounted) setState(() => _reload++);
  }

  @override
  Widget build(BuildContext context) => AdminPage(
        title: 'Дилерүүд',
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: ActionChip2(label: 'Бүртгэх', icon: Icons.add_rounded, background: AppPalette.primary, foreground: Colors.white, onTap: () => _open(const DealerFormScreen())),
          ),
        ],
        body: Column(children: [
          FilterBar(children: [
            Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: SearchBox(hint: 'Дилерийн нэр эсвэл утас', onSearch: (v) => setState(() => _q = v))),
          ]),
          Expanded(
            child: Loader<ListPage<Dealer>>(
              fetchKey: '$_q|$_reload',
              fetch: () => AdminApi.dealersList(_q),
              loading: const Padding(padding: EdgeInsets.all(16), child: RowsSkeleton(count: 6)),
              builder: (context, page, _) {
                if (page.rows.isEmpty) return EmptyView(title: _q.isNotEmpty ? 'Дилер олдсонгүй' : 'Бүртгэлтэй дилер алга', icon: Icons.storefront_outlined);
                return ListView(padding: const EdgeInsets.only(bottom: 40), children: [
                  RowList(children: [
                    for (final d in page.rows)
                      InkWell(
                        onTap: () => _open(DealerFormScreen(dealerId: d.id)),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 10, 12, 10),
                          child: Row(children: [
                            DealerLogo(d.logo, size: 40),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(d.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
                                Text([d.phonenumber, d.address].whereType<String>().join(' · '), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                              ]),
                            ),
                            if (d.status != 'active') const Padding(padding: EdgeInsets.only(right: 8), child: Text('Идэвхгүй', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppPalette.destructive))),
                            // Nothing to show for a dealer without ads.
                            Opacity(
                              opacity: d.carCount == 0 ? 0.4 : 1,
                              child: Material(
                                color: AppPalette.muted,
                                borderRadius: BorderRadius.circular(AppRadius.sm),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(AppRadius.sm),
                                  onTap: d.carCount == 0 ? null : () => _open(DealerCarsScreen(dealer: d)),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    child: Row(children: [
                                      const Text('Зарууд', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                                      if (d.carCount != null) ...[
                                        const SizedBox(width: 4),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6),
                                          decoration: BoxDecoration(color: AppPalette.primary, borderRadius: BorderRadius.circular(99)),
                                          child: Text('${d.carCount}', style: const TextStyle(fontSize: 10, height: 1.6, fontWeight: FontWeight.w700, color: Colors.white)),
                                        ),
                                      ],
                                      const Icon(Icons.chevron_right_rounded, size: 16),
                                    ]),
                                  ),
                                ),
                              ),
                            ),
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

final _phoneRe = RegExp(r'^[5-9]\d{7}$');
final _emailRe = RegExp(r'^[^\s@]+@(?!.*\.\.)[^\s@.][^\s@]*\.[a-z]{2,}$', caseSensitive: false);
const _maxContacts = 5;

/// How each of the dealer's lists (phones, emails, addresses) is titled, limited and checked.
class _ListCfg {
  final String field;
  final String title;
  final String hint;
  final String addLabel;
  final String empty;
  final int? max;
  final bool lower;
  final String? Function(String value)? rowError;
  final String duplicate;
  const _ListCfg(this.field, this.title, this.hint, this.addLabel, this.empty, this.duplicate, {this.max, this.lower = false, this.rowError});

  /// First problem with the cleaned values, or null.
  String? check(List<String> items) {
    for (final v in items) {
      final e = rowError?.call(v);
      if (e != null) return e;
    }
    return items.toSet().length != items.length ? duplicate : null;
  }
}

final _lists = [
  _ListCfg('phonenumbers', 'Утасны дугаар', 'Зар оруулахдаа эдгээрээс нэгийг сонгоно ($_maxContacts хүртэл)', 'Дугаар нэмэх', 'Дугаар нэмээгүй байна', 'Ижил дугаар давхардсан байна',
      max: _maxContacts, rowError: (v) => _phoneRe.hasMatch(v.trim()) ? null : 'Утасны дугаар 5–9-өөр эхэлсэн 8 оронтой тоо байна'),
  _ListCfg('emails', 'И-мэйл', '$_maxContacts хүртэл', 'И-мэйл нэмэх', 'И-мэйл нэмээгүй байна', 'Ижил и-мэйл давхардсан байна',
      max: _maxContacts, lower: true, rowError: (v) => _emailRe.hasMatch(v.trim()) ? null : 'И-мэйл формат буруу байна'),
  const _ListCfg('addresses', 'Хаяг, салбар', 'Салбар бүрийн хаягийг аймаг, сум, багаас сонгож нэмнэ', 'Хаяг нэмэх', 'Хаяг нэмээгүй байна', 'Ижил хаяг давхардсан байна'),
];

/// Create (no [dealerId]) / edit a dealer.
class DealerFormScreen extends StatefulWidget {
  final int? dealerId;
  const DealerFormScreen({super.key, this.dealerId});
  @override
  State<DealerFormScreen> createState() => _DealerFormScreenState();
}

class _DealerFormScreenState extends State<DealerFormScreen> {
  bool _loading = true;
  Object? _loadError;
  Dealer? _dealer;
  final _name = TextEditingController();
  final _description = TextEditingController();
  String _logo = '';
  String _status = 'active';
  Map<String, List<String>> _items = {'phonenumbers': [], 'emails': [], 'addresses': []};
  String _saved = '';
  String? _error;
  bool _busy = false;
  bool _removing = false;

  bool get _isNew => widget.dealerId == null;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      if (!_isNew) {
        final d = await AdminApi.dealer(widget.dealerId!);
        _dealer = d;
        if (d != null) {
          _name.text = d.name;
          _description.text = d.description ?? '';
          _logo = d.logo ?? '';
          _status = d.status == 'inactive' ? 'inactive' : 'active';
          _items = {for (final c in _lists) c.field: d.list(c.field)};
        }
      }
      _saved = _snapshot();
    } catch (e) {
      _loadError = e;
    }
    if (mounted) setState(() => _loading = false);
  }

  String _snapshot() => jsonEncode({'name': _name.text, 'description': _description.text, 'logo': _logo, 'status': _status, 'items': _items});
  bool get _dirty => _snapshot() != _saved;

  Map<String, Object?> _body(Map<String, List<String>> items) => {
        'name': _name.text.trim(),
        'logo': _logo.isEmpty ? null : _logo,
        ...items,
        'description': _description.text.trim().isEmpty ? null : _description.text.trim(),
        'status': _status,
      };

  /// The sheet's save: an existing dealer is saved right away, a new one keeps it until "Бүртгэх".
  Future<void> _saveList(String field, List<String> values) async {
    final next = {..._items, field: values};
    if (_dealer != null) {
      if (_name.text.trim().isEmpty) throw 'Дилерийн нэр оруулна уу';
      await AdminApi.updateRow('dealers', _dealer!.id, _body(next));
      if (!mounted) return;
      toast(context, 'Хадгаллаа');
    }
    setState(() {
      _items = next;
      if (_dealer != null) _saved = _snapshot();
    });
  }

  Future<void> _editList(_ListCfg cfg) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.white,
      builder: (_) => _ListSheet(cfg: cfg, items: _items[cfg.field]!, onSave: (v) => _saveList(cfg.field, v)),
    );
  }

  Future<void> _makeMain(String field, int index) async {
    final items = _items[field]!;
    try {
      await _saveList(field, [items[index], ...[for (var i = 0; i < items.length; i++) if (i != index) items[i]]]);
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    }
  }

  Future<void> _submit() async {
    if (_busy || !_dirty) return;
    if (_name.text.trim().isEmpty) return setState(() => _error = 'Дилерийн нэр оруулна уу');
    for (final c in _lists) {
      final problem = c.check(_items[c.field]!);
      if (problem != null) return setState(() => _error = problem);
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (_dealer != null) {
        await AdminApi.updateRow('dealers', _dealer!.id, _body(_items));
      } else {
        await AdminApi.createRow('dealers', _body(_items));
      }
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
    final d = _dealer!;
    if (!await confirmSheet(context, title: 'Дилерийг устгах уу?', message: '${d.name} — вэб дээр харагдахаа болино. Зарууд нь устгагдахгүй.', confirmLabel: 'Устгах', tone: Tone.danger, icon: Icons.delete_outline_rounded)) {
      return;
    }
    setState(() => _removing = true);
    try {
      await AdminApi.deleteRows('dealers', [d.id]);
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
    final gone = !_isNew && !_loading && _loadError == null && (_dealer == null || _dealer!.status == 'deleted');
    final formShown = !_loading && _loadError == null && !gone;
    const gap = SizedBox(height: 14);
    return AdminPage(
      title: _isNew ? 'Шинэ дилер' : (_dealer?.name ?? 'Дилер'),
      actions: [if (formShown) BarButton(icon: Icons.save_outlined, tooltip: _isNew ? 'Бүртгэх' : 'Хадгалах', busy: _busy, onTap: _dirty ? _submit : null)],
      body: _loading
          ? const PageSkeleton()
          : _loadError != null
              ? ErrorView(message: errorText(_loadError!), onRetry: _load)
              : gone
                  ? const EmptyView(title: 'Дилер олдсонгүй', icon: Icons.storefront_outlined)
                  : ListView(padding: const EdgeInsets.all(16), children: [
                      Section(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                          FieldLabel(label: 'Нэр *', child: TextField(controller: _name, decoration: const InputDecoration(hintText: 'Дилерийн нэр'), onChanged: (_) => setState(() {}))),
                          gap,
                          FieldLabel(
                            label: 'Лого',
                            child: ImageUploadField(value: _logo, folder: 'dealers', label: 'Лого оруулах', hint: 'Дөрвөлжин, тунгалаг дэвсгэртэй зураг хамгийн сайн харагдана', onChanged: (v) => setState(() => _logo = v)),
                          ),
                          gap,
                          FieldLabel(
                            label: 'Төлөв',
                            child: AdminSelect<String>(
                              title: 'Төлөв',
                              value: _status,
                              options: const [Option('active', 'Идэвхтэй'), Option('inactive', 'Идэвхгүй')],
                              onChanged: (v) => setState(() => _status = v ?? _status),
                            ),
                          ),
                          gap,
                          FieldLabel(label: 'Тайлбар', child: TextField(controller: _description, minLines: 4, maxLines: 8, maxLength: 2000, decoration: const InputDecoration(counterText: ''), onChanged: (_) => setState(() {}))),
                        ]),
                      ),
                      for (final c in _lists) ...[gap, _listSection(c)],
                      gap,
                      FormError(_error),
                      if (_dealer != null) ...[
                        gap,
                        Row(children: [
                          Expanded(child: SoftButton(label: 'Зарууд', background: AppPalette.card, onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => DealerCarsScreen(dealer: _dealer!))))),
                          const SizedBox(width: 8),
                          Expanded(child: SoftButton(label: _removing ? 'Устгаж байна…' : 'Устгах', background: AppPalette.destructiveSoft, color: AppPalette.destructive, onTap: _removing ? null : _remove)),
                        ]),
                      ],
                    ]),
    );
  }

  Widget _listSection(_ListCfg c) {
    final items = _items[c.field]!;
    final several = items.length > 1;
    return Section(
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              Text(c.hint, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
            ]),
          ),
          const SizedBox(width: 8),
          ActionChip2(
            label: items.isEmpty ? 'Нэмэх' : 'Засах',
            icon: items.isEmpty ? Icons.add_rounded : Icons.edit_outlined,
            background: AppPalette.primarySoft,
            foreground: AppPalette.primary,
            onTap: () => _editList(c),
          ),
        ]),
        const SizedBox(height: 12),
        if (items.isEmpty)
          Text(c.empty, style: const TextStyle(fontSize: 14, color: AppPalette.mutedForeground))
        else
          for (var i = 0; i < items.length; i++)
            Container(
              margin: const EdgeInsets.only(bottom: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(color: several && i == 0 ? AppPalette.primarySoft : AppPalette.muted.withValues(alpha: 0.6), borderRadius: BorderRadius.circular(AppRadius.md)),
              child: Row(children: [
                if (several && i == 0) const Padding(padding: EdgeInsets.only(right: 8), child: Icon(Icons.star_rounded, size: 18, color: AppPalette.primary)),
                Expanded(
                  child: Text(items[i], style: TextStyle(fontWeight: several && i == 0 ? FontWeight.w700 : FontWeight.w500, color: several && i == 0 ? AppPalette.primary : AppPalette.foreground.withValues(alpha: 0.8))),
                ),
                if (several && i == 0) const Badge2('Үндсэн', background: AppPalette.primary, foreground: Colors.white),
                if (several && i > 0)
                  InkWell(
                    onTap: () => _makeMain(c.field, i),
                    borderRadius: BorderRadius.circular(8),
                    child: const Tooltip(message: 'Үндсэн болгох', child: Padding(padding: EdgeInsets.all(4), child: Icon(Icons.star_border_rounded, size: 20, color: AppPalette.mutedForeground))),
                  ),
              ]),
            ),
      ]),
    );
  }
}

/// Sheet for one of the dealer's lists: add rows, reorder with the arrows, remove, then one "Хадгалах".
class _ListSheet extends StatefulWidget {
  final _ListCfg cfg;
  final List<String> items;
  final Future<void> Function(List<String> items) onSave;
  const _ListSheet({required this.cfg, required this.items, required this.onSave});
  @override
  State<_ListSheet> createState() => _ListSheetState();
}

class _ListSheetState extends State<_ListSheet> {
  // An empty list opens with one row ready to type in. Each row keeps a key so its field survives reordering.
  late List<({int key, String value})> _draft = [for (final v in widget.items.isEmpty ? [''] : widget.items) (key: _nextKey++, value: v)];
  static int _nextKey = 0;
  String? _error;
  bool _busy = false;

  bool get _dirty => _draft.map((r) => r.value).join('\n') != widget.items.join('\n');

  void _setValue(int i, String v) => setState(() => _draft[i] = (key: _draft[i].key, value: v));

  Future<void> _save() async {
    if (_busy || !_dirty) return;
    final clean = _draft.map((r) => widget.cfg.lower ? r.value.trim().toLowerCase() : r.value.trim()).where((v) => v.isNotEmpty).toList();
    final problem = widget.cfg.check(clean);
    if (problem != null) return setState(() => _error = problem);
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.onSave(clean);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = errorText(e);
          _busy = false;
        });
      }
    }
  }

  Widget _input(int i) {
    final row = _draft[i];
    switch (widget.cfg.field) {
      case 'phonenumbers':
        return PhoneField(key: ValueKey(row.key), initial: row.value, autofocus: row.value.isEmpty, onChanged: (v) => _setValue(i, v));
      case 'emails':
        return TextFormField(
          key: ValueKey(row.key),
          initialValue: row.value,
          autofocus: row.value.isEmpty,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          decoration: const InputDecoration(hintText: 'name@example.com'),
          onChanged: (v) => _setValue(i, v),
        );
      default:
        return _AddressPicker(key: ValueKey(row.key), value: row.value, onChanged: (v) => _setValue(i, v));
    }
  }

  @override
  Widget build(BuildContext context) {
    final cfg = widget.cfg;
    final canAdd = cfg.max == null || _draft.length < cfg.max!;
    final incomplete = _draft.any((r) => r.value.trim().isEmpty || cfg.rowError?.call(r.value) != null);
    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.9),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(cfg.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          Text('${cfg.hint}. Сумаар эрэмбэлнэ', style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
          const SizedBox(height: 14),
          Flexible(
            child: ListView(shrinkWrap: true, children: [
              for (var i = 0; i < _draft.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(children: [
                    Expanded(child: _input(i)),
                    Column(children: [
                      _arrow(Icons.keyboard_arrow_up_rounded, i == 0 ? null : () => setState(() => _draft = [..._draft]..insert(i - 1, _draft.removeAt(i)))),
                      _arrow(Icons.keyboard_arrow_down_rounded, i == _draft.length - 1 ? null : () => setState(() => _draft = [..._draft]..insert(i + 1, _draft.removeAt(i)))),
                    ]),
                    // Nothing to remove while the row is empty.
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18),
                      onPressed: _draft[i].value.trim().isEmpty ? null : () => setState(() => _draft = [..._draft]..removeAt(i)),
                    ),
                  ]),
                ),
              if (canAdd)
                // One row at a time: fill it in correctly before adding another.
                OutlinedButton.icon(
                  onPressed: incomplete ? null : () => setState(() => _draft = [..._draft, (key: _nextKey++, value: '')]),
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: Text(cfg.addLabel),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppPalette.primary,
                    minimumSize: const Size.fromHeight(46),
                    side: const BorderSide(color: AppPalette.border),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
            ]),
          ),
          const SizedBox(height: 12),
          FormError(_error),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: SoftButton(label: 'Болих', onTap: _busy ? null : () => Navigator.pop(context))),
            const SizedBox(width: 8),
            Expanded(child: PrimaryButton(label: 'Хадгалах', busy: _busy, onTap: _dirty ? _save : null)),
          ]),
        ]),
      ),
    );
  }

  Widget _arrow(IconData icon, VoidCallback? onTap) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: SizedBox(width: 32, height: 22, child: Icon(icon, size: 18, color: onTap == null ? AppPalette.input : AppPalette.mutedForeground)),
      );
}

/// An address picked from the locations tree — Аймаг/Нийслэл → Сум/Дүүрэг → Баг/Хороо — with the rest typed in.
/// Reports the address as one line, "" until the aimag and soum are picked.
class _AddressPicker extends StatefulWidget {
  final String value;
  final ValueChanged<String> onChanged;
  const _AddressPicker({super.key, required this.value, required this.onChanged});
  @override
  State<_AddressPicker> createState() => _AddressPickerState();
}

class _AddressPickerState extends State<_AddressPicker> {
  static const _sep = ', ';
  List<Location> _aimags = [], _soums = [], _bags = [];
  int? _aimagId, _soumId, _bagId;
  final _detail = TextEditingController();

  @override
  void initState() {
    super.initState();
    _parse();
  }

  @override
  void dispose() {
    _detail.dispose();
    super.dispose();
  }

  /// Reads a saved address back into the selects; one typed in before the picker lands in the detail field whole.
  Future<void> _parse() async {
    try {
      final aimags = await AdminApi.areas(null);
      final parts = widget.value.isEmpty ? <String>[] : widget.value.split(_sep);
      final aimag = aimags.where((a) => parts.isNotEmpty && a.name == parts[0]).firstOrNull;
      var soums = <Location>[], bags = <Location>[];
      Location? soum, bag;
      var rest = parts;
      if (aimag != null) {
        soums = await AdminApi.areas(aimag.id);
        soum = soums.where((s) => parts.length > 1 && s.name == parts[1]).firstOrNull;
        rest = parts.sublist(1);
        if (soum != null) {
          bags = await AdminApi.areas(soum.id);
          bag = bags.where((b) => parts.length > 2 && b.name == parts[2]).firstOrNull;
          rest = parts.sublist(bag != null ? 3 : 2);
        }
      }
      if (!mounted) return;
      setState(() {
        _aimags = aimags;
        _soums = soums;
        _bags = bags;
        _aimagId = aimag?.id;
        _soumId = soum?.id;
        _bagId = bag?.id;
        _detail.text = rest.join(_sep);
      });
    } catch (_) {
      if (mounted) _detail.text = widget.value;
    }
  }

  String? _nameOf(List<Location> list, int? id) => list.where((l) => l.id == id).firstOrNull?.name;

  void _emit() {
    final aimag = _nameOf(_aimags, _aimagId), soum = _nameOf(_soums, _soumId);
    final line = aimag != null && soum != null ? [aimag, soum, _nameOf(_bags, _bagId), _detail.text.trim()].where((p) => p != null && p.isNotEmpty).join(_sep) : '';
    widget.onChanged(line);
  }

  Future<void> _pickAimag(int? id) async {
    setState(() {
      _aimagId = id;
      _soumId = null;
      _bagId = null;
      _soums = [];
      _bags = [];
    });
    _emit();
    if (id == null) return;
    final list = await AdminApi.areas(id).catchError((_) => <Location>[]);
    if (mounted && _aimagId == id) setState(() => _soums = list);
  }

  Future<void> _pickSoum(int? id) async {
    setState(() {
      _soumId = id;
      _bagId = null;
      _bags = [];
    });
    _emit();
    if (id == null) return;
    final list = await AdminApi.areas(id).catchError((_) => <Location>[]);
    if (mounted && _soumId == id) setState(() => _bags = list);
  }

  @override
  Widget build(BuildContext context) {
    final partial = (_aimagId == null || _soumId == null) && (_aimagId != null || _detail.text.trim().isNotEmpty);
    List<Option<int>> opts(List<Location> l) => [for (final a in l) Option(a.id, a.name)];
    const gap = SizedBox(height: 8);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      AdminSelect<int>(title: 'Аймаг / Нийслэл', placeholder: 'Аймаг / Нийслэл', value: _aimagId, options: opts(_aimags), onChanged: _pickAimag),
      gap,
      AdminSelect<int>(title: 'Сум / Дүүрэг', placeholder: 'Сум / Дүүрэг', value: _soumId, enabled: _aimagId != null, options: opts(_soums), onChanged: _pickSoum),
      gap,
      AdminSelect<int>(
        title: 'Баг / Хороо',
        placeholder: 'Баг / Хороо',
        value: _bagId,
        enabled: _soumId != null && _bags.isNotEmpty,
        options: opts(_bags),
        onChanged: (v) {
          setState(() => _bagId = v);
          _emit();
        },
      ),
      gap,
      TextField(
        controller: _detail,
        minLines: 2,
        maxLines: 4,
        maxLength: 200,
        decoration: const InputDecoration(hintText: 'Дэлгэрэнгүй хаяг (байр, орц, тоот…)', counterText: ''),
        onChanged: (_) {
          setState(() {});
          _emit();
        },
      ),
      // Until it's complete the row saves as empty, i.e. is dropped.
      if (partial) const Padding(padding: EdgeInsets.only(top: 4, left: 4), child: Text('Аймаг/нийслэл, сум/дүүргээ заавал сонгоно уу', style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground))),
    ]);
  }
}
