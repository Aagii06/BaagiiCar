import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/l10n/app_localizations.dart';
import 'package:mashinuud_app/screens/shell.dart';
import 'package:mashinuud_app/state/stores.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Stores.load();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      locale: const Locale('mn'),
      supportedLocales: const [Locale('en'), Locale('mn')],
      debugShowCheckedModeBanner: false,
      title: 'Cardealer',
      theme: AppTheme.light,
      home: const Shell(),
    );
  }
}
