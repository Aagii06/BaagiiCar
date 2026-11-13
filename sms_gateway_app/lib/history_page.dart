import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Илгээсэн SMS-ийн түүх (утсан дээр хадгалагдсан, native SmsHistory.kt)
class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key, required this.channel});

  final MethodChannel channel;

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  List<Map> _items = [];
  bool _loading = true;
  String _query = '';
  String _filter = 'all'; // all | sent | failed

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final items = await widget.channel.invokeListMethod<Map>('history') ?? [];
    if (mounted) setState(() => (_items = items, _loading = false));
  }

  Future<void> _clear() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Түүх цэвэрлэх үү?'),
        content: const Text('Илгээсэн SMS-ийн бүх түүх энэ утаснаас устна.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Болих')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Устгах')),
        ],
      ),
    );
    if (ok != true) return;
    await widget.channel.invokeMethod('clearHistory');
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final query = _query.trim().toLowerCase();
    final visible = _items.where((item) {
      if (_filter != 'all' && item['status'] != _filter) return false;
      if (query.isEmpty) return true;
      return '${item['phonenumber']} ${item['text']} ${item['server']}'.toLowerCase().contains(query);
    }).toList();
    final sent = _items.where((i) => i['status'] == 'sent').length;
    final failed = _items.length - sent;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Илгээсэн SMS'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh), tooltip: 'Шинэчлэх'),
          IconButton(
            onPressed: _items.isEmpty ? null : _clear,
            icon: const Icon(Icons.delete_sweep_outlined),
            tooltip: 'Цэвэрлэх',
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              onChanged: (value) => setState(() => _query = value),
              decoration: const InputDecoration(
                hintText: 'Дугаар, текстээр хайх',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: SegmentedButton<String>(
              showSelectedIcon: false,
              segments: [
                ButtonSegment(value: 'all', label: Text('Бүгд ${_items.length}')),
                ButtonSegment(value: 'sent', label: Text('Илгээсэн $sent')),
                ButtonSegment(value: 'failed', label: Text('Алдаа $failed')),
              ],
              selected: {_filter},
              onSelectionChanged: (s) => setState(() => _filter = s.first),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : visible.isEmpty
                    ? const Center(child: Text('SMS алга'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          itemCount: visible.length,
                          separatorBuilder: (_, _) => const Divider(height: 1),
                          itemBuilder: (context, i) => _HistoryTile(item: visible[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({required this.item});

  final Map item;

  static String _two(int n) => n.toString().padLeft(2, '0');

  static String _formatTime(int millis) {
    final t = DateTime.fromMillisecondsSinceEpoch(millis);
    return '${t.year}-${_two(t.month)}-${_two(t.day)} ${_two(t.hour)}:${_two(t.minute)}:${_two(t.second)}';
  }

  @override
  Widget build(BuildContext context) {
    final ok = item['status'] == 'sent';
    final error = (item['error'] as String?) ?? '';
    final muted = Theme.of(context).textTheme.bodySmall;
    return ListTile(
      leading: Icon(ok ? Icons.check_circle : Icons.error, color: ok ? Colors.green : Colors.red),
      title: Text('${item['phonenumber']}'),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 2),
          Text('${item['text']}'),
          if (!ok && error.isNotEmpty) Text(error, style: const TextStyle(color: Colors.red)),
          const SizedBox(height: 2),
          Text('${_formatTime(item['time'] as int)} · ${item['server']}', style: muted),
        ],
      ),
      isThreeLine: true,
      onLongPress: () {
        Clipboard.setData(ClipboardData(text: '${item['phonenumber']}'));
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Дугаар хууллаа')));
      },
    );
  }
}
