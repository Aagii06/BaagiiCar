import 'package:flutter/material.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/screens/car_form.dart';
import 'package:mashinuud_app/admin/screens/cars.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:url_launcher/url_launcher.dart';

/// An ad's Үзүүлэлт as label / value pairs.
List<(String, String?)> carSpecs(ACar c) => [
      ('Үйлдвэрлэсэн он', c.manufacturedYear?.toString()),
      ('Орж ирсэн он', c.importedYear?.toString()),
      ('Гүйлт', c.mileage != null ? formatKm(c.mileage) : null),
      ('Хөдөлгүүр', c.engineCapacity != null ? formatEngine(c.engineCapacity) : null),
      ('Түлш', c.fuelType),
      ('Хурдны хайрцаг', c.transmission),
      ('Хүрд', c.steering),
      ('Хөтлөгч', c.driveType),
      ('Зориулалт', c.vehicleType),
      ('Гадна өнгө', c.color),
      ('Дотор өнгө', c.interiorColor),
      ('Төрөл', c.bodyTypeName),
    ];

class SpecsGrid extends StatelessWidget {
  final ACar car;
  const SpecsGrid(this.car, {super.key});
  @override
  Widget build(BuildContext context) => LayoutBuilder(
        builder: (context, box) {
          final w = (box.maxWidth - 8) / 2;
          return Wrap(spacing: 8, runSpacing: 8, children: [
            for (final (label, value) in carSpecs(car))
              Container(
                width: w,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(color: AppPalette.muted, borderRadius: BorderRadius.circular(AppRadius.md)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(label, style: const TextStyle(fontSize: 11, color: AppPalette.mutedForeground)),
                  const SizedBox(height: 2),
                  Text(value == null || value.isEmpty ? '—' : value, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                ]),
              ),
          ]);
        },
      );
}

/// Full-screen photos, swiped; pinch to zoom.
void openPhotoViewer(BuildContext context, List<Widget> photos, int start) => Navigator.of(context).push(MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => _PhotoViewer(photos: photos, start: start),
    ));

class _PhotoViewer extends StatefulWidget {
  final List<Widget> photos;
  final int start;
  const _PhotoViewer({required this.photos, required this.start});
  @override
  State<_PhotoViewer> createState() => _PhotoViewerState();
}

class _PhotoViewerState extends State<_PhotoViewer> {
  late int _i = widget.start;
  late final _pages = PageController(initialPage: widget.start);
  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
          shape: const Border(),
          title: Text('${_i + 1} / ${widget.photos.length}', style: const TextStyle(color: Colors.white)),
        ),
        body: PageView(
          controller: _pages,
          onPageChanged: (i) => setState(() => _i = i),
          children: [for (final p in widget.photos) InteractiveViewer(child: Center(child: FittedBox(fit: BoxFit.contain, child: SizedBox(width: 800, height: 600, child: p))))],
        ),
      );
}

/// Read-only preview of an ad (pending ones too). Pops true when its status changed.
class CarViewScreen extends StatefulWidget {
  final int carId;
  const CarViewScreen({super.key, required this.carId});
  @override
  State<CarViewScreen> createState() => _CarViewScreenState();
}

class _CarViewScreenState extends State<CarViewScreen> {
  int _reload = 0;
  bool _busy = false;
  bool _changed = false;

  Future<(ACar?, List<String>)> _fetch() async {
    final car = await AdminApi.car(widget.carId);
    if (car == null) return (null, <String>[]);
    final files = await AdminApi.carFiles(car.id);
    return (car, files.map((f) => f.generatedName).whereType<String>().toList());
  }

  Future<void> _run(Future<void> Function() action, String done) async {
    setState(() => _busy = true);
    try {
      await action();
      if (!mounted) return;
      toast(context, done);
      _changed = true;
      setState(() => _reload++);
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) Navigator.of(context).pop(_changed);
        },
        child: Loader<(ACar?, List<String>)>(
          fetchKey: _reload,
          fetch: _fetch,
          loading: const AdminPage(title: 'Зар', body: PageSkeleton()),
          error: (context, e, retry) => AdminPage(title: 'Зар', body: ErrorView(message: errorText(e), onRetry: retry)),
          builder: (context, data, _) {
            final (car, photos) = data;
            if (car == null) return const AdminPage(title: 'Зар', body: EmptyView(title: 'Зар олдсонгүй'));
            return AdminPage(
              title: car.name ?? 'Зар',
              actions: [
                if (car.status != 'deleted')
                  IconButton(
                    tooltip: 'Засах',
                    icon: const Icon(Icons.edit_outlined),
                    onPressed: () async {
                      final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => CarEditScreen(carId: car.id)));
                      if (saved == true) {
                        _changed = true;
                        setState(() => _reload++);
                      }
                    },
                  ),
              ],
              body: BusyOverlay(
                busy: _busy,
                child: ListView(padding: const EdgeInsets.all(16), children: [
                  _statusBanner(car),
                  if (car.status == 'rejected' && car.rejectReason != null) ...[const SizedBox(height: 12), RejectNote(reason: car.rejectReason!)],
                  const SizedBox(height: 14),
                  _gallery(car, photos),
                  const SizedBox(height: 14),
                  Section(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(car.name ?? car.title, style: displayStyle(20, height: 1.2)),
                      const SizedBox(height: 4),
                      Text([car.manufacturedYear, car.locationName].whereType<Object>().join(' · '), style: const TextStyle(fontSize: 13, color: AppPalette.mutedForeground)),
                      const SizedBox(height: 10),
                      Text(formatPrice(car.price), style: displayStyle(24, color: AppPalette.primary)),
                      const SizedBox(height: 10),
                      Wrap(spacing: 14, runSpacing: 4, children: [
                        _stat(Icons.visibility_outlined, '${car.viewCount}'),
                        _stat(Icons.phone_outlined, '${car.phoneViewCount}'),
                        _stat(Icons.favorite_border_rounded, '${car.favoriteCount}'),
                        if (car.createdAt != null) Text(timeAgo(car.createdAt), style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                      ]),
                    ]),
                  ),
                  const SizedBox(height: 14),
                  Section(
                    child: Row(children: [
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          const Text('Зарын эзэн', style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                          Text(car.dealerName ?? car.sellerName ?? '—', style: const TextStyle(fontWeight: FontWeight.w700)),
                        ]),
                      ),
                      if ((car.phonenumber ?? car.sellerPhone) != null)
                        FilledButton.icon(
                          onPressed: () => launchUrl(Uri.parse('tel:${car.phonenumber ?? car.sellerPhone}')),
                          icon: const Icon(Icons.phone_rounded, size: 16),
                          label: Text(car.phonenumber ?? car.sellerPhone!),
                          style: FilledButton.styleFrom(backgroundColor: AppPalette.dark, textStyle: const TextStyle(fontWeight: FontWeight.w700)),
                        ),
                    ]),
                  ),
                  const SizedBox(height: 14),
                  Section(title: 'Үзүүлэлт', child: SpecsGrid(car)),
                  if (car.description != null) ...[
                    const SizedBox(height: 14),
                    Section(title: 'Тайлбар', child: Text(car.description!, style: const TextStyle(fontSize: 14, height: 1.5))),
                  ],
                ]),
              ),
            );
          },
        ),
      );

  Widget _stat(IconData icon, String value) => Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: AppPalette.mutedForeground),
        const SizedBox(width: 3),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppPalette.mutedForeground)),
      ]);

  Widget _gallery(ACar car, List<String> photos) {
    if (photos.isEmpty) {
      return ClipRRect(borderRadius: BorderRadius.circular(AppRadius.lg), child: AspectRatio(aspectRatio: 4 / 3, child: NetImage(null, background: AppPalette.tintFor(car.id))));
    }
    return _Gallery(urls: photos.map((n) => uploadUrl(n, size: 'grid')!).toList(), full: photos.map((n) => uploadUrl(n)!).toList());
  }

  Widget _statusBanner(ACar car) {
    final admin = AdminApi.session.isAdmin;
    final s = car.status;
    final onWeb = s == 'active' || s == 'sold';
    final text = onWeb
        ? 'Вэб сайт дээр нийтлэгдсэн'
        : s == 'pending'
            ? 'Батлагдаагүй тул вэб дээр харагдахгүй'
            : s == 'rejected'
                ? 'Буцаасан — эзэн нь засаж дахин илгээнэ'
                : s == 'hidden'
                    ? 'Түр нуусан тул вэб дээр харагдахгүй'
                    : 'Вэб дээр харагдахгүй';
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: s == 'pending' ? AppPalette.amberSoft : AppPalette.card, borderRadius: BorderRadius.circular(AppRadius.lg)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        CarStatusBadge(s),
        const SizedBox(height: 4),
        Text(text, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: s == 'pending' ? AppPalette.amberInk : AppPalette.foreground)),
        if ((s == 'pending' && admin) || s == 'active' || s == 'hidden') ...[
          const SizedBox(height: 10),
          Wrap(spacing: 8, runSpacing: 8, children: [
            if (s == 'pending' && admin) ...[
              ActionChip2(
                label: 'Буцаах',
                icon: Icons.undo_rounded,
                background: AppPalette.destructiveSoft,
                foreground: AppPalette.destructive,
                onTap: () async {
                  final reason = await rejectReason(context);
                  if (reason != null) _run(() => AdminApi.rejectCar(car.id, reason), 'Буцаалаа');
                },
              ),
              ActionChip2(
                label: 'Батлах',
                icon: Icons.check_rounded,
                background: AppPalette.success,
                foreground: Colors.white,
                onTap: () async {
                  if (await confirmSheet(context, title: 'Зарыг батлах уу?', message: 'Батласны дараа вэб дээр нийтлэгдэнэ.', confirmLabel: 'Батлах', tone: Tone.success, icon: Icons.check_rounded)) {
                    _run(() => AdminApi.approveCar(car.id), 'Баталлаа, вэб дээр нийтлэгдлээ');
                  }
                },
              ),
            ],
            if (s == 'active')
              ActionChip2(
                label: 'Нуух',
                icon: Icons.visibility_off_outlined,
                onTap: () async {
                  if (await confirmSheet(context,
                      title: 'Зарыг түр нуух уу?',
                      message: 'Вэб дээр харагдахаа болино. Дараа нь «Нийтлэх»-ээр буцааж нийтэлж болно.',
                      confirmLabel: 'Нуух',
                      tone: Tone.amber,
                      icon: Icons.visibility_off_outlined)) {
                    _run(() => AdminApi.setHidden(car.id, true), 'Нууллаа, вэб дээр харагдахгүй');
                  }
                },
              ),
            if (s == 'hidden')
              ActionChip2(
                label: 'Нийтлэх',
                icon: Icons.visibility_outlined,
                background: AppPalette.success,
                foreground: Colors.white,
                onTap: () async {
                  if (await confirmSheet(context, title: 'Зарыг нийтлэх үү?', message: 'Нийтэлсэн зар вэб дээр харагдах боломжтой болно.', confirmLabel: 'Нийтлэх', tone: Tone.success, icon: Icons.visibility_outlined)) {
                    _run(() => AdminApi.setHidden(car.id, false), 'Нийтэллээ, вэб дээр харагдана');
                  }
                },
              ),
          ]),
        ],
      ]),
    );
  }
}

class _Gallery extends StatefulWidget {
  final List<String> urls;
  final List<String> full;
  const _Gallery({required this.urls, required this.full});
  @override
  State<_Gallery> createState() => _GalleryState();
}

class _GalleryState extends State<_Gallery> {
  int _i = 0;
  @override
  Widget build(BuildContext context) => Column(children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: AspectRatio(
            aspectRatio: 4 / 3,
            child: Stack(children: [
              PageView(
                onPageChanged: (i) => setState(() => _i = i),
                children: [
                  for (var i = 0; i < widget.urls.length; i++)
                    GestureDetector(
                      onTap: () => openPhotoViewer(context, [for (final u in widget.full) NetImage(u, fit: BoxFit.contain, background: Colors.black)], i),
                      child: NetImage(widget.urls[i], fit: BoxFit.contain),
                    ),
                ],
              ),
              Positioned(
                right: 12,
                bottom: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppPalette.dark.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(99)),
                  child: Text('${_i + 1} / ${widget.urls.length}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
              ),
            ]),
          ),
        ),
        if (widget.urls.length > 1) ...[
          const SizedBox(height: 10),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            for (var i = 0; i < widget.urls.length; i++)
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: i == _i ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(color: i == _i ? AppPalette.foreground : AppPalette.foreground.withValues(alpha: 0.25), borderRadius: BorderRadius.circular(99)),
              ),
          ]),
        ],
      ]);
}

/// Look at an ad (photos, price, specs) in a sheet without leaving the page (messages).
Future<void> carPreviewSheet(BuildContext context, ACar car) => showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.white,
      builder: (ctx) => ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(ctx).height * 0.88),
        child: Loader<List<CarFile>>(
          fetch: () => AdminApi.carFiles(car.id),
          loading: const Padding(padding: EdgeInsets.all(20), child: RowsSkeleton(count: 3)),
          builder: (ctx, files, _) {
            final names = files.map((f) => f.generatedName).whereType<String>().toList();
            return ListView(shrinkWrap: true, padding: const EdgeInsets.fromLTRB(20, 0, 20, 20), children: [
              Text(car.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Row(children: [
                Text(formatPrice(car.price), style: displayStyle(20, color: AppPalette.primary)),
                const SizedBox(width: 8),
                CarStatusBadge(car.status),
              ]),
              const SizedBox(height: 14),
              if (names.isEmpty)
                ClipRRect(borderRadius: BorderRadius.circular(AppRadius.lg), child: AspectRatio(aspectRatio: 4 / 3, child: NetImage(null, background: AppPalette.tintFor(car.id))))
              else
                _Gallery(urls: names.map((n) => uploadUrl(n, size: 'grid')!).toList(), full: names.map((n) => uploadUrl(n)!).toList()),
              const SizedBox(height: 14),
              SpecsGrid(car),
            ]);
          },
        ),
      ),
    );
