import 'package:flutter/material.dart';
import 'package:mashinuud_app/l10n/locale.dart';
import 'package:mashinuud_app/screens/home.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _selectedIndex = 0;

  List<Widget> get _pages => [
    const HomePage(),
    Center(child: Text(context.l10n.search)),
    const Center(child: Text('Alerts')),
    const Center(child: Text('Messages')),
    const Center(child: Text('Profile')),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: _pages[_selectedIndex],

      // 1. Голын товчийг тусад нь FloatingActionButton болгоно
      floatingActionButton: SizedBox(
        width: 70, // Хэмжээг нь эндээс тохируулж томруулна
        height: 70,
        child: FloatingActionButton(
          onPressed: () => setState(() => _selectedIndex = 2),
          backgroundColor: Colors.blueAccent, // Төв товчны өнгө
          shape: const CircleBorder(), // Бөөрөнхий хэлбэр
          elevation: 4, // Сүүдэр (дээшээ товойсон мэдрэмж өгнө)
          child: const Icon(Icons.add, size: 35, color: Colors.white),
        ),
      ),

      // 2. Байршлыг нь яг голд нь "шигтгэнэ"
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,

      bottomNavigationBar: BottomAppBar(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        height: 65,
        shape: const CircularNotchedRectangle(), // Голын товчны орох ховил
        notchMargin: 10.0, // Ховил болон товч хоорондын зай
        color: Colors.white,
        child: Row(
          mainAxisSize: MainAxisSize.max,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Зүүн талын товчлуурууд
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  icon: Icon(
                    Icons.home,
                    color: _selectedIndex == 0
                        ? Colors.blueAccent
                        : Colors.grey,
                  ),
                  onPressed: () => setState(() => _selectedIndex = 0),
                ),
                const SizedBox(width: 20), // Товч хоорондын зай
                IconButton(
                  icon: Icon(
                    Icons.search,
                    color: _selectedIndex == 1
                        ? Colors.blueAccent
                        : Colors.grey,
                  ),
                  onPressed: () => setState(() => _selectedIndex = 1),
                ),
              ],
            ),

            // Баруун талын товчлуурууд
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  icon: Icon(
                    Icons.chat,
                    color: _selectedIndex == 3
                        ? Colors.blueAccent
                        : Colors.grey,
                  ),
                  onPressed: () => setState(() => _selectedIndex = 3),
                ),
                const SizedBox(width: 20),
                IconButton(
                  icon: Icon(
                    Icons.person,
                    color: _selectedIndex == 4
                        ? Colors.blueAccent
                        : Colors.grey,
                  ),
                  onPressed: () => setState(() => _selectedIndex = 4),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
