import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/select.dart';

const _pageSize = 10;

/// One editable field of a catalog row.
class _FieldDef {
  final String key;
  final String label;

  /// 'text' | 'number' | 'brand' | 'image'
  final String type;
  final bool required;
  final String? placeholder;
  final String? folder;
  const _FieldDef(this.key, this.label, {this.type = 'text', this.required = false, this.placeholder, this.folder});
}

class _TabDef {
  final String value;
  final String label;
  final String unit;

  /// Backend table (`/api/base/:target`).
  final String target;
  final List<_FieldDef> fields;
  const _TabDef(this.value, this.label, this.unit, this.target, this.fields);
}

const _tabs = [
  _TabDef('brands', 'Үйлдвэр', 'үйлдвэр', 'brands', [
    _FieldDef('name', 'Нэр', required: true, placeholder: 'Үйлдвэрийн нэр'),
    _FieldDef('country', 'Улс', placeholder: 'Улсын нэр'),
    _FieldDef('logo', 'Лого', type: 'image', folder: 'brands'),
    _FieldDef('sort_order', 'Эрэмбэ', type: 'number'),
  ]),
  _TabDef('models', 'Загвар', 'загвар', 'carModels', [
    _FieldDef('brand_id', 'Үйлдвэр', type: 'brand', required: true),
    _FieldDef('name', 'Нэр', required: true, placeholder: 'Загварын нэр'),
  ]),
  _TabDef('bodyTypes', 'Төрөл', 'төрөл', 'bodyTypes', [
    _FieldDef('name', 'Нэр', required: true, placeholder: 'Төрлийн нэр'),
    _FieldDef('image', 'Дүрс', type: 'image', folder: 'bodyTypes'),
    _FieldDef('sort_order', 'Эрэмбэ', type: 'number'),
  ]),
  _TabDef('locations', 'Байршил', 'байршил', 'locations', [
    _FieldDef('name', 'Нэр', required: true, placeholder: 'Байршлын нэр'),
    _FieldDef('sort_order', 'Эрэмбэ', type: 'number'),
  ]),
];

class _Row {
  final int id;
  final String name;
  final String? subtitle;

  /// Shown when the tab has pictures (null = none uploaded).
  final String? image;
  final bool hasImage;
  final Map<String, dynamic> values;
  const _Row(this.id, this.name, this.values, {this.subtitle, this.image, this.hasImage = false});
}

/// Каталог: brands, models, body types and locations; brands and models are fetched page by page.
class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});
  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  _TabDef _tab = _tabs.first;
  String _q = '';
  int _take = _pageSize;
  int _reload = 0;
  int _searchKey = 0;
  List<Brand> _brands = [];


  Future<({List<_Row> rows, int count})> _fetch() async {
    switch (_tab.value) {
      case 'brands':
        final p = await AdminApi.brandsPage(search: _q, take: _take);
        return (rows: p.rows.map(_brandRow).toList(), count: p.count);
      case 'models':
        if (_brands.isEmpty) _brands = await AdminApi.brands();
        final q = _q.toLowerCase();
        final ids = q.isEmpty ? <int>[] : _brands.where((b) => b.name.toLowerCase().contains(q)).map((b) => b.id).toList();
        final names = {for (final b in _brands) b.id: b.name};
        final p = await AdminApi.modelsPage(search: _q, brandIds: ids, take: _take);
        return (rows: p.rows.map((m) => _Row(m.id, m.name, m.j, subtitle: names[m.brandId] ?? '—')).toList(), count: p.count);
      case 'bodyTypes':
        final all = (await AdminApi.bodyTypes())
            .map((b) => _Row(b.id, b.name, b.j, subtitle: b.carCount != null ? '${b.carCount} зар' : null, image: catalogImage(b.image, 'bodyTypes'), hasImage: true))
            .toList();
        return _local(all);
      default:
        return _local((await AdminApi.locations()).map((l) => _Row(l.id, l.name, l.j)).toList());
    }
  }

  ({List<_Row> rows, int count}) _local(List<_Row> all) {
    final q = _q.toLowerCase();
    final rows = q.isEmpty ? all : all.where((r) => '${r.name} ${r.subtitle ?? ''}'.toLowerCase().contains(q)).toList();
    return (rows: rows.take(_take).toList(), count: rows.length);
  }

  _Row _brandRow(Brand b) => _Row(b.id, b.name, b.j,
      subtitle: [b.country, if (b.carCount != null) '${b.carCount} зар'].whereType<String>().join(' · '), image: catalogImage(b.logo, 'brands'), hasImage: true);

  Future<void> _edit(_Row? row) async {
    if (_tab.value == 'models' && _brands.isEmpty) {
      try {
        _brands = await AdminApi.brands();
      } catch (_) {}
    }
    if (!mounted) return;
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.white,
      builder: (_) => _Editor(tab: _tab, row: row, brands: _brands),
    );
    if (saved == true && mounted) setState(() => _reload++);
  }

  Future<void> _remove(_Row row) async {
    if (!await confirmSheet(context, title: '"${row.name}" устгах уу?', confirmLabel: 'Устгах', tone: Tone.danger, icon: Icons.delete_outline_rounded)) return;
    try {
      await AdminApi.deleteRows(_tab.target, [row.id]);
      if (!mounted) return;
      toast(context, 'Устгалаа');
      setState(() => _reload++);
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) => AdminPage(
        title: 'Каталог',
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: ActionChip2(label: 'Нэмэх', icon: Icons.add_rounded, background: AppPalette.primary, foreground: Colors.white, onTap: () => _edit(null)),
          ),
        ],
        body: Column(children: [
          FilterBar(children: [
            ChipTabs<String>(
              items: [for (final t in _tabs) ChipTab(t.value, t.label)],
              isOn: (v) => v == _tab.value,
              onTap: (v) => setState(() {
                _tab = _tabs.firstWhere((t) => t.value == v);
                _q = '';
                _take = _pageSize;
                _searchKey++;
              }),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SearchBox(
                key: ValueKey(_searchKey),
                hint: 'Хайх',
                onSearch: (v) => setState(() {
                  _q = v;
                  _take = _pageSize;
                }),
              ),
            ),
          ]),
          Expanded(
            child: Loader<({List<_Row> rows, int count})>(
              key: ValueKey(_tab.value),
              fetchKey: '$_q|$_take|$_reload',
              fetch: _fetch,
              loading: const Padding(padding: EdgeInsets.all(16), child: RowsSkeleton(count: 6)),
              builder: (context, page, refreshing) {
                if (page.rows.isEmpty) return const EmptyView(title: 'Бичлэг алга', icon: Icons.library_books_outlined);
                final more = page.rows.length < page.count;
                return ListView(padding: const EdgeInsets.only(bottom: 40), children: [
                  CountLine('${page.count} ${_tab.unit}'),
                  RowList(children: [for (final r in page.rows) _row(r)]),
                  if (more)
                    refreshing
                        ? const Padding(padding: EdgeInsets.all(20), child: Center(child: CircularProgressIndicator(strokeWidth: 2.4, color: AppPalette.primary)))
                        : LoadMore(key: ValueKey('${_tab.value}|$_q|$_take'), onMore: () => setState(() => _take += _pageSize)),
                ]);
              },
            ),
          ),
        ]),
      );

  Widget _row(_Row r) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 6, 10),
        child: Row(children: [
          if (r.hasImage) ...[
            Container(
              width: 40,
              height: 40,
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: AppPalette.muted, borderRadius: BorderRadius.circular(AppRadius.md)),
              child: NetImage(r.image, fit: BoxFit.contain, background: AppPalette.muted),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(r.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
              if (r.subtitle != null && r.subtitle!.isNotEmpty) Text(r.subtitle!, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
            ]),
          ),
          IconButton(tooltip: 'Засах', icon: const Icon(Icons.edit_outlined, size: 18), onPressed: () => _edit(r)),
          IconButton(tooltip: 'Устгах', icon: const Icon(Icons.delete_outline_rounded, size: 19, color: AppPalette.destructive), onPressed: () => _remove(r)),
        ]),
      );
}

class _Editor extends StatefulWidget {
  final _TabDef tab;
  final _Row? row;
  final List<Brand> brands;
  const _Editor({required this.tab, required this.row, required this.brands});
  @override
  State<_Editor> createState() => _EditorState();
}

class _EditorState extends State<_Editor> {
  late final Map<String, String> _values = {for (final f in widget.tab.fields) f.key: widget.row?.values[f.key] == null ? '' : '${widget.row!.values[f.key]}'};
  late final Map<String, String> _initial = Map.of(_values);
  String? _error;
  bool _busy = false;

  bool get _dirty => _values.entries.any((e) => _initial[e.key] != e.value);

  Future<void> _submit() async {
    if (_busy || !_dirty) return;
    final body = <String, Object?>{};
    for (final f in widget.tab.fields) {
      final v = _values[f.key]!.trim();
      if (f.required && v.isEmpty) return setState(() => _error = '${f.label} оруулна уу');
      body[f.key] = f.type == 'number' || f.type == 'brand' ? (v.isEmpty ? null : int.tryParse(v)) : (v.isEmpty ? null : v);
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (widget.row != null) {
        await AdminApi.updateRow(widget.tab.target, widget.row!.id, body);
      } else {
        await AdminApi.createRow(widget.tab.target, body);
      }
      if (!mounted) return;
      toast(context, widget.row != null ? 'Хадгаллаа' : 'Нэмлээ');
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = errorText(e);
          _busy = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(widget.row != null ? 'Засах' : 'Нэмэх', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 14),
          for (final f in widget.tab.fields) ...[
            FieldLabel(
              label: f.label + (f.required ? ' *' : ''),
              child: switch (f.type) {
                'brand' => AdminSelect<String>(
                    title: 'Үйлдвэр',
                    value: _values[f.key]!.isEmpty ? null : _values[f.key],
                    searchable: true,
                    options: [for (final b in widget.brands) Option('${b.id}', b.name)],
                    onChanged: (v) => setState(() => _values[f.key] = v ?? ''),
                  ),
                'image' => ImageUploadField(value: _values[f.key]!, folder: f.folder!, label: 'Зураг оруулах', onChanged: (v) => setState(() => _values[f.key] = v)),
                _ => TextFormField(
                    initialValue: _values[f.key],
                    keyboardType: f.type == 'number' ? TextInputType.number : TextInputType.text,
                    inputFormatters: f.type == 'number' ? [FilteringTextInputFormatter.digitsOnly] : null,
                    decoration: InputDecoration(hintText: f.placeholder),
                    onChanged: (v) => setState(() => _values[f.key] = v),
                  ),
              },
            ),
            const SizedBox(height: 14),
          ],
          FormError(_error),
          const SizedBox(height: 12),
          PrimaryButton(label: _busy ? 'Хадгалж байна…' : 'Хадгалах', busy: _busy, onTap: _dirty ? _submit : null),
        ]),
      );
}
