import 'package:flutter/material.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/screens/car_form.dart';
import 'package:mashinuud_app/admin/screens/customers.dart';
import 'package:mashinuud_app/admin/screens/dealers.dart';
import 'package:mashinuud_app/admin/shell.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';

typedef _Stats = ({int pending, int active, int sold, int featured, int total, int dealers, int users});

/// Самбар: totals, ads by status, the last 3 days' ads, then featured (admin) or the most viewed (dealer).
class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key});
  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  int _reload = 0;

  Future<_Stats> _stats(bool admin) async {
    final r = await Future.wait([
      AdminApi.countOf('cars', [
        ['status', '=', 'pending'],
      ]),
      AdminApi.countOf('cars', [
        ['status', '=', 'active'],
      ]),
      AdminApi.countOf('cars', [
        ['status', '=', 'sold'],
      ]),
      AdminApi.countOf('cars', [
        ['status', '=', 'active'],
        ['is_featured', '=', 1],
      ]),
      AdminApi.countOf('cars', [
        ['status', '<>', 'deleted'],
      ]),
      admin
          ? AdminApi.countOf('dealers', [
              ['status', '<>', 'deleted'],
            ])
          : Future.value(0),
      admin
          ? AdminApi.countOf('customers', [
              ['status', '=', 'active'],
            ])
          : Future.value(0),
    ]);
    return (pending: r[0], active: r[1], sold: r[2], featured: r[3], total: r[4], dealers: r[5], users: r[6]);
  }

  @override
  Widget build(BuildContext context) {
    final admin = AdminApi.session.isAdmin;
    return ListenableBuilder(
      listenable: adminNav,
      builder: (context, _) {
        final key = '${adminNav.revision}|$_reload';
        return RefreshIndicator(
          color: AppPalette.primary,
          onRefresh: () async => setState(() => _reload++),
          child: ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 100), children: [
            Loader<_Stats>(
              fetchKey: key,
              fetch: () => _stats(admin),
              loading: const RowsSkeleton(count: 2),
              builder: (context, s, _) => _tiles(context, s, admin),
            ),
            _ListBlock(
              title: 'Сүүлийн 3 хоногт нэмэгдсэн',
              fetchKey: key,
              fetch: () => AdminApi.recentCars(take: 5),
              empty: 'Сүүлийн 3 хоногт зар нэмэгдээгүй',
              onAll: () => adminNav.openCars(),
            ),
            if (admin)
              _ListBlock(
                title: 'Онцлох зарууд',
                fetchKey: key,
                fetch: () => AdminApi.featuredCars(5),
                empty: 'Онцлох зар алга',
                onAll: () => adminNav.openCars(statuses: ['featured']),
              )
            else ...[
              _ListBlock(title: 'Хамгийн их хандалттай', fetchKey: key, fetch: () => AdminApi.topCars('view'), empty: 'Үзсэн зар алга', count: (c) => (Icons.visibility_outlined, c.viewCount)),
              _ListBlock(title: 'Хамгийн их дугаар харсан', fetchKey: key, fetch: () => AdminApi.topCars('phone'), empty: 'Дугаар харсан зар алга', count: (c) => (Icons.phone_outlined, c.phoneViewCount)),
            ],
          ]),
        );
      },
    );
  }

  Widget _tiles(BuildContext context, _Stats s, bool admin) {
    Widget big(String label, int value, IconData icon, Color bg, Color iconBg, VoidCallback onTap) => Expanded(
          child: Material(
            color: bg,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            child: InkWell(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Stack(children: [
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('$value', style: displayStyle(24)),
                    const SizedBox(height: 6),
                    Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppPalette.mutedForeground)),
                  ]),
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(8)),
                      child: Icon(icon, size: 16, color: Colors.white),
                    ),
                  ),
                ]),
              ),
            ),
          ),
        );
    Widget small(String label, int value, Color bg, Color fg, VoidCallback onTap, {bool ring = false}) => Expanded(
          child: Material(
            color: bg,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg), side: ring ? const BorderSide(color: AppPalette.amber, width: 2) : BorderSide.none),
            child: InkWell(
              borderRadius: BorderRadius.circular(AppRadius.lg),
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('$value', style: displayStyle(24, color: fg)),
                  const SizedBox(height: 6),
                  Text(label, maxLines: 2, style: TextStyle(fontSize: 11, height: 1.15, fontWeight: FontWeight.w600, color: fg.withValues(alpha: 0.85))),
                ]),
              ),
            ),
          ),
        );
    const gap = SizedBox(width: 8);
    return Column(children: [
      IntrinsicHeight(
          child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        if (admin) ...[
          big('Нийт дилер', s.dealers, Icons.storefront_outlined, AppPalette.tintBlue, const Color(0xFF2F80ED), () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DealersScreen()))),
          gap,
          big('Идэвхтэй хэрэглэгч', s.users, Icons.people_outline_rounded, AppPalette.tintMint, AppPalette.success, () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CustomersScreen()))),
          gap,
        ],
        big('Нийт зар', s.total, Icons.directions_car_outlined, AppPalette.tintLavender, const Color(0xFF7B61FF), () => adminNav.openCars()),
      ])),
      const SizedBox(height: 8),
      IntrinsicHeight(
          child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        small('Хүлээгдэж буй', s.pending, s.pending > 0 ? AppPalette.amberSoft : Colors.white, s.pending > 0 ? AppPalette.amberInk : AppPalette.foreground, () => adminNav.openCars(statuses: ['pending']), ring: s.pending > 0),
        gap,
        small('Идэвхтэй', s.active, AppPalette.primary, Colors.white, () => adminNav.openCars(statuses: ['active'])),
        gap,
        small('Онцлох', s.featured, AppPalette.amber, AppPalette.dark, () => adminNav.openCars(statuses: ['featured'])),
        gap,
        small('Зарагдсан', s.sold, AppPalette.dark, Colors.white, () => adminNav.openCars(statuses: ['sold'])),
      ])),
    ]);
  }
}

class _ListBlock extends StatelessWidget {
  final String title;
  final Object fetchKey;
  final Future<ListPage<ACar>> Function() fetch;
  final String empty;
  final VoidCallback? onAll;
  final (IconData, int) Function(ACar car)? count;
  const _ListBlock({required this.title, required this.fetchKey, required this.fetch, required this.empty, this.onAll, this.count});

  @override
  Widget build(BuildContext context) => Loader<ListPage<ACar>>(
        fetchKey: fetchKey,
        fetch: fetch,
        loading: const Padding(padding: EdgeInsets.only(top: 24), child: RowsSkeleton(count: 3)),
        builder: (context, page, _) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const SizedBox(height: 24),
          Row(children: [
            Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            if (count == null) ...[const SizedBox(width: 6), Text('${page.count}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppPalette.mutedForeground))],
            const Spacer(),
            if (onAll != null)
              TextButton(
                onPressed: onAll,
                child: const Row(children: [Text('Бүгд', style: TextStyle(fontWeight: FontWeight.w600)), SizedBox(width: 4), Icon(Icons.arrow_forward_rounded, size: 16)]),
              ),
          ]),
          const SizedBox(height: 6),
          if (page.rows.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 28),
              decoration: BoxDecoration(color: AppPalette.card, borderRadius: BorderRadius.circular(AppRadius.lg)),
              child: Text(empty, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: AppPalette.mutedForeground)),
            )
          else
            for (final c in page.rows) Padding(padding: const EdgeInsets.only(bottom: 8), child: CarLine(car: c, count: count?.call(c))),
        ]),
      );
}

/// An ad in the dashboard's lists; opens its editor.
class CarLine extends StatelessWidget {
  final ACar car;
  final (IconData, int)? count;
  const CarLine({super.key, required this.car, this.count});
  @override
  Widget build(BuildContext context) => Material(
        color: AppPalette.card,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          onTap: () async {
            final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => CarEditScreen(carId: car.id)));
            if (saved == true) adminNav.changed();
          },
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Row(children: [
              CarThumb(car, width: 64, height: 48),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(car.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text('${formatPriceShort(car.price)} · ${car.dealerName ?? car.sellerName ?? car.phonenumber ?? ''}',
                      maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                ]),
              ),
              const SizedBox(width: 8),
              if (count != null)
                Row(children: [Icon(count!.$1, size: 14, color: AppPalette.mutedForeground), const SizedBox(width: 4), Text('${count!.$2}', style: const TextStyle(fontWeight: FontWeight.w700))])
              else
                CarStatusBadge(car.status),
            ]),
          ),
        ),
      );
}
