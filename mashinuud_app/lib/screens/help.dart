import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mashinuud_app/api/api.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/leasing.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/common.dart';

const _faq = [
  ('sell', 'Машинаа зарах боломжтой юу?', 'Зарыг манай админ оруулдаг. Машинаа зарах бол утсаар эсвэл чатаар бидэнтэй холбогдоно уу.'),
  (
    'safety',
    'Залилангаас яаж сэргийлэх вэ?',
    'Машиныг биечлэн үзэж, бичиг баримтыг (гэрчилгээ, арлын дугаар) шалгасны дараа төлбөрөө шилжүүлээрэй. Урьдчилгаа нэхсэн, үзүүлэхээс татгалзсан зарлагчаас болгоомжилно уу.'
  ),
  ('featured', '“Онцлох” тэмдэг гэж юу вэ?', 'Админ шалгаж онцолсон зарууд нүүр хуудсанд болон хайлтын дээд хэсэгт гарна.'),
  ('leasing', 'Лизингээр авах боломжтой юу?', 'Тийм. Зар бүрийн хажууд байгаа тооцоолуураар сарын төлбөрөө урьдчилан тооцоолж, хүсэлтээ бидэнд илгээгээрэй.'),
];

/// "Тусламж": search the FAQ, topic tiles, questions and how to reach the team.
class HelpScreen extends StatefulWidget {
  /// Opened from a leasing calculator: start on the leasing answer (0 = not about one ad).
  final int? leasingCarId;
  const HelpScreen({super.key, this.leasingCarId});
  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  final _scroll = ScrollController();
  final _faqKey = GlobalKey();
  final _contactKey = GlobalKey();
  String _query = '';
  late String? _open = widget.leasingCarId != null ? 'leasing' : 'sell';

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _jump(GlobalKey key) {
    final ctx = key.currentContext;
    if (ctx != null) Scrollable.ensureVisible(ctx, duration: const Duration(milliseconds: 350), curve: Curves.easeOut);
  }

  @override
  Widget build(BuildContext context) {
    final q = _query.trim().toLowerCase();
    final faq = q.isEmpty ? _faq : _faq.where((f) => '${f.$2}${f.$3}'.toLowerCase().contains(q)).toList();
    void push(Widget page) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
    final topics = [
      (Icons.search_rounded, AppPalette.tintBlue, AppPalette.primary, 'Машин хайх', 'Шүүлтүүр ашиглан тохирох машинаа олох.', () {
        Navigator.of(context).popUntil((r) => r.isFirst);
        Stores.shell.openCars();
      }),
      (Icons.verified_user_outlined, AppPalette.tintMint, AppPalette.success, 'Аюулгүй худалдаа', 'Залилангаас сэргийлэх зөвлөмж.', () {
        setState(() => _open = 'safety');
        _jump(_faqKey);
      }),
      (Icons.credit_card_rounded, AppPalette.tintPeach, AppPalette.amberInk, 'Төлбөр, лизинг', 'Зээл, лизингийн нөхцөл, тооцоолуур.', () => push(const LeasingScreen())),
      (Icons.phone_outlined, AppPalette.tintLavender, const Color(0xFF5B3FAE), 'Холбоо барих', 'Утас, чатаар бидэнтэй холбогдох.', () => _jump(_contactKey)),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Тусламж')),
      body: ListView(controller: _scroll, padding: const EdgeInsets.fromLTRB(16, 16, 16, 32), children: [
        Container(
          padding: const EdgeInsets.fromLTRB(20, 40, 20, 40),
          decoration: BoxDecoration(color: AppPalette.dark, borderRadius: BorderRadius.circular(28)),
          child: Column(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: AppPalette.dark2, borderRadius: BorderRadius.circular(99)),
              child: const Text('ТУСЛАМЖИЙН ТӨВ', style: TextStyle(color: AppPalette.primary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.9)),
            ),
            const SizedBox(height: 18),
            Text('БИД ТАНД ЮУГААР ТУСЛАХ ВЭ?', textAlign: TextAlign.center, style: displayStyle(28, color: Colors.white, height: 1.15)),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.fromLTRB(14, 4, 4, 4),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.lg)),
              child: Row(children: [
                const Icon(Icons.search_rounded, size: 18, color: AppPalette.mutedForeground),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    onChanged: (v) => setState(() => _query = v),
                    onSubmitted: (_) => _jump(_faqKey),
                    decoration: const InputDecoration(
                      hintText: 'Асуултаа бичнэ үү',
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      filled: false,
                      contentPadding: EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                FilledButton(
                  onPressed: () => _jump(_faqKey),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppPalette.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  child: const Text('Хайх'),
                ),
              ]),
            ),
          ]),
        ),
        const SizedBox(height: 24),
        for (final (icon, tint, color, title, text, onTap) in topics)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Material(
              color: AppPalette.card,
              borderRadius: BorderRadius.circular(AppRadius.xl),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: onTap,
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Row(children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(color: tint, borderRadius: BorderRadius.circular(AppRadius.md)),
                      child: Icon(icon, color: color, size: 20),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(text, style: const TextStyle(fontSize: 13, color: AppPalette.mutedForeground)),
                      ]),
                    ),
                  ]),
                ),
              ),
            ),
          ),
        const SizedBox(height: 20),
        Text('ТҮГЭЭМЭЛ АСУУЛТУУД', key: _faqKey, style: displayStyle(24)),
        const SizedBox(height: 16),
        for (final (id, question, answer) in faq)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Material(
              color: AppPalette.card,
              borderRadius: BorderRadius.circular(AppRadius.xl),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () => setState(() => _open = _open == id ? null : id),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Expanded(child: Text(question, style: const TextStyle(fontWeight: FontWeight.w700))),
                      const SizedBox(width: 12),
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: _open == id ? AppPalette.primary : AppPalette.muted,
                        child: Icon(_open == id ? Icons.remove_rounded : Icons.add_rounded, size: 16, color: _open == id ? Colors.white : AppPalette.foreground),
                      ),
                    ]),
                    AnimatedSize(
                      duration: const Duration(milliseconds: 200),
                      child: _open == id
                          ? Padding(
                              padding: const EdgeInsets.only(top: 12),
                              child: Text(answer, style: TextStyle(fontSize: 14, height: 1.6, color: AppPalette.foreground.withValues(alpha: 0.8))),
                            )
                          : const SizedBox(width: double.infinity),
                    ),
                  ]),
                ),
              ),
            ),
          ),
        if (faq.isEmpty)
          const Panel(child: Text('Тохирох асуулт олдсонгүй. Доорх маягтаар бидэнд бичээрэй.', style: TextStyle(fontSize: 14, color: AppPalette.mutedForeground))),
        const SizedBox(height: 20),
        _ContactForm(key: _contactKey, leasingCarId: widget.leasingCarId),
      ]),
    );
  }
}

/// "Бидэнд бичих": stored for the team (admin panel → Санал хүсэлт); a phone or an e-mail is required.
class _ContactForm extends StatefulWidget {
  final int? leasingCarId;
  const _ContactForm({super.key, this.leasingCarId});
  @override
  State<_ContactForm> createState() => _ContactFormState();
}

class _ContactFormState extends State<_ContactForm> {
  late final _name = TextEditingController(text: Stores.auth.user?.firstname ?? '');
  late final _phone = TextEditingController(text: Stores.auth.user?.phonenumber ?? '');
  final _email = TextEditingController();
  late final _message = TextEditingController(
    text: widget.leasingCarId == null ? '' : 'Лизингийн хүсэлт${widget.leasingCarId! > 0 ? ' — зар #${widget.leasingCarId}' : ''}\n',
  );
  bool _sending = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_name, _phone, _email, _message]) {
      c.dispose();
    }
    super.dispose();
  }

  bool get _canSend => !_sending && _message.text.trim().isNotEmpty && (_phone.text.isNotEmpty || _email.text.trim().isNotEmpty);

  Future<void> _send() async {
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await Api.sendFeedback(
        name: _name.text.trim(),
        phone: _phone.text,
        email: _email.text.trim().toLowerCase(),
        message: _message.text.trim(),
        token: Stores.auth.token,
      );
      if (!mounted) return;
      setState(() => _sent = true);
      _message.clear();
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Widget _field(String label, Widget input) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          input,
        ]),
      );

  @override
  Widget build(BuildContext context) {
    void changed(String _) => setState(() => _sent = false);
    return Panel(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Бидэнд бичих', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        const Text('Тусламж хэрэгтэй бол бидэнд хандана уу.', style: TextStyle(fontSize: 14, color: AppPalette.mutedForeground)),
        const SizedBox(height: 18),
        _field('Нэр', TextField(controller: _name, textCapitalization: TextCapitalization.words, onChanged: changed)),
        _field(
          'Утас',
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(8)],
            decoration: const InputDecoration(hintText: 'Утасны дугаар'),
            onChanged: changed,
          ),
        ),
        _field(
          'И-мэйл',
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: const InputDecoration(hintText: 'name@example.com'),
            onChanged: changed,
          ),
        ),
        _field('Асуулт', TextField(controller: _message, minLines: 4, maxLines: 8, maxLength: 2000, decoration: const InputDecoration(counterText: ''), onChanged: changed)),
        if (_error != null) _Notice(_error!, color: AppPalette.destructive, background: AppPalette.destructiveSoft),
        if (_sent) const _Notice('Илгээлээ. Бид удахгүй холбогдоно.', color: AppPalette.success, background: AppPalette.successSoft, icon: Icons.verified_rounded),
        PrimaryButton(label: 'Илгээх', busy: _sending, onTap: _canSend ? _send : null),
      ]),
    );
  }
}

class _Notice extends StatelessWidget {
  final String text;
  final Color color;
  final Color background;
  final IconData? icon;
  const _Notice(this.text, {required this.color, required this.background, this.icon});

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(AppRadius.md)),
        child: Row(children: [
          if (icon != null) ...[Icon(icon, size: 16, color: color), const SizedBox(width: 8)],
          Expanded(child: Text(text, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: color))),
        ]),
      );
}
