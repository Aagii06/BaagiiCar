import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mashinuud_app/app/constant.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/help.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/common.dart';

/// Dark "Зээлийн тооцоолуур" card: 30% down, pick a term, see the monthly payment.
class LeasingCalculator extends StatefulWidget {
  final double price;
  final int? carId;
  const LeasingCalculator({super.key, required this.price, this.carId});
  @override
  State<LeasingCalculator> createState() => _LeasingCalculatorState();
}

class _LeasingCalculatorState extends State<LeasingCalculator> {
  int _months = 36;

  @override
  Widget build(BuildContext context) {
    final amount = widget.price;
    final down = amount * Leasing.downPaymentRate;
    final monthly = Leasing.monthly(amount, _months);
    return Panel(
      color: AppPalette.dark,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Зээлийн тооцоолуур', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Row(children: [
          Text('Урьдчилгаа ${(Leasing.downPaymentRate * 100).round()}%', style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 14)),
          const Spacer(),
          Text(amount > 0 ? formatPrice(down) : '—', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        ]),
        const SizedBox(height: 16),
        Row(children: [
          for (final m in Leasing.terms)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: Material(
                  color: m == _months ? Colors.white : AppPalette.dark2,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                    onTap: () => setState(() => _months = m),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Center(
                        child: Text('$m сар', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: m == _months ? AppPalette.dark : Colors.white)),
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ]),
        const SizedBox(height: 20),
        Row(children: [
          Expanded(child: Text('Сарын төлбөр ($_months сар)', style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 14))),
          Text(amount > 0 ? formatPrice(monthly) : '—', style: const TextStyle(color: AppPalette.primary, fontSize: 20, fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 8),
        Text(
          'Жишиг тооцоо: сарын ${(Leasing.monthlyRate * 100).toStringAsFixed(1)}% хүүтэй. Бодит нөхцөл банк, лизингийн компаниас хамаарна.',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 11, height: 1.4),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 46,
          child: FilledButton(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => HelpScreen(leasingCarId: widget.carId ?? 0))),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppPalette.dark,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
              textStyle: const TextStyle(fontWeight: FontWeight.w700),
            ),
            child: const Text('Зээлийн хүсэлт илгээх'),
          ),
        ),
      ]),
    );
  }
}

/// "Лизинг": enter a price, see the estimate.
class LeasingScreen extends StatefulWidget {
  const LeasingScreen({super.key});
  @override
  State<LeasingScreen> createState() => _LeasingScreenState();
}

class _LeasingScreenState extends State<LeasingScreen> {
  final _price = TextEditingController(text: '60000000');

  @override
  void dispose() {
    _price.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final price = toNumber(_price.text);
    return Scaffold(
      appBar: AppBar(title: const Text('Лизинг')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Машины үнээ оруулаад сарын төлбөрөө тооцоолоорой. Тодорхой зар дээрх тооцоолуур тухайн машины үнээр шууд бодно.',
            style: TextStyle(fontSize: 14, height: 1.6, color: AppPalette.mutedForeground)),
        const SizedBox(height: 16),
        Panel(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Машины үнэ (₮)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(
              controller: _price,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: (_) => setState(() {}),
            ),
            if (price > 0) ...[
              const SizedBox(height: 6),
              Text(formatPrice(price), style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
            ],
            const SizedBox(height: 18),
            for (final line in [
              'Урьдчилгаа: үнийн ${(Leasing.downPaymentRate * 100).round()}%',
              'Хугацаа: ${Leasing.terms.join(', ')} сар',
              'Жишиг хүү: сарын ${(Leasing.monthlyRate * 100).toStringAsFixed(1)}% — бодит хүү банк, лизингийн компаниас хамаарна',
            ])
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text('•  $line', style: TextStyle(fontSize: 14, height: 1.5, color: AppPalette.foreground.withValues(alpha: 0.8))),
              ),
            const SizedBox(height: 8),
            OutlineAction(
              label: 'Машин сонгох',
              onTap: () {
                Navigator.of(context).popUntil((r) => r.isFirst);
                Stores.shell.openCars();
              },
            ),
          ]),
        ),
        const SizedBox(height: 16),
        LeasingCalculator(price: price),
      ]),
    );
  }
}
