import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mashinuud_app/admin/api.dart';
import 'package:mashinuud_app/admin/models.dart';
import 'package:mashinuud_app/api/client.dart';
import 'package:mashinuud_app/app/format.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';
import 'package:mashinuud_app/widgets/select.dart';

/// Shared pieces of the admin half (admin/src/components/common/*).

String errorText(Object e) => e is ApiError ? e.message : '$e';

void toast(BuildContext context, String message, {bool error = false}) {
  final m = ScaffoldMessenger.maybeOf(context);
  m?.hideCurrentSnackBar();
  m?.showSnackBar(SnackBar(
    content: Text(message, style: const TextStyle(fontWeight: FontWeight.w600)),
    backgroundColor: error ? AppPalette.destructive : AppPalette.dark,
    duration: const Duration(seconds: 3),
  ));
}

enum Tone { primary, success, danger, amber }

Color toneColor(Tone t) => switch (t) {
      Tone.primary => AppPalette.primary,
      Tone.success => AppPalette.success,
      Tone.danger => AppPalette.destructive,
      Tone.amber => AppPalette.amber,
    };

Color toneSoft(Tone t) => switch (t) {
      Tone.primary => AppPalette.primarySoft,
      Tone.success => AppPalette.successSoft,
      Tone.danger => AppPalette.destructiveSoft,
      Tone.amber => AppPalette.amberSoft,
    };

Future<T?> _sheet<T>(BuildContext context, Widget child) => showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.white,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.viewInsetsOf(ctx).bottom),
        child: child,
      ),
    );

Widget _sheetHead(IconData? icon, Tone tone, String title, String? message, Widget? detail) => Column(children: [
      if (icon != null)
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(color: toneSoft(tone), shape: BoxShape.circle),
          child: Icon(icon, color: tone == Tone.amber ? AppPalette.amberInk : toneColor(tone), size: 26),
        ),
      const SizedBox(height: 12),
      Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
      if (message != null) ...[
        const SizedBox(height: 6),
        Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, color: AppPalette.mutedForeground)),
      ],
      if (detail != null) ...[const SizedBox(height: 14), detail],
    ]);

Widget _sheetButtons(BuildContext ctx, String confirmLabel, Tone tone, VoidCallback onConfirm) => Row(children: [
      Expanded(child: SoftButton(label: 'Болих', onTap: () => Navigator.pop(ctx))),
      const SizedBox(width: 8),
      Expanded(
        child: FilledButton(
          onPressed: onConfirm,
          style: FilledButton.styleFrom(
            backgroundColor: toneColor(tone),
            foregroundColor: tone == Tone.amber ? AppPalette.dark : Colors.white,
            minimumSize: const Size.fromHeight(48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            textStyle: const TextStyle(fontWeight: FontWeight.w700),
          ),
          child: Text(confirmLabel),
        ),
      ),
    ]);

/// Asks before an action; resolves true on confirm.
Future<bool> confirmSheet(BuildContext context,
    {required String title, String? message, Widget? detail, String confirmLabel = 'Тийм', Tone tone = Tone.primary, IconData? icon}) async {
  final ok = await _sheet<bool>(
    context,
    Builder(
      builder: (ctx) => Column(mainAxisSize: MainAxisSize.min, children: [
        _sheetHead(icon, tone, title, message, detail),
        const SizedBox(height: 20),
        _sheetButtons(ctx, confirmLabel, tone, () => Navigator.pop(ctx, true)),
      ]),
    ),
  );
  return ok == true;
}

/// Asks for a required line of text (e.g. a reject reason); null when cancelled.
Future<String?> promptSheet(BuildContext context,
    {required String title, String? message, Widget? detail, required String label, String? placeholder, String confirmLabel = 'Илгээх', Tone tone = Tone.primary, IconData? icon}) {
  final controller = TextEditingController();
  String? error;
  return _sheet<String>(
    context,
    StatefulBuilder(
      builder: (ctx, setState) => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        _sheetHead(icon, tone, title, message, detail),
        const SizedBox(height: 16),
        FieldLabel(
          label: label,
          error: error,
          child: TextField(
            controller: controller,
            autofocus: true,
            minLines: 3,
            maxLines: 6,
            maxLength: 500,
            decoration: InputDecoration(hintText: placeholder, counterText: '', errorText: error == null ? null : ''),
            onChanged: (_) => error == null ? null : setState(() => error = null),
          ),
        ),
        const SizedBox(height: 16),
        _sheetButtons(ctx, confirmLabel, tone, () {
          final v = controller.text.trim();
          if (v.isEmpty) return setState(() => error = '$label оруулна уу');
          Navigator.pop(ctx, v);
        }),
      ]),
    ),
  );
}

/// Grey full-width button.
class SoftButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final Color? color;
  final Color background;
  const SoftButton({super.key, required this.label, this.onTap, this.icon, this.color, this.background = AppPalette.muted});
  @override
  Widget build(BuildContext context) => TextButton(
        onPressed: onTap,
        style: TextButton.styleFrom(
          backgroundColor: background,
          foregroundColor: color ?? AppPalette.foreground,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, mainAxisSize: MainAxisSize.min, children: [
          if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 6)],
          Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
        ]),
      );
}

/// Small rounded action button on cards ("Батлах", "Нуух", …).
class ActionChip2 extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color background;
  final Color foreground;
  final VoidCallback onTap;
  const ActionChip2({super.key, required this.label, this.icon, this.background = AppPalette.muted, this.foreground = AppPalette.foreground, required this.onTap});
  @override
  Widget build(BuildContext context) => Material(
        color: background,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.sm),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              if (icon != null) ...[Icon(icon, size: 15, color: foreground), const SizedBox(width: 4)],
              Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: foreground)),
            ]),
          ),
        ),
      );
}

/// Pill label (statuses, roles).
class Badge2 extends StatelessWidget {
  final String label;
  final Color background;
  final Color foreground;
  const Badge2(this.label, {super.key, this.background = AppPalette.muted, this.foreground = AppPalette.foreground});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(99)),
        child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: foreground)),
      );
}

/// Car status → label + colours (admin/src/lib/constants.ts CAR_STATUS).
({String label, Color bg, Color fg}) carStatus(String s) => switch (s) {
      'pending' => (label: 'Хүлээгдэж буй', bg: AppPalette.amberSoft, fg: AppPalette.amberInk),
      'rejected' => (label: 'Буцаасан', bg: AppPalette.destructiveSoft, fg: AppPalette.destructive),
      'sold' => (label: 'Зарагдсан', bg: AppPalette.dark, fg: Colors.white),
      'hidden' => (label: 'Нуусан', bg: AppPalette.muted, fg: AppPalette.mutedForeground),
      'deleted' => (label: 'Устгасан', bg: AppPalette.destructiveSoft, fg: AppPalette.destructive),
      _ => (label: 'Идэвхтэй', bg: AppPalette.successSoft, fg: AppPalette.success),
    };

class CarStatusBadge extends StatelessWidget {
  final String status;
  const CarStatusBadge(this.status, {super.key});
  @override
  Widget build(BuildContext context) {
    final s = carStatus(status);
    return Badge2(s.label, background: s.bg, foreground: s.fg);
  }
}

class ChipTab<T> {
  final T value;
  final String label;
  final int count;
  final Color? on;
  final Color? off;
  final Color? onText;
  final Color? offText;
  const ChipTab(this.value, this.label, {this.count = 0, this.on, this.off, this.onText, this.offText});
}

/// Horizontal row of filter chips; [selected] may hold several values.
class ChipTabs<T> extends StatelessWidget {
  final List<ChipTab<T>> items;
  final bool Function(T value) isOn;
  final ValueChanged<T> onTap;
  const ChipTabs({super.key, required this.items, required this.isOn, required this.onTap});

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            for (final it in items)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Material(
                  color: isOn(it.value) ? (it.on ?? AppPalette.dark) : (it.off ?? AppPalette.muted),
                  borderRadius: BorderRadius.circular(99),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(99),
                    onTap: () => onTap(it.value),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      child: Row(children: [
                        Text(it.label,
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w600,
                              color: isOn(it.value) ? (it.onText ?? Colors.white) : (it.offText ?? AppPalette.foreground.withValues(alpha: 0.8)),
                            )),
                        if (it.count > 0) ...[
                          const SizedBox(width: 6),
                          Container(
                            constraints: const BoxConstraints(minWidth: 20),
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: AppPalette.primary, borderRadius: BorderRadius.circular(99)),
                            child: Text('${it.count}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                          ),
                        ],
                      ]),
                    ),
                  ),
                ),
              ),
          ],
        ),
      );
}

/// White card with a bold title (form sections).
class Section extends StatelessWidget {
  final String? title;
  final Widget child;
  final EdgeInsetsGeometry padding;
  const Section({super.key, this.title, required this.child, this.padding = const EdgeInsets.all(16)});
  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: padding,
        decoration: BoxDecoration(color: AppPalette.card, borderRadius: BorderRadius.circular(AppRadius.lg)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (title != null) ...[Text(title!, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)), const SizedBox(height: 14)],
          child,
        ]),
      );
}

/// Label above a control, hint / error under it.
class FieldLabel extends StatelessWidget {
  final String label;
  final String? hint;
  final String? error;
  final Widget child;
  const FieldLabel({super.key, required this.label, this.hint, this.error, required this.child});
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
        child,
        if (error != null)
          Padding(padding: const EdgeInsets.only(top: 4), child: Text(error!, style: const TextStyle(fontSize: 12, color: AppPalette.destructive, fontWeight: FontWeight.w500)))
        else if (hint != null)
          Padding(padding: const EdgeInsets.only(top: 4), child: Text(hint!, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground))),
      ]);
}

class FormError extends StatelessWidget {
  final String? message;
  const FormError(this.message, {super.key});
  @override
  Widget build(BuildContext context) => AnimatedSize(
        duration: const Duration(milliseconds: 180),
        child: message == null
            ? const SizedBox(width: double.infinity)
            : Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(color: AppPalette.destructiveSoft, borderRadius: BorderRadius.circular(AppRadius.md)),
                child: Text(message!, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppPalette.destructive)),
              ),
      );
}

/// Looks like a text field; opens a bottom-sheet list (admin's Select.tsx).
class SelectField<T> extends StatelessWidget {
  final String? title;
  final T? value;
  final List<Option<T>> options;
  final ValueChanged<T?> onChanged;
  final String placeholder;
  final bool enabled;
  final bool searchable;
  final bool invalid;
  const SelectField({
    super.key,
    this.title,
    required this.value,
    required this.options,
    required this.onChanged,
    this.placeholder = 'Сонгох',
    this.enabled = true,
    this.searchable = false,
    this.invalid = false,
  });

  @override
  Widget build(BuildContext context) {
    final current = options.where((o) => o.value != null && o.value == value).firstOrNull;
    final color = invalid ? AppPalette.destructive : AppPalette.input;
    return Material(
      color: enabled ? Colors.white : AppPalette.muted,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md), side: BorderSide(color: color, width: invalid ? 1.5 : 1)),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.md),
        onTap: !enabled
            ? null
            : () async {
                FocusScope.of(context).unfocus();
                final picked = await pickOption<T>(context, title: title ?? placeholder, options: options, selected: value, searchable: searchable || options.length > 12);
                if (picked != null) onChanged(picked.value);
              },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          child: Row(children: [
            Expanded(
              child: Text(current?.label ?? placeholder,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 15, color: current == null || !enabled ? AppPalette.mutedForeground : AppPalette.foreground)),
            ),
            Icon(Icons.keyboard_arrow_down_rounded, color: enabled ? AppPalette.mutedForeground : AppPalette.input),
          ]),
        ),
      ),
    );
  }
}

/// 8-digit phone input.
class PhoneField extends StatelessWidget {
  final TextEditingController? controller;
  final String? initial;
  final ValueChanged<String>? onChanged;
  final bool invalid;
  final Widget? suffix;
  final bool autofocus;
  final bool enabled;
  const PhoneField({super.key, this.controller, this.initial, this.onChanged, this.invalid = false, this.suffix, this.autofocus = false, this.enabled = true});
  @override
  Widget build(BuildContext context) => TextFormField(
        controller: controller,
        initialValue: controller == null ? initial : null,
        enabled: enabled,
        autofocus: autofocus,
        keyboardType: TextInputType.phone,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(8)],
        decoration: InputDecoration(hintText: '00000000', errorText: invalid ? '' : null, errorStyle: const TextStyle(height: 0, fontSize: 0), suffixIcon: suffix),
        onChanged: onChanged,
      );
}

/// Password input with a show / hide eye.
class PasswordField extends StatefulWidget {
  final TextEditingController controller;
  final bool invalid;
  final String? hint;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool enabled;
  const PasswordField({super.key, required this.controller, this.invalid = false, this.hint, this.onChanged, this.onSubmitted, this.enabled = true});
  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _visible = false;
  @override
  Widget build(BuildContext context) => TextField(
        controller: widget.controller,
        enabled: widget.enabled,
        obscureText: !_visible,
        onChanged: widget.onChanged,
        onSubmitted: widget.onSubmitted,
        decoration: InputDecoration(
          hintText: widget.hint,
          errorText: widget.invalid ? '' : null,
          errorStyle: const TextStyle(height: 0, fontSize: 0),
          suffixIcon: IconButton(
            icon: Icon(_visible ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20),
            onPressed: () => setState(() => _visible = !_visible),
          ),
        ),
      );
}

/// On / off row (Лизинг, Онцлох).
class SwitchRow extends StatelessWidget {
  final String label;
  final String? hint;
  final bool value;
  final ValueChanged<bool> onChanged;
  const SwitchRow({super.key, required this.label, this.hint, required this.value, required this.onChanged});
  @override
  Widget build(BuildContext context) => InkWell(
        onTap: () => onChanged(!value),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(children: [
            Switch(value: value, onChanged: onChanged, activeTrackColor: AppPalette.primary),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                if (hint != null) Text(hint!, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
              ]),
            ),
          ]),
        ),
      );
}

/// Round photo, else initials.
class Avatar extends StatelessWidget {
  final String? url;
  final String name;
  final double size;
  final Color background;
  final Color foreground;
  const Avatar({super.key, this.url, required this.name, this.size = 40, this.background = AppPalette.primarySoft, this.foreground = AppPalette.primary});
  @override
  Widget build(BuildContext context) {
    final fallback = Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: background, shape: BoxShape.circle),
      child: Text(initials(name), style: TextStyle(fontSize: size * 0.34, fontWeight: FontWeight.w700, color: foreground)),
    );
    if (url == null) return fallback;
    return ClipOval(
      child: Image.network(url!, width: size, height: size, fit: BoxFit.cover, errorBuilder: (_, _, _) => fallback),
    );
  }
}

class UserAvatar extends StatelessWidget {
  final AUser? user;
  final double size;
  const UserAvatar(this.user, {super.key, this.size = 40});
  @override
  Widget build(BuildContext context) => Avatar(url: catalogImage(user?.profile, 'users'), name: user?.fullName ?? '', size: size);
}

/// Dealer logo in a white rounded square.
class DealerLogo extends StatelessWidget {
  final String? logo;
  final double size;
  const DealerLogo(this.logo, {super.key, this.size = 44});
  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(color: Colors.white, border: Border.all(color: AppPalette.border), borderRadius: BorderRadius.circular(AppRadius.md)),
        child: ClipRRect(borderRadius: BorderRadius.circular(6), child: NetImage(catalogImage(logo, 'dealers'), fit: BoxFit.contain, background: Colors.white)),
      );
}

/// Car photo thumbnail on its tint.
class CarThumb extends StatelessWidget {
  final ACar car;
  final double width;
  final double height;
  final String size;
  const CarThumb(this.car, {super.key, this.width = 80, this.height = 64, this.size = 'thumb'});
  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: SizedBox(width: width, height: height, child: NetImage(uploadUrl(car.image, size: size), background: AppPalette.tintFor(car.id))),
      );
}

/// Page with a back arrow, title and actions.
class AdminPage extends StatelessWidget {
  final String title;
  final List<Widget> actions;
  final Widget body;
  final Widget? bottom;
  const AdminPage({super.key, required this.title, this.actions = const [], required this.body, this.bottom});
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(title, overflow: TextOverflow.ellipsis), actions: [...actions, const SizedBox(width: 6)]),
        body: body,
        bottomNavigationBar: bottom,
      );
}

/// Primary-coloured square icon button for app bars (save).
class BarButton extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final bool busy;
  final VoidCallback? onTap;
  const BarButton({super.key, required this.icon, required this.tooltip, this.busy = false, this.onTap});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Material(
          color: onTap == null ? AppPalette.primary.withValues(alpha: 0.5) : AppPalette.primary,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: InkWell(
            onTap: busy ? null : onTap,
            borderRadius: BorderRadius.circular(AppRadius.md),
            child: SizedBox(
              width: 40,
              height: 40,
              child: Center(
                child: busy
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Tooltip(message: tooltip, child: Icon(icon, size: 18, color: Colors.white)),
              ),
            ),
          ),
        ),
      );
}

/// Dims [child] and shows a spinner over it while [busy].
class BusyOverlay extends StatelessWidget {
  final bool busy;
  final Widget child;
  const BusyOverlay({super.key, required this.busy, required this.child});
  @override
  Widget build(BuildContext context) => Stack(children: [
        IgnorePointer(ignoring: busy, child: child),
        if (busy)
          Positioned.fill(
            child: Container(
              color: Colors.white.withValues(alpha: 0.6),
              alignment: Alignment.center,
              child: const SizedBox(width: 26, height: 26, child: CircularProgressIndicator(strokeWidth: 2.5, color: AppPalette.primary)),
            ),
          ),
      ]);
}

/// Placed at the end of a list: asks for the next page once it is built (scrolled into view).
class LoadMore extends StatefulWidget {
  final VoidCallback onMore;
  const LoadMore({super.key, required this.onMore});
  @override
  State<LoadMore> createState() => _LoadMoreState();
}

class _LoadMoreState extends State<LoadMore> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => widget.onMore());
  }

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.all(20),
        child: Center(child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: AppPalette.primary))),
      );
}

/// Search box that reports on submit / when typing pauses.
class SearchBox extends StatefulWidget {
  final String hint;
  final ValueChanged<String> onSearch;
  final String initial;
  const SearchBox({super.key, required this.hint, required this.onSearch, this.initial = ''});
  @override
  State<SearchBox> createState() => _SearchBoxState();
}

class _SearchBoxState extends State<SearchBox> {
  late final _c = TextEditingController(text: widget.initial);
  Timer? _t;
  @override
  void dispose() {
    _t?.cancel();
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => TextField(
        controller: _c,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(hintText: widget.hint, prefixIcon: const Icon(Icons.search_rounded, size: 20)),
        onChanged: (v) {
          _t?.cancel();
          _t = Timer(const Duration(milliseconds: 400), () => widget.onSearch(v.trim()));
        },
        onSubmitted: (v) {
          _t?.cancel();
          widget.onSearch(v.trim());
        },
      );
}

/// White header block under the app bar holding search / filters (PageHeader's children).
class FilterBar extends StatelessWidget {
  final List<Widget> children;
  const FilterBar({super.key, required this.children});
  @override
  Widget build(BuildContext context) => Container(
        color: Colors.white,
        padding: const EdgeInsets.only(top: 12, bottom: 12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          for (var i = 0; i < children.length; i++) ...[if (i > 0) const SizedBox(height: 10), children[i]],
        ]),
      );
}

/// Single image upload (dealer logo, profile photo, catalog icons): uploads into `uploads/[folder]`
/// and hands back the stored file name.
class ImageUploadField extends StatefulWidget {
  final String value;
  final String folder;
  final ValueChanged<String> onChanged;
  final String label;
  final String? hint;
  final bool round;
  const ImageUploadField({super.key, required this.value, required this.folder, required this.onChanged, required this.label, this.hint, this.round = false});
  @override
  State<ImageUploadField> createState() => _ImageUploadFieldState();
}

class _ImageUploadFieldState extends State<ImageUploadField> {
  bool _uploading = false;
  late final String _initial = widget.value;

  Future<void> _pick() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1600, imageQuality: 90);
    if (file == null) return;
    setState(() => _uploading = true);
    try {
      final bytes = await file.readAsBytes();
      if (bytes.length > 50 * 1024 * 1024) throw const ApiError(0, '50MB хүртэлх зураг сонгоно уу');
      widget.onChanged(await AdminApi.uploadImage(widget.folder, file.name, bytes));
    } catch (e) {
      if (mounted) toast(context, errorText(e), error: true);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final url = catalogImage(widget.value, widget.folder);
    final changed = widget.value != _initial;
    final revert = TextButton.icon(
      onPressed: _uploading ? null : () => widget.onChanged(_initial),
      icon: const Icon(Icons.undo_rounded, size: 16),
      label: const Text('Буцаах'),
      style: TextButton.styleFrom(foregroundColor: AppPalette.foreground, backgroundColor: AppPalette.muted),
    );
    final spinner = const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppPalette.primary));

    if (widget.round) {
      return Column(children: [
        SizedBox(
          width: 120,
          height: 120,
          child: Stack(children: [
            GestureDetector(
              onTap: _uploading ? null : _pick,
              child: ClipOval(
                child: Container(
                  width: 120,
                  height: 120,
                  color: const Color(0xFFDEDEDE),
                  child: Stack(fit: StackFit.expand, children: [
                    if (url != null) Image.network(url, fit: BoxFit.cover, errorBuilder: (_, _, _) => const SizedBox()) else const Icon(Icons.person_rounded, size: 72, color: Colors.white),
                    Align(
                      alignment: Alignment.bottomCenter,
                      child: Container(
                        height: 36,
                        width: double.infinity,
                        color: AppPalette.dark.withValues(alpha: 0.55),
                        alignment: Alignment.center,
                        child: _uploading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.cloud_upload_outlined, color: Colors.white),
                      ),
                    ),
                  ]),
                ),
              ),
            ),
            if (url != null)
              Positioned(
                right: 0,
                top: 4,
                child: Material(
                  color: Colors.white,
                  shape: const CircleBorder(),
                  elevation: 2,
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: _uploading ? null : () => widget.onChanged(''),
                    child: const Padding(padding: EdgeInsets.all(4), child: Icon(Icons.close_rounded, size: 18, color: AppPalette.mutedForeground)),
                  ),
                ),
              ),
          ]),
        ),
        if (widget.hint != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(widget.hint!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground))),
        if (changed) Padding(padding: const EdgeInsets.only(top: 6), child: revert),
      ]);
    }

    if (url == null) {
      return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        InkWell(
          onTap: _uploading ? null : _pick,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            decoration: BoxDecoration(border: Border.all(color: AppPalette.border, width: 2), borderRadius: BorderRadius.circular(AppRadius.lg)),
            child: Column(children: [
              Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(color: AppPalette.primarySoft, shape: BoxShape.circle),
                alignment: Alignment.center,
                child: _uploading ? spinner : const Icon(Icons.add_photo_alternate_outlined, color: AppPalette.primary),
              ),
              const SizedBox(height: 8),
              Text(_uploading ? 'Оруулж байна…' : widget.label, style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              const Text('Дарж зураг сонгоно', style: TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
            ]),
          ),
        ),
        if (changed) Align(alignment: Alignment.centerRight, child: Padding(padding: const EdgeInsets.only(top: 6), child: revert)),
      ]);
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(border: Border.all(color: AppPalette.border), borderRadius: BorderRadius.circular(AppRadius.lg)),
      child: Row(children: [
        Container(
          width: 72,
          height: 72,
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(color: Colors.white, border: Border.all(color: AppPalette.border), borderRadius: BorderRadius.circular(AppRadius.md)),
          child: _uploading ? Center(child: spinner) : Image.network(url, fit: BoxFit.contain, errorBuilder: (_, _, _) => const NoImage()),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (widget.hint != null) Text(widget.hint!, style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground)),
            const SizedBox(height: 6),
            Wrap(spacing: 8, runSpacing: 6, children: [
              TextButton.icon(
                onPressed: _uploading ? null : _pick,
                icon: const Icon(Icons.refresh_rounded, size: 16),
                label: const Text('Солих'),
                style: TextButton.styleFrom(foregroundColor: AppPalette.primary, backgroundColor: AppPalette.primarySoft),
              ),
              if (changed)
                revert
              else
                TextButton.icon(
                  onPressed: _uploading ? null : () => widget.onChanged(''),
                  icon: const Icon(Icons.delete_outline_rounded, size: 16),
                  label: const Text('Устгах'),
                  style: TextButton.styleFrom(foregroundColor: AppPalette.destructive, backgroundColor: AppPalette.destructiveSoft),
                ),
            ]),
          ]),
        ),
      ]),
    );
  }
}

/// Bottom sheet for a one-time code that was already sent; resolves true once [verify] accepted it.
Future<bool> otpSheet(
  BuildContext context, {
  required IconData icon,
  required String title,
  required String target,
  required int length,
  required int resendIn,
  required Future<int> Function() resend,
  required Future<void> Function(String code) verify,
}) async {
  final ok = await _sheet<bool>(context, _OtpBody(icon: icon, title: title, target: target, length: length, resendIn: resendIn, resend: resend, verify: verify));
  return ok == true;
}

class _OtpBody extends StatefulWidget {
  final IconData icon;
  final String title;
  final String target;
  final int length;
  final int resendIn;
  final Future<int> Function() resend;
  final Future<void> Function(String code) verify;
  const _OtpBody({required this.icon, required this.title, required this.target, required this.length, required this.resendIn, required this.resend, required this.verify});
  @override
  State<_OtpBody> createState() => _OtpBodyState();
}

class _OtpBodyState extends State<_OtpBody> {
  final _code = TextEditingController();
  String? _error;
  bool _busy = false;
  bool _resending = false;
  late int _left = widget.resendIn;
  Timer? _timer;
  int _shakes = 0;

  @override
  void initState() {
    super.initState();
    _tick();
  }

  void _tick() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted || _left <= 0) return t.cancel();
      setState(() => _left--);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    if (_code.text.length != widget.length || _busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.verify(_code.text);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = errorText(e);
        _code.clear();
        _busy = false;
        _shakes++;
      });
    }
  }

  Future<void> _resend() async {
    setState(() {
      _resending = true;
      _error = null;
    });
    try {
      final wait = await widget.resend();
      if (!mounted) return;
      setState(() => _left = wait);
      _code.clear();
      _tick();
    } catch (e) {
      if (mounted) setState(() => _error = errorText(e));
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  @override
  Widget build(BuildContext context) => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        _sheetHead(widget.icon, Tone.primary, widget.title, '${widget.target} руу илгээсэн ${widget.length} оронтой кодыг оруулна уу', null),
        const SizedBox(height: 18),
        Shake(
          trigger: _shakes,
          child: TextField(
            controller: _code,
            autofocus: true,
            enabled: !_busy,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            autofillHints: const [AutofillHints.oneTimeCode],
            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(widget.length)],
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: 10),
            decoration: InputDecoration(hintText: '0' * widget.length, errorText: _error),
            onChanged: (v) {
              setState(() {});
              if (v.length == widget.length) _verify();
            },
          ),
        ),
        const SizedBox(height: 10),
        Center(
          child: _left > 0
              ? Text('Дахин код авах: $_left сек', style: const TextStyle(fontSize: 12, color: AppPalette.mutedForeground))
              : TextButton(onPressed: _resending ? null : _resend, child: const Text('Код дахин илгээх', style: TextStyle(fontWeight: FontWeight.w700))),
        ),
        const SizedBox(height: 12),
        _sheetButtons(context, _busy ? 'Шалгаж байна…' : 'Баталгаажуулах', Tone.primary, _verify),
      ]);
}

/// Wizard steps: done ones in colour, the current one bold; earlier steps can be tapped.
class Stepper2 extends StatelessWidget {
  final List<String> steps;
  final int current;
  final ValueChanged<int>? onTap;
  const Stepper2({super.key, required this.steps, required this.current, this.onTap});
  @override
  Widget build(BuildContext context) => Row(children: [
        for (var i = 0; i < steps.length; i++) ...[
          if (i > 0) Expanded(child: Container(height: 2, color: i <= current ? AppPalette.primary : AppPalette.border)),
          InkWell(
            onTap: i < current && onTap != null ? () => onTap!(i) : null,
            borderRadius: BorderRadius.circular(20),
            child: Column(children: [
              Container(
                width: 28,
                height: 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: i <= current ? AppPalette.primary : AppPalette.muted, shape: BoxShape.circle),
                child: i < current
                    ? const Icon(Icons.check_rounded, size: 16, color: Colors.white)
                    : Text('${i + 1}', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: i == current ? Colors.white : AppPalette.mutedForeground)),
              ),
              const SizedBox(height: 4),
              Text(steps[i], style: TextStyle(fontSize: 11, fontWeight: i == current ? FontWeight.w700 : FontWeight.w500, color: i <= current ? AppPalette.foreground : AppPalette.mutedForeground)),
            ]),
          ),
        ],
      ]);
}

/// Edge-to-edge white list with dividers.
class RowList extends StatelessWidget {
  final List<Widget> children;
  const RowList({super.key, required this.children});
  @override
  Widget build(BuildContext context) => Container(
        decoration: const BoxDecoration(color: Colors.white, border: Border.symmetric(horizontal: BorderSide(color: AppPalette.border))),
        child: Column(children: [
          for (var i = 0; i < children.length; i++) ...[if (i > 0) const Divider(height: 1), children[i]],
        ]),
      );
}

/// Grey "N зар" line above a list.
class CountLine extends StatelessWidget {
  final String text;
  const CountLine(this.text, {super.key});
  @override
  Widget build(BuildContext context) =>
      Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 8), child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppPalette.mutedForeground)));
}

/// "Үнэ" field formatting helper.
String priceHint(String digits) => digits.isEmpty ? '' : formatPrice(int.tryParse(digits) ?? 0);
