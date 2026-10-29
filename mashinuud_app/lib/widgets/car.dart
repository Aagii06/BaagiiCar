import 'package:flutter/material.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/api/models.dart';
import 'package:mashinuud_app/app/constant.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/car_chat.dart';
import 'package:mashinuud_app/screens/car_detail.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/phone.dart';

void openCar(BuildContext context, Car car) =>
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => CarDetailScreen(carId: car.id, preview: car)));

/// A car's photo over the default "image coming soon" picture; the photo fades in once loaded.
class CarImage extends StatelessWidget {
  final Car car;
  final String size;
  final double radius;
  const CarImage(this.car, {super.key, this.size = 'grid', this.radius = AppRadius.md});

  @override
  Widget build(BuildContext context) {
    final url = uploadUrl(car.image, size: size);
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Stack(fit: StackFit.expand, children: [
        // "No image" while there is no photo, while it loads (however slowly), and if it fails — same as the website.
        const ColoredBox(color: Colors.white, child: NoImage()),
        if (url != null)
          Image.network(
            url,
            fit: BoxFit.cover,
            gaplessPlayback: true,
            frameBuilder: (_, child, frame, sync) => sync
                ? child
                : AnimatedOpacity(opacity: frame == null ? 0 : 1, duration: const Duration(milliseconds: 300), child: child),
            errorBuilder: (_, _, _) => const SizedBox.shrink(),
          ),
      ]),
    );
  }
}

class FavoriteButton extends StatelessWidget {
  final int carId;

  /// Round white button floating on a photo; otherwise a bordered square for an action row.
  final bool floating;
  final double size;
  const FavoriteButton({super.key, required this.carId, this.floating = false, this.size = 40});

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: Stores.favorites,
        builder: (context, _) {
          final on = Stores.favorites.has(carId);
          final icon = Icon(on ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              size: 19, color: on ? AppPalette.destructive : AppPalette.foreground);
          if (!floating) {
            return SquareIconButton(
              icon: on ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              color: on ? AppPalette.destructive : null,
              tooltip: on ? 'Хадгалснаас хасах' : 'Хадгалах',
              size: size,
              onTap: () => Stores.favorites.toggle(carId),
            );
          }
          return Material(
            color: Colors.white,
            shape: const CircleBorder(),
            elevation: 1,
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: () => Stores.favorites.toggle(carId),
              child: SizedBox.square(dimension: size, child: icon),
            ),
          );
        },
      );
}

class CompareButton extends StatelessWidget {
  final int carId;
  final double size;
  const CompareButton({super.key, required this.carId, this.size = 40});

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: Stores.compare,
        builder: (context, _) {
          final c = Stores.compare;
          final on = c.has(carId);
          final blocked = c.full && !on;
          return SquareIconButton(
            icon: Icons.compare_arrows_rounded,
            size: size,
            tooltip: on ? 'Харьцуулалтаас хасах' : (blocked ? 'Хамгийн ихдээ ${AppConstants.compareMax} машин' : 'Харьцуулалтад нэмэх'),
            color: on ? Colors.white : null,
            background: on ? AppPalette.dark : null,
            borderColor: on ? AppPalette.dark : null,
            onTap: blocked ? null : () => c.toggle(carId),
          );
        },
      );
}

/// Chat-about-this-ad button (orange outline).
class ChatButton extends StatelessWidget {
  final Car car;
  final double size;
  const ChatButton({super.key, required this.car, this.size = 40});
  @override
  Widget build(BuildContext context) => SquareIconButton(
        icon: Icons.chat_bubble_outline_rounded,
        tooltip: 'Зарлагчтай холбогдох',
        size: size,
        color: AppPalette.primary,
        borderColor: AppPalette.primary,
        onTap: () => openCarChat(context, car),
      );
}

/// List card — the website's phone layout: photo left, title / price / "km · location", then actions.
class CarCard extends StatelessWidget {
  final Car car;
  final bool featuredBadge;
  const CarCard({super.key, required this.car, this.featuredBadge = false});

  @override
  Widget build(BuildContext context) {
    final meta = [if (car.mileage != null) formatKm(car.mileage), car.locationName].whereType<String>().where((s) => s.isNotEmpty).join(' · ');
    return Material(
      color: AppPalette.card,
      borderRadius: BorderRadius.circular(AppRadius.xl),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openCar(context, car),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 150,
                child: Stack(children: [
                  AspectRatio(aspectRatio: 4 / 3, child: CarImage(car)),
                  if (car.sold)
                    const Positioned(left: 6, top: 6, child: Pill('Зарагдсан', background: AppPalette.dark, color: Colors.white))
                  else if (featuredBadge && car.isFeatured)
                    const Positioned(
                      left: 6,
                      top: 6,
                      child: Pill('Онцлох', background: Colors.white, color: AppPalette.success, icon: Icons.verified_rounded),
                    ),
                ]),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ConstrainedBox(
                  // At least the photo's height, so the actions line up with its bottom edge.
                  constraints: const BoxConstraints(minHeight: 112.5),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text.rich(
                        TextSpan(children: [
                          TextSpan(text: car.title),
                          if (car.manufacturedYear != null)
                            TextSpan(text: ' · ${car.manufacturedYear}', style: const TextStyle(fontWeight: FontWeight.w500, color: AppPalette.mutedForeground)),
                        ]),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, height: 1.3),
                      ),
                      const SizedBox(height: 2),
                      Text(formatPriceShort(car.price), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppPalette.primary)),
                      if (meta.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(meta, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                      ],
                      ]),
                      const SizedBox(height: 8),
                      Row(children: [
                        if ((car.contactPhone ?? '').isNotEmpty) ...[
                          PhoneButton(car: car, phone: car.contactPhone!, style: PhoneButtonStyle.icon, size: 36),
                          const SizedBox(width: 8),
                        ],
                        ChatButton(car: car, size: 36),
                        const SizedBox(width: 8),
                        FavoriteButton(carId: car.id, size: 36),
                        const SizedBox(width: 8),
                        CompareButton(carId: car.id, size: 36),
                      ]),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Mileage strip: label left, the km figure right (web `SpecChips`).
class MileageStrip extends StatelessWidget {
  final Car car;
  const MileageStrip(this.car, {super.key});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(color: AppPalette.muted, borderRadius: BorderRadius.circular(AppRadius.md)),
        child: Row(children: [
          const Text('Гүйлт', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppPalette.mutedForeground)),
          const Spacer(),
          if (car.mileage != null)
            Text.rich(TextSpan(children: [
              TextSpan(text: formatNumber(car.mileage), style: displayStyle(15, weight: FontWeight.w600)),
              const TextSpan(text: ' км', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppPalette.mutedForeground)),
            ]))
          else
            const Text('—', style: TextStyle(color: AppPalette.mutedForeground)),
        ]),
      );
}

/// The orange-outlined featured card lifted into the list after the first row.
class CarWideCard extends StatelessWidget {
  final Car car;
  const CarWideCard({super.key, required this.car});

  @override
  Widget build(BuildContext context) => Material(
        color: AppPalette.card,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.xl),
          side: const BorderSide(color: AppPalette.primary, width: 1.5),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => openCar(context, car),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Stack(children: [
                AspectRatio(aspectRatio: 16 / 9, child: CarImage(car)),
                if (car.isFeatured)
                  const Positioned(
                    left: 8,
                    top: 8,
                    child: Pill('Онцлох', background: Colors.white, color: AppPalette.success, icon: Icons.verified_rounded),
                  ),
              ]),
              const SizedBox(height: 14),
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(
                  child: Text.rich(TextSpan(children: [
                    TextSpan(text: car.title),
                    if (car.manufacturedYear != null)
                      TextSpan(text: ' · ${car.manufacturedYear}', style: const TextStyle(fontWeight: FontWeight.w500, color: AppPalette.mutedForeground)),
                  ]), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(color: AppPalette.primary, borderRadius: BorderRadius.circular(AppRadius.sm)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.bolt_rounded, size: 16, color: Colors.white),
                    const SizedBox(width: 2),
                    Text(formatPriceShort(car.price), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                  ]),
                ),
              ]),
              const SizedBox(height: 14),
              MileageStrip(car),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(
                  child: PrimaryButton(label: 'Дэлгэрэнгүй', height: 44, onTap: () => openCar(context, car)),
                ),
                const SizedBox(width: 8),
                if ((car.contactPhone ?? '').isNotEmpty) ...[
                  PhoneButton(car: car, phone: car.contactPhone!, style: PhoneButtonStyle.icon, size: 44),
                  const SizedBox(width: 8),
                ],
                ChatButton(car: car, size: 44),
                const SizedBox(width: 8),
                CompareButton(carId: car.id, size: 44),
              ]),
            ]),
          ),
        ),
      );
}

/// Placeholder rows shaped like [CarCard].
class CarCardSkeleton extends StatelessWidget {
  final int count;
  const CarCardSkeleton({super.key, this.count = 4});

  @override
  Widget build(BuildContext context) => Column(
        children: List.generate(
          count,
          (_) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Panel(
              padding: const EdgeInsets.all(10),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const SizedBox(width: 150, child: AspectRatio(aspectRatio: 4 / 3, child: SkeletonBox(height: double.infinity, radius: AppRadius.md))),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 112.5,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const FractionallySizedBox(widthFactor: 0.8, child: SkeletonBox(height: 14)),
                      const SizedBox(height: 8),
                      const FractionallySizedBox(widthFactor: 0.4, child: SkeletonBox(height: 12)),
                      const SizedBox(height: 8),
                      const FractionallySizedBox(widthFactor: 0.6, child: SkeletonBox(height: 10)),
                      const Spacer(),
                      Row(children: List.generate(3, (_) => const Padding(padding: EdgeInsets.only(right: 8), child: SkeletonBox(width: 36, height: 36, radius: AppRadius.md)))),
                    ]),
                  ),
                ),
              ]),
            ),
          ),
        ),
      );
}

/// Column of cards with 12px gaps.
class CarList extends StatelessWidget {
  final List<Car> cars;
  final bool featuredBadge;
  const CarList({super.key, required this.cars, this.featuredBadge = false});
  @override
  Widget build(BuildContext context) => Column(
        children: [
          for (final c in cars) Padding(padding: const EdgeInsets.only(bottom: 12), child: CarCard(car: c, featuredBadge: featuredBadge)),
        ],
      );
}
