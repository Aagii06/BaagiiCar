import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:mashinuud_app/app/constant.dart';

class ApiError implements Exception {
  final int status;
  final String message;

  /// The response's `data`, e.g. `{ resend_in }` when a code was asked for too soon.
  final Object? data;
  const ApiError(this.status, this.message, [this.data]);
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

  return _answer(response.statusCode, text);
}

/// One file in a multipart request.
class UploadFile {
  final String field;
  final String filename;
  final List<int> bytes;
  const UploadFile(this.field, this.filename, this.bytes);
}

String _mimeOf(String filename) {
  final ext = filename.split('.').last.toLowerCase();
  return switch (ext) {
    'png' => 'image/png',
    'webp' => 'image/webp',
    'svg' => 'image/svg+xml',
    'heic' => 'image/heic',
    _ => 'image/jpeg',
  };
}

/// multipart/form-data request (photo uploads); answered like [apiFetch].
Future<Map<String, dynamic>> apiUpload(String path, {Map<String, String> fields = const {}, List<UploadFile> files = const [], String? token}) async {
  final boundary = '----cardealer${DateTime.now().microsecondsSinceEpoch}';
  final body = BytesBuilder(copy: false);
  void line(String s) => body.add(utf8.encode('$s\r\n'));
  fields.forEach((k, v) {
    line('--$boundary');
    line('Content-Disposition: form-data; name="$k"');
    line('');
    line(v);
  });
  for (final f in files) {
    line('--$boundary');
    line('Content-Disposition: form-data; name="${f.field}"; filename="${f.filename.replaceAll('"', '')}"');
    line('Content-Type: ${_mimeOf(f.filename)}');
    line('');
    body.add(f.bytes);
    line('');
  }
  line('--$boundary--');

  final uri = Uri.parse('${AppConstants.apiUrl}$path');
  HttpClientResponse response;
  String text;
  try {
    final request = await _http.openUrl('POST', uri);
    request.headers.set(HttpHeaders.acceptHeader, 'application/json');
    if (token != null) request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
    request.headers.contentType = ContentType('multipart', 'form-data', parameters: {'boundary': boundary});
    request.add(body.takeBytes());
    response = await request.close().timeout(const Duration(seconds: 120));
    text = await response.transform(utf8.decoder).join();
  } on SocketException {
    throw const ApiError(0, 'Сервертэй холбогдож чадсангүй');
  } on TimeoutException {
    throw const ApiError(0, 'Сервертэй холбогдож чадсангүй');
  } on HttpException {
    throw const ApiError(0, 'Сервертэй холбогдож чадсангүй');
  }
  return _answer(response.statusCode, text);
}

Map<String, dynamic> _answer(int status, String text) {
  Map<String, dynamic>? data;
  try {
    final decoded = jsonDecode(text);
    if (decoded is Map<String, dynamic>) data = decoded;
  } catch (_) {}
  final ok = status >= 200 && status < 300;
  if (!ok || data == null || data['success'] == false) {
    final errors = data?['errors'];
    final first = errors is List && errors.isNotEmpty && errors.first is Map ? (errors.first as Map)['message'] : null;
    final fallback = status == 401
        ? 'Нэвтэрнэ үү'
        : status == 404
            ? 'Хүсэлт олдсонгүй'
            : status >= 500
                ? 'Серверийн алдаа ($status)'
                : 'Хүсэлт амжилтгүй боллоо';
    throw ApiError(status, (data?['message'] as String?)?.isNotEmpty == true ? data!['message'] as String : (first?.toString() ?? fallback), data?['data']);
  }
  return data;
}

/// Photo under `<backend>/uploads/<folder>`; cars come in four sizes, each fit into a square box (icon 128, thumb 240, grid 480, full 800).
String? uploadUrl(String? fileName, {String size = 'full', String folder = 'cars'}) {
  final name = fileName?.trim();
  if (name == null || name.isEmpty) return null;
  if (RegExp(r'^https?://').hasMatch(name)) return name;
  final prefix = size == 'full' ? '' : '${size}_';
  return '${AppConstants.apiUrl}/uploads/$folder/$prefix$name';
}
