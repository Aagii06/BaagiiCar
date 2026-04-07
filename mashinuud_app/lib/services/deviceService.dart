import 'package:mashinuud_app/model/DeviceInfo.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'dart:io';

class DeviceService {
  DeviceService();

  static Future<DeviceInfo> getDeviceInfo() async {
    final deviceInfoPlugin = DeviceInfoPlugin();
    final result = DeviceInfo();
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfoPlugin.androidInfo;
      result.osName = 'Android';
      result.osVersion = androidInfo.version.release;
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfoPlugin.iosInfo;
      result.osName = 'iOS';
      result.osVersion = iosInfo.systemVersion;
    }
    return result;
  }
}
