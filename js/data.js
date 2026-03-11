const OSI_LAYERS = [
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

const TCPIP_MAPPING = [
  { name: 'Прикладной', osiLayers: [7, 6, 5], color: '#e74c3c' },
  { name: 'Транспортный', osiLayers: [4], color: '#2ecc71' },
  { name: 'Сетевой', osiLayers: [3], color: '#1abc9c' },
  { name: 'Канальный', osiLayers: [2, 1], color: '#3498db' }
];

const DRAG_DROP_ITEMS = [
  { name: 'HTTP', layer: 7, type: 'protocol' },
  { name: 'FTP', layer: 7, type: 'protocol' },
  { name: 'DNS', layer: 7, type: 'protocol' },
  { name: 'SMTP', layer: 7, type: 'protocol' },
  { name: 'DHCP', layer: 7, type: 'protocol' },
  { name: 'SSH', layer: 7, type: 'protocol' },
  { name: 'SNMP', layer: 7, type: 'protocol' },
  { name: 'SSL/TLS', layer: 6, type: 'protocol' },
  { name: 'JPEG', layer: 6, type: 'protocol' },
  { name: 'MPEG', layer: 6, type: 'protocol' },
  { name: 'NetBIOS', layer: 5, type: 'protocol' },
  { name: 'RPC', layer: 5, type: 'protocol' },
  { name: 'TCP', layer: 4, type: 'protocol' },
  { name: 'UDP', layer: 4, type: 'protocol' },
  { name: 'Балансировщик нагрузки', layer: 4, type: 'device' },
  { name: 'IP', layer: 3, type: 'protocol' },
  { name: 'ICMP', layer: 3, type: 'protocol' },
  { name: 'OSPF', layer: 3, type: 'protocol' },
  { name: 'BGP', layer: 3, type: 'protocol' },
  { name: 'Маршрутизатор', layer: 3, type: 'device' },
  { name: 'L3-коммутатор', layer: 3, type: 'device' },
  { name: 'Ethernet', layer: 2, type: 'protocol' },
  { name: 'Wi-Fi', layer: 2, type: 'protocol' },
  { name: 'PPP', layer: 2, type: 'protocol' },
  { name: 'Коммутатор', layer: 2, type: 'device' },
  { name: 'Мост', layer: 2, type: 'device' },
  { name: 'Точка доступа', layer: 2, type: 'device' },
  { name: 'Хаб', layer: 1, type: 'device' },
  { name: 'Репитер', layer: 1, type: 'device' },
  { name: 'Модем', layer: 1, type: 'device' },
  { name: 'USB', layer: 1, type: 'protocol' },
  { name: 'Bluetooth', layer: 1, type: 'protocol' }
];

const LAB_GROUPS = [
  { id: 'overview', name: '🚀 Обзор', desc: 'Полный путь данных от отправителя до получателя',
    experiments: ['journey', 'scenario'] },
  { id: 'physical', name: '⚡ L1 Физика', desc: 'Сигналы, модуляция, каналы связи, мультиплексирование',
    experiments: ['signals', 'channelPhysics', 'multiplexing'] },
  { id: 'network', name: '🌐 L2-L3 Сеть', desc: 'Устройства, маршрутизация, адресация, конструктор сети',
    experiments: ['devices', 'netBuilder', 'routing', 'fragmentation', 'ipCalc'] },
  { id: 'transport', name: '📦 L4 Транспорт', desc: 'TCP/UDP: соединения, передача, сравнение протоколов',
    experiments: ['tcpHandshake', 'tcpVsUdp', 'packetTransmission'] },
  { id: 'security', name: '🔐 L5-L7 Безопасность', desc: 'Шифрование, TLS, сертификаты',
    experiments: ['encryption', 'tls'] }
];

const LAB_EXPERIMENTS = {
  journey: {
    title: 'Путь сообщения',
    icon: '🚀',
    description: 'Полный анимированный путь данных от клавиатуры до экрана получателя через все 7 уровней OSI',
    params: []
  },
  scenario: {
    title: 'Открытие сайта',
    icon: '🌐',
    description: 'Что происходит шаг за шагом, когда вы вводите URL в браузере',
    params: []
  },
  signals: {
    title: 'Сигналы L1',
    icon: '⚡',
    description: 'Как биты превращаются в электрические, световые и радиосигналы',
    params: []
  },
  channelPhysics: {
    title: 'Физика канала',
    icon: '📊',
    description: 'Затухание, помехи, SNR, BER — как среда влияет на сигнал',
    params: []
  },
  multiplexing: {
    title: 'Мультиплексирование',
    icon: '🔀',
    description: 'Как один кабель/частота обслуживает много устройств — TDM, FDM, OFDMA, порты',
    params: []
  },
  devices: {
    title: 'Hub / Switch / Router',
    icon: '🔌',
    description: 'Как устройства обрабатывают кадры на разных уровнях OSI',
    params: []
  },
  netBuilder: {
    title: 'Конструктор сети',
    icon: '🔗',
    description: 'Постройте маршрут из устройств и каналов, отправьте пакет, увидите OSI на каждом хопе',
    params: []
  },
  routing: {
    title: 'Маршрутизация и TTL',
    icon: '🗺️',
    description: 'Как маршрутизаторы выбирают путь и зачем TTL уменьшается на каждом хопе',
    params: [
      { id: 'ttl', label: 'TTL (Time To Live)', type: 'range', min: 1, max: 16, step: 1, default: 8, unit: '' },
      { id: 'hops', label: 'Количество хопов', type: 'range', min: 1, max: 12, step: 1, default: 5, unit: '' },
      { id: 'routeType', label: 'Алгоритм', type: 'toggle', options: ['Кратчайший', 'Альтернативный'], default: 0 }
    ]
  },
  fragmentation: {
    title: 'Фрагментация MTU',
    icon: '✂️',
    description: 'Пакет не влезает в канал — маршрутизатор разрезает его. MTU (Maximum Transmission Unit) — максимальный размер, который канал может передать за раз',
    params: [
      { id: 'mtu', label: 'MTU канала (байт)', type: 'range', min: 68, max: 1500, step: 1, default: 1500, unit: 'байт' },
      { id: 'messageSize', label: 'Размер вашего сообщения', type: 'range', min: 100, max: 9000, step: 100, default: 4000, unit: 'байт' },
      { id: 'headerSize', label: 'Размер IP-заголовка', type: 'range', min: 20, max: 60, step: 4, default: 20, unit: 'байт' }
    ]
  },
  ipCalc: {
    title: 'IP-калькулятор',
    icon: '🔢',
    description: 'Как IP-адрес и маска делят адрес на сетевую и хостовую часть. Рассчитайте параметры подсети',
    params: [
      { id: 'ip', label: 'IP-адрес', type: 'ip', default: '192.168.1.100' },
      { id: 'cidr', label: 'Маска (CIDR)', type: 'range', min: 8, max: 30, step: 1, default: 24, unit: '' }
    ]
  },
  tcpHandshake: {
    title: 'TCP Handshake',
    icon: '🤝',
    description: 'Трёхстороннее рукопожатие: как TCP устанавливает надёжное соединение перед передачей данных',
    params: [
      { id: 'speed', label: 'Скорость анимации', type: 'range', min: 200, max: 1500, step: 100, default: 600, unit: 'мс' }
    ]
  },
  tcpVsUdp: {
    title: 'TCP vs UDP',
    icon: '⚔️',
    description: 'Надёжный TCP (с подтверждениями) против быстрого UDP (без гарантий) — параллельное сравнение',
    params: [
      { id: 'packetLoss', label: 'Потеря пакетов', type: 'range', min: 0, max: 60, step: 5, default: 20, unit: '%' },
      { id: 'speed', label: 'Скорость анимации', type: 'range', min: 150, max: 1000, step: 50, default: 350, unit: 'мс' }
    ]
  },
  packetTransmission: {
    title: 'Передача пакетов',
    icon: '📡',
    description: 'Как потери и задержка влияют на передачу — TCP пересылает потерянные пакеты, UDP теряет навсегда',
    params: [
      { id: 'protocol', label: 'Протокол', type: 'toggle', options: ['TCP', 'UDP'], default: 0 },
      { id: 'packetLoss', label: 'Потеря пакетов', type: 'range', min: 0, max: 50, step: 1, default: 10, unit: '%' },
      { id: 'latency', label: 'Задержка (RTT)', type: 'range', min: 10, max: 500, step: 10, default: 100, unit: 'мс' },
      { id: 'bandwidth', label: 'Пропускная способность', type: 'range', min: 1, max: 100, step: 1, default: 50, unit: 'Мбит/с' }
    ]
  },
  fragmentation: {
    title: 'Фрагментация MTU',
    icon: '✂️',
    description: 'Посмотрите, как размер MTU влияет на фрагментацию пакетов',
    params: [
      { id: 'mtu', label: 'MTU (байт)', type: 'range', min: 68, max: 1500, step: 1, default: 1500, unit: 'байт' },
      { id: 'messageSize', label: 'Размер сообщения', type: 'range', min: 100, max: 9000, step: 100, default: 4000, unit: 'байт' },
      { id: 'headerSize', label: 'Размер заголовка IP', type: 'range', min: 20, max: 60, step: 4, default: 20, unit: 'байт' }
    ]
  },
  routing: {
    title: 'Маршрутизация и TTL',
    icon: '🗺️',
    description: 'Узнайте, как TTL и маршрутизация влияют на доставку пакетов',
    params: [
      { id: 'ttl', label: 'TTL', type: 'range', min: 1, max: 16, step: 1, default: 8, unit: '' },
      { id: 'hops', label: 'Количество хопов', type: 'range', min: 1, max: 12, step: 1, default: 5, unit: '' },
      { id: 'routeType', label: 'Алгоритм', type: 'toggle', options: ['Кратчайший', 'Альтернативный'], default: 0 }
    ]
  },
  ipCalc: {
    title: 'IP-калькулятор',
    icon: '🔢',
    description: 'Рассчитайте параметры подсети по IP-адресу и маске',
    params: [
      { id: 'ip', label: 'IP-адрес', type: 'ip', default: '192.168.1.100' },
      { id: 'cidr', label: 'Маска (CIDR)', type: 'range', min: 8, max: 30, step: 1, default: 24, unit: '' }
    ]
  },
  tcpHandshake: {
    title: 'TCP Handshake',
    icon: '🤝',
    description: 'Наблюдайте трёхстороннее рукопожатие, передачу данных и завершение TCP-соединения',
    params: [
      { id: 'speed', label: 'Скорость анимации', type: 'range', min: 200, max: 1500, step: 100, default: 600, unit: 'мс' }
    ]
  },
  scenario: {
    title: 'Открытие сайта',
    icon: '🌐',
    description: 'Пошаговый сценарий: что происходит, когда вы вводите адрес в браузере',
    params: []
  },
  devices: {
    title: 'Hub / Switch / Router',
    icon: '🔌',
    description: 'Сравните, как хаб, коммутатор и маршрутизатор обрабатывают кадры',
    params: []
  },
  tcpVsUdp: {
    title: 'TCP vs UDP',
    icon: '⚔️',
    description: 'Параллельное сравнение TCP и UDP при передаче данных с потерями',
    params: [
      { id: 'packetLoss', label: 'Потеря пакетов', type: 'range', min: 0, max: 60, step: 5, default: 20, unit: '%' },
      { id: 'speed', label: 'Скорость анимации', type: 'range', min: 150, max: 1000, step: 50, default: 350, unit: 'мс' }
    ]
  },
  netBuilder: {
    title: 'Конструктор сети',
    icon: '🔗',
    description: 'Постройте маршрут из реальных устройств и каналов связи, затем отправьте пакет',
    params: []
  },
  tls: {
    title: 'TLS / Сертификаты',
    icon: '🔒',
    description: 'TLS-рукопожатие пошагово: ClientHello, сертификаты X.509, обмен ключами, шифрование канала',
    params: [
      { id: 'tlsVersion', label: 'Версия TLS', type: 'toggle', options: ['TLS 1.2', 'TLS 1.3'], default: 1 },
      { id: 'speed', label: 'Скорость анимации', type: 'range', min: 200, max: 1200, step: 100, default: 500, unit: 'мс' }
    ]
  }
};

const CHANNEL_TYPES = [
  { id: 'cat5e', name: 'Ethernet Cat5e', speed: 1000, latency: 0.01, medium: 'copper', maxDist: 100,
    icon: '🔌', color: '#3498db',
    attenuation: 22, snrBase: 40, duplex: 'full', interference: 'low', propagation: 0.64,
    encoding: 'PAM-5', jitter: 0.005, bandwidthMHz: 100, defaultDist: 30,
    desc: 'Витая пара Cat5e — 4 скрученные пары медных проводников. Стандарт для LAN. Экранирование снижает наводки.' },
  { id: 'cat6', name: 'Ethernet Cat6', speed: 10000, latency: 0.01, medium: 'copper', maxDist: 55,
    icon: '🔌', color: '#2980b9',
    attenuation: 20, snrBase: 44, duplex: 'full', interference: 'low', propagation: 0.64,
    encoding: 'PAM-16', jitter: 0.003, bandwidthMHz: 250, defaultDist: 20,
    desc: 'Cat6 — улучшенная витая пара с разделителем пар. 10 Гбит/с на коротких дистанциях, усиленная защита от перекрёстных наводок (NEXT).' },
  { id: 'fiber_sm', name: 'Оптоволокно SM', speed: 100000, latency: 0.005, medium: 'fiber', maxDist: 80000,
    icon: '💡', color: '#e74c3c',
    attenuation: 0.2, snrBase: 55, duplex: 'full', interference: 'none', propagation: 0.67,
    encoding: 'NRZ / PAM-4', jitter: 0.001, bandwidthMHz: 100000, defaultDist: 5000,
    desc: 'Одномодовое оптоволокно — ядро 9 мкм, один луч. Минимальное затухание (0.2 дБ/км). Невосприимчиво к ЭМ-помехам. Магистральные каналы.' },
  { id: 'fiber_mm', name: 'Оптоволокно MM', speed: 10000, latency: 0.005, medium: 'fiber', maxDist: 550,
    icon: '💡', color: '#c0392b',
    attenuation: 3.0, snrBase: 48, duplex: 'full', interference: 'none', propagation: 0.67,
    encoding: '64B/66B', jitter: 0.002, bandwidthMHz: 4700, defaultDist: 100,
    desc: 'Многомодовое оптоволокно — ядро 50/62.5 мкм, несколько лучей. Модовая дисперсия ограничивает дальность. Для дата-центров.' },
  { id: 'wifi24', name: 'Wi-Fi 2.4 GHz', speed: 150, latency: 3, medium: 'radio', maxDist: 70,
    icon: '📶', color: '#2ecc71',
    attenuation: 60, snrBase: 35, duplex: 'half', interference: 'high', propagation: 0.99,
    encoding: 'OFDM', jitter: 2, bandwidthMHz: 20, defaultDist: 15,
    freqGHz: 2.4, txPowerDbm: 20, rxAntennaGain: 2, noiseFigure: 6,
    desc: 'Wi-Fi 2.4 ГГц (802.11n) — 14 каналов, 3 неперекрывающихся. Сильные помехи от микроволновок, Bluetooth, соседских сетей. Полудуплекс (CSMA/CA).' },
  { id: 'wifi5', name: 'Wi-Fi 5 GHz', speed: 866, latency: 2, medium: 'radio', maxDist: 35,
    icon: '📶', color: '#27ae60',
    attenuation: 70, snrBase: 38, duplex: 'half', interference: 'medium', propagation: 0.99,
    encoding: 'OFDM 256-QAM', jitter: 1.5, bandwidthMHz: 80, defaultDist: 10,
    freqGHz: 5.18, txPowerDbm: 20, rxAntennaGain: 3, noiseFigure: 5,
    desc: 'Wi-Fi 5 ГГц (802.11ac) — больше каналов, шире полоса (80/160 МГц). Хуже проходит стены (затухание ~70 дБ на 30 м). Полудуплекс.' },
  { id: 'wifi6', name: 'Wi-Fi 6 (ax)', speed: 2400, latency: 1, medium: 'radio', maxDist: 30,
    icon: '📶', color: '#1abc9c',
    attenuation: 72, snrBase: 42, duplex: 'half', interference: 'medium', propagation: 0.99,
    encoding: 'OFDMA 1024-QAM', jitter: 0.8, bandwidthMHz: 160, defaultDist: 8,
    freqGHz: 5.5, txPowerDbm: 20, rxAntennaGain: 3, noiseFigure: 5,
    desc: 'Wi-Fi 6 (802.11ax) — OFDMA для параллельного доступа, 1024-QAM, Target Wake Time. Лучше в плотных сетях, но всё ещё полудуплекс.' },
  { id: 'coax', name: 'Коаксиальный', speed: 1000, latency: 0.5, medium: 'copper', maxDist: 500,
    icon: '📺', color: '#e67e22',
    attenuation: 6, snrBase: 38, duplex: 'half', interference: 'low', propagation: 0.77,
    encoding: 'QAM-256', jitter: 0.1, bandwidthMHz: 1000, defaultDist: 100,
    desc: 'Коаксиальный кабель — центральная жила + экран. Хорошая защита от помех. DOCSIS 3.1 для кабельного интернета. Общая среда (полудуплекс).' },
  { id: 'dsl', name: 'DSL (телефон)', speed: 100, latency: 10, medium: 'copper', maxDist: 5500,
    icon: '📞', color: '#f39c12',
    attenuation: 14, snrBase: 30, duplex: 'full', interference: 'medium', propagation: 0.64,
    encoding: 'DMT (QAM)', jitter: 2, bandwidthMHz: 17, defaultDist: 2000,
    desc: 'DSL — телефонная пара. Скорость резко падает с расстоянием. ADSL: вниз до 24 Мбит/с, вверх до 3.5 Мбит/с. Наводки от других пар (crosstalk).' },
  { id: 'lte', name: '4G LTE', speed: 100, latency: 30, medium: 'radio', maxDist: 10000,
    icon: '📱', color: '#9b59b6',
    attenuation: 40, snrBase: 25, duplex: 'full', interference: 'medium', propagation: 0.99,
    encoding: 'OFDMA 64-QAM', jitter: 5, bandwidthMHz: 20, defaultDist: 2000,
    freqGHz: 1.8, txPowerDbm: 46, rxAntennaGain: 0, noiseFigure: 7,
    desc: '4G LTE — FDD или TDD дуплекс. MIMO-антенны. Задержка 20-50 мс. Скорость зависит от загрузки соты и расстояния до вышки.' },
  { id: '5g', name: '5G (sub-6)', speed: 1000, latency: 5, medium: 'radio', maxDist: 1000,
    icon: '📱', color: '#8e44ad',
    attenuation: 80, snrBase: 30, duplex: 'full', interference: 'low', propagation: 0.99,
    encoding: 'OFDMA 256-QAM', jitter: 1, bandwidthMHz: 100, defaultDist: 300,
    freqGHz: 3.5, txPowerDbm: 43, rxAntennaGain: 0, noiseFigure: 5,
    desc: '5G sub-6 ГГц — Massive MIMO, beamforming. Малый радиус, но высокая ёмкость. mmWave (28 ГГц) ещё быстрее, но всего 100-200 м.' },
  { id: 'satellite', name: 'Спутник (GEO)', speed: 100, latency: 600, medium: 'radio', maxDist: 40000,
    icon: '🛰️', color: '#34495e',
    attenuation: 200, snrBase: 15, duplex: 'half', interference: 'medium', propagation: 0.99,
    encoding: 'DVB-S2 (8PSK)', jitter: 20, bandwidthMHz: 36, defaultDist: 35786,
    freqGHz: 12.0, txPowerDbm: 50, rxAntennaGain: 40, noiseFigure: 1.5,
    desc: 'GEO-спутник на высоте 35 786 км. Задержка ~600 мс RTT (неустранима физикой). Затухание в свободном пространстве, влияние погоды (rain fade).' }
];

const NET_DEVICES = [
  { id: 'pc', name: 'Компьютер', layer: 7, icon: '💻', color: '#95a5a6', proc: 0, desc: 'Конечное устройство. Работает на всех 7 уровнях OSI.' },
  { id: 'server', name: 'Сервер', layer: 7, icon: '🖥️', color: '#7f8c8d', proc: 0, desc: 'Серверное оборудование. Принимает и обрабатывает запросы.' },
  { id: 'hub', name: 'Хаб', layer: 1, icon: '🔌', color: '#9b59b6', proc: 0, desc: 'L1. Повторяет сигнал на все порты без анализа. Общий домен коллизий.' },
  { id: 'switch', name: 'Коммутатор', layer: 2, icon: '🔀', color: '#3498db', proc: 0.01, desc: 'L2. Читает MAC-адрес, пересылает кадр только на нужный порт.' },
  { id: 'router', name: 'Маршрутизатор', layer: 3, icon: '🌐', color: '#1abc9c', proc: 0.1, desc: 'L3. Анализирует IP, выбирает маршрут, меняет MAC-заголовок.' },
  { id: 'ap', name: 'Точка доступа', layer: 2, icon: '📡', color: '#2ecc71', proc: 0.02, desc: 'L2. Мост между проводной и беспроводной сетью.' },
  { id: 'modem', name: 'Модем', layer: 1, icon: '📟', color: '#e67e22', proc: 0.5, desc: 'L1. Преобразует цифровой сигнал в аналоговый и обратно.' },
  { id: 'firewall', name: 'Файрвол', layer: 4, icon: '🛡️', color: '#e74c3c', proc: 0.2, desc: 'L3-L7. Анализирует пакеты и фильтрует по правилам безопасности.' }
];

const NET_PRESETS = [
  { name: '🏠 Домашняя', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: 'wifi5', dist: 8 },
    { type: 'device', id: 'router' }, { type: 'link', id: 'cat5e', dist: 5 },
    { type: 'device', id: 'modem' }, { type: 'link', id: 'fiber_mm', dist: 200 },
    { type: 'device', id: 'router' }, { type: 'link', id: 'fiber_sm', dist: 12000 },
    { type: 'device', id: 'server' }
  ]},
  { name: '🏢 Офис', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: 'cat6', dist: 15 },
    { type: 'device', id: 'switch' }, { type: 'link', id: 'cat6', dist: 30 },
    { type: 'device', id: 'firewall' }, { type: 'link', id: 'cat6', dist: 5 },
    { type: 'device', id: 'server' }
  ]},
  { name: '📱 Мобильный', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: '5g', dist: 400 },
    { type: 'device', id: 'router' }, { type: 'link', id: 'fiber_sm', dist: 50000 },
    { type: 'device', id: 'router' }, { type: 'link', id: 'cat6', dist: 10 },
    { type: 'device', id: 'server' }
  ]},
  { name: '🛰️ Спутник', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: 'cat5e', dist: 10 },
    { type: 'device', id: 'modem' }, { type: 'link', id: 'satellite', dist: 35786 },
    { type: 'device', id: 'modem' }, { type: 'link', id: 'cat5e', dist: 10 },
    { type: 'device', id: 'router' }, { type: 'link', id: 'fiber_sm', dist: 5000 },
    { type: 'device', id: 'server' }
  ]}
];

const XP_LEVELS = [
  { level: 1, name: 'Новичок', minXp: 0, icon: '🌱' },
  { level: 2, name: 'Стажёр', minXp: 30, icon: '📗' },
  { level: 3, name: 'Техник', minXp: 80, icon: '🔧' },
  { level: 4, name: 'Инженер', minXp: 160, icon: '⚙️' },
  { level: 5, name: 'Архитектор', minXp: 300, icon: '🏗️' },
  { level: 6, name: 'Сетевой Гуру', minXp: 500, icon: '🧠' }
];

const ACHIEVEMENTS = [
  { id: 'first_encap', name: 'Первый пакет', desc: 'Запустите симулятор инкапсуляции', icon: '📦', xp: 10 },
  { id: 'study_all', name: 'Знаток OSI', desc: 'Изучите все 7 уровней', icon: '📖', xp: 20 },
  { id: 'tcp_hand', name: 'Рукопожатие', desc: 'Запустите TCP Handshake', icon: '🤝', xp: 10 },
  { id: 'scenario_done', name: 'Веб-сёрфер', desc: 'Пройдите сценарий открытия сайта', icon: '🌐', xp: 10 },
  { id: 'dnd_perfect', name: 'Точное попадание', desc: 'Разместите всё правильно в тренажёре', icon: '🎯', xp: 25 },
  { id: 'net_builder', name: 'Сетевой строитель', desc: 'Отправьте пакет по своей сети', icon: '🔗', xp: 15 },
  { id: 'all_channels', name: 'Связист', desc: 'Используйте 5 разных каналов связи', icon: '📡', xp: 20 },
  { id: 'tcp_vs_udp', name: 'Протокольный дуэлянт', desc: 'Запустите TCP vs UDP', icon: '⚔️', xp: 10 },
  { id: 'ip_calc', name: 'Подсетевик', desc: 'Рассчитайте IP-подсеть', icon: '🔢', xp: 10 },
  { id: 'xp_100', name: 'Сотня', desc: 'Наберите 100 XP', icon: '💯', xp: 0 },
  { id: 'xp_300', name: 'Мастер', desc: 'Наберите 300 XP', icon: '🏆', xp: 0 }
];

const ENV_EFFECTS = {
  copper: [
    { id: 'shielded', label: 'Экранирование (STP)', type: 'toggle', default: false, dbBonus: 6, desc: 'Экранированная витая пара снижает внешние наводки на ~6 дБ' },
    { id: 'bundlePairs', label: 'Пар в пучке (crosstalk)', type: 'range', min: 1, max: 50, default: 4, dbPenalty: 0.3, desc: 'Чем больше пар в кабельном канале, тем сильнее перекрёстные наводки (NEXT/FEXT)' },
    { id: 'temperature', label: 'Температура (°C)', type: 'range', min: -10, max: 70, default: 25, dbPenPerDeg: 0.04, baseline: 25, desc: 'Сопротивление меди растёт с температурой → затухание увеличивается' }
  ],
  fiber: [
    { id: 'connectors', label: 'Кол-во разъёмов', type: 'range', min: 0, max: 12, default: 2, dbPenalty: 0.5, desc: 'Каждый разъём (SC, LC) вносит ~0.3-0.75 дБ потерь из-за несовпадения осей' },
    { id: 'splices', label: 'Кол-во сварок', type: 'range', min: 0, max: 30, default: 4, dbPenalty: 0.1, desc: 'Каждая сварка (fusion splice) вносит ~0.05-0.2 дБ потерь' },
    { id: 'bendRadius', label: 'Изгибов (< мин. радиуса)', type: 'range', min: 0, max: 10, default: 0, dbPenalty: 1.0, desc: 'Изгиб меньше минимального радиуса → свет выходит из ядра → потери до 1 дБ/изгиб' }
  ],
  radio: [
    { id: 'walls', label: 'Стены на пути', type: 'range', min: 0, max: 6, default: 0, dbPenalty: 6, desc: 'Каждая бетонная стена ~6 дБ, кирпичная ~4 дБ, гипсокартон ~3 дБ' },
    { id: 'people', label: 'Людей в зоне', type: 'range', min: 0, max: 100, default: 5, dbPenalty: 0.1, desc: 'Тело человека (70% воды) поглощает радиоволны — ~0.1 дБ на человека' },
    { id: 'interference', label: 'Источники помех', type: 'range', min: 0, max: 20, default: 2, dbPenalty: 1.0, desc: 'Соседние AP, микроволновки, Bluetooth, радиотелефоны — каждый ~1 дБ к шумовой полке' },
    { id: 'weather', label: 'Погода', type: 'select', options: ['Ясно', 'Облачно', 'Дождь', 'Гроза'], dbPenalties: [0, 1, 4, 10], desc: 'Дождь и влажность поглощают радиоволны (особенно > 10 ГГц)' }
  ],
  satellite: [
    { id: 'weather', label: 'Погода (rain fade)', type: 'select', options: ['Ясно', 'Облачно', 'Дождь', 'Ливень'], dbPenalties: [0, 2, 8, 20], desc: 'Rain fade — главный враг спутниковой связи, дождь поглощает Ku/Ka-диапазон' },
    { id: 'elevation', label: 'Угол возвышения (°)', type: 'range', min: 5, max: 90, default: 45, desc: 'Низкий угол → сигнал проходит дольше через атмосферу → больше затухание' },
    { id: 'solar', label: 'Солнечная интерференция', type: 'toggle', default: false, dbPenalty: 15, desc: 'Когда Солнце за спутником — мощные помехи, потери до 15 дБ (раз в сезон)' }
  ]
};

function getChannelEnvType(chId) {
  if (['cat5e','cat6','coax','dsl'].includes(chId)) return 'copper';
  if (['fiber_sm','fiber_mm'].includes(chId)) return 'fiber';
  if (chId === 'satellite') return 'satellite';
  return 'radio';
}

const ENCAPSULATION_HEADERS = [
  { layer: 7, label: 'Данные приложения', short: 'DATA', color: '#e74c3c' },
  { layer: 6, label: 'Кодирование', short: 'ENC', color: '#e67e22' },
  { layer: 5, label: 'Сеанс', short: 'SES', color: '#f1c40f' },
  { layer: 4, label: 'TCP/UDP заголовок', short: 'TCP', color: '#2ecc71' },
  { layer: 3, label: 'IP заголовок', short: 'IP', color: '#1abc9c' },
  { layer: 2, label: 'MAC заголовок + CRC', short: 'ETH', color: '#3498db' },
  { layer: 1, label: 'Биты → сигнал', short: '010', color: '#9b59b6' }
];
