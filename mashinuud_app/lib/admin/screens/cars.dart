import 'package:flutter/material.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/admin/screens/car_form.dart';
import 'package:mashinuud_app/admin/shell.dart';
import 'package:mashinuud_app/admin/ui.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/select.dart';
import 'package:mashinuud_app/app/i18n.dart';

const carPageSize = 20;

/// Status chips, each in its own colour (soft while off, solid once picked).
final carTabs = <ChipTab<String>>[
  const ChipTab('all', 'Бүгд'),
  const ChipTab('pending', 'Хүлээгдэж буй', on: AppPalette.amber, off: AppPalette.amberSoft, onText: AppPalette.dark, offText: AppPalette.amberInk),
  const ChipTab('rejected', 'Буцаасан', on: AppPalette.destructive, off: AppPalette.destructiveSoft, offText: AppPalette.destructive),
  const ChipTab('active', 'Идэвхтэй', on: AppPalette.success, off: AppPalette.successSoft, offText: AppPalette.success),
  const ChipTab('featured', 'Онцлох', on: AppPalette.primary, off: AppPalette.primarySoft, offText: AppPalette.primary),
  const ChipTab('hidden', 'Нуусан', on: Color(0xFF64748B), off: Color(0xFFF1F5F9), offText: Color(0xFF475569)),
  const ChipTab('sold', 'Зарагдсан', on: Color(0xFF0284C7), off: AppPalette.tintBlue, offText: Color(0xFF0369A1)),
  const ChipTab('deleted', 'Устгасан', on: Color(0xFF9F1239), off: AppPalette.tintRose, offText: Color(0xFF9F1239)),
];

List<String> toggleStatus(List<String> current, String v) => v == 'all' ? [] : (current.contains(v) ? (List.of(current)..remove(v)) : [...current, v]);

/// Зарууд tab: search, dealer filter (admins), status chips, then the ads page by page.
class CarsTab extends StatefulWidget {
  const CarsTab({super.key});
  @override
  State<CarsTab> createState() => _CarsTabState();
}

class _CarsTabState extends State<CarsTab> {
  List<String> _statuses = [];
  String _q = '';
  int? _dealerId;
  List<Dealer> _dealers = [];

  @override
  void initState() {
    super.initState();
    adminNav.addListener(_takePending);
    _takePending();
    if (AdminApi.session.isAdmin) {
      AdminApi.dealersList().then((p) => mounted ? setState(() => _dealers = p.rows) : null, onError: (_) {});
    }
  }

  @override
  void dispose() {
    adminNav.removeListener(_takePending);
    super.dispose();
  }

  void _takePending() {
    final s = adminNav.pendingStatuses;
    if (s == null) return;
    adminNav.pendingStatuses = null;
    final d = adminNav.pendingDealer;
    adminNav.pendingDealer = null;
    if (mounted) {
      setState(() {
        _statuses = s;
        _dealerId = d;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final admin = AdminApi.session.isAdmin;
    return Column(children: [
      FilterBar(children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(children: [
            Expanded(child: SearchBox(hint: tr('Нэр, утас эсвэл #дугаар'), onSearch: (v) => setState(() => _q = v))),
            if (admin) ...[
              const SizedBox(width: 8),
              SizedBox(
                width: 132,
                child: AdminSelect<int>(
                  title: tr('Дилер'),
                  value: _dealerId,
                  placeholder: tr('Дилер'),
                  options: [Option<int>(null, tr('Бүгд')), for (final d in _dealers) Option(d.id, d.name)],
                  onChanged: (v) => setState(() => _dealerId = v),
                ),
              ),
            ],
          ]),
        ),
        ChipTabs<String>(items: carTabs, isOn: (v) => v == 'all' ? _statuses.isEmpty : _statuses.contains(v), onTap: (v) => setState(() => _statuses = toggleStatus(_statuses, v))),
      ]),
      Expanded(
        child: ListenableBuilder(
          listenable: adminNav,
          builder: (context, _) => CarList(
            key: ValueKey('${_statuses.join(',')}|$_q|$_dealerId|${adminNav.revision}'),
            statuses: _statuses,
            search: _q,
            dealerId: _dealerId,
            showDealer: admin && _dealerId == null,
          ),
        ),
      ),
    ]);
  }
}

/// Paged ad list (a new key starts over at the first page).
class CarList extends StatefulWidget {
  final List<String> statuses;
  final String search;
  final int? dealerId;
  final bool showDealer;
  const CarList({super.key, this.statuses = const [], this.search = '', this.dealerId, this.showDealer = false});
  @override
  State<CarList> createState() => _CarListState();
}

class _CarListState extends State<CarList> {
  int _take = carPageSize;
  ListPage<ACar>? _page;
  Object? _error;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final p = await AdminApi.cars(statuses: widget.statuses, dealerId: widget.dealerId, search: widget.search, take: _take);
      if (mounted) setState(() => _page = p);
    } catch (e) {
      if (mounted) setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final page = _page;
    if (_error != null && page == null) return ErrorView(message: errorText(_error!), onRetry: _load);
    if (page == null) return const Padding(padding: EdgeInsets.all(16), child: RowsSkeleton(count: 5));
    if (page.rows.isEmpty) return EmptyView(title: tr('Зар олдсонгүй'));
    final more = page.rows.length < page.count;
    return RefreshIndicator(
      color: AppPalette.primary,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
        itemCount: page.rows.length + 1 + (more ? 1 : 0),
        separatorBuilder: (_, i) => SizedBox(height: i == 0 ? 0 : 12),
        itemBuilder: (context, i) {
          if (i == 0) return CountLine(tr('{count} зар', {'count': page.count}));
          if (i > page.rows.length) {
            return _loading
                ? const Padding(padding: EdgeInsets.all(20), child: Center(child: CircularProgressIndicator(strokeWidth: 2.4, color: AppPalette.primary)))
                : LoadMore(
                    key: ValueKey(_take),
                    onMore: () {
                      _take += carPageSize;
                      _load();
                    });
          }
          return CarRow(car: page.rows[i - 1], showDealer: widget.showDealer, onChanged: _load);
        },
      ),
    );
  }
}

/// One ad in an admin list, with its status actions.
class CarRow extends StatefulWidget {
  final ACar car;
  final bool showDealer;
  final VoidCallback onChanged;
  const CarRow({super.key, required this.car, required this.showDealer, required this.onChanged});
  @override
  State<CarRow> createState() => _CarRowState();
}

class _CarRowState extends State<CarRow> {
  bool _busy = false;

  ACar get car => widget.car;

  Widget get _detail => Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: AppPalette.muted, borderRadius: BorderRadius.circular(AppRadius.lg)),
        child: Row(children: [
          CarThumb(car, width: 64, height: 48),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(car.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
              Text('${formatPrice(car.price)} · #${car.code ?? car.id}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppPalette.primary)),
            ]),
          ),
        ]),
      );

  Future<void> _run(Future<void> Function() action, String done, {String? title, String? message, String? confirmLabel, Tone tone = Tone.primary, IconData? icon}) async {
    if (title != null && !await confirmSheet(context, title: title, message: message, detail: _detail, confirmLabel: confirmLabel ?? tr('Тийм'), tone: tone, icon: icon)) return;
    setState(() => _busy = true);
    try {
      await action();
      if (!mounted) return;
      toast(context, done);
      widget.onChanged();
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _paidRenew(int renewIn) async {
    double price;
    try {
      price = (await AdminApi.paymentInfo()).renewPrice;
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
      return;
    }
    if (!mounted) return;
    await _run(() => AdminApi.renewCar(car.id, paid: true), tr('Шинэчиллээ, жагсаалтын эхэнд гарлаа'),
        title: tr('Төлбөртэй шинэчлэх үү?'),
        message: tr('Дансны үлдэгдлээс {price}₮ хасагдаж, зар жагсаалтын эхэнд гарна. Үнэгүй шинэчлэл {renewIn} хоногийн дараа.', {'price': formatNumber(price), 'renewIn': renewIn}),
        confirmLabel: tr('Төлөөд шинэчлэх'),
        icon: Icons.refresh_rounded);
  }

  Future<void> _reject() async {
    final reason = await rejectReason(context, detail: _detail);
    if (reason == null) return;
    await _run(() => AdminApi.rejectCar(car.id, reason), tr('Буцаалаа'));
  }

  @override
  Widget build(BuildContext context) {
    final admin = AdminApi.session.isAdmin;
    final featured = car.isFeatured;
    final renewIn = daysUntil(car.listedAt ?? car.renewedAt ?? car.createdAt, CarConst.renewDays);
    final purgeIn = daysUntil(car.deletedAt, CarConst.restoreDays);
    final s = car.status;
    final actions = <Widget>[
      if (s == 'deleted' && purgeIn > 0)
        ActionChip2(
          label: tr('Сэргээх'),
          icon: Icons.unarchive_outlined,
          background: AppPalette.success,
          foreground: Colors.white,
          onTap: () => _run(() => AdminApi.restoreCar(car.id), tr('Зарыг сэргээлээ'),
              title: tr('Зарыг сэргээх үү?'), message: tr('Зар устгахаас өмнөх төлөвтөө буцна.'), confirmLabel: tr('Сэргээх'), tone: Tone.success, icon: Icons.unarchive_outlined),
        ),
      if (s == 'pending' && admin) ...[
        ActionChip2(
          label: tr('Батлах'),
          icon: Icons.check_rounded,
          background: AppPalette.success,
          foreground: Colors.white,
          onTap: () => _run(() => AdminApi.approveCar(car.id), tr('Баталлаа, вэб дээр нийтлэгдлээ'),
              title: tr('Зарыг батлах уу?'), message: tr('Батласны дараа вэб дээр нийтлэгдэнэ.'), confirmLabel: tr('Батлах'), tone: Tone.success, icon: Icons.check_rounded),
        ),
        ActionChip2(label: tr('Буцаах'), icon: Icons.undo_rounded, background: AppPalette.destructiveSoft, foreground: AppPalette.destructive, onTap: _reject),
      ],
      if (admin && s == 'active') ...[
        ActionChip2(
          label: tr('Онцлох'),
          icon: featured ? Icons.star_rounded : Icons.star_border_rounded,
          background: featured ? AppPalette.amber : AppPalette.muted,
          onTap: () => _run(() => AdminApi.setFeatured(car, !featured), featured ? tr('Онцлохоос хаслаа') : tr('Онцоллоо'),
              title: featured ? tr('Онцлохоос хасах уу?') : tr('Онцлох зар болгох уу?'),
              message: featured ? tr('Нүүр хуудас болон хайлтын эхэнд гарахаа болино.') : tr('Нүүр хуудсанд болон хайлтын эхэнд гарна.'),
              confirmLabel: featured ? tr('Хасах') : tr('Онцлох'),
              tone: Tone.amber,
              icon: Icons.star_rounded),
        ),
        ActionChip2(
          label: tr('Зарагдсан'),
          onTap: () => _run(() => AdminApi.markSold(car.id), tr('Зарагдсан гэж тэмдэглэлээ'),
              title: tr('Зарагдсан гэж тэмдэглэх үү?'), message: tr('Зар вэб дээр «Зарагдсан» тэмдэгтэй харагдана.'), confirmLabel: tr('Тэмдэглэх'), icon: Icons.verified_outlined),
        ),
      ],
      // Before the free renewal a dealer can pay for one from their balance.
      if (s == 'active' && !admin && renewIn > 0)
        ActionChip2(
          label: tr('Төлбөртэй шинэчлэх'),
          icon: Icons.refresh_rounded,
          background: AppPalette.primarySoft,
          foreground: AppPalette.primary,
          onTap: () => _paidRenew(renewIn),
        ),
      // The admin can renew any time; a dealer once every CarConst.renewDays days.
      if (s == 'active' && (admin || renewIn == 0))
        ActionChip2(
          label: tr('Шинэчлэх'),
          icon: Icons.refresh_rounded,
          background: AppPalette.success,
          foreground: Colors.white,
          onTap: () => _run(() => AdminApi.renewCar(car.id), tr('Шинэчиллээ, жагсаалтын эхэнд гарлаа'),
              title: tr('Зарыг шинэчлэх үү?'),
              message: admin
                  ? tr('Зар жагсаалтын эхэнд гарна.')
                  : tr('Зар жагсаалтын эхэнд гарна. Дараагийн үнэгүй шинэчлэл {renewDays} хоногийн дараа.', {'renewDays': CarConst.renewDays}),
              confirmLabel: tr('Шинэчлэх'),
              tone: Tone.success,
              icon: Icons.refresh_rounded),
        ),
      if (s == 'active')
        ActionChip2(
          label: tr('Нуух'),
          icon: Icons.visibility_off_outlined,
          onTap: () => _run(() => AdminApi.setHidden(car.id, true), tr('Нууллаа, вэб дээр харагдахгүй'),
              title: tr('Зарыг түр нуух уу?'), message: tr('Вэб дээр харагдахаа болино. Дараа нь «Нийтлэх»-ээр буцааж нийтэлж болно.'), confirmLabel: tr('Нуух'), tone: Tone.amber, icon: Icons.visibility_off_outlined),
        ),
      if (s == 'hidden')
        ActionChip2(
          label: tr('Нийтлэх'),
          icon: Icons.visibility_outlined,
          background: AppPalette.success,
          foreground: Colors.white,
          onTap: () => _run(() => AdminApi.setHidden(car.id, false), tr('Нийтэллээ, вэб дээр харагдана'),
              title: tr('Зарыг нийтлэх үү?'), message: tr('Нийтэлсэн зар вэб дээр харагдах боломжтой болно.'), confirmLabel: tr('Нийтлэх'), tone: Tone.success, icon: Icons.visibility_outlined),
        ),
      // Dealers can't delete live or sold ads, only hide / edit them.
      if (s != 'deleted' && (admin || (s != 'active' && s != 'sold')))
        ActionChip2(
          label: tr('Устгах'),
          background: AppPalette.destructiveSoft,
          foreground: AppPalette.destructive,
          onTap: () => _run(() => AdminApi.deleteCar(car.id), tr('Устгалаа'),
              title: tr('Зарыг устгах уу?'),
              message: tr('Устгасан зар вэб дээр харагдахгүй болно. {restoreDays} хоногийн дотор сэргээх боломжтой, дараа нь бүр мөсөн устна.', {'restoreDays': CarConst.restoreDays}),
              confirmLabel: tr('Устгах'),
              tone: Tone.danger,
              icon: Icons.delete_outline_rounded),
        ),
    ];

    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: BusyOverlay(
        busy: _busy,
        child: Container(
          color: AppPalette.card,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            if (widget.showDealer)
              Container(
                color: const Color(0xFF64748B),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(children: [
                  if (car.dealerName != null) DealerLogo(car.dealerLogo, size: 20, name: car.dealerName) else const Icon(Icons.storefront_outlined, size: 16, color: Colors.white70),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(car.dealerName ?? tr('Дилергүй'),
                        maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: car.dealerName == null ? Colors.white70 : Colors.white)),
                  ),
                ]),
              ),
            InkWell(
              onTap: () async {
                final saved = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => CarEditScreen(carId: car.id)));
                if (saved == true) widget.onChanged();
              },
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  CarThumb(car),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Expanded(child: Text(car.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700))),
                        const SizedBox(width: 6),
                        CarStatusBadge(car.status),
                      ]),
                      Text(formatPrice(car.price), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppPalette.primary)),
                      Text('#${car.code ?? car.id} · ${car.phonenumber ?? car.sellerPhone ?? ''}',
                          maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                      const SizedBox(height: 2),
                      Row(children: [
                        const Icon(Icons.visibility_outlined, size: 14, color: AppPalette.mutedForeground),
                        const SizedBox(width: 3),
                        Text('${car.viewCount}', style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                        const SizedBox(width: 12),
                        const Icon(Icons.phone_outlined, size: 14, color: AppPalette.mutedForeground),
                        const SizedBox(width: 3),
                        Text('${car.phoneViewCount}', style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
                        // When the ad last went to the top of the list: renewed, else added.
                        if ((car.listedAt ?? car.renewedAt ?? car.createdAt) case final at?) ...[
                          const SizedBox(width: 12),
                          const Icon(Icons.history_rounded, size: 14, color: AppPalette.mutedForeground),
                          const SizedBox(width: 3),
                          Flexible(child: Text(at.length > 16 ? at.substring(0, 16) : at, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground))),
                        ],
                      ]),
                      if (s == 'rejected' && car.rejectReason != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text('↩ ${car.rejectReason}', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: AppPalette.destructive)),
                        ),
                      if (s == 'active' && !admin)
                        _note(Icons.refresh_rounded, renewIn > 0 ? tr('{renewIn} хоногийн дараа үнэгүй шинэчлэх боломжтой', {'renewIn': renewIn}) : tr('Үнэгүй шинэчлэх боломжтой'), renewIn > 0 ? AppPalette.mutedForeground : AppPalette.success),
                      if (s == 'deleted') _note(Icons.schedule_rounded, purgeIn > 0 ? tr('{purgeIn} хоногийн дараа бүр мөсөн устна', {'purgeIn': purgeIn}) : tr('Удахгүй бүр мөсөн устна'), AppPalette.destructive),
                    ]),
                  ),
                ]),
              ),
            ),
            if (actions.isNotEmpty) ...[
              const Divider(height: 1, indent: 12, endIndent: 12),
              Padding(padding: const EdgeInsets.all(12), child: Wrap(spacing: 8, runSpacing: 8, children: actions)),
            ],
          ]),
        ),
      ),
    );
  }

  Widget _note(IconData icon, String text, Color color) => Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Row(children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Expanded(child: Text(text, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color))),
        ]),
      );
}

/// "Буцаах": asks for a reason; null when cancelled.
Future<String?> rejectReason(BuildContext context, {Widget? detail}) => promptSheet(
      context,
      title: tr('Зарыг буцаах уу?'),
      message: tr('Зарын эзэн тайлбарыг хараад засаж, дахин илгээнэ.'),
      detail: detail,
      label: tr('Буцаах шалтгаан'),
      placeholder: tr('Шалтгаанаа бичнэ үү'),
      confirmLabel: tr('Буцаах'),
      tone: Tone.danger,
      icon: Icons.undo_rounded,
    );

/// One dealer's ads full screen (Дилерүүд → Зарууд).
class DealerCarsScreen extends StatefulWidget {
  final Dealer dealer;
  const DealerCarsScreen({super.key, required this.dealer});
  @override
  State<DealerCarsScreen> createState() => _DealerCarsScreenState();
}

class _DealerCarsScreenState extends State<DealerCarsScreen> {
  List<String> _statuses = [];
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          titleSpacing: 0,
          title: Row(children: [
            DealerLogo(widget.dealer.logo, size: 32, name: widget.dealer.name),
            const SizedBox(width: 10),
            Expanded(child: Text(widget.dealer.name, overflow: TextOverflow.ellipsis)),
          ]),
        ),
        body: Column(children: [
          FilterBar(children: [
            ChipTabs<String>(items: carTabs, isOn: (v) => v == 'all' ? _statuses.isEmpty : _statuses.contains(v), onTap: (v) => setState(() => _statuses = toggleStatus(_statuses, v))),
          ]),
          Expanded(child: CarList(key: ValueKey(_statuses.join(',')), statuses: _statuses, dealerId: widget.dealer.id)),
        ]),
      );
}
