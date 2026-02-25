export const LAB_GROUPS = [
  { id: 'overview', name: '🚀 Обзор', desc: 'Полный путь данных от отправителя до получателя',
    experiments: ['journey', 'scenario'] },
  { id: 'physical', name: '⚡ L1 Физика', desc: 'Сигналы, модуляция, каналы связи, мультиплексирование, осциллограф, передача через канал, профессиональные приборы',
    experiments: ['signals', 'channelPhysics', 'multiplexing', 'oscilloscope', 'signalGenerator', 'spectrumAnalyzer', 'channelTransmit', 'wdmMultiplex', 'proSignalGen', 'proSpectrumAnalyzer', 'signalChain'] },
  { id: 'network', name: '🌐 L2-L3 Сеть', desc: 'Устройства, маршрутизация, адресация, конструктор сети, DHCP, сетевые приборы',
    experiments: ['devices', 'netBuilder', 'topologyBuilder', 'routing', 'routingSim', 'fragmentation', 'ipCalc', 'vlanSim', 'arpDiscovery', 'dhcpLease', 'networkInstruments'] },
  { id: 'transport', name: '📦 L4 Транспорт', desc: 'TCP/UDP: соединения, передача, автомат, перегрузка, окно',
    experiments: ['tcpHandshake', 'tcpVsUdp', 'packetTransmission', 'tcpStateMachine', 'tcpCongestion', 'tcpWindow', 'natTraversal'] },
  { id: 'security', name: '🔐 L5-L7 Безопасность', desc: 'Шифрование, TLS, сертификаты, Firewall',
    experiments: ['encryption', 'tls', 'firewallSim'] }
];

export const LAB_EXPERIMENTS = {
  journey: {
    title: 'Путь сообщения',
    icon: '🚀',
    description: 'Полный анимированный путь данных от клавиатуры до экрана получателя через все 7 уровней OSI',
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
  tls: {
    title: 'TLS / Сертификаты',
    icon: '🔒',
    description: 'TLS-рукопожатие пошагово: ClientHello, сертификаты X.509, обмен ключами, шифрование канала',
    params: [
      { id: 'tlsVersion', label: 'Версия TLS', type: 'toggle', options: ['TLS 1.2', 'TLS 1.3'], default: 1 },
      { id: 'speed', label: 'Скорость анимации', type: 'range', min: 200, max: 1200, step: 100, default: 500, unit: 'мс' }
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
    description: 'IPv4/IPv6 калькулятор, VLSM-планировщик, суммаризация маршрутов',
    params: [
      { id: 'mode', label: 'Режим', type: 'toggle', options: ['IPv4', 'IPv6', 'VLSM', 'Суммаризация'], default: 0 },
      { id: 'ip', label: 'IPv4-адрес', type: 'ip', default: '192.168.1.100' },
      { id: 'cidr', label: 'Маска (CIDR)', type: 'range', min: 8, max: 30, step: 1, default: 24, unit: '' },
      { id: 'ipv6', label: 'IPv6-адрес', type: 'ip', default: '2001:db8::1' },
      { id: 'ipv6prefix', label: 'Префикс IPv6', type: 'range', min: 16, max: 128, step: 1, default: 64, unit: '' },
      { id: 'vlsmBase', label: 'Базовая сеть (VLSM)', type: 'ip', default: '192.168.1.0/24' },
      { id: 'vlsmSubnets', label: 'Хосты (через запятую)', type: 'ip', default: '50,30,10,5' },
      { id: 'summarizeNets', label: 'Подсети для суммаризации', type: 'ip', default: '192.168.1.0/24, 192.168.2.0/24, 192.168.3.0/24' }
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
  topologyBuilder: {
    title: 'Конструктор топологий',
    icon: '🗺️',
    description: 'Визуальный редактор сетевых топологий: размещайте устройства, создавайте связи, трассируйте пакеты',
    params: []
  },
  tcpStateMachine: {
    title: 'TCP Автомат',
    icon: '🔄',
    description: 'Конечный автомат TCP: 11 состояний, переходы между ними при отправке и получении сегментов',
    params: [
      { id: 'speed', label: 'Скорость анимации', type: 'range', min: 200, max: 1500, step: 100, default: 500, unit: 'мс' }
    ]
  },
  tcpCongestion: {
    title: 'Перегрузка TCP',
    icon: '📈',
    description: 'Контроль перегрузки: Slow Start, Congestion Avoidance, Fast Retransmit. Сравнение Tahoe, Reno, CUBIC',
    params: [
      { id: 'algorithm', label: 'Алгоритм', type: 'toggle', options: ['Tahoe', 'Reno', 'NewReno', 'CUBIC'], default: 1 },
      { id: 'mss', label: 'MSS (байт)', type: 'range', min: 536, max: 1460, step: 1, default: 1460, unit: 'Б' },
      { id: 'ssthresh', label: 'ssthresh (начальный)', type: 'range', min: 2, max: 64, step: 1, default: 16, unit: 'MSS' },
      { id: 'lossProb', label: 'Вероятность потерь', type: 'range', min: 1, max: 30, step: 1, default: 5, unit: '%' },
      { id: 'speed', label: 'Скорость (RTT)', type: 'range', min: 50, max: 500, step: 50, default: 200, unit: 'мс' }
    ]
  },
  vlanSim: {
    title: 'VLAN 802.1Q',
    icon: '🏷️',
    description: 'Создание VLAN, trunk-порты, 802.1Q тегирование, трассировка кадров, inter-VLAN routing',
    params: []
  },
  firewallSim: {
    title: 'Firewall',
    icon: '🛡️',
    description: 'Правила iptables, цепочки INPUT/OUTPUT/FORWARD, трассировка пакетов, NAT',
    params: []
  },
  encryption: {
    title: 'Шифрование',
    icon: '🔑',
    description: 'XOR, Шифр Цезаря, AES, RSA, DES, Diffie-Hellman, ECDH, HMAC, цифровая подпись',
    params: []
  },
  oscilloscope: {
    title: 'Осциллограф',
    icon: '📟',
    description: '2-канальный цифровой осциллограф: развёртка, курсоры, измерения, математика (FFT), триггер',
    params: []
  },
  routingSim: {
    title: 'Протоколы маршрутизации',
    icon: '🗺️',
    description: 'RIP, OSPF, BGP — пошаговая визуализация работы протоколов маршрутизации с конвергенцией',
    params: [
      { id: 'protocol', label: 'Протокол', type: 'toggle', options: ['RIP', 'OSPF', 'BGP'], default: 0 },
      { id: 'speed', label: 'Скорость', type: 'range', min: 200, max: 1000, step: 100, default: 500, unit: 'мс' }
    ]
  },
  tcpWindow: {
    title: 'Скользящее окно',
    icon: '🪟',
    description: 'Визуализация скользящего окна TCP: отправленные, подтверждённые, ожидающие и заблокированные байты',
    params: [
      { id: 'windowSize', label: 'Window Size', type: 'range', min: 1, max: 16, step: 1, default: 4, unit: ' сегм.' },
      { id: 'mss', label: 'MSS (байт)', type: 'range', min: 100, max: 1460, step: 100, default: 1000, unit: 'Б' },
      { id: 'packetLoss', label: 'Потеря пакетов', type: 'range', min: 0, max: 40, step: 5, default: 10, unit: '%' },
      { id: 'speed', label: 'Скорость анимации', type: 'range', min: 100, max: 1000, step: 50, default: 300, unit: 'мс' }
    ]
  },
  signalGenerator: {
    title: 'Генератор сигналов',
    icon: '🎛️',
    description: 'Создавайте сигналы произвольной формы, комбинируйте компоненты, применяйте модуляцию. Экспорт в CSV/WAV/JSON.',
    params: []
  },
  channelTransmit: {
    title: 'Передача через канал',
    icon: '📡',
    description: 'Отправьте сигнал или файл через смоделированный физический канал связи с затуханием, шумом и ограничением полосы',
    params: []
  },
  spectrumAnalyzer: {
    title: 'Анализатор спектра',
    icon: '📊',
    description: 'FFT-анализ сигнала: спектр мощности, waterfall-дисплей, усреднение, обнаружение пиков с дельта-маркерами',
    params: []
  },
  wdmMultiplex: {
    title: 'WDM мультиплексирование',
    icon: '🌈',
    description: 'Wavelength Division Multiplexing: передача нескольких сигналов по одному оптоволокну на разных длинах волн',
    params: []
  },
  arpDiscovery: {
    title: 'ARP Discovery',
    icon: '🔍',
    description: 'Визуализация ARP-запросов и ответов: как устройства узнают MAC-адреса друг друга в локальной сети',
    params: [
      { id: 'speed', label: 'Скорость анимации', type: 'range', min: 200, max: 1500, step: 100, default: 500, unit: 'мс' }
    ]
  },
  natTraversal: {
    title: 'NAT / PAT',
    icon: '🔀',
    description: 'Network Address Translation: как внутренние IP-адреса транслируются во внешние. SNAT, DNAT, PAT (маскарадинг)',
    params: [
      { id: 'natType', label: 'Тип NAT', type: 'toggle', options: ['Static NAT', 'Dynamic NAT', 'PAT'], default: 2 },
      { id: 'speed', label: 'Скорость', type: 'range', min: 200, max: 1000, step: 100, default: 400, unit: 'мс' }
    ]
  },
  dhcpLease: {
    title: 'DHCP DORA',
    icon: '📋',
    description: 'Полный процесс получения IP-адреса: Discover → Offer → Request → Ack. Аренда (lease), обновление, освобождение',
    params: [
      { id: 'speed', label: 'Скорость анимации', type: 'range', min: 200, max: 1500, step: 100, default: 600, unit: 'мс' }
    ]
  },
  proSignalGen: {
    title: 'Генератор (PRO)',
    icon: '🎛️',
    description: 'Профессиональный генератор сигналов: 8 форм, модуляция AM/FM/PM/PWM, sweep, burst, dual channel, арбитрарный режим. Стиль Keysight 33600A.',
    params: []
  },
  proSpectrumAnalyzer: {
    title: 'Спектроанализатор (PRO)',
    icon: '📊',
    description: 'Профессиональный анализатор спектра: FFT до 16384, 7 оконных функций, waterfall/spectrogram, 4 маркера, peak search, BW measurement. Стиль R&S FSW.',
    params: []
  },
  signalChain: {
    title: 'Цепочка передачи',
    icon: '🔗',
    description: 'Прозрачная визуализация всей цепочки: Данные → Кодирование → Модуляция → Канал → Демодуляция → Декодирование → Данные. Диагностика ошибок с рекомендациями.',
    params: []
  },
  networkInstruments: {
    title: 'Сетевые приборы',
    icon: '🔧',
    description: 'Набор профессиональных сетевых инструментов: Protocol Analyzer (Wireshark), Cable Tester/TDR, Network Monitor, Signal Meter, BER Tester.',
    params: []
  }
};
