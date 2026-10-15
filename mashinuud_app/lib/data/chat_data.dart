class Conversation {
  final String id;
  final String name;
  final String carId;
  final String lastMessage;
  final String time;
  final int unread;
  final bool online;

  const Conversation({
    required this.id,
    required this.name,
    required this.carId,
    required this.lastMessage,
    required this.time,
    this.unread = 0,
    this.online = false,
  });

  /// "Bat-Erdene" -> "BE", "Номин" -> "НО"
  String get initials {
    final parts = name.split(RegExp(r'[\s-]+')).where((p) => p.isNotEmpty);
    if (parts.length > 1)
      return parts.take(2).map((p) => p[0]).join().toUpperCase();
    return name.substring(0, name.length < 2 ? name.length : 2).toUpperCase();
  }
}

const List<Conversation> conversations = [
  Conversation(
    id: 'c1',
    name: 'Бат-Эрдэнэ',
    carId: '3',
    lastMessage: 'Болно. 15:00 цагт Баянзүрхэд уулзъя.',
    time: '10:17',
    unread: 2,
    online: true,
  ),
  Conversation(
    id: 'c2',
    name: 'Номин',
    carId: '2',
    lastMessage: 'Маш сайн, баярлалаа!',
    time: '09:20',
  ),
  Conversation(
    id: 'c3',
    name: 'Ганзориг',
    carId: '8',
    lastMessage: 'Toyota Prius зар сонирхож байна.',
    time: 'Өчигдөр',
    online: true,
  ),
  Conversation(
    id: 'c4',
    name: 'Төгсөө',
    carId: '4',
    lastMessage: 'Та машинаа зарсан уу?',
    time: '2 өдрийн өмнө',
  ),
  Conversation(
    id: 'c5',
    name: 'Эрдэнэбат',
    carId: '5',
    lastMessage: 'Яаралтай байгаа юу?',
    time: '3 өдрийн өмнө',
  ),
];
