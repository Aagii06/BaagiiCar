import 'package:flutter/material.dart';

class FilterRow extends StatelessWidget {
  final String label;
  final String value;
  final String typeName;
  final List<String> options;
  final Function(String typeName, String selectedValue) onChanged;

  const FilterRow({
    super.key,
    required this.label,
    required this.value,
    required this.typeName,
    required this.options,
    required this.onChanged,
  });

  void _showOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.5,
          minChildSize: 0.3,
          maxChildSize: 0.8,
          expand: false,
          builder: (context, scrollController) {
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const Divider(height: 1),
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    itemCount: options.length,
                    itemBuilder: (context, index) {
                      final item = options[index];
                      return ListTile(
                        title: Text(item),
                        trailing: item == value
                            ? const Icon(Icons.check, color: Colors.blue)
                            : null,
                        onTap: () {
                          onChanged(typeName, item);
                          Navigator.pop(context);
                        },
                      );
                    },
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

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
        onTap: () => _showOptions(context),
      ),
    );
  }
}
