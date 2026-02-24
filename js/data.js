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
    encapsulation: 'Приложение формирует данные для передачи по сети',
    analogy: 'Вы пишете письмо на понятном языке — это содержимое, которое вы хотите отправить',
    tcpip: 'Прикладной'
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
    encapsulation: 'Данные кодируются, шифруются или сжимаются',
    analogy: 'Вы переводите письмо на язык получателя и запечатываете в конверт с печатью',
    tcpip: 'Прикладной'
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
    encapsulation: 'Добавляется информация о сеансе связи',
    analogy: 'Вы звоните по телефону и договариваетесь о времени и формате разговора',
    tcpip: 'Прикладной'
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
    encapsulation: 'Данные разбиваются на сегменты, добавляются порты источника и назначения',
    analogy: 'Вы нумеруете страницы книги и отправляете их по отдельности, чтобы получатель мог собрать книгу в правильном порядке',
    tcpip: 'Транспортный'
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
    encapsulation: 'К сегменту добавляется IP-заголовок с адресами источника и назначения',
    analogy: 'На конверте вы пишете адрес отправителя и получателя — город, улицу, дом',
    tcpip: 'Сетевой'
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
    encapsulation: 'К пакету добавляются MAC-заголовок и контрольная сумма (trailer)',
    analogy: 'Почтальон доставляет конверт от одного почтового отделения до соседнего',
    tcpip: 'Канальный'
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
    encapsulation: 'Кадр преобразуется в последовательность электрических/оптических/радиосигналов',
    analogy: 'Физическая дорога, по которой едет почтовый грузовик — провода, оптоволокно, радиоволны',
    tcpip: 'Канальный'
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

const LAB_EXPERIMENTS = {
  packetTransmission: {
    title: 'Передача пакетов',
    icon: '📡',
    description: 'Исследуйте, как параметры сети влияют на передачу данных',
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
  }
};

const ENCAPSULATION_HEADERS = [
  { layer: 7, label: 'Данные приложения', short: 'DATA', color: '#e74c3c' },
  { layer: 6, label: 'Кодирование', short: 'ENC', color: '#e67e22' },
  { layer: 5, label: 'Сеанс', short: 'SES', color: '#f1c40f' },
  { layer: 4, label: 'TCP/UDP заголовок', short: 'TCP', color: '#2ecc71' },
  { layer: 3, label: 'IP заголовок', short: 'IP', color: '#1abc9c' },
  { layer: 2, label: 'MAC заголовок + CRC', short: 'ETH', color: '#3498db' },
  { layer: 1, label: 'Биты → сигнал', short: '010', color: '#9b59b6' }
];
