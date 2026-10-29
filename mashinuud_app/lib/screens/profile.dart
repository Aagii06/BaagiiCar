import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/car_chat.dart';
import 'package:mashinuud_app/screens/help.dart';
import 'package:mashinuud_app/screens/messages.dart';
import 'package:mashinuud_app/screens/saved.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/app_bar.dart';
import 'package:mashinuud_app/widgets/common.dart';

/// "Профайл" tab: phone-code sign-in, or the user card with messages / saved / compare / help and sign-out.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: const TabAppBar(title: 'Профайл'),
        body: ListenableBuilder(
          listenable: Stores.auth,
          builder: (context, _) {
            final user = Stores.auth.user;
            if (user == null) {
              return ListView(padding: const EdgeInsets.all(16), children: [
                const Panel(child: PhoneCodeForm()),
                const SizedBox(height: 12),
                // Admins / dealers sign in on the admin panel itself (phone + password).
                TextButton.icon(
                  onPressed: () => Stores.mode.setAdmin(true),
                  icon: const Icon(Icons.admin_panel_settings_outlined, size: 18),
                  label: const Text('Админ / Дилераар нэвтрэх'),
                  style: TextButton.styleFrom(foregroundColor: AppPalette.primary, textStyle: const TextStyle(fontWeight: FontWeight.w600)),
                ),
              ]);
            }
            return _Account(key: ValueKey(user.id));
          },
        ),
      );
}

class _Account extends StatefulWidget {
  const _Account({super.key});
  @override
  State<_Account> createState() => _AccountState();
}

class _AccountState extends State<_Account> {
  int _unread = 0;

  @override
  void initState() {
    super.initState();
    _refreshUnread();
  }

  Future<void> _refreshUnread() async {
    try {
      final n = await unreadTotal();
      if (mounted) setState(() => _unread = n);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final user = Stores.auth.user!;
    Future<void> push(Widget page) async {
      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
      _refreshUnread();
    }

    return RefreshIndicator(
      color: AppPalette.primary,
      onRefresh: _refreshUnread,
      child: ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 96), children: [
        Panel(
          child: Row(children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(color: AppPalette.primarySoft, shape: BoxShape.circle),
              child: const Icon(Icons.person_rounded, color: AppPalette.primary, size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(user.displayName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                if (user.phonenumber != null) Text(user.phonenumber!, style: const TextStyle(fontSize: 14, color: AppPalette.mutedForeground)),
              ]),
            ),
          ]),
        ),
        const SizedBox(height: 12),
        ListenableBuilder(
          listenable: Listenable.merge([Stores.favorites, Stores.compare]),
          builder: (context, _) => Panel(
            padding: EdgeInsets.zero,
            child: Column(children: [
              _Link(icon: Icons.chat_bubble_outline_rounded, label: 'Мессеж', count: _unread, alert: true, onTap: () => push(const MessagesScreen())),
              const Divider(height: 1),
              _Link(icon: Icons.favorite_border_rounded, label: 'Хадгалсан', count: Stores.favorites.ids.length, onTap: () => push(const SavedScreen())),
              const Divider(height: 1),
              _Link(icon: Icons.compare_arrows_rounded, label: 'Харьцуулалт', count: Stores.compare.ids.length, onTap: () => Stores.shell.go(ShellController.compare)),
              const Divider(height: 1),
              _Link(icon: Icons.support_rounded, label: 'Тусламж', onTap: () => push(const HelpScreen())),
            ]),
          ),
        ),
        const SizedBox(height: 12),
        Material(
          color: AppPalette.card,
          borderRadius: BorderRadius.circular(AppRadius.xl),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: Stores.auth.signOut,
            child: const SizedBox(
              height: 56,
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.logout_rounded, size: 18, color: AppPalette.destructive),
                SizedBox(width: 8),
                Text('Гарах', style: TextStyle(fontWeight: FontWeight.w600, color: AppPalette.destructive)),
              ]),
            ),
          ),
        ),
      ]),
    );
  }
}

class _Link extends StatelessWidget {
  final IconData icon;
  final String label;
  final int count;
  final bool alert;
  final VoidCallback onTap;
  const _Link({required this.icon, required this.label, required this.onTap, this.count = 0, this.alert = false});

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(children: [
            Icon(icon, size: 20, color: AppPalette.mutedForeground),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600))),
            if (count > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: alert ? AppPalette.primary : AppPalette.primarySoft, borderRadius: BorderRadius.circular(99)),
                child: Text('$count', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: alert ? Colors.white : AppPalette.primary)),
              ),
            const SizedBox(width: 6),
            const Icon(Icons.chevron_right_rounded, color: AppPalette.mutedForeground),
          ]),
        ),
      );
}
