import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:mashinuud_app/app/constant.dart';

/// Улсын дугаар / арлын дугаараар татсан машины мэдээлэл.
class VehicleInfo {
  final String? plate;
  final String? vin;
  final String? brand;
  final String? model;
  final int? manufacturedYear;
  final int? importedYear;
  final String? fuelType;
  final String? transmission;
  final String? driveType;
  final String? steering;
  final double? engineCapacity;
  final int? doorCount;
  final String? color;

  const VehicleInfo({
    this.plate,
    this.vin,
    this.brand,
    this.model,
    this.manufacturedYear,
    this.importedYear,
    this.fuelType,
    this.transmission,
    this.driveType,
    this.steering,
    this.engineCapacity,
    this.doorCount,
    this.color,
  });

  factory VehicleInfo.fromJson(Map<String, dynamic> json) {
    int? toInt(dynamic v) => v == null ? null : int.tryParse('$v');
    return VehicleInfo(
      plate: json['plate'] as String?,
      vin: json['vin'] as String?,
      brand: json['brand'] as String?,
      model: json['model'] as String?,
      manufacturedYear: toInt(json['manufactured_year']),
      importedYear: toInt(json['imported_year']),
      fuelType: json['fuel_type'] as String?,
      transmission: json['transmission'] as String?,
      driveType: json['drive_type'] as String?,
      steering: json['steering'] as String?,
      engineCapacity: json['engine_capacity'] == null
          ? null
          : double.tryParse('${json['engine_capacity']}'),
      doorCount: toInt(json['door_count']),
      color: json['color'] as String?,
    );
  }
}

class VehicleLookupException implements Exception {
  final String message;
  const VehicleLookupException(this.message);

  @override
  String toString() => message;
}

class VehicleLookupService {
  static Future<VehicleInfo> lookup({String? plate, String? vin}) async {
    final uri = Uri.parse(
      '${AppConstants.apiUrl}/web/cars/vehicle-lookup',
    ).replace(
      queryParameters: {
        if (plate != null && plate.trim().isNotEmpty) 'plate': plate.trim(),
        if (vin != null && vin.trim().isNotEmpty) 'vin': vin.trim(),
      },
    );
    final client = HttpClient()
      ..connectionTimeout = const Duration(seconds: 10);
    try {
      final request = await client.getUrl(uri);
      final response = await request.close().timeout(
        const Duration(seconds: 15),
      );
      final body =
          jsonDecode(await response.transform(utf8.decoder).join())
              as Map<String, dynamic>;
      if (body['success'] == true) {
        return VehicleInfo.fromJson(body['data'] as Map<String, dynamic>);
      }
      final errors = body['errors'] as List?;
      throw VehicleLookupException(
        errors != null && errors.isNotEmpty
            ? '${errors.first['message']}'
            : body['message'] as String? ?? 'Машины мэдээлэл олдсонгүй',
      );
    } on VehicleLookupException {
      rethrow;
    } on Exception {
      throw const VehicleLookupException('Сервертэй холбогдож чадсангүй');
    } finally {
      client.close();
    }
  }
}
