import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/widgets/common.dart';

class Option<T> {
  final T? value;
  final String label;
  const Option(this.value, this.label);
}

/// Bottom-sheet list of [options]; resolves to the picked option, or null when dismissed.
/// [searchable] adds a search box; [limit] shows at most that many rows (the "all" row with a null value
/// isn't counted, the selected one always stays) and the search box reaches the rest.
Future<Option<T>?> pickOption<T>(
  BuildContext context, {
  required String title,
  required List<Option<T>> options,
  T? selected,
  bool searchable = false,
  int? limit,
}) {
  return showModalBottomSheet<Option<T>>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.white,
    builder: (context) => _OptionSheet<T>(title: title, options: options, selected: selected, searchable: searchable, limit: limit),
  );
}

class _OptionSheet<T> extends StatefulWidget {
  final String title;
  final List<Option<T>> options;
  final T? selected;
  final bool searchable;
  final int? limit;
  const _OptionSheet({required this.title, required this.options, this.selected, this.searchable = false, this.limit});
  @override
  State<_OptionSheet<T>> createState() => _OptionSheetState<T>();
}

class _OptionSheetState<T> extends State<_OptionSheet<T>> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final needle = _q.trim().toLowerCase();
    final matches = needle.isEmpty ? widget.options : widget.options.where((o) => o.label.toLowerCase().contains(needle)).toList();
    final all = matches.where((o) => o.value == null);
    final rest = matches.where((o) => o.value != null).toList();
    final limit = widget.limit;
    var rows = matches;
    if (limit != null && rest.length > limit) {
      rows = [...all, ...rest.take(limit)];
      final chosen = rest.where((o) => o.value == widget.selected).firstOrNull;
      if (chosen != null && !rows.contains(chosen)) rows.add(chosen);
    }
    final hidden = matches.length - rows.length;

    return ConstrainedBox(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.7),
      child: Padding(
        // Keep the search box above the keyboard.
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(widget.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              ),
            ),
            if (widget.searchable)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
                child: TextField(
                  onChanged: (v) => setState(() => _q = v),
                  decoration: const InputDecoration(hintText: 'Хайх', prefixIcon: Icon(Icons.search_rounded, size: 20)),
                ),
              ),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.only(bottom: 16),
                children: [
                  for (final o in rows)
                    Builder(
                      builder: (context) {
                        final on = o.value == widget.selected;
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20),
                          title: Text(
                            o.label,
                            style: TextStyle(fontWeight: on ? FontWeight.w700 : FontWeight.w500, color: on ? AppPalette.primary : null),
                          ),
                          trailing: on ? const Icon(Icons.check_rounded, color: AppPalette.primary) : null,
                          onTap: () => Navigator.pop(context, o),
                        );
                      },
                    ),
                  if (rows.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: Center(
                        child: Text('Олдсонгүй', style: TextStyle(fontSize: 14, color: AppPalette.mutedForeground)),
                      ),
                    ),
                  if (hidden > 0)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                      child: Text('Өөр $hidden байна, хайж олно уу', style: const TextStyle(fontSize: 13, color: AppPalette.mutedForeground)),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
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

  /// Passed on to [pickOption].
  final bool searchable;
  final int? limit;

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
    this.searchable = false,
    this.limit,
  });

  @override
  Widget build(BuildContext context) {
    final current = options.where((o) => o.value == value && o.value != null).firstOrNull;
    final text = current?.label ?? placeholder;
    final on = enabled && !loading;
    // Options still coming: pulsing bars in place of the value and the arrow.
    final trailing = loading
        ? const Pulse(child: SkeletonBox(width: 16, height: 16, radius: 4))
        : const Icon(Icons.keyboard_arrow_down_rounded, size: 20, color: AppPalette.mutedForeground);
    const valueSkeleton = Pulse(
      child: FractionallySizedBox(alignment: Alignment.centerLeft, widthFactor: 0.45, child: SkeletonBox(height: 14)),
    );
    Future<void> open() async {
      final picked = await pickOption<T>(
        context,
        title: label,
        options: [Option<T>(null, placeholder), ...options],
        selected: value,
        searchable: searchable,
        limit: limit,
      );
      if (picked != null) onChanged(picked.value);
    }

    if (labelled) {
      return InkWell(
        onTap: on ? open : null,
        child: Opacity(
          opacity: on || loading ? 1 : 0.45,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label.toUpperCase(),
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.3, color: AppPalette.mutedForeground),
                      ),
                      const SizedBox(height: 4),
                      if (loading)
                        const SizedBox(
                          height: 20,
                          child: Align(alignment: Alignment.centerLeft, child: valueSkeleton),
                        )
                      else
                        Text(
                          text,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                        ),
                    ],
                  ),
                ),
                trailing,
              ],
            ),
          ),
        ),
      );
    }

    return Material(
      color: on || loading ? Colors.white : AppPalette.muted,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        side: const BorderSide(color: AppPalette.input),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: on ? open : null,
        child: Container(
          height: 44,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: [
              Expanded(
                child: loading
                    ? valueSkeleton
                    : Text(
                        text,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 14,
                          color: current == null ? AppPalette.mutedForeground : AppPalette.foreground,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
              ),
              trailing,
            ],
          ),
        ),
      ),
    );
  }
}
