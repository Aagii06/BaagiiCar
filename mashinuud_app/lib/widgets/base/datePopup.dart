import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/colors.dart';
import 'package:mashinuud_app/l10n/app_localizations.dart';
// import 'input.dart';
import 'button.dart';
import 'dart:ui' as ui;

import 'package:intl/intl.dart';

class DatePopup extends StatefulWidget {
  final String? hintText;
  final DateTime? value;
  final bool readOnly;
  final ValueChanged<String>? onChanged;

  const DatePopup({
    super.key,
    required this.hintText,
    required this.value,
    this.readOnly = false,
    this.onChanged,
  });

  @override
  State<DatePopup> createState() => _DatePopupState();
}

class _DatePopupState extends State<DatePopup> {
  late DateTime? value;
  late TextEditingController _controller;
  final DateTime initialDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    value = widget.value;
    _controller = TextEditingController(
      text: value != null ? formatToJapaneseDate(value!) : "",
    );
  }

  String formatToJapaneseDate(DateTime date) {
    return DateFormat('yyyy年MM月dd日').format(date);
  }

  @override
  void didUpdateWidget(covariant DatePopup oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != oldWidget.value) {
      setState(() {
        value = widget.value;
        _controller.text = value != null ? formatToJapaneseDate(value!) : "";
      });
    }
  }

  void _showDatePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (BuildContext builder) {
        return DraggableScrollableSheet(
          initialChildSize: 0.4,
          minChildSize: 0.1,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return Localizations.override(
              context: context,
              locale: const Locale('en', 'US'),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Container(
                      height: 5,
                      width: 60,
                      decoration: BoxDecoration(
                        color: AppColors.lineGrey,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                  Expanded(
                    child: CupertinoDatePicker(
                      mode: CupertinoDatePickerMode.date,
                      initialDateTime: value,
                      minimumYear: 1900,
                      maximumYear: DateTime.now().year,
                      dateOrder: DatePickerDateOrder.dmy,
                      onDateTimeChanged: (DateTime newDate) {
                        setState(() {
                          value = newDate;
                        });
                      },
                    ),
                  ),
                  Container(
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: BaseButton(
                      text: AppLocalizations.of(context)!.save,
                      onPressed: () {
                        setState(() {
                          _controller.text = value != null
                              ? formatToJapaneseDate(value!)
                              : "";
                        });
                        if (widget.onChanged != null) {
                          widget.onChanged!(
                            _controller.text.isNotEmpty
                                ? _controller.text
                                : "${initialDate.year}-${initialDate.month}-${initialDate.day}",
                          );
                        }
                        Navigator.of(context).pop();
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.readOnly ? null : () => _showDatePicker(context),
      child: AbsorbPointer(
        child: TextField(
          readOnly: true,
          controller: _controller,
          decoration: InputDecoration(
            border: widget.readOnly
                ? _DashedUnderlineInputBorder(color: Colors.grey[300]!)
                : UnderlineInputBorder(
                    borderSide: BorderSide(color: AppColors.inputBorderColor),
                  ),
            enabledBorder: widget.readOnly
                ? _DashedUnderlineInputBorder(color: Colors.grey[300]!)
                : UnderlineInputBorder(
                    borderSide: BorderSide(color: AppColors.inputBorderColor),
                  ),
            hintText: widget.hintText ?? "",
            suffixIcon: IconButton(
              icon: const Icon(Icons.arrow_drop_down),
              onPressed: widget.readOnly
                  ? null
                  : () => _showDatePicker(context),
            ),
          ),
        ),
      ),
    );
  }
}

// Custom dashed underline border for readOnly
class _DashedUnderlineInputBorder extends UnderlineInputBorder {
  final Color color;
  const _DashedUnderlineInputBorder({required this.color});

  @override
  void paint(
    Canvas canvas,
    Rect rect, {
    double? gapStart,
    double? gapExtent,
    double? gapPercentage = 0.0,
    ui.TextDirection? textDirection,
  }) {
    final Paint paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    const dashWidth = 5.0;
    const dashSpace = 3.0;
    double startX = rect.left;
    final y = rect.bottom - 1;
    while (startX < rect.right) {
      final endX = (startX + dashWidth).clamp(startX, rect.right);
      canvas.drawLine(Offset(startX, y), Offset(endX, y), paint);
      startX += dashWidth + dashSpace;
    }
  }
}
