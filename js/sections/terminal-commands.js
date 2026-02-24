/* ==================== TERMINAL: Command Implementations ==================== */
import { sleep } from '../core/utils.js';
import { addXP } from '../core/gamification.js';
import { SIM_NET, resolveHost, termLine, termScroll } from './terminal-network.js';

export function buildCommands(termOutput) {
  const tl = (text, cls) => termLine(termOutput, text, cls);
  const ts = () => termScroll(termOutput);

  const TERM_COMMANDS = {
    help() {
      tl('═══ Диагностика и мониторинг ═══', 'header');
      const diag = [
        ['ping &lt;host&gt;', 'ICMP эхо — проверка доступности'],
        ['traceroute &lt;host&gt;', 'Трассировка маршрута (хопы)'],
        ['mtr &lt;host&gt;', 'ping + traceroute в реальном времени'],
        ['tcpdump [-i iface] [-c N]', 'Перехват сетевых пакетов'],
        ['nmap &lt;host&gt;', 'Сканирование портов и сервисов'],
      ];
      diag.forEach(c => tl(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      tl('');
      tl('═══ DNS и домены ═══', 'header');
      const dns = [
        ['nslookup &lt;host&gt;', 'DNS-запрос (A, MX, NS записи)'],
        ['whois &lt;domain&gt;', 'Регистрационные данные домена'],
      ];
      dns.forEach(c => tl(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      tl('');
      tl('═══ Интерфейсы и маршруты ═══', 'header');
      const iface = [
        ['ifconfig', 'Сетевые интерфейсы (IP, MAC, MTU)'],
        ['ip addr | route | neigh | link', 'Современная замена ifconfig/route/arp'],
        ['ethtool &lt;iface&gt;', 'Параметры Ethernet (скорость, дуплекс)'],
        ['iwconfig', 'Параметры Wi-Fi (ESSID, сигнал)'],
        ['route', 'Таблица маршрутизации'],
        ['arp', 'ARP-таблица (IP → MAC)'],
        ['hostname', 'Имя машины и FQDN'],
      ];
      iface.forEach(c => tl(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      tl('');
      tl('═══ Соединения и безопасность ═══', 'header');
      const conn = [
        ['ss', 'Socket Statistics (соединения, порты)'],
        ['netstat', 'Активные соединения (устаревший)'],
        ['iptables -L', 'Правила файрвола'],
        ['telnet &lt;host&gt; &lt;port&gt;', 'Проверка TCP-порта'],
        ['ssh &lt;user@host&gt;', 'Удалённое подключение (SSH)'],
      ];
      conn.forEach(c => tl(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      tl('');
      tl('═══ HTTP и файлы ═══', 'header');
      const http = [
        ['curl &lt;url&gt;', 'HTTP-запрос (заголовки ответа)'],
        ['wget &lt;url&gt;', 'Скачать файл'],
      ];
      http.forEach(c => tl(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      tl('');
      tl('  <span class="term-cmd">clear                         </span> Очистить экран');
      tl('  <span class="term-cmd">help                          </span> Эта справка');
      addXP(2);
    },

    clear() { termOutput.innerHTML = ''; },

    async ping(args) {
      const host = args[0];
      if (!host) { tl('Использование: ping &lt;host&gt;', 'error'); return; }
      const resolved = resolveHost(host);
      tl(`PING ${host} (${resolved.ip}) 56(84) bytes of data.`);
      ts();
      const baseLatency = resolved.hops * 3 + Math.random() * 10;
      for (let i = 0; i < 4; i++) {
        await sleep(800);
        const lat = (baseLatency + (Math.random() - 0.5) * 8).toFixed(1);
        const ttl = 64 - resolved.hops;
        tl(`64 bytes from <span class="term-ip">${resolved.ip}</span>: icmp_seq=${i + 1} ttl=${ttl} time=<span class="term-time">${lat} ms</span>`);
        ts();
      }
      const avg = baseLatency.toFixed(1);
      tl(`\n--- ${host} ping statistics ---`);
      tl(`4 packets transmitted, 4 received, <span class="term-ok">0% packet loss</span>`);
      tl(`rtt min/avg/max = ${(baseLatency - 4).toFixed(1)}/${avg}/${(baseLatency + 4).toFixed(1)} ms`);
      addXP(3);
    },

    async traceroute(args) {
      const host = args[0];
      if (!host) { tl('Использование: traceroute &lt;host&gt;', 'error'); return; }
      const resolved = resolveHost(host);
      tl(`traceroute to ${host} (${resolved.ip}), 30 hops max, 60 byte packets`);
      ts();
      const routers = ['gateway', 'isp-gw', 'core-1', 'core-2', 'ix-peer', 'cdn-edge', 'border-gw', 'dc-spine', 'dc-leaf', 'rack-sw', 'target'];
      for (let i = 0; i < resolved.hops; i++) {
        await sleep(600);
        const rIp = `${10 + i * 12}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${1 + Math.floor(Math.random() * 254)}`;
        const t1 = ((i + 1) * 3 + Math.random() * 5).toFixed(1);
        const t2 = ((i + 1) * 3 + Math.random() * 5).toFixed(1);
        const t3 = ((i + 1) * 3 + Math.random() * 5).toFixed(1);
        const rName = (routers[i] || 'hop-' + (i + 1)) + '.net';
        tl(` ${String(i + 1).padStart(2)}  ${rName} (<span class="term-ip">${rIp}</span>)  <span class="term-time">${t1} ms  ${t2} ms  ${t3} ms</span>`);
        ts();
      }
      await sleep(600);
      const ft = ((resolved.hops) * 3 + Math.random() * 3).toFixed(1);
      tl(` ${String(resolved.hops + 1).padStart(2)}  ${host} (<span class="term-ip">${resolved.ip}</span>)  <span class="term-time">${ft} ms  ${ft} ms  ${ft} ms</span>`);
      addXP(3);
    },

    nslookup(args) {
      const host = args[0];
      if (!host) { tl('Использование: nslookup &lt;host&gt;', 'error'); return; }
      const resolved = resolveHost(host);
      tl('Server:   8.8.8.8');
      tl('Address:  8.8.8.8#53\n');
      tl('Non-authoritative answer:');
      tl(`Name:     ${host}`);
      tl(`Address:  <span class="term-ip">${resolved.ip}</span>`);
      addXP(2);
    },

    ifconfig() {
      SIM_NET.interfaces.forEach(iface => {
        tl(`<span class="term-cmd">${iface.name}</span>: flags=4163&lt;${iface.status},BROADCAST,MULTICAST&gt;  mtu ${iface.mtu}`);
        tl(`        inet <span class="term-ip">${iface.ip}</span>  netmask ${iface.mask}`);
        tl(`        ether ${iface.mac}`);
        tl(`        RX packets ${iface.rx}  TX packets ${iface.tx}`);
        tl('');
      });
      addXP(2);
    },

    netstat() {
      tl('Proto  Local Address            Foreign Address          State', 'header');
      SIM_NET.connections.forEach(c => {
        const stateColor = c.state === 'ESTABLISHED' ? 'term-ok' : c.state === 'LISTEN' ? 'term-time' : '';
        tl(`${c.proto.padEnd(7)}${c.local.padEnd(25)}${c.remote.padEnd(25)}<span class="${stateColor}">${c.state}</span>`);
      });
      addXP(2);
    },

    arp() {
      tl('Address          HWtype  HWaddress           Iface', 'header');
      SIM_NET.arp.forEach(a => {
        tl(`<span class="term-ip">${a.ip.padEnd(17)}</span>ether   ${a.mac}   ${a.iface}`);
      });
      addXP(2);
    },

    route() {
      tl('Destination      Gateway          Genmask          Iface    Metric', 'header');
      SIM_NET.routes.forEach(r => {
        tl(`${r.dest.padEnd(17)}${r.gw.padEnd(17)}${r.mask.padEnd(17)}${r.iface.padEnd(9)}${r.metric}`);
      });
      addXP(2);
    },

    curl(args) {
      const url = args[0];
      if (!url) { tl('Использование: curl &lt;url&gt;', 'error'); return; }
      const host = url.replace(/^https?:\/\//, '').split('/')[0];
      const resolved = resolveHost(host);
      tl(`> GET / HTTP/1.1`);
      tl(`> Host: ${host}`);
      tl(`> User-Agent: curl/7.88.1`);
      tl(`> Accept: */*`);
      tl('');
      tl('<span class="term-ok">HTTP/1.1 200 OK</span>');
      tl(`Server: nginx/1.24.0`);
      tl(`Date: ${new Date().toUTCString()}`);
      tl(`Content-Type: text/html; charset=UTF-8`);
      tl(`Content-Length: 1256`);
      tl(`Connection: keep-alive`);
      tl(`X-Served-By: cache-${resolved.ip.split('.')[0]}`);
      tl(`Cache-Control: max-age=604800`);
      addXP(2);
    },

    whois(args) {
      const domain = args[0];
      if (!domain) { tl('Использование: whois &lt;domain&gt;', 'error'); return; }
      const resolved = resolveHost(domain);
      tl(`Domain Name: ${domain.toUpperCase()}`, 'header');
      tl(`Registry Domain ID: D${Math.floor(Math.random() * 9e8)}`);
      tl(`Registrar: Example Registrar, Inc.`);
      tl(`Created: 2005-08-13T04:16:17Z`);
      tl(`Updated: 2024-08-14T06:35:09Z`);
      tl(`Expires: 2025-08-13T04:16:17Z`);
      tl(`Status: clientDeleteProhibited`);
      tl(`Name Server: ns1.${domain}`);
      tl(`Name Server: ns2.${domain}`);
      tl(`IP Address: <span class="term-ip">${resolved.ip}</span>`);
      addXP(2);
    },

    hostname() {
      tl('osi-lab.local');
      tl('');
      tl('Hostname:  osi-lab');
      tl('FQDN:     osi-lab.local');
      tl('IP:       192.168.1.100');
      addXP(1);
    },

    ss(args) {
      tl('State      Recv-Q  Send-Q  Local Address:Port    Peer Address:Port', 'header');
      SIM_NET.connections.forEach(c => {
        const st = c.state || 'UNCONN';
        const rq = st === 'ESTABLISHED' ? Math.floor(Math.random() * 100) : 0;
        tl(`<span class="${st === 'ESTABLISHED' ? 'term-ok' : 'term-time'}">${st.padEnd(11)}</span>${String(rq).padEnd(8)}0       ${c.local.padEnd(23)}${c.remote}`);
      });
      addXP(2);
    },

    async tcpdump(args) {
      const iface = args.includes('-i') ? args[args.indexOf('-i') + 1] || 'eth0' : 'eth0';
      const count = args.includes('-c') ? parseInt(args[args.indexOf('-c') + 1]) || 5 : 5;
      tl(`tcpdump: listening on ${iface}, link-type EN10MB (Ethernet), capture size 262144 bytes`);
      ts();
      const protos = ['TCP','UDP','ICMP','TCP','TCP','UDP','TCP','ARP'];
      const ports = [80,443,53,22,8080,3000,5432,0];
      for (let i = 0; i < Math.min(count, 8); i++) {
        await sleep(400 + Math.random() * 300);
        const now = new Date();
        const stamp = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(Math.floor(Math.random()*999)).padStart(3,'0')}`;
        const proto = protos[i % protos.length];
        const srcP = 49000 + Math.floor(Math.random() * 16000);
        const dstP = ports[i % ports.length] || 443;
        const len = 40 + Math.floor(Math.random() * 1400);
        if (proto === 'ARP') {
          tl(`<span class="term-time">${stamp}</span> ARP, Request who-has 192.168.1.1 tell <span class="term-ip">192.168.1.100</span>, length 28`);
        } else if (proto === 'ICMP') {
          tl(`<span class="term-time">${stamp}</span> IP <span class="term-ip">192.168.1.100</span> > 8.8.8.8: ICMP echo request, id ${1000+i}, seq ${i+1}, length 64`);
        } else {
          const flags = proto === 'TCP' ? ['[S]','[S.]','[.]','[P.]','[F.]'][Math.floor(Math.random()*5)] : '';
          const src = `<span class="term-ip">192.168.1.100</span>.${srcP}`;
          const dst = `<span class="term-ip">${93+i*10}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${1+Math.floor(Math.random()*254)}</span>.${dstP}`;
          tl(`<span class="term-time">${stamp}</span> IP ${src} > ${dst}: ${proto} ${flags} seq ${1000+i*1460}:${1000+(i+1)*1460}, ack ${5000+i*100}, win 65535, length ${len}`);
        }
        ts();
      }
      tl(`\n${count} packets captured`);
      addXP(3);
    },

    async nmap(args) {
      const host = args[0];
      if (!host) { tl('Использование: nmap &lt;host&gt;', 'error'); return; }
      const resolved = resolveHost(host);
      tl(`Starting Nmap 7.94 ( https://nmap.org )`);
      tl(`Nmap scan report for ${host} (${resolved.ip})`);
      tl(`Host is up (<span class="term-time">${(0.005 + Math.random() * 0.03).toFixed(3)}s</span> latency).\n`);
      await sleep(800);
      tl('PORT      STATE    SERVICE         VERSION', 'header');
      const openPorts = [
        ['22/tcp','open','ssh','OpenSSH 8.9'],
        ['53/tcp','open','domain','BIND 9.18'],
        ['80/tcp','open','http','nginx 1.24.0'],
        ['443/tcp','open','ssl/http','nginx 1.24.0'],
        ['3306/tcp','filtered','mysql',''],
        ['5432/tcp','closed','postgresql',''],
        ['8080/tcp','open','http-proxy','Squid 5.7'],
        ['8443/tcp','open','ssl/http','Apache 2.4']
      ];
      for (const p of openPorts) {
        await sleep(200);
        const stColor = p[1] === 'open' ? 'term-ok' : p[1] === 'filtered' ? 'term-time' : 'term-fail';
        tl(`${p[0].padEnd(10)}<span class="${stColor}">${p[1].padEnd(9)}</span>${p[2].padEnd(16)}${p[3]}`);
        ts();
      }
      tl(`\nNmap done: 1 IP address (1 host up) scanned in <span class="term-time">${(2 + Math.random() * 3).toFixed(2)}</span> seconds`);
      addXP(3);
    },

    iptables(args) {
      if (args[0] === '-L' || args.length === 0) {
        tl('Chain INPUT (policy ACCEPT)', 'header');
        tl('target     prot  source          destination');
        tl('<span class="term-ok">ACCEPT</span>     tcp   0.0.0.0/0       0.0.0.0/0       tcp dpt:22');
        tl('<span class="term-ok">ACCEPT</span>     tcp   0.0.0.0/0       0.0.0.0/0       tcp dpt:80');
        tl('<span class="term-ok">ACCEPT</span>     tcp   0.0.0.0/0       0.0.0.0/0       tcp dpt:443');
        tl('<span class="term-fail">DROP</span>       tcp   0.0.0.0/0       0.0.0.0/0       tcp dpt:3306');
        tl('<span class="term-ok">ACCEPT</span>     icmp  0.0.0.0/0       0.0.0.0/0');
        tl('');
        tl('Chain FORWARD (policy DROP)', 'header');
        tl('target     prot  source          destination');
        tl('');
        tl('Chain OUTPUT (policy ACCEPT)', 'header');
        tl('target     prot  source          destination');
        tl('<span class="term-ok">ACCEPT</span>     all   0.0.0.0/0       0.0.0.0/0');
      } else {
        tl(`iptables: правило ${args.join(' ')} добавлено (симуляция)`, 'info');
      }
      addXP(2);
    },

    async telnet(args) {
      const host = args[0] || 'localhost';
      const port = args[1] || '80';
      const resolved = resolveHost(host);
      tl(`Trying <span class="term-ip">${resolved.ip}</span>...`);
      await sleep(600);
      if (['80','443','22','8080'].includes(port)) {
        tl(`Connected to ${host}.`);
        tl(`Escape character is '^]'.`);
        if (port === '80') tl('<span class="term-info">HTTP/1.1 200 OK</span>');
        else if (port === '22') tl('<span class="term-info">SSH-2.0-OpenSSH_8.9</span>');
      } else {
        tl(`<span class="term-fail">telnet: Unable to connect to remote host: Connection refused</span>`);
      }
      addXP(2);
    },

    async mtr(args) {
      const host = args[0];
      if (!host) { tl('Использование: mtr &lt;host&gt;', 'error'); return; }
      const resolved = resolveHost(host);
      tl(`mtr to ${host} (${resolved.ip})`, 'header');
      tl('Host                          Loss%  Snt   Last   Avg  Best  Wrst', 'header');
      for (let i = 0; i < resolved.hops + 1; i++) {
        await sleep(300);
        const rIp = i === resolved.hops ? resolved.ip : `${10+i*12}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${1+Math.floor(Math.random()*254)}`;
        const rName = i === resolved.hops ? host : `hop-${i+1}.net`;
        const base = (i+1) * 2.5 + Math.random() * 3;
        const loss = Math.random() < 0.1 ? (Math.random()*5).toFixed(1) : '0.0';
        tl(`${String(i+1).padStart(2)}. ${(rName+' ('+rIp+')').padEnd(36)} <span class="${parseFloat(loss) > 0 ? 'term-fail' : 'term-ok'}">${loss.padStart(5)}%</span>   10  <span class="term-time">${base.toFixed(1).padStart(5)}  ${(base+1).toFixed(1).padStart(5)}  ${(base-1).toFixed(1).padStart(5)}  ${(base+5).toFixed(1).padStart(5)}</span>`);
        ts();
      }
      addXP(3);
    },

    ethtool(args) {
      const iface = args[0] || 'eth0';
      const ifData = SIM_NET.interfaces.find(i => i.name === iface);
      if (!ifData) { tl(`ethtool: ${iface}: нет такого интерфейса`, 'error'); return; }
      tl(`Settings for ${iface}:`, 'header');
      tl(`        Speed: ${iface === 'lo' ? '10000Mb/s' : '1000Mb/s'}`);
      tl(`        Duplex: Full`);
      tl(`        Auto-negotiation: on`);
      tl(`        Port: Twisted Pair`);
      tl(`        Link detected: <span class="term-ok">yes</span>`);
      tl(`        Supported link modes:   10baseT/Half 10baseT/Full`);
      tl(`                                100baseT/Half 100baseT/Full`);
      tl(`                                1000baseT/Full`);
      tl(`        Supports Wake-on: g`);
      tl(`        Wake-on: d`);
      tl(`        Current message level: 0x00000007 (7)`);
      tl(`        Driver: e1000e`);
      tl(`        Firmware-version: 3.25`);
      addXP(2);
    },

    iwconfig(args) {
      tl('wlan0     IEEE 802.11  ESSID:"OSI-Lab-5G"', 'header');
      tl('          Mode:Managed  Frequency:5.18 GHz  Access Point: 00:1A:2B:3C:4D:5E');
      tl('          Bit Rate=866.7 Mb/s   Tx-Power=20 dBm');
      tl('          Retry short limit:7   RTS thr:off   Fragment thr:off');
      tl('          Power Management:on');
      tl('          Link Quality=<span class="term-ok">68/70</span>  Signal level=<span class="term-ok">-42 dBm</span>');
      tl('          Rx invalid nwid:0  Rx invalid crypt:0  Rx invalid frag:0');
      tl('          Tx excessive retries:3  Invalid misc:0   Missed beacon:0');
      tl('');
      tl('eth0      no wireless extensions.');
      tl('lo        no wireless extensions.');
      addXP(2);
    },

    async wget(args) {
      const url = args[0] || 'http://example.com/index.html';
      const host = url.replace(/^https?:\/\//, '').split('/')[0];
      const file = url.split('/').pop() || 'index.html';
      tl(`--${new Date().toISOString().replace('T',' ').slice(0,19)}--  ${url}`);
      tl(`Resolving ${host}... <span class="term-ip">${resolveHost(host).ip}</span>`);
      tl(`Connecting to ${host}... connected.`);
      tl(`HTTP request sent, awaiting response... <span class="term-ok">200 OK</span>`);
      tl(`Length: 12543 (12K) [text/html]`);
      tl(`Saving to: '${file}'`);
      await sleep(400);
      tl('');
      tl(`${file}            100%[===================>]  12.25K  --.-KB/s    in 0.001s`);
      tl(`\n<span class="term-ok">'${file}' saved [12543/12543]</span>`);
      addXP(2);
    },

    ssh(args) {
      const target = args[0] || 'user@server';
      const host = target.includes('@') ? target.split('@')[1] : target;
      const resolved = resolveHost(host);
      tl(`ssh: connect to host ${host} port 22 (${resolved.ip})`);
      tl('Host key fingerprint: SHA256:' + Array.from({length:32}, () => Math.floor(Math.random()*16).toString(16)).join(''));
      tl('<span class="term-ok">Authentication successful (publickey).</span>');
      tl(`Welcome to ${host} (Ubuntu 22.04.3 LTS)`);
      tl(`Last login: ${new Date(Date.now() - 86400000).toUTCString()}`);
      addXP(2);
    }
  };

  // Aliases
  TERM_COMMANDS.nc = TERM_COMMANDS.telnet;
  TERM_COMMANDS.netcat = TERM_COMMANDS.telnet;
  TERM_COMMANDS.tracert = TERM_COMMANDS.traceroute;
  TERM_COMMANDS.dig = TERM_COMMANDS.nslookup;
  TERM_COMMANDS.host = TERM_COMMANDS.nslookup;

  TERM_COMMANDS['ip'] = function(args) {
    if (args[0] === 'addr' || args[0] === 'a') TERM_COMMANDS.ifconfig();
    else if (args[0] === 'route' || args[0] === 'r') TERM_COMMANDS.route();
    else if (args[0] === 'neigh' || args[0] === 'n') TERM_COMMANDS.arp();
    else if (args[0] === 'link' || args[0] === 'l') {
      SIM_NET.interfaces.forEach(i => tl(`${i.name}: <${i.status},BROADCAST,MULTICAST> mtu ${i.mtu} link/ether ${i.mac}`));
    }
    else tl('Использование: ip addr | ip route | ip neigh | ip link', 'error');
  };

  return TERM_COMMANDS;
}

export const TERM_CMD_INFO = [
  { cmd: 'ping', label: 'ping', desc: 'ICMP Echo Request — проверяет доступность узла, измеряет RTT (Round Trip Time) и потери.',
    params: [{ label: 'Хост', id: 'host', type: 'select', options: ['google.com','ya.ru','github.com','8.8.8.8','example.com','cloudflare.com'] }],
    flags: '<code>-c N</code> кол-во пакетов &nbsp; <code>-i N</code> интервал (сек) &nbsp; <code>-t N</code> TTL &nbsp; <code>-s N</code> размер пакета &nbsp; <code>-W N</code> таймаут',
    build: (p) => `ping ${p.host}` },
  { cmd: 'traceroute', label: 'traceroute', desc: 'Трассировка маршрута — показывает каждый хоп (маршрутизатор) от вас до узла назначения с задержками.',
    params: [{ label: 'Хост', id: 'host', type: 'select', options: ['google.com','ya.ru','github.com','8.8.8.8','example.com'] }],
    flags: '<code>-m N</code> макс. хопов &nbsp; <code>-w N</code> таймаут &nbsp; <code>-I</code> ICMP вместо UDP &nbsp; <code>-T</code> TCP SYN &nbsp; <code>-p N</code> порт',
    build: (p) => `traceroute ${p.host}` },
  { cmd: 'mtr', label: 'mtr', desc: 'Комбинация ping + traceroute в реальном времени. Показывает потери и задержку на каждом хопе.',
    params: [{ label: 'Хост', id: 'host', type: 'select', options: ['google.com','ya.ru','github.com','8.8.8.8'] }],
    flags: '<code>-r</code> отчёт &nbsp; <code>-c N</code> кол-во циклов &nbsp; <code>-n</code> без DNS &nbsp; <code>-T</code> TCP вместо ICMP',
    build: (p) => `mtr ${p.host}` },
  { cmd: 'nslookup', label: 'nslookup', desc: 'DNS-запрос — преобразует доменное имя в IP через DNS-сервер. Показывает A, MX, NS записи.',
    params: [{ label: 'Домен', id: 'host', type: 'select', options: ['google.com','ya.ru','github.com','example.com','cloudflare.com'] }],
    flags: '<code>-type=A</code> IPv4 &nbsp; <code>-type=AAAA</code> IPv6 &nbsp; <code>-type=MX</code> почта &nbsp; <code>-type=NS</code> DNS-серверы &nbsp; <code>-type=TXT</code> SPF/DKIM',
    build: (p) => `nslookup ${p.host}` },
  { cmd: 'tcpdump', label: 'tcpdump', desc: 'Перехват пакетов — главный инструмент анализа трафика. Показывает каждый пакет в реальном времени.',
    params: [{ label: 'Интерфейс', id: 'iface', type: 'select', options: ['eth0','wlan0','any'] }],
    flags: '<code>-i eth0</code> интерфейс &nbsp; <code>-c N</code> кол-во пакетов &nbsp; <code>-n</code> без DNS &nbsp; <code>-v/-vv</code> подробность &nbsp; <code>-w file.pcap</code> запись в файл &nbsp; <code>port 80</code> фильтр по порту &nbsp; <code>host IP</code> фильтр по IP &nbsp; <code>tcp/udp/icmp</code> фильтр по протоколу',
    build: (p) => `tcpdump -i ${p.iface} -c 5` },
  { cmd: 'nmap', label: 'nmap', desc: 'Сканер портов и сервисов — определяет открытые порты, ОС и версии ПО на удалённом хосте.',
    params: [{ label: 'Хост', id: 'host', type: 'select', options: ['example.com','github.com','192.168.1.1','localhost'] }],
    flags: '<code>-sS</code> SYN-скан (stealth) &nbsp; <code>-sV</code> версии сервисов &nbsp; <code>-O</code> определение ОС &nbsp; <code>-p 1-1000</code> диапазон портов &nbsp; <code>-A</code> агрессивный скан &nbsp; <code>-sU</code> UDP-скан &nbsp; <code>-Pn</code> без ping',
    build: (p) => `nmap ${p.host}` },
  { cmd: 'curl', label: 'curl', desc: 'HTTP-клиент — отправляет запросы к веб-серверам. Показывает заголовки, тело ответа, тайминги.',
    params: [{ label: 'URL', id: 'host', type: 'input', placeholder: 'example.com' }],
    flags: '<code>-I</code> только заголовки &nbsp; <code>-v</code> подробно (TLS) &nbsp; <code>-X POST</code> метод &nbsp; <code>-H "Key: Val"</code> заголовок &nbsp; <code>-d "data"</code> тело &nbsp; <code>-o file</code> сохранить &nbsp; <code>-L</code> следовать редиректам &nbsp; <code>-k</code> игнорировать SSL',
    build: (p) => `curl ${p.host || 'example.com'}` },
  { cmd: 'wget', label: 'wget', desc: 'Загрузчик файлов — скачивает файлы по HTTP/HTTPS/FTP. Поддерживает докачку и рекурсию.',
    params: [{ label: 'URL', id: 'host', type: 'input', placeholder: 'http://example.com/file.tar.gz' }],
    flags: '<code>-O file</code> имя файла &nbsp; <code>-c</code> докачка &nbsp; <code>-r</code> рекурсивно &nbsp; <code>-q</code> тихо &nbsp; <code>--limit-rate=1m</code> ограничить скорость',
    build: (p) => `wget ${p.host || 'http://example.com/index.html'}` },
  { cmd: 'ifconfig', label: 'ifconfig', desc: 'Конфигурация сетевых интерфейсов — IP, MAC, MTU, счётчики RX/TX. Устаревает, замена: ip addr.',
    params: [], flags: '<code>eth0 up/down</code> вкл/выкл &nbsp; <code>eth0 192.168.1.1 netmask 255.255.255.0</code> назначить IP &nbsp; <code>eth0 mtu 9000</code> jumbo frames', build: () => 'ifconfig' },
  { cmd: 'ss', label: 'ss', desc: 'Socket Statistics — современная замена netstat. Показывает TCP/UDP соединения, состояния, очереди.',
    params: [], flags: '<code>-t</code> TCP &nbsp; <code>-u</code> UDP &nbsp; <code>-l</code> LISTEN &nbsp; <code>-p</code> процесс &nbsp; <code>-n</code> без DNS &nbsp; <code>-s</code> статистика &nbsp; <code>-e</code> расширенная инфо &nbsp; <code>state established</code> фильтр', build: () => 'ss' },
  { cmd: 'netstat', label: 'netstat', desc: 'Активные соединения, порты и состояния. Устаревает, замена: ss.',
    params: [], flags: '<code>-t</code> TCP &nbsp; <code>-u</code> UDP &nbsp; <code>-l</code> LISTEN &nbsp; <code>-p</code> PID &nbsp; <code>-n</code> без DNS &nbsp; <code>-r</code> маршруты &nbsp; <code>-i</code> интерфейсы &nbsp; <code>-s</code> статистика', build: () => 'netstat' },
  { cmd: 'iptables', label: 'iptables', desc: 'Файрвол Linux — управление правилами фильтрации пакетов. Цепочки: INPUT, OUTPUT, FORWARD.',
    params: [], flags: '<code>-L</code> список правил &nbsp; <code>-A INPUT -p tcp --dport 22 -j ACCEPT</code> разрешить SSH &nbsp; <code>-A INPUT -j DROP</code> запретить всё &nbsp; <code>-D INPUT N</code> удалить правило &nbsp; <code>-F</code> очистить все', build: () => 'iptables -L' },
  { cmd: 'arp', label: 'arp', desc: 'ARP-таблица — соответствие IP → MAC в локальной сети. Используется для L2-адресации.',
    params: [], flags: '<code>-a</code> показать все &nbsp; <code>-d IP</code> удалить &nbsp; <code>-s IP MAC</code> статическая запись', build: () => 'arp' },
  { cmd: 'route', label: 'route', desc: 'Таблица маршрутизации — определяет через какой шлюз/интерфейс отправлять пакеты.',
    params: [], flags: '<code>-n</code> без DNS &nbsp; <code>add default gw 192.168.1.1</code> шлюз по умолчанию &nbsp; <code>add -net 10.0.0.0/8 gw 192.168.1.254</code> маршрут', build: () => 'route' },
  { cmd: 'ethtool', label: 'ethtool', desc: 'Параметры Ethernet — скорость, дуплекс, автосогласование, драйвер, Wake-on-LAN.',
    params: [{ label: 'Интерфейс', id: 'iface', type: 'select', options: ['eth0','wlan0','lo'] }],
    flags: '<code>-s eth0 speed 100 duplex full</code> установить &nbsp; <code>-S eth0</code> статистика &nbsp; <code>-i eth0</code> драйвер &nbsp; <code>-k eth0</code> offload', build: (p) => `ethtool ${p.iface}` },
  { cmd: 'iwconfig', label: 'iwconfig', desc: 'Параметры Wi-Fi — ESSID, частота, скорость, мощность, качество сигнала (Signal Level).',
    params: [], flags: '<code>wlan0 essid "Net"</code> подключиться &nbsp; <code>wlan0 txpower 15</code> мощность &nbsp; <code>wlan0 rate 54M</code> скорость', build: () => 'iwconfig' },
  { cmd: 'telnet', label: 'telnet', desc: 'Проверка TCP-соединения к порту. Используется для диагностики доступности сервисов.',
    params: [
      { label: 'Хост', id: 'host', type: 'select', options: ['example.com','localhost','192.168.1.1'] },
      { label: 'Порт', id: 'port', type: 'select', options: ['80','443','22','3306','5432','8080'] }
    ],
    flags: '', build: (p) => `telnet ${p.host} ${p.port}` },
  { cmd: 'ssh', label: 'ssh', desc: 'Защищённое удалённое подключение — шифрованная оболочка через TCP:22.',
    params: [{ label: 'Цель', id: 'host', type: 'input', placeholder: 'user@server.com' }],
    flags: '<code>-p N</code> порт &nbsp; <code>-i key</code> ключ &nbsp; <code>-L 8080:localhost:80</code> туннель &nbsp; <code>-D 1080</code> SOCKS-прокси &nbsp; <code>-v</code> подробно', build: (p) => `ssh ${p.host || 'user@server.com'}` },
  { cmd: 'whois', label: 'whois', desc: 'Регистрационные данные домена — владелец, регистратор, DNS-серверы, срок действия.',
    params: [{ label: 'Домен', id: 'host', type: 'select', options: ['google.com','ya.ru','github.com','example.com'] }],
    flags: '', build: (p) => `whois ${p.host}` },
  { cmd: 'hostname', label: 'hostname', desc: 'Имя текущей машины, FQDN и IP-адрес.',
    params: [], flags: '<code>-f</code> FQDN &nbsp; <code>-I</code> все IP &nbsp; <code>-d</code> домен', build: () => 'hostname' }
];
