/* ==================== TERMINAL: Scenario Data ==================== */
/* 10 пошаговых сценариев для управляемой практики в терминале      */

export const TERM_SCENARIOS = [
  {
    id: 'basic-network',
    title: '1. Базовая настройка сети',
    desc: 'Назначить IP, маску, шлюз, проверить связь',
    icon: '\u{1F310}',
    steps: [
      { instruction: 'Посмотрите текущую конфигурацию интерфейсов', check: (cmd) => cmd.includes('ifconfig') || cmd.includes('ip addr') || cmd.includes('ip a'), hint: 'Используйте ifconfig или ip addr' },
      { instruction: 'Проверьте таблицу маршрутизации', check: (cmd) => cmd.includes('route') || cmd.includes('ip route') || cmd.includes('ip r'), hint: 'Используйте route или ip route' },
      { instruction: 'Проверьте связь с шлюзом (192.168.1.1)', check: (cmd) => cmd.includes('ping') && cmd.includes('192.168.1.1'), hint: 'ping 192.168.1.1' },
      { instruction: 'Проверьте связь с внешним сервером', check: (cmd) => cmd.includes('ping') && !cmd.includes('192.168.1'), hint: 'ping google.com или ping 8.8.8.8' },
    ],
    xp: 15
  },
  {
    id: 'dns-setup',
    title: '2. Настройка DNS',
    desc: 'Настроить resolv.conf, проверить зону, выполнить запросы',
    icon: '\u{1F4E1}',
    steps: [
      { instruction: 'Просмотрите текущие DNS-серверы', check: (cmd) => cmd.includes('cat') && cmd.includes('resolv.conf'), hint: 'cat /etc/resolv.conf' },
      { instruction: 'Посмотрите конфигурацию DNS-сервера', check: (cmd) => cmd.includes('cat') && cmd.includes('named.conf'), hint: 'cat /etc/bind/named.conf' },
      { instruction: 'Просмотрите зону example.local', check: (cmd) => cmd.includes('cat') && cmd.includes('example.local'), hint: 'cat /etc/bind/zones/example.local.db' },
      { instruction: 'Выполните DNS-запрос к google.com', check: (cmd) => cmd.includes('nslookup') || cmd.includes('dig'), hint: 'nslookup google.com' },
      { instruction: 'Проверьте статус DNS-сервера', check: (cmd) => cmd.includes('systemctl') && cmd.includes('named'), hint: 'systemctl status named' },
    ],
    xp: 20
  },
  {
    id: 'dhcp-config',
    title: '3. Настройка DHCP',
    desc: 'Создать пул адресов, запустить сервис',
    icon: '\u{1F4CB}',
    steps: [
      { instruction: 'Просмотрите конфигурацию DHCP-сервера', check: (cmd) => cmd.includes('cat') && cmd.includes('dhcp'), hint: 'cat /etc/dhcp/dhcpd.conf' },
      { instruction: 'Проверьте статус DHCP-сервиса', check: (cmd) => cmd.includes('systemctl') && cmd.includes('dhcpd'), hint: 'systemctl status dhcpd' },
      { instruction: 'Запустите DHCP-сервис', check: (cmd) => cmd.includes('systemctl') && cmd.includes('start') && cmd.includes('dhcpd'), hint: 'systemctl start dhcpd' },
      { instruction: 'Проверьте, что сервис запущен', check: (cmd) => cmd.includes('systemctl') && cmd.includes('status') && cmd.includes('dhcpd'), hint: 'systemctl status dhcpd' },
    ],
    xp: 15
  },
  {
    id: 'routing-config',
    title: '4. Настройка маршрутизации',
    desc: 'Таблица маршрутизации, traceroute',
    icon: '\u{1F5FA}\uFE0F',
    steps: [
      { instruction: 'Посмотрите таблицу маршрутизации', check: (cmd) => cmd.includes('route') || cmd.includes('ip route') || cmd.includes('ip r'), hint: 'route' },
      { instruction: 'Проверьте ARP-таблицу', check: (cmd) => cmd.includes('arp') || (cmd.includes('ip') && cmd.includes('neigh')), hint: 'arp или ip neigh' },
      { instruction: 'Трассируйте маршрут до google.com', check: (cmd) => cmd.includes('traceroute') || cmd.includes('tracert'), hint: 'traceroute google.com' },
      { instruction: 'Запустите mtr до 8.8.8.8 для анализа маршрута', check: (cmd) => cmd.includes('mtr'), hint: 'mtr 8.8.8.8' },
    ],
    xp: 15
  },
  {
    id: 'firewall-rules',
    title: '5. Настройка firewall',
    desc: 'Правила iptables, проверка доступности',
    icon: '\u{1F6E1}\uFE0F',
    steps: [
      { instruction: 'Просмотрите текущие правила iptables', check: (cmd) => cmd.includes('iptables') && cmd.includes('-L'), hint: 'iptables -L' },
      { instruction: 'Просмотрите файл правил', check: (cmd) => cmd.includes('cat') && cmd.includes('iptables'), hint: 'cat /etc/iptables/rules.v4' },
      { instruction: 'Проверьте, что порт 80 доступен через telnet', check: (cmd) => cmd.includes('telnet') && cmd.includes('80'), hint: 'telnet localhost 80' },
      { instruction: 'Сканируйте порты на localhost', check: (cmd) => cmd.includes('nmap'), hint: 'nmap localhost' },
    ],
    xp: 20
  },
  {
    id: 'vlan-setup',
    title: '6. Настройка VLAN',
    desc: 'Создать VLAN, проверить изоляцию',
    icon: '\u{1F3F7}\uFE0F',
    steps: [
      { instruction: 'Просмотрите конфигурацию сетевых интерфейсов', check: (cmd) => cmd.includes('ifconfig') || cmd.includes('ip addr') || cmd.includes('ip a'), hint: 'ifconfig или ip addr' },
      { instruction: 'Посмотрите настройки интерфейсов', check: (cmd) => cmd.includes('cat') && cmd.includes('interfaces'), hint: 'cat /etc/network/interfaces' },
      { instruction: 'Проверьте параметры Ethernet', check: (cmd) => cmd.includes('ethtool'), hint: 'ethtool eth0' },
      { instruction: 'Проверьте ARP-таблицу для поиска соседей', check: (cmd) => cmd.includes('arp') || (cmd.includes('ip') && cmd.includes('neigh')), hint: 'arp' },
    ],
    xp: 15
  },
  {
    id: 'nat-config',
    title: '7. Настройка NAT',
    desc: 'Masquerade, DNAT, проверка',
    icon: '\u{1F500}',
    steps: [
      { instruction: 'Проверьте ядерный параметр IP forwarding', check: (cmd) => cmd.includes('cat') && cmd.includes('sysctl'), hint: 'cat /etc/sysctl.conf' },
      { instruction: 'Просмотрите текущие правила iptables', check: (cmd) => cmd.includes('iptables'), hint: 'iptables -L' },
      { instruction: 'Проверьте таблицу маршрутизации', check: (cmd) => cmd.includes('route') || cmd.includes('ip route') || cmd.includes('ip r'), hint: 'route' },
      { instruction: 'Проверьте внешнюю связь', check: (cmd) => cmd.includes('ping') || cmd.includes('curl'), hint: 'curl example.com' },
    ],
    xp: 15
  },
  {
    id: 'vpn-tunnel',
    title: '8. Настройка VPN',
    desc: 'Концептуальная настройка туннеля',
    icon: '\u{1F512}',
    steps: [
      { instruction: 'Проверьте SSH-доступ к серверу', check: (cmd) => cmd.includes('ssh'), hint: 'ssh user@server.com' },
      { instruction: 'Проверьте безопасные соединения', check: (cmd) => cmd.includes('ss') || cmd.includes('netstat'), hint: 'ss' },
      { instruction: 'Проверьте TLS-соединение', check: (cmd) => cmd.includes('curl'), hint: 'curl https://example.com' },
      { instruction: 'Просмотрите параметры Wi-Fi', check: (cmd) => cmd.includes('iwconfig'), hint: 'iwconfig' },
    ],
    xp: 15
  },
  {
    id: 'troubleshooting',
    title: '9. Диагностика неисправностей',
    desc: 'Найти и исправить проблему в сети',
    icon: '\u{1F527}',
    steps: [
      { instruction: 'Проверьте состояние интерфейсов', check: (cmd) => cmd.includes('ifconfig') || cmd.includes('ip addr') || cmd.includes('ip a'), hint: 'ifconfig' },
      { instruction: 'Проверьте DNS-разрешение', check: (cmd) => cmd.includes('nslookup') || cmd.includes('dig'), hint: 'nslookup google.com' },
      { instruction: 'Проверьте маршрут до проблемного хоста', check: (cmd) => cmd.includes('traceroute') || cmd.includes('mtr'), hint: 'traceroute google.com' },
      { instruction: 'Перехватите пакеты для анализа', check: (cmd) => cmd.includes('tcpdump'), hint: 'tcpdump -i eth0 -c 5' },
      { instruction: 'Проверьте открытые порты', check: (cmd) => cmd.includes('ss') || cmd.includes('netstat'), hint: 'ss' },
    ],
    xp: 25
  },
  {
    id: 'monitoring',
    title: '10. Мониторинг сети',
    desc: 'Анализ логов, соединений, трафика',
    icon: '\u{1F4CA}',
    steps: [
      { instruction: 'Просмотрите системный журнал', check: (cmd) => cmd.includes('cat') && cmd.includes('syslog'), hint: 'cat /var/log/syslog' },
      { instruction: 'Проверьте журнал аутентификации', check: (cmd) => cmd.includes('cat') && cmd.includes('auth.log'), hint: 'cat /var/log/auth.log' },
      { instruction: 'Просмотрите логи веб-сервера', check: (cmd) => cmd.includes('cat') && cmd.includes('access.log'), hint: 'cat /var/log/nginx/access.log' },
      { instruction: 'Поищите ошибки аутентификации в логах', check: (cmd) => cmd.includes('grep') && (cmd.includes('auth') || cmd.includes('fail') || cmd.includes('Failed')), hint: 'grep "Failed" /var/log/auth.log' },
      { instruction: 'Мониторьте логи в реальном времени', check: (cmd) => cmd.includes('tail') && cmd.includes('-f'), hint: 'tail -f /var/log/syslog' },
    ],
    xp: 25
  }
];
