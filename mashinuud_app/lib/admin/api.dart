import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Signed-in admin / dealer, kept on the device (like the panel's localStorage session).
class AdminSession extends ChangeNotifier {
  static const _tokenKey = 'baagii_car_admin_token';
  static const _userKey = 'baagii_car_admin_user';
  SharedPreferences? _prefs;
  String? _token;
  AUser? _user;

  String? get token => _token;
  AUser? get user => _user;
  bool get signedIn => _token != null && _user != null;
  bool get isAdmin => _user?.isAdmin ?? false;

  void load(SharedPreferences prefs) {
    _prefs = prefs;
    _token = prefs.getString(_tokenKey);
    final raw = prefs.getString(_userKey);
    if (raw != null) {
      try {
        _user = AUser(jsonDecode(raw) as Map<String, dynamic>);
      } catch (_) {}
    }
    if (_user == null) _token = null;
  }

  void _set(String token, AUser user) {
    _token = token;
    _user = user;
    _prefs?.setString(_tokenKey, token);
    _prefs?.setString(_userKey, jsonEncode(user.j));
    notifyListeners();
  }

  void signOut() {
    if (_token == null && _user == null) return;
    _token = null;
    _user = null;
    _prefs?.remove(_tokenKey);
    _prefs?.remove(_userKey);
    notifyListeners();
  }

  static bool _canUsePanel(AUser? u) => u?.role == Roles.admin || u?.role == Roles.dealer;

  /// Phone + password; only admins and dealers get a session.
  Future<void> login(String phone, String password) async {
    final res = await apiFetch('/api/users/login', method: 'POST', body: {'phonenumber': phone, 'password': password});
    final data = res['data'] as Map<String, dynamic>;
    final user = AUser(data['loggedUser'] as Map<String, dynamic>);
    if (!_canUsePanel(user)) throw const ApiError(0, 'Зөвхөн админ, дилер эрхтэй хэрэглэгч нэвтэрнэ');
    _set(data['token'] as String, user);
  }

  /// Re-reads the signed-in user (and slides the 7-day token forward). Signs out a revoked session.
  Future<void> refresh() async {
    if (_token == null) return;
    try {
      final res = await apiFetch('/api/users/get-user-data', method: 'POST', token: _token);
      final u = res['loggedUser'];
      if (u is! Map<String, dynamic> || !_canUsePanel(AUser(u))) return signOut();
      _set((res['token'] as String?) ?? _token!, AUser(u));
    } on ApiError catch (e) {
      if (e.status == 401) signOut();
    }
  }
}

/// Every call the admin half makes — the same endpoints as admin/src/lib/api/admin.ts.
class AdminApi {
  static final session = AdminSession();

  static const Condition notDeleted = ['status', '<>', 'deleted'];
  static const _newest = [
    {'selector': 'created_at', 'desc': true},
  ];
  static const _newestListed = [
    {'selector': 'listed_at', 'desc': true},
    {'selector': 'id', 'desc': true},
  ];
  static const _byName = [
    {'selector': 'name', 'desc': false},
  ];

  /// Signed request; a rejected token ends the session.
  static Future<Map<String, dynamic>> _fetch(String path, {String method = 'GET', Object? body}) async {
    try {
      return await apiFetch(path, method: method, body: body, token: session.token);
    } on ApiError catch (e) {
      if (e.status == 401) session.signOut();
      rethrow;
    }
  }

  static List<T> _rows<T>(Map<String, dynamic> res, T Function(Map<String, dynamic>) parse) =>
      ((res['data']?['rows'] as List?) ?? []).cast<Map<String, dynamic>>().map(parse).toList();

  static ListPage<T> _page<T>(Map<String, dynamic> res, T Function(Map<String, dynamic>) parse) =>
      ListPage(_rows(res, parse), (res['data']?['count'] as num?)?.toInt() ?? 0);

  static T? _item<T>(Map<String, dynamic> res, T Function(Map<String, dynamic>) parse) {
    final d = res['data'];
    return d is Map<String, dynamic> ? parse(d) : null;
  }

  // --- auth / own account -------------------------------------------------------

  static Future<void> forgotSend(String phone) => apiFetch('/api/users/forgot/send', method: 'POST', body: {'phonenumber': phone});

  static Future<String> forgotVerify(String phone, String code) async {
    final res = await apiFetch('/api/users/forgot/verify', method: 'POST', body: {'phonenumber': phone, 'code': code});
    return '${res['data']['reset_token']}';
  }

  static Future<void> forgotReset(String token, String password, String confirm) =>
      apiFetch('/api/users/forgot/reset', method: 'POST', body: {'reset_token': token, 'password': password, 'password_confirm': confirm});

  static Future<void> changePassword(int id, String password, String confirm) =>
      _fetch('/api/users/change-password', method: 'POST', body: {'id': id, 'password': password, 'password_confirm': confirm});

  /// Asked again before the resend wait is over: the earlier code still stands, so it counts as sent.
  static Future<int> _cooldown(Future<Map<String, dynamic>> Function() send) async {
    try {
      final res = await send();
      return (res['data']?['resend_in'] as num?)?.toInt() ?? 60;
    } on ApiError catch (e) {
      final wait = e.data is Map ? ((e.data as Map)['resend_in'] as num?)?.toInt() : null;
      if (wait != null && wait > 0) return wait;
      rethrow;
    }
  }

  static Future<int> sendEmailChangeCode(String email) => _cooldown(() => _fetch('/api/users/email-change/send', method: 'POST', body: {'email': email}));
  static Future<AUser?> verifyEmailChange(String email, String code) async =>
      _item(await _fetch('/api/users/email-change/verify', method: 'POST', body: {'email': email, 'code': code}), AUser.new);

  /// Checks the old password and emails a code; returns (seconds to wait, masked address).
  static Future<(int, String?)> sendPasswordChangeCode(Map<String, String> body) async {
    String? email;
    final wait = await _cooldown(() async {
      final res = await _fetch('/api/users/password-change/send', method: 'POST', body: body);
      email = res['data']?['email']?.toString();
      return res;
    });
    return (wait, email);
  }

  static Future<void> verifyPasswordChange(Map<String, String> body, String code) =>
      _fetch('/api/users/password-change/verify', method: 'POST', body: {...body, 'code': code});

  static Future<int> sendPhoneVerifyCode() => _cooldown(() => _fetch('/api/users/phone-verify/send', method: 'POST', body: {}));
  static Future<AUser?> verifyPhone(String code) async => _item(await _fetch('/api/users/phone-verify/confirm', method: 'POST', body: {'code': code}), AUser.new);
  static Future<int> sendPhoneChangeCode(String phone) => _cooldown(() => _fetch('/api/users/phone-change/send', method: 'POST', body: {'phonenumber': phone}));
  static Future<AUser?> verifyPhoneChange(String phone, String code) async =>
      _item(await _fetch('/api/users/phone-change/verify', method: 'POST', body: {'phonenumber': phone, 'code': code}), AUser.new);

  // --- generic /api/base/:target -----------------------------------------------

  static Future<int> countOf(String target, List<Condition> filter) async {
    final res = await _fetch('/api/base/$target${listQuery(filter: filter, take: 1)}');
    return (res['data']?['count'] as num?)?.toInt() ?? 0;
  }

  static Future<Map<String, dynamic>> createRow(String target, Map<String, Object?> body) async => (await _fetch('/api/base/$target', method: 'POST', body: body))['data'] ?? {};
  static Future<void> updateRow(String target, int id, Map<String, Object?> body) => _fetch('/api/base/$target/$id', method: 'PUT', body: body);
  static Future<void> deleteRows(String target, List<int> ids) => _fetch('/api/base/$target', method: 'DELETE', body: {'ids': ids});

  /// `POST /api/upload/image`: saves into `uploads/<folder>`, returns the file name.
  static Future<String> uploadImage(String folder, String filename, List<int> bytes) async {
    final res = await apiUpload('/api/upload/image', fields: {'folder': folder}, files: [UploadFile('image', filename, bytes)], token: session.token);
    return '${res['data']['fileName']}';
  }

  // --- catalog ------------------------------------------------------------------

  static int _bySort(int? aSort, String aName, int? bSort, String bName) => (aSort ?? 999).compareTo(bSort ?? 999) != 0 ? (aSort ?? 999).compareTo(bSort ?? 999) : aName.compareTo(bName);

  static Future<List<Brand>> brands() async {
    final rows = _rows(await _fetch('/api/base/vwBrands${listQuery(filter: [
          ['status', '=', 'active'],
        ])}'), Brand.new);
    return rows..sort((a, b) => _bySort(a.sortOrder, a.name, b.sortOrder, b.name));
  }

  /// Alphabetical, with the "Other" catch-all last; [brandId] keeps one brand's.
  static Future<List<CarModel>> models([int? brandId]) async {
    final rows = _rows(await _fetch('/api/base/carModels${listQuery(filter: [
          notDeleted,
          if (brandId != null) ['brand_id', '=', brandId],
        ])}'), CarModel.new);
    return rows..sort((a, b) => a.name == 'Other' ? 1 : (b.name == 'Other' ? -1 : a.name.compareTo(b.name)));
  }

  static Future<ListPage<Brand>> brandsPage({String? search, required int take}) async {
    final q = search?.trim() ?? '';
    final res = await _fetch('/api/base/vwBrands${listQuery(filter: [
          ['status', '=', 'active'],
          if (q.isNotEmpty) [['name', 'contains', q], 'or', ['country', 'contains', q]],
        ], sort: [
          {'selector': 'sort_order', 'desc': false},
          {'selector': 'name', 'desc': false},
        ], take: take)}');
    return _page(res, Brand.new);
  }

  static Future<ListPage<CarModel>> modelsPage({String? search, List<int> brandIds = const [], required int take}) async {
    final q = search?.trim() ?? '';
    final res = await _fetch('/api/base/carModels${listQuery(filter: [
          notDeleted,
          if (q.isNotEmpty) brandIds.isEmpty ? ['name', 'contains', q] : [['name', 'contains', q], 'or', ['brand_id', 'in', brandIds]],
        ], sort: [
          {'selector': 'name', 'desc': false},
          {'selector': 'id', 'desc': false},
        ], take: take)}');
    return _page(res, CarModel.new);
  }

  static Future<List<BodyType>> bodyTypes() async {
    final rows = _rows(await _fetch('/api/base/vwBodyTypes${listQuery(filter: [
          ['status', '=', 'active'],
        ])}'), BodyType.new);
    return rows..sort((a, b) => _bySort(a.sortOrder, a.name, b.sortOrder, b.name));
  }

  static Future<List<Location>> locations() async {
    final rows = _rows(await _fetch('/api/base/locations${listQuery(filter: [notDeleted])}'), Location.new);
    return rows..sort((a, b) => _bySort(a.sortOrder, a.name, b.sortOrder, b.name));
  }

  static final _areas = <int?, Future<List<Location>>>{};

  /// Aimags (and the capital) for null, otherwise the soums / bags under [parentId]; each level fetched once.
  static Future<List<Location>> areas(int? parentId) => _areas.putIfAbsent(parentId, () async {
        try {
          final rows = _rows(await _fetch('/api/base/locations${listQuery(filter: [
                notDeleted,
                parentId == null ? ['level', '=', 'aimag'] : ['parent_id', '=', parentId],
              ])}'), Location.new);
          return rows..sort((a, b) => _bySort(a.sortOrder, a.name, b.sortOrder, b.name));
        } catch (_) {
          _areas.remove(parentId);
          rethrow;
        }
      });

  // --- cars ---------------------------------------------------------------------

  static Future<ListPage<ACar>> cars({List<String> statuses = const [], int? dealerId, String? search, required int take}) async {
    final filter = <Condition>[
      if (dealerId != null) ['dealer_id', '=', dealerId],
    ];
    final plain = statuses.where((s) => s != 'featured').toList();
    final groups = <Object>[
      if (plain.isNotEmpty) ['status', 'in', plain],
      // "featured" isn't a status: active ads with the flag on.
      if (statuses.contains('featured')) [['status', '=', 'active'], 'and', ['is_featured', '=', 1]],
    ];
    if (groups.isEmpty) {
      filter.add(notDeleted);
    } else if (groups.length == 1) {
      filter.add(groups.first as Condition);
    } else {
      filter.add([groups[0], 'or', groups[1]]);
    }
    final q = search?.trim() ?? '';
    if (q.isNotEmpty) {
      if (RegExp(r'^\d{9,}$').hasMatch(q)) {
        filter.add(['code', 'contains', q]);
      } else if (RegExp(r'^\d{1,7}$').hasMatch(q)) {
        filter.add(['id', '=', int.parse(q)]);
      } else if (RegExp(r'^\d{8}$').hasMatch(q)) {
        filter.add(['phonenumber', '=', q]);
      } else {
        filter.add(['name', 'contains', q]);
      }
    }
    return _page(await _fetch('/api/base/vwCars${listQuery(filter: filter, sort: _newestListed, take: take)}'), ACar.new);
  }

  static Future<ListPage<ACar>> featuredCars([int take = 5]) async => _page(
      await _fetch('/api/base/vwCars${listQuery(filter: [
            ['status', '=', 'active'],
            ['is_featured', '=', 1],
          ], sort: _newest, take: take)}'),
      ACar.new);

  /// Ads with the most views ('view') or phone-number reveals ('phone') of all time.
  static Future<ListPage<ACar>> topCars(String kind, [int take = 5]) async {
    final field = kind == 'phone' ? 'phone_view_count' : 'view_count';
    return _page(
        await _fetch('/api/base/vwCars${listQuery(filter: [
              notDeleted,
              [field, '>', 0],
            ], sort: [
              {'selector': field, 'desc': true},
              {'selector': 'id', 'desc': true},
            ], take: take)}'),
        ACar.new);
  }

  /// Ads added in the last [days] days.
  static Future<ListPage<ACar>> recentCars({int days = 3, required int take}) async {
    final since = DateTime.now().toUtc().add(const Duration(hours: 8)).subtract(Duration(days: days)).toIso8601String().substring(0, 19).replaceFirst('T', ' ');
    return _page(
        await _fetch('/api/base/vwCars${listQuery(filter: [
              notDeleted,
              ['created_at', '>=', since],
            ], sort: _newest, take: take)}'),
        ACar.new);
  }

  static Future<ACar?> car(int id) async => _item(await _fetch('/api/base/vwCars/$id'), ACar.new);

  static Future<List<CarFile>> carFiles(int carId) async {
    final rows = _rows(await _fetch('/api/base/allFiles${listQuery(filter: [
          ['object_name', '=', 'cars'],
          ['data_id', '=', carId],
          notDeleted,
        ])}'), CarFile.new);
    return rows..sort((a, b) => a.order != b.order ? a.order.compareTo(b.order) : a.id.compareTo(b.id));
  }

  static Future<void> approveCar(int id) => _fetch('/api/cars/approve', method: 'POST', body: {'id': id});
  static Future<void> rejectCar(int id, String reason) => _fetch('/api/cars/reject', method: 'POST', body: {'id': id, 'reason': reason});
  static Future<void> setHidden(int id, bool hidden) => _fetch('/api/cars/set-hidden', method: 'POST', body: {'id': id, 'hidden': hidden});
  static Future<void> renewCar(int id) => _fetch('/api/cars/renew', method: 'POST', body: {'id': id});
  static Future<void> restoreCar(int id) => _fetch('/api/cars/restore', method: 'POST', body: {'id': id});
  static Future<void> markSold(int id) => _fetch('/api/cars/mark-sold', method: 'POST', body: {'id': id});
  static Future<void> deleteCar(int id) => deleteRows('cars', [id]);

  /// `GET /web/cars/vehicle-lookup?plate=…` (or `vin=`): registry data mapped to ad fields.
  static Future<Map<String, dynamic>> vehicleLookup(String type, String value) async {
    final res = await apiFetch('/web/cars/vehicle-lookup?${Uri(queryParameters: {type: value}).query}');
    return (res['data'] as Map<String, dynamic>?) ?? {};
  }

  /// `POST /api/cars/save` (multipart). The server deletes every photo it isn't told to keep.
  static Future<int> saveCar(Map<String, Object?> input, List<PhotoItem> photos) async {
    final fields = <String, String>{'data': jsonEncode(input)};
    final files = <UploadFile>[];
    for (var i = 0; i < photos.length; i++) {
      final p = photos[i];
      if (p.id != null) {
        fields['file${i}Info'] = jsonEncode({'id': p.id});
      } else {
        files.add(UploadFile('file$i', p.filename!, p.bytes!));
        fields['file${i}Info'] = jsonEncode({'original_name': p.filename});
      }
    }
    try {
      final res = await apiUpload('/api/cars/save', fields: fields, files: files, token: session.token);
      return (res['data']?['id'] as num?)?.toInt() ?? 0;
    } on ApiError catch (e) {
      if (e.status == 401) session.signOut();
      rethrow;
    }
  }

  /// Fields of a vwCars row that `/api/cars/save` validates, so a flag change re-sends them.
  static Map<String, Object?> carInputFrom(ACar c) => {
        'id': c.id,
        'brand_id': c.brandId,
        'car_model_id': c.carModelId,
        'body_type_id': c.bodyTypeId,
        'location_id': c.locationId,
        'manufactured_year': c.manufacturedYear,
        'imported_year': c.importedYear,
        'price': c.price == null ? null : (num.tryParse('${c.price}') ?? 0).round(),
        'mileage': c.mileage,
        'fuel_type': c.fuelType,
        'transmission': c.transmission,
        'drive_type': c.driveType,
        'steering': c.steering,
        'plate_type': c.plateType,
        'is_leasing': c.isLeasing,
        'vehicle_type': c.vehicleType,
        'engine_capacity': c.engineCapacity,
        'color': c.color,
        'interior_color': c.interiorColor,
        'vin': c.vin,
        'phonenumber': c.phonenumber,
        'description': c.description,
      };

  /// Toggle "Онцлох" without touching the ad's photos.
  static Future<void> setFeatured(ACar car, bool featured) async {
    final files = await carFiles(car.id);
    await saveCar({...carInputFrom(car), 'is_featured': featured}, files.map((f) => PhotoItem.existing(f.id, '')).toList());
  }

  // --- users --------------------------------------------------------------------

  static Future<ListPage<AUser>> users({String? search, int? excludeId, String? role, String? status}) async {
    final q = search?.trim() ?? '';
    return _page(
        await _fetch('/api/base/users${listQuery(filter: [
              notDeleted,
              ['role', '<>', Roles.customer],
              if (excludeId != null) ['id', '<>', excludeId],
              if (role != null) ['role', '=', role],
              if (status != null) ['status', '=', status],
              if (q.isNotEmpty) RegExp(r'^\d+$').hasMatch(q) ? ['phonenumber', 'contains', q] : ['firstname', 'contains', q],
            ], sort: _newest, take: 200)}'),
        AUser.new);
  }

  static Future<AUser?> user(int id) async => _item(await _fetch('/api/base/users/$id'), AUser.new);
  static Future<void> createUser(Map<String, Object?> body) => _fetch('/api/users/create', method: 'POST', body: body);

  // --- dealers ------------------------------------------------------------------

  /// Every dealer that isn't deleted, with its ad count.
  static Future<ListPage<Dealer>> dealersList([String? search]) async {
    final q = search?.trim() ?? '';
    return _page(
        await _fetch('/api/base/vwDealers${listQuery(filter: [
              notDeleted,
              if (q.isNotEmpty) RegExp(r'^\d+$').hasMatch(q) ? ['phonenumber', 'contains', q] : ['name', 'contains', q],
            ], sort: _byName, take: 500)}'),
        Dealer.new);
  }

  /// Active dealers, for assigning an ad or a user to one.
  static Future<List<Dealer>> dealers() async => _rows(
      await _fetch('/api/base/dealers${listQuery(filter: [
            ['status', '=', 'active'],
          ], sort: _byName, take: 500)}'),
      Dealer.new);

  static Future<Dealer?> dealer(int id) async => _item(await _fetch('/api/base/dealers/$id'), Dealer.new);

  // --- customers ----------------------------------------------------------------

  static Future<ListPage<Customer>> customers({String? search, String? status}) async {
    final q = search?.trim() ?? '';
    return _page(
        await _fetch('/api/base/customers${listQuery(filter: [
              status != null ? ['status', '=', status] : notDeleted,
              if (q.isNotEmpty)
                RegExp(r'^\d+$').hasMatch(q)
                    ? ['phonenumber', 'contains', q]
                    : q.contains('@')
                        ? ['email', 'contains', q]
                        : ['firstname', 'contains', q],
            ], sort: _newest, take: 200)}'),
        Customer.new);
  }

  static Future<Customer?> customer(int id) async => _item(await _fetch('/api/base/customers/$id'), Customer.new);

  // --- feedback -----------------------------------------------------------------

  static Future<ListPage<FeedbackItem>> feedbacks([String? status]) async => _page(
      await _fetch('/api/base/feedbacks${listQuery(filter: [
            if (status != null) ['status', '=', status],
          ], sort: _newest, take: 200)}'),
      FeedbackItem.new);

  static Future<FeedbackItem?> feedback(int id) async => _item(await _fetch('/api/base/feedbacks/$id'), FeedbackItem.new);

  // --- web chat messages --------------------------------------------------------

  /// Adds each message's ad and its answers.
  static Future<List<Message>> _withCarsAndReplies(List<Map<String, dynamic>> rows) async {
    final carIds = rows.map((m) => (m['car_id'] as num?)?.toInt()).whereType<int>().toSet().toList();
    final cars = carIds.isEmpty
        ? <ACar>[]
        : _rows(
            await _fetch('/api/base/vwCars${listQuery(filter: [
                  ['id', 'in', carIds],
                ], take: carIds.length)}'),
            ACar.new);
    final byId = {for (final c in cars) c.id: c};
    final ids = rows.map((m) => m['id']).join(',');
    final replies = ids.isEmpty ? <MessageReply>[] : ((await _fetch('/api/messages/replies?ids=$ids'))['data'] as List? ?? []).cast<Map<String, dynamic>>().map(MessageReply.new).toList();
    return rows.map((m) {
      final id = (m['id'] as num).toInt();
      final carId = (m['car_id'] as num?)?.toInt();
      return Message(m, car: carId == null ? null : byId[carId], replies: replies.where((r) => r.messageId == id).toList());
    }).toList();
  }

  /// Without a status: every message except deleted ones.
  static Future<List<Message>> messages([String? status]) async {
    final res = await _fetch('/api/base/messages${listQuery(filter: [status != null ? ['status', '=', status] : notDeleted], sort: [..._newest, {'selector': 'id', 'desc': true}], take: 200)}');
    return _withCarsAndReplies(((res['data']?['rows'] as List?) ?? []).cast<Map<String, dynamic>>());
  }

  /// Every message of the chat [messageId] belongs to (same visitor, same ad).
  static Future<List<Message>?> messageThread(int messageId) async {
    final one = (await _fetch('/api/base/messages/$messageId'))['data'];
    if (one is! Map<String, dynamic>) return null;
    final createdBy = one['created_by'];
    final Condition who = createdBy != null ? ['created_by', '=', createdBy] : ['phonenumber', '=', one['phonenumber']];
    final res = await _fetch('/api/base/messages${listQuery(filter: [who], sort: [
          {'selector': 'id', 'desc': false},
        ], take: 500)}');
    final rows = ((res['data']?['rows'] as List?) ?? []).cast<Map<String, dynamic>>().where((m) => m['car_id'] == one['car_id']).toList();
    return _withCarsAndReplies(rows);
  }

  static Future<void> setMessageStatus(int id, String status) => updateRow('messages', id, {'status': status});
  static Future<void> replyMessage(int id, String reply) => _fetch('/api/messages/reply', method: 'POST', body: {'id': id, 'reply': reply});
  static Future<void> editMessageReply(int replyId, String reply) => _fetch('/api/messages/reply-edit', method: 'POST', body: {'reply_id': replyId, 'reply': reply});
}

/// A photo in the car editor: one already on the server (kept by [id]) or a new file.
class PhotoItem {
  final int? id;
  final String? url;
  final String? filename;
  final Uint8List? bytes;
  const PhotoItem.existing(this.id, this.url)
      : filename = null,
        bytes = null;
  const PhotoItem.file(this.filename, this.bytes)
      : id = null,
        url = null;
}

/// Brand logos, body-type icons, profile photos and dealer logos: the DB keeps only the file name.
String? catalogImage(String? name, String folder) => uploadUrl(name, folder: folder);
