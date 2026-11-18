import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:url_launcher/url_launcher.dart';

/// "12,000₮", also for 0.
String money(num v) => '${formatNumber(v)}₮';

const _txType = {'topup': 'Данс цэнэглэлт', 'renew': 'Зар шинэчилсэн', 'adjust': 'Админ засварласан'};
const _txMethod = {'qpay': 'QPay', 'bank': 'Дансаар', 'balance': 'Үлдэгдлээс', 'admin': 'Админ'};

/// One wallet transaction; approve / reject (admin) on pending bank top-ups.
class TxRow extends StatelessWidget {
  final WalletTx tx;
  final bool showDealer;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  const TxRow({super.key, required this.tx, this.showDealer = false, this.onApprove, this.onReject});

  @override
  Widget build(BuildContext context) {
    final income = tx.amount > 0;
    final (statusLabel, statusBg, statusFg) = switch (tx.status) {
      'pending' => ('Хүлээгдэж буй', AppPalette.amberSoft, AppPalette.amberInk),
      'rejected' => ('Буцаасан', AppPalette.destructiveSoft, AppPalette.destructive),
      _ => ('Амжилттай', AppPalette.successSoft, AppPalette.success),
    };
    const muted = TextStyle(fontSize: 12, color: AppPalette.mutedForeground);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (showDealer)
                Text(tx.dealerName ?? '#${tx.dealerId}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppPalette.primary)),
              Text('${_txType[tx.type] ?? tx.type}${tx.carCode != null ? ' · #${tx.carCode}' : ''}',
                  maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
              Text(
                [_txMethod[tx.method] ?? tx.method, if (tx.createdAt != null) tx.createdAt!.substring(0, tx.createdAt!.length.clamp(0, 16)), ?tx.createdByName].join(' · '),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: muted,
              ),
              if (tx.note != null) Text(tx.note!, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
              if (tx.status == 'rejected' && tx.rejectReason != null)
                Text('↩ ${tx.rejectReason}', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppPalette.destructive)),
            ]),
          ),
          const SizedBox(width: 8),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('${income ? '+' : '−'}${money(tx.amount.abs())}',
                style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: tx.status != 'done' ? AppPalette.mutedForeground : (income ? AppPalette.success : AppPalette.foreground))),
            const SizedBox(height: 4),
            Badge2(statusLabel, background: statusBg, foreground: statusFg),
          ]),
        ]),
        if (tx.status == 'pending' && (onApprove != null || onReject != null)) ...[
          const SizedBox(height: 8),
          Wrap(spacing: 8, children: [
            if (onApprove != null)
              ActionChip2(label: 'Орсон, батлах', icon: Icons.check_rounded, background: AppPalette.success, foreground: Colors.white, onTap: onApprove!),
            if (onReject != null)
              ActionChip2(label: 'Буцаах', icon: Icons.undo_rounded, background: AppPalette.destructiveSoft, foreground: AppPalette.destructive, onTap: onReject!),
          ]),
        ],
      ]),
    );
  }
}

/// Admins: dealers' balances and bank top-ups to confirm. Dealers: their own balance, top-up and history.
class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});
  @override
  Widget build(BuildContext context) => AdminApi.session.isAdmin ? const _AdminWallet() : const _DealerWallet();
}

// --- dealer --------------------------------------------------------------------

class _DealerWallet extends StatefulWidget {
  const _DealerWallet();
  @override
  State<_DealerWallet> createState() => _DealerWalletState();
}

class _DealerWalletState extends State<_DealerWallet> {
  static const _quick = [10000, 20000, 50000, 100000];
  final _amount = TextEditingController();
  final _note = TextEditingController();
  int _reload = 0;
  String? _method;
  bool _sending = false;

  int get _value => int.tryParse(_amount.text.replaceAll(RegExp(r'\D'), '')) ?? 0;

  @override
  void dispose() {
    _amount.dispose();
    _note.dispose();
    super.dispose();
  }

  void _setAmount(int v) => setState(() {
        _amount.text = '$v';
        _method = null;
      });

  Future<void> _qpay() async {
    final paid = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppPalette.card,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _QpaySheet(amount: _value),
    );
    if (paid == true && mounted) {
      toast(context, 'Төлбөр орлоо, дансанд нэмэгдлээ');
      setState(() {
        _amount.clear();
        _reload++;
      });
    }
  }

  Future<void> _sendBank() async {
    if (_value < 100) return;
    setState(() => _sending = true);
    try {
      await AdminApi.requestBankTopup(_value, _note.text.trim());
      if (!mounted) return;
      toast(context, 'Хүсэлт илгээлээ. Админ шалгаад дансанд тань орно');
      setState(() {
        _method = null;
        _amount.clear();
        _note.clear();
        _reload++;
      });
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) => AdminPage(
        title: 'Миний данс',
        body: Loader<(PaymentInfo, ListPage<WalletTx>)>(
          fetchKey: _reload,
          fetch: () async {
            final r = await Future.wait([AdminApi.paymentInfo(), AdminApi.transactions()]);
            return (r[0] as PaymentInfo, r[1] as ListPage<WalletTx>);
          },
          loading: const Padding(padding: EdgeInsets.all(16), child: RowsSkeleton(count: 5)),
          builder: (context, data, _) {
            final (info, history) = data;
            if (info.dealerId == null) return const EmptyView(title: 'Та дилерт харьяалагдаагүй байна', description: 'Админд хандана уу', icon: Icons.storefront_outlined);
            final valid = _value >= 100;
            final bank = info.bank;
            return ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 40), children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppPalette.primary, Color(0xFFF97316)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Row(children: [
                    Icon(Icons.account_balance_wallet_outlined, size: 16, color: Colors.white70),
                    SizedBox(width: 6),
                    Text('Дансны үлдэгдэл', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white70)),
                  ]),
                  const SizedBox(height: 4),
                  Text(money(info.balance ?? 0), style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: Colors.white)),
                  const SizedBox(height: 8),
                  Text('Зарыг ${info.renewDays} хоногт нэг удаа үнэгүй шинэчилнэ. Түүнээс өмнө шинэчлэхэд ${money(info.renewPrice)} дансаас хасагдана.',
                      style: const TextStyle(fontSize: 12, color: Colors.white)),
                ]),
              ),
              const SizedBox(height: 16),
              Section(
                title: 'Данс цэнэглэх',
                child: !info.qpay && bank == null
                    ? const Text('Төлбөр хүлээн авах арга тохируулаагүй байна. Админд хандана уу', style: TextStyle(color: AppPalette.mutedForeground))
                    : Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        FieldLabel(
                          label: 'Дүн (₮)',
                          error: _amount.text.isNotEmpty && !valid ? 'Хамгийн багадаа 100₮' : null,
                          child: TextField(
                            controller: _amount,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(9)],
                            decoration: InputDecoration(hintText: '0', suffixText: _value > 0 ? money(_value) : null),
                            onChanged: (_) => setState(() => _method = null),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(spacing: 8, runSpacing: 8, children: [
                          for (final a in _quick)
                            ChoiceChip(label: Text(money(a)), selected: _value == a, onSelected: (_) => _setAmount(a)),
                        ]),
                        const SizedBox(height: 12),
                        Row(children: [
                          if (info.qpay)
                            Expanded(
                              child: FilledButton.icon(onPressed: valid ? _qpay : null, icon: const Icon(Icons.qr_code_2_rounded), label: const Text('QPay')),
                            ),
                          if (info.qpay && bank != null) const SizedBox(width: 8),
                          if (bank != null)
                            Expanded(
                              child: FilledButton.tonalIcon(
                                onPressed: valid ? () => setState(() => _method = 'bank') : null,
                                icon: const Icon(Icons.account_balance_outlined),
                                label: const Text('Дансаар'),
                              ),
                            ),
                        ]),
                      ]),
              ),
              if (_method == 'bank' && bank != null) ...[
                const SizedBox(height: 16),
                _bankSection(bank),
              ],
              const SizedBox(height: 20),
              const Text('Гүйлгээний түүх', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              if (history.rows.isEmpty)
                const EmptyView(title: 'Гүйлгээ алга', icon: Icons.receipt_long_outlined)
              else
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  child: RowList(children: [for (final tx in history.rows) TxRow(tx: tx)]),
                ),
            ]);
          },
        ),
      );

  Widget _bankSection(Map<String, dynamic> bank) {
    final rows = <(String, String, String)>[
      ('Банк', '${bank['bank_name'] ?? ''}', '${bank['bank_name'] ?? ''}'),
      ('Хүлээн авагч', '${bank['account_name'] ?? ''}', '${bank['account_name'] ?? ''}'),
      ('Дансны дугаар', '${bank['account_number'] ?? ''}', '${bank['account_number'] ?? ''}'),
      if (bank['iban'] != null && '${bank['iban']}'.isNotEmpty) ('IBAN', '${bank['iban']}', '${bank['iban']}'),
      ('Дүн', money(_value), '$_value'),
    ];
    return Section(
      title: 'Дансаар шилжүүлэх',
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('Доорх данс руу ${money(_value)} шилжүүлээд «Шилжүүлсэн» товчийг дарна уу. Админ шалгаад дансанд тань оруулна.',
            style: const TextStyle(fontSize: 13, color: AppPalette.mutedForeground)),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(color: AppPalette.muted, borderRadius: BorderRadius.circular(AppRadius.md)),
          child: Column(children: [
            for (var i = 0; i < rows.length; i++) ...[
              if (i > 0) const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Row(children: [
                  SizedBox(width: 110, child: Text(rows[i].$1, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground))),
                  Expanded(child: Text(rows[i].$2, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600))),
                  IconButton(
                    tooltip: 'Хуулах',
                    icon: const Icon(Icons.copy_rounded, size: 18, color: AppPalette.mutedForeground),
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: rows[i].$3));
                      toast(context, 'Хуулагдлаа');
                    },
                  ),
                ]),
              ),
            ],
          ]),
        ),
        const SizedBox(height: 12),
        FieldLabel(
          label: 'Гүйлгээний утга / тайлбар',
          hint: 'Шилжүүлэхдээ бичсэн утгаа оруулбал админ хурдан олно',
          child: TextField(controller: _note, maxLength: 500, decoration: const InputDecoration(counterText: '')),
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: _sending ? null : _sendBank,
          icon: _sending ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.check_rounded),
          label: const Text('Шилжүүлсэн'),
        ),
      ]),
    );
  }
}

/// QPay invoice for a top-up: the QR and bank-app links; polls until paid, then pops `true`.
class _QpaySheet extends StatefulWidget {
  final int amount;
  const _QpaySheet({required this.amount});
  @override
  State<_QpaySheet> createState() => _QpaySheetState();
}

class _QpaySheetState extends State<_QpaySheet> {
  QpayInvoice? _invoice;
  String? _error;
  Timer? _timer;
  bool _checking = false;
  bool _notYet = false;

  @override
  void initState() {
    super.initState();
    AdminApi.createTopupInvoice(widget.amount).then((inv) {
      if (!mounted) return;
      setState(() => _invoice = inv);
      _timer = Timer.periodic(const Duration(seconds: 4), (_) => _check(silent: true));
    }, onError: (e) => mounted ? setState(() => _error = errorText(e)) : null);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _check({bool silent = false}) async {
    final inv = _invoice;
    if (inv == null || _checking) return;
    if (!silent) setState(() => _checking = true);
    try {
      final paid = await AdminApi.checkTopupInvoice(inv.id);
      if (!mounted) return;
      if (paid) {
        _timer?.cancel();
        Navigator.pop(context, true);
      } else if (!silent) {
        setState(() => _notYet = true);
      }
    } catch (e) {
      if (mounted && !silent) setState(() => _error = errorText(e));
    } finally {
      if (mounted && !silent) setState(() => _checking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inv = _invoice;
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            const Expanded(child: Text('QPay-ээр төлөх', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
            IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(context)),
          ]),
          if (_error != null)
            Padding(padding: const EdgeInsets.symmetric(vertical: 24), child: Text(_error!, style: const TextStyle(color: AppPalette.destructive)))
          else if (inv == null)
            const Padding(padding: EdgeInsets.all(48), child: Center(child: CircularProgressIndicator()))
          else ...[
            if (inv.qrImage != null)
              Center(
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white, border: Border.all(color: AppPalette.border), borderRadius: BorderRadius.circular(AppRadius.md)),
                  child: Image.memory(base64Decode(inv.qrImage!), width: 220, height: 220, gaplessPlayback: true),
                ),
              ),
            const SizedBox(height: 8),
            Text(money(inv.amount), textAlign: TextAlign.center, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppPalette.primary)),
            const Text('Банкны аппаараа QR кодыг уншуулж эсвэл доороос аппаа сонгож төлнө үү',
                textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: AppPalette.mutedForeground)),
            if (inv.urls.isNotEmpty) ...[
              const SizedBox(height: 16),
              GridView.count(
                crossAxisCount: 4,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 0.85,
                children: [
                  for (final app in inv.urls)
                    InkWell(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      onTap: () => launchUrl(Uri.parse('${app['link']}'), mode: LaunchMode.externalApplication),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(border: Border.all(color: AppPalette.border), borderRadius: BorderRadius.circular(AppRadius.md)),
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.network('${app['logo']}', width: 36, height: 36, errorBuilder: (_, _, _) => const SizedBox(width: 36, height: 36))),
                          const SizedBox(height: 4),
                          Text('${app['description'] ?? app['name']}', maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: const TextStyle(fontSize: 10, height: 1.1)),
                        ]),
                      ),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: _checking ? null : () => _check(),
              child: _checking ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Төлбөр шалгах'),
            ),
            if (_notYet)
              const Padding(
                padding: EdgeInsets.only(top: 6),
                child: Text('Төлбөр хараахан орж ирээгүй байна', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
              ),
          ],
        ]),
      ),
    );
  }
}

// --- admin ---------------------------------------------------------------------

class _AdminWallet extends StatefulWidget {
  const _AdminWallet();
  @override
  State<_AdminWallet> createState() => _AdminWalletState();
}

class _AdminWalletState extends State<_AdminWallet> {
  String _tab = 'pending';
  DealerBalance? _dealer;
  int _reload = 0;
  int _pending = 0;

  Future<void> _act(Future<void> Function() action, String done) async {
    try {
      await action();
      if (!mounted) return;
      toast(context, done);
      setState(() => _reload++);
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    }
  }

  Future<void> _approve(WalletTx tx) async {
    if (!await confirmSheet(context,
        title: 'Шилжүүлэг орсныг баталгаажуулах уу?',
        message: '${tx.dealerName ?? ''} дилерийн дансанд ${money(tx.amount)} нэмэгдэнэ. Банкны хуулгаасаа шалгасан эсэхээ нягтална уу.',
        confirmLabel: 'Батлах',
        tone: Tone.success,
        icon: Icons.check_rounded)) {
      return;
    }
    await _act(() => AdminApi.approveTopup(tx.id), 'Баталгаажууллаа, дилерийн дансанд орлоо');
  }

  Future<void> _reject(WalletTx tx) async {
    final reason = await promptSheet(context, title: 'Хүсэлтийг буцаах уу?', label: 'Шалтгаан', placeholder: 'Жишээ нь: шилжүүлэг ороогүй', confirmLabel: 'Буцаах', tone: Tone.danger);
    if (reason == null) return;
    await _act(() => AdminApi.rejectTopup(tx.id, reason), 'Буцаалаа');
  }

  Future<void> _adjust(DealerBalance d) async {
    final raw = await promptSheet(context,
        title: '${d.name} — данс засах',
        message: 'Нэмэх бол эерэг (50000), хасах бол сөрөг (-50000) дүн бичнэ үү. Одоогийн үлдэгдэл ${money(d.balance)}.',
        label: 'Дүн (₮)',
        placeholder: '50000',
        confirmLabel: 'Үргэлжлүүлэх');
    if (raw == null || !mounted) return;
    final amount = int.tryParse(raw.replaceAll(RegExp(r'[\s,₮]'), ''));
    if (amount == null || amount == 0) return toast(context, 'Дүн буруу байна', error: true);
    final note = await promptSheet(context, title: 'Тайлбар', label: 'Яагаад засаж байгаа вэ?', placeholder: 'Жишээ нь: бэлнээр төлсөн', confirmLabel: 'Хадгалах');
    if (note == null) return;
    await _act(() => AdminApi.adjustBalance(d.id, amount, note), 'Хадгаллаа');
  }

  Future<(List<DealerBalance>, ListPage<WalletTx>?)> _fetch() async {
    final balances = await AdminApi.dealerBalances();
    final pending = balances.fold<int>(0, (s, d) => s + d.pending);
    if (mounted && pending != _pending) setState(() => _pending = pending);
    if (_tab == 'dealers') return (balances, null);
    return (balances, await AdminApi.transactions(status: _tab == 'pending' ? 'pending' : null, dealerId: _dealer?.id, limit: 100));
  }

  @override
  Widget build(BuildContext context) => AdminPage(
        title: 'Дилерийн данс',
        actions: [
          IconButton(
            tooltip: 'Төлбөрийн тохиргоо',
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PaymentSettingsScreen())),
          ),
        ],
        body: Column(children: [
          FilterBar(children: [
            ChipTabs<String>(
              items: [ChipTab('pending', 'Хүсэлт', count: _pending), const ChipTab('dealers', 'Дилерүүд'), ChipTab('all', _dealer != null ? '${_dealer!.name} ✕' : 'Бүх гүйлгээ')],
              isOn: (v) => v == _tab,
              onTap: (v) => setState(() {
                if (v == 'all' && _tab == 'all') _dealer = null;
                if (v != 'all') _dealer = null;
                _tab = v;
              }),
            ),
          ]),
          Expanded(
            child: Loader<(List<DealerBalance>, ListPage<WalletTx>?)>(
              fetchKey: '$_tab|${_dealer?.id}|$_reload',
              fetch: _fetch,
              loading: const Padding(padding: EdgeInsets.all(16), child: RowsSkeleton(count: 6)),
              builder: (context, data, _) {
                final (balances, txs) = data;
                if (txs == null) {
                  if (balances.isEmpty) return const EmptyView(title: 'Дилер алга', icon: Icons.storefront_outlined);
                  return ListView(padding: const EdgeInsets.only(bottom: 40), children: [
                    RowList(children: [for (final d in balances) _dealerRow(d)]),
                  ]);
                }
                if (txs.rows.isEmpty) {
                  return EmptyView(title: _tab == 'pending' ? 'Хүлээгдэж буй хүсэлт алга' : 'Гүйлгээ алга', icon: Icons.receipt_long_outlined);
                }
                return ListView(padding: const EdgeInsets.only(bottom: 40), children: [
                  RowList(children: [
                    for (final tx in txs.rows) TxRow(tx: tx, showDealer: true, onApprove: () => _approve(tx), onReject: () => _reject(tx)),
                  ]),
                ]);
              },
            ),
          ),
        ]),
      );

  Widget _dealerRow(DealerBalance d) => InkWell(
        onTap: () => setState(() {
          _dealer = d;
          _tab = 'all';
        }),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 8, 10),
          child: Row(children: [
            DealerLogo(d.logo, size: 40),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(d.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
                Text(money(d.balance), style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: d.balance > 0 ? AppPalette.success : AppPalette.mutedForeground)),
                if (d.pending > 0) Text('${d.pending} хүсэлт хүлээгдэж буй', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppPalette.amberInk)),
              ]),
            ),
            TextButton(onPressed: () => _adjust(d), child: const Text('Засах')),
          ]),
        ),
      );
}

// --- payment settings (admin) ----------------------------------------------------

/// Renew price, bank account and QPay credentials. Saving with QPay on checks the credentials first.
class PaymentSettingsScreen extends StatefulWidget {
  const PaymentSettingsScreen({super.key});
  @override
  State<PaymentSettingsScreen> createState() => _PaymentSettingsScreenState();
}

class _PaymentSettingsScreenState extends State<PaymentSettingsScreen> {
  final _price = TextEditingController();
  final _bankName = TextEditingController();
  final _accountName = TextEditingController();
  final _accountNumber = TextEditingController();
  final _iban = TextEditingController();
  final _username = TextEditingController();
  final _password = TextEditingController();
  final _invoiceCode = TextEditingController();
  bool _bankOn = false;
  bool _qpayOn = false;
  bool _sandbox = true;
  bool _hasPassword = false;
  bool _loaded = false;
  bool _saving = false;
  bool _submitted = false;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final c in [_price, _bankName, _accountName, _accountNumber, _iban, _username, _password, _invoiceCode]) {
      c.dispose();
    }
    super.dispose();
  }

  void _apply(Map<String, dynamic> s) {
    final bank = (s['bank'] as Map?) ?? {};
    final qpay = (s['qpay'] as Map?) ?? {};
    _price.text = '${(s['renew_price'] as num?)?.round() ?? 0}';
    _bankOn = bank['enabled'] == true;
    _bankName.text = '${bank['bank_name'] ?? ''}';
    _accountName.text = '${bank['account_name'] ?? ''}';
    _accountNumber.text = '${bank['account_number'] ?? ''}';
    _iban.text = '${bank['iban'] ?? ''}';
    _qpayOn = qpay['enabled'] == true;
    _sandbox = qpay['sandbox'] != false;
    _username.text = '${qpay['username'] ?? ''}';
    _invoiceCode.text = '${qpay['invoice_code'] ?? ''}';
    _hasPassword = qpay['has_password'] == true;
    _password.clear();
  }

  Future<void> _load() async {
    try {
      final s = await AdminApi.paymentSettings();
      if (!mounted) return;
      setState(() {
        _apply(s);
        _loaded = true;
      });
    } catch (e) {
      if (mounted) setState(() => _loadError = errorText(e));
    }
  }

  String? _required(bool on, TextEditingController c) => _submitted && on && c.text.trim().isEmpty ? 'Заавал бөглөнө' : null;

  Future<void> _save() async {
    setState(() => _submitted = true);
    bool blank(bool on, List<TextEditingController> cs) => on && cs.any((c) => c.text.trim().isEmpty);
    if (blank(_bankOn, [_bankName, _accountName, _accountNumber])) return;
    if (blank(_qpayOn, [_username, _invoiceCode, if (!_hasPassword) _password])) return;
    setState(() => _saving = true);
    try {
      final saved = await AdminApi.savePaymentSettings({
        'renew_price': int.tryParse(_price.text) ?? 0,
        'bank': {'enabled': _bankOn, 'bank_name': _bankName.text, 'account_name': _accountName.text, 'account_number': _accountNumber.text, 'iban': _iban.text},
        'qpay': {'enabled': _qpayOn, 'sandbox': _sandbox, 'username': _username.text, 'password': _password.text, 'invoice_code': _invoiceCode.text},
      });
      if (!mounted) return;
      setState(() {
        _apply(saved);
        _submitted = false;
      });
      toast(context, 'Хадгаллаа');
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _field(String label, TextEditingController c, {String? error, String? hint, bool digits = false, bool obscure = false, String? placeholder}) => Padding(
        padding: const EdgeInsets.only(top: 12),
        child: FieldLabel(
          label: label,
          error: error,
          hint: hint,
          child: TextField(
            controller: c,
            obscureText: obscure,
            autocorrect: false,
            keyboardType: digits ? TextInputType.number : null,
            inputFormatters: digits ? [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(9)] : null,
            decoration: InputDecoration(hintText: placeholder),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => AdminPage(
        title: 'Төлбөрийн тохиргоо',
        actions: [if (_loaded) BarButton(icon: Icons.check_rounded, tooltip: 'Хадгалах', busy: _saving, onTap: _saving ? null : _save)],
        body: _loadError != null
            ? EmptyView(title: _loadError!, icon: Icons.error_outline_rounded)
            : !_loaded
                ? const Center(child: CircularProgressIndicator())
                : ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 40), children: [
                    Section(
                      title: 'Зар шинэчлэх үнэ',
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        const Text('Дилер зараа 7 хоног хүлээлгүй шинэчлэхэд дансаас нь хасагдах дүн. Админ үнэгүй шинэчилнэ.',
                            style: TextStyle(fontSize: 13, color: AppPalette.mutedForeground)),
                        _field('Үнэ (₮)', _price, digits: true),
                      ]),
                    ),
                    const SizedBox(height: 16),
                    Section(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        SwitchRow(
                          label: 'Дансаар шилжүүлэх',
                          hint: 'Дилер энэ данс руу шилжүүлээд хүсэлт илгээнэ. Та баталгаажуулахад дансанд нь орно.',
                          value: _bankOn,
                          onChanged: (v) => setState(() => _bankOn = v),
                        ),
                        if (_bankOn) ...[
                          _field('Банк', _bankName, error: _required(_bankOn, _bankName), placeholder: 'Жишээ нь: Хаан банк'),
                          _field('Хүлээн авагчийн нэр', _accountName, error: _required(_bankOn, _accountName)),
                          _field('Дансны дугаар', _accountNumber, error: _required(_bankOn, _accountNumber)),
                          _field('IBAN', _iban),
                        ],
                      ]),
                    ),
                    const SizedBox(height: 16),
                    Section(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        SwitchRow(
                          label: 'QPay',
                          hint: 'Дилер QR кодоор эсвэл банкны аппаар төлөхөд дансанд нь автоматаар орно.',
                          value: _qpayOn,
                          onChanged: (v) => setState(() => _qpayOn = v),
                        ),
                        if (_qpayOn) ...[
                          _field('Нэвтрэх нэр (username)', _username, error: _required(_qpayOn, _username)),
                          _field('Нууц үг (password)', _password,
                              obscure: true,
                              placeholder: _hasPassword ? '••••••••' : null,
                              hint: _hasPassword ? 'Хоосон орхивол хадгалсан нууц үг хэвээр үлдэнэ' : null,
                              error: _hasPassword ? null : _required(_qpayOn, _password)),
                          _field('Нэхэмжлэхийн код (invoice code)', _invoiceCode, error: _required(_qpayOn, _invoiceCode)),
                          const SizedBox(height: 8),
                          SwitchRow(
                            label: 'Туршилтын орчин (sandbox)',
                            hint: 'Асаалттай бол merchant-sandbox.qpay.mn руу холбогдоно. Жинхэнэ төлбөр авахдаа унтраана.',
                            value: _sandbox,
                            onChanged: (v) => setState(() => _sandbox = v),
                          ),
                        ],
                      ]),
                    ),
                  ]),
      );
}
