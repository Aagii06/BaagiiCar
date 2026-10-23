import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/api/models.dart';

/// Every call the app makes — the same endpoints as the website (web/src/lib/api/*).
class Api {
  static const _newest = [
    {'selector': 'created_at', 'desc': true},
    {'selector': 'id', 'desc': true},
  ];

  static List<T> _rows<T>(Map<String, dynamic> res, T Function(Map<String, dynamic>) parse) =>
      ((res['data']?['rows'] as List?) ?? []).cast<Map<String, dynamic>>().map(parse).toList();

  static Page<T> _page<T>(Map<String, dynamic> res, T Function(Map<String, dynamic>) parse) =>
      Page(_rows(res, parse), (res['data']?['count'] as num?)?.toInt() ?? 0);

  // --- cars -----------------------------------------------------------------

  static Future<Page<Car>> searchCars(CarSearch s) async {
    final sort = <Map<String, Object>>[
      if (s.featuredFirst) {'selector': 'is_featured', 'desc': true},
      ...s.sort.order,
    ];
    final res = await apiFetch('/web/base/vwCars${listQuery(filter: s.conditions, sort: sort, take: s.pageSize, skip: (s.page - 1) * s.pageSize)}');
    return _page(res, Car.fromJson);
  }

  /// Featured ads; the newest ones when none are featured yet.
  static Future<List<Car>> featuredCars([int take = 6]) async {
    final res = await apiFetch('/web/base/vwCars${listQuery(filter: [
          ['status', '=', 'active'],
          ['is_featured', '=', 1],
        ], sort: _newest, take: take)}');
    final rows = _rows(res, Car.fromJson);
    if (rows.isNotEmpty) return rows;
    return (await searchCars(CarSearch(pageSize: take))).rows;
  }

  static Future<Car?> getCar(int id) async {
    final res = await apiFetch('/web/base/vwCars/$id');
    final data = res['data'];
    return data is Map<String, dynamic> ? Car.fromJson(data) : null;
  }

  static Future<List<Car>> getCarsByIds(List<int> ids) async {
    if (ids.isEmpty) return [];
    final res = await apiFetch('/web/base/vwCars${listQuery(filter: [
          ['id', 'in', ids],
        ], sort: _newest, take: ids.length)}');
    return _rows(res, Car.fromJson);
  }

  /// Photo file names of an ad, in their saved order.
  static Future<List<String>> getCarPhotos(int carId) async {
    final res = await apiFetch('/web/base/allFiles${listQuery(filter: [
          ['data_id', '=', carId],
        ])}');
    final rows = ((res['data']?['rows'] as List?) ?? []).cast<Map<String, dynamic>>().toList()
      ..sort((a, b) {
        final o = ((a['order'] as num?) ?? 0).compareTo((b['order'] as num?) ?? 0);
        return o != 0 ? o : ((a['id'] as num?) ?? 0).compareTo((b['id'] as num?) ?? 0);
      });
    return rows.map((r) => r['generated_name']?.toString()).whereType<String>().where((n) => n.isNotEmpty).toList();
  }

  // --- catalog --------------------------------------------------------------

  static Future<List<Brand>> getBrands() async {
    final res = await apiFetch('/web/base/vwBrands');
    final raw = ((res['data']?['rows'] as List?) ?? []).cast<Map<String, dynamic>>().toList()
      ..sort((a, b) {
        final o = ((a['sort_order'] as num?) ?? 999).compareTo((b['sort_order'] as num?) ?? 999);
        return o != 0 ? o : '${a['name']}'.compareTo('${b['name']}');
      });
    return raw.map(Brand.fromJson).toList();
  }

  /// Alphabetical, with the "Other" catch-all model last.
  static Future<List<CarModel>> getModels(int brandId) async {
    final res = await apiFetch('/web/base/carModels${listQuery(filter: [
          ['brand_id', '=', brandId],
        ])}');
    final rows = _rows(res, CarModel.fromJson)
      ..sort((a, b) {
        final o = (a.name == 'Other' ? 1 : 0) - (b.name == 'Other' ? 1 : 0);
        return o != 0 ? o : a.name.compareTo(b.name);
      });
    return rows;
  }

  static Future<List<BodyType>> getBodyTypes() async {
    final res = await apiFetch('/web/base/vwBodyTypes');
    final raw = ((res['data']?['rows'] as List?) ?? []).cast<Map<String, dynamic>>().toList()
      ..sort((a, b) => ((a['sort_order'] as num?) ?? 999).compareTo((b['sort_order'] as num?) ?? 999));
    return raw.map(BodyType.fromJson).toList();
  }

  static Future<List<Location>> getLocations() async {
    final res = await apiFetch('/web/base/locations');
    final raw = ((res['data']?['rows'] as List?) ?? []).cast<Map<String, dynamic>>().toList()
      ..sort((a, b) => ((a['sort_order'] as num?) ?? 999).compareTo((b['sort_order'] as num?) ?? 999));
    return raw.map(Location.fromJson).toList();
  }

  // --- dealers --------------------------------------------------------------

  /// Most listings first, then by name.
  static Future<List<Dealer>> getDealers() async {
    final res = await apiFetch('/web/dealers');
    return _rows(res, Dealer.fromJson)
      ..sort((a, b) {
        final o = b.carCount.compareTo(a.carCount);
        return o != 0 ? o : a.name.compareTo(b.name);
      });
  }

  static Future<Dealer> getDealer(int id) async {
    final res = await apiFetch('/web/dealers/$id');
    return Dealer.fromJson(res['data'] as Map<String, dynamic>);
  }

  static Future<Page<Car>> getDealerCars(int id, {int take = 12}) async {
    final res = await apiFetch('/web/dealers/$id/cars?take=$take&skip=0');
    return _page(res, Car.fromJson);
  }

  // --- sign-in (phone + 4-digit code) and chat ------------------------------

  /// Texts a 4-digit code; returns seconds until another may be requested.
  static Future<int> sendLoginCode(String phone) async {
    final res = await apiFetch('/web/auth/otp-send', method: 'POST', body: {'phonenumber': phone});
    return (res['data']?['resend_in'] as num?)?.toInt() ?? 60;
  }

  /// Checks the code; an unknown number is registered on the spot (named "Зочин").
  static Future<Session> loginWithCode(String phone, String code) async {
    final res = await apiFetch('/web/auth/otp-login', method: 'POST', body: {'phonenumber': phone, 'code': code});
    final data = res['data'] as Map<String, dynamic>;
    return Session(data['token'] as String, WebUser.fromJson(data['loggedUser'] as Map<String, dynamic>));
  }

  /// Fresh profile; throws ApiError(401) once the token is no longer valid.
  static Future<WebUser> getMe(String token) async {
    final res = await apiFetch('/web/auth/me', token: token);
    return WebUser.fromJson(res['data'] as Map<String, dynamic>);
  }

  /// The signed-in visitor's own messages, newest first.
  static Future<List<MyMessage>> getMyMessages(String token) async {
    final res = await apiFetch('/web/messages', token: token);
    return _rows(res, MyMessage.fromJson);
  }

  /// Question about an ad, stored for the team (name and number come from the token).
  static Future<void> sendMessage({required String token, required String message, int? carId}) async {
    await apiFetch('/web/messages', method: 'POST', token: token, body: {
      'type': 'car',
      'message': message,
      if (carId != null) 'car_id': carId,
    });
  }
}

enum CarSort {
  newest('Шинэ нь эхэндээ', [
    {'selector': 'created_at', 'desc': true},
    {'selector': 'id', 'desc': true},
  ]),
  oldest('Хуучин нь эхэндээ', [
    {'selector': 'created_at', 'desc': false},
    {'selector': 'id', 'desc': true},
  ]),
  priceAsc('Үнэ өсөхөөр', [
    {'selector': 'price', 'desc': false},
    {'selector': 'id', 'desc': true},
  ]),
  priceDesc('Үнэ буурахаар', [
    {'selector': 'price', 'desc': true},
    {'selector': 'id', 'desc': true},
  ]),
  views('Их үзсэн', [
    {'selector': 'view_count', 'desc': true},
    {'selector': 'id', 'desc': true},
  ]);

  final String label;
  final List<Map<String, Object>> order;
  const CarSort(this.label, this.order);
}

/// Search filters for `/cars`; prices in MNT.
class CarSearch {
  final List<int> brandIds;
  final int? modelId;
  final List<int> bodyTypeIds;
  final int? locationId;
  final int? dealerId;
  final int? yearFrom;
  final int? yearTo;
  final int? importedFrom;
  final int? importedTo;
  final int? priceMin;
  final int? priceMax;
  final List<String> fuelTypes;
  final String? steering;
  final String? text;
  final CarSort sort;
  final bool featuredFirst;
  final int page;
  final int pageSize;

  const CarSearch({
    this.brandIds = const [],
    this.modelId,
    this.bodyTypeIds = const [],
    this.locationId,
    this.dealerId,
    this.yearFrom,
    this.yearTo,
    this.importedFrom,
    this.importedTo,
    this.priceMin,
    this.priceMax,
    this.fuelTypes = const [],
    this.steering,
    this.text,
    this.sort = CarSort.newest,
    this.featuredFirst = false,
    this.page = 1,
    this.pageSize = 12,
  });

  List<Condition> get conditions {
    final c = <Condition>[
      ['status', '=', 'active'],
    ];
    if (brandIds.isNotEmpty) c.add(['brand_id', 'in', brandIds]);
    if (modelId != null) c.add(['car_model_id', '=', modelId]);
    if (bodyTypeIds.isNotEmpty) c.add(['body_type_id', 'in', bodyTypeIds]);
    if (locationId != null) c.add(['location_id', '=', locationId]);
    if (dealerId != null) c.add(['dealer_id', '=', dealerId]);
    if (yearFrom != null) c.add(['manufactured_year', '>=', yearFrom]);
    if (yearTo != null) c.add(['manufactured_year', '<=', yearTo]);
    if (importedFrom != null) c.add(['imported_year', '>=', importedFrom]);
    if (importedTo != null) c.add(['imported_year', '<=', importedTo]);
    if (priceMin != null) c.add(['price', '>=', priceMin]);
    if (priceMax != null) c.add(['price', '<=', priceMax]);
    if (fuelTypes.isNotEmpty) c.add(['fuel_type', 'in', fuelTypes]);
    if (steering != null) c.add(['steering', '=', steering]);
    final q = text?.trim() ?? '';
    if (q.isNotEmpty) {
      c.add([
        ['brand_name', 'contains', q],
        'or',
        ['model_name', 'contains', q],
      ]);
    }
    return c;
  }
}
