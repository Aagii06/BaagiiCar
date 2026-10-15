import 'package:flutter/material.dart';
import 'package:mashinuud_app/app/theme.dart';
import 'package:mashinuud_app/screens/chat.dart';
import 'package:mashinuud_app/widgets/custom/ui.dart';

const _topics = [
  (Icons.add_rounded, 'Зар оруулах', AppPalette.primaryTint),
  (Icons.shield_outlined, 'Аюулгүй худалдаа', AppPalette.greenTint),
  (Icons.credit_card_rounded, 'Төлбөр, лизинг', AppPalette.accentTint),
  (Icons.person_outline_rounded, 'Бүртгэл', AppPalette.lavenderTint),
];

const _faq = [
  (
    'Зар оруулахад төлбөртэй юу?',
    'Энгийн зар үнэгүй. Онцлох зар болон оношилгооны үйлчилгээ нэмэлт төлбөртэй.',
  ),
  (
    'Залилангаас яаж сэргийлэх вэ?',
    'Машиныг биечлэн үзэхээс өмнө урьдчилгаа шилжүүлэхгүй байх, бичиг баримтыг шалгах, “Оношилгоотой” зарыг сонгохыг зөвлөж байна.',
  ),
  (
    '“Оношилгоотой” тэмдэг гэж юу вэ?',
    'Манай түнш засварын газар машиныг шалгаж, хөдөлгүүр, хурдны хайрцаг, явах эд анги, цахилгаан системийн тайланг гаргасан гэсэн үг.',
  ),
  (
    'Лизингээр авах боломжтой юу?',
    '“Лизинг боломжтой” тэмдэгтэй зарыг түнш банк, ББСБ-ын лизингээр авах боломжтой. Дэлгэрэнгүй хуудасны зээлийн тооцоолуураар сарын төлбөрөө тооцоолоорой.',
  ),
];

class HelpScreen extends StatefulWidget {
  const HelpScreen({super.key});

  @override
  State<HelpScreen> createState() => _HelpScreenState();
}

class _HelpScreenState extends State<HelpScreen> {
  int? _open = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppPalette.background,
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          _header(),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: EdgeInsets.zero,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.4,
                  children: [
                    for (final (icon, label, tint) in _topics)
                      AppCard(
                        onTap: () {},
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: tint,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(icon, size: 22),
                            ),
                            Text(
                              label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 28),
                const SectionHeader(title: 'Түгээмэл асуултууд'),
                const SizedBox(height: 14),
                for (var i = 0; i < _faq.length; i++) _faqItem(i),
                const SizedBox(height: 10),
                _contactCard(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _header() {
    return Container(
      color: AppPalette.ink,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  SquareIconButton(
                    icon: Icons.chevron_left_rounded,
                    bordered: false,
                    background: AppPalette.inkSoft,
                    iconColor: Colors.white,
                    onTap: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 16),
                  Text('Тусламж', style: displayStyle(30, color: Colors.white)),
                ],
              ),
              const SizedBox(height: 24),
              const Text(
                'Бид танд юугаар\nтуслах вэ?',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 20),
              const SearchField(hint: 'Асуултаа бичнэ үү', bordered: false),
            ],
          ),
        ),
      ),
    );
  }

  Widget _faqItem(int i) {
    final (question, answer) = _faq[i];
    final open = _open == i;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        onTap: () => setState(() => _open = open ? null : i),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 22),
        child: AnimatedSize(
          duration: const Duration(milliseconds: 200),
          alignment: Alignment.topCenter,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      question,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Icon(
                    open ? Icons.remove_rounded : Icons.add_rounded,
                    color: AppPalette.muted,
                  ),
                ],
              ),
              if (open) ...[
                const SizedBox(height: 14),
                Text(
                  answer,
                  style: const TextStyle(
                    color: AppPalette.muted,
                    fontSize: 16,
                    height: 1.5,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _contactCard() {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Хариулт олдсонгүй юу?',
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: PrimaryButton(
                  label: 'Оператортой чатлах',
                  icon: Icons.chat_bubble_outline_rounded,
                  height: 56,
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ChatScreen()),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              OutlineButton(
                icon: Icons.call_outlined,
                label: 'Залгах',
                height: 56,
                onPressed: () {},
              ),
            ],
          ),
        ],
      ),
    );
  }
}
