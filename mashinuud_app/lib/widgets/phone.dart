import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mashinuud_app/api/api.dart';
import 'package:mashinuud_app/api/models.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:url_launcher/url_launcher.dart';

/// "9911 2233" for 8-digit numbers.
String _spaced(String phone) => RegExp(r'^\d{8}$').hasMatch(phone) ? '${phone.substring(0, 4)} ${phone.substring(4)}' : phone;

/// How the hidden number is offered (web `PhoneButton` variants).
enum PhoneButtonStyle {
  /// Wide orange "Дугаар харах" (action bar).
  bar,

  /// Orange-outlined phone icon (car cards).
  icon,
}

/// Hidden phone number; tapping counts the reveal and shows the number in a bottom sheet.
/// Fetched once per visitor — reopening doesn't count again, signing in as someone else does.
class PhoneButton extends StatefulWidget {
  final Car car;
  final String phone;
  final PhoneButtonStyle style;
  final double size;
  const PhoneButton({super.key, required this.car, required this.phone, this.style = PhoneButtonStyle.bar, this.size = 48});

  @override
  State<PhoneButton> createState() => _PhoneButtonState();
}

class _PhoneButtonState extends State<PhoneButton> {
  ({String? token, String phone, int count})? _revealed;
  bool _busy = false;

  Future<void> _show() async {
    final token = Stores.auth.token;
    var revealed = _revealed?.token == token ? _revealed : null;
    if (revealed == null) {
      setState(() => _busy = true);
      try {
        final res = await Api.revealPhone(widget.car.id, token: token);
        revealed = (token: token, phone: (res.phone ?? '').isNotEmpty ? res.phone! : widget.phone, count: res.count);
      } catch (_) {
        // Still show the number if counting failed.
        revealed = (token: token, phone: widget.phone, count: widget.car.phoneViewCount ?? 0);
      }
      if (!mounted) return;
      setState(() {
        _busy = false;
        _revealed = revealed;
      });
    }
    final car = widget.car;
    final seller = (car.dealerName ?? '').isNotEmpty ? car.dealerName : car.sellerName;
    await showPhoneSheet(context, phone: revealed.phone, count: revealed.count, seller: seller);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.style == PhoneButtonStyle.icon) {
      return SquareIconButton(
        icon: Icons.phone_outlined,
        tooltip: 'Дугаар харах',
        size: widget.size,
        color: AppPalette.primary,
        borderColor: AppPalette.primary,
        onTap: _busy ? null : _show,
      );
    }
    return PrimaryButton(label: 'Дугаар харах', icon: Icons.phone_rounded, height: widget.size, busy: _busy, onTap: _show);
  }
}

Future<void> showPhoneSheet(BuildContext context, {required String phone, required int count, String? seller}) => showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      backgroundColor: Colors.white,
      builder: (context) => _PhoneSheet(phone: phone, count: count, seller: seller),
    );

class _PhoneSheet extends StatefulWidget {
  final String phone;
  final int count;
  final String? seller;
  const _PhoneSheet({required this.phone, required this.count, this.seller});
  @override
  State<_PhoneSheet> createState() => _PhoneSheetState();
}

class _PhoneSheetState extends State<_PhoneSheet> {
  bool _copied = false;

  @override
  Widget build(BuildContext context) {
    void call() => launchUrl(Uri.parse('tel:${widget.phone}'));
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(color: AppPalette.primarySoft, borderRadius: BorderRadius.circular(AppRadius.lg)),
          child: const Icon(Icons.phone_rounded, size: 26, color: AppPalette.primary),
        ),
        const SizedBox(height: 12),
        Text(
          (widget.seller ?? '').isNotEmpty ? widget.seller! : 'Утасны дугаар',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppPalette.mutedForeground),
        ),
        const SizedBox(height: 4),
        InkWell(
          onTap: call,
          borderRadius: BorderRadius.circular(AppRadius.sm),
          child: Text(_spaced(widget.phone), style: displayStyle(34, height: 1.2).copyWith(letterSpacing: 1.5)),
        ),
        const SizedBox(height: 12),
        Tooltip(
          message: 'Дугаар харсан',
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(color: AppPalette.muted, borderRadius: BorderRadius.circular(99)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.visibility_outlined, size: 15, color: AppPalette.mutedForeground),
              const SizedBox(width: 6),
              Text('${widget.count}', semanticsLabel: 'Дугаар харсан ${widget.count}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppPalette.mutedForeground)),
            ]),
          ),
        ),
        const SizedBox(height: 24),
        Row(children: [
          Expanded(
            child: SizedBox(
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: widget.phone));
                  setState(() => _copied = true);
                },
                icon: Icon(_copied ? Icons.check_rounded : Icons.copy_rounded, size: 18),
                label: Text(_copied ? 'Хуулсан' : 'Хуулах'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppPalette.foreground,
                  side: const BorderSide(color: AppPalette.border),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                  textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(child: PrimaryButton(label: 'Залгах', icon: Icons.phone_rounded, onTap: call)),
        ]),
      ]),
    );
  }
}
