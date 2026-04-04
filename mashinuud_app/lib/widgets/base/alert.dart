import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:mashinuud_app/l10n/app_localizations.dart';

Future<void> showAlert(
  BuildContext context,
  String? title,
  String? subTitle,
) async {
  final loc = AppLocalizations.of(context)!;
  return showDialog<void>(
    context: context,
    builder: (context) => CupertinoAlertDialog(
      title: title != null && title.isNotEmpty
          ? Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            )
          : null,
      content: subTitle != null && subTitle.isNotEmpty
          ? Text(
              subTitle,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14),
            )
          : null,
      actions: [
        CupertinoDialogAction(
          child: Text(
            loc.yes,
            style: TextStyle(color: CupertinoColors.activeBlue, fontSize: 14),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ],
    ),
  );
}
