import 'package:flutter/material.dart';
import 'layout/mainLayout.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Inovv App',
      theme: ThemeData(primarySwatch: Colors.blue, useMaterial3: true),
      // Апп эхлэхдээ шууд Layout-ыг дуудна
      home: const MainLayout(),
    );
  }
}
