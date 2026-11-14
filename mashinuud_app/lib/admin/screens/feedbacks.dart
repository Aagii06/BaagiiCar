import 'package:flutter/material.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/screens/customers.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:url_launcher/url_launcher.dart';

/// Messages from the web site's "Бидэнд бичих" form.
class FeedbacksScreen extends StatefulWidget {
  const FeedbacksScreen({super.key});
  @override
  State<FeedbacksScreen> createState() => _FeedbacksScreenState();
}

class _FeedbacksScreenState extends State<FeedbacksScreen> {
  String _status = '';
  int _reload = 0;
  int _newCount = 0;

  Future<ListPage<FeedbackItem>> _fetch() async {
    final r = await Future.wait([AdminApi.feedbacks(_status.isEmpty ? null : _status), AdminApi.feedbacks('new')]);
    if (mounted) setState(() => _newCount = r[1].rows.length);
    return r[0];
  }

  Future<void> _toggle(FeedbackItem f) async {
    try {
      await AdminApi.updateRow('feedbacks', f.id, {'status': f.status == 'new' ? 'seen' : 'new'});
      if (mounted) setState(() => _reload++);
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    }
  }

  Future<void> _remove(FeedbackItem f) async {
    if (!await confirmSheet(context,
        title: 'Санал хүсэлтийг устгах уу?', message: f.message.length > 80 ? f.message.substring(0, 80) : f.message, confirmLabel: 'Устгах', tone: Tone.danger, icon: Icons.delete_outline_rounded)) {
      return;
    }
    try {
      await AdminApi.deleteRows('feedbacks', [f.id]);
      if (!mounted) return;
      toast(context, 'Устгалаа');
      setState(() => _reload++);
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    }
  }

  @override
  Widget build(BuildContext context) => AdminPage(
        title: 'Санал хүсэлт',
        body: Column(children: [
          FilterBar(children: [
            ChipTabs<String>(
              items: [const ChipTab('', 'Бүгд'), ChipTab('new', 'Шинэ', count: _newCount), const ChipTab('seen', 'Уншсан')],
              isOn: (v) => v == _status,
              onTap: (v) => setState(() => _status = v),
            ),
          ]),
          Expanded(
            child: Loader<ListPage<FeedbackItem>>(
              fetchKey: '$_status|$_reload',
              fetch: _fetch,
              loading: const Padding(padding: EdgeInsets.all(16), child: RowsSkeleton(count: 6)),
              builder: (context, page, _) {
                if (page.rows.isEmpty) return const EmptyView(title: 'Санал хүсэлт алга', icon: Icons.forum_outlined);
                return ListView(padding: const EdgeInsets.only(bottom: 40), children: [RowList(children: [for (final f in page.rows) _row(f)])]);
              },
            ),
          ),
        ]),
      );

  Widget _row(FeedbackItem f) {
    final isNew = f.status == 'new';
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        InkWell(
          onTap: () async {
            await Navigator.of(context).push(MaterialPageRoute(builder: (_) => FeedbackScreen(feedbackId: f.id)));
            if (mounted) setState(() => _reload++);
          },
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(f.name ?? f.phonenumber ?? 'Нэргүй', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700))),
                  if (f.createdAt != null) Text(timeAgo(f.createdAt), style: const TextStyle(fontSize: 11, color: AppPalette.mutedForeground)),
                ]),
                const SizedBox(height: 2),
                Text(f.message,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 14, height: 1.4, fontWeight: isNew ? FontWeight.w600 : FontWeight.w400, color: isNew ? AppPalette.foreground : AppPalette.mutedForeground)),
              ]),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppPalette.mutedForeground),
          ]),
        ),
        const SizedBox(height: 4),
        Row(children: [
          Badge2(isNew ? 'Шинэ' : 'Уншсан', background: isNew ? AppPalette.primary : AppPalette.muted, foreground: isNew ? Colors.white : AppPalette.mutedForeground),
          const SizedBox(width: 10),
          if (f.phonenumber != null)
            InkWell(
              onTap: () => launchUrl(Uri.parse('tel:${f.phonenumber}')),
              child: Row(children: [const Icon(Icons.phone_outlined, size: 14), const SizedBox(width: 3), Text(f.phonenumber!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))]),
            ),
          const Spacer(),
          IconButton(
            visualDensity: VisualDensity.compact,
            tooltip: isNew ? 'Уншсан болгох' : 'Шинэ болгох',
            icon: Icon(isNew ? Icons.check_rounded : Icons.undo_rounded, size: 18, color: AppPalette.mutedForeground),
            onPressed: () => _toggle(f),
          ),
          IconButton(visualDensity: VisualDensity.compact, tooltip: 'Устгах', icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppPalette.destructive), onPressed: () => _remove(f)),
        ]),
      ]),
    );
  }
}

/// One feedback in full; opening it marks a new one read.
class FeedbackScreen extends StatefulWidget {
  final int feedbackId;
  const FeedbackScreen({super.key, required this.feedbackId});
  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  bool _markedRead = false;
  int _reload = 0;
  bool _busy = false;

  Future<FeedbackItem?> _fetch() async {
    final f = await AdminApi.feedback(widget.feedbackId);
    if (f == null || f.status != 'new' || _markedRead) return f;
    _markedRead = true;
    await AdminApi.updateRow('feedbacks', f.id, {'status': 'seen'});
    return FeedbackItem({...f.j, 'status': 'seen'});
  }

  Future<void> _toggle(FeedbackItem f) async {
    final isNew = f.status == 'new';
    setState(() => _busy = true);
    try {
      await AdminApi.updateRow('feedbacks', f.id, {'status': isNew ? 'seen' : 'new'});
      if (!mounted) return;
      toast(context, isNew ? 'Уншсан болголоо' : 'Шинэ болголоо');
      // Back to the list on "Шинэ болгох": staying here would read it again anyway.
      if (isNew) {
        setState(() => _reload++);
      } else {
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _remove(FeedbackItem f) async {
    if (!await confirmSheet(context,
        title: 'Санал хүсэлтийг устгах уу?', message: f.message.length > 80 ? f.message.substring(0, 80) : f.message, confirmLabel: 'Устгах', tone: Tone.danger, icon: Icons.delete_outline_rounded)) {
      return;
    }
    setState(() => _busy = true);
    try {
      await AdminApi.deleteRows('feedbacks', [f.id]);
      if (!mounted) return;
      toast(context, 'Устгалаа');
      Navigator.of(context).pop();
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _link(IconData icon, String label, String value, VoidCallback onTap) => InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(children: [
            Icon(icon, color: AppPalette.mutedForeground),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(label, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
              ]),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppPalette.mutedForeground),
          ]),
        ),
      );

  @override
  Widget build(BuildContext context) => AdminPage(
        title: 'Санал хүсэлт',
        body: Loader<FeedbackItem?>(
          fetchKey: _reload,
          fetch: _fetch,
          builder: (context, f, _) {
            if (f == null) return const EmptyView(title: 'Санал хүсэлт олдсонгүй', icon: Icons.forum_outlined);
            final isNew = f.status == 'new';
            final links = [
              if (f.phonenumber != null) _link(Icons.phone_outlined, 'Утас', f.phonenumber!, () => launchUrl(Uri.parse('tel:${f.phonenumber}'))),
              if (f.email != null) _link(Icons.mail_outline_rounded, 'И-мэйл', f.email!, () => launchUrl(Uri.parse('mailto:${f.email}'))),
              if (f.customerId != null)
                _link(Icons.person_outline_rounded, 'Бүртгэлтэй хэрэглэгч', 'Хэрэглэгчийн мэдээлэл харах',
                    () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CustomerFormScreen(customerId: f.customerId!)))),
            ];
            return BusyOverlay(
              busy: _busy,
              child: ListView(padding: const EdgeInsets.all(16), children: [
                Section(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(f.name ?? f.phonenumber ?? f.email ?? 'Нэргүй', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                          Text('#${f.id}${f.createdAt != null ? ' · ${f.createdAt!.substring(0, 16)} · ${timeAgo(f.createdAt)}' : ''}', style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                        ]),
                      ),
                      Badge2(isNew ? 'Шинэ' : 'Уншсан', background: isNew ? AppPalette.primary : AppPalette.muted, foreground: isNew ? Colors.white : AppPalette.mutedForeground),
                    ]),
                    const SizedBox(height: 14),
                    Text(f.message, style: const TextStyle(fontSize: 15, height: 1.5)),
                  ]),
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  child: Container(
                    color: AppPalette.card,
                    child: links.isEmpty
                        ? const Padding(padding: EdgeInsets.all(16), child: Text('Холбоо барих мэдээлэл үлдээгээгүй', style: TextStyle(color: AppPalette.mutedForeground)))
                        : Column(children: [for (var i = 0; i < links.length; i++) ...[if (i > 0) const Divider(height: 1), links[i]]]),
                  ),
                ),
                if (f.email != null) ...[
                  const SizedBox(height: 12),
                  PrimaryButton(
                    label: 'И-мэйлээр хариулах',
                    icon: Icons.reply_rounded,
                    onTap: () => launchUrl(Uri(scheme: 'mailto', path: f.email, queryParameters: {'subject': 'Re: Санал хүсэлт #${f.id}'})),
                  ),
                ],
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(child: SoftButton(label: isNew ? 'Уншсан болгох' : 'Шинэ болгох', icon: isNew ? Icons.check_rounded : Icons.undo_rounded, background: AppPalette.card, onTap: () => _toggle(f))),
                  const SizedBox(width: 8),
                  Expanded(child: SoftButton(label: 'Устгах', icon: Icons.delete_outline_rounded, background: AppPalette.card, color: AppPalette.destructive, onTap: () => _remove(f))),
                ]),
              ]),
            );
          },
        ),
      );
}
