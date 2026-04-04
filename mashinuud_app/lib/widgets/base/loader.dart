import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:mashinuud_app/l10n/app_localizations.dart';

class Loader extends StatelessWidget {
  final bool isLoading;
  final String? title;
  final Widget child;

  const Loader({
    super.key,
    required this.isLoading,
    required this.child,
    this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading) ...[
          Container(color: Colors.black.withOpacity(0.2)),
          Center(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SpinKitFadingCircle(color: Colors.white, size: 60.0),
                  const SizedBox(height: 16),
                  Text(
                    title ?? AppLocalizations.of(context)!.please_wait,
                    style: const TextStyle(
                      fontSize: 20,
                      color: Colors.white,
                      decoration: TextDecoration.none,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}
