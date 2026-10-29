import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/constant.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/ai_chat.dart';
import 'package:mashinuud_app/screens/cars.dart';
import 'package:mashinuud_app/screens/compare.dart';
import 'package:mashinuud_app/screens/home.dart';
import 'package:mashinuud_app/screens/profile.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/common.dart';

/// Bottom navigation (Нүүр · Хайх · Харьцуулалт · Профайл) with the AI button and the compare bar on top.
class Shell extends StatelessWidget {
  const Shell({super.key});

  @override
  Widget build(BuildContext context) {
    // Decode the "no image" pictures up front, so they are there before the first photo starts loading.
    for (final asset in const [noImage, noImageSmall, noImageWide]) {
      precacheImage(AssetImage(asset), context);
    }
    final shell = Stores.shell;
    return ListenableBuilder(
      listenable: shell,
      builder: (context, _) => Scaffold(
        body: Stack(children: [
          IndexedStack(
            index: shell.tab,
            children: const [HomeScreen(), CarsScreen(), CompareScreen(), ProfileScreen()],
          ),
          if (shell.tab != ShellController.compare) const Positioned(left: 16, right: 88, bottom: 16, child: CompareBar()),
        ]),
        floatingActionButton: FloatingActionButton(
          tooltip: 'AI туслах',
          backgroundColor: AppPalette.primary,
          foregroundColor: Colors.white,
          shape: const CircleBorder(),
          onPressed: () => Navigator.of(context).push(MaterialPageRoute(fullscreenDialog: true, builder: (_) => const AiChatScreen())),
          child: const Icon(Icons.smart_toy_outlined),
        ),
        bottomNavigationBar: DecoratedBox(
          decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppPalette.border))),
          child: NavigationBar(
            selectedIndex: shell.tab,
            onDestinationSelected: shell.go,
            destinations: const [
              NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home_rounded), label: 'Нүүр'),
              NavigationDestination(icon: Icon(Icons.search_rounded), label: 'Хайх'),
              NavigationDestination(icon: Icon(Icons.compare_arrows_rounded), label: 'Харьцуулалт'),
              NavigationDestination(icon: Icon(Icons.person_outline_rounded), selectedIcon: Icon(Icons.person_rounded), label: 'Профайл'),
            ],
          ),
        ),
      ),
    );
  }
}

/// Dark pill shown while cars are picked for comparison.
class CompareBar extends StatelessWidget {
  const CompareBar({super.key});

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: Stores.compare,
        builder: (context, _) {
          final n = Stores.compare.ids.length;
          if (n == 0) return const SizedBox.shrink();
          return Material(
            color: AppPalette.dark,
            elevation: 8,
            shadowColor: Colors.black45,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 6, 6, 6),
              child: Row(children: [
                const Icon(Icons.compare_arrows_rounded, size: 18, color: Colors.white70),
                const SizedBox(width: 8),
                Text.rich(TextSpan(children: [
                  TextSpan(text: '$n', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                  TextSpan(text: ' / ${AppConstants.compareMax}', style: const TextStyle(color: Colors.white54, fontWeight: FontWeight.w600)),
                ])),
                const Spacer(),
                FilledButton.icon(
                  onPressed: () => Stores.shell.go(ShellController.compare),
                  iconAlignment: IconAlignment.end,
                  icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                  label: const Text('Харьцуулалт'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppPalette.primary,
                    minimumSize: const Size(0, 36),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                    textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                  ),
                ),
                IconButton(
                  tooltip: 'Цэвэрлэх',
                  onPressed: Stores.compare.clear,
                  icon: const Icon(Icons.close_rounded, size: 18, color: Colors.white70),
                ),
              ]),
            ),
          );
        },
      );
}
