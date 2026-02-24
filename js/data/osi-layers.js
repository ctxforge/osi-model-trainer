export const OSI_LAYERS = [
  {
    number: 7,
    name: 'Прикладной',
    nameEn: 'Application',
    color: '#e74c3c',
    colorLight: '#fadbd8',
    description: 'Обеспечивает взаимодействие приложений пользователя с сетью. Это уровень, с которым непосредственно работает пользователь — браузеры, почтовые клиенты, мессенджеры.',
    functions: [
      'Предоставление сетевых сервисов приложениям',
      'Идентификация партнёров по связи',
      'Определение доступности ресурсов',
      'Синхронизация коммуникации'
    ],
    protocols: ['HTTP', 'HTTPS', 'FTP', 'SMTP', 'POP3', 'IMAP', 'DNS', 'DHCP', 'SSH', 'Telnet', 'SNMP'],
    devices: ['Шлюз приложений', 'Прокси-сервер', 'Файрвол L7'],
    pdu: 'Данные (Data)',
    pduFields: [{ name: 'Данные приложения', size: 'N', color: '#e74c3c' }],
    encapsulation: 'Приложение формирует данные для передачи по сети',
    analogy: 'Вы пишете письмо на понятном языке — это содержимое, которое вы хотите отправить',
    tcpip: 'Прикладной',
    examples: [
      { name: 'HTTP-запрос', code: 'GET /index.html HTTP/1.1\nHost: example.com\nUser-Agent: Chrome/120\nAccept: text/html\nConnection: keep-alive' },
      { name: 'DNS-запрос', code: 'Query: example.com\nType: A (IPv4)\nClass: IN\nID: 0xAB12\n→ Ответ: 93.184.216.34' },
      { name: 'SMTP (почта)', code: 'EHLO mail.client.com\nMAIL FROM:<user@client.com>\nRCPT TO:<admin@server.com>\nDATA\nSubject: Test\nHello!\n.' }
    ]
  },
  {
    number: 6,
    name: 'Представления',
    nameEn: 'Presentation',
    color: '#e67e22',
    colorLight: '#fdebd0',
    description: 'Отвечает за преобразование данных в формат, понятный принимающей стороне. Занимается кодировкой, шифрованием и сжатием.',
    functions: [
      'Преобразование форматов данных',
      'Шифрование и дешифрование',
      'Сжатие и распаковка данных',
      'Сериализация структур данных'
    ],
    protocols: ['SSL/TLS', 'JPEG', 'GIF', 'PNG', 'MPEG', 'ASCII', 'EBCDIC', 'XML', 'JSON'],
    devices: ['Шлюз (с функцией преобразования)'],
    pdu: 'Данные (Data)',
    pduFields: [{ name: 'TLS Record Header', size: '5 Б', color: '#e67e22' }, { name: 'Зашифрованные данные', size: 'N', color: '#e67e2280' }],
    encapsulation: 'Данные кодируются, шифруются или сжимаются',
    analogy: 'Вы переводите письмо на язык получателя и запечатываете в конверт с печатью',
    tcpip: 'Прикладной',
    examples: [
      { name: 'TLS Record', code: 'Content Type: Application Data (23)\nVersion: TLS 1.3 (0x0303)\nLength: 1420\nEncrypted: a3 f7 2b 91 c4 e8 ...' },
      { name: 'UTF-8 кодирование', code: '"Привет" в UTF-8:\nП → D0 9F (2 байта)\nр → D1 80\nи → D0 B8\nв → D0 B2\nе → D0 B5\nт → D1 82' },
      { name: 'JPEG заголовок', code: 'FF D8 FF E0 — начало JPEG (SOI + APP0)\n00 10 4A 46 49 46 — "JFIF"\n00 01 — версия 1.0\nFF DB — таблица квантования\nFF C0 — начало кадра (размер)' }
    ]
  },
  {
    number: 5,
    name: 'Сеансовый',
    nameEn: 'Session',
    color: '#f1c40f',
    colorLight: '#fef9e7',
    description: 'Управляет сеансами связи между приложениями. Устанавливает, поддерживает и завершает соединения, обеспечивает синхронизацию диалога.',
    functions: [
      'Установка, управление и завершение сеансов',
      'Синхронизация диалога',
      'Управление маркерами (token)',
      'Контрольные точки для восстановления'
    ],
    protocols: ['NetBIOS', 'RPC', 'PPTP', 'SCP', 'SAP', 'SDP'],
    devices: ['Шлюз'],
    pdu: 'Данные (Data)',
    pduFields: [{ name: 'Сессия', size: '', color: '#f1c40f' }, { name: 'Данные', size: 'N', color: '#f1c40f80' }],
    encapsulation: 'Добавляется информация о сеансе связи',
    analogy: 'Вы звоните по телефону и договариваетесь о времени и формате разговора',
    tcpip: 'Прикладной',
    examples: [
      { name: 'TCP-сессия', code: 'Session ID: 0xA3F7\nState: ESTABLISHED\nClient: 192.168.1.100:52341\nServer: 93.184.216.34:443\nDuration: 12.4s\nBytes: 45,230' },
      { name: 'RPC вызов', code: 'Program: 100003 (NFS)\nVersion: 3\nProcedure: READ\nCredentials: AUTH_SYS\nXID: 0x5A2B' }
    ]
  },
  {
    number: 4,
    name: 'Транспортный',
    nameEn: 'Transport',
    color: '#2ecc71',
    colorLight: '#d5f5e3',
    description: 'Обеспечивает надёжную (TCP) или быструю (UDP) передачу данных между узлами. Сегментирует данные, управляет потоком и контролирует ошибки.',
    functions: [
      'Сегментация и сборка данных',
      'Управление потоком (flow control)',
      'Контроль ошибок и повторная передача',
      'Мультиплексирование через порты'
    ],
    protocols: ['TCP', 'UDP', 'SCTP', 'DCCP'],
    devices: ['Файрвол L4', 'Балансировщик нагрузки'],
    pdu: 'Сегмент (TCP) / Датаграмма (UDP)',
    pduFields: [{ name: 'Src Port', size: '2 Б', color: '#2ecc71' }, { name: 'Dst Port', size: '2 Б', color: '#2ecc71' }, { name: 'Seq', size: '4 Б', color: '#27ae60' }, { name: 'Ack', size: '4 Б', color: '#27ae60' }, { name: 'Flags', size: '2 Б', color: '#1abc9c' }, { name: 'Window', size: '2 Б', color: '#1abc9c' }, { name: 'Checksum', size: '2 Б', color: '#16a085' }, { name: 'Payload', size: 'N', color: '#2ecc7140' }],
    encapsulation: 'Данные разбиваются на сегменты, добавляются порты источника и назначения',
    analogy: 'Вы нумеруете страницы книги и отправляете их по отдельности, чтобы получатель мог собрать книгу в правильном порядке',
    tcpip: 'Транспортный',
    examples: [
      { name: 'TCP-заголовок (20 байт)', code: 'Src Port:  49152 (0xC000)\nDst Port:  443   (0x01BB)\nSeq Num:   1000  (0x000003E8)\nAck Num:   5001  (0x00001389)\nFlags:     PSH, ACK (0x018)\nWindow:    65535\nChecksum:  0xA3F7\nUrg Ptr:   0' },
      { name: 'UDP-заголовок (8 байт)', code: 'Src Port:  53214 (0xCFDE)\nDst Port:  53    (0x0035)\nLength:    42\nChecksum:  0x7B2A\n\n8 байт — вот и весь UDP.\nНет Seq, нет ACK, нет гарантий.' },
      { name: 'Порты — кто есть кто', code: '22   — SSH (удалённый доступ)\n53   — DNS (имена → IP)\n80   — HTTP (веб, нешифр.)\n443  — HTTPS (веб, шифр.)\n993  — IMAPS (почта)\n3306 — MySQL (БД)\n5432 — PostgreSQL (БД)' }
    ]
  },
  {
    number: 3,
    name: 'Сетевой',
    nameEn: 'Network',
    color: '#1abc9c',
    colorLight: '#d1f2eb',
    description: 'Отвечает за логическую адресацию (IP-адреса) и маршрутизацию пакетов между разными сетями.',
    functions: [
      'Логическая адресация (IP)',
      'Маршрутизация пакетов',
      'Фрагментация пакетов',
      'Определение лучшего маршрута'
    ],
    protocols: ['IP (IPv4/IPv6)', 'ICMP', 'ARP', 'OSPF', 'BGP', 'RIP', 'EIGRP'],
    devices: ['Маршрутизатор', 'L3-коммутатор'],
    pdu: 'Пакет (Packet)',
    pduFields: [{ name: 'Ver+IHL', size: '1 Б', color: '#1abc9c' }, { name: 'TotLen', size: '2 Б', color: '#1abc9c' }, { name: 'ID', size: '2 Б', color: '#16a085' }, { name: 'TTL', size: '1 Б', color: '#1abc9c' }, { name: 'Proto', size: '1 Б', color: '#16a085' }, { name: 'Src IP', size: '4 Б', color: '#1abc9c' }, { name: 'Dst IP', size: '4 Б', color: '#1abc9c' }, { name: 'TCP/UDP + Payload', size: 'N', color: '#1abc9c40' }],
    encapsulation: 'К сегменту добавляется IP-заголовок с адресами источника и назначения',
    analogy: 'На конверте вы пишете адрес отправителя и получателя — город, улицу, дом',
    tcpip: 'Сетевой',
    examples: [
      { name: 'IPv4-заголовок (20 байт)', code: 'Version:  4     IHL: 5 (20 bytes)\nDSCP:     0     ECN: 0\nTotal:    1500 bytes\nID:       0x1A2B  Flags: DF\nTTL:      64\nProtocol: 6 (TCP)\nChecksum: 0xF7A3\nSrc IP:   192.168.1.100\nDst IP:   93.184.216.34' },
      { name: 'ICMP (ping)', code: 'Type: 8 (Echo Request)\nCode: 0\nChecksum: 0x4D2A\nID: 0x0001\nSeq: 1\nData: abcdefghijklmnop...\n\nОтвет: Type 0 (Echo Reply)' },
      { name: 'Таблица маршрутизации', code: 'Dest         Gateway       Mask            If\n0.0.0.0      192.168.1.1   0.0.0.0         eth0\n192.168.1.0  0.0.0.0       255.255.255.0   eth0\n10.0.0.0     192.168.1.254 255.0.0.0       eth0\n127.0.0.0    0.0.0.0       255.0.0.0       lo' }
    ]
  },
  {
    number: 2,
    name: 'Канальный',
    nameEn: 'Data Link',
    color: '#3498db',
    colorLight: '#d6eaf8',
    description: 'Обеспечивает передачу данных между непосредственно связанными узлами. Работает с MAC-адресами, обнаруживает и исправляет ошибки на физическом уровне.',
    functions: [
      'Физическая адресация (MAC)',
      'Формирование кадров (framing)',
      'Контроль доступа к среде',
      'Обнаружение ошибок (CRC)'
    ],
    protocols: ['Ethernet', 'Wi-Fi (802.11)', 'PPP', 'HDLC', 'Frame Relay', 'ARP'],
    devices: ['Коммутатор (Switch)', 'Мост (Bridge)', 'Точка доступа Wi-Fi'],
    pdu: 'Кадр (Frame)',
    pduFields: [{ name: 'Dst MAC', size: '6 Б', color: '#3498db' }, { name: 'Src MAC', size: '6 Б', color: '#3498db' }, { name: 'Type', size: '2 Б', color: '#2980b9' }, { name: 'IP Пакет (Payload)', size: '46-1500 Б', color: '#3498db40' }, { name: 'FCS', size: '4 Б', color: '#2980b9' }],
    encapsulation: 'К пакету добавляются MAC-заголовок и контрольная сумма (trailer)',
    analogy: 'Почтальон доставляет конверт от одного почтового отделения до соседнего',
    tcpip: 'Канальный',
    examples: [
      { name: 'Ethernet-кадр', code: 'Dst MAC:   FF:EE:DD:44:55:66\nSrc MAC:   AA:BB:CC:11:22:33\nType:      0x0800 (IPv4)\n├─ IP-пакет (payload) ─┤\nFCS/CRC:   0xDEADBEEF\n\nВсего: 14 + payload + 4 байт' },
      { name: 'MAC-адрес', code: 'AA:BB:CC:11:22:33\n│       │\n└ OUI ──┘ └ Device ┘\n\nOUI — код производителя (IEEE)\n00:1A:2B = Cisco\nAC:DE:48 = Apple\n3C:22:FB = Intel' },
      { name: 'ARP-запрос', code: 'Who has 192.168.1.1?\nTell 192.168.1.100\n\nОтвет:\n192.168.1.1 is at 00:1A:2B:3C:4D:5E\n\nARP связывает IP (L3) с MAC (L2)\nХранится в ARP-кэше ~5 мин' },
      { name: 'Wi-Fi кадр (802.11)', code: 'Frame Control: Data\nDuration: 44μs\nAddr1 (RA):  AP MAC\nAddr2 (TA):  Client MAC\nAddr3 (DA):  Dst MAC\nSeq: 1234\n├─ Payload (encrypted) ─┤\nFCS: CRC-32' }
    ]
  },
  {
    number: 1,
    name: 'Физический',
    nameEn: 'Physical',
    color: '#9b59b6',
    colorLight: '#ebdef0',
    description: 'Передаёт необработанный поток битов через физическую среду. Определяет электрические, механические и функциональные характеристики интерфейса.',
    functions: [
      'Передача битов через среду',
      'Определение напряжений и скоростей',
      'Физическая топология сети',
      'Модуляция и кодирование сигнала'
    ],
    protocols: ['Ethernet (физ.)', 'USB', 'Bluetooth', 'DSL', 'ISDN', 'RS-232', '802.11 (радио)'],
    devices: ['Хаб (Hub)', 'Репитер', 'Модем', 'Медиаконвертер'],
    pdu: 'Биты (Bits)',
    pduFields: [{ name: 'Преамбула', size: '7 Б', color: '#9b59b6' }, { name: 'SFD', size: '1 Б', color: '#8e44ad' }, { name: 'Ethernet кадр', size: 'N', color: '#9b59b640' }, { name: 'IFG', size: '12 Б', color: '#9b59b630' }],
    encapsulation: 'Кадр преобразуется в последовательность электрических/оптических/радиосигналов',
    analogy: 'Физическая дорога, по которой едет почтовый грузовик — провода, оптоволокно, радиоволны',
    tcpip: 'Канальный',
    examples: [
      { name: 'Витая пара Cat5e', code: '4 пары скрученных медных проводов\nСкорость: 1 Гбит/с\nМакс. длина: 100 м\nРазъём: RJ-45 (8P8C)\nКодирование: PAM-5\n\n  ┌──RJ-45──┐\n  │12345678│\n  └────────┘' },
      { name: 'Оптоволокно', code: 'Single-mode: ядро 9 мкм, 1 луч\nMulti-mode:  ядро 50 мкм, много лучей\nСкорость: до 100 Гбит/с\nДальность SM: до 80 км\nРазъёмы: SC, LC, ST\nДлина волны: 1310 / 1550 нм' },
      { name: 'Wi-Fi 2.4 / 5 / 6 ГГц', code: '2.4 GHz: 14 каналов, 3 неперекр.\n  Далеко, но медленно и помехи\n5 GHz: 25 каналов, 80/160 МГц\n  Быстро, но хуже через стены\n6 GHz (Wi-Fi 6E): 1200 МГц полоса\n  Новый спектр, без помех от соседей' },
      { name: 'Сигнал Manchester', code: 'Бит 1: ▄█ (переход вверх)\nБит 0: █▄ (переход вниз)\n\n1 0 1 1 0:\n  ▄█ █▄ ▄█ ▄█ █▄\n\nПереход в середине каждого бита\n= встроенный тактовый сигнал' }
    ]
  }
];

export const TCPIP_MAPPING = [
  { name: 'Прикладной', osiLayers: [7, 6, 5], color: '#e74c3c' },
  { name: 'Транспортный', osiLayers: [4], color: '#2ecc71' },
  { name: 'Сетевой', osiLayers: [3], color: '#1abc9c' },
  { name: 'Канальный', osiLayers: [2, 1], color: '#3498db' }
];

export const ENCAPSULATION_HEADERS = [
  { layer: 7, label: 'Данные приложения', short: 'DATA', color: '#e74c3c' },
  { layer: 6, label: 'Кодирование', short: 'ENC', color: '#e67e22' },
  { layer: 5, label: 'Сеанс', short: 'SES', color: '#f1c40f' },
  { layer: 4, label: 'TCP/UDP заголовок', short: 'TCP', color: '#2ecc71' },
  { layer: 3, label: 'IP заголовок', short: 'IP', color: '#1abc9c' },
  { layer: 2, label: 'MAC заголовок + CRC', short: 'ETH', color: '#3498db' },
  { layer: 1, label: 'Биты → сигнал', short: '010', color: '#9b59b6' }
];
