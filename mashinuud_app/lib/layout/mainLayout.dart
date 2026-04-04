import 'package:flutter/material.dart';
import 'package:mashinuud_app/l10n/app_localizations.dart';
import 'package:mashinuud_app/screens/home.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _selectedIndex = 0;

  final List<Widget> _pages = [
    const HomePage(),
    const Center(child: Text('Search')),
    const Center(child: Text('Alerts')),
    const Center(child: Text('Messages')),
    const Center(child: Text('Profile')),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8.0,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            IconButton(
              icon: const Icon(Icons.home),
              onPressed: () => setState(() => _selectedIndex = 0),
            ),
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () => setState(() => _selectedIndex = 1),
            ),

            Container(
              width: 60,
              height: 60,
              decoration: const BoxDecoration(
                color: Colors.blueAccent,
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.add, color: Colors.white, size: 30),
                onPressed: () => setState(() => _selectedIndex = 2),
              ),
            ),

            IconButton(
              icon: const Icon(Icons.chat),
              onPressed: () => setState(() => _selectedIndex = 3),
            ),
            IconButton(
              icon: const Icon(Icons.person),
              onPressed: () => setState(() => _selectedIndex = 4),
            ),
          ],
        ),
      ),
    );
  }
}
