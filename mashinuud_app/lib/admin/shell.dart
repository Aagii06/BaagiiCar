import 'package:flutter/material.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/screens/car_form.dart';
import 'package:mashinuud_app/admin/screens/cars.dart';
import 'package:mashinuud_app/admin/screens/dashboard.dart';
import 'package:mashinuud_app/admin/screens/login.dart';
import 'package:mashinuud_app/admin/screens/messages.dart';
import 'package:mashinuud_app/admin/screens/profile.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/app_bar.dart';
import 'package:mashinuud_app/widgets/logo_loader.dart';

/// Which admin tab shows, and a status filter handed to the Зарууд tab (dashboard tiles).
class AdminNav extends ChangeNotifier {
  static const home = 0, cars = 1, messages = 2, profile = 3;
  int tab = home;

  /// Read once by the Зарууд tab.
  List<String>? pendingStatuses;
  int? pendingDealer;

  /// Bumped when an ad is saved, so lists reload.
  int revision = 0;

  void go(int next) {
    tab = next;
    notifyListeners();
  }

  void openCars({List<String> statuses = const [], int? dealerId}) {
    pendingStatuses = statuses;
    pendingDealer = dealerId;
    go(cars);
  }

  void changed() {
    revision++;
    notifyListeners();
  }
}

final adminNav = AdminNav();

/// The admin half: its sign-in page until someone is signed in, then the panel.
class AdminRoot extends StatefulWidget {
  const AdminRoot({super.key});
  @override
  State<AdminRoot> createState() => _AdminRootState();
}

class _AdminRootState extends State<AdminRoot> {
  /// A saved session is being checked: the full-screen loader shows until it's confirmed or dropped.
  bool _checking = AdminApi.session.signedIn;

  @override
  void initState() {
    super.initState();
    // Slides the session forward and drops a revoked one.
    AdminApi.session.refresh().whenComplete(() {
      if (mounted) setState(() => _checking = false);
    });
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: AdminApi.session,
        builder: (context, _) => _checking
            ? const FullScreenLoader()
            : AdminApi.session.signedIn
                ? AdminShell(key: ValueKey(AdminApi.session.user!.id))
                : const AdminLoginScreen(),
      );
}

/// Bottom nav with four tabs and the "+" (new ad) button in its notch (admin PanelShell).
class AdminShell extends StatefulWidget {
  const AdminShell({super.key});
  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  @override
  void initState() {
    super.initState();
    adminNav.tab = AdminNav.home;
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: adminNav,
        builder: (context, _) => PopScope(
          canPop: adminNav.tab == AdminNav.home,
          onPopInvokedWithResult: (didPop, _) {
            if (!didPop) adminNav.go(AdminNav.home);
          },
          child: Scaffold(
            appBar: AppBar(title: const Logo(), titleSpacing: 16),
            body: IndexedStack(
              index: adminNav.tab,
              children: const [DashboardTab(), CarsTab(), MessagesTab(), AdminProfileTab()],
            ),
            floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
            floatingActionButton: FloatingActionButton(
              heroTag: 'admin-new-ad',
              tooltip: 'Зар нэмэх',
              backgroundColor: AppPalette.primary,
              foregroundColor: Colors.white,
              shape: const CircleBorder(),
              elevation: 4,
              onPressed: () async {
                final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const CarEditScreen()));
                if (saved == true) adminNav.changed();
              },
              child: const Icon(Icons.add_rounded, size: 30),
            ),
            bottomNavigationBar: BottomAppBar(
              color: Colors.white,
              surfaceTintColor: Colors.white,
              shape: const CircularNotchedRectangle(),
              notchMargin: 6,
              padding: EdgeInsets.zero,
              height: 64,
              child: Row(children: [
                _tab(AdminNav.home, Icons.bar_chart_rounded, 'Самбар'),
                _tab(AdminNav.cars, Icons.directions_car_outlined, 'Зарууд'),
                const SizedBox(width: 72),
                _tab(AdminNav.messages, Icons.chat_bubble_outline_rounded, 'Мессеж'),
                _tab(AdminNav.profile, Icons.person_outline_rounded, 'Профайл'),
              ]),
            ),
          ),
        ),
      );

  Widget _tab(int index, IconData icon, String label) {
    final on = adminNav.tab == index;
    final color = on ? AppPalette.primary : AppPalette.mutedForeground;
    return Expanded(
      child: InkWell(
        onTap: () => adminNav.go(index),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, color: color, size: 23),
          const SizedBox(height: 3),
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
        ]),
      ),
    );
  }
}
