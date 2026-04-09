import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';

import 'package:mashinuud_app/data/car_body_types.dart';

class CarBodyTypes extends StatelessWidget {
  const CarBodyTypes({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      itemCount: carBodyTypes.length,
      itemBuilder: (context, index) {
        final bodyType = carBodyTypes[index];
        return Center(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 8.0),
            padding: const EdgeInsets.all(8.0),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.all(Radius.circular(8)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: bodyType.asset
                ? Image.asset(
                    bodyType.image,
                    width: 40,
                    height: 40,
                    fit: BoxFit.contain,
                  )
                : Image.network(
                    bodyType.image,
                    width: 40,
                    height: 40,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return SizedBox(
                        width: 40,
                        height: 40,
                        child: SpinKitFadingCircle(
                          color: Colors.blueGrey,
                          size: 30.0,
                        ),
                      );
                    },
                  ),
          ),
        );
      },
    );
  }
}
