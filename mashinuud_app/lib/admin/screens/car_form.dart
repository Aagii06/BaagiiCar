import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/screens/car_view.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/select.dart';

const _maxPhotos = 12;

/// Statuses a dealer's save turns back into "pending" (backend `resubmitStatuses`).
const _resubmit = ['active', 'hidden', 'rejected'];

/// New ad (no [carId]): an admin first picks the dealer, a dealer posts for their own. With [carId]: edits it.
/// Pops `true` once saved.
class CarEditScreen extends StatefulWidget {
  final int? carId;
  const CarEditScreen({super.key, this.carId});
  @override
  State<CarEditScreen> createState() => _CarEditScreenState();
}

class _CarEditScreenState extends State<CarEditScreen> {
  final _form = GlobalKey<_CarFormState>();
  bool get _isNew => widget.carId == null;
  bool _loading = true;
  Object? _error;
  ACar? _car;
  List<PhotoItem> _photos = [];
  Dealer? _picked;
  bool _repicking = false;
  Dealer? _ownDealer;
  bool _saving = false;
  bool _dirty = false;
  bool _publishing = false;
  int _formKey = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final me = AdminApi.session.user;
      if (_isNew) {
        if (!AdminApi.session.isAdmin) {
          final dealers = await AdminApi.dealers();
          _ownDealer = dealers.where((d) => d.id == me?.dealerId).firstOrNull;
        }
      } else {
        final car = await AdminApi.car(widget.carId!);
        final files = car == null ? <CarFile>[] : await AdminApi.carFiles(car.id);
        _car = car;
        _photos = files.where((f) => f.generatedName != null).map((f) => PhotoItem.existing(f.id, uploadUrl(f.generatedName, size: 'grid'))).toList();
        _formKey++;
      }
    } catch (e) {
      _error = e;
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _publish() async {
    if (!await confirmSheet(context, title: 'Зарыг нийтлэх үү?', message: 'Нийтэлсэн зар вэб дээр харагдах боломжтой болно.', confirmLabel: 'Нийтлэх', tone: Tone.success, icon: Icons.visibility_outlined)) {
      return;
    }
    setState(() => _publishing = true);
    try {
      await AdminApi.setHidden(_car!.id, false);
      if (!mounted) return;
      toast(context, 'Нийтэллээ, вэб дээр харагдана');
      _load();
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    } finally {
      if (mounted) setState(() => _publishing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final admin = AdminApi.session.isAdmin;
    final picking = _isNew && admin && (_picked == null || _repicking);
    final dealer = admin ? _picked : _ownDealer;
    final title = picking
        ? 'Шинэ зар · дилер сонгох'
        : _isNew
            ? (dealer != null ? 'Шинэ зар · ${dealer.name}' : 'Шинэ зар')
            : (_car?.name ?? 'Зар');
    final car = _car;

    Widget body;
    if (_loading) {
      body = const PageSkeleton();
    } else if (_error != null) {
      body = ErrorView(message: errorText(_error!), onRetry: _load);
    } else if (_isNew && !admin && _ownDealer == null) {
      body = const EmptyView(title: 'Таны бүртгэл дилерт харьяалагдаагүй байна', description: 'Зар нэмэхийн тулд админд хандаж дилерт харьяалуулна уу.', icon: Icons.storefront_outlined);
    } else if (!_isNew && (car == null || car.status == 'deleted')) {
      body = const EmptyView(title: 'Зар олдсонгүй эсвэл устгагдсан');
    } else {
      body = Stack(children: [
        // Stays mounted while the admin re-picks the dealer, so nothing typed is lost.
        Offstage(
          offstage: picking,
          child: picking && _picked == null
              ? const SizedBox()
              : CarForm(
                  key: _form,
                  car: car,
                  photos: _photos,
                  dealer: dealer,
                  leadingSteps: _isNew && admin ? const ['Дилер'] : const [],
                  onBackToLead: () => setState(() => _repicking = true),
                  onBusy: (b) => setState(() => _saving = b),
                  onDirty: (d) => _dirty != d ? setState(() => _dirty = d) : null,
                  onSaved: () {
                    final resubmitted = !_isNew && !admin && _resubmit.contains(car?.status);
                    toast(context, resubmitted ? 'Хадгаллаа. Админ батлах хүртэл хүлээгдэнэ' : 'Хадгаллаа');
                    Navigator.of(context).pop(true);
                  },
                  banners: [
                    if (!admin && (car?.status == 'active' || car?.status == 'hidden'))
                      _Banner(icon: Icons.schedule_rounded, text: 'Засварыг хадгалахад зар админ дахин батлах хүртэл вэб дээр харагдахгүй.'),
                    if (car?.status == 'hidden')
                      _Banner(
                        icon: Icons.visibility_off_outlined,
                        text: 'Энэ зар нуугдсан тул вэб дээр харагдахгүй байна.',
                        action: ActionChip2(
                          label: _publishing ? 'Нийтэлж байна…' : 'Нийтлэх',
                          icon: Icons.visibility_outlined,
                          background: AppPalette.success,
                          foreground: Colors.white,
                          onTap: _publishing ? () {} : _publish,
                        ),
                      ),
                  ],
                ),
        ),
        if (picking)
          DealerPicker(
            onPick: (d) => setState(() {
              _picked = d;
              _repicking = false;
            }),
          ),
      ]);
    }

    return AdminPage(
      title: title,
      actions: [
        if (!_isNew && car != null)
          IconButton(
            tooltip: 'Зарыг харах',
            icon: const Icon(Icons.visibility_outlined),
            onPressed: () async {
              final changed = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => CarViewScreen(carId: car.id)));
              if (changed == true) _load();
            },
          ),
        if (!_isNew && car != null && car.status != 'deleted')
          BarButton(icon: Icons.save_outlined, tooltip: 'Хадгалах', busy: _saving, onTap: _dirty ? () => _form.currentState?.submit() : null),
      ],
      body: KeyedSubtree(key: ValueKey(_formKey), child: body),
    );
  }
}

class _Banner extends StatelessWidget {
  final IconData icon;
  final String text;
  final Widget? action;
  const _Banner({required this.icon, required this.text, this.action});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppPalette.amberSoft, borderRadius: BorderRadius.circular(AppRadius.lg)),
        child: Row(children: [
          Icon(icon, color: AppPalette.amberInk, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppPalette.amberInk))),
          if (action != null) ...[const SizedBox(width: 8), action!],
        ]),
      );
}

/// First step of a new ad for admins: every ad belongs to a dealer.
class DealerPicker extends StatefulWidget {
  final ValueChanged<Dealer> onPick;
  const DealerPicker({super.key, required this.onPick});
  @override
  State<DealerPicker> createState() => _DealerPickerState();
}

class _DealerPickerState extends State<DealerPicker> {
  String _q = '';
  @override
  Widget build(BuildContext context) => Loader<List<Dealer>>(
        fetch: AdminApi.dealers,
        builder: (context, dealers, _) {
          final me = AdminApi.session.user;
          final mine = dealers.where((d) => d.id == me?.dealerId).firstOrNull;
          final needle = _q.toLowerCase();
          final rows = dealers.where((d) => needle.isEmpty || d.name.toLowerCase().contains(needle) || (d.phonenumber ?? '').contains(needle)).toList();
          Widget row(Dealer d, {String? sub}) => InkWell(
                onTap: () => widget.onPick(d),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Row(children: [
                    DealerLogo(d.logo),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(d.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                        Text(sub ?? d.phonenumber ?? '', style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                      ]),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: AppPalette.mutedForeground),
                  ]),
                ),
              );
          return ListView(padding: const EdgeInsets.all(16), children: [
            const Stepper2(steps: ['Дилер', 'Мэдээлэл', 'Зураг', 'Нийтлэх'], current: 0),
            const SizedBox(height: 18),
            if (mine != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(color: AppPalette.card, borderRadius: BorderRadius.circular(AppRadius.lg), border: Border.all(color: AppPalette.primary, width: 2)),
                child: row(mine, sub: 'Миний дилер'),
              ),
              const SizedBox(height: 14),
            ],
            Section(
              title: 'Дилер сонгох',
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                TextField(decoration: const InputDecoration(hintText: 'Дилерийн нэр эсвэл утас'), onChanged: (v) => setState(() => _q = v.trim())),
                const SizedBox(height: 6),
                if (rows.isEmpty)
                  Padding(padding: const EdgeInsets.all(20), child: Text(dealers.isEmpty ? 'Идэвхтэй дилер алга' : 'Дилер олдсонгүй', textAlign: TextAlign.center, style: const TextStyle(color: AppPalette.mutedForeground)))
                else
                  for (var i = 0; i < rows.length; i++) ...[if (i > 0) const Divider(height: 1), row(rows[i])],
              ]),
            ),
          ]);
        },
      );
}


String _str(Object? v) => v == null ? '' : '$v';

/// A new ad's number: the poster's own when the dealer has it, else the dealer's first.
String _defaultPhone(Dealer? dealer, String? own) {
  final phones = dealer?.phones ?? const <String>[];
  if (own != null && phones.contains(own)) return own;
  return phones.isNotEmpty ? phones.first : (own ?? '');
}

String _norm(String? s) => (s ?? '').toLowerCase().replaceAll(RegExp(r'[\s-]+'), '');

/// Create / edit an ad. A new ad is a wizard (Мэдээлэл → Зураг → Нийтлэх); editing keeps one long form.
class CarForm extends StatefulWidget {
  final ACar? car;
  final List<PhotoItem> photos;
  final Dealer? dealer;
  final List<String> leadingSteps;
  final VoidCallback? onBackToLead;
  final VoidCallback onSaved;
  final ValueChanged<bool> onBusy;
  final ValueChanged<bool> onDirty;
  final List<Widget> banners;
  const CarForm({
    super.key,
    this.car,
    this.photos = const [],
    this.dealer,
    this.leadingSteps = const [],
    this.onBackToLead,
    required this.onSaved,
    required this.onBusy,
    required this.onDirty,
    this.banners = const [],
  });
  @override
  State<CarForm> createState() => _CarFormState();
}

class _CarFormState extends State<CarForm> {
  late Map<String, String> f;
  late bool _featured;
  late bool _leasing;
  late List<PhotoItem> _photos = List.of(widget.photos);
  late final AutoboxData? _savedAutobox = widget.car?.autobox;
  late Set<String> _locked = {...?_savedAutobox?.fields};
  ({String? plate, String? vin})? _lookup;
  int _step = 0;
  String? _error;
  bool _busy = false;
  late final String _initial;
  final _scroll = ScrollController();

  List<Brand> _brands = [];
  List<CarModel> _models = [];
  List<BodyType> _bodyTypes = [];
  List<Location> _locations = [];
  List<Dealer> _dealers = [];

  bool get _wizard => widget.car == null;
  bool get _admin => AdminApi.session.isAdmin;
  static const _formSteps = ['Мэдээлэл', 'Зураг'];
  int get _lastStep => _formSteps.length;

  @override
  void initState() {
    super.initState();
    final c = widget.car;
    final me = AdminApi.session.user;
    f = {
      'dealer_id': _str(c != null ? c.dealerId : widget.dealer?.id),
      'brand_id': _str(c?.brandId),
      'car_model_id': _str(c?.carModelId),
      'body_type_id': _str(c?.bodyTypeId),
      'location_id': _str(c?.locationId),
      'manufactured_year': _str(c?.manufacturedYear),
      'imported_year': _str(c?.importedYear),
      'price': c?.price == null ? '' : _str((num.tryParse('${c!.price}') ?? 0).round()),
      'mileage': _str(c?.mileage),
      'fuel_type': _str(c?.fuelType),
      'transmission': _str(c?.transmission),
      'drive_type': _str(c?.driveType),
      'steering': _str(c?.steering),
      'plate_type': _str(c?.plateType),
      'vehicle_type': _str(c?.vehicleType),
      'engine_capacity': c?.engineCapacity == null ? '' : _str(num.tryParse('${c!.engineCapacity}')),
      'color': _str(c?.color),
      'interior_color': _str(c?.interiorColor),
      'vin': _str(c?.vin),
      'phonenumber': c?.phonenumber ?? _defaultPhone(widget.dealer, me?.phonenumber),
      'description': _str(c?.description),
      'status': c?.status ?? 'active',
    };
    _featured = c?.isFeatured ?? false;
    _leasing = c?.isLeasing ?? false;
    _initial = _snapshot();
    _loadLists();
  }

  @override
  void didUpdateWidget(CarForm old) {
    super.didUpdateWidget(old);
    // The admin went back and picked another dealer: switch to it and to its default number.
    final d = widget.dealer;
    if (_wizard && d != null && d.id != old.dealer?.id) {
      setState(() {
        f['dealer_id'] = '${d.id}';
        f['phonenumber'] = _defaultPhone(d, AdminApi.session.user?.phonenumber);
      });
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _loadLists() async {
    try {
      final r = await Future.wait([AdminApi.brands(), AdminApi.bodyTypes(), AdminApi.locations(), AdminApi.dealers()]);
      if (!mounted) return;
      setState(() {
        _brands = r[0] as List<Brand>;
        _bodyTypes = r[1] as List<BodyType>;
        _locations = r[2] as List<Location>;
        _dealers = r[3] as List<Dealer>;
      });
      if (f['brand_id']!.isNotEmpty) _loadModels(int.parse(f['brand_id']!));
    } catch (e) {
      if (mounted) setState(() => _error = errorText(e));
    }
  }

  Future<List<CarModel>> _loadModels(int brandId) async {
    final rows = await AdminApi.models(brandId);
    if (mounted && f['brand_id'] == '$brandId') setState(() => _models = rows);
    return rows;
  }

  String _snapshot() => jsonEncode({'f': f, 'featured': _featured, 'leasing': _leasing, 'photos': _photos.map((p) => p.id ?? p.filename).toList(), 'locked': _locked.toList()..sort()});

  bool get dirty => _snapshot() != _initial;

  void _set(String k, String v) {
    setState(() => f[k] = v);
    _notifyDirty();
  }

  void _notifyDirty() => WidgetsBinding.instance.addPostFrameCallback((_) => mounted ? widget.onDirty(dirty) : null);

  bool _isLocked(String k) => _locked.contains(k);

  /// New ad: location shows / saves as Улаанбаатар until another one is picked.
  String get _locationId {
    if (f['location_id']!.isNotEmpty || !_wizard) return f['location_id']!;
    final ub = _locations.where((l) => _norm(l.name) == _norm('Улаанбаатар')).firstOrNull;
    return ub == null ? '' : '${ub.id}';
  }

  String? _detailsError() {
    if (f['brand_id']!.isEmpty) return 'Үйлдвэр сонгоно уу';
    if (f['manufactured_year']!.isEmpty) return 'Үйлдвэрлэсэн он оруулна уу';
    if (f['imported_year']!.isEmpty) return 'Орж ирсэн он оруулна уу';
    if (int.parse(f['imported_year']!) < int.parse(f['manufactured_year']!)) return 'Орж ирсэн он үйлдвэрлэсэн оноос өмнө байж болохгүй';
    if (f['price']!.isEmpty) return 'Үнэ оруулна уу';
    if (f['transmission']!.isEmpty) return 'Хурдны хайрцаг сонгоно уу';
    return null;
  }

  void _goTo(int next) {
    setState(() {
      _error = null;
      _step = next;
    });
    if (_scroll.hasClients) _scroll.animateTo(0, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
  }

  void _showError(String message) {
    setState(() => _error = message);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
    });
  }

  Future<void> submit() async {
    if (_busy || (!_wizard && !dirty)) return;
    FocusScope.of(context).unfocus();
    if (_wizard && _step < _lastStep) {
      final problem = _step == 0 ? _detailsError() : null;
      return problem != null ? _showError(problem) : _goTo(_step + 1);
    }
    if (f['dealer_id']!.isEmpty && _admin) return _showError('Дилер сонгоно уу');
    final problem = _detailsError();
    if (problem != null) {
      if (_wizard) setState(() => _step = 0);
      return _showError(problem);
    }
    // An admin publishing a new ad chooses featured / normal first.
    if (_wizard && _admin) {
      final featured = await _publishChoice();
      if (featured == null) return;
      return _save(featured);
    }
    _save(null);
  }

  Future<bool?> _publishChoice() => showModalBottomSheet<bool>(
        context: context,
        useSafeArea: true,
        backgroundColor: Colors.white,
        builder: (ctx) => Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const Text('Зарыг хэрхэн нийтлэх вэ?', textAlign: TextAlign.center, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            for (final featured in [false, true]) ...[
              Material(
                color: featured ? AppPalette.amberSoft : Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg), side: BorderSide(color: featured ? AppPalette.amber : AppPalette.border, width: 2)),
                child: InkWell(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  onTap: () => Navigator.pop(ctx, featured),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(color: featured ? AppPalette.amber : AppPalette.primarySoft, shape: BoxShape.circle),
                        child: Icon(featured ? Icons.star_rounded : Icons.campaign_outlined, color: featured ? AppPalette.dark : AppPalette.primary),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(featured ? 'Онцлох зар' : 'Энгийн зар', style: const TextStyle(fontWeight: FontWeight.w700)),
                          Text(featured ? 'Нүүр хуудсанд болон хайлтын эхэнд гарна' : 'Зарын жагсаалтад ердийнхөөрөө гарна',
                              style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                        ]),
                      ),
                    ]),
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
            SoftButton(label: 'Болих', onTap: () => Navigator.pop(ctx)),
          ]),
        ),
      );

  int? _intOrNull(String v) => v.trim().isEmpty ? null : int.tryParse(v);
  String? _orNull(String v) => v.trim().isEmpty ? null : v.trim();

  Future<void> _save(bool? featured) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    widget.onBusy(true);
    final car = widget.car;
    final input = <String, Object?>{
      if (car == null || f['dealer_id'] != _str(car.dealerId)) 'dealer_id': _intOrNull(f['dealer_id']!),
      'brand_id': int.parse(f['brand_id']!),
      'car_model_id': _intOrNull(f['car_model_id']!),
      'body_type_id': _intOrNull(f['body_type_id']!),
      'location_id': _intOrNull(_locationId),
      'manufactured_year': _intOrNull(f['manufactured_year']!),
      'imported_year': _intOrNull(f['imported_year']!),
      'price': int.tryParse(f['price']!) ?? 0,
      'mileage': _intOrNull(f['mileage']!),
      'fuel_type': _orNull(f['fuel_type']!),
      'transmission': _orNull(f['transmission']!),
      'drive_type': _orNull(f['drive_type']!),
      'steering': _orNull(f['steering']!),
      'plate_type': _orNull(f['plate_type']!),
      'is_leasing': _leasing,
      'vehicle_type': _orNull(f['vehicle_type']!),
      'engine_capacity': _orNull(f['engine_capacity']!),
      'color': _orNull(f['color']!),
      'interior_color': _orNull(f['interior_color']!),
      'vin': _orNull(f['vin']!),
      'phonenumber': _orNull(f['phonenumber']!),
      'description': _orNull(f['description']!),
      'status': f['status'],
      'is_featured': featured ?? _featured,
      if (_lookup != null && _savedAutobox == null && _locked.isNotEmpty) 'autobox_data': {'plate': _lookup!.plate, 'vin': _lookup!.vin, 'fields': _locked.toList()},
      if (car != null) 'id': car.id,
    };
    try {
      await AdminApi.saveCar(input, _photos);
      if (mounted) widget.onSaved();
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      widget.onBusy(false);
      _showError(errorText(e));
    }
  }

  Future<void> _addPhotos() async {
    final room = _maxPhotos - _photos.length;
    if (room <= 0) return;
    final files = await ImagePicker().pickMultiImage(maxWidth: 2000, imageQuality: 88, limit: room);
    if (files.isEmpty) return;
    final added = <PhotoItem>[];
    for (final x in files.take(room)) {
      final bytes = await x.readAsBytes();
      if (bytes.length > 50 * 1024 * 1024) {
        if (mounted) toast(context, '«${x.name}» зураг 50MB-аас их байна', error: true);
        continue;
      }
      added.add(PhotoItem.file(x.name, bytes));
    }
    setState(() => _photos = [..._photos, ...added]);
    _notifyDirty();
  }

  /// Fills the form from a registry lookup; only overwrites what the registry knows. Returns a note.
  String _applyLookup(Map<String, dynamic> info) {
    final brand = _brands.where((b) => _norm(b.name) == _norm(info['brand']?.toString())).firstOrNull;
    final fill = <String, String>{};
    void put(String k, Object? v, [List<String>? allowed]) {
      if (v == null || '$v'.isEmpty) return;
      if (allowed != null && !allowed.contains('$v')) return;
      fill[k] = '$v';
    }

    if (brand != null) fill['brand_id'] = '${brand.id}';
    put('manufactured_year', info['manufactured_year']);
    put('imported_year', info['imported_year']);
    put('fuel_type', info['fuel_type'], CarConst.fuelTypes);
    put('transmission', info['transmission'], CarConst.transmissions);
    put('drive_type', info['drive_type'], CarConst.driveTypes);
    put('steering', info['steering'], CarConst.steerings);
    put('vehicle_type', info['vehicle_type']);
    put('engine_capacity', info['engine_capacity']);
    put('mileage', info['mileage']);
    put('color', info['color'], CarConst.exteriorColors);
    put('vin', info['vin']);
    final lock = fill.keys.toSet();
    setState(() {
      if (brand != null && '${brand.id}' != f['brand_id']) f['car_model_id'] = '';
      f.addAll(fill);
      _locked = lock;
      _lookup = (plate: info['plate']?.toString(), vin: info['vin']?.toString());
    });
    _notifyDirty();
    if (brand != null) {
      _loadModels(brand.id).then((rows) {
        final n = _norm(info['model']?.toString());
        if (n.isEmpty || !mounted) return;
        final exact = rows.where((m) => _norm(m.name) == n).firstOrNull;
        final loose = rows.where((m) => _norm(m.name).isNotEmpty && (n.startsWith(_norm(m.name)) || _norm(m.name).startsWith(n))).toList()..sort((a, b) => b.name.length - a.name.length);
        final model = exact ?? loose.firstOrNull;
        if (model == null || f['brand_id'] != '${brand.id}') return;
        setState(() {
          f['car_model_id'] = '${model.id}';
          if (identical(_locked, lock)) _locked = {...lock, 'car_model_id'};
        });
        _notifyDirty();
      });
    }
    final name = [info['brand'], info['model'], info['manufactured_year']].where((v) => v != null && '$v'.isNotEmpty).join(' ');
    if (brand == null) return '$name олдлоо. "${info['brand'] ?? '—'}" үйлдвэр каталогид алга, гараар сонгоно уу';
    return '$name — бүртгэлийн мэдээлэл бөглөгдөж түгжигдлээ. Хурдны хайрцгийг сонгоно уу';
  }

  List<Option<String>> _opts(List<String> list, String current) => [
        for (final v in (current.isNotEmpty && !list.contains(current) ? [current, ...list] : list)) Option(v, v),
      ];

  Widget _select(String k, String label, List<Option<String>> options, {bool enabled = true, String? hint}) => FieldLabel(
        label: label,
        hint: hint,
        child: AdminSelect<String>(
          title: label.replaceAll(' *', ''),
          value: f[k]!.isEmpty ? null : f[k],
          options: [const Option<String>(null, 'Сонгох'), ...options],
          enabled: enabled && !_isLocked(k),
          onChanged: (v) => _set(k, v ?? ''),
        ),
      );

  Widget _chips(String k, String label, List<String> options) => FieldLabel(
        label: label,
        child: Wrap(spacing: 8, runSpacing: 8, children: [
          for (final o in options)
            ChoiceChip(
              label: Text(o),
              selected: f[k] == o,
              showCheckmark: false,
              onSelected: _isLocked(k) ? null : (_) => _set(k, f[k] == o ? '' : o),
              labelStyle: TextStyle(fontWeight: FontWeight.w600, color: f[k] == o ? Colors.white : AppPalette.foreground),
              selectedColor: AppPalette.foreground,
              backgroundColor: Colors.white,
              disabledColor: f[k] == o ? AppPalette.foreground : AppPalette.muted,
              side: BorderSide(color: f[k] == o ? AppPalette.foreground : AppPalette.border, width: 1.5),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            ),
        ]),
      );

  Widget _digits(String k, String label, {String? hint, String? placeholder, bool decimal = false}) => FieldLabel(
        label: label,
        hint: hint,
        child: TextFormField(
          initialValue: f[k],
          key: ValueKey('$k|${_isLocked(k)}|${_isLocked(k) ? f[k] : ''}'),
          enabled: !_isLocked(k),
          keyboardType: decimal ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.number,
          inputFormatters: [decimal ? FilteringTextInputFormatter.allow(RegExp(r'[\d.]')) : FilteringTextInputFormatter.digitsOnly],
          decoration: InputDecoration(hintText: placeholder),
          onChanged: (v) => _set(k, v),
        ),
      );

  List<Option<String>> _years(String current) {
    final now = DateTime.now().year;
    final years = [for (var y = now; y >= 1950; y--) '$y'];
    return _opts(years, current);
  }

  @override
  Widget build(BuildContext context) {
    bool show(int n) => !_wizard || _step == n;
    final adDealer = _dealers.where((d) => '${d.id}' == f['dealer_id']).firstOrNull ?? (widget.dealer != null && '${widget.dealer!.id}' == f['dealer_id'] ? widget.dealer : null);
    final steps = [...widget.leadingSteps, ..._formSteps, _admin ? 'Нийтлэх' : 'Илгээх'];
    final gap = const SizedBox(height: 14);

    return ListView(controller: _scroll, padding: const EdgeInsets.fromLTRB(16, 16, 16, 40), children: [
      if (_wizard) ...[
        Stepper2(
          steps: steps,
          current: widget.leadingSteps.length + _step,
          onTap: (i) => i < widget.leadingSteps.length ? widget.onBackToLead?.call() : _goTo(i - widget.leadingSteps.length),
        ),
        const SizedBox(height: 18),
      ],
      for (final b in widget.banners) ...[b, gap],
      if (widget.car != null && widget.car!.status == 'rejected' && widget.car!.rejectReason != null) ...[RejectNote(reason: widget.car!.rejectReason!), gap],
      if (show(0)) ...[
        if (_savedAutobox != null)
          Section(
            child: Row(children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: AppPalette.successSoft, borderRadius: BorderRadius.circular(AppRadius.md)),
                child: const Icon(Icons.verified_user_outlined, color: AppPalette.success),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Бүртгэлээс татсан${_savedAutobox.plate != null ? ' · ${_savedAutobox.plate}' : ''}', style: const TextStyle(fontWeight: FontWeight.w700)),
                  const Text('Бүртгэлийн мэдээллийг засах боломжгүй', style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                ]),
              ),
            ]),
          )
        else
          _PlateLookup(onFound: _applyLookup),
        gap,
      ],
      if (!_wizard && _admin) ...[_dealerSection(), gap],
      if (show(1)) ...[_photosSection(), gap],
      if (show(0)) ...[
        Section(
          title: 'Үндсэн мэдээлэл',
          child: Column(children: [
            FieldLabel(
              label: 'Үйлдвэр *',
              child: AdminSelect<String>(
                title: 'Үйлдвэр',
                value: f['brand_id']!.isEmpty ? null : f['brand_id'],
                options: [const Option<String>(null, 'Сонгох'), for (final b in _brands) Option('${b.id}', b.name)],
                enabled: !_isLocked('brand_id'),
                searchable: true,
                onChanged: (v) {
                  setState(() {
                    f['brand_id'] = v ?? '';
                    f['car_model_id'] = '';
                    _models = [];
                  });
                  if (v != null) _loadModels(int.parse(v));
                  _notifyDirty();
                },
              ),
            ),
            gap,
            _select('car_model_id', 'Загвар', [for (final m in _models) Option('${m.id}', m.name)], enabled: f['brand_id']!.isNotEmpty),
            gap,
            Row(children: [
              Expanded(child: _select('manufactured_year', 'Үйлдвэрлэсэн он *', _years(f['manufactured_year']!))),
              const SizedBox(width: 10),
              Expanded(child: _select('imported_year', 'Орж ирсэн он *', _years(f['imported_year']!))),
            ]),
            gap,
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                child: FieldLabel(
                  label: 'Байршил',
                  child: AdminSelect<String>(
                    title: 'Байршил',
                    value: _locationId.isEmpty ? null : _locationId,
                    options: [const Option<String>(null, 'Сонгох'), for (final l in _locations) Option('${l.id}', l.name)],
                    onChanged: (v) => _set('location_id', v ?? ''),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(child: _digits('mileage', 'Гүйлт (км)', placeholder: 'Гүйлт')),
            ]),
            gap,
            _select('plate_type', 'Улсын дугаар', _opts(CarConst.plateTypes, f['plate_type']!)),
            gap,
            _digits('price', 'Үнэ (₮) *', placeholder: 'Үнэ', hint: f['price']!.isEmpty ? null : priceHint(f['price']!)),
          ]),
        ),
        gap,
        Section(
          title: 'Техникийн үзүүлэлт',
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            _chips('fuel_type', 'Түлш', CarConst.fuelTypes),
            const SizedBox(height: 18),
            _chips('transmission', 'Хурдны хайрцаг *', CarConst.transmissions),
            const SizedBox(height: 18),
            _chips('drive_type', 'Хөтлөгч', CarConst.driveTypes),
            const SizedBox(height: 18),
            _chips('steering', 'Хүрд', CarConst.steerings),
            const SizedBox(height: 18),
            Row(children: [Expanded(child: _digits('engine_capacity', 'Хөдөлгүүр (л)', placeholder: 'Багтаамж', decimal: true)), const Expanded(child: SizedBox())]),
          ]),
        ),
        gap,
        Section(
          title: 'Бусад мэдээлэл',
          child: Column(children: [
            _select('body_type_id', 'Төрөл', [for (final b in _bodyTypes) Option('${b.id}', b.name)]),
            gap,
            _select('vehicle_type', 'Зориулалт', _opts(CarConst.vehicleTypes, f['vehicle_type']!), hint: 'Бүртгэлээс бөглөгдөнө'),
            gap,
            Row(children: [
              Expanded(child: _select('color', 'Гадна өнгө', _opts(CarConst.exteriorColors, f['color']!))),
              const SizedBox(width: 10),
              Expanded(child: _select('interior_color', 'Дотор өнгө', _opts(CarConst.interiorColors, f['interior_color']!))),
            ]),
            gap,
            SwitchRow(
              label: 'Лизинг боломжтой эсэх',
              value: _leasing,
              onChanged: (v) {
                setState(() => _leasing = v);
                _notifyDirty();
              },
            ),
          ]),
        ),
        gap,
      ],
      if (show(_lastStep)) ...[
        Section(
          title: 'Тайлбар, холбоо барих',
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            FieldLabel(
              label: 'Тайлбар',
              child: TextFormField(
                initialValue: f['description'],
                minLines: 5,
                maxLines: 12,
                maxLength: 5000,
                decoration: const InputDecoration(hintText: 'Машины байдал, засвар үйлчилгээ, нэмэлт тоноглол…', counterText: ''),
                onChanged: (v) => _set('description', v),
              ),
            ),
            gap,
            _PhonePicker(dealer: adDealer, current: widget.car?.phonenumber, value: f['phonenumber']!, onChanged: (v) => _set('phonenumber', v)),
          ]),
        ),
        gap,
      ],
      if (_admin && !_wizard) ...[
        Section(
          title: 'Админ',
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            SwitchRow(
              label: 'Онцлох зар',
              hint: 'Нүүр хуудсанд болон хайлтын эхэнд гарна',
              value: _featured,
              onChanged: (v) {
                setState(() => _featured = v);
                _notifyDirty();
              },
            ),
            gap,
            _select('status', 'Төлөв', [
              for (final s in ['pending', 'rejected', 'active', 'sold', 'hidden']) Option(s, carStatus(s).label),
            ]),
          ]),
        ),
        gap,
      ],
      FormError(_error),
      const SizedBox(height: 12),
      if (_wizard)
        Row(children: [
          if (_step > 0 || (widget.leadingSteps.isNotEmpty && widget.onBackToLead != null)) ...[
            SizedBox(
              width: 110,
              child: SoftButton(label: 'Буцах', icon: Icons.chevron_left_rounded, background: AppPalette.card, onTap: () => _step > 0 ? _goTo(_step - 1) : widget.onBackToLead?.call()),
            ),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: PrimaryButton(
              label: _busy
                  ? 'Хадгалж байна…'
                  : _step < _lastStep
                      ? 'Дараах'
                      : _admin
                          ? 'Зар нийтлэх'
                          : 'Батлуулахаар илгээх',
              busy: _busy,
              onTap: submit,
            ),
          ),
        ])
      else
        PrimaryButton(label: _busy ? 'Хадгалж байна…' : 'Хадгалах', busy: _busy, onTap: dirty ? submit : null),
    ]);
  }

  Widget _dealerSection() {
    final car = widget.car;
    final editable = _admin && car?.sellerRole != Roles.dealer;
    final dealer = _dealers.where((d) => '${d.id}' == f['dealer_id']).firstOrNull;
    final current = car?.dealerId != null && f['dealer_id'] == '${car!.dealerId}' && dealer == null;
    final name = dealer?.name ?? (current ? car.dealerName : null);
    return Section(
      title: 'Дилер',
      child: Row(children: [
        if (dealer != null || current) DealerLogo(dealer?.logo ?? car!.dealerLogo, size: 48) else const _IconBox(Icons.storefront_outlined),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            if (editable)
              AdminSelect<String>(
                title: 'Дилер',
                value: f['dealer_id']!.isEmpty ? null : f['dealer_id'],
                searchable: true,
                placeholder: '-- Сонгох --',
                options: [
                  if (current) Option(f['dealer_id'], '${car.dealerName ?? '#${car.dealerId}'} (одоогийн)'),
                  for (final d in _dealers) Option('${d.id}', d.phonenumber != null ? '${d.name} · ${d.phonenumber}' : d.name),
                ],
                onChanged: (v) {
                  if (v == null) return;
                  setState(() {
                    f['dealer_id'] = v;
                    f['phonenumber'] = _defaultPhone(_dealers.where((d) => '${d.id}' == v).firstOrNull, AdminApi.session.user?.phonenumber);
                  });
                  _notifyDirty();
                },
              )
            else
              Text(name ?? '—', style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(
              '${editable ? 'Зар энэ дилерийн хуудсанд харагдана' : car?.sellerRole == Roles.dealer ? 'Дилер өөрөө оруулсан тул солих боломжгүй' : 'Таны дилерийн нэр дээр нийтлэгдэнэ'}'
              '${car != null ? ' · Оруулсан: ${car.sellerName ?? car.sellerPhone ?? '—'}' : ''}',
              style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground),
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _photosSection() => Section(
        title: 'Зураг',
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            children: [
              for (var i = 0; i < _photos.length; i++)
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  child: Stack(fit: StackFit.expand, children: [
                    GestureDetector(
                      onTap: () => openPhotoViewer(context, _photos.map(_imageOf).toList(), i),
                      child: _imageOf(_photos[i]),
                    ),
                    if (i == 0)
                      Positioned(
                        left: 6,
                        bottom: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: AppPalette.dark, borderRadius: BorderRadius.circular(6)),
                          child: const Text('Нүүр', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                        ),
                      ),
                    Positioned(
                      right: 4,
                      top: 4,
                      child: GestureDetector(
                        onTap: () {
                          setState(() => _photos = [..._photos]..removeAt(i));
                          _notifyDirty();
                        },
                        child: Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(color: AppPalette.dark.withValues(alpha: 0.8), shape: BoxShape.circle),
                          child: const Icon(Icons.close_rounded, size: 15, color: Colors.white),
                        ),
                      ),
                    ),
                  ]),
                ),
              if (_photos.length < _maxPhotos)
                InkWell(
                  onTap: _addPhotos,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  child: Container(
                    decoration: BoxDecoration(border: Border.all(color: AppPalette.input, width: 2), borderRadius: BorderRadius.circular(AppRadius.md)),
                    child: const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.add_photo_alternate_outlined, color: AppPalette.mutedForeground),
                      SizedBox(height: 4),
                      Text('Зураг нэмэх', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppPalette.mutedForeground)),
                    ]),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          const Text('JPG, PNG, WEBP · $_maxPhotos хүртэл зураг. Эхний зураг нүүр зураг болно.', style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
        ]),
      );

  Widget _imageOf(PhotoItem p) => p.bytes != null ? Image.memory(p.bytes!, fit: BoxFit.cover) : NetImage(p.url);
}

class _IconBox extends StatelessWidget {
  final IconData icon;
  const _IconBox(this.icon);
  @override
  Widget build(BuildContext context) => Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(color: AppPalette.primarySoft, borderRadius: BorderRadius.circular(AppRadius.md)),
        child: Icon(icon, color: AppPalette.primary),
      );
}

/// The admin's note on a returned ad.
class RejectNote extends StatelessWidget {
  final String reason;
  const RejectNote({super.key, required this.reason});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppPalette.destructiveSoft,
          border: Border.all(color: AppPalette.destructive.withValues(alpha: 0.2)),
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [
            Icon(Icons.undo_rounded, size: 16, color: AppPalette.destructive),
            SizedBox(width: 6),
            Text('Буцаасан шалтгаан', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppPalette.destructive)),
          ]),
          const SizedBox(height: 4),
          Text(reason, style: const TextStyle(fontSize: 14)),
          const SizedBox(height: 6),
          const Text('Эзэн нь засаад хадгалахад дахин батлуулахаар илгээгдэнэ.', style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
        ]),
      );
}

/// Registry search by plate or chassis number; the result fills the form.
class _PlateLookup extends StatefulWidget {
  final String Function(Map<String, dynamic> info) onFound;
  const _PlateLookup({required this.onFound});
  @override
  State<_PlateLookup> createState() => _PlateLookupState();
}

class _PlateLookupState extends State<_PlateLookup> {
  String _type = 'plate';
  final _c = TextEditingController();
  bool _busy = false;
  ({bool ok, String text})? _note;

  static final _checks = {'plate': RegExp(r'^\d{4}[А-ЯЁӨҮ]{3}$'), 'vin': RegExp(r'^[A-HJ-NPR-Z0-9-]{6,17}$')};

  String get _q => _c.text.replaceAll(RegExp(r'\s+'), '').toUpperCase();
  bool get _valid => _checks[_type]!.hasMatch(_q);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    if (!_valid || _busy) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _note = null;
    });
    try {
      final info = await AdminApi.vehicleLookup(_type, _q);
      if (mounted) setState(() => _note = (ok: true, text: widget.onFound(info)));
    } catch (e) {
      if (mounted) setState(() => _note = (ok: false, text: errorText(e)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final error = _type == 'plate' ? 'Улсын дугаарын формат буруу байна (жш: 1234 УБА)' : 'Арлын дугаарын формат буруу байна';
    return Section(
      title: 'Машины мэдээлэл хайх',
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Text('Бүртгэлээс үйлдвэр, загвар, он, хөдөлгүүр, гүйлт зэргийг автоматаар бөглөнө', style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
        const SizedBox(height: 10),
        Container(
          height: 50,
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: AppPalette.input), borderRadius: BorderRadius.circular(AppRadius.md)),
          clipBehavior: Clip.antiAlias,
          child: Row(children: [
            InkWell(
              onTap: () async {
                final picked = await pickOption<String>(context, title: 'Хайх төрөл', options: const [Option('plate', 'Улсын дугаар'), Option('vin', 'Арлын дугаар')], selected: _type);
                if (picked?.value != null) {
                  setState(() {
                    _type = picked!.value!;
                    _note = null;
                  });
                }
              },
              child: Container(
                color: AppPalette.primarySoft,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                alignment: Alignment.center,
                child: Row(children: [
                  Text(_type == 'plate' ? 'Улсын' : 'Арлын', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppPalette.primary)),
                  const Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: AppPalette.primary),
                ]),
              ),
            ),
            Expanded(
              child: TextField(
                controller: _c,
                textCapitalization: TextCapitalization.characters,
                maxLength: 20,
                style: const TextStyle(fontWeight: FontWeight.w600, letterSpacing: 0.5),
                decoration: InputDecoration(
                  hintText: _type == 'plate' ? 'Улсын дугаар' : 'Арлын дугаар',
                  counterText: '',
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  filled: false,
                ),
                onChanged: (_) => setState(() => _note = null),
                onSubmitted: (_) => _search(),
              ),
            ),
            Material(
              color: _valid ? AppPalette.primary : AppPalette.primary.withValues(alpha: 0.5),
              child: InkWell(
                onTap: _valid && !_busy ? _search : null,
                child: SizedBox(
                  width: 54,
                  child: Center(
                    child: _busy
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.search_rounded, color: Colors.white),
                  ),
                ),
              ),
            ),
          ]),
        ),
        if (_note == null && _q.isNotEmpty && !_valid) Padding(padding: const EdgeInsets.only(top: 6), child: Text(error, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppPalette.destructive))),
        if (_note != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(_note!.text, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _note!.ok ? AppPalette.success : AppPalette.destructive)),
          ),
      ]),
    );
  }
}

/// The ad's contact number, picked from its dealer's numbers (typed in when the dealer has none).
class _PhonePicker extends StatelessWidget {
  final Dealer? dealer;
  final String? current;
  final String value;
  final ValueChanged<String> onChanged;
  const _PhonePicker({required this.dealer, required this.current, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final phones = dealer?.phones ?? const <String>[];
    final extra = current != null && phones.isNotEmpty && !phones.contains(current) ? current : null;
    final options = [...phones, ?extra];
    if (options.isEmpty) {
      return FieldLabel(label: 'Холбогдох утас', hint: 'Худалдан авагч энэ дугаар руу залгана', child: PhoneField(initial: value, onChanged: onChanged));
    }
    return FieldLabel(
      label: 'Холбогдох утас',
      hint: 'Дилерийн бүртгэлтэй дугааруудаас сонгоно. Худалдан авагч энэ дугаар руу залгана',
      child: Container(
        decoration: BoxDecoration(border: Border.all(color: AppPalette.input), borderRadius: BorderRadius.circular(AppRadius.md)),
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          for (var i = 0; i < options.length; i++) ...[
            if (i > 0) const Divider(height: 1),
            InkWell(
              onTap: () => onChanged(options[i]),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Row(children: [
                  Icon(value == options[i] ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded, color: value == options[i] ? AppPalette.primary : AppPalette.input),
                  const SizedBox(width: 10),
                  Expanded(child: Text(options[i], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600))),
                  if (options[i] == extra) const Text('одоогийн', style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                ]),
              ),
            ),
          ],
        ]),
      ),
    );
  }
}
