/// Rows the admin panel reads — the same shapes as admin/src/lib/api/types.ts.
/// Each wraps the backend's JSON map; getters read and coerce the fields.
library;

import 'dart:convert';

int? _int(Object? v) => v == null ? null : (v is int ? v : (v is num ? v.toInt() : int.tryParse('$v')));
String? _str(Object? v) => v == null ? null : '$v';
bool _bool(Object? v) => v == true || v == 1 || v == '1' || v == 'true';

abstract class Rec {
  final Map<String, dynamic> j;
  const Rec(this.j);
  int get id => _int(j['id']) ?? 0;
  String? s(String k) {
    final v = _str(j[k]);
    return v == null || v.isEmpty ? null : v;
  }

  int? i(String k) => _int(j[k]);
  bool b(String k) => _bool(j[k]);
}

class ListPage<T> {
  final List<T> rows;
  final int count;
  const ListPage(this.rows, this.count);
}

/// Row of the `vwCars` view.
class ACar extends Rec {
  const ACar(super.j);
  String? get code => s('code');
  int? get dealerId => i('dealer_id');
  int? get brandId => i('brand_id');
  int? get carModelId => i('car_model_id');
  int? get bodyTypeId => i('body_type_id');
  int? get locationId => i('location_id');
  int? get manufacturedYear => i('manufactured_year');
  int? get importedYear => i('imported_year');
  Object? get price => j['price'];
  int? get mileage => i('mileage');
  String? get fuelType => s('fuel_type');
  String? get transmission => s('transmission');
  String? get driveType => s('drive_type');
  String? get steering => s('steering');
  String? get vehicleType => s('vehicle_type');
  String? get autoboxData => s('autobox_data');
  String? get plateType => s('plate_type');
  bool get isLeasing => b('is_leasing');
  Object? get engineCapacity => j['engine_capacity'];
  String? get color => s('color');
  String? get interiorColor => s('interior_color');
  String? get vin => s('vin');
  String? get phonenumber => s('phonenumber');
  String? get description => s('description');
  int get viewCount => i('view_count') ?? 0;
  int get phoneViewCount => i('phone_view_count') ?? 0;
  int get favoriteCount => i('favorite_count') ?? 0;
  bool get isFeatured => b('is_featured');
  String? get rejectReason => s('reject_reason');
  String get status => s('status') ?? 'active';
  String? get createdAt => s('created_at');
  String? get deletedAt => s('deleted_at');
  String? get renewedAt => s('renewed_at');
  String? get listedAt => s('listed_at');
  String? get name => s('name');
  String? get brandName => s('brand_name');
  String? get modelName => s('model_name');
  String? get bodyTypeName => s('body_type_name');
  String? get locationName => s('location_name');
  String? get sellerName => s('seller_name');
  String? get sellerPhone => s('seller_phone');
  String? get sellerRole => s('seller_role');
  String? get dealerName => s('dealer_name');
  String? get dealerLogo => s('dealer_logo');
  String? get image => s('image');

  /// "Toyota Aqua 2016/2018": brand, model, then manufactured / imported year.
  String get title {
    final years = [manufacturedYear, importedYear].whereType<int>().join('/');
    final t = [brandName, modelName, years].where((p) => p != null && p.isNotEmpty).join(' ');
    return t.isNotEmpty ? t : (name ?? '');
  }

  /// What was saved from the registry lookup, or null for an ad typed in by hand.
  AutoboxData? get autobox {
    final raw = autoboxData;
    if (raw == null) return null;
    try {
      final d = jsonDecode(raw);
      if (d is Map<String, dynamic> && d['fields'] is Map) return AutoboxData(_str(d['plate']), (d['fields'] as Map).keys.map((k) => '$k').toList());
    } catch (_) {}
    return null;
  }
}

class AutoboxData {
  final String? plate;
  final List<String> fields;
  const AutoboxData(this.plate, this.fields);
}

class Brand extends Rec {
  const Brand(super.j);
  String get name => s('name') ?? '';
  String? get country => s('country');
  String? get logo => s('logo');
  int? get sortOrder => i('sort_order');
  int? get carCount => i('car_count');
}

class CarModel extends Rec {
  const CarModel(super.j);
  int? get brandId => i('brand_id');
  String get name => s('name') ?? '';
}

class BodyType extends Rec {
  const BodyType(super.j);
  String get name => s('name') ?? '';
  String? get image => s('image');
  int? get sortOrder => i('sort_order');
  int? get carCount => i('car_count');
}

class Location extends Rec {
  const Location(super.j);
  String get name => s('name') ?? '';
  int? get sortOrder => i('sort_order');
}

class CarFile extends Rec {
  const CarFile(super.j);
  String? get generatedName => s('generated_name');
  int get order => i('order') ?? 0;
}

/// Admin / dealer account (`users` table).
class AUser extends Rec {
  const AUser(super.j);
  String? get phonenumber => s('phonenumber');
  String? get phoneVerifiedAt => s('phone_verified_at');
  String? get phoneVerifyDeadline => s('phone_verify_deadline');
  String? get firstname => s('firstname');
  String? get lastname => s('lastname');
  String? get email => s('email');
  String? get role => s('role');
  String? get profile => s('profile');
  int? get dealerId => i('dealer_id');
  String get status => s('status') ?? 'active';
  bool get isAdmin => role == Roles.admin;

  /// Last name + first name, else the phone number.
  String get fullName {
    final n = [lastname, firstname].whereType<String>().join(' ');
    return n.isNotEmpty ? n : (phonenumber ?? '');
  }
}

/// Web visitor account (`customers` table).
class Customer extends Rec {
  const Customer(super.j);
  String? get phonenumber => s('phonenumber');
  String? get email => s('email');
  String? get firstname => s('firstname');
  String? get lastname => s('lastname');
  String? get profile => s('profile');
  String get status => s('status') ?? 'active';
  String? get createdAt => s('created_at');
  String? get lastLoginAt => s('last_login_at');

  String get displayName {
    final n = [lastname, firstname].whereType<String>().join(' ');
    return n.isNotEmpty ? n : (phonenumber ?? email ?? 'Нэргүй');
  }
}

class Feedback extends Rec {
  const Feedback(super.j);
  int? get customerId => i('customer_id');
  String? get name => s('name');
  String? get phonenumber => s('phonenumber');
  String? get email => s('email');
  String get message => s('message') ?? '';
  String get status => s('status') ?? 'new';
  String? get createdAt => s('created_at');
}

class Dealer extends Rec {
  const Dealer(super.j);
  String get name => s('name') ?? '';
  String? get logo => s('logo');
  String? get phonenumber => s('phonenumber');
  String? get email => s('email');
  String? get address => s('address');
  String? get description => s('description');
  String get status => s('status') ?? 'active';
  int? get carCount => i('car_count');

  /// The dealer's numbers / emails / addresses in their saved order (JSON list, else the single column).
  List<String> list(String field) {
    final single = {'phonenumbers': phonenumber, 'emails': email, 'addresses': address}[field];
    final raw = s(field);
    if (raw != null) {
      try {
        final l = jsonDecode(raw);
        if (l is List && l.isNotEmpty) return l.map((e) => '$e').toList();
      } catch (_) {}
    }
    return single == null ? [] : [single];
  }

  List<String> get phones => list('phonenumbers');
}

class MessageReply extends Rec {
  const MessageReply(super.j);
  int? get messageId => i('message_id');
  String get reply => s('reply') ?? '';
  String? get createdAt => s('created_at');
  String? get updatedAt => s('updated_at');
}

/// Visitor message from the web chat box; [car] and [replies] are filled in by the API.
class Message extends Rec {
  final ACar? car;
  final List<MessageReply> replies;
  const Message(super.j, {this.car, this.replies = const []});
  String? get name => s('name');
  String get phonenumber => s('phonenumber') ?? '';
  String get message => s('message') ?? '';
  int? get carId => i('car_id');
  int? get createdBy => i('created_by');
  String get status => s('status') ?? 'new';
  String? get createdAt => s('created_at');

  Message withStatus(String next) => Message({...j, 'status': next}, car: car, replies: replies);
}

class Roles {
  static const admin = 'ADMIN';
  static const dealer = 'DEALER';
  static const customer = 'CUSTOMER';
  static const list = [admin, dealer];
  static String label(String? role) => switch (role) {
        admin => 'Админ',
        dealer => 'Дилер',
        customer => 'Хэрэглэгч',
        _ => role ?? '',
      };
}

/// Must match backend/config/constants.js — the save endpoint validates these.
class CarConst {
  static const fuelTypes = ['Бензин', 'Дизель', 'Хайбрид', 'Газ', 'Цахилгаан'];
  static const transmissions = ['Автомат', 'Механик', 'CVT', 'Типтроник'];
  static const driveTypes = ['FWD', 'RWD', '4WD'];
  static const steerings = ['Зүүн', 'Баруун'];
  static const vehicleTypes = ['Суудлын', 'Туулах чадвар сайтай', 'Олон зориулалттай', 'Ердийн тэвштэй автомашин', 'Бүхээгтэй', 'Микроавтобус', 'Ачааны', 'Автобус', 'Тусгай зориулалтын', 'Бусад'];
  static const plateTypes = ['Дугаар аваагүй', 'УБ дугаартай', 'Орон нутаг дугаартай'];
  static const exteriorColors = ['Цагаан', 'Хар', 'Саарал', 'Мөнгөлөг', 'Улаан', 'Цэнхэр', 'Ногоон', 'Шар', 'Улбар шар', 'Хүрэн', 'Бор', 'Шампань', 'Ягаан', 'Нил ягаан', 'Бусад'];
  static const interiorColors = ['Хар', 'Саарал', 'Бор', 'Шаргал', 'Цагаан', 'Хүрэн', 'Улаан', 'Хослол', 'Бусад'];

  /// An active ad can be renewed for free this many days after it was listed / last renewed.
  static const renewDays = 7;

  /// A deleted ad can be restored for this many days.
  static const restoreDays = 7;
}

/// Whole days (rounded up) from now until [days] days after a backend "YYYY-MM-DD HH:mm:ss" (+08:00); 0 once passed.
int daysUntil(String? value, int days) {
  if (value == null) return 0;
  final date = DateTime.tryParse('${value.replaceFirst(' ', 'T')}+08:00');
  if (date == null) return 0;
  final left = date.add(Duration(days: days)).difference(DateTime.now());
  return left.isNegative ? 0 : (left.inSeconds / 86400).ceil();
}
