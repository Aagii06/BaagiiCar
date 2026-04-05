import 'package:flutter/material.dart';
import 'package:mashinuud_app/l10n/locale.dart';
import 'package:mashinuud_app/screens/home.dart';

class Footer extends StatefulWidget {
  const Footer({super.key});

  @override
  State<Footer> createState() => _FooterState();
}

class _FooterState extends State<Footer> with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  late final loc = context.l10n;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _isPressed = false;

  List<Widget> get _pages => [
    const HomePage(),
    Center(child: Text(loc.search)),
    const Center(child: Text('Alerts')),
    const Center(child: Text('Messages')),
    const Center(child: Text('Profile')),
  ];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: _pages[_selectedIndex],

      floatingActionButton: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Container(
            width: 55 * _pulseAnimation.value,
            height: 55 * _pulseAnimation.value,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 5 * _pulseAnimation.value,
                  spreadRadius: 4 * _pulseAnimation.value,
                ),
              ],
            ),
            child: FloatingActionButton(
              onPressed: () => setState(() => _selectedIndex = 2),
              backgroundColor: Colors.blueAccent,
              shape: const CircleBorder(),
              elevation: 0,
              child: const Icon(Icons.add, size: 35, color: Colors.white),
            ),
          );
        },
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,

      bottomNavigationBar: BottomAppBar(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        height: 65,
        shape: const CircularNotchedRectangle(),
        notchMargin: 10.0,
        color: Colors.grey[800],
        child: Row(
          mainAxisSize: MainAxisSize.max,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  icon: Icon(
                    Icons.home,
                    color: _selectedIndex == 0
                        ? Colors.blueAccent
                        : Colors.white,
                  ),
                  onPressed: () => setState(() => _selectedIndex = 0),
                ),
                const SizedBox(width: 20),
                IconButton(
                  icon: Icon(
                    Icons.search,
                    color: _selectedIndex == 1
                        ? Colors.blueAccent
                        : Colors.white,
                  ),
                  onPressed: () => setState(() => _selectedIndex = 1),
                ),
              ],
            ),

            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                IconButton(
                  icon: Icon(
                    Icons.chat,
                    color: _selectedIndex == 3
                        ? Colors.blueAccent
                        : Colors.white,
                  ),
                  onPressed: () => setState(() => _selectedIndex = 3),
                ),
                const SizedBox(width: 20),
                IconButton(
                  icon: Icon(
                    Icons.person,
                    color: _selectedIndex == 4
                        ? Colors.blueAccent
                        : Colors.white,
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
