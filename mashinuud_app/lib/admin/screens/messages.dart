import 'package:flutter/material.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/screens/car_view.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:url_launcher/url_launcher.dart';

({String label, Color bg, Color fg}) _badge(String status) => switch (status) {
      'seen' => (label: 'Үзсэн', bg: AppPalette.amberSoft, fg: AppPalette.amberInk),
      'done' => (label: 'Хариулсан', bg: AppPalette.successSoft, fg: AppPalette.success),
      'deleted' => (label: 'Устгагдсан', bg: AppPalette.destructiveSoft, fg: AppPalette.destructive),
      _ => (label: 'Шинэ', bg: AppPalette.primary, fg: Colors.white),
    };

/// One chat: everything a visitor wrote about one ad, with the team's answers.
class Thread {
  final String key;
  final List<Message> messages;
  final String status;
  final String activeAt;
  const Thread(this.key, this.messages, this.status, this.activeAt);
  Message get last => messages.last;
  ACar? get car => messages.map((m) => m.car).whereType<ACar>().firstOrNull;
}

/// Groups messages into chats (visitor + ad), the most recently active first.
List<Thread> toThreads(List<Message> rows) {
  final groups = <String, List<Message>>{};
  for (final m in rows) {
    final key = '${m.createdBy != null ? 'u${m.createdBy}' : 'p${m.phonenumber}'}|${m.carId ?? 0}';
    groups.putIfAbsent(key, () => []).add(m);
  }
  final threads = groups.entries.map((e) {
    final messages = [...e.value]..sort((a, b) => a.id.compareTo(b.id));
    final times = [
      for (final m in messages) ...[m.createdAt, ...m.replies.map((r) => r.createdAt)],
    ].whereType<String>().toList()
      ..sort();
    bool has(String s) => messages.any((m) => m.status == s);
    final status = has('new')
        ? 'new'
        : has('seen')
            ? 'seen'
            : messages.every((m) => m.status == 'deleted')
                ? 'deleted'
                : 'done';
    return Thread(e.key, messages, status, times.isEmpty ? '' : times.last);
  }).toList();
  return threads..sort((a, b) => b.activeAt.compareTo(a.activeAt));
}

/// Мессеж tab: chats from the web site's chat box, one per visitor and ad.
class MessagesTab extends StatefulWidget {
  const MessagesTab({super.key});
  @override
  State<MessagesTab> createState() => _MessagesTabState();
}

class _MessagesTabState extends State<MessagesTab> {
  String _tab = 'all';
  int _reload = 0;
  static const _tabs = [ChipTab('all', 'Бүгд'), ChipTab('new', 'Шинэ'), ChipTab('seen', 'Үзсэн'), ChipTab('done', 'Хариулсан'), ChipTab('deleted', 'Устгагдсан')];

  @override
  Widget build(BuildContext context) {
    final deleted = _tab == 'deleted';
    return Column(children: [
      FilterBar(children: [ChipTabs<String>(items: _tabs, isOn: (v) => v == _tab, onTap: (v) => setState(() => _tab = v))]),
      Expanded(
        child: Loader<List<Message>>(
          key: ValueKey(deleted),
          fetchKey: _reload,
          fetch: () => AdminApi.messages(deleted ? 'deleted' : null),
          loading: const Padding(padding: EdgeInsets.all(16), child: RowsSkeleton(count: 6)),
          builder: (context, rows, _) {
            final all = toThreads(rows);
            final threads = _tab == 'all' || deleted ? all : all.where((t) => t.status == _tab).toList();
            if (threads.isEmpty) {
              return EmptyView(title: _tab == 'all' ? 'Мессеж олдсонгүй' : '${_tabs.firstWhere((t) => t.value == _tab).label} мессеж олдсонгүй', icon: Icons.chat_bubble_outline_rounded);
            }
            return RefreshIndicator(
              color: AppPalette.primary,
              onRefresh: () async => setState(() => _reload++),
              child: ListView(padding: const EdgeInsets.only(bottom: 100), children: [
                RowList(children: [for (final t in threads) _row(t)]),
              ]),
            );
          },
        ),
      ),
    ]);
  }

  Widget _row(Thread t) {
    final last = t.last;
    final badge = _badge(t.status);
    final reply = last.replies.lastOrNull;
    final preview = reply != null && (reply.createdAt ?? '').compareTo(last.createdAt ?? '') >= 0 ? 'Та: ${reply.reply}' : last.message;
    return InkWell(
      onTap: () async {
        await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ThreadScreen(messageId: last.id)));
        if (mounted) setState(() => _reload++);
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(last.name ?? (last.phonenumber.isEmpty ? 'Нэргүй' : last.phonenumber), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700))),
            Text(timeAgo(t.activeAt), style: const TextStyle(fontSize: 11, color: AppPalette.mutedForeground)),
          ]),
          const SizedBox(height: 2),
          Text(preview,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 14, height: 1.4, fontWeight: t.status == 'new' ? FontWeight.w600 : FontWeight.w400, color: t.status == 'new' ? AppPalette.foreground : AppPalette.mutedForeground)),
          const SizedBox(height: 6),
          Row(children: [
            Badge2(badge.label, background: badge.bg, foreground: badge.fg),
            const SizedBox(width: 8),
            if (t.car != null) Expanded(child: Text(t.car!.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))) else const Spacer(),
            if (t.messages.length > 1) Text('${t.messages.length} мессеж', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppPalette.mutedForeground)),
          ]),
        ]),
      ),
    );
  }
}

/// One chat as its own page: the visitor's messages, our answers, and the actions for the whole chat.
class ThreadScreen extends StatefulWidget {
  final int messageId;
  const ThreadScreen({super.key, required this.messageId});
  @override
  State<ThreadScreen> createState() => _ThreadScreenState();
}

class _ThreadScreenState extends State<ThreadScreen> {
  int _reload = 0;
  bool _markedRead = false;
  bool _busy = false;
  final _draft = TextEditingController();
  final _edit = TextEditingController();
  int? _editing;

  @override
  void dispose() {
    _draft.dispose();
    _edit.dispose();
    super.dispose();
  }

  Future<Thread?> _fetch() async {
    final rows = await AdminApi.messageThread(widget.messageId);
    if (rows == null || rows.isEmpty) return null;
    // Opening the chat reads it: Шинэ → Үзсэн (once per visit).
    final unread = rows.where((m) => m.status == 'new').toList();
    if (unread.isEmpty || _markedRead) return toThreads(rows).first;
    _markedRead = true;
    await Future.wait(unread.map((m) => AdminApi.setMessageStatus(m.id, 'seen')));
    return toThreads(rows.map((m) => m.status == 'new' ? m.withStatus('seen') : m).toList()).first;
  }

  Future<bool> _run(Future<void> Function() action, String done) async {
    setState(() => _busy = true);
    try {
      await action();
      if (!mounted) return false;
      toast(context, done);
      setState(() => _reload++);
      return true;
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
      return false;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Loader<Thread?>(
        fetchKey: _reload,
        fetch: _fetch,
        loading: const AdminPage(title: 'Мессеж', body: PageSkeleton()),
        error: (context, e, retry) => AdminPage(title: 'Мессеж', body: ErrorView(message: errorText(e), onRetry: retry)),
        builder: (context, thread, _) {
          if (thread == null) return const AdminPage(title: 'Мессеж', body: EmptyView(title: 'Мессеж олдсонгүй', icon: Icons.chat_bubble_outline_rounded));
          final last = thread.last;
          return AdminPage(title: last.name ?? (last.phonenumber.isEmpty ? 'Мессеж' : last.phonenumber), body: BusyOverlay(busy: _busy, child: _view(thread)));
        },
      );

  Widget _view(Thread thread) {
    final last = thread.last;
    final status = thread.status;
    final deleted = status == 'deleted';
    final ids = thread.messages.map((m) => m.id).toList();
    final badge = _badge(status);
    final car = thread.car;
    Future<bool> setAll(String next, String done) => _run(() => Future.wait(ids.map((id) => AdminApi.setMessageStatus(id, next))), done);

    final lines = <({bool incoming, String text, String at, bool deleted, MessageReply? reply})>[
      for (final m in thread.messages) ...[
        (incoming: true, text: m.message, at: m.createdAt ?? '', deleted: m.status == 'deleted', reply: null),
        for (final r in m.replies) (incoming: false, text: r.reply, at: r.createdAt ?? '', deleted: false, reply: r),
      ],
    ]..sort((a, b) => a.at.compareTo(b.at));

    return ListView(padding: const EdgeInsets.all(16), children: [
      Section(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(last.name ?? 'Нэргүй', style: const TextStyle(fontWeight: FontWeight.w700)),
                InkWell(
                  onTap: () => launchUrl(Uri.parse('tel:${last.phonenumber}')),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.phone_rounded, size: 14, color: AppPalette.primary),
                    const SizedBox(width: 4),
                    Text(last.phonenumber, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppPalette.primary)),
                  ]),
                ),
              ]),
            ),
            Badge2(badge.label, background: badge.bg, foreground: badge.fg),
          ]),
          if (car != null) ...[
            const SizedBox(height: 12),
            Material(
              color: AppPalette.muted,
              borderRadius: BorderRadius.circular(AppRadius.md),
              child: InkWell(
                borderRadius: BorderRadius.circular(AppRadius.md),
                onTap: () => carPreviewSheet(context, car),
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Row(children: [
                    CarThumb(car, width: 56, height: 40),
                    const SizedBox(width: 12),
                    Expanded(child: Text(car.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700))),
                    const Icon(Icons.chevron_right_rounded, color: AppPalette.mutedForeground),
                  ]),
                ),
              ),
            ),
          ],
        ]),
      ),
      const SizedBox(height: 16),
      for (final line in lines)
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: line.incoming
              ? _bubble(line.text, '${timeAgo(line.at)}${line.deleted ? ' · устгагдсан' : ''}', incoming: true, faded: line.deleted)
              : _editing == line.reply!.id
                  ? _replyForm(_edit, onCancel: () => setState(() => _editing = null), onSubmit: (text) async {
                      if (await _run(() => AdminApi.editMessageReply(line.reply!.id, text), 'Хариуг засварлалаа')) setState(() => _editing = null);
                    })
                  : _bubble(
                      line.text,
                      '${timeAgo(line.at)}${line.reply!.updatedAt != null && line.reply!.updatedAt != line.reply!.createdAt ? ' · засварласан' : ''}',
                      incoming: false,
                      onEdit: deleted
                          ? null
                          : () => setState(() {
                                _editing = line.reply!.id;
                                _edit.text = line.reply!.reply;
                              }),
                    ),
        ),
      const SizedBox(height: 8),
      Section(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (!deleted && _editing == null) ...[
            _replyForm(_draft, onSubmit: (text) async {
              if (await _run(() => AdminApi.replyMessage(last.id, text), 'Хариу илгээлээ')) _draft.clear();
            }),
            const SizedBox(height: 12),
          ],
          Row(children: [
            if (deleted)
              ActionChip2(label: 'Сэргээх', icon: Icons.restore_rounded, onTap: () => setAll('new', 'Сэргээлээ'))
            else if (status == 'new' || status == 'seen')
              ActionChip2(label: 'Хариулсан', icon: Icons.check_rounded, onTap: () => setAll('done', 'Хариулсан гэж тэмдэглэлээ'))
            else
              ActionChip2(label: 'Уншаагүй болгох', icon: Icons.restore_rounded, onTap: () => setAll('new', 'Шинэ болголоо')),
            const Spacer(),
            if (!deleted)
              IconButton(
                tooltip: 'Чат устгах',
                icon: const Icon(Icons.delete_outline_rounded, color: AppPalette.destructive),
                onPressed: () async {
                  if (!await confirmSheet(context, title: 'Чатыг устгах уу?', message: 'Энэ чатын бүх мессеж устгагдана.', confirmLabel: 'Устгах', tone: Tone.danger, icon: Icons.delete_outline_rounded)) return;
                  if (await _run(() => AdminApi.deleteRows('messages', ids), 'Устгалаа') && mounted) Navigator.of(context).pop();
                },
              ),
          ]),
        ]),
      ),
    ]);
  }

  Widget _bubble(String text, String meta, {required bool incoming, bool faded = false, VoidCallback? onEdit}) => Column(
        crossAxisAlignment: incoming ? CrossAxisAlignment.start : CrossAxisAlignment.end,
        children: [
          Opacity(
            opacity: faded ? 0.6 : 1,
            child: Container(
              constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.8),
              padding: EdgeInsets.fromLTRB(14, 8, onEdit != null ? 4 : 14, 8),
              decoration: BoxDecoration(
                color: incoming ? Colors.white : AppPalette.successSoft,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(incoming ? 6 : 18),
                  bottomRight: Radius.circular(incoming ? 18 : 6),
                ),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Flexible(child: Text(text, style: const TextStyle(fontSize: 14, height: 1.5))),
                if (onEdit != null)
                  InkWell(onTap: onEdit, borderRadius: BorderRadius.circular(8), child: const Padding(padding: EdgeInsets.all(6), child: Icon(Icons.edit_outlined, size: 15, color: AppPalette.success))),
              ]),
            ),
          ),
          Padding(padding: const EdgeInsets.fromLTRB(4, 2, 4, 0), child: Text(meta, style: const TextStyle(fontSize: 11, color: AppPalette.mutedForeground))),
        ],
      );

  Widget _replyForm(TextEditingController c, {VoidCallback? onCancel, required ValueChanged<String> onSubmit}) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        TextField(controller: c, minLines: 3, maxLines: 8, maxLength: 2000, decoration: const InputDecoration(hintText: 'Хариугаа бичнэ үү…', counterText: '')),
        const SizedBox(height: 8),
        Row(mainAxisAlignment: MainAxisAlignment.end, children: [
          if (onCancel != null) ...[ActionChip2(label: 'Болих', onTap: onCancel), const SizedBox(width: 8)],
          ActionChip2(
            label: 'Илгээх',
            icon: Icons.send_rounded,
            background: AppPalette.primary,
            foreground: Colors.white,
            onTap: () {
              final text = c.text.trim();
              if (text.isNotEmpty) onSubmit(text);
            },
          ),
        ]),
      ]);
}
