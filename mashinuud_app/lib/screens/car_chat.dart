import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mashinuud_app/api/api.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/api/models.dart';
import 'package:mashinuud_app/app/constant.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/state/stores.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:url_launcher/url_launcher.dart';

/// Question about an ad (or a general one when [car] is null), as a bottom sheet:
/// not signed in → phone → 4-digit code first; signed in → straight to the message box.
Future<void> openCarChat(BuildContext context, Car? car) => showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: false,
      backgroundColor: AppPalette.background,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl))),
      // Lifted above the keyboard while typing.
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: FractionallySizedBox(heightFactor: 0.85, child: _CarChatSheet(car: car)),
      ),
    );

class _Line {
  final bool mine;
  final String text;
  const _Line(this.mine, this.text);
}

class _CarChatSheet extends StatefulWidget {
  final Car? car;
  const _CarChatSheet({this.car});
  @override
  State<_CarChatSheet> createState() => _CarChatSheetState();
}

class _CarChatSheetState extends State<_CarChatSheet> {
  final _draft = TextEditingController();
  final _scroll = ScrollController();
  final List<_Line> _lines = [];
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _draft.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _draft.text.trim();
    final auth = Stores.auth;
    if (text.isEmpty || _busy || auth.token == null) return;
    final first = _lines.isEmpty;
    setState(() {
      _busy = true;
      _error = null;
      _lines.add(_Line(true, text));
      _draft.clear();
    });
    _scrollDown();
    try {
      await Api.sendMessage(token: auth.token!, message: text, carId: widget.car?.id);
      if (first) {
        _lines.add(_Line(false,
            'Баярлалаа! Мессежийг хүлээн авлаа. Манай ажилтан ажлын цагаар ${auth.user?.phonenumber ?? ''} дугаарт холбогдоно.'));
      }
    } on ApiError catch (e) {
      _lines.removeLast();
      _draft.text = text;
      // Expired session: sign in again with the phone code.
      if (e.status == 401) {
        auth.signOut();
      } else {
        _error = e.message;
      }
    } finally {
      if (mounted) setState(() => _busy = false);
      _scrollDown();
    }
  }

  void _scrollDown() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      });

  @override
  Widget build(BuildContext context) {
    final car = widget.car;
    return Column(children: [
      Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(bottom: BorderSide(color: AppPalette.border)),
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
        ),
        child: Row(children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(color: AppPalette.primarySoft, shape: BoxShape.circle),
            child: const Icon(Icons.chat_bubble_outline_rounded, size: 20, color: AppPalette.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(car?.titleWithYear ?? 'Бидэнтэй чатлах', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
              const Text('Ажлын цагаар утсаар эргэн холбогдоно', style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
            ]),
          ),
          IconButton(tooltip: 'Хаах', onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close_rounded)),
        ]),
      ),
      Expanded(
        child: ListenableBuilder(
          listenable: Stores.auth,
          builder: (context, _) {
            if (Stores.auth.user == null) {
              return const SingleChildScrollView(padding: EdgeInsets.all(16), child: PhoneCodeForm(autofocus: true));
            }
            return Column(children: [
              Expanded(
                child: ListView(
                  controller: _scroll,
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_lines.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24),
                        child: Center(child: Text('Асуултаа бичээд илгээнэ үү.', style: TextStyle(fontSize: 14, color: AppPalette.mutedForeground))),
                      ),
                    for (final l in _lines) ChatBubble(text: l.text, mine: l.mine),
                  ],
                ),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
                  child: Text(_error!, style: const TextStyle(fontSize: 12, color: AppPalette.destructive, fontWeight: FontWeight.w500)),
                ),
              Composer(controller: _draft, busy: _busy, onSend: _send),
            ]);
          },
        ),
      ),
    ]);
  }
}

/// Chat bubble: orange on the right for the visitor, white on the left for the team.
class ChatBubble extends StatelessWidget {
  final String text;
  final bool mine;
  final String? caption;
  const ChatBubble({super.key, required this.text, required this.mine, this.caption});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Column(crossAxisAlignment: mine ? CrossAxisAlignment.end : CrossAxisAlignment.start, children: [
          ConstrainedBox(
            constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.78),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: mine ? AppPalette.primary : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(mine ? 18 : 6),
                  bottomRight: Radius.circular(mine ? 6 : 18),
                ),
                boxShadow: mine ? null : [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)],
              ),
              child: Text(text, style: TextStyle(fontSize: 14.5, height: 1.4, color: mine ? Colors.white : AppPalette.foreground)),
            ),
          ),
          if (caption != null) ...[
            const SizedBox(height: 4),
            Text(caption!, style: const TextStyle(fontSize: 11, color: AppPalette.mutedForeground)),
          ],
        ]),
      );
}

/// Message box pinned at the bottom of a thread.
class Composer extends StatelessWidget {
  final TextEditingController controller;
  final bool busy;
  final VoidCallback onSend;
  const Composer({super.key, required this.controller, required this.busy, required this.onSend});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
        decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppPalette.border))),
        child: SafeArea(
          top: false,
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: controller,
                maxLength: 2000,
                minLines: 1,
                maxLines: 4,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => onSend(),
                decoration: const InputDecoration(hintText: 'Мессеж бичих…', counterText: ''),
              ),
            ),
            const SizedBox(width: 8),
            ListenableBuilder(
              listenable: controller,
              builder: (context, _) => IconButton.filled(
                tooltip: 'Илгээх',
                onPressed: busy || controller.text.trim().isEmpty ? null : onSend,
                style: IconButton.styleFrom(
                  backgroundColor: AppPalette.primary,
                  disabledBackgroundColor: AppPalette.primary.withValues(alpha: 0.45),
                  fixedSize: const Size(46, 46),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                ),
                icon: busy
                    ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send_rounded, size: 18, color: Colors.white),
              ),
            ),
          ]),
        ),
      );
}

/// Phone → 4-digit code sign-in; an unknown number is registered as "Зочин". Signs in through [Stores.auth].
class PhoneCodeForm extends StatefulWidget {
  /// Focus the phone field at once (the chat sheet); off on the profile tab, which is built while hidden.
  final bool autofocus;
  const PhoneCodeForm({super.key, this.autofocus = false});
  @override
  State<PhoneCodeForm> createState() => _PhoneCodeFormState();
}

class _PhoneCodeFormState extends State<PhoneCodeForm> {
  final _phone = TextEditingController();
  final _code = TextEditingController();
  bool _codeStep = false;
  bool _busy = false;
  String? _error;
  int _cooldown = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _phone.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _requestCode() => _run(() async {
        if (!RegExp(r'^\d{8}$').hasMatch(_phone.text)) throw const ApiError(0, '8 оронтой утасны дугаар оруулна уу');
        final wait = await Api.sendLoginCode(_phone.text);
        _code.clear();
        setState(() {
          _codeStep = true;
          _cooldown = wait;
        });
        _timer?.cancel();
        _timer = Timer.periodic(const Duration(seconds: 1), (t) {
          if (!mounted || _cooldown <= 1) {
            t.cancel();
            if (mounted) setState(() => _cooldown = 0);
            return;
          }
          setState(() => _cooldown--);
        });
      });

  void _verify() => _run(() async => Stores.auth.signIn(await Api.loginWithCode(_phone.text, _code.text)));

  @override
  Widget build(BuildContext context) {
    final error = _error == null
        ? null
        : Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Text(_error!, style: const TextStyle(fontSize: 13, color: AppPalette.destructive, fontWeight: FontWeight.w500)),
          );
    if (!_codeStep) {
      return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Text('Утасны дугаараа оруулна уу. Бид 4 оронтой код илгээнэ.', style: TextStyle(fontSize: 14, color: AppPalette.mutedForeground)),
        const SizedBox(height: 12),
        TextField(
          controller: _phone,
          autofocus: widget.autofocus,
          keyboardType: TextInputType.phone,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(8)],
          decoration: const InputDecoration(hintText: 'Утасны дугаар', prefixIcon: Icon(Icons.phone_iphone_rounded, size: 20)),
          onChanged: (_) => setState(() {}),
          onSubmitted: (_) => _requestCode(),
        ),
        ?error,
        const SizedBox(height: 12),
        PrimaryButton(label: 'Код авах', busy: _busy, onTap: _phone.text.length == 8 ? _requestCode : null),
        const SizedBox(height: 10),
        const Text('Бүртгэлгүй дугаар бол автоматаар бүртгэгдэнэ.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
        if (AppConstants.contactPhone.isNotEmpty)
          TextButton.icon(
            onPressed: () => launchUrl(Uri.parse('tel:${AppConstants.contactPhone}')),
            icon: const Icon(Icons.phone_rounded, size: 16),
            label: const Text(AppConstants.contactPhone),
            style: TextButton.styleFrom(foregroundColor: AppPalette.mutedForeground),
          ),
      ]);
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text('${_phone.text} дугаар руу илгээсэн 4 оронтой кодыг оруулна уу.', style: const TextStyle(fontSize: 14, color: AppPalette.mutedForeground)),
      const SizedBox(height: 12),
      TextField(
        controller: _code,
        autofocus: true,
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        autofillHints: const [AutofillHints.oneTimeCode],
        inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(4)],
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: 12),
        decoration: const InputDecoration(hintText: '0000'),
        onChanged: (v) {
          setState(() {});
          if (v.length == 4) _verify();
        },
      ),
      ?error,
      const SizedBox(height: 12),
      PrimaryButton(label: 'Баталгаажуулах', busy: _busy, onTap: _code.text.length == 4 ? _verify : null),
      const SizedBox(height: 6),
      Row(children: [
        TextButton(
          onPressed: () => setState(() {
            _codeStep = false;
            _error = null;
          }),
          style: TextButton.styleFrom(foregroundColor: AppPalette.mutedForeground),
          child: const Text('← Дугаар солих'),
        ),
        const Spacer(),
        TextButton(
          onPressed: _busy || _cooldown > 0 ? null : _requestCode,
          style: TextButton.styleFrom(foregroundColor: AppPalette.primary),
          child: Text(_cooldown > 0 ? 'Код дахин авах ($_cooldown)' : 'Код дахин авах'),
        ),
      ]),
    ]);
  }
}
