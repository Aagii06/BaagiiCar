import 'package:flutter/material.dart';
import 'package:mashinuud_app/api/api.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/api/models.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/app_bar.dart';
import 'package:mashinuud_app/widgets/car.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:url_launcher/url_launcher.dart';

class DealerLogo extends StatelessWidget {
  final Dealer dealer;
  final double size;
  const DealerLogo({super.key, required this.dealer, this.size = 64});
  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    padding: const EdgeInsets.all(8),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(AppRadius.md),
      border: Border.all(color: AppPalette.border),
    ),
    child: NetImage(
      uploadUrl(dealer.logo, folder: 'dealers'),
      fit: BoxFit.contain,
      background: Colors.white,
    ),
  );
}

/// "Дилерүүд" tab: registered dealers, most listings first.
class DealersScreen extends StatelessWidget {
  const DealersScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: const TabAppBar(title: 'Дилерүүд'),
    body: Loader<List<Dealer>>(
      fetch: Api.getDealers,
      loading: Pulse(
        child: ListView(
          padding: const EdgeInsets.all(16),
          physics: const NeverScrollableScrollPhysics(),
          children: [
            for (var i = 0; i < 5; i++)
              const Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: Panel(
                  padding: EdgeInsets.all(14),
                  child: Row(
                    children: [
                      SkeletonBox(width: 56, height: 56, radius: AppRadius.md),
                      SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [SkeletonLine(widthFactor: 0.55, height: 14), SizedBox(height: 8), SkeletonLine(widthFactor: 0.25, height: 12)],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
      builder: (context, dealers, _) => ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          if (dealers.isEmpty) const EmptyView(title: 'Бүртгэлтэй дилер алга'),
          for (final d in dealers)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Material(
                color: AppPalette.card,
                borderRadius: BorderRadius.circular(AppRadius.xl),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => DealerScreen(dealerId: d.id, preview: d),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        DealerLogo(dealer: d, size: 56),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(d.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                              const SizedBox(height: 2),
                              Text('${d.carCount} зар', style: const TextStyle(fontSize: 13, color: AppPalette.mutedForeground)),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, color: AppPalette.mutedForeground),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    ),
  );
}

/// One dealer: logo, name, phones, branch addresses and their ads (with "Цааш үзэх").
class DealerScreen extends StatefulWidget {
  final int dealerId;
  final Dealer? preview;
  const DealerScreen({super.key, required this.dealerId, this.preview});
  @override
  State<DealerScreen> createState() => _DealerScreenState();
}

class _DealerScreenState extends State<DealerScreen> {
  int _take = 12;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Дилерүүд')),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Loader<Dealer>(
          fetch: () => Api.getDealer(widget.dealerId),
          loading: widget.preview != null
              ? _header(widget.preview!)
              : const Pulse(
                  child: Row(
                    children: [
                      SkeletonBox(width: 80, height: 80, radius: AppRadius.md, color: AppPalette.card),
                      SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            FractionallySizedBox(
                              alignment: Alignment.centerLeft,
                              widthFactor: 0.6,
                              child: SkeletonBox(height: 24, color: AppPalette.card),
                            ),
                            SizedBox(height: 12),
                            SkeletonBox(width: 140, height: 36, radius: AppRadius.md, color: AppPalette.card),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
          builder: (context, d, _) => _header(d),
        ),
        const SizedBox(height: 24),
        Loader<ListPage<Car>>(
          fetchKey: _take,
          fetch: () => Api.getDealerCars(widget.dealerId, take: _take),
          loading: const CarCardSkeleton(count: 3),
          builder: (context, page, refreshing) => Column(
            children: [
              if (page.rows.isEmpty) const EmptyView(title: 'Энэ дилерт одоогоор зар алга') else CarList(cars: page.rows),
              if (page.count > page.rows.length)
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: FilledButton(
                    onPressed: refreshing ? null : () => setState(() => _take += 12),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppPalette.card,
                      disabledBackgroundColor: AppPalette.card,
                      foregroundColor: AppPalette.foreground,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                    ),
                    child: refreshing
                        ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2.2, color: AppPalette.primary))
                        : Text('Цааш үзэх  ${page.rows.length} / ${page.count}', style: const TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
            ],
          ),
        ),
      ],
    ),
  );

  Widget _header(Dealer d) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Row(
        children: [
          DealerLogo(dealer: d, size: 80),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(child: Text(d.name.toUpperCase(), style: displayStyle(26))),
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: AppPalette.primary, borderRadius: BorderRadius.circular(AppRadius.sm)),
                      child: Text(
                        '${d.carCount}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
                if (d.phones.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final phone in d.phones)
                        OutlinedButton.icon(
                          onPressed: () => launchUrl(Uri.parse('tel:$phone')),
                          icon: const Icon(Icons.phone_rounded, size: 16),
                          label: Text(phone),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppPalette.foreground,
                            side: const BorderSide(color: AppPalette.input),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                          ),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
      // Branches: each address on its own line (admin AddressPicker: "Аймаг, Сум, Баг, дэлгэрэнгүй").
      if (d.addresses.isNotEmpty) ...[
        const SizedBox(height: 16),
        Panel(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              for (final (i, address) in d.addresses.indexed) ...[
                if (i > 0) const Divider(height: 1),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.location_on_outlined, size: 18, color: AppPalette.primary),
                      const SizedBox(width: 10),
                      Expanded(child: Text(address, style: const TextStyle(fontSize: 14))),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    ],
  );
}
