/// Backend rows — same shapes as web/src/lib/api/types.ts.
library;

int? _int(Object? v) => v == null ? null : (v is int ? v : int.tryParse('$v'));
String? _str(Object? v) => v?.toString();
bool _bool(Object? v) => v == true || v == 1 || v == '1';

/// Row of the `vwCars` view.
class Car {
  final int id;
  final int brandId;
  final int? carModelId;
  final int? bodyTypeId;
  final int? manufacturedYear;
  final int? importedYear;
  final Object? price;
  final int? mileage;
  final String? fuelType;
  final String? transmission;
  final String? driveType;
  final String? steering;
  final String? vehicleType;
  final Object? engineCapacity;
  final String? color;
  final String? interiorColor;
  final String? phonenumber;
  final String? description;
  final int? viewCount;

  /// "Дугаар харах" taps (one per visitor per 6 hours).
  final int? phoneViewCount;
  final bool isFeatured;
  final String status;
  final String? createdAt;
  final String? name;
  final String? brandName;
  final String? modelName;
  final String? bodyTypeName;
  final String? locationName;
  final String? sellerName;
  final int? dealerId;
  final String? dealerName;
  final String? dealerLogo;
  final String? sellerPhone;
  final String? image;

  const Car({
    required this.id,
    required this.brandId,
    this.carModelId,
    this.bodyTypeId,
    this.manufacturedYear,
    this.importedYear,
    this.price,
    this.mileage,
    this.fuelType,
    this.transmission,
    this.driveType,
    this.steering,
    this.vehicleType,
    this.engineCapacity,
    this.color,
    this.interiorColor,
    this.phonenumber,
    this.description,
    this.viewCount,
    this.phoneViewCount,
    this.isFeatured = false,
    this.status = 'active',
    this.createdAt,
    this.name,
    this.brandName,
    this.modelName,
    this.bodyTypeName,
    this.locationName,
    this.sellerName,
    this.dealerId,
    this.dealerName,
    this.dealerLogo,
    this.sellerPhone,
    this.image,
  });

  factory Car.fromJson(Map<String, dynamic> j) => Car(
        id: _int(j['id'])!,
        brandId: _int(j['brand_id']) ?? 0,
        carModelId: _int(j['car_model_id']),
        bodyTypeId: _int(j['body_type_id']),
        manufacturedYear: _int(j['manufactured_year']),
        importedYear: _int(j['imported_year']),
        price: j['price'],
        mileage: _int(j['mileage']),
        fuelType: _str(j['fuel_type']),
        transmission: _str(j['transmission']),
        driveType: _str(j['drive_type']),
        steering: _str(j['steering']),
        vehicleType: _str(j['vehicle_type']),
        engineCapacity: j['engine_capacity'],
        color: _str(j['color']),
        interiorColor: _str(j['interior_color']),
        phonenumber: _str(j['phonenumber']),
        description: _str(j['description']),
        viewCount: _int(j['view_count']),
        phoneViewCount: _int(j['phone_view_count']),
        isFeatured: _bool(j['is_featured']),
        status: _str(j['status']) ?? 'active',
        createdAt: _str(j['created_at']),
        name: _str(j['name']),
        brandName: _str(j['brand_name']),
        modelName: _str(j['model_name']),
        bodyTypeName: _str(j['body_type_name']),
        locationName: _str(j['location_name']),
        sellerName: _str(j['seller_name']),
        dealerId: _int(j['dealer_id']),
        dealerName: _str(j['dealer_name']),
        dealerLogo: _str(j['dealer_logo']),
        sellerPhone: _str(j['seller_phone']),
        image: _str(j['image']),
      );

  /// "Toyota Prius"
  String get title {
    final t = [brandName, modelName].whereType<String>().where((s) => s.isNotEmpty).join(' ');
    return t.isNotEmpty ? t : (name ?? 'Машин');
  }

  /// "Toyota Prius 2015"
  String get titleWithYear => '$title${manufacturedYear != null ? ' $manufacturedYear' : ''}';

  String? get contactPhone => (phonenumber?.isNotEmpty ?? false) ? phonenumber : sellerPhone;
  bool get sold => status == 'sold';
}

class Brand {
  final int id;
  final String name;
  final String? logo;
  const Brand({required this.id, required this.name, this.logo});
  factory Brand.fromJson(Map<String, dynamic> j) => Brand(id: _int(j['id'])!, name: _str(j['name']) ?? '', logo: _str(j['logo']));
}

class CarModel {
  final int id;
  final String name;
  const CarModel({required this.id, required this.name});
  factory CarModel.fromJson(Map<String, dynamic> j) => CarModel(id: _int(j['id'])!, name: _str(j['name']) ?? '');
}

class BodyType {
  final int id;
  final String name;
  final String? image;
  final int carCount;
  const BodyType({required this.id, required this.name, this.image, this.carCount = 0});
  factory BodyType.fromJson(Map<String, dynamic> j) =>
      BodyType(id: _int(j['id'])!, name: _str(j['name']) ?? '', image: _str(j['image']), carCount: _int(j['car_count']) ?? 0);
}

class Location {
  final int id;
  final String name;
  const Location({required this.id, required this.name});
  factory Location.fromJson(Map<String, dynamic> j) => Location(id: _int(j['id'])!, name: _str(j['name']) ?? '');
}

class Dealer {
  final int id;
  final String name;
  final String? phonenumber;
  final String? logo;
  final String? address;
  final int carCount;
  const Dealer({required this.id, required this.name, this.phonenumber, this.logo, this.address, this.carCount = 0});
  factory Dealer.fromJson(Map<String, dynamic> j) => Dealer(
        id: _int(j['id'])!,
        name: _str(j['name']) ?? '',
        phonenumber: _str(j['phonenumber']),
        logo: _str(j['logo']),
        address: _str(j['address']),
        carCount: _int(j['car_count']) ?? 0,
      );
}

class WebUser {
  final int id;
  final String? phonenumber;
  final String? firstname;
  const WebUser({required this.id, this.phonenumber, this.firstname});
  factory WebUser.fromJson(Map<String, dynamic> j) => WebUser(id: _int(j['id'])!, phonenumber: _str(j['phonenumber']), firstname: _str(j['firstname']));
  Map<String, dynamic> toJson() => {'id': id, 'phonenumber': phonenumber, 'firstname': firstname};

  /// Name if the user has one, else the phone number.
  String get displayName => (firstname?.isNotEmpty ?? false) ? firstname! : (phonenumber ?? '');
}

class Session {
  final String token;
  final WebUser user;
  const Session(this.token, this.user);
}

class ListPage<T> {
  final List<T> rows;
  final int count;
  const ListPage(this.rows, this.count);
}

class MessageReply {
  final int id;
  final String reply;
  final String? createdAt;
  const MessageReply({required this.id, required this.reply, this.createdAt});
  factory MessageReply.fromJson(Map<String, dynamic> j) =>
      MessageReply(id: _int(j['id']) ?? 0, reply: _str(j['reply']) ?? '', createdAt: _str(j['created_at']));
}

class MyMessage {
  final int id;
  final String message;

  /// Latest answer only (list preview); [replies] has them all, oldest first.
  final String? reply;
  final String? repliedAt;
  final List<MessageReply> replies;

  /// Answers the visitor hasn't opened yet (server-side).
  final int unread;
  final int? carId;

  /// "new" until the team marks it "done".
  final String? status;
  final String? createdAt;
  const MyMessage({
    required this.id,
    required this.message,
    this.reply,
    this.repliedAt,
    this.replies = const [],
    this.unread = 0,
    this.carId,
    this.status,
    this.createdAt,
  });

  /// Every answer; older backends only send the latest as `reply`.
  List<MessageReply> get allReplies => replies.isNotEmpty ? replies : [if (reply != null) MessageReply(id: 0, reply: reply!, createdAt: repliedAt)];
  factory MyMessage.fromJson(Map<String, dynamic> j) => MyMessage(
        id: _int(j['id'])!,
        message: _str(j['message']) ?? '',
        reply: (_str(j['reply'])?.isNotEmpty ?? false) ? _str(j['reply']) : null,
        repliedAt: _str(j['replied_at']),
        replies: ((j['replies'] as List?) ?? []).whereType<Map<String, dynamic>>().map(MessageReply.fromJson).toList(),
        unread: _int(j['unread']) ?? 0,
        carId: _int(j['car_id']),
        status: _str(j['status']),
        createdAt: _str(j['created_at']),
      );
}
