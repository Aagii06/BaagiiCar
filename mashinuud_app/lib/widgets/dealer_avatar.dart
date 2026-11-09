import 'package:flutter/material.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';

/// Dealer logo (with [padding] around it on [background]); with no logo, or one that
/// fails to load, the dealer's initials — first letters of the name's first two words —
/// filling the whole box. Give it a size from the parent.
class DealerAvatar extends StatelessWidget {
  final String? logo;
  final String? name;
  final EdgeInsets padding;
  final Color background;
  const DealerAvatar({super.key, required this.logo, required this.name, this.padding = EdgeInsets.zero, this.background = Colors.white});

  @override
  Widget build(BuildContext context) {
    final fallback = LayoutBuilder(
      builder: (context, box) {
        final side = box.biggest.shortestSide.isFinite ? box.biggest.shortestSide : 48.0;
        return Container(
          color: AppPalette.primarySoft,
          alignment: Alignment.center,
          child: Text(
            initials(name, fromStart: true),
            maxLines: 1,
            style: TextStyle(fontSize: side * 0.38, height: 1, fontWeight: FontWeight.w700, color: AppPalette.primary),
          ),
        );
      },
    );
    final url = uploadUrl(logo, folder: 'dealers');
    if (url == null) return fallback;
    return Image.network(
      url,
      fit: BoxFit.contain,
      gaplessPlayback: true,
      frameBuilder: (_, child, frame, sync) => Container(
        color: background,
        padding: padding,
        child: sync || frame != null ? child : null,
      ),
      errorBuilder: (_, _, _) => fallback,
    );
  }
}
