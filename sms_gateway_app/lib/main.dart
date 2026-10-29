import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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

class _GatewayPageState extends State<GatewayPage> {
  final _serverUrl = TextEditingController();
  final _token = TextEditingController();
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
    super.dispose();
  }

  Future<void> _load() async {
    final config = await _channel.invokeMapMethod<String, dynamic>('getConfig') ?? {};
    _serverUrl.text = config['serverUrl'] ?? '';
    _token.text = config['token'] ?? '';
    await _channel.invokeMethod('requestPermissions');
    await _refresh();
  }

  Future<void> _refresh() async {
    final status = await _channel.invokeMapMethod('status');
    if (mounted && status != null) setState(() => _status = status);
  }

  void _toast(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  Future<void> _toggle() async {
    if (_status['running'] == true) {
      await _channel.invokeMethod('stop');
    } else {
      if (!_serverUrl.text.startsWith('http') || _token.text.trim().isEmpty) {
        return _toast('Серверийн хаяг (http...) болон token оруулна уу');
      }
      if (_status['smsPermission'] != true) {
        await _channel.invokeMethod('requestPermissions');
        return _toast('SMS илгээх зөвшөөрөл өгнө үү');
      }
      await _channel.invokeMethod('start', {'serverUrl': _serverUrl.text, 'token': _token.text});
    }
    await _refresh();
  }

  Future<void> _sendTest() async {
    final phone = _testPhone.text.trim();
    if (phone.isEmpty) return _toast('Утасны дугаар оруулна уу');
    _toast('Илгээж байна...');
    final error = await _channel.invokeMethod<String>('sendTest', {'phonenumber': phone});
    _toast(error == null ? 'Илгээлээ' : 'Алдаа: $error');
  }

  @override
  Widget build(BuildContext context) {
    final running = _status['running'] == true;
    final connected = _status['connected'] == true;
    final log = (_status['log'] as List?)?.cast<String>() ?? [];
    final (color, label) = !running
        ? (Colors.grey, 'Унтраалттай')
        : connected
            ? (Colors.green, 'Ажиллаж байна')
            : (Colors.orange, 'Холбогдож байна... ${_status['lastError'] ?? ''}');

    return Scaffold(
      appBar: AppBar(title: const Text('Cardealer SMS Gateway')),
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
          TextField(
            controller: _serverUrl,
            enabled: !running,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
              labelText: 'Серверийн хаяг',
              hintText: 'https://api.example.mn',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _token,
            enabled: !running,
            obscureText: true,
            decoration: const InputDecoration(
              labelText: 'Token (backend .env: SMS_GATEWAY_TOKEN)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _toggle,
            icon: Icon(running ? Icons.stop : Icons.play_arrow),
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
              OutlinedButton(onPressed: _sendTest, child: const Text('Илгээх')),
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
