export const DRAG_DROP_ITEMS = [
  // L7 — Application
  { name: 'HTTP', layer: 7, type: 'protocol' },
  { name: 'HTTP/2', layer: 7, type: 'protocol' },
  { name: 'HTTP/3', layer: 7, type: 'protocol' },
  { name: 'FTP', layer: 7, type: 'protocol' },
  { name: 'DNS', layer: 7, type: 'protocol' },
  { name: 'SMTP', layer: 7, type: 'protocol' },
  { name: 'DHCP', layer: 7, type: 'protocol' },
  { name: 'SSH', layer: 7, type: 'protocol' },
  { name: 'SNMP', layer: 7, type: 'protocol' },
  { name: 'NTP', layer: 7, type: 'protocol' },
  { name: 'LDAP', layer: 7, type: 'protocol' },
  { name: 'Kerberos', layer: 7, type: 'protocol' },
  { name: 'RADIUS', layer: 7, type: 'protocol' },
  { name: 'SIP', layer: 7, type: 'protocol' },
  { name: 'RTP', layer: 7, type: 'protocol' },
  { name: 'MQTT', layer: 7, type: 'protocol' },
  { name: 'CoAP', layer: 7, type: 'protocol' },
  { name: 'gRPC', layer: 7, type: 'protocol' },
  { name: 'WebSocket', layer: 7, type: 'protocol' },
  { name: 'TELNET', layer: 7, type: 'protocol' },
  { name: 'POP3', layer: 7, type: 'protocol' },
  { name: 'IMAP', layer: 7, type: 'protocol' },
  { name: 'TFTP', layer: 7, type: 'protocol' },

  // L6 — Presentation
  { name: 'SSL/TLS', layer: 6, type: 'protocol' },
  { name: 'JPEG', layer: 6, type: 'standard' },
  { name: 'MPEG', layer: 6, type: 'standard' },
  { name: 'ASCII', layer: 6, type: 'standard' },
  { name: 'GIF', layer: 6, type: 'standard' },
  { name: 'PNG', layer: 6, type: 'standard' },

  // L5 — Session
  { name: 'NetBIOS', layer: 5, type: 'protocol' },
  { name: 'RPC', layer: 5, type: 'protocol' },
  { name: 'SOCKS', layer: 5, type: 'protocol' },
  { name: 'PPTP', layer: 5, type: 'protocol' },
  { name: 'L2TP', layer: 5, type: 'protocol' },

  // L4 — Transport
  { name: 'TCP', layer: 4, type: 'protocol' },
  { name: 'UDP', layer: 4, type: 'protocol' },
  { name: 'SCTP', layer: 4, type: 'protocol' },
  { name: 'QUIC', layer: 4, type: 'protocol' },
  { name: 'DCCP', layer: 4, type: 'protocol' },
  { name: 'Балансировщик нагрузки', layer: 4, type: 'device' },
  { name: 'Файрвол L4', layer: 4, type: 'device' },

  // L3 — Network
  { name: 'IP', layer: 3, type: 'protocol' },
  { name: 'IPv6', layer: 3, type: 'protocol' },
  { name: 'ICMP', layer: 3, type: 'protocol' },
  { name: 'OSPF', layer: 3, type: 'protocol' },
  { name: 'BGP', layer: 3, type: 'protocol' },
  { name: 'RIP', layer: 3, type: 'protocol' },
  { name: 'EIGRP', layer: 3, type: 'protocol' },
  { name: 'IPsec', layer: 3, type: 'protocol' },
  { name: 'GRE', layer: 3, type: 'protocol' },
  { name: 'MPLS', layer: 3, type: 'protocol' },
  { name: 'ARP', layer: 3, type: 'protocol' },
  { name: 'VXLAN', layer: 3, type: 'protocol' },
  { name: 'Маршрутизатор', layer: 3, type: 'device' },
  { name: 'L3-коммутатор', layer: 3, type: 'device' },
  { name: 'Файрвол L3', layer: 3, type: 'device' },

  // L2 — Data Link
  { name: 'Ethernet', layer: 2, type: 'protocol' },
  { name: 'Wi-Fi (802.11)', layer: 2, type: 'protocol' },
  { name: 'PPP', layer: 2, type: 'protocol' },
  { name: 'HDLC', layer: 2, type: 'protocol' },
  { name: 'STP', layer: 2, type: 'protocol' },
  { name: '802.1Q (VLAN)', layer: 2, type: 'protocol' },
  { name: 'Frame Relay', layer: 2, type: 'protocol' },
  { name: 'LLDP', layer: 2, type: 'protocol' },
  { name: 'Коммутатор', layer: 2, type: 'device' },
  { name: 'Мост', layer: 2, type: 'device' },
  { name: 'Точка доступа', layer: 2, type: 'device' },

  // L1 — Physical
  { name: 'Хаб', layer: 1, type: 'device' },
  { name: 'Репитер', layer: 1, type: 'device' },
  { name: 'Модем', layer: 1, type: 'device' },
  { name: 'Медиаконвертер', layer: 1, type: 'device' },
  { name: 'USB', layer: 1, type: 'standard' },
  { name: 'Bluetooth', layer: 1, type: 'standard' },
  { name: 'RS-232', layer: 1, type: 'standard' },
  { name: 'DSL', layer: 1, type: 'standard' },
  { name: '100BASE-TX', layer: 1, type: 'standard' },
  { name: '1000BASE-T', layer: 1, type: 'standard' },
  { name: '10GBASE-SR', layer: 1, type: 'standard' }
];

export const DND_PORTS = [
  { port: 20, service: 'FTP-Data', hint: 'Передача файлов (данные)' },
  { port: 21, service: 'FTP', hint: 'Передача файлов (управление)' },
  { port: 22, service: 'SSH', hint: 'Безопасный удалённый доступ' },
  { port: 23, service: 'Telnet', hint: 'Удалённый терминал (небезопасный)' },
  { port: 25, service: 'SMTP', hint: 'Отправка электронной почты' },
  { port: 53, service: 'DNS', hint: 'Разрешение доменных имён' },
  { port: 67, service: 'DHCP Server', hint: 'Выдача IP-адресов' },
  { port: 68, service: 'DHCP Client', hint: 'Получение IP-адреса' },
  { port: 69, service: 'TFTP', hint: 'Простая передача файлов' },
  { port: 80, service: 'HTTP', hint: 'Веб-сервер' },
  { port: 110, service: 'POP3', hint: 'Получение почты' },
  { port: 123, service: 'NTP', hint: 'Синхронизация времени' },
  { port: 143, service: 'IMAP', hint: 'Доступ к почтовому ящику' },
  { port: 161, service: 'SNMP', hint: 'Управление сетевыми устройствами' },
  { port: 179, service: 'BGP', hint: 'Междоменная маршрутизация' },
  { port: 389, service: 'LDAP', hint: 'Каталог пользователей' },
  { port: 443, service: 'HTTPS', hint: 'Безопасный веб-сервер' },
  { port: 445, service: 'SMB', hint: 'Общий доступ к файлам Windows' },
  { port: 514, service: 'Syslog', hint: 'Системный журнал' },
  { port: 587, service: 'SMTP (submission)', hint: 'Отправка почты (с аутентификацией)' },
  { port: 993, service: 'IMAPS', hint: 'IMAP через SSL' },
  { port: 995, service: 'POP3S', hint: 'POP3 через SSL' },
  { port: 1433, service: 'MS SQL', hint: 'База данных Microsoft SQL' },
  { port: 1812, service: 'RADIUS', hint: 'Аутентификация RADIUS' },
  { port: 1883, service: 'MQTT', hint: 'IoT-протокол обмена сообщениями' },
  { port: 3306, service: 'MySQL', hint: 'База данных MySQL' },
  { port: 3389, service: 'RDP', hint: 'Удалённый рабочий стол Windows' },
  { port: 5060, service: 'SIP', hint: 'VoIP сигнализация' },
  { port: 5432, service: 'PostgreSQL', hint: 'База данных PostgreSQL' },
  { port: 5672, service: 'AMQP', hint: 'Очередь сообщений (RabbitMQ)' },
  { port: 6379, service: 'Redis', hint: 'Кэш и хранилище данных' },
  { port: 8080, service: 'HTTP Alt', hint: 'Альтернативный веб-порт' },
  { port: 8443, service: 'HTTPS Alt', hint: 'Альтернативный HTTPS' },
  { port: 27017, service: 'MongoDB', hint: 'Документная NoSQL БД' }
];

export const DND_HEADERS = [
  { protocol: 'TCP', fields: ['Source Port', 'Dest Port', 'Sequence Number', 'Ack Number', 'Data Offset', 'Flags', 'Window Size', 'Checksum', 'Urgent Pointer'] },
  { protocol: 'UDP', fields: ['Source Port', 'Dest Port', 'Length', 'Checksum'] },
  { protocol: 'IPv4', fields: ['Version', 'IHL', 'DSCP/ECN', 'Total Length', 'Identification', 'Flags', 'Fragment Offset', 'TTL', 'Protocol', 'Header Checksum', 'Source IP', 'Destination IP'] },
  { protocol: 'Ethernet', fields: ['Preamble', 'SFD', 'Dest MAC', 'Source MAC', 'EtherType', 'Payload', 'FCS'] },
  { protocol: 'IPv6', fields: ['Version', 'Traffic Class', 'Flow Label', 'Payload Length', 'Next Header', 'Hop Limit', 'Source Address', 'Destination Address'] }
];

export const DND_ENCAP_STACKS = [
  { name: 'Веб-запрос', stack: ['HTTP', 'TCP', 'IPv4', 'Ethernet'] },
  { name: 'DNS-запрос', stack: ['DNS', 'UDP', 'IPv4', 'Ethernet'] },
  { name: 'Email (SMTP)', stack: ['SMTP', 'TCP', 'IPv4', 'Ethernet'] },
  { name: 'VoIP звонок', stack: ['RTP', 'UDP', 'IPv4', 'Ethernet'] },
  { name: 'HTTPS (TLS)', stack: ['HTTP', 'TLS', 'TCP', 'IPv4', 'Ethernet'] }
];

export const DND_MODES = [
  { id: 'classic', label: 'Классический', desc: 'Перетащите протоколы на уровни OSI', icon: '🎯' },
  { id: 'reverse', label: 'Обратный', desc: 'Определите уровень для показанного протокола', icon: '🔄' },
  { id: 'ports', label: 'Порты', desc: 'Сопоставьте номера портов с сервисами', icon: '🔌' },
  { id: 'headers', label: 'Заголовки', desc: 'Расставьте поля заголовка в правильном порядке', icon: '📋' },
  { id: 'encap', label: 'Инкапсуляция', desc: 'Соберите стек протоколов сверху вниз', icon: '📚' },
  { id: 'devices', label: 'Устройства', desc: 'Распределите устройства по уровням OSI', icon: '⚙️' },
  { id: 'topology', label: 'Топология', desc: 'Выберите правильный порядок подключения', icon: '🗺️' }
];
