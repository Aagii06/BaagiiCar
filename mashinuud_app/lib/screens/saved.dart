import 'package:flutter/material.dart';
import 'package:mashinuud_app/api/api.dart';
import 'package:mashinuud_app/api/models.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/car.dart';
import 'package:mashinuud_app/widgets/common.dart';

/// "Хадгалсан": ads hearted on this device. Fetched as on arrival; un-hearted cards just hide.
class SavedScreen extends StatelessWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ids = Stores.favorites.ids.toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Хадгалсан')),
      body: Loader<List<Car>>(
        fetch: () => Api.getCarsByIds(ids),
        loading: const Padding(padding: EdgeInsets.all(16), child: CarCardSkeleton(count: 3)),
        builder: (context, cars, _) => ListenableBuilder(
          listenable: Stores.favorites,
          builder: (context, _) {
            final rows = cars.where((c) => Stores.favorites.has(c.id)).toList();
            return ListView(padding: const EdgeInsets.all(16), children: [
              if (rows.isEmpty)
                EmptyView(
                  title: 'Хадгалсан зар алга',
                  description: 'Таалагдсан машиныхаа ♡ дээр дарж хадгална уу.',
                  icon: Icons.favorite_border_rounded,
                  action: PrimaryButton(
                    label: 'Машин хайх',
                    height: 44,
                    onTap: () {
                      Navigator.of(context).popUntil((r) => r.isFirst);
                      Stores.shell.openCars();
                    },
                  ),
                )
              else
                CarList(cars: rows),
            ]);
          },
        ),
      ),
    );
  }
}
