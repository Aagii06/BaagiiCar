import 'package:flutter/material.dart';

import 'package:mashinuud_app/widgets/custom/carBrands.dart';
import 'package:mashinuud_app/widgets/custom/carBodyTypes.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        padding: const EdgeInsets.symmetric(vertical: 40.0, horizontal: 16.0),
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: 60, child: CarBrands()),
              SizedBox(height: 60, child: CarBodyTypes()),
            ],
          ),
        ),
      ),
    );
  }
}
