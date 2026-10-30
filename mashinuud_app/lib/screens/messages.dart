import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mashinuud_app/api/api.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/api/models.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/car_chat.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/car.dart';
import 'package:mashinuud_app/widgets/common.dart';

/// Unread team answers across all threads, for the profile badge.
Future<int> unreadTotal() async {
  final token = Stores.auth.token;
  return token == null ? 0 : Api.getUnreadCount(token);
}

/// One ad's messages, oldest first; [carId] 0 = general questions.
class Thread {
  final int carId;
  final Car? car;
  final List<MyMessage> messages;
  Thread(this.carId, this.car, this.messages);
  String get title => car?.titleWithYear ?? 'Ерөнхий асуулт';
}

Future<List<Thread>> _loadThreads() async {
  final rows = await Api.getMyMessages(Stores.auth.token!);
  final ids = {for (final m in rows) ?m.carId}.toList();
  final cars = {for (final c in await Api.getCarsByIds(ids)) c.id: c};
  // Rows come newest first, so threads are ordered by their latest message.
  final byCar = <int, Thread>{};
  for (final m in rows) {
    final key = m.carId ?? 0;
    byCar.putIfAbsent(key, () => Thread(key, cars[key], [])).messages.insert(0, m);
  }
  return byCar.values.toList();
}

class _Status extends StatelessWidget {
  final bool done;
  const _Status({required this.done});
  @override
  Widget build(BuildContext context) => done
      ? const Pill('Холбогдсон', background: AppPalette.successSoft, color: AppPalette.success)
      : const Pill('Хүлээгдэж байна', background: AppPalette.amberSoft, color: AppPalette.amberInk);
}

/// Conversations list; tapping one opens it to keep writing.
class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});
  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final _loader = GlobalKey<LoaderState<List<Thread>>>();

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Мессеж')),
        body: Loader<List<Thread>>(
          key: _loader,
          fetch: _loadThreads,
          loading: const Padding(
            padding: EdgeInsets.all(16),
            child: Panel(padding: EdgeInsets.zero, child: RowsSkeleton(dividers: true)),
          ),
          error: (context, e, retry) {
            if (e is ApiError && e.status == 401) Stores.auth.signOut();
            return Padding(padding: const EdgeInsets.all(16), child: ErrorView(message: '$e', onRetry: retry));
          },
          builder: (context, threads, _) {
            if (threads.isEmpty) {
              return const Padding(
                padding: EdgeInsets.all(16),
                child: EmptyView(title: 'Мессеж алга', description: 'Зар дээрх чат товчоор асуултаа илгээгээрэй.', icon: Icons.chat_bubble_outline_rounded),
              );
            }
            return RefreshIndicator(
              color: AppPalette.primary,
              onRefresh: () async => _loader.currentState?.reload(),
              child: ListView(padding: const EdgeInsets.all(16), children: [
                Panel(
                  padding: EdgeInsets.zero,
                  child: Column(children: [
                    for (var i = 0; i < threads.length; i++) ...[
                      if (i > 0) const Divider(height: 1),
                      _ThreadTile(
                        thread: threads[i],
                        unread: threads[i].messages.fold(0, (n, m) => n + m.unread),
                        onTap: () async {
                          await Navigator.of(context).push(MaterialPageRoute(builder: (_) => ThreadScreen(carId: threads[i].carId)));
                          _loader.currentState?.reload();
                        },
                      ),
                    ],
                  ]),
                ),
              ]),
            );
          },
        ),
      );
}

class _ThreadTile extends StatelessWidget {
  final Thread thread;
  final int unread;
  final VoidCallback onTap;
  const _ThreadTile({required this.thread, required this.unread, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final last = thread.messages.last;
    final preview = last.allReplies.isNotEmpty ? 'Хариу: ${last.allReplies.last.reply}' : last.message;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(children: [
          SizedBox(
            width: 64,
            height: 48,
            child: thread.car != null
                ? CarImage(thread.car!, size: 'thumb', radius: AppRadius.sm)
                : Container(
                    decoration: BoxDecoration(color: AppPalette.primarySoft, borderRadius: BorderRadius.circular(AppRadius.sm)),
                    child: const Icon(Icons.chat_bubble_outline_rounded, color: AppPalette.primary, size: 20),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(thread.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700))),
                Text(timeAgo(last.repliedAt ?? last.createdAt), style: const TextStyle(fontSize: 11, color: AppPalette.mutedForeground)),
              ]),
              const SizedBox(height: 4),
              Row(children: [
                Expanded(
                  child: Text(
                    preview,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: last.reply != null ? FontWeight.w600 : FontWeight.w400,
                      color: last.reply != null ? AppPalette.foreground : AppPalette.mutedForeground,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                if (unread > 0)
                  Badge(label: Text('$unread'), backgroundColor: AppPalette.primary)
                else
                  _Status(done: last.status == 'done' || last.reply != null),
              ]),
            ]),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right_rounded, color: AppPalette.mutedForeground),
        ]),
      ),
    );
  }
}

/// One conversation: the visitor's messages and the team's answers, with a box to keep writing.
class ThreadScreen extends StatefulWidget {
  final int carId;
  const ThreadScreen({super.key, required this.carId});
  @override
  State<ThreadScreen> createState() => _ThreadScreenState();
}

class _ThreadScreenState extends State<ThreadScreen> {
  final _draft = TextEditingController();
  final _scroll = ScrollController();
  Thread? _thread;
  Object? _error;
  bool _busy = false;
  String? _sendError;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _load();
    // Pick up the team's answers while the thread is open.
    _poll = Timer.periodic(const Duration(seconds: 15), (_) => _load());
  }

  @override
  void dispose() {
    _poll?.cancel();
    _draft.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final threads = await _loadThreads();
      final t = threads.where((t) => t.carId == widget.carId).firstOrNull;
      Car? car = t?.car;
      if (t == null && widget.carId != 0) car = await Api.getCar(widget.carId);
      if (!mounted) return;
      int lines(Thread? th) => th?.messages.fold<int>(0, (n, m) => n + 1 + m.allReplies.length) ?? 0;
      final grew = lines(t) != lines(_thread);
      setState(() {
        _thread = t ?? Thread(widget.carId, car, []);
        _error = null;
      });
      // Opening the thread reads its answers (clears the badges on the server).
      if (t != null && t.messages.any((m) => m.unread > 0)) {
        Api.markRead(Stores.auth.token!, widget.carId == 0 ? null : widget.carId).catchError((_) {});
      }
      if (grew) _scrollDown();
    } catch (e) {
      if (e is ApiError && e.status == 401) Stores.auth.signOut();
      if (mounted && _thread == null) setState(() => _error = e);
    }
  }

  void _scrollDown() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
      });

  Future<void> _send() async {
    final text = _draft.text.trim();
    if (text.isEmpty || _busy) return;
    setState(() {
      _busy = true;
      _sendError = null;
    });
    try {
      await Api.sendMessage(token: Stores.auth.token!, message: text, carId: widget.carId == 0 ? null : widget.carId);
      _draft.clear();
      await _load();
    } on ApiError catch (e) {
      if (e.status == 401) {
        Stores.auth.signOut();
      } else {
        _sendError = e.message;
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = _thread;
    return Scaffold(
      appBar: AppBar(title: const Text('Мессеж')),
      body: _error != null
          ? Padding(padding: const EdgeInsets.all(16), child: ErrorView(message: '$_error', onRetry: _load))
          : t == null
              ? const _ThreadSkeleton()
              : Column(children: [
                  if (t.car != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                      child: Material(
                        color: AppPalette.card,
                        borderRadius: BorderRadius.circular(AppRadius.xl),
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: () => openCar(context, t.car!),
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Row(children: [
                              SizedBox(width: 64, height: 48, child: CarImage(t.car!, size: 'thumb', radius: AppRadius.sm)),
                              const SizedBox(width: 12),
                              Expanded(child: Text(t.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700))),
                              const Icon(Icons.chevron_right_rounded, color: AppPalette.mutedForeground),
                            ]),
                          ),
                        ),
                      ),
                    ),
                  Expanded(
                    child: ListView(controller: _scroll, padding: const EdgeInsets.all(16), children: [
                      if (t.messages.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Center(child: Text('Асуултаа бичээд илгээнэ үү.', style: TextStyle(color: AppPalette.mutedForeground))),
                        ),
                      for (final m in t.messages) ...[
                        ChatBubble(
                          text: m.message,
                          mine: true,
                          caption: m.allReplies.isEmpty ? '${timeAgo(m.createdAt)} · ${m.status == 'done' ? 'Холбогдсон' : 'Хүлээгдэж байна'}' : timeAgo(m.createdAt),
                        ),
                        for (final reply in m.allReplies)
                          ChatBubble(text: reply.reply, mine: false, caption: '${t.car?.dealerName ?? 'Cardealer'} · ${timeAgo(reply.createdAt)}'),
                      ],
                      const Padding(
                        padding: EdgeInsets.only(top: 4),
                        child: Center(child: Text('Ажлын цагаар утсаар эргэн холбогдоно', style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground))),
                      ),
                    ]),
                  ),
                  if (_sendError != null)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
                      child: Text(_sendError!, style: const TextStyle(fontSize: 12, color: AppPalette.destructive)),
                    ),
                  Composer(controller: _draft, busy: _busy, onSend: _send),
                ]),
    );
  }
}

/// Placeholder chat: our questions on the right, replies on the left.
class _ThreadSkeleton extends StatelessWidget {
  const _ThreadSkeleton();
  @override
  Widget build(BuildContext context) => Pulse(
        child: ListView(padding: const EdgeInsets.all(16), physics: const NeverScrollableScrollPhysics(), children: [
          const SkeletonBox(height: 68, radius: AppRadius.xl, color: AppPalette.card),
          const SizedBox(height: 16),
          for (final (mine, width) in const [(true, 220.0), (false, 180.0), (true, 160.0), (false, 240.0)])
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Align(
                alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                child: SkeletonBox(width: width, height: 48, radius: 16, color: mine ? AppPalette.muted : AppPalette.card),
              ),
            ),
        ]),
      );
}
