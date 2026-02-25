/* ==================== VIRTUAL FILESYSTEM ==================== */
/* Эмуляция Linux-подобной файловой системы для терминала        */

export class VirtualFS {
  constructor() {
    // Внутреннее хранилище: плоский словарь путь → {type, content, perm}
    this._nodes = {};
    this._initDefault();
  }

  /** Прочитать файл. Возвращает строку или null */
  readFile(path) {
    const abs = this._normalize(path);
    const n = this._nodes[abs];
    return (n && n.type === 'file') ? n.content : null;
  }

  /** Записать файл (создаёт родительские каталоги) */
  writeFile(path, content) {
    const abs = this._normalize(path);
    this._mkdirRec(this._parent(abs));
    this._nodes[abs] = { type: 'file', content: String(content), perm: '-rw-r--r--' };
  }

  /** Проверка существования: 'file' | 'dir' | null */
  exists(path) {
    const abs = this._normalize(path);
    const n = this._nodes[abs];
    return n ? n.type : null;
  }

  /** Список содержимого каталога → [{name, type}] или null */
  listDir(path) {
    const abs = this._normalize(path);
    if (this.exists(abs) !== 'dir') return null;
    const prefix = abs === '/' ? '/' : abs + '/';
    const seen = new Set();
    const result = [];
    for (const key of Object.keys(this._nodes)) {
      if (key === abs) continue;
      if (!key.startsWith(prefix)) continue;
      const rest = key.slice(prefix.length);
      const name = rest.split('/')[0];
      if (!name || seen.has(name)) continue;
      seen.add(name);
      result.push({ name, type: this._nodes[prefix + name]?.type || 'dir' });
    }
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }

  /** Создать каталог (рекурсивно) */
  mkdir(path) { this._mkdirRec(this._normalize(path)); }

  /** Разрешить относительный путь относительно cwd */
  resolvePath(cwd, rel) {
    if (!rel || rel === '.') return this._normalize(cwd);
    if (rel.startsWith('/')) return this._normalize(rel);
    return this._normalize(cwd + '/' + rel);
  }

  /** Получить строку прав (напр. '-rw-r--r--') */
  getPermissions(path) {
    const abs = this._normalize(path);
    const n = this._nodes[abs];
    if (!n) return null;
    return n.perm || (n.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
  }

  /** Размер файла в байтах (длина контента в UTF-8) */
  getSize(path) {
    const abs = this._normalize(path);
    const n = this._nodes[abs];
    if (!n || n.type !== 'file') return 0;
    return new Blob([n.content]).size;
  }

  _normalize(p) {
    const parts = p.replace(/\/+/g, '/').split('/').filter(Boolean);
    const stack = [];
    for (const s of parts) {
      if (s === '..') stack.pop();
      else if (s !== '.') stack.push(s);
    }
    return '/' + stack.join('/');
  }

  _parent(abs) {
    const idx = abs.lastIndexOf('/');
    return idx <= 0 ? '/' : abs.slice(0, idx);
  }

  _mkdirRec(abs) {
    if (this._nodes[abs]) return;
    this._nodes[abs] = { type: 'dir', perm: 'drwxr-xr-x' };
    if (abs !== '/') this._mkdirRec(this._parent(abs));
  }

  _addDir(path)          { this._mkdirRec(this._normalize(path)); }
  _addFile(path, content, perm = '-rw-r--r--') {
    const abs = this._normalize(path);
    this._mkdirRec(this._parent(abs));
    this._nodes[abs] = { type: 'file', content, perm };
  }

  _initDefault() {
    this._addDir('/');

    /* ===== /etc/network/interfaces ===== */
    this._addFile('/etc/network/interfaces', `# /etc/network/interfaces
# Конфигурация сетевых интерфейсов (Debian/Ubuntu)
# Этот файл описывает доступные сетевые интерфейсы

# Локальная петля — обязательный интерфейс
auto lo
iface lo inet loopback

# Основной Ethernet-адаптер (статический IP)
auto eth0
iface eth0 inet static
    address   192.168.1.100
    netmask   255.255.255.0
    gateway   192.168.1.1
    dns-nameservers 8.8.8.8 8.8.4.4
`);

    /* ===== /etc/resolv.conf ===== */
    this._addFile('/etc/resolv.conf', `# /etc/resolv.conf
# Настройки DNS-резолвера
# Система использует указанные серверы для разрешения доменных имён

nameserver 8.8.8.8
nameserver 8.8.4.4
search localdomain
`);

    /* ===== /etc/hosts ===== */
    this._addFile('/etc/hosts', `# /etc/hosts
# Статическая таблица соответствия имён и IP-адресов
# Имеет приоритет над DNS-запросами

127.0.0.1       localhost
127.0.1.1       netlab-student
192.168.1.1     gateway router
192.168.1.10    server.local server
`);

    /* ===== /etc/hostname ===== */
    this._addFile('/etc/hostname', `netlab-student
`);

    /* ===== /etc/sysctl.conf ===== */
    this._addFile('/etc/sysctl.conf', `# /etc/sysctl.conf
# Параметры ядра Linux (сеть, безопасность, память)
# Применить: sysctl -p

# Пересылка IP-пакетов между интерфейсами (маршрутизация)
# 0 = выключено, 1 = включено
net.ipv4.ip_forward = 0

# Защита от SYN-flood атак
net.ipv4.tcp_syncookies = 1

# Игнорировать ICMP-перенаправления (безопасность)
net.ipv4.conf.all.accept_redirects = 0

# Проверка обратного пути (anti-spoofing)
net.ipv4.conf.all.rp_filter = 1
`);

    /* ===== /etc/iptables/rules.v4 ===== */
    this._addFile('/etc/iptables/rules.v4', `# /etc/iptables/rules.v4
# Правила межсетевого экрана (файрвол)
# Загружаются при старте через iptables-restore

*filter
:INPUT ACCEPT [0:0]
:FORWARD DROP [0:0]
:OUTPUT ACCEPT [0:0]

# Разрешить уже установленные соединения
-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Разрешить трафик на loopback
-A INPUT -i lo -j ACCEPT

# Разрешить SSH (порт 22)
-A INPUT -p tcp --dport 22 -j ACCEPT

# Разрешить HTTP (порт 80) и HTTPS (порт 443)
-A INPUT -p tcp --dport 80 -j ACCEPT
-A INPUT -p tcp --dport 443 -j ACCEPT

# Разрешить ICMP (ping)
-A INPUT -p icmp --icmp-type echo-request -j ACCEPT

# Остальное — отклонить
-A INPUT -j DROP

COMMIT
`);

    /* ===== /etc/dhcp/dhcpd.conf ===== */
    this._addFile('/etc/dhcp/dhcpd.conf', `# /etc/dhcp/dhcpd.conf
# Конфигурация DHCP-сервера (isc-dhcp-server)
# DHCP автоматически раздаёт IP-адреса клиентам в сети

# Время аренды адреса в секундах
default-lease-time 600;
max-lease-time 7200;

# Подсеть 192.168.1.0/24
subnet 192.168.1.0 netmask 255.255.255.0 {
    range 192.168.1.100 192.168.1.200;
    option routers 192.168.1.1;
    option domain-name-servers 8.8.8.8, 8.8.4.4;
    option domain-name "localdomain";
}
`);

    /* ===== /etc/bind/named.conf ===== */
    this._addFile('/etc/bind/named.conf', `// /etc/bind/named.conf
// Конфигурация DNS-сервера BIND9
// BIND преобразует доменные имена в IP-адреса

options {
    directory "/var/cache/bind";
    forwarders { 8.8.8.8; 8.8.4.4; };
    listen-on { 127.0.0.1; 192.168.1.100; };
    allow-query { any; };
};

// Прямая зона — имя → IP
zone "example.local" {
    type master;
    file "/etc/bind/zones/example.local.db";
};

// Обратная зона — IP → имя
zone "1.168.192.in-addr.arpa" {
    type master;
    file "/etc/bind/zones/192.168.1.rev";
};
`);

    /* ===== /etc/bind/zones/example.local.db ===== */
    this._addFile('/etc/bind/zones/example.local.db', `; /etc/bind/zones/example.local.db
; Файл прямой DNS-зоны для домена example.local
; SOA — начало авторитетной записи зоны

$TTL    86400
@   IN  SOA ns1.example.local. admin.example.local. (
            2024010101  ; Серийный номер (год-мес-день-ревизия)
            3600        ; Refresh — обновление вторичным сервером
            900         ; Retry — повтор при ошибке
            604800      ; Expire — срок жизни зоны
            86400 )     ; Minimum TTL

; NS-записи — серверы имён зоны
    IN  NS  ns1.example.local.

; A-записи — соответствие имён и IPv4-адресов
ns1         IN  A   192.168.1.100
www         IN  A   192.168.1.10
mail        IN  A   192.168.1.20
gateway     IN  A   192.168.1.1

; CNAME — псевдонимы
ftp         IN  CNAME   www.example.local.
`);

    /* ===== /etc/nginx/nginx.conf ===== */
    this._addFile('/etc/nginx/nginx.conf', `# /etc/nginx/nginx.conf
# Конфигурация веб-сервера Nginx
# Nginx обрабатывает HTTP-запросы и раздаёт статику

worker_processes auto;
events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;

    # Виртуальный хост — порт 80
    server {
        listen       80;
        server_name  www.example.local;
        root         /var/www/html;
        index        index.html;

        location / {
            try_files $uri $uri/ =404;
        }

        # Проксирование API на бэкенд
        location /api/ {
            proxy_pass http://127.0.0.1:3000;
        }
    }
}
`);

    /* ===== /var/log/syslog ===== */
    const svcs = ['kernel', 'systemd', 'NetworkManager', 'dhclient', 'sshd', 'cron'];
    const msgs = [
      'Started Session 4 of user student.', 'eth0: link up, speed 1000 Mb/s, full duplex',
      'DHCPACK of 192.168.1.100 from 192.168.1.1', 'Accepted publickey for student from 192.168.1.50 port 52431',
      'Firewall: INPUT DROP IN=eth0 SRC=10.0.0.5 DST=192.168.1.100 PROTO=TCP DPT=23',
      'Rotating log files', 'ARP: 192.168.1.1 is at aa:bb:cc:dd:ee:01 on eth0',
      'systemd-resolved: Using DNS server 8.8.8.8',
      'UFW BLOCK IN=eth0 SRC=203.0.113.42 DST=192.168.1.100 PROTO=TCP DPT=445',
      'rsyslogd: start', 'TCP: rto_min changed from 200 to 120',
      'device eth0 entered promiscuous mode', 'NetworkManager: connection "Wired" activated',
      'CRON: (root) CMD (/usr/bin/apt-get update)',
      'dbus-daemon: Successfully activated service org.freedesktop.nm_dispatcher',
      'net_ratelimit: 5 callbacks suppressed', 'Starting Daily apt activities...',
      'br0: port 1(eth0) entered forwarding state', 'Stopping User Manager for UID 1000...',
      'Time has been changed',
    ];
    this._addFile('/var/log/syslog', msgs.map((m, i) => {
      const h = String(8 + Math.floor(i * 0.6)).padStart(2, '0');
      const mn = String((i * 3) % 60).padStart(2, '0');
      const s = String((i * 7) % 60).padStart(2, '0');
      return `Feb 25 ${h}:${mn}:${s} netlab-student ${svcs[i % svcs.length]}[${1000 + i}]: ${m}`;
    }).join('\n') + '\n');

    /* ===== /var/log/auth.log ===== */
    this._addFile('/var/log/auth.log', [
      'Feb 25 08:01:12 netlab-student sshd[2201]: Accepted publickey for student from 192.168.1.50 port 52431 ssh2',
      'Feb 25 08:01:12 netlab-student sshd[2201]: pam_unix(sshd:session): session opened for user student',
      'Feb 25 09:15:43 netlab-student sshd[2305]: Failed password for root from 10.0.0.88 port 44321 ssh2',
      'Feb 25 09:15:46 netlab-student sshd[2305]: Failed password for root from 10.0.0.88 port 44321 ssh2',
      'Feb 25 09:15:49 netlab-student sshd[2305]: Connection closed by 10.0.0.88 port 44321 [preauth]',
      'Feb 25 10:30:00 netlab-student sudo: student : TTY=pts/0 ; PWD=/home/student ; USER=root ; COMMAND=/usr/bin/apt update',
      'Feb 25 11:00:05 netlab-student sshd[2410]: Accepted password for student from 192.168.1.55 port 60102 ssh2',
    ].join('\n') + '\n');

    /* ===== /var/log/nginx/access.log ===== */
    this._addFile('/var/log/nginx/access.log', [
      '192.168.1.50 - - [25/Feb/2026:08:12:01 +0300] "GET / HTTP/1.1" 200 3456 "-" "Mozilla/5.0"',
      '192.168.1.50 - - [25/Feb/2026:08:12:02 +0300] "GET /style.css HTTP/1.1" 200 1024 "-" "Mozilla/5.0"',
      '192.168.1.55 - - [25/Feb/2026:09:30:15 +0300] "GET /api/data HTTP/1.1" 200 512 "-" "curl/7.88.1"',
      '10.0.0.5 - - [25/Feb/2026:10:05:33 +0300] "POST /login HTTP/1.1" 401 128 "-" "python-requests/2.28"',
      '192.168.1.50 - - [25/Feb/2026:11:00:00 +0300] "GET /favicon.ico HTTP/1.1" 404 162 "-" "Mozilla/5.0"',
    ].join('\n') + '\n');

    /* ===== /proc/net/tcp ===== */
    // Формат: sl local_address rem_address st tx_queue rx_queue
    this._addFile('/proc/net/tcp',
`  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
   0: 00000000:0016 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 12345
   1: 6401A8C0:0050 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 12346
   2: 6401A8C0:C6A0 0A01A8C0:01BB 01 00000000:00000000 02:00000A00 00000000  1000        0 12500
   3: 6401A8C0:D4E2 080808080:0035 06 00000000:00000000 03:00001200 00000003  1000        0 12501
`, '-r--r--r--');
    /* ===== /proc/net/udp ===== */
    this._addFile('/proc/net/udp',
`  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
   0: 00000000:0035 00000000:0000 07 00000000:00000000 00:00000000 00000000     0        0 13000
   1: 6401A8C0:DA78 08080808:0035 01 00000000:00000000 00:00000000 00000000  1000        0 13001
`, '-r--r--r--');
    /* ===== /proc/net/arp ===== */
    this._addFile('/proc/net/arp',
`IP address       HW type     Flags       HW address            Mask     Device
192.168.1.1      0x1         0x2         aa:bb:cc:dd:ee:01     *        eth0
192.168.1.10     0x1         0x2         aa:bb:cc:dd:ee:10     *        eth0
192.168.1.50     0x1         0x2         de:ad:be:ef:00:50     *        eth0
192.168.1.55     0x1         0x2         de:ad:be:ef:00:55     *        eth0
`, '-r--r--r--');

    /* ===== /home/student/.bashrc ===== */
    this._addFile('/home/student/.bashrc', `# ~/.bashrc
# Настройки оболочки Bash для пользователя student
# Выполняется при каждом запуске интерактивного терминала

# Цветной промпт с именем хоста и текущим каталогом
export PS1='\\[\\033[01;32m\\]student@netlab\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '

# Полезные сокращения (алиасы)
alias ll='ls -la'
alias la='ls -A'
alias grep='grep --color=auto'
alias ports='ss -tulnp'
alias myip='ip -4 addr show eth0 | grep inet'

# Переменные окружения
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export EDITOR=nano
export LANG=ru_RU.UTF-8
`);
  }
}
