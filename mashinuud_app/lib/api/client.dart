import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:mashinuud_app/app/constant.dart';

class ApiError implements Exception {
  final int status;
  final String message;
  const ApiError(this.status, this.message);
  @override
  String toString() => message;
}

/// One filter condition in the backend's DevExtreme-style format, or a group like `[c1, "or", c2]`.
typedef Condition = List<Object?>;

/// Query string for the generic `/base/:target` list endpoints (conditions joined with "and").
String listQuery({List<Condition> filter = const [], List<Map<String, Object>>? sort, int? take, int? skip}) {
  final params = <String, String>{};
  if (filter.length == 1) {
    params['filter'] = jsonEncode(filter.first);
  } else if (filter.length > 1) {
    final joined = <Object?>[];
    for (var i = 0; i < filter.length; i++) {
      if (i > 0) joined.add('and');
      joined.add(filter[i]);
    }
    params['filter'] = jsonEncode(joined);
  }
  if (sort != null && sort.isNotEmpty) params['sort'] = jsonEncode(sort);
  if (take != null) params['take'] = '$take';
  if (skip != null) params['skip'] = '$skip';
  return params.isEmpty ? '' : '?${Uri(queryParameters: params).query}';
}

final HttpClient _http = HttpClient()..connectionTimeout = const Duration(seconds: 12);

/// JSON request. The backend answers failures with HTTP 200 and `success: false`, so that flag is checked too.
Future<Map<String, dynamic>> apiFetch(String path, {String method = 'GET', Object? body, String? token}) async {
  final uri = Uri.parse('${AppConstants.apiUrl}$path');
  HttpClientResponse response;
  String text;
  try {
    final request = await _http.openUrl(method, uri);
    request.headers.set(HttpHeaders.acceptHeader, 'application/json');
    if (token != null) request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
    if (body != null) {
      request.headers.contentType = ContentType.json;
      request.add(utf8.encode(jsonEncode(body)));
    }
    response = await request.close().timeout(const Duration(seconds: 20));
    text = await response.transform(utf8.decoder).join();
  } on SocketException {
    throw const ApiError(0, 'Сервертэй холбогдож чадсангүй');
  } on TimeoutException {
    throw const ApiError(0, 'Сервертэй холбогдож чадсангүй');
  } on HttpException {
    throw const ApiError(0, 'Сервертэй холбогдож чадсангүй');
  }

  Map<String, dynamic>? data;
  try {
    final decoded = jsonDecode(text);
    if (decoded is Map<String, dynamic>) data = decoded;
  } catch (_) {}

  final ok = response.statusCode >= 200 && response.statusCode < 300;
  if (!ok || data == null || data['success'] == false) {
    final errors = data?['errors'];
    final first = errors is List && errors.isNotEmpty && errors.first is Map ? (errors.first as Map)['message'] : null;
    final status = response.statusCode;
    final fallback = status == 404
        ? 'Хүсэлт олдсонгүй'
        : status >= 500
            ? 'Серверийн алдаа ($status)'
            : 'Хүсэлт амжилтгүй боллоо';
    throw ApiError(status, (data?['message'] as String?)?.isNotEmpty == true ? data!['message'] as String : (first?.toString() ?? fallback));
  }
  return data;
}

/// Photo under `<backend>/uploads/<folder>`; cars come in four widths (icon, thumb, grid, full).
String? uploadUrl(String? fileName, {String size = 'full', String folder = 'cars'}) {
  final name = fileName?.trim();
  if (name == null || name.isEmpty) return null;
  if (RegExp(r'^https?://').hasMatch(name)) return name;
  final prefix = size == 'full' ? '' : '${size}_';
  return '${AppConstants.apiUrl}/uploads/$folder/$prefix$name';
}
