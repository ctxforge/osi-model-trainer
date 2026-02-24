export const LAB_GROUPS = [
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
