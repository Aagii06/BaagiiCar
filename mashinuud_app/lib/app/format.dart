/// Number / price / time formatting — mirrors web/src/lib/utils.ts.
library;

double toNumber(Object? value) {
  if (value == null) return 0;
  if (value is num) return value.toDouble();
  return double.tryParse('$value') ?? 0;
}

/// "45,000,000"
String formatNumber(Object? value) {
  final n = toNumber(value).round();
  final s = n.abs().toString();
  final out = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) out.write(',');
    out.write(s[i]);
  }
  return '${n < 0 ? '-' : ''}$out';
}

/// "45,000,000₮"
String formatPrice(Object? value) {
  final n = toNumber(value);
  return n != 0 ? '${formatNumber(n)}₮' : 'Үнэ тохирно';
}

/// "45.5 сая₮" — compact price for cards.
String formatPriceShort(Object? value) {
  final n = toNumber(value);
  if (n == 0) return 'Үнэ тохирно';
  if (n >= 1000000) {
    final m = double.parse((n / 1000000).toStringAsFixed(1));
    final text = m == m.roundToDouble() ? formatNumber(m) : m.toString();
    return '$text сая₮';
  }
  return formatPrice(n);
}

String formatEngine(Object? value) {
  final n = toNumber(value);
  if (n == 0) return '—';
  return '${n == n.roundToDouble() ? n.toInt() : n} л';
}

String formatKm(Object? value) => '${formatNumber(value)} км';

/// "2 цагийн өмнө" from the backend's "YYYY-MM-DD HH:mm:ss" (+08:00).
String timeAgo(String? value) {
  if (value == null || value.isEmpty) return '';
  final date = DateTime.tryParse('${value.replaceFirst(' ', 'T')}+08:00');
  if (date == null) return '';
  final minutes = DateTime.now().difference(date).inMinutes.clamp(0, 1 << 31);
  if (minutes < 1) return 'саяхан';
  if (minutes < 60) return '$minutes минутын өмнө';
  final hours = (minutes / 60).round();
  if (hours < 24) return '$hours цагийн өмнө';
  final days = (hours / 24).round();
  if (days < 30) return '$days өдрийн өмнө';
  return value.substring(0, 10);
}

String initials(String? name) {
  final parts = (name ?? '').trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
  if (parts.isEmpty) return '?';
  return parts.skip(parts.length > 2 ? parts.length - 2 : 0).map((p) => p[0]).join().toUpperCase();
}
