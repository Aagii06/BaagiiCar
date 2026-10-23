import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/saved.dart';

/// Orange mark + "CARDEALER" wordmark.
class Logo extends StatelessWidget {
  const Logo({super.key});
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        const LogoMark(),
        const SizedBox(width: 10),
        Text('CARDEALER', style: displayStyle(21)),
      ]);
}

class LogoMark extends StatelessWidget {
  final double size;
  const LogoMark({super.key, this.size = 34});
  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: AppPalette.primary, borderRadius: BorderRadius.circular(size * 0.28)),
        child: Icon(Icons.directions_car_filled_rounded, color: Colors.white, size: size * 0.58),
      );
}

/// Phone app bar (web `MobileAppBar`): logo on home, title on the other tabs, ♡ on the right.
/// Pushed pages use a plain [AppBar] with the back arrow and a title.
class TabAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  const TabAppBar({super.key, this.title});

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) => AppBar(
        title: title == null ? const Logo() : Text(title!),
        actions: const [SavedAction(), SizedBox(width: 6)],
      );
}

/// ♡ in the app bar → "Хадгалсан".
class SavedAction extends StatelessWidget {
  const SavedAction({super.key});
  @override
  Widget build(BuildContext context) => IconButton(
        tooltip: 'Хадгалсан',
        icon: const Icon(Icons.favorite_border_rounded),
        onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SavedScreen())),
      );
}
