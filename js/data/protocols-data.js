/* ==================== PROTOCOL REFERENCE DATA ==================== */
/* 50+ protocols structured for reference + theory integration */

export const PROTOCOL_CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'L7', label: 'L7 Прикладной' },
  { id: 'L6', label: 'L6 Представления' },
  { id: 'L5', label: 'L5 Сеансовый' },
  { id: 'L4', label: 'L4 Транспортный' },
  { id: 'L3', label: 'L3 Сетевой' },
  { id: 'L2', label: 'L2 Канальный' },
  { id: 'L1', label: 'L1 Физический' }
];

export const PROTOCOLS = [
  // ═══════════════════════════════════════════
  // L7 — ПРИКЛАДНОЙ УРОВЕНЬ
  // ═══════════════════════════════════════════
  {
    id: 'http',
    name: 'HTTP',
    fullName: 'HyperText Transfer Protocol',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '9110',
    ports: [80],
    icon: '🌐',
    theoryTopic: 'application-protocols',
    related: ['https', 'tcp', 'dns', 'quic'],
    desc: 'Протокол передачи гипертекста — основа World Wide Web. Клиент-серверная модель: запрос → ответ.',
    details: 'Методы: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS. Коды ответа: 1xx информационные, 2xx успех, 3xx перенаправление, 4xx ошибка клиента, 5xx ошибка сервера. HTTP/1.1 — текстовый, keep-alive. HTTP/2 — бинарный, мультиплексирование. HTTP/3 — поверх QUIC/UDP.',
    features: [
      'Текстовый протокол (HTTP/1.1) / бинарный (HTTP/2+)',
      'Stateless — каждый запрос независим',
      'Keep-alive — переиспользование TCP-соединения',
      'Мультиплексирование потоков (HTTP/2)',
      'Server Push (HTTP/2)'
    ],
    useCases: ['Веб-сайты и API', 'REST/GraphQL сервисы', 'Загрузка файлов', 'Стриминг (chunked transfer)'],
    header: [
      { name: 'Method', bits: 'var', desc: 'GET, POST, PUT, DELETE...' },
      { name: 'URI', bits: 'var', desc: 'Запрашиваемый ресурс' },
      { name: 'Version', bits: 'var', desc: 'HTTP/1.1, HTTP/2, HTTP/3' },
      { name: 'Headers', bits: 'var', desc: 'Host, Content-Type, Authorization...' },
      { name: 'Body', bits: 'var', desc: 'Тело запроса (опционально)' }
    ],
    interactive: [
      { field: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'], default: 'GET' },
      { field: 'URI', type: 'text', default: '/index.html' },
      { field: 'Version', type: 'select', options: ['HTTP/1.0', 'HTTP/1.1', 'HTTP/2'], default: 'HTTP/1.1' },
      { field: 'Host', type: 'text', default: 'example.com' }
    ]
  },
  {
    id: 'https',
    name: 'HTTPS',
    fullName: 'HTTP Secure (HTTP over TLS)',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '2818',
    ports: [443],
    icon: '🔒',
    theoryTopic: 'security',
    related: ['http', 'tls', 'tcp'],
    desc: 'HTTP поверх TLS — зашифрованная передача веб-данных. Стандарт для всех современных сайтов.',
    details: 'Использует TLS (ранее SSL) для шифрования HTTP-трафика. Обеспечивает конфиденциальность, целостность и аутентификацию сервера через X.509 сертификаты. HSTS — механизм принудительного HTTPS.',
    header: [
      { name: 'TLS Record', bits: 'var', desc: 'Обёртка TLS поверх HTTP' },
      { name: 'HTTP Payload', bits: 'var', desc: 'Зашифрованный HTTP запрос/ответ' }
    ]
  },
  {
    id: 'dns',
    name: 'DNS',
    fullName: 'Domain Name System',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '1035',
    ports: [53],
    icon: '📋',
    theoryTopic: 'application-protocols',
    related: ['udp', 'tcp', 'dhcp'],
    desc: 'Система доменных имён — преобразует имена (google.com) в IP-адреса.',
    details: 'Иерархия: корневые серверы → TLD (.com, .ru) → авторитативные серверы. Типы записей: A (IPv4), AAAA (IPv6), MX (почта), CNAME (алиас), NS (DNS-сервер), TXT, SOA, PTR. Рекурсивный и итеративный запросы. DNSSEC для защиты.',
    features: [
      'Иерархическая распределённая система',
      'Кэширование на каждом уровне (TTL)',
      'Рекурсивный и итеративный режимы запросов',
      'DNSSEC — цифровая подпись ответов'
    ],
    useCases: ['Разрешение доменных имён', 'Балансировка нагрузки (Round-Robin DNS)', 'Email routing (MX-записи)', 'Service discovery (SRV-записи)'],
    header: [
      { name: 'Transaction ID', bits: 16, desc: 'Идентификатор запроса' },
      { name: 'Flags', bits: 16, desc: 'QR, Opcode, AA, TC, RD, RA, Z, RCODE' },
      { name: 'Questions', bits: 16, desc: 'Количество вопросов' },
      { name: 'Answer RRs', bits: 16, desc: 'Количество ответов' },
      { name: 'Authority RRs', bits: 16, desc: 'NS записи' },
      { name: 'Additional RRs', bits: 16, desc: 'Дополнительные записи' },
      { name: 'Query/Response', bits: 'var', desc: 'Тело запроса/ответа' }
    ],
    interactive: [
      { field: 'Transaction ID', type: 'number', default: 0x1234, min: 0, max: 65535 },
      { field: 'QR', type: 'select', options: ['0 (Query)', '1 (Response)'], default: '0 (Query)' },
      { field: 'RD', type: 'select', options: ['0 (нет)', '1 (рекурсия)'], default: '1 (рекурсия)' },
      { field: 'Domain', type: 'text', default: 'example.com' },
      { field: 'Type', type: 'select', options: ['A', 'AAAA', 'MX', 'CNAME', 'NS', 'TXT'], default: 'A' }
    ]
  },
  {
    id: 'ftp',
    name: 'FTP',
    fullName: 'File Transfer Protocol',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '959',
    ports: [20, 21],
    icon: '📁',
    theoryTopic: 'application-protocols',
    related: ['tcp', 'sftp', 'ssh'],
    desc: 'Протокол передачи файлов. Порт 21 — управление, порт 20 — данные.',
    details: 'Два режима: активный (сервер инициирует соединение данных) и пассивный (клиент инициирует). Команды: USER, PASS, LIST, RETR, STOR, CWD, PWD, QUIT. Передаёт пароли в открытом виде — заменяется на SFTP/SCP.',
    header: [
      { name: 'Command', bits: 'var', desc: 'USER, PASS, RETR, STOR...' },
      { name: 'Arguments', bits: 'var', desc: 'Параметры команды' },
      { name: 'CRLF', bits: 16, desc: 'Завершение строки' }
    ]
  },
  {
    id: 'sftp',
    name: 'SFTP',
    fullName: 'SSH File Transfer Protocol',
    osi: 'L7',
    tcpip: 'Application',
    rfc: 'Draft',
    ports: [22],
    icon: '🔐',
    theoryTopic: 'security',
    related: ['ssh', 'ftp', 'scp'],
    desc: 'Безопасная передача файлов через SSH-туннель. Замена FTP.',
    details: 'Работает поверх SSH, шифрует все данные и команды. Поддерживает операции с файлами: чтение, запись, удаление, переименование, создание каталогов. Не путать с FTPS (FTP over TLS).',
    header: [
      { name: 'SSH Packet', bits: 'var', desc: 'Обёртка SSH' },
      { name: 'SFTP Subsystem', bits: 'var', desc: 'Команда SFTP внутри SSH' }
    ]
  },
  {
    id: 'smtp',
    name: 'SMTP',
    fullName: 'Simple Mail Transfer Protocol',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '5321',
    ports: [25, 587],
    icon: '📧',
    theoryTopic: 'application-protocols',
    related: ['pop3', 'imap', 'tcp', 'tls'],
    desc: 'Протокол отправки электронной почты. Порт 25 — между серверами, 587 — клиент → сервер.',
    details: 'Команды: HELO/EHLO, MAIL FROM, RCPT TO, DATA, QUIT. Поддерживает STARTTLS для шифрования. Современный SMTP использует аутентификацию (SMTP AUTH) и SPF/DKIM/DMARC для защиты от спама.',
    header: [
      { name: 'Command', bits: 'var', desc: 'HELO, MAIL FROM, RCPT TO, DATA' },
      { name: 'Parameters', bits: 'var', desc: 'Адреса, опции' },
      { name: 'Message Body', bits: 'var', desc: 'Текст письма (после DATA)' }
    ]
  },
  {
    id: 'pop3',
    name: 'POP3',
    fullName: 'Post Office Protocol v3',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '1939',
    ports: [110, 995],
    icon: '📬',
    theoryTopic: 'application-protocols',
    related: ['smtp', 'imap', 'tls'],
    desc: 'Получение почты с сервера. Скачивает и (обычно) удаляет с сервера.',
    details: 'Простой протокол: подключение → аутентификация → скачивание → удаление. Порт 995 — POP3 over TLS. Команды: USER, PASS, LIST, RETR, DELE, QUIT. Не поддерживает папки и синхронизацию.',
    header: [
      { name: 'Command', bits: 'var', desc: 'USER, PASS, LIST, RETR, DELE' },
      { name: 'Response', bits: 'var', desc: '+OK или -ERR' }
    ]
  },
  {
    id: 'imap',
    name: 'IMAP',
    fullName: 'Internet Message Access Protocol',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '9051',
    ports: [143, 993],
    icon: '📨',
    theoryTopic: 'application-protocols',
    related: ['smtp', 'pop3', 'tls'],
    desc: 'Управление почтой на сервере. Поддерживает папки, поиск, синхронизацию.',
    details: 'В отличие от POP3, письма хранятся на сервере. Поддержка папок, флагов (прочитано, важное), поиск на сервере, частичная загрузка. Порт 993 — IMAP over TLS. Используется в Gmail, Outlook и др.',
    header: [
      { name: 'Tag', bits: 'var', desc: 'Идентификатор команды' },
      { name: 'Command', bits: 'var', desc: 'SELECT, FETCH, SEARCH, STORE' },
      { name: 'Arguments', bits: 'var', desc: 'Параметры' }
    ]
  },
  {
    id: 'ssh',
    name: 'SSH',
    fullName: 'Secure Shell',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '4253',
    ports: [22],
    icon: '🖥️',
    theoryTopic: 'security',
    related: ['sftp', 'scp', 'tls'],
    desc: 'Защищённый удалённый доступ к командной строке. Замена Telnet.',
    details: 'Шифрование всего трафика (AES, ChaCha20). Аутентификация: пароль или ключи (RSA, Ed25519). Поддержка туннелирования (port forwarding), X11 forwarding, SOCKS proxy. Подпротоколы: SFTP, SCP.',
    header: [
      { name: 'Packet Length', bits: 32, desc: 'Длина пакета' },
      { name: 'Padding Length', bits: 8, desc: 'Длина дополнения' },
      { name: 'Payload', bits: 'var', desc: 'Данные (зашифрованы)' },
      { name: 'Padding', bits: 'var', desc: 'Дополнение до размера блока' },
      { name: 'MAC', bits: 'var', desc: 'Код аутентификации' }
    ]
  },
  {
    id: 'telnet',
    name: 'Telnet',
    fullName: 'Teletype Network',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '854',
    ports: [23],
    icon: '📟',
    theoryTopic: 'application-protocols',
    related: ['ssh'],
    desc: 'Удалённый доступ к CLI. Передаёт данные в открытом виде — устарел, заменён SSH.',
    details: 'Один из старейших интернет-протоколов (1969). Виртуальный терминал NVT. Всё передаётся plaintext, включая пароли. Используется только для отладки и настройки старого оборудования.',
    header: [
      { name: 'IAC', bits: 8, desc: '0xFF — Interpret As Command' },
      { name: 'Command', bits: 8, desc: 'WILL, WONT, DO, DONT' },
      { name: 'Option', bits: 8, desc: 'Код опции' }
    ]
  },
  {
    id: 'snmp',
    name: 'SNMP',
    fullName: 'Simple Network Management Protocol',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '3416',
    ports: [161, 162],
    icon: '📊',
    theoryTopic: 'network-management',
    related: ['udp'],
    desc: 'Управление сетевыми устройствами. Agent на устройстве, Manager собирает данные.',
    details: 'Операции: GET, SET, GETNEXT, GETBULK, TRAP. MIB (Management Information Base) — дерево переменных устройства. SNMPv3 — с аутентификацией и шифрованием. Порт 161 — запросы, 162 — уведомления (traps).',
    header: [
      { name: 'Version', bits: 'var', desc: 'v1, v2c, v3' },
      { name: 'Community/Auth', bits: 'var', desc: 'Строка сообщества или учётные данные' },
      { name: 'PDU Type', bits: 'var', desc: 'GetRequest, SetRequest, Trap...' },
      { name: 'Request ID', bits: 32, desc: 'Идентификатор запроса' },
      { name: 'Variable Bindings', bits: 'var', desc: 'OID → значение' }
    ]
  },
  {
    id: 'dhcp',
    name: 'DHCP',
    fullName: 'Dynamic Host Configuration Protocol',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '2131',
    ports: [67, 68],
    icon: '🏷️',
    theoryTopic: 'internetworking',
    related: ['udp', 'ip', 'arp'],
    desc: 'Автоматическое назначение IP-адресов. Процесс DORA: Discover → Offer → Request → Ack.',
    details: 'Клиент (порт 68) отправляет широковещательный Discover. Сервер (порт 67) предлагает Offer с IP, маской, шлюзом, DNS. Клиент подтверждает Request, сервер финализирует Ack. Аренда IP — lease time.',
    header: [
      { name: 'Op', bits: 8, desc: 'Request(1) / Reply(2)' },
      { name: 'HType', bits: 8, desc: 'Тип оборудования (1=Ethernet)' },
      { name: 'HLen', bits: 8, desc: 'Длина MAC-адреса (6)' },
      { name: 'Hops', bits: 8, desc: 'Количество relay-агентов' },
      { name: 'Transaction ID', bits: 32, desc: 'Случайный идентификатор' },
      { name: 'Seconds', bits: 16, desc: 'Секунды с начала процесса' },
      { name: 'Flags', bits: 16, desc: 'Broadcast flag' },
      { name: 'Client IP', bits: 32, desc: 'IP клиента (если известен)' },
      { name: 'Your IP', bits: 32, desc: 'Предлагаемый IP' },
      { name: 'Server IP', bits: 32, desc: 'IP DHCP-сервера' },
      { name: 'Gateway IP', bits: 32, desc: 'IP relay-агента' },
      { name: 'Client MAC', bits: 128, desc: 'MAC-адрес клиента' },
      { name: 'Options', bits: 'var', desc: 'Маска, шлюз, DNS, lease time...' }
    ]
  },
  {
    id: 'ntp',
    name: 'NTP',
    fullName: 'Network Time Protocol',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '5905',
    ports: [123],
    icon: '🕐',
    theoryTopic: 'application-protocols',
    related: ['udp'],
    desc: 'Синхронизация времени по сети. Точность до миллисекунд через Интернет.',
    details: 'Иерархия Stratum: 0 — атомные часы, 1 — серверы с прямым доступом, 2+ — вторичные. Алгоритм учитывает задержки сети. Используется для логов, сертификатов, кластеров.',
    header: [
      { name: 'LI+VN+Mode', bits: 8, desc: 'Leap Indicator, Version, Mode' },
      { name: 'Stratum', bits: 8, desc: 'Уровень источника (0-15)' },
      { name: 'Poll', bits: 8, desc: 'Интервал опроса' },
      { name: 'Precision', bits: 8, desc: 'Точность часов' },
      { name: 'Root Delay', bits: 32, desc: 'Задержка до Stratum 0' },
      { name: 'Root Dispersion', bits: 32, desc: 'Разброс' },
      { name: 'Reference ID', bits: 32, desc: 'ID источника' },
      { name: 'Timestamps', bits: 256, desc: '4 временных метки по 64 бит' }
    ]
  },
  {
    id: 'syslog',
    name: 'Syslog',
    fullName: 'System Logging Protocol',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '5424',
    ports: [514],
    icon: '📝',
    theoryTopic: 'network-management',
    related: ['udp', 'tcp', 'tls'],
    desc: 'Централизованный сбор логов с сетевых устройств и серверов.',
    details: 'Severity levels: 0 Emergency — 7 Debug. Facilities: kern, user, mail, daemon, auth и др. Формат: <priority>timestamp hostname app-name msg. Rsyslog, syslog-ng — популярные реализации.',
    header: [
      { name: 'Priority', bits: 'var', desc: '<facility*8 + severity>' },
      { name: 'Version', bits: 'var', desc: 'Версия протокола' },
      { name: 'Timestamp', bits: 'var', desc: 'ISO 8601' },
      { name: 'Hostname', bits: 'var', desc: 'Имя устройства' },
      { name: 'App-Name', bits: 'var', desc: 'Название приложения' },
      { name: 'ProcID', bits: 'var', desc: 'ID процесса' },
      { name: 'MsgID', bits: 'var', desc: 'Тип сообщения' },
      { name: 'Message', bits: 'var', desc: 'Текст лога' }
    ]
  },
  {
    id: 'quic',
    name: 'QUIC',
    fullName: 'Quick UDP Internet Connections',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '9000',
    ports: [443],
    icon: '⚡',
    theoryTopic: 'udp',
    related: ['udp', 'http', 'tls'],
    desc: 'Транспортный протокол Google поверх UDP. Основа HTTP/3.',
    details: 'Встроенное шифрование (TLS 1.3), мультиплексирование потоков без head-of-line blocking, быстрое установление соединения (0-RTT). Миграция соединений при смене IP (мобильные сети). Заменяет TCP+TLS для HTTP/3.',
    header: [
      { name: 'Header Form', bits: 1, desc: 'Long(1) / Short(0)' },
      { name: 'Fixed Bit', bits: 1, desc: 'Всегда 1' },
      { name: 'Type', bits: 2, desc: 'Initial, Handshake, 0-RTT, Retry' },
      { name: 'Version', bits: 32, desc: 'Версия QUIC' },
      { name: 'Connection ID', bits: 'var', desc: 'Идентификатор соединения' },
      { name: 'Packet Number', bits: 'var', desc: 'Номер пакета (шифруется)' },
      { name: 'Payload', bits: 'var', desc: 'Зашифрованные фреймы' }
    ]
  },

  // ═══════════════════════════════════════════
  // L6 — УРОВЕНЬ ПРЕДСТАВЛЕНИЯ
  // ═══════════════════════════════════════════
  {
    id: 'tls',
    name: 'TLS',
    fullName: 'Transport Layer Security',
    osi: 'L6',
    tcpip: 'Application',
    rfc: '8446',
    ports: [443],
    icon: '🔑',
    theoryTopic: 'security',
    related: ['https', 'tcp', 'ssh'],
    desc: 'Криптографический протокол, обеспечивающий шифрование, целостность и аутентификацию.',
    details: 'TLS 1.3: 1-RTT handshake (vs 2-RTT в 1.2), только AEAD шифры (AES-GCM, ChaCha20-Poly1305), PFS обязателен (ECDHE). Handshake: ClientHello → ServerHello + Certificate + Finished → клиент Finished. Убраны RSA key exchange, RC4, SHA-1.',
    header: [
      { name: 'Content Type', bits: 8, desc: 'Handshake(22), Application(23), Alert(21)' },
      { name: 'Version', bits: 16, desc: 'TLS 1.0=0x0301, 1.2=0x0303, 1.3=0x0303' },
      { name: 'Length', bits: 16, desc: 'Длина фрагмента' },
      { name: 'Fragment', bits: 'var', desc: 'Данные записи (зашифрованы)' }
    ]
  },
  {
    id: 'ssl',
    name: 'SSL',
    fullName: 'Secure Sockets Layer',
    osi: 'L6',
    tcpip: 'Application',
    rfc: '6101',
    ports: [443],
    icon: '🔓',
    theoryTopic: 'security',
    related: ['tls', 'https'],
    desc: 'Предшественник TLS. Устарел — все версии (2.0, 3.0) содержат уязвимости.',
    details: 'SSL 3.0 (1996) — последняя версия перед TLS. Уязвимости: POODLE, BEAST, CRIME. TLS 1.0 — фактически SSL 3.1. Термин «SSL» до сих пор используется в обиходе как синоним TLS.',
    header: [
      { name: 'Content Type', bits: 8, desc: 'Тип записи' },
      { name: 'Version', bits: 16, desc: 'SSL 3.0 = 0x0300' },
      { name: 'Length', bits: 16, desc: 'Длина' },
      { name: 'Fragment', bits: 'var', desc: 'Данные' }
    ]
  },

  // ═══════════════════════════════════════════
  // L5 — СЕАНСОВЫЙ УРОВЕНЬ
  // ═══════════════════════════════════════════
  {
    id: 'rpc',
    name: 'RPC',
    fullName: 'Remote Procedure Call',
    osi: 'L5',
    tcpip: 'Application',
    rfc: '5531',
    ports: [111],
    icon: '📡',
    theoryTopic: 'application-protocols',
    related: ['tcp', 'udp'],
    desc: 'Удалённый вызов процедур. Клиент вызывает функцию на сервере как локальную.',
    details: 'ONC RPC (Sun), DCE RPC (Microsoft). Сериализация параметров (XDR), транспорт TCP/UDP. Portmapper на порту 111. Основа NFS, NIS. Современные аналоги: gRPC (Google), JSON-RPC.',
    header: [
      { name: 'XID', bits: 32, desc: 'Transaction ID' },
      { name: 'Message Type', bits: 32, desc: 'Call(0) / Reply(1)' },
      { name: 'RPC Version', bits: 32, desc: 'Версия RPC (2)' },
      { name: 'Program', bits: 32, desc: 'Номер программы' },
      { name: 'Version', bits: 32, desc: 'Версия программы' },
      { name: 'Procedure', bits: 32, desc: 'Номер процедуры' },
      { name: 'Credentials', bits: 'var', desc: 'Аутентификация' },
      { name: 'Parameters', bits: 'var', desc: 'Параметры вызова' }
    ]
  },
  {
    id: 'sip',
    name: 'SIP',
    fullName: 'Session Initiation Protocol',
    osi: 'L5',
    tcpip: 'Application',
    rfc: '3261',
    ports: [5060, 5061],
    icon: '📞',
    theoryTopic: 'application-protocols',
    related: ['rtp', 'udp', 'tcp', 'tls'],
    desc: 'Установление, изменение и завершение мультимедийных сессий (VoIP, видео).',
    details: 'Методы: INVITE (начать звонок), ACK, BYE (завершить), REGISTER, OPTIONS, CANCEL. Текстовый протокол, похож на HTTP. Используется в VoIP (Oбиphone, Teams), видеоконференциях. SDP — описание медиапараметров.',
    header: [
      { name: 'Method/Status', bits: 'var', desc: 'INVITE, 200 OK, BYE...' },
      { name: 'Request-URI', bits: 'var', desc: 'sip:user@domain' },
      { name: 'Headers', bits: 'var', desc: 'Via, From, To, Call-ID, CSeq' },
      { name: 'Body (SDP)', bits: 'var', desc: 'Описание медиасессии' }
    ]
  },
  {
    id: 'rtp',
    name: 'RTP',
    fullName: 'Real-time Transport Protocol',
    osi: 'L5',
    tcpip: 'Application',
    rfc: '3550',
    ports: [],
    icon: '🎵',
    theoryTopic: 'qos',
    related: ['udp', 'sip', 'rtcp'],
    desc: 'Передача аудио и видео в реальном времени. Используется в VoIP, стриминге.',
    details: 'Поверх UDP. Нумерация пакетов для восстановления порядка, временные метки для синхронизации. RTCP — управляющий протокол (статистика качества). Кодеки: G.711, Opus (аудио), H.264, VP8 (видео).',
    header: [
      { name: 'V+P+X+CC', bits: 8, desc: 'Version(2), Padding, Extension, CSRC Count' },
      { name: 'M+PT', bits: 8, desc: 'Marker + Payload Type (кодек)' },
      { name: 'Sequence Number', bits: 16, desc: 'Порядковый номер пакета' },
      { name: 'Timestamp', bits: 32, desc: 'Временная метка (частота кодека)' },
      { name: 'SSRC', bits: 32, desc: 'Идентификатор источника' },
      { name: 'Payload', bits: 'var', desc: 'Аудио/видео данные' }
    ]
  },

  // ═══════════════════════════════════════════
  // L4 — ТРАНСПОРТНЫЙ УРОВЕНЬ
  // ═══════════════════════════════════════════
  {
    id: 'tcp',
    name: 'TCP',
    fullName: 'Transmission Control Protocol',
    osi: 'L4',
    tcpip: 'Transport',
    rfc: '9293',
    ports: [],
    icon: '🤝',
    theoryTopic: 'tcp',
    related: ['ip', 'udp', 'http', 'tls'],
    desc: 'Надёжная доставка данных с установлением соединения, контролем потока и перегрузки.',
    details: '3-Way Handshake: SYN → SYN-ACK → ACK. Скользящее окно для управления потоком. Алгоритмы перегрузки: Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery. 11 состояний конечного автомата. MSS, Window Scale, SACK — опции.',
    features: [
      'Надёжная доставка — повторная передача потерянных сегментов',
      'Установление соединения (3-Way Handshake)',
      'Контроль потока (скользящее окно)',
      'Контроль перегрузки (Slow Start, AIMD)',
      'Полнодуплексная передача',
      'Упорядоченная доставка данных'
    ],
    useCases: ['HTTP/HTTPS (веб)', 'SMTP/IMAP/POP3 (почта)', 'SSH (удалённый доступ)', 'FTP (передача файлов)', 'Базы данных (MySQL, PostgreSQL)'],
    header: [
      { name: 'Source Port', bits: 16, desc: 'Порт отправителя (0-65535)' },
      { name: 'Destination Port', bits: 16, desc: 'Порт получателя' },
      { name: 'Sequence Number', bits: 32, desc: 'Номер первого байта в сегменте' },
      { name: 'Acknowledgment', bits: 32, desc: 'Номер ожидаемого байта' },
      { name: 'Data Offset', bits: 4, desc: 'Длина заголовка (в 32-бит словах)' },
      { name: 'Reserved', bits: 4, desc: 'Зарезервировано' },
      { name: 'Flags', bits: 8, desc: 'CWR ECE URG ACK PSH RST SYN FIN' },
      { name: 'Window Size', bits: 16, desc: 'Размер окна приёма' },
      { name: 'Checksum', bits: 16, desc: 'Контрольная сумма' },
      { name: 'Urgent Pointer', bits: 16, desc: 'Указатель срочных данных' },
      { name: 'Options', bits: 'var', desc: 'MSS, Window Scale, SACK, Timestamps' }
    ],
    interactive: [
      { field: 'Source Port', type: 'number', default: 49152, min: 0, max: 65535 },
      { field: 'Destination Port', type: 'number', default: 80, min: 0, max: 65535 },
      { field: 'Sequence Number', type: 'number', default: 0, min: 0, max: 4294967295 },
      { field: 'Acknowledgment', type: 'number', default: 0, min: 0, max: 4294967295 },
      { field: 'Flags', type: 'flags', flags: ['CWR','ECE','URG','ACK','PSH','RST','SYN','FIN'], default: ['SYN'] },
      { field: 'Window Size', type: 'number', default: 65535, min: 0, max: 65535 }
    ]
  },
  {
    id: 'udp',
    name: 'UDP',
    fullName: 'User Datagram Protocol',
    osi: 'L4',
    tcpip: 'Transport',
    rfc: '768',
    ports: [],
    icon: '📤',
    theoryTopic: 'udp',
    related: ['tcp', 'ip', 'dns', 'quic', 'rtp'],
    desc: 'Быстрая доставка без гарантий. Нет установления соединения, нет повторных передач.',
    details: 'Заголовок всего 8 байт (vs 20+ у TCP). Нет handshake, нет ACK, нет контроля перегрузки. Применение: DNS, DHCP, VoIP, видеостриминг, игры, IoT. QUIC (HTTP/3) — надёжность поверх UDP.',
    features: [
      'Минимальный заголовок — 8 байт',
      'Без установления соединения (connectionless)',
      'Без гарантии доставки и порядка',
      'Низкая задержка — нет handshake'
    ],
    useCases: ['DNS-запросы', 'VoIP и видеозвонки', 'Онлайн-игры', 'DHCP', 'SNMP', 'Видеостриминг'],
    header: [
      { name: 'Source Port', bits: 16, desc: 'Порт отправителя' },
      { name: 'Destination Port', bits: 16, desc: 'Порт получателя' },
      { name: 'Length', bits: 16, desc: 'Длина дейтаграммы (заголовок + данные)' },
      { name: 'Checksum', bits: 16, desc: 'Контрольная сумма (опционально в IPv4)' }
    ],
    interactive: [
      { field: 'Source Port', type: 'number', default: 49152, min: 0, max: 65535 },
      { field: 'Destination Port', type: 'number', default: 53, min: 0, max: 65535 },
      { field: 'Data (текст)', type: 'text', default: 'Hello' }
    ]
  },
  {
    id: 'sctp',
    name: 'SCTP',
    fullName: 'Stream Control Transmission Protocol',
    osi: 'L4',
    tcpip: 'Transport',
    rfc: '9260',
    ports: [],
    icon: '🔀',
    theoryTopic: 'tcp',
    related: ['tcp', 'udp'],
    desc: 'Надёжный транспорт с мультипотоковостью и мультихомингом.',
    details: 'Объединяет преимущества TCP (надёжность) и UDP (границы сообщений). Множество потоков в одном соединении без head-of-line blocking. Мультихоминг — несколько IP-адресов на endpoint. Используется в телекоме (SS7 over IP).',
    header: [
      { name: 'Source Port', bits: 16, desc: 'Порт отправителя' },
      { name: 'Destination Port', bits: 16, desc: 'Порт получателя' },
      { name: 'Verification Tag', bits: 32, desc: 'Тег верификации' },
      { name: 'Checksum', bits: 32, desc: 'CRC-32c' },
      { name: 'Chunks', bits: 'var', desc: 'DATA, INIT, SACK, HEARTBEAT...' }
    ]
  },

  // ═══════════════════════════════════════════
  // L3 — СЕТЕВОЙ УРОВЕНЬ
  // ═══════════════════════════════════════════
  {
    id: 'ipv4',
    name: 'IPv4',
    fullName: 'Internet Protocol version 4',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '791',
    ports: [],
    icon: '🌍',
    theoryTopic: 'ip-addressing',
    related: ['ipv6', 'icmp', 'tcp', 'udp', 'arp'],
    desc: '32-битная адресация (4.3 млрд адресов). Основа текущего Интернета.',
    details: 'Адрес: 4 октета (192.168.1.1). Классы A/B/C (устарели) → CIDR. Приватные диапазоны: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Фрагментация (MTU, DF-flag). TTL — защита от петель. ToS/DSCP для QoS.',
    features: [
      '32-битная адресация (4.3 млрд адресов)',
      'Фрагментация и сборка пакетов',
      'TTL — защита от маршрутных петель',
      'DSCP/ECN для Quality of Service',
      'CIDR — бесклассовая адресация'
    ],
    useCases: ['Адресация всех устройств в Интернете', 'Маршрутизация между сетями', 'VPN-туннели', 'NAT (приватные → публичные адреса)'],
    header: [
      { name: 'Version', bits: 4, desc: '4' },
      { name: 'IHL', bits: 4, desc: 'Длина заголовка (в 32-бит словах)' },
      { name: 'DSCP', bits: 6, desc: 'QoS маркировка' },
      { name: 'ECN', bits: 2, desc: 'Уведомление о перегрузке' },
      { name: 'Total Length', bits: 16, desc: 'Общая длина пакета' },
      { name: 'Identification', bits: 16, desc: 'ID для сборки фрагментов' },
      { name: 'Flags', bits: 3, desc: 'DF (Don\'t Fragment), MF (More Fragments)' },
      { name: 'Fragment Offset', bits: 13, desc: 'Смещение фрагмента (×8 байт)' },
      { name: 'TTL', bits: 8, desc: 'Время жизни (макс. хопов)' },
      { name: 'Protocol', bits: 8, desc: '6=TCP, 17=UDP, 1=ICMP' },
      { name: 'Header Checksum', bits: 16, desc: 'Контрольная сумма заголовка' },
      { name: 'Source IP', bits: 32, desc: 'IP-адрес отправителя' },
      { name: 'Destination IP', bits: 32, desc: 'IP-адрес получателя' },
      { name: 'Options', bits: 'var', desc: 'Опции (если IHL > 5)' }
    ],
    interactive: [
      { field: 'Source IP', type: 'text', default: '192.168.1.100' },
      { field: 'Destination IP', type: 'text', default: '93.184.216.34' },
      { field: 'TTL', type: 'number', default: 64, min: 1, max: 255 },
      { field: 'Protocol', type: 'select', options: ['6 (TCP)', '17 (UDP)', '1 (ICMP)'], default: '6 (TCP)' },
      { field: 'DSCP', type: 'number', default: 0, min: 0, max: 63 },
      { field: 'DF flag', type: 'select', options: ['0 (разрешить фрагментацию)', '1 (Don\'t Fragment)'], default: '1 (Don\'t Fragment)' }
    ]
  },
  {
    id: 'ipv6',
    name: 'IPv6',
    fullName: 'Internet Protocol version 6',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '8200',
    ports: [],
    icon: '🌏',
    theoryTopic: 'ip-addressing',
    related: ['ipv4', 'icmpv6'],
    desc: '128-битная адресация (3.4×10³⁸ адресов). Будущее Интернета.',
    details: 'Адрес: 8 групп по 4 hex (2001:db8::1). Упрощённый заголовок (40 байт, фиксированный). Нет фрагментации маршрутизаторами (только отправителем). Автоконфигурация (SLAAC). Extension Headers вместо опций. IPsec встроен.',
    header: [
      { name: 'Version', bits: 4, desc: '6' },
      { name: 'Traffic Class', bits: 8, desc: 'DSCP + ECN' },
      { name: 'Flow Label', bits: 20, desc: 'Идентификатор потока (QoS)' },
      { name: 'Payload Length', bits: 16, desc: 'Длина данных (без заголовка)' },
      { name: 'Next Header', bits: 8, desc: 'Тип следующего заголовка (6=TCP, 17=UDP)' },
      { name: 'Hop Limit', bits: 8, desc: 'Аналог TTL' },
      { name: 'Source Address', bits: 128, desc: 'IP-адрес отправителя (128 бит)' },
      { name: 'Destination Address', bits: 128, desc: 'IP-адрес получателя (128 бит)' }
    ]
  },
  {
    id: 'icmp',
    name: 'ICMP',
    fullName: 'Internet Control Message Protocol',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '792',
    ports: [],
    icon: '📢',
    theoryTopic: 'internetworking',
    related: ['ipv4', 'ip'],
    desc: 'Диагностика и сообщения об ошибках сети. Основа ping и traceroute.',
    details: 'Типы: 0 Echo Reply, 3 Destination Unreachable, 8 Echo Request, 11 Time Exceeded. Ping: Type 8 → Type 0. Traceroute: увеличение TTL, получение Type 11. Не имеет портов — работает прямо поверх IP.',
    header: [
      { name: 'Type', bits: 8, desc: '0=Echo Reply, 3=Unreachable, 8=Echo, 11=TTL' },
      { name: 'Code', bits: 8, desc: 'Подтип (0=net, 1=host, 3=port unreachable)' },
      { name: 'Checksum', bits: 16, desc: 'Контрольная сумма' },
      { name: 'Rest of Header', bits: 32, desc: 'Зависит от типа (ID+Seq для Echo)' }
    ]
  },
  {
    id: 'icmpv6',
    name: 'ICMPv6',
    fullName: 'ICMP for IPv6',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '4443',
    ports: [],
    icon: '📢',
    theoryTopic: 'ip-addressing',
    related: ['ipv6', 'icmp'],
    desc: 'ICMP для IPv6. Включает функции ARP и IGMP из IPv4.',
    details: 'Neighbor Discovery Protocol (NDP) — замена ARP. Router Solicitation/Advertisement — обнаружение маршрутизаторов. SLAAC — автоконфигурация адреса. MLD — мультикаст. Path MTU Discovery.',
    header: [
      { name: 'Type', bits: 8, desc: '128=Echo Request, 129=Echo Reply, 133-137=NDP' },
      { name: 'Code', bits: 8, desc: 'Подтип' },
      { name: 'Checksum', bits: 16, desc: 'Контрольная сумма (включает псевдозаголовок)' },
      { name: 'Body', bits: 'var', desc: 'Данные (зависят от типа)' }
    ]
  },
  {
    id: 'arp',
    name: 'ARP',
    fullName: 'Address Resolution Protocol',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '826',
    ports: [],
    icon: '🔍',
    theoryTopic: 'internetworking',
    related: ['ipv4', 'ethernet'],
    desc: 'Определение MAC-адреса по IP. «Кто имеет 192.168.1.1? Скажите 192.168.1.100».',
    details: 'ARP Request — broadcast (FF:FF:FF:FF:FF:FF). ARP Reply — unicast с MAC-адресом. ARP-таблица (кэш) — хранит соответствия IP↔MAC. ARP Spoofing — атака через подмену. GARP — Gratuitous ARP для обнаружения дубликатов.',
    features: [
      'Broadcast-запросы для поиска MAC',
      'ARP-кэш для ускорения повторных обращений',
      'Gratuitous ARP для обнаружения конфликтов',
      'Работает только в пределах одного L2-сегмента'
    ],
    useCases: ['Поиск MAC-адреса шлюза', 'Обнаружение дубликатов IP', 'Failover (VRRP, HSRP)'],
    header: [
      { name: 'Hardware Type', bits: 16, desc: '1 = Ethernet' },
      { name: 'Protocol Type', bits: 16, desc: '0x0800 = IPv4' },
      { name: 'HW Addr Len', bits: 8, desc: '6 (MAC)' },
      { name: 'Proto Addr Len', bits: 8, desc: '4 (IPv4)' },
      { name: 'Operation', bits: 16, desc: '1=Request, 2=Reply' },
      { name: 'Sender MAC', bits: 48, desc: 'MAC отправителя' },
      { name: 'Sender IP', bits: 32, desc: 'IP отправителя' },
      { name: 'Target MAC', bits: 48, desc: 'MAC получателя (00:00:00:00:00:00 в запросе)' },
      { name: 'Target IP', bits: 32, desc: 'IP получателя' }
    ],
    interactive: [
      { field: 'Operation', type: 'select', options: ['1 (Request)', '2 (Reply)'], default: '1 (Request)' },
      { field: 'Sender MAC', type: 'text', default: 'AA:BB:CC:DD:EE:01' },
      { field: 'Sender IP', type: 'text', default: '192.168.1.100' },
      { field: 'Target IP', type: 'text', default: '192.168.1.1' }
    ]
  },
  {
    id: 'ospf',
    name: 'OSPF',
    fullName: 'Open Shortest Path First',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '2328',
    ports: [],
    icon: '🗺️',
    theoryTopic: 'routing',
    related: ['ipv4', 'bgp', 'rip'],
    desc: 'Протокол маршрутизации link-state. Алгоритм Дейкстры для поиска кратчайшего пути.',
    details: 'Области (areas) для масштабируемости. Area 0 — backbone. LSA (Link State Advertisements) — объявления о состоянии каналов. DR/BDR — designated router. Метрика: cost = reference_bandwidth / interface_bandwidth. Протокол 89 (не TCP/UDP).',
    header: [
      { name: 'Version', bits: 8, desc: 'OSPFv2=2, OSPFv3=3' },
      { name: 'Type', bits: 8, desc: 'Hello(1), DBD(2), LSR(3), LSU(4), LSAck(5)' },
      { name: 'Packet Length', bits: 16, desc: 'Длина пакета' },
      { name: 'Router ID', bits: 32, desc: 'ID маршрутизатора' },
      { name: 'Area ID', bits: 32, desc: 'ID области' },
      { name: 'Checksum', bits: 16, desc: 'Контрольная сумма' },
      { name: 'Auth Type', bits: 16, desc: 'Тип аутентификации' },
      { name: 'Auth Data', bits: 64, desc: 'Данные аутентификации' }
    ]
  },
  {
    id: 'bgp',
    name: 'BGP',
    fullName: 'Border Gateway Protocol',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '4271',
    ports: [179],
    icon: '🌐',
    theoryTopic: 'routing',
    related: ['tcp', 'ospf', 'ipv4'],
    desc: 'Протокол межсетевой маршрутизации. Связывает автономные системы Интернета.',
    details: 'Path-vector протокол. AS_PATH — список пройденных AS. Политики: LOCAL_PREF, MED, Community. iBGP (внутри AS) vs eBGP (между AS). ~930000+ маршрутов в полной таблице. TCP порт 179. Критически важен для работы Интернета.',
    header: [
      { name: 'Marker', bits: 128, desc: '16 байт 0xFF (для синхронизации)' },
      { name: 'Length', bits: 16, desc: 'Длина сообщения' },
      { name: 'Type', bits: 8, desc: 'OPEN(1), UPDATE(2), NOTIFICATION(3), KEEPALIVE(4)' },
      { name: 'Message Body', bits: 'var', desc: 'Содержимое (зависит от типа)' }
    ]
  },
  {
    id: 'rip',
    name: 'RIP',
    fullName: 'Routing Information Protocol',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '2453',
    ports: [520],
    icon: '🛣️',
    theoryTopic: 'routing',
    related: ['udp', 'ospf', 'bgp'],
    desc: 'Простой протокол маршрутизации distance-vector. Метрика — количество хопов (макс. 15).',
    details: 'RIPv1 — classful (без маски), broadcast. RIPv2 — classless (CIDR), multicast 224.0.0.9. Обновления каждые 30 сек. Slow convergence — проблема. Split horizon, route poisoning — защита от петель. Подходит для малых сетей.',
    header: [
      { name: 'Command', bits: 8, desc: 'Request(1) / Response(2)' },
      { name: 'Version', bits: 8, desc: '1 или 2' },
      { name: 'Unused', bits: 16, desc: 'Не используется' },
      { name: 'Route Entries', bits: 'var', desc: 'До 25 маршрутов по 20 байт' }
    ]
  },
  {
    id: 'nat',
    name: 'NAT',
    fullName: 'Network Address Translation',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '3022',
    ports: [],
    icon: '🔄',
    theoryTopic: 'internetworking',
    related: ['ipv4', 'tcp', 'udp'],
    desc: 'Трансляция приватных IP в публичные. Позволяет множеству устройств использовать один внешний IP.',
    details: 'Static NAT — 1:1 трансляция. Dynamic NAT — пул адресов. PAT/NAPT (Port Address Translation) — множество устройств через один IP + разные порты. Проблемы: P2P, VoIP, IPsec. STUN/TURN — обход NAT.',
    header: [
      { name: 'Original Src IP', bits: 32, desc: 'Приватный IP' },
      { name: '→ Translated Src IP', bits: 32, desc: 'Публичный IP' },
      { name: 'Original Src Port', bits: 16, desc: 'Порт клиента' },
      { name: '→ Translated Port', bits: 16, desc: 'Внешний порт NAT' }
    ]
  },
  {
    id: 'ipsec',
    name: 'IPsec',
    fullName: 'Internet Protocol Security',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '4301',
    ports: [500],
    icon: '🛡️',
    theoryTopic: 'security',
    related: ['ipv4', 'ipv6', 'ike'],
    desc: 'Шифрование и аутентификация на сетевом уровне. Основа VPN.',
    details: 'AH (Authentication Header) — целостность, без шифрования. ESP (Encapsulating Security Payload) — шифрование + целостность. Режимы: transport (хост↔хост) и tunnel (шлюз↔шлюз, VPN). IKE (порт 500) — обмен ключами. SA — Security Association.',
    header: [
      { name: 'SPI', bits: 32, desc: 'Security Parameters Index' },
      { name: 'Sequence Number', bits: 32, desc: 'Защита от replay-атак' },
      { name: 'Payload Data', bits: 'var', desc: 'Зашифрованные данные (ESP)' },
      { name: 'Padding', bits: 'var', desc: 'Выравнивание до размера блока' },
      { name: 'ICV', bits: 'var', desc: 'Integrity Check Value' }
    ]
  },
  {
    id: 'igmp',
    name: 'IGMP',
    fullName: 'Internet Group Management Protocol',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '3376',
    ports: [],
    icon: '👥',
    theoryTopic: 'internetworking',
    related: ['ipv4', 'ip'],
    desc: 'Управление мультикаст-группами. Хосты сообщают маршрутизатору о подписке на группу.',
    details: 'IGMPv3 — поддержка source-specific multicast (SSM). Типы: Membership Query, Membership Report, Leave Group. Маршрутизатор периодически опрашивает, хосты отвечают. Используется для IPTV, видеоконференций.',
    header: [
      { name: 'Type', bits: 8, desc: 'Query(0x11), Report(0x16), Leave(0x17)' },
      { name: 'Max Response Time', bits: 8, desc: 'Макс. время ответа (1/10 сек)' },
      { name: 'Checksum', bits: 16, desc: 'Контрольная сумма' },
      { name: 'Group Address', bits: 32, desc: 'Мультикаст-адрес группы' }
    ]
  },

  // ═══════════════════════════════════════════
  // L2 — КАНАЛЬНЫЙ УРОВЕНЬ
  // ═══════════════════════════════════════════
  {
    id: 'ethernet',
    name: 'Ethernet',
    fullName: 'IEEE 802.3 Ethernet',
    osi: 'L2',
    tcpip: 'Link',
    rfc: 'IEEE 802.3',
    ports: [],
    icon: '🔌',
    theoryTopic: 'ethernet',
    related: ['arp', 'vlan', 'stp', 'ipv4'],
    desc: 'Технология локальных сетей. 48-битные MAC-адреса, фреймы, CSMA/CD.',
    details: 'Скорости: 10 Мбит/с → 100M → 1G → 10G → 25G → 40G → 100G → 400G. Фрейм: 64-1518 байт (Jumbo до 9000). MAC-адрес: 6 байт (OUI + NIC). Full duplex — без коллизий. PoE — питание по витой паре.',
    features: [
      '48-битные MAC-адреса (OUI + NIC ID)',
      'Скорости от 10 Мбит/с до 400 Гбит/с',
      'Full duplex — одновременный приём/передача',
      'CRC-32 для обнаружения ошибок',
      'Jumbo frames — до 9000 байт MTU'
    ],
    useCases: ['Локальные сети (LAN)', 'Дата-центры (10G/25G/100G)', 'PoE — питание IP-камер и телефонов', 'Промышленные сети (EtherCAT)'],
    header: [
      { name: 'Preamble', bits: 56, desc: '7 байт 10101010 (синхронизация)' },
      { name: 'SFD', bits: 8, desc: 'Start Frame Delimiter (10101011)' },
      { name: 'Destination MAC', bits: 48, desc: 'MAC получателя' },
      { name: 'Source MAC', bits: 48, desc: 'MAC отправителя' },
      { name: 'EtherType/Length', bits: 16, desc: '0x0800=IPv4, 0x0806=ARP, 0x86DD=IPv6' },
      { name: 'Payload', bits: '368-12000', desc: 'Данные (46-1500 байт)' },
      { name: 'FCS', bits: 32, desc: 'Frame Check Sequence (CRC-32)' }
    ],
    interactive: [
      { field: 'Destination MAC', type: 'text', default: 'FF:FF:FF:FF:FF:FF' },
      { field: 'Source MAC', type: 'text', default: 'AA:BB:CC:DD:EE:01' },
      { field: 'EtherType', type: 'select', options: ['0x0800 (IPv4)', '0x0806 (ARP)', '0x86DD (IPv6)', '0x8100 (VLAN)'], default: '0x0800 (IPv4)' }
    ]
  },
  {
    id: 'wifi',
    name: 'Wi-Fi',
    fullName: 'IEEE 802.11 Wireless LAN',
    osi: 'L2',
    tcpip: 'Link',
    rfc: 'IEEE 802.11',
    ports: [],
    icon: '📶',
    theoryTopic: 'wifi',
    related: ['ethernet', 'wpa'],
    desc: 'Беспроводные локальные сети. CSMA/CA, частоты 2.4/5/6 ГГц.',
    details: '802.11a/b/g/n(Wi-Fi 4)/ac(5)/ax(6)/be(7). Частоты: 2.4 ГГц (дальше, медленнее), 5 ГГц (быстрее, короче), 6 ГГц (Wi-Fi 6E/7). OFDM, MU-MIMO, beamforming. BSS, SSID, Association. Wi-Fi 7: до 46 Гбит/с.',
    header: [
      { name: 'Frame Control', bits: 16, desc: 'Protocol, Type, Subtype, Flags' },
      { name: 'Duration/ID', bits: 16, desc: 'NAV / Association ID' },
      { name: 'Address 1', bits: 48, desc: 'Receiver (RA)' },
      { name: 'Address 2', bits: 48, desc: 'Transmitter (TA)' },
      { name: 'Address 3', bits: 48, desc: 'BSSID / Source / Destination' },
      { name: 'Sequence Control', bits: 16, desc: 'Fragment + Sequence Number' },
      { name: 'Address 4', bits: 48, desc: 'Только в WDS (mesh)' },
      { name: 'Payload', bits: 'var', desc: 'Данные (до 2304 байт)' },
      { name: 'FCS', bits: 32, desc: 'CRC-32' }
    ]
  },
  {
    id: 'vlan',
    name: 'VLAN (802.1Q)',
    fullName: 'IEEE 802.1Q Virtual LAN',
    osi: 'L2',
    tcpip: 'Link',
    rfc: 'IEEE 802.1Q',
    ports: [],
    icon: '🏷️',
    theoryTopic: 'switching',
    related: ['ethernet', 'stp'],
    desc: 'Виртуальные локальные сети. Разделение одного коммутатора на изолированные сегменты.',
    details: '4-байтовый тег вставляется в Ethernet-фрейм. VLAN ID: 1-4094. Access port (1 VLAN) vs Trunk port (несколько VLAN). Native VLAN — без тега на транке. QinQ (802.1ad) — двойная метка для провайдеров.',
    header: [
      { name: 'TPID', bits: 16, desc: '0x8100 (Tag Protocol Identifier)' },
      { name: 'PCP', bits: 3, desc: 'Priority Code Point (QoS, 0-7)' },
      { name: 'DEI', bits: 1, desc: 'Drop Eligible Indicator' },
      { name: 'VID', bits: 12, desc: 'VLAN ID (0-4095)' }
    ]
  },
  {
    id: 'stp',
    name: 'STP',
    fullName: 'Spanning Tree Protocol (IEEE 802.1D)',
    osi: 'L2',
    tcpip: 'Link',
    rfc: 'IEEE 802.1D',
    ports: [],
    icon: '🌳',
    theoryTopic: 'switching',
    related: ['ethernet', 'vlan'],
    desc: 'Предотвращение петель в коммутируемых сетях путём блокировки избыточных линков.',
    details: 'BPDU — Bridge Protocol Data Unit для обмена информацией. Root Bridge — корневой коммутатор (наименьший Bridge ID). Состояния портов: Blocking → Listening → Learning → Forwarding. RSTP (802.1w) — быстрая сходимость (<6 сек vs 50 сек).',
    header: [
      { name: 'Protocol ID', bits: 16, desc: '0x0000' },
      { name: 'Version', bits: 8, desc: '0=STP, 2=RSTP' },
      { name: 'Type', bits: 8, desc: 'Config(0x00), TCN(0x80)' },
      { name: 'Flags', bits: 8, desc: 'TC, TCA' },
      { name: 'Root Bridge ID', bits: 64, desc: 'Priority + MAC корневого' },
      { name: 'Root Path Cost', bits: 32, desc: 'Стоимость пути до корня' },
      { name: 'Bridge ID', bits: 64, desc: 'Priority + MAC отправителя' },
      { name: 'Port ID', bits: 16, desc: 'Priority + номер порта' },
      { name: 'Timers', bits: 'var', desc: 'Message Age, Max Age, Hello, Forward Delay' }
    ]
  },
  {
    id: 'ppp',
    name: 'PPP',
    fullName: 'Point-to-Point Protocol',
    osi: 'L2',
    tcpip: 'Link',
    rfc: '1661',
    ports: [],
    icon: '↔️',
    theoryTopic: 'data-transmission',
    related: ['ethernet', 'ipv4'],
    desc: 'Протокол для соединений точка-точка. Используется в DSL (PPPoE), модемах.',
    details: 'LCP (Link Control Protocol) — установление канала. NCP (Network Control Protocol) — настройка сетевого уровня (IPCP для IP). Аутентификация: PAP (plaintext), CHAP (challenge-response). PPPoE — PPP поверх Ethernet (DSL).',
    header: [
      { name: 'Flag', bits: 8, desc: '0x7E (начало/конец)' },
      { name: 'Address', bits: 8, desc: '0xFF (broadcast)' },
      { name: 'Control', bits: 8, desc: '0x03 (unnumbered)' },
      { name: 'Protocol', bits: 16, desc: '0x0021=IP, 0xC021=LCP, 0xC023=PAP' },
      { name: 'Payload', bits: 'var', desc: 'Данные протокола' },
      { name: 'FCS', bits: 16, desc: 'Frame Check Sequence' },
      { name: 'Flag', bits: 8, desc: '0x7E (конец)' }
    ]
  },
  {
    id: 'wpa',
    name: 'WPA3',
    fullName: 'Wi-Fi Protected Access 3',
    osi: 'L2',
    tcpip: 'Link',
    rfc: 'Wi-Fi Alliance',
    ports: [],
    icon: '🔐',
    theoryTopic: 'security',
    related: ['wifi'],
    desc: 'Безопасность Wi-Fi. SAE (Simultaneous Authentication of Equals) вместо PSK.',
    details: 'WPA (TKIP, устарел) → WPA2 (AES-CCMP) → WPA3 (SAE, 192-bit security suite). SAE устойчив к offline dictionary attacks. PMF (Protected Management Frames) обязателен. Enterprise: 802.1X + RADIUS.',
    header: [
      { name: 'Key Info', bits: 16, desc: 'Тип, версия, установленный ключ' },
      { name: 'Key Length', bits: 16, desc: 'Длина ключа' },
      { name: 'Replay Counter', bits: 64, desc: 'Защита от повтора' },
      { name: 'Key Nonce', bits: 256, desc: 'Случайное число для ключей' },
      { name: 'Key MIC', bits: 128, desc: 'Message Integrity Code' },
      { name: 'Key Data', bits: 'var', desc: 'Зашифрованный ключ' }
    ]
  },
  {
    id: 'lldp',
    name: 'LLDP',
    fullName: 'Link Layer Discovery Protocol',
    osi: 'L2',
    tcpip: 'Link',
    rfc: 'IEEE 802.1AB',
    ports: [],
    icon: '🔎',
    theoryTopic: 'network-management',
    related: ['ethernet'],
    desc: 'Обнаружение соседних устройств. Коммутатор сообщает имя, порт, VLAN, IP.',
    details: 'Вендор-нейтральная замена CDP (Cisco). TLV (Type-Length-Value): Chassis ID, Port ID, TTL, System Name, System Description, Management Address. Отправляется каждые 30 секунд. Multicast 01:80:C2:00:00:0E.',
    header: [
      { name: 'Chassis ID TLV', bits: 'var', desc: 'Идентификатор устройства' },
      { name: 'Port ID TLV', bits: 'var', desc: 'Идентификатор порта' },
      { name: 'TTL TLV', bits: 'var', desc: 'Время жизни информации' },
      { name: 'Optional TLVs', bits: 'var', desc: 'System Name, Description, Capabilities...' },
      { name: 'End TLV', bits: 16, desc: 'Завершение (0x0000)' }
    ]
  },
  {
    id: 'lacp',
    name: 'LACP',
    fullName: 'Link Aggregation Control Protocol',
    osi: 'L2',
    tcpip: 'Link',
    rfc: 'IEEE 802.3ad',
    ports: [],
    icon: '🔗',
    theoryTopic: 'switching',
    related: ['ethernet'],
    desc: 'Объединение нескольких физических линков в один логический для пропускной способности и отказоустойчивости.',
    details: 'Динамическое согласование между коммутаторами. Partner System/Port ID. Active vs Passive mode. Балансировка: по MAC, IP, порту. EtherChannel (Cisco) — статический аналог.',
    header: [
      { name: 'Subtype', bits: 8, desc: '0x01 = LACP' },
      { name: 'Version', bits: 8, desc: '0x01' },
      { name: 'Actor Info', bits: 'var', desc: 'System Priority, MAC, Key, Port, State' },
      { name: 'Partner Info', bits: 'var', desc: 'Информация о партнёре' },
      { name: 'Collector Info', bits: 'var', desc: 'Max Delay' }
    ]
  },

  // ═══════════════════════════════════════════
  // L1 — ФИЗИЧЕСКИЙ УРОВЕНЬ
  // ═══════════════════════════════════════════
  {
    id: 'nrz',
    name: 'NRZ',
    fullName: 'Non-Return-to-Zero',
    osi: 'L1',
    tcpip: 'Link',
    rfc: '-',
    ports: [],
    icon: '〰️',
    theoryTopic: 'data-transmission',
    related: ['manchester', 'nrzi'],
    desc: 'Простейший линейный код. 1 = высокий уровень, 0 = низкий. Нет самосинхронизации.',
    details: 'Проблема: длинные последовательности 0 или 1 — потеря синхронизации. DC offset при неравном количестве 0/1. Используется как базовый кодирование, часто с дополнительным скрэмблингом.',
    header: [
      { name: 'Bit', bits: 1, desc: '0 → низкий уровень, 1 → высокий' }
    ]
  },
  {
    id: 'manchester',
    name: 'Manchester',
    fullName: 'Manchester Encoding (IEEE 802.3)',
    osi: 'L1',
    tcpip: 'Link',
    rfc: 'IEEE 802.3',
    ports: [],
    icon: '📊',
    theoryTopic: 'data-transmission',
    related: ['nrz', 'ethernet'],
    desc: 'Самосинхронизирующийся код. Переход в середине каждого бита. Используется в 10BASE-T Ethernet.',
    details: '0 = переход вверх (↑) в середине бита, 1 = переход вниз (↓). Гарантирует переход в каждом битовом интервале → приёмник всегда синхронизирован. Полоса = 2× скорости передачи. 10 Мбит/с → 20 МГц полоса.',
    header: [
      { name: 'Bit 0', bits: 1, desc: 'Low→High переход в середине' },
      { name: 'Bit 1', bits: 1, desc: 'High→Low переход в середине' }
    ]
  },
  {
    id: 'nrzi',
    name: 'NRZI',
    fullName: 'Non-Return-to-Zero Inverted',
    osi: 'L1',
    tcpip: 'Link',
    rfc: '-',
    ports: [],
    icon: '〰️',
    theoryTopic: 'data-transmission',
    related: ['nrz', 'manchester'],
    desc: 'Инвертированный NRZ. 1 = смена уровня, 0 = сохранение. Используется в USB, FDDI.',
    details: 'Решает проблему длинных серий единиц (переходы есть). Проблема длинных серий нулей остаётся. В USB используется с bit stuffing (вставка 0 после 6 единиц).',
    header: [
      { name: 'Bit 1', bits: 1, desc: 'Смена уровня сигнала' },
      { name: 'Bit 0', bits: 1, desc: 'Уровень не меняется' }
    ]
  },
  {
    id: 'pam4',
    name: 'PAM-4',
    fullName: 'Pulse Amplitude Modulation 4-level',
    osi: 'L1',
    tcpip: 'Link',
    rfc: '-',
    ports: [],
    icon: '📶',
    theoryTopic: 'data-transmission',
    related: ['nrz', 'ethernet'],
    desc: '4 уровня амплитуды = 2 бита на символ. Используется в 200G/400G Ethernet.',
    details: 'Уровни: -3, -1, +1, +3 → кодируют 00, 01, 10, 11. Удвоение скорости без увеличения частоты. Требует более точные приёмники и лучший SNR. Используется в 50GBASE-KR, 100GBASE-KR4, 400GBASE-DR4.',
    header: [
      { name: 'Symbol', bits: 2, desc: '-3=00, -1=01, +1=10, +3=11' }
    ]
  },
  // Additional well-known protocols
  {
    id: 'scp',
    name: 'SCP',
    fullName: 'Secure Copy Protocol',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '-',
    ports: [22],
    icon: '📋',
    theoryTopic: 'security',
    related: ['ssh', 'sftp'],
    desc: 'Безопасное копирование файлов через SSH. Простая альтернатива SFTP.',
    details: 'Использует SSH для аутентификации и шифрования. Синтаксис: scp file user@host:/path. Не поддерживает операции с каталогами (в отличие от SFTP). Постепенно заменяется SFTP.',
    header: [
      { name: 'SSH Transport', bits: 'var', desc: 'SSH-обёртка' },
      { name: 'SCP Command', bits: 'var', desc: 'C (copy), D (directory), T (timestamp)' }
    ]
  },
  {
    id: 'ldap',
    name: 'LDAP',
    fullName: 'Lightweight Directory Access Protocol',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '4511',
    ports: [389, 636],
    icon: '📖',
    theoryTopic: 'application-protocols',
    related: ['tcp', 'tls'],
    desc: 'Доступ к службам каталогов (Active Directory, OpenLDAP). Аутентификация пользователей.',
    details: 'Иерархическая структура: DC (Domain Component), OU (Organizational Unit), CN (Common Name). Операции: Bind, Search, Add, Delete, Modify. LDAPS (порт 636) — LDAP over TLS. Основа корпоративной аутентификации.',
    header: [
      { name: 'Message ID', bits: 32, desc: 'Идентификатор запроса' },
      { name: 'Operation', bits: 'var', desc: 'BindRequest, SearchRequest...' },
      { name: 'Parameters', bits: 'var', desc: 'DN, фильтр, атрибуты' }
    ]
  },
  {
    id: 'radius',
    name: 'RADIUS',
    fullName: 'Remote Authentication Dial-In User Service',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '2865',
    ports: [1812, 1813],
    icon: '🔐',
    theoryTopic: 'security',
    related: ['udp', 'eap'],
    desc: 'Аутентификация, авторизация и учёт (AAA) для сетевого доступа.',
    details: 'Используется в 802.1X (Wi-Fi Enterprise, VPN). Access-Request → Access-Accept/Reject. Accounting: порт 1813. Атрибуты: User-Name, Password, NAS-IP, Session-Timeout. FreeRADIUS — популярная реализация.',
    header: [
      { name: 'Code', bits: 8, desc: 'Access-Request(1), Accept(2), Reject(3), Challenge(11)' },
      { name: 'Identifier', bits: 8, desc: 'ID запроса' },
      { name: 'Length', bits: 16, desc: 'Длина пакета' },
      { name: 'Authenticator', bits: 128, desc: 'Случайное значение / хэш' },
      { name: 'Attributes', bits: 'var', desc: 'TLV: User-Name, Password, NAS-IP...' }
    ]
  },
  {
    id: 'netflow',
    name: 'NetFlow',
    fullName: 'Cisco NetFlow / IPFIX',
    osi: 'L7',
    tcpip: 'Application',
    rfc: '7011',
    ports: [2055, 9996],
    icon: '📈',
    theoryTopic: 'network-management',
    related: ['udp', 'snmp'],
    desc: 'Анализ сетевого трафика. Экспорт статистики потоков с маршрутизаторов.',
    details: 'Поток: src/dst IP + src/dst port + protocol + ToS. NetFlow v5 — фиксированный формат. v9 — шаблоны. IPFIX (RFC 7011) — стандартизированная версия. sFlow — сэмплирование пакетов (альтернатива).',
    header: [
      { name: 'Version', bits: 16, desc: 'v5, v9, IPFIX(10)' },
      { name: 'Count', bits: 16, desc: 'Количество записей' },
      { name: 'Uptime', bits: 32, desc: 'Время работы экспортёра' },
      { name: 'Unix Timestamp', bits: 32, desc: 'Время экспорта' },
      { name: 'Sequence', bits: 32, desc: 'Порядковый номер' },
      { name: 'Flow Records', bits: 'var', desc: 'Записи потоков' }
    ]
  },
  {
    id: 'gre',
    name: 'GRE',
    fullName: 'Generic Routing Encapsulation',
    osi: 'L3',
    tcpip: 'Internet',
    rfc: '2784',
    ports: [],
    icon: '🚇',
    theoryTopic: 'internetworking',
    related: ['ipv4', 'ipsec'],
    desc: 'Туннелирование протоколов внутри IP. Основа для VPN и мультикаст через WAN.',
    details: 'Инкапсулирует любой L3-протокол внутри IP (protocol 47). Не шифрует — часто используется совместно с IPsec. Поддерживает мультикаст (в отличие от IPsec). GRE over IPsec — распространённая VPN-схема.',
    header: [
      { name: 'C+K+S Flags', bits: 16, desc: 'Checksum, Key, Sequence present' },
      { name: 'Protocol Type', bits: 16, desc: '0x0800=IPv4, 0x86DD=IPv6' },
      { name: 'Checksum', bits: 16, desc: 'Опционально' },
      { name: 'Key', bits: 32, desc: 'Идентификатор туннеля (опционально)' },
      { name: 'Sequence', bits: 32, desc: 'Порядковый номер (опционально)' }
    ]
  },
  {
    id: 'mpls',
    name: 'MPLS',
    fullName: 'Multiprotocol Label Switching',
    osi: 'L2',
    tcpip: 'Link',
    rfc: '3031',
    ports: [],
    icon: '🏷️',
    theoryTopic: 'routing',
    related: ['ipv4', 'bgp', 'ospf'],
    desc: 'Коммутация по меткам вместо IP-поиска. Быстрая пересылка в ядре провайдерских сетей.',
    details: 'Label = 20 бит, вставляется между L2 и L3. LSR (Label Switch Router) коммутирует по метке без IP lookup. LDP — протокол распределения меток. MPLS VPN (L3VPN) — изоляция клиентов. MPLS-TE — traffic engineering. Стек меток.',
    header: [
      { name: 'Label', bits: 20, desc: 'Метка (0-1048575)' },
      { name: 'TC', bits: 3, desc: 'Traffic Class (QoS)' },
      { name: 'S', bits: 1, desc: 'Bottom of Stack (последняя метка)' },
      { name: 'TTL', bits: 8, desc: 'Time to Live' }
    ]
  }
];
