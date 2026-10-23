import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';

class Option<T> {
  final T? value;
  final String label;
  const Option(this.value, this.label);
}

/// Bottom-sheet list of [options]; resolves to the picked option, or null when dismissed.
Future<Option<T>?> pickOption<T>(BuildContext context, {required String title, required List<Option<T>> options, T? selected}) {
  return showModalBottomSheet<Option<T>>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.white,
    builder: (context) => ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.7),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
          child: Align(alignment: Alignment.centerLeft, child: Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
        ),
        Flexible(
          child: ListView.builder(
            shrinkWrap: true,
            padding: const EdgeInsets.only(bottom: 16),
            itemCount: options.length,
            itemBuilder: (context, i) {
              final o = options[i];
              final on = o.value == selected;
              return ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 20),
                title: Text(o.label, style: TextStyle(fontWeight: on ? FontWeight.w700 : FontWeight.w500, color: on ? AppPalette.primary : null)),
                trailing: on ? const Icon(Icons.check_rounded, color: AppPalette.primary) : null,
                onTap: () => Navigator.pop(context, o),
              );
            },
          ),
        ),
      ]),
    ),
  );
}

/// Field that looks like the website's select box and opens [pickOption].
class SelectField<T> extends StatelessWidget {
  final String label;
  final T? value;
  final List<Option<T>> options;
  final String placeholder;
  final ValueChanged<T?> onChanged;
  final bool enabled;
  final bool loading;

  /// Label above the value (hero search cell) instead of a plain box.
  final bool labelled;
  const SelectField({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
    this.placeholder = 'Бүгд',
    this.enabled = true,
    this.loading = false,
    this.labelled = false,
  });

  @override
  Widget build(BuildContext context) {
    final current = options.where((o) => o.value == value && o.value != null).firstOrNull;
    final text = loading ? 'Ачаалж байна...' : (current?.label ?? placeholder);
    final on = enabled && !loading;
    final trailing = loading
        ? const SizedBox.square(dimension: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppPalette.primary))
        : const Icon(Icons.keyboard_arrow_down_rounded, size: 20, color: AppPalette.mutedForeground);
    Future<void> open() async {
      final picked = await pickOption<T>(context, title: label, options: [Option<T>(null, placeholder), ...options], selected: value);
      if (picked != null) onChanged(picked.value);
    }

    if (labelled) {
      return InkWell(
        onTap: on ? open : null,
        child: Opacity(
          opacity: on ? 1 : 0.45,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
            child: Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(label.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.3, color: AppPalette.mutedForeground)),
                  const SizedBox(height: 4),
                  Text(text, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                ]),
              ),
              trailing,
            ]),
          ),
        ),
      );
    }

    return Material(
      color: on ? Colors.white : AppPalette.muted,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md), side: const BorderSide(color: AppPalette.input)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: on ? open : null,
        child: Container(
          height: 44,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(children: [
            Expanded(
              child: Text(
                text,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 14, color: current == null ? AppPalette.mutedForeground : AppPalette.foreground, fontWeight: FontWeight.w500),
              ),
            ),
            trailing,
          ]),
        ),
      ),
    );
  }
}
