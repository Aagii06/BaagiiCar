import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/help.dart';
import 'package:mashinuud_app/screens/list.dart';
import 'package:mashinuud_app/screens/search.dart';
import 'package:mashinuud_app/widgets/custom/ui.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    void push(Widget page) =>
        Navigator.push(context, MaterialPageRoute(builder: (_) => page));

    final menu = [
      (
        Icons.notes_rounded,
        'Миний зарууд',
        AppPalette.primaryTint,
        () => push(const ListScreen(title: 'Миний зарууд')),
      ),
      (
        Icons.favorite_border_rounded,
        'Хадгалсан машинууд',
        AppPalette.redTint,
        () => push(const ListScreen(title: 'Хадгалсан')),
      ),
      (
        Icons.manage_search_rounded,
        'Хадгалсан хайлт',
        AppPalette.accentTint,
        () => push(const SearchScreen(initialTab: 1)),
      ),
      (
        Icons.notifications_none_rounded,
        'Хайлтын мэдэгдэл',
        AppPalette.accentTint,
        () {},
      ),
      (
        Icons.compare_arrows_rounded,
        'Машин харьцуулах',
        AppPalette.greenTint,
        () {},
      ),
      (
        Icons.calculate_outlined,
        'Зээлийн тооцоолуур',
        AppPalette.lavenderTint,
        () {},
      ),
      (
        Icons.help_outline_rounded,
        'Тусламж',
        AppPalette.primaryTint,
        () => push(const HelpScreen()),
      ),
      (Icons.settings_outlined, 'Тохиргоо', AppPalette.chipGrey, () {}),
    ];

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 32, 20, 32),
          children: [
            Text('Профайл', style: displayStyle(34)),
            const SizedBox(height: 24),
            AppCard(
              radius: 32,
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 34,
                        backgroundColor: AppPalette.primary,
                        child: Text(
                          'Б',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Хэрэглэгч',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              '+976 ···· ····',
                              style: TextStyle(color: AppPalette.muted),
                            ),
                          ],
                        ),
                      ),
                      OutlinedButton(
                        onPressed: () {},
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppPalette.ink,
                          side: const BorderSide(color: AppPalette.border),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 14,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text(
                          'Засах',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      for (final (count, label) in const [
                        ('2', 'Миний зар'),
                        ('5', 'Хадгалсан'),
                        ('3', 'Чат'),
                      ]) ...[
                        if (label != 'Миний зар') const SizedBox(width: 10),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color: AppPalette.background,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  count,
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  label,
                                  style: const TextStyle(
                                    color: AppPalette.muted,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            AppCard(
              radius: 32,
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Column(
                children: [
                  for (final (icon, label, tint, onTap) in menu)
                    InkWell(
                      onTap: onTap,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 10,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(
                                color: tint,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Icon(icon, size: 24),
                            ),
                            const SizedBox(width: 18),
                            Expanded(
                              child: Text(
                                label,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const Icon(
                              Icons.chevron_right_rounded,
                              color: AppPalette.muted,
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              height: 64,
              child: FilledButton(
                onPressed: () {},
                style: FilledButton.styleFrom(
                  backgroundColor: AppPalette.redTint,
                  foregroundColor: AppPalette.redText,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                child: const Text('Гарах'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
