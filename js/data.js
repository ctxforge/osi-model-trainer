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
  },
  netBuilder: {
    title: 'Конструктор сети',
    icon: '🔗',
    description: 'Постройте маршрут из реальных устройств и каналов связи, затем отправьте пакет',
    params: []
  }
};

const CHANNEL_TYPES = [
  { id: 'cat5e', name: 'Ethernet Cat5e', speed: 1000, latency: 0.01, medium: 'copper', maxDist: 100, icon: '🔌', color: '#3498db', desc: 'Витая пара Cat5e. Стандартный кабель для локальных сетей. До 1 Гбит/с.' },
  { id: 'cat6', name: 'Ethernet Cat6', speed: 10000, latency: 0.01, medium: 'copper', maxDist: 55, icon: '🔌', color: '#2980b9', desc: 'Витая пара Cat6. Поддерживает 10 Гбит/с на коротких дистанциях.' },
  { id: 'fiber_sm', name: 'Оптоволокно SM', speed: 100000, latency: 0.005, medium: 'fiber', maxDist: 80000, icon: '💡', color: '#e74c3c', desc: 'Одномодовое оптоволокно. Максимальная скорость и дальность. Используется магистральными провайдерами.' },
  { id: 'fiber_mm', name: 'Оптоволокно MM', speed: 10000, latency: 0.005, medium: 'fiber', maxDist: 550, icon: '💡', color: '#c0392b', desc: 'Многомодовое оптоволокно. Для дата-центров и зданий. Дешевле одномодового.' },
  { id: 'wifi24', name: 'Wi-Fi 2.4 GHz', speed: 150, latency: 3, medium: 'radio', maxDist: 70, icon: '📶', color: '#2ecc71', desc: 'Wi-Fi на 2.4 ГГц. Большая дальность, но низкая скорость и помехи от соседей.' },
  { id: 'wifi5', name: 'Wi-Fi 5 GHz', speed: 866, latency: 2, medium: 'radio', maxDist: 35, icon: '📶', color: '#27ae60', desc: 'Wi-Fi на 5 ГГц. Быстрее, меньше помех, но меньшая дальность и хуже проходит стены.' },
  { id: 'wifi6', name: 'Wi-Fi 6 (ax)', speed: 2400, latency: 1, medium: 'radio', maxDist: 30, icon: '📶', color: '#1abc9c', desc: 'Wi-Fi 6 (802.11ax). Высокая скорость, OFDMA, лучше работает в плотных сетях.' },
  { id: 'coax', name: 'Коаксиальный', speed: 1000, latency: 0.5, medium: 'copper', maxDist: 500, icon: '📺', color: '#e67e22', desc: 'Коаксиальный кабель. Используется в кабельном ТВ и DOCSIS-сетях.' },
  { id: 'dsl', name: 'DSL (телефон)', speed: 100, latency: 10, medium: 'copper', maxDist: 5500, icon: '📞', color: '#f39c12', desc: 'DSL — интернет по телефонной линии. Скорость зависит от расстояния до АТС.' },
  { id: 'lte', name: '4G LTE', speed: 100, latency: 30, medium: 'radio', maxDist: 10000, icon: '📱', color: '#9b59b6', desc: '4G LTE — мобильная связь. Хорошее покрытие, средняя скорость, заметная задержка.' },
  { id: '5g', name: '5G', speed: 1000, latency: 5, medium: 'radio', maxDist: 1000, icon: '📱', color: '#8e44ad', desc: '5G — новое поколение. Высокая скорость и низкая задержка, но малый радиус.' },
  { id: 'satellite', name: 'Спутник (GEO)', speed: 100, latency: 600, medium: 'radio', maxDist: 35786, icon: '🛰️', color: '#34495e', desc: 'Геостационарный спутник. Огромная задержка (600 мс RTT) из-за расстояния 36000 км.' }
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
  { name: '🏠 Домашняя сеть', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: 'wifi5' },
    { type: 'device', id: 'router' }, { type: 'link', id: 'cat5e' },
    { type: 'device', id: 'modem' }, { type: 'link', id: 'fiber_mm' },
    { type: 'device', id: 'router' }, { type: 'link', id: 'fiber_sm' },
    { type: 'device', id: 'server' }
  ]},
  { name: '🏢 Офисная LAN', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: 'cat6' },
    { type: 'device', id: 'switch' }, { type: 'link', id: 'cat6' },
    { type: 'device', id: 'firewall' }, { type: 'link', id: 'cat6' },
    { type: 'device', id: 'server' }
  ]},
  { name: '📱 Мобильный', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: '5g' },
    { type: 'device', id: 'router' }, { type: 'link', id: 'fiber_sm' },
    { type: 'device', id: 'router' }, { type: 'link', id: 'cat6' },
    { type: 'device', id: 'server' }
  ]},
  { name: '🛰️ Спутник', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: 'cat5e' },
    { type: 'device', id: 'modem' }, { type: 'link', id: 'satellite' },
    { type: 'device', id: 'modem' }, { type: 'link', id: 'cat5e' },
    { type: 'device', id: 'router' }, { type: 'link', id: 'fiber_sm' },
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

const ENCAPSULATION_HEADERS = [
  { layer: 7, label: 'Данные приложения', short: 'DATA', color: '#e74c3c' },
  { layer: 6, label: 'Кодирование', short: 'ENC', color: '#e67e22' },
  { layer: 5, label: 'Сеанс', short: 'SES', color: '#f1c40f' },
  { layer: 4, label: 'TCP/UDP заголовок', short: 'TCP', color: '#2ecc71' },
  { layer: 3, label: 'IP заголовок', short: 'IP', color: '#1abc9c' },
  { layer: 2, label: 'MAC заголовок + CRC', short: 'ETH', color: '#3498db' },
  { layer: 1, label: 'Биты → сигнал', short: '010', color: '#9b59b6' }
];
