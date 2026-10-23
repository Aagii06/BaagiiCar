import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mashinuud_app/api/api.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/api/models.dart';
import 'package:mashinuud_app/app/constant.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/car_chat.dart';
import 'package:mashinuud_app/screens/dealers.dart';
import 'package:mashinuud_app/screens/leasing.dart';
import 'package:mashinuud_app/widgets/car.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:url_launcher/url_launcher.dart';

/// An ad's page (website `/cars/<id>`): edge-to-edge photos, summary, specs, leasing, similar ads,
/// and an action bar in place of the tab bar.
class CarDetailScreen extends StatelessWidget {
  final int carId;

  /// List row already on screen — shown while the full ad loads.
  final Car? preview;
  const CarDetailScreen({super.key, required this.carId, this.preview});

  @override
  Widget build(BuildContext context) {
    return Loader<Car?>(
      fetch: () => Api.getCar(carId),
      loading: Scaffold(appBar: AppBar(title: const Text('Дэлгэрэнгүй')), body: const LoadingView()),
      error: (context, e, retry) => Scaffold(
        appBar: AppBar(title: const Text('Дэлгэрэнгүй')),
        body: Padding(padding: const EdgeInsets.all(16), child: ErrorView(message: '$e', onRetry: retry)),
      ),
      builder: (context, car, _) {
        if (car == null || car.status == 'deleted') {
          return Scaffold(
            appBar: AppBar(title: const Text('Дэлгэрэнгүй')),
            body: const Padding(
              padding: EdgeInsets.all(16),
              child: EmptyView(title: 'Зар олдсонгүй', description: 'Зар устгагдсан эсвэл хаяг буруу байна.'),
            ),
          );
        }
        return Scaffold(
          appBar: AppBar(title: const Text('Дэлгэрэнгүй')),
          body: ListView(
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              _Gallery(car: car),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Column(children: [
                  _Summary(car: car),
                  const SizedBox(height: 12),
                  _Specs(car: car),
                  if ((car.description ?? '').trim().isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Panel(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('Тайлбар', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 12),
                        Text(car.description!.trim(), style: TextStyle(fontSize: 15, height: 1.75, color: AppPalette.foreground.withValues(alpha: 0.8))),
                      ]),
                    ),
                  ],
                  const SizedBox(height: 12),
                  LeasingCalculator(price: toNumber(car.price), carId: car.id),
                  _Similar(car: car),
                ]),
              ),
            ],
          ),
          bottomNavigationBar: _ActionBar(car: car),
        );
      },
    );
  }
}

// --- photos -------------------------------------------------------------------

class _Gallery extends StatefulWidget {
  final Car car;
  const _Gallery({required this.car});
  @override
  State<_Gallery> createState() => _GalleryState();
}

class _GalleryState extends State<_Gallery> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final car = widget.car;
    return Loader<List<String>>(
      fetch: () => Api.getCarPhotos(car.id),
      loading: AspectRatio(aspectRatio: 4 / 3, child: Container(color: AppPalette.tintFor(car.id))),
      error: (_, _, _) => AspectRatio(aspectRatio: 4 / 3, child: NetImage(uploadUrl(car.image), background: AppPalette.tintFor(car.id))),
      builder: (context, photos, _) {
        if (photos.isEmpty) {
          return AspectRatio(aspectRatio: 4 / 3, child: NetImage(uploadUrl(car.image), background: AppPalette.tintFor(car.id), iconSize: 96));
        }
        return Column(children: [
          AspectRatio(
            aspectRatio: 4 / 3,
            child: Stack(children: [
              PageView.builder(
                itemCount: photos.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (context, i) => GestureDetector(
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(
                    fullscreenDialog: true,
                    builder: (_) => PhotoViewer(urls: [for (final p in photos) uploadUrl(p)!], start: i),
                  )),
                  child: NetImage(uploadUrl(photos[i], size: 'grid'), fit: BoxFit.contain, background: AppPalette.card),
                ),
              ),
              Positioned(
                right: 12,
                bottom: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppPalette.dark.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(99)),
                  child: Text('${_index + 1} / ${photos.length}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ),
            ]),
          ),
          if (photos.length > 1)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                for (var i = 0; i < photos.length; i++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    height: 6,
                    width: i == _index ? 20 : 6,
                    decoration: BoxDecoration(
                      color: i == _index ? AppPalette.foreground : AppPalette.foreground.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
              ]),
            ),
        ]);
      },
    );
  }
}

/// Full-screen, pinch-to-zoom photo pager.
class PhotoViewer extends StatefulWidget {
  final List<String> urls;
  final int start;
  const PhotoViewer({super.key, required this.urls, this.start = 0});
  @override
  State<PhotoViewer> createState() => _PhotoViewerState();
}

class _PhotoViewerState extends State<PhotoViewer> {
  late int _index = widget.start;
  late final _controller = PageController(initialPage: widget.start);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          surfaceTintColor: Colors.black,
          foregroundColor: Colors.white,
          shape: const Border(),
          title: Text('${_index + 1} / ${widget.urls.length}', style: const TextStyle(color: Colors.white, fontSize: 16)),
          systemOverlayStyle: SystemUiOverlayStyle.light,
        ),
        body: PageView.builder(
          controller: _controller,
          itemCount: widget.urls.length,
          onPageChanged: (i) => setState(() => _index = i),
          itemBuilder: (_, i) => InteractiveViewer(
            maxScale: 4,
            child: Center(child: NetImage(widget.urls[i], fit: BoxFit.contain, background: Colors.black)),
          ),
        ),
      );
}

// --- summary ------------------------------------------------------------------

class _Summary extends StatelessWidget {
  final Car car;
  const _Summary({required this.car});

  @override
  Widget build(BuildContext context) {
    final where = [car.locationName, timeAgo(car.createdAt)].whereType<String>().where((s) => s.isNotEmpty).join(' · ');
    return Panel(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Wrap(spacing: 8, runSpacing: 8, children: [
          if (car.sold) const Pill('Зарагдсан', background: AppPalette.dark, color: Colors.white),
          if (car.isFeatured) const Pill('Онцлох', background: AppPalette.successSoft, color: AppPalette.success),
          const Pill('Лизинг боломжтой', background: AppPalette.amberSoft, color: AppPalette.amberInk),
        ]),
        const SizedBox(height: 16),
        Text(car.titleWithYear.toUpperCase(), style: displayStyle(28, height: 1.15)),
        if (where.isNotEmpty) ...[
          const SizedBox(height: 8),
          Row(children: [
            const Icon(Icons.location_on_outlined, size: 15, color: AppPalette.primary),
            const SizedBox(width: 4),
            Expanded(child: Text(where, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppPalette.primary))),
          ]),
        ],
        const SizedBox(height: 14),
        Text(formatPrice(car.price), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700)),
        const SizedBox(height: 18),
        const Divider(height: 1),
        const SizedBox(height: 18),
        _Seller(car: car),
        const SizedBox(height: 18),
        const Divider(height: 1),
        const SizedBox(height: 16),
        Row(children: [
          const Text('Хуваалцах', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppPalette.mutedForeground)),
          const Spacer(),
          _ShareButtons(car: car),
        ]),
      ]),
    );
  }
}

class _Seller extends StatelessWidget {
  final Car car;
  const _Seller({required this.car});

  @override
  Widget build(BuildContext context) {
    final views = Text('${car.viewCount ?? 0} үзсэн', style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground));
    final dealer = car.dealerId != null && (car.dealerName ?? '').isNotEmpty;
    final avatar = Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: dealer ? Colors.white : AppPalette.primarySoft,
        shape: BoxShape.circle,
        border: dealer ? Border.all(color: AppPalette.border) : null,
      ),
      clipBehavior: Clip.antiAlias,
      alignment: Alignment.center,
      child: dealer
          ? Padding(
              padding: const EdgeInsets.all(5),
              child: NetImage(
                uploadUrl(car.dealerLogo, folder: 'dealers'),
                fit: BoxFit.contain,
                background: Colors.white,
                fallback: Text(car.dealerName![0], style: const TextStyle(fontWeight: FontWeight.w700, color: AppPalette.primary)),
              ),
            )
          : Text(initials(car.sellerName), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppPalette.primary)),
    );
    final info = Expanded(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(dealer ? car.dealerName! : ((car.sellerName ?? '').isNotEmpty ? car.sellerName! : 'Зарлагч'),
            maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
        Text(dealer ? 'Дилер' : 'Зарлагч', style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
      ]),
    );
    final row = Row(children: [avatar, const SizedBox(width: 12), info, views]);
    if (!dealer) return row;
    return InkWell(
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => DealerScreen(dealerId: car.dealerId!))),
      child: row,
    );
  }
}

class _ShareButtons extends StatelessWidget {
  final Car car;
  const _ShareButtons({required this.car});

  @override
  Widget build(BuildContext context) {
    final url = '${AppConstants.siteUrl}/cars/${car.id}';
    final u = Uri.encodeComponent(url);
    final text = Uri.encodeComponent(car.titleWithYear);
    Widget button(String tooltip, Widget icon, Color hover, VoidCallback onTap) => Padding(
          padding: const EdgeInsets.only(left: 8),
          child: Tooltip(
            message: tooltip,
            child: Material(
              color: AppPalette.card,
              shape: const CircleBorder(side: BorderSide(color: AppPalette.border)),
              clipBehavior: Clip.antiAlias,
              child: InkWell(onTap: onTap, splashColor: hover.withValues(alpha: 0.2), child: SizedBox.square(dimension: 40, child: Center(child: icon))),
            ),
          ),
        );
    void open(String link) => launchUrl(Uri.parse(link), mode: LaunchMode.externalApplication);
    return Row(mainAxisSize: MainAxisSize.min, children: [
      button('Facebook', const Text('f', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1877F2))), const Color(0xFF1877F2),
          () => open('https://www.facebook.com/sharer/sharer.php?u=$u')),
      button('X', const Text('𝕏', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)), Colors.black,
          () => open('https://twitter.com/intent/tweet?url=$u&text=$text')),
      button('Telegram', const Icon(Icons.send_rounded, size: 17, color: Color(0xFF229ED9)), const Color(0xFF229ED9),
          () => open('https://t.me/share/url?url=$u&text=$text')),
      button('Холбоос хуулах', const Icon(Icons.link_rounded, size: 18), AppPalette.foreground, () {
        Clipboard.setData(ClipboardData(text: url));
        showToast(context, 'Холбоос хуулагдлаа');
      }),
    ]);
  }
}

// --- specs, similar, actions --------------------------------------------------

class _Specs extends StatelessWidget {
  final Car car;
  const _Specs({required this.car});

  @override
  Widget build(BuildContext context) {
    final specs = <(String, String?)>[
      ('Үйлдвэрлэсэн он', car.manufacturedYear?.toString()),
      ('Орж ирсэн он', car.importedYear?.toString()),
      ('Гүйлт', car.mileage != null ? formatKm(car.mileage) : null),
      ('Хөдөлгүүр', toNumber(car.engineCapacity) != 0 ? formatEngine(car.engineCapacity) : null),
      ('Түлш', car.fuelType),
      ('Хурдны хайрцаг', car.transmission),
      ('Хүрд', car.steering),
      ('Хөтлөгч', car.driveType),
      ('Ангилал', car.vehicleType),
      ('Гадна өнгө', car.color),
      ('Дотор өнгө', car.interiorColor),
      ('Төрөл', car.bodyTypeName),
    ];
    return Panel(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Үзүүлэлт', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
        const SizedBox(height: 14),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 2.5,
          children: [
            for (final (label, value) in specs)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                decoration: BoxDecoration(color: AppPalette.muted, borderRadius: BorderRadius.circular(AppRadius.md)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppPalette.mutedForeground)),
                  const SizedBox(height: 3),
                  Text((value ?? '').isEmpty ? '—' : value!, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                ]),
              ),
          ],
        ),
      ]),
    );
  }
}

class _Similar extends StatelessWidget {
  final Car car;
  const _Similar({required this.car});

  @override
  Widget build(BuildContext context) => Loader<List<Car>>(
        fetch: () async {
          final page = await Api.searchCars(CarSearch(
            bodyTypeIds: car.bodyTypeId != null ? [car.bodyTypeId!] : const [],
            brandIds: car.bodyTypeId == null ? [car.brandId] : const [],
            pageSize: 5,
          ));
          return page.rows.where((c) => c.id != car.id).take(4).toList();
        },
        loading: const SizedBox.shrink(),
        error: (_, _, _) => const SizedBox.shrink(),
        builder: (context, cars, _) {
          if (cars.isEmpty) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(top: 40),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('ТӨСТЭЙ МАШИНУУД', style: displayStyle(24)),
              const SizedBox(height: 16),
              CarList(cars: cars),
            ]),
          );
        },
      );
}

/// Phone action bar: ♡ · ⇄ · chat · call (or a wide chat button when there is no number).
class _ActionBar extends StatelessWidget {
  final Car car;
  const _ActionBar({required this.car});

  @override
  Widget build(BuildContext context) {
    final phone = car.contactPhone;
    return Container(
      decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppPalette.border))),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(children: [
            FavoriteButton(carId: car.id, size: 48),
            const SizedBox(width: 8),
            CompareButton(carId: car.id, size: 48),
            const SizedBox(width: 8),
            if (phone != null && phone.isNotEmpty) ...[
              ChatButton(car: car, size: 48),
              const SizedBox(width: 8),
              Expanded(
                child: PrimaryButton(label: 'Залгах', icon: Icons.phone_rounded, onTap: () => launchUrl(Uri.parse('tel:$phone'))),
              ),
            ] else
              Expanded(child: PrimaryButton(label: 'Чатлах', icon: Icons.chat_bubble_outline_rounded, onTap: () => openCarChat(context, car))),
          ]),
        ),
      ),
    );
  }
}
