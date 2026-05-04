import 'package:flutter/material.dart';

class FilterRow extends StatelessWidget {
  final String label;
  final String value;
  final String typeName;
  final Function(String typeName) onChanged;

  const FilterRow({
    super.key,
    required this.label,
    required this.value,
    required this.typeName,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey[100]!)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 8),
        title: Text(
          label,
          style: const TextStyle(color: Colors.grey, fontSize: 14),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_right, color: Colors.grey[400], size: 20),
          ],
        ),
        onTap: () => onChanged(typeName),
      ),
    );
  }
}
