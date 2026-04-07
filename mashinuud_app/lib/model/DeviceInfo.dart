import 'package:json_annotation/json_annotation.dart';

part 'DeviceInfo.g.dart';

@JsonSerializable()
class DeviceInfo {
  String? osName;
  String? osVersion;

  DeviceInfo({this.osName, this.osVersion});

  factory DeviceInfo.fromJson(Map<String, dynamic> json) =>
      _$DeviceInfoFromJson(json);

  Map<String, dynamic> toJson() => _$DeviceInfoToJson(this);
}
