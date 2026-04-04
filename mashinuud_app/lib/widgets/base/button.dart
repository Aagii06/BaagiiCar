import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/colors.dart';

class BaseButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final Color? color;
  final Color? textColor;
  final double height;
  final double borderRadius;
  final FontWeight fontWeight;
  final double fontSize;
  final Color? borderColor;
  final double? borderWidth;
  final bool fullWidth;
  final ButtonStyle? customStyle;
  final bool enabled; // new: control disabled state visually and behavior

  const BaseButton({
    super.key,
    required this.text,
    this.onPressed,
    this.color,
    this.textColor,
    this.height = 45,
    this.borderRadius = 24,
    this.fontWeight = FontWeight.normal,
    this.fontSize = 16,
    this.borderColor,
    this.borderWidth,
    this.fullWidth = false,
    this.customStyle,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: fullWidth ? double.infinity : null,
      height: height,
      child: ElevatedButton(
        onPressed: enabled ? onPressed : null,
        style:
            customStyle ??
            ElevatedButton.styleFrom(
              backgroundColor: enabled
                  ? (color ?? AppColors.primaryColor)
                  : Colors.grey[300],
              foregroundColor: enabled
                  ? (textColor ?? Colors.white)
                  : Colors.grey[700],
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(borderRadius),
                side: (borderColor != null && borderWidth != null)
                    ? BorderSide(color: borderColor!, width: borderWidth!)
                    : BorderSide.none,
              ),
            ),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: textColor ?? Colors.white,
            fontWeight: fontWeight,
            fontSize: fontSize,
          ),
        ),
      ),
    );
  }
}
