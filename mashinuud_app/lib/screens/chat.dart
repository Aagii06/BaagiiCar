import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/data/car_data.dart';
import 'package:mashinuud_app/data/chat_data.dart';
import 'package:mashinuud_app/screens/detail.dart';
import 'package:mashinuud_app/widgets/custom/ui.dart';

class _Message {
  final String text;
  final String time;
  final bool mine;

  const _Message(this.text, this.time, {this.mine = false});
}

const _quickReplies = [
  'Үнэ тохирох уу?',
  'Лизингээр авч болох уу?',
  'Оношилгоонд оруулж болох уу?',
];

class ChatScreen extends StatefulWidget {
  final Car? car;
  final Conversation? conversation;

  const ChatScreen({super.key, this.car, this.conversation});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<_Message> _messages = [
    const _Message(
      'Сайн байна уу. Машин зарагдаагүй байгаа юу?',
      '10:12',
      mine: true,
    ),
    const _Message('Сайн байна уу. Зарагдаагүй ээ, үзэх боломжтой.', '10:14'),
    const _Message('Маргааш үдээс хойш үзэж болох уу?', '10:15', mine: true),
    const _Message('Болно. 15:00 цагт Баянзүрхэд уулзъя.', '10:17'),
  ];

  Car get car => widget.car ?? findCar(contact.carId);

  /// Харилцагч: дамжуулсан эсвэл тухайн машины зарлагч.
  Conversation get contact =>
      widget.conversation ??
      conversations.firstWhere(
        (c) => c.carId == widget.car?.id,
        orElse: () => conversations.first,
      );

  void _send([String? text]) {
    final value = (text ?? _input.text).trim();
    if (value.isEmpty) return;
    final now = TimeOfDay.now();
    final time =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    setState(() => _messages.add(_Message(value, time, mine: true)));
    _input.clear();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppPalette.background,
      body: Column(
        children: [
          _header(),
          const Divider(height: 1, color: AppPalette.border),
          Expanded(
            child: ListView(
              controller: _scroll,
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
              children: [
                const Center(
                  child: Text(
                    'Өнөөдөр',
                    style: TextStyle(
                      color: AppPalette.muted,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                for (final m in _messages) _bubble(m),
              ],
            ),
          ),
          _composer(),
        ],
      ),
    );
  }

  Widget _header() {
    return Container(
      color: AppPalette.surface,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 20, 16),
          child: Column(
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.chevron_left_rounded, size: 32),
                  ),
                  const SizedBox(width: 4),
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: AppPalette.primaryTint,
                        child: Text(
                          contact.initials,
                          style: const TextStyle(
                            color: AppPalette.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                          ),
                        ),
                      ),
                      if (contact.online)
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
                        Text(
                          contact.name,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          contact.online
                              ? 'Онлайн байна'
                              : 'Саяхан онлайн байсан',
                          style: TextStyle(
                            color: contact.online
                                ? AppPalette.green
                                : AppPalette.muted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  SquareIconButton(
                    icon: Icons.call_outlined,
                    size: 52,
                    onTap: () {},
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.only(left: 8),
                child: AppCard(
                  color: AppPalette.background,
                  padding: const EdgeInsets.all(10),
                  radius: 22,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => DetailScreen(carId: car.id),
                    ),
                  ),
                  child: Row(
                    children: [
                      CarThumb(
                        tint: car.tint,
                        width: 72,
                        height: 54,
                        carWidth: 46,
                        radius: BorderRadius.circular(12),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              car.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 16,
                              ),
                            ),
                            PriceText(car.priceLabel, size: 16),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: AppPalette.muted,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _bubble(_Message m) {
    final radius = BorderRadius.only(
      topLeft: const Radius.circular(22),
      topRight: const Radius.circular(22),
      bottomLeft: Radius.circular(m.mine ? 22 : 4),
      bottomRight: Radius.circular(m.mine ? 4 : 22),
    );
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: m.mine
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.start,
        children: [
          ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.sizeOf(context).width * 0.72,
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              decoration: BoxDecoration(
                color: m.mine ? AppPalette.primary : AppPalette.surface,
                borderRadius: radius,
              ),
              child: Text(
                m.text,
                style: TextStyle(
                  color: m.mine ? Colors.white : AppPalette.ink,
                  fontSize: 17,
                  height: 1.35,
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            m.mine ? '${m.time} · Уншсан' : m.time,
            style: const TextStyle(color: AppPalette.muted, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _composer() {
    return Container(
      decoration: const BoxDecoration(
        color: AppPalette.surface,
        border: Border(top: BorderSide(color: AppPalette.border)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            SizedBox(
              height: 64,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
                itemCount: _quickReplies.length,
                separatorBuilder: (_, _) => const SizedBox(width: 10),
                itemBuilder: (_, i) => PillChip(
                  label: _quickReplies[i],
                  onTap: () => _send(_quickReplies[i]),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
              child: Row(
                children: [
                  SquareIconButton(
                    icon: Icons.currency_exchange_rounded,
                    size: 52,
                    onTap: () {},
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _input,
                      onSubmitted: (_) => _send(),
                      textInputAction: TextInputAction.send,
                      decoration: InputDecoration(
                        hintText: 'Мессеж бичих...',
                        hintStyle: const TextStyle(color: AppPalette.muted),
                        filled: true,
                        fillColor: AppPalette.background,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 15,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  SquareIconButton(
                    icon: Icons.send_rounded,
                    size: 52,
                    bordered: false,
                    background: AppPalette.primary,
                    iconColor: Colors.white,
                    onTap: _send,
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
