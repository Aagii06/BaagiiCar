import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:mashinuud_app/l10n/app_localizations.dart';

Future<bool?> showConfirm(
  BuildContext context,
  String? title,
  String? subTitle,
) async {
  final loc = AppLocalizations.of(context)!;
  return await showCupertinoDialog<bool>(
    context: context,
    builder: (context) => CupertinoAlertDialog(
      title: title != null && title.isNotEmpty
          ? Text(title, style: const TextStyle(fontWeight: FontWeight.bold))
          : null,
      content: subTitle != null && subTitle.isNotEmpty ? Text(subTitle) : null,
      actions: [
        CupertinoDialogAction(
          child: Text(
            loc.no,
            style: TextStyle(color: CupertinoColors.activeBlue),
          ),
          onPressed: () => Navigator.of(context).pop(false),
        ),
        CupertinoDialogAction(
          child: Text(
            loc.yes,
            style: TextStyle(color: CupertinoColors.activeBlue),
          ),
          onPressed: () => Navigator.of(context).pop(true),
        ),
      ],
    ),
  );
}
