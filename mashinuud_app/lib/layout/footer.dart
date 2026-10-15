import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/chat.dart';
import 'package:mashinuud_app/screens/home.dart';
import 'package:mashinuud_app/screens/post_ad.dart';
import 'package:mashinuud_app/screens/profile.dart';
import 'package:mashinuud_app/screens/search.dart';

class Footer extends StatefulWidget {
  const Footer({super.key});

  @override
  State<Footer> createState() => _FooterState();
}

class _FooterState extends State<Footer> {
  // 0: Нүүр, 1: Чат, 2: Профайл
  int _selectedIndex = 0;

  static const _pages = [
    HomePage(),
    ChatScreen(embedded: true),
    ProfileScreen(),
  ];

  void _push(Widget page, {bool fullscreen = false}) => Navigator.push(
    context,
    MaterialPageRoute(fullscreenDialog: fullscreen, builder: (_) => page),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: _pages),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppPalette.surface,
          border: Border(top: BorderSide(color: AppPalette.border)),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 76,
            child: Row(
              children: [
                _item(Icons.home_outlined, 'Нүүр', selected: _selectedIndex == 0,
                    onTap: () => setState(() => _selectedIndex = 0)),
                _item(Icons.search_rounded, 'Хайх',
                    onTap: () => _push(const SearchScreen())),
                Expanded(
                  child: Center(
                    child: Transform.translate(
                      offset: const Offset(0, -14),
                      child: Material(
                        color: AppPalette.primary,
                        elevation: 6,
                        shadowColor: AppPalette.primary.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(24),
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: () => _push(const PostAdScreen(), fullscreen: true),
                          child: const SizedBox(
                            width: 64,
                            height: 64,
                            child: Icon(Icons.add_rounded, color: Colors.white, size: 34),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                _item(Icons.chat_bubble_outline_rounded, 'Чат',
                    selected: _selectedIndex == 1,
                    onTap: () => setState(() => _selectedIndex = 1)),
                _item(Icons.person_outline_rounded, 'Профайл',
                    selected: _selectedIndex == 2,
                    onTap: () => setState(() => _selectedIndex = 2)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _item(
    IconData icon,
    String label, {
    bool selected = false,
    required VoidCallback onTap,
  }) {
    final color = selected ? AppPalette.primary : AppPalette.muted;
    return Expanded(
      child: InkResponse(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
