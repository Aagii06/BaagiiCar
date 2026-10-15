import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/data/car_data.dart';
import 'package:mashinuud_app/data/chat_data.dart';
import 'package:mashinuud_app/screens/chat.dart';
import 'package:mashinuud_app/widgets/custom/ui.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final _query = TextEditingController();
  final Set<String> _read = {};

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final q = _query.text.trim().toLowerCase();
    final items = conversations.where((c) {
      if (q.isEmpty) return true;
      return c.name.toLowerCase().contains(q) ||
          findCar(c.carId).name.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
          children: [
            Row(
              children: [
                Expanded(child: Text('Мессеж', style: displayStyle(34))),
                SquareIconButton(
                  icon: Icons.notifications_none_rounded,
                  onTap: () {},
                ),
              ],
            ),
            const SizedBox(height: 20),
            SearchField(
              hint: 'Нэр, машинаар хайх',
              controller: _query,
              onSubmitted: (_) => setState(() {}),
            ),
            const SizedBox(height: 18),
            if (items.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: Center(
                  child: Text(
                    'Мессеж олдсонгүй',
                    style: TextStyle(color: AppPalette.muted, fontSize: 16),
                  ),
                ),
              ),
            for (final c in items)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _tile(c),
              ),
          ],
        ),
      ),
    );
  }

  Widget _tile(Conversation c) {
    final car = findCar(c.carId);
    final unread = _read.contains(c.id) ? 0 : c.unread;
    return AppCard(
      padding: const EdgeInsets.all(14),
      radius: 24,
      onTap: () {
        setState(() => _read.add(c.id));
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ChatScreen(car: car, conversation: c),
          ),
        );
      },
      child: Row(
        children: [
          Stack(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: AppPalette.primaryTint,
                child: Text(
                  c.initials,
                  style: const TextStyle(
                    color: AppPalette.primary,
                    fontWeight: FontWeight.w800,
                    fontSize: 17,
                  ),
                ),
              ),
              if (c.online)
                Positioned(
                  right: 0,
                  bottom: 2,
                  child: Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: AppPalette.green,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        c.name,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    Text(
                      c.time,
                      style: const TextStyle(
                        color: AppPalette.muted,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  car.name,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppPalette.primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        c.lastMessage,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: unread > 0 ? AppPalette.ink : AppPalette.muted,
                          fontWeight:
                              unread > 0 ? FontWeight.w700 : FontWeight.w400,
                        ),
                      ),
                    ),
                    if (unread > 0)
                      Container(
                        margin: const EdgeInsets.only(left: 8),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppPalette.primary,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '$unread',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
