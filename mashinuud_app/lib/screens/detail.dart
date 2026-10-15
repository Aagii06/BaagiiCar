import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/data/car_data.dart';
import 'package:mashinuud_app/data/chat_data.dart';
import 'package:mashinuud_app/screens/chat.dart';
import 'package:mashinuud_app/widgets/custom/ui.dart';

/// Зээлийн сарын хүү (тооцоолуурт ашиглана).
const double loanMonthlyRate = 0.018;
const double loanDownPayment = 0.3;

class DetailScreen extends StatefulWidget {
  final String carId;

  const DetailScreen({super.key, required this.carId});

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  static const _imageCount = 12;
  static const _loanTerms = [12, 24, 36, 48];

  int _image = 0;
  int _term = 36;
  bool _favorite = false;

  Car get car => findCar(widget.carId);

  int _monthlyPayment() {
    final principal = car.price * (1 - loanDownPayment);
    const r = loanMonthlyRate;
    final payment = principal * r / (1 - math.pow(1 + r, -_term));
    return payment.round();
  }

  void _openChat() => Navigator.push(
    context,
    MaterialPageRoute(builder: (_) => ChatScreen(car: car)),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: car.tint,
      body: Column(
        children: [
          Expanded(
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(child: _gallery()),
                SliverToBoxAdapter(
                  child: Container(
                    decoration: const BoxDecoration(
                      color: AppPalette.background,
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(36),
                      ),
                    ),
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
                    child: _content(),
                  ),
                ),
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: ColoredBox(color: AppPalette.background),
                ),
              ],
            ),
          ),
          _bottomBar(),
        ],
      ),
    );
  }

  Widget _gallery() {
    return SafeArea(
      bottom: false,
      child: SizedBox(
        height: 300,
        child: Stack(
          children: [
            PageView.builder(
              itemCount: _imageCount,
              onPageChanged: (i) => setState(() => _image = i),
              itemBuilder: (_, _) =>
                  const Center(child: CarOutline(width: 300)),
            ),
            Positioned(
              top: 12,
              left: 20,
              child: _roundButton(
                Icons.chevron_left_rounded,
                () => Navigator.pop(context),
              ),
            ),
            Positioned(
              top: 12,
              right: 20,
              child: Row(
                children: [
                  _roundButton(Icons.share_outlined, () {}),
                  const SizedBox(width: 12),
                  _roundButton(
                    _favorite
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    () => setState(() => _favorite = !_favorite),
                    color: _favorite ? AppPalette.red : AppPalette.ink,
                  ),
                ],
              ),
            ),
            Positioned(
              bottom: 40,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 0; i < 5; i++)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      width: i == math.min(_image, 4) ? 28 : 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: i == math.min(_image, 4)
                            ? AppPalette.ink
                            : AppPalette.muted.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(5),
                      ),
                    ),
                ],
              ),
            ),
            Positioned(
              bottom: 30,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppPalette.ink,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  '${_image + 1} / $_imageCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _roundButton(IconData icon, VoidCallback onTap, {Color? color}) {
    return Material(
      color: AppPalette.surface,
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          width: 56,
          height: 56,
          child: Icon(icon, color: color ?? AppPalette.ink, size: 26),
        ),
      ),
    );
  }

  Widget _content() {
    final specs = [
      ('Үйлдвэрлэсэн', '${car.year}'),
      ('Орж ирсэн', '${car.importYear}'),
      ('Гүйлт', '${formatNumber(car.mileage)} км'),
      ('Хөдөлгүүр', car.engine),
      ('Түлш', car.fuel),
      ('Хурдны хайрцаг', car.transmission),
      ('Хүрд', car.steering),
      ('Хөтлөгч', car.drive),
      ('Өнгө', car.color),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 10,
          runSpacing: 8,
          children: [
            if (car.verified) const Tag.verified(),
            if (car.leasing)
              const Tag(
                label: 'Лизинг боломжтой',
                background: AppPalette.accentTint,
              ),
          ],
        ),
        const SizedBox(height: 14),
        Text(car.name, style: displayStyle(30)),
        const SizedBox(height: 10),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              flex: 3,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: PriceText(car.priceLabel, size: 30),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: Text(
                '${car.location} · ${car.postedAgo}',
                textAlign: TextAlign.end,
                style: const TextStyle(color: AppPalette.muted),
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        AppCard(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Row(
            children: [
              for (final (icon, value) in [
                (Icons.speed_rounded, '${formatNumber(car.mileage)} км'),
                (Icons.local_gas_station_outlined, car.fuel),
                (Icons.settings_outlined, car.transmission),
                (Icons.all_inclusive_rounded, car.drive),
              ])
                Expanded(
                  child: Column(
                    children: [
                      Icon(icon, color: AppPalette.primary),
                      const SizedBox(height: 6),
                      Text(
                        value,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 1.05,
          padding: EdgeInsets.zero,
          children: [
            for (final (label, value) in specs)
              AppCard(
                padding: const EdgeInsets.all(14),
                radius: 20,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      label,
                      maxLines: 2,
                      style: const TextStyle(
                        color: AppPalette.muted,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      value,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Тайлбар',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 10),
              Text(
                car.description,
                style: const TextStyle(
                  color: AppPalette.muted,
                  fontSize: 16,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        if (car.verified) ...[const SizedBox(height: 14), _diagnosis()],
        const SizedBox(height: 14),
        _loanCalculator(),
        const SizedBox(height: 14),
        _seller(),
      ],
    );
  }

  Widget _diagnosis() {
    const parts = [
      'Хөдөлгүүр',
      'Хурдны хайрцаг',
      'Явах эд анги',
      'Цахилгаан систем',
    ];
    return AppCard(
      child: Column(
        children: [
          const Row(
            children: [
              Expanded(
                child: Text(
                  'Оношилгооны тайлан',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                ),
              ),
              Text(
                'Бүтнээр',
                style: TextStyle(
                  color: AppPalette.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          for (final part in parts)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 16,
                    backgroundColor: AppPalette.greenTint,
                    child: Icon(
                      Icons.check_rounded,
                      size: 18,
                      color: AppPalette.green,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(part, style: const TextStyle(fontSize: 17)),
                  ),
                  const Text(
                    'Хэвийн',
                    style: TextStyle(
                      color: AppPalette.green,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _loanCalculator() {
    const label = TextStyle(color: Colors.white70, fontSize: 16);
    return AppCard(
      color: AppPalette.ink,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Зээлийн тооцоолуур',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Урьдчилгаа ${(loanDownPayment * 100).round()}%',
                  style: label,
                ),
              ),
              Text(formatPrice(car.price * loanDownPayment), style: label),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              for (final term in _loanTerms) ...[
                if (term != _loanTerms.first) const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _term = term),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      height: 50,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: term == _term
                            ? Colors.white
                            : AppPalette.inkSoft,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Text(
                        '$term сар',
                        style: TextStyle(
                          color: term == _term ? AppPalette.ink : Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(child: Text('Сарын төлбөр ($_term сар)', style: label)),
              PriceText(
                formatPrice(_monthlyPayment()),
                size: 24,
                color: AppPalette.accent,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _seller() {
    final seller = conversations.firstWhere(
      (c) => c.carId == car.id,
      orElse: () => conversations.first,
    );
    return AppCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: AppPalette.primaryTint,
            child: Text(
              seller.initials,
              style: const TextStyle(
                color: AppPalette.primary,
                fontWeight: FontWeight.w800,
                fontSize: 18,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        seller.name,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Icon(
                      Icons.verified_user_outlined,
                      size: 18,
                      color: AppPalette.green,
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                const Text(
                  'Хувь хүн · Утас баталгаажсан',
                  style: TextStyle(color: AppPalette.muted),
                ),
              ],
            ),
          ),
          const Text(
            'Бусад зар',
            style: TextStyle(
              color: AppPalette.primary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _bottomBar() {
    return Container(
      decoration: const BoxDecoration(
        color: AppPalette.surface,
        border: Border(top: BorderSide(color: AppPalette.border)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
          child: Row(
            children: [
              OutlineButton(icon: Icons.call_outlined, onPressed: () {}),
              const SizedBox(width: 12),
              Expanded(
                child: PrimaryButton(
                  label: 'Зарлагчтай чатлах',
                  icon: Icons.chat_bubble_outline_rounded,
                  onPressed: _openChat,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
