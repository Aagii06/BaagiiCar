import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:mashinuud_app/app/i18n.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/l10n/app_localizations.dart';
import 'package:mashinuud_app/admin/lock.dart';
import 'package:mashinuud_app/admin/shell.dart';
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
      navigatorKey: rootNavigatorKey,
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
      // Admins / dealers get the admin panel; everyone else the customer screens.
      // A new language remounts the customer screens (the admin side does it in admin/shell.dart).
      home: ListenableBuilder(
        listenable: Listenable.merge([Stores.mode, appLang]),
        builder: (context, _) => Stores.mode.admin ? const AdminRoot() : Shell(key: ValueKey(appLang.code)),
      ),
    );
  }
}
