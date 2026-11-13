import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'history_page.dart';

// Cardealer SMS gateway: энэ утасны SIM-ээр backend-ийн OTP SMS-ийг илгээнэ.
// Ажиллах хэсэг нь native foreground service (android/.../GatewayService.kt), энд зөвхөн тохиргоо, төлөв.
const _channel = MethodChannel('sms_gateway');

void main() => runApp(const GatewayApp());

class GatewayApp extends StatelessWidget {
  const GatewayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SMS Gateway',
      theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true),
      home: const GatewayPage(),
    );
  }
}

class GatewayPage extends StatefulWidget {
  const GatewayPage({super.key});

  @override
  State<GatewayPage> createState() => _GatewayPageState();
}

/// Нэг backend-ийн тохиргооны талбарууд
class _ServerFields {
  _ServerFields([String url = '', String token = ''])
      : url = TextEditingController(text: url),
        token = TextEditingController(text: token);

  final TextEditingController url;
  final TextEditingController token;

  void dispose() {
    url.dispose();
    token.dispose();
  }
}

class _GatewayPageState extends State<GatewayPage> {
  final List<_ServerFields> _servers = [];
  final _testPhone = TextEditingController();
  Map<dynamic, dynamic> _status = {};
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _refresh());
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final server in _servers) {
      server.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    final config = await _channel.invokeMapMethod<String, dynamic>('getConfig') ?? {};
    final saved = (config['servers'] as List?) ?? [];
    setState(() {
      _servers.addAll(saved.map((s) => _ServerFields(s['url'] ?? '', s['token'] ?? '')));
      if (_servers.isEmpty) _servers.add(_ServerFields());
    });
    await _channel.invokeMethod('requestPermissions');
    await _refresh();
  }

  Future<void> _refresh() async {
    final status = await _channel.invokeMapMethod('status');
    if (mounted && status != null) setState(() => _status = status);
  }

  void _toast(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  /// The start/stop or test send in flight — its button spins.
  String? _busy;

  Future<void> _toggle() async {
    setState(() => _busy = 'toggle');
    try {
      await _toggleInner();
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  Future<void> _toggleInner() async {
    if (_status['running'] == true) {
      await _channel.invokeMethod('stop');
    } else {
      final filled = _servers.where((s) => s.url.text.trim().isNotEmpty).toList();
      if (filled.isEmpty) return _toast('Дор хаяж нэг серверийн хаяг оруулна уу');
      for (final s in filled) {
        if (!s.url.text.trim().startsWith('http') || s.token.text.trim().isEmpty) {
          return _toast('Сервер бүрт хаяг (http...) болон token оруулна уу');
        }
      }
      if (_status['smsPermission'] != true) {
        await _channel.invokeMethod('requestPermissions');
        return _toast('SMS илгээх зөвшөөрөл өгнө үү');
      }
      await _channel.invokeMethod('start', {
        'servers': [for (final s in filled) {'url': s.url.text.trim(), 'token': s.token.text.trim()}],
      });
    }
    await _refresh();
  }

  Future<void> _sendTest() async {
    final phone = _testPhone.text.trim();
    if (phone.isEmpty) return _toast('Утасны дугаар оруулна уу');
    setState(() => _busy = 'test');
    try {
      final error = await _channel.invokeMethod<String>('sendTest', {'phonenumber': phone});
      _toast(error == null ? 'Илгээлээ' : 'Алдаа: $error');
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final running = _status['running'] == true;
    final serverStatus = {
      for (final s in (_status['servers'] as List?) ?? []) s['url'] as String: s as Map,
    };
    final online = serverStatus.values.where((s) => s['connected'] == true).length;
    final log = (_status['log'] as List?)?.cast<String>() ?? [];
    final (color, label) = !running
        ? (Colors.grey, 'Унтраалттай')
        : online == serverStatus.length && online > 0
            ? (Colors.green, 'Ажиллаж байна')
            : (Colors.orange, 'Холбогдсон $online/${serverStatus.length}');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cardealer SMS Gateway'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: 'Илгээсэн SMS',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const HistoryPage(channel: _channel)),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: Icon(Icons.circle, color: color),
              title: Text(label),
              subtitle: Text('Илгээсэн: ${_status['sentCount'] ?? 0} · Алдаа: ${_status['failedCount'] ?? 0}'),
            ),
          ),
          if (_status['smsPermission'] == false)
            _Warning(
              text: 'SMS илгээх зөвшөөрөл өгөөгүй байна',
              action: 'Зөвшөөрөх',
              onPressed: () => _channel.invokeMethod('requestPermissions'),
            ),
          if (_status['batteryUnrestricted'] == false)
            _Warning(
              text: 'Батарейн хязгаарлалтаас чөлөөлөөгүй - дэлгэц унтрахад тасарч болно',
              action: 'Чөлөөлөх',
              onPressed: () => _channel.invokeMethod('requestBatteryUnrestricted'),
            ),
          const SizedBox(height: 8),
          for (final (i, server) in _servers.indexed) ...[
            _ServerCard(
              index: i,
              fields: server,
              enabled: !running,
              status: serverStatus[server.url.text.trim().replaceAll(RegExp(r'/+$'), '')],
              onRemove: _servers.length > 1
                  ? () => setState(() => _servers.removeAt(i).dispose())
                  : null,
            ),
            const SizedBox(height: 12),
          ],
          if (!running)
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () => setState(() => _servers.add(_ServerFields())),
                icon: const Icon(Icons.add),
                label: const Text('Сервер нэмэх'),
              ),
            ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _busy != null ? null : _toggle,
            icon: _busy == 'toggle'
                ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Icon(running ? Icons.stop : Icons.play_arrow),
            label: Text(running ? 'Зогсоох' : 'Эхлүүлэх'),
            style: running ? FilledButton.styleFrom(backgroundColor: Colors.red) : null,
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _testPhone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Туршилтын SMS (дугаар)',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: _busy != null ? null : _sendTest,
                child: _busy == 'test'
                    ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Илгээх'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text('Лог', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          for (final line in log)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Text(line, style: const TextStyle(fontFamily: 'monospace', fontSize: 12)),
            ),
        ],
      ),
    );
  }
}

class _ServerCard extends StatelessWidget {
  const _ServerCard({
    required this.index,
    required this.fields,
    required this.enabled,
    required this.status,
    required this.onRemove,
  });

  final int index;
  final _ServerFields fields;
  final bool enabled;
  final Map? status;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    final connected = status?['connected'] == true;
    final error = status?['lastError'] as String?;
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 4, 4, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                if (status != null) ...[
                  Icon(Icons.circle, size: 12, color: connected ? Colors.green : Colors.orange),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(
                    status == null || connected ? 'Сервер ${index + 1}' : 'Сервер ${index + 1} · ${error ?? 'холбогдож байна...'}',
                    style: Theme.of(context).textTheme.titleSmall,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (enabled && onRemove != null)
                  IconButton(onPressed: onRemove, icon: const Icon(Icons.delete_outline), tooltip: 'Устгах')
                else
                  const SizedBox(height: 48),
              ],
            ),
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Column(
                children: [
                  TextField(
                    controller: fields.url,
                    enabled: enabled,
                    keyboardType: TextInputType.url,
                    decoration: const InputDecoration(
                      labelText: 'Серверийн хаяг',
                      hintText: 'https://api.example.mn',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: fields.token,
                    enabled: enabled,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Token (backend .env: SMS_GATEWAY_TOKEN)',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Warning extends StatelessWidget {
  const _Warning({required this.text, required this.action, required this.onPressed});

  final String text;
  final String action;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.amber.shade100,
      child: ListTile(
        leading: const Icon(Icons.warning_amber),
        title: Text(text, style: const TextStyle(fontSize: 14)),
        trailing: TextButton(onPressed: onPressed, child: Text(action)),
      ),
    );
  }
}
