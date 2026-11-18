import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/app_bar.dart';
import 'package:mashinuud_app/app/i18n.dart';

/// AI assistant behind the round button — full screen; the AI itself is not connected yet.
class AiChatScreen extends StatelessWidget {
  const AiChatScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppPalette.background,
        body: Column(children: [
          Container(
            width: double.infinity,
            color: AppPalette.primary,
            child: SafeArea(
              bottom: false,
              child: Stack(children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                  child: Column(children: [
                    const Text('Cardealer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      _ring(const LogoMark(size: 36)),
                      const SizedBox(width: 12),
                      _ring(const Icon(Icons.smart_toy_outlined, color: AppPalette.primary)),
                    ]),
                    const SizedBox(height: 12),
                    Text(tr('AI туслах'), style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(tr('Машин сонголт, ерөнхий асуултад хариулна'), style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12)),
                  ]),
                ),
                Positioned(
                  right: 4,
                  top: 4,
                  child: IconButton(
                    tooltip: tr('Хаах'),
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded, color: Colors.white),
                  ),
                ),
              ]),
            ),
          ),
          // The AI thread will live here once it is connected (messages.type = "ai").
          Expanded(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                CircleAvatar(radius: 28, backgroundColor: AppPalette.primarySoft, child: Icon(Icons.smart_toy_outlined, color: AppPalette.primary, size: 28)),
                SizedBox(height: 14),
                Text(tr('AI чат хүлээгдэж байна'), style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                SizedBox(height: 6),
                Text(tr('Зарын тухай асуултаа зар дээрх чат товчоор илгээгээрэй.'),
                    textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: AppPalette.mutedForeground)),
              ]),
            ),
          ),
        ]),
      );

  Widget _ring(Widget child) => Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, border: Border.all(color: Colors.white60, width: 2)),
        alignment: Alignment.center,
        child: child,
      );
}
