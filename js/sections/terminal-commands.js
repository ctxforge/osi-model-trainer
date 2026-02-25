/* ==================== TERMINAL: Command Implementations ==================== */
import { sleep } from '../core/utils.js';
import { addXP, unlockAchievement } from '../core/gamification.js';
import { SIM_NET, resolveHost, termLine, termScroll } from './terminal-network.js';
import { VirtualFS } from '../core/filesystem.js';
import { TERM_SCENARIOS } from '../data/terminal-scenarios.js';

const vfs = new VirtualFS();
let cwd = '/home/student';

/* ---- Scenario state ---- */
let activeScenario = null;
let activeStep = 0;
const completedScenarios = new Set(
  JSON.parse(localStorage.getItem('osi-term-scenarios') || '[]')
);
let _scenarioTermOutput = null;

function _saveCompletedScenarios() {
  localStorage.setItem('osi-term-scenarios', JSON.stringify([...completedScenarios]));
}

/** Called by terminal.js after every command to check scenario progress */
export function checkScenarioStep(cmd) {
  if (!activeScenario || !_scenarioTermOutput) return;
  const tl = (text, cls) => termLine(_scenarioTermOutput, text, cls);

  const step = activeScenario.steps[activeStep];
  if (!step) return;

  if (step.check(cmd)) {
    activeStep++;
    const total = activeScenario.steps.length;

    if (activeStep >= total) {
      // Scenario complete
      tl('');
      tl('\u2550'.repeat(44), 'header');
      tl(`\u2705 \u0428\u0430\u0433 ${total}/${total} \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d!`);
      tl('');
      tl(`\u{1F389} \u0421\u0446\u0435\u043d\u0430\u0440\u0438\u0439 \u00ab${activeScenario.title}\u00bb \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043d!`);
      tl(`   \u2B50 \u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043e: ${activeScenario.xp} XP`);
      tl('\u2550'.repeat(44), 'header');

      addXP(activeScenario.xp);
      completedScenarios.add(activeScenario.id);
      _saveCompletedScenarios();

      // Achievements per scenario index
      const idx = TERM_SCENARIOS.findIndex(s => s.id === activeScenario.id);
      if (idx >= 0) unlockAchievement(`term_scenario_${idx + 1}`);
      // Generic terminal scenario achievement
      unlockAchievement('term_scenario');
      // All 10 scenarios complete
      if (completedScenarios.size >= TERM_SCENARIOS.length) {
        unlockAchievement('term_all_scenarios');
      }

      activeScenario = null;
      activeStep = 0;
    } else {
      // Next step
      const next = activeScenario.steps[activeStep];
      tl('');
      tl(`\u2705 \u0428\u0430\u0433 ${activeStep}/${total} \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d!`);
      tl(`\u{1F4CB} \u0428\u0430\u0433 ${activeStep + 1}/${total}: ${next.instruction}`);
    }
  }
}

/** Получить текущий рабочий каталог */
export function getCwd() { return cwd; }

export function buildCommands(termOutput) {
  const tl = (text, cls) => termLine(termOutput, text, cls);
  const ts = () => termScroll(termOutput);
  _scenarioTermOutput = termOutput;

  /* ---- состояние симулированных сервисов ---- */
  const services = {
    nginx:    { active: true,  desc: 'A high performance web server and a reverse proxy server' },
    dhcpd:    { active: false, desc: 'DHCPv4 Server Daemon' },
    named:    { active: true,  desc: 'Berkeley Internet Name Domain (DNS)' },
    sshd:     { active: true,  desc: 'OpenBSD Secure Shell server' },
    iptables: { active: true,  desc: 'IPv4 packet filtering and NAT' },
  };

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
      tl('═══ HTTP и загрузка ═══', 'header');
      const http = [
        ['curl &lt;url&gt;', 'HTTP-запрос (заголовки ответа)'],
        ['wget &lt;url&gt;', 'Скачать файл'],
      ];
      http.forEach(c => tl(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      tl('');
      tl('═══ Файловая система ═══', 'header');
      const fs = [
        ['cat &lt;file&gt;', 'Показать содержимое файла'],
        ['ls [-l] [path]', 'Список файлов и каталогов'],
        ['cd &lt;dir&gt;', 'Сменить каталог'],
        ['pwd', 'Текущий рабочий каталог'],
        ['grep &lt;pattern&gt; &lt;file&gt;', 'Поиск строки в файле'],
        ['head [-n N] &lt;file&gt;', 'Первые N строк файла'],
        ['tail [-n N | -f] &lt;file&gt;', 'Последние N строк / поток'],
        ['touch &lt;file&gt;', 'Создать пустой файл'],
        ['mkdir &lt;dir&gt;', 'Создать каталог'],
        ['echo [text] [&gt; file]', 'Вывод текста / запись в файл'],
        ['find &lt;dir&gt; -name &lt;pattern&gt;', 'Рекурсивный поиск файлов'],
        ['chmod &lt;mode&gt; &lt;file&gt;', 'Изменить права доступа'],
      ];
      fs.forEach(c => tl(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      tl('');
      tl('═══ Сервисы ═══', 'header');
      const svc = [
        ['systemctl status &lt;svc&gt;', 'Статус сервиса'],
        ['systemctl start|stop &lt;svc&gt;', 'Запустить / остановить сервис'],
        ['service &lt;svc&gt; &lt;action&gt;', 'Алиас для systemctl'],
      ];
      svc.forEach(c => tl(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      tl('');
      tl('\u2550\u2550\u2550 \u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u2550\u2550\u2550', 'header');
      const scen = [
        ['scenario', '\u0421\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u0448\u0430\u0433\u043E\u0432\u044B\u0445 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0435\u0432 (10 \u0443\u043F\u0440\u0430\u0436\u043D\u0435\u043D\u0438\u0439)'],
        ['scenario N', '\u041D\u0430\u0447\u0430\u0442\u044C \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439 N'],
        ['scenario hint', '\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043A \u0442\u0435\u043A\u0443\u0449\u0435\u043C\u0443 \u0448\u0430\u0433\u0443'],
        ['scenario quit', '\u041F\u0440\u0435\u0440\u0432\u0430\u0442\u044C \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439'],
      ];
      scen.forEach(c => tl(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      tl('');
      tl('  <span class="term-cmd">clear                         </span> \u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u044D\u043A\u0440\u0430\u043D');
      tl('  <span class="term-cmd">help                          </span> \u042D\u0442\u0430 \u0441\u043F\u0440\u0430\u0432\u043A\u0430');
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
    },

    /* ==================== Файловая система ==================== */

    cat(args) {
      if (!args.length) { tl('cat: не указан файл', 'error'); return; }
      const path = vfs.resolvePath(cwd, args[0]);
      const content = vfs.readFile(path);
      if (content === null) {
        tl(`cat: ${args[0]}: Нет такого файла или каталога`, 'error');
        return;
      }
      const isConf = /\.(conf|cnf|cfg|ini|rules|db)$/.test(path) || path.endsWith('.v4');
      const lines = content.split('\n');
      lines.forEach(line => {
        let out = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (isConf) {
          // подсветка комментариев
          if (/^\s*(#|;|\/\/)/.test(out)) {
            out = `<span class="term-time">${out}</span>`;
          } else {
            // подсветка ключевых слов
            out = out.replace(/\b(listen|server|root|index|proxy_pass|nameserver|subnet|range|option|zone|type|master|file|forwarders|allow-query|default-lease-time|max-lease-time|address|netmask|gateway|dns-nameservers|auto|iface|inet|static|loopback|worker_processes|worker_connections|sendfile|keepalive_timeout|include|default_type|server_name|try_files|location|net\.\S+)\b/g,
              '<span class="term-cmd">$1</span>');
            // подсветка IP-адресов
            out = out.replace(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g,
              '<span class="term-ip">$1</span>');
          }
        }
        tl(out);
      });
      addXP(3);
    },

    ls(args) {
      const longFlag = args.includes('-l') || args.includes('-la') || args.includes('-al');
      const filtered = args.filter(a => !a.startsWith('-'));
      const target = filtered.length ? vfs.resolvePath(cwd, filtered[0]) : cwd;
      const entries = vfs.listDir(target);
      if (entries === null) {
        tl(`ls: невозможно открыть каталог '${filtered[0] || target}': Нет такого файла или каталога`, 'error');
        return;
      }
      if (longFlag) {
        tl(`итого ${entries.length}`, 'header');
        entries.forEach(e => {
          const fullPath = target === '/' ? '/' + e.name : target + '/' + e.name;
          const perm = vfs.getPermissions(fullPath) || (e.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--');
          const size = e.type === 'file' ? String(vfs.getSize(fullPath)).padStart(6) : '  4096';
          const date = 'фев 25 08:00';
          const nameHtml = e.type === 'dir'
            ? `<span class="term-cmd">${e.name}/</span>`
            : e.name;
          tl(`${perm}  1 root root ${size} ${date} ${nameHtml}`);
        });
      } else {
        let line = '';
        entries.forEach(e => {
          const name = e.type === 'dir'
            ? `<span class="term-cmd">${e.name}/</span>`
            : e.name;
          line += name + '  ';
        });
        if (line) tl(line);
      }
      addXP(2);
    },

    cd(args) {
      if (!args.length || args[0] === '~') { cwd = '/home/student'; addXP(1); return; }
      const target = vfs.resolvePath(cwd, args[0]);
      const kind = vfs.exists(target);
      if (kind === 'dir') {
        cwd = target;
      } else if (kind === 'file') {
        tl(`bash: cd: ${args[0]}: Не является каталогом`, 'error');
      } else {
        tl(`bash: cd: ${args[0]}: Нет такого файла или каталога`, 'error');
      }
      addXP(1);
    },

    pwd() {
      tl(cwd);
      addXP(1);
    },

    grep(args) {
      if (args.length < 2) { tl('Использование: grep &lt;pattern&gt; &lt;file&gt;', 'error'); return; }
      const pattern = args[0];
      const path = vfs.resolvePath(cwd, args[1]);
      const content = vfs.readFile(path);
      if (content === null) {
        tl(`grep: ${args[1]}: Нет такого файла или каталога`, 'error');
        return;
      }
      let found = 0;
      const re = new RegExp(`(${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      content.split('\n').forEach(line => {
        if (re.test(line)) {
          found++;
          const safe = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          tl(safe.replace(re, '<span class="term-fail">$1</span>'));
        }
      });
      if (!found) tl(`(совпадений не найдено)`);
      addXP(3);
    },

    async tail(args) {
      const followFlag = args.includes('-f');
      let nLines = 10;
      const nIdx = args.indexOf('-n');
      if (nIdx !== -1) {
        nLines = parseInt(args[nIdx + 1]) || 10;
      }
      // убираем флаги и числовой аргумент -n
      const skip = new Set(['-f', '-n']);
      if (nIdx !== -1 && args[nIdx + 1]) skip.add(args[nIdx + 1]);
      const fileArg = args.find(a => !skip.has(a) && !a.startsWith('-'));
      if (!fileArg) { tl('Использование: tail [-n N] [-f] &lt;file&gt;', 'error'); return; }
      const path = vfs.resolvePath(cwd, fileArg);
      const content = vfs.readFile(path);
      if (content === null) {
        tl(`tail: невозможно открыть '${fileArg}': Нет такого файла или каталога`, 'error');
        return;
      }
      const lines = content.split('\n').filter(l => l.length > 0);
      const start = Math.max(0, lines.length - nLines);
      lines.slice(start).forEach(line => {
        tl(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      });
      ts();
      if (followFlag) {
        tl('--- tail -f: потоковый вывод (симуляция) ---', 'info');
        ts();
        const svcs = ['kernel', 'systemd', 'NetworkManager', 'sshd', 'cron', 'nginx'];
        const liveMsgs = [
          'eth0: link watchdog — link is up',
          'Accepted publickey for student from 192.168.1.50 port 52440',
          'DHCPACK of 192.168.1.100 from 192.168.1.1 (xid=0x3a4f21b8)',
          'Firewall: INPUT ACCEPT IN=eth0 SRC=192.168.1.55 PROTO=TCP DPT=80',
          'GET /index.html HTTP/1.1 200 3456 "Mozilla/5.0"',
          'TCP connection established: 192.168.1.100:443 → 93.184.216.34:54321',
          'ARP: who-has 192.168.1.1 tell 192.168.1.100',
          'rsyslogd: action \'action-3-builtin:omfile\' resumed',
        ];
        for (let i = 0; i < 6; i++) {
          await sleep(1000 + Math.random() * 1500);
          const now = new Date();
          const stamp = `Feb 25 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
          const svc = svcs[Math.floor(Math.random() * svcs.length)];
          const msg = liveMsgs[Math.floor(Math.random() * liveMsgs.length)];
          tl(`${stamp} netlab-student ${svc}[${2000 + Math.floor(Math.random() * 1000)}]: ${msg}`);
          ts();
        }
        tl('--- (Ctrl+C) завершение tail -f ---', 'info');
      }
      addXP(3);
    },

    head(args) {
      let nLines = 10;
      if (args.includes('-n')) {
        const idx = args.indexOf('-n');
        nLines = parseInt(args[idx + 1]) || 10;
      }
      const fileArg = args.find(a => !a.startsWith('-') && a !== String(nLines));
      if (!fileArg) { tl('Использование: head [-n N] &lt;file&gt;', 'error'); return; }
      const path = vfs.resolvePath(cwd, fileArg);
      const content = vfs.readFile(path);
      if (content === null) {
        tl(`head: невозможно открыть '${fileArg}': Нет такого файла или каталога`, 'error');
        return;
      }
      const lines = content.split('\n');
      lines.slice(0, nLines).forEach(line => {
        tl(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      });
      addXP(2);
    },

    chmod(args) {
      if (args.length < 2) { tl('Использование: chmod &lt;mode&gt; &lt;file&gt;', 'error'); return; }
      const mode = args[0];
      const path = vfs.resolvePath(cwd, args[1]);
      if (!vfs.exists(path)) {
        tl(`chmod: невозможно изменить права '${args[1]}': Нет такого файла или каталога`, 'error');
        return;
      }
      tl(`<span class="term-ok">Права '${args[1]}' изменены на ${mode}</span>`);
      addXP(1);
    },

    mkdir(args) {
      if (!args.length) { tl('Использование: mkdir &lt;dir&gt;', 'error'); return; }
      const target = vfs.resolvePath(cwd, args[0]);
      if (vfs.exists(target)) {
        tl(`mkdir: невозможно создать каталог '${args[0]}': Файл существует`, 'error');
        return;
      }
      vfs.mkdir(target);
      tl(`<span class="term-ok">Каталог '${args[0]}' создан</span>`);
      addXP(2);
    },

    echo(args) {
      const full = args.join(' ');
      const redirectMatch = full.match(/^(.*?)\s*>\s*(.+)$/);
      if (redirectMatch) {
        let text = redirectMatch[1].trim();
        const filePath = redirectMatch[2].trim();
        // убрать кавычки
        text = text.replace(/^["']|["']$/g, '');
        const absPath = vfs.resolvePath(cwd, filePath);
        vfs.writeFile(absPath, text + '\n');
        tl(`<span class="term-ok">Записано в ${filePath}</span>`);
      } else {
        let text = full;
        text = text.replace(/^["']|["']$/g, '');
        tl(text.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      }
      addXP(1);
    },

    touch(args) {
      if (!args.length) { tl('Использование: touch &lt;file&gt;', 'error'); return; }
      const path = vfs.resolvePath(cwd, args[0]);
      if (!vfs.exists(path)) {
        vfs.writeFile(path, '');
      }
      tl(`<span class="term-ok">'${args[0]}' создан</span>`);
      addXP(1);
    },

    find(args) {
      if (args.length < 3 || args[1] !== '-name') {
        tl('Использование: find &lt;dir&gt; -name &lt;pattern&gt;', 'error');
        return;
      }
      const dir = vfs.resolvePath(cwd, args[0]);
      const pattern = args[2].replace(/^["']|["']$/g, '');
      if (vfs.exists(dir) !== 'dir') {
        tl(`find: '${args[0]}': Нет такого каталога`, 'error');
        return;
      }
      // рекурсивный обход
      const re = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      let found = 0;
      const recurse = (dirPath) => {
        const entries = vfs.listDir(dirPath);
        if (!entries) return;
        entries.forEach(e => {
          const full = dirPath === '/' ? '/' + e.name : dirPath + '/' + e.name;
          if (re.test(e.name)) {
            tl(`<span class="${e.type === 'dir' ? 'term-cmd' : ''}">${full}</span>`);
            found++;
          }
          if (e.type === 'dir') recurse(full);
        });
      };
      recurse(dir);
      if (!found) tl('(ничего не найдено)');
      addXP(3);
    },

    /* ==================== Сервисы ==================== */

    systemctl(args) {
      if (args.length < 2) {
        tl('Использование: systemctl &lt;status|start|stop&gt; &lt;service&gt;', 'error');
        return;
      }
      const action = args[0];
      const svcName = args[1].replace(/\.service$/, '');
      const svc = services[svcName];
      if (!svc) {
        tl(`Unit ${svcName}.service could not be found.`, 'error');
        return;
      }
      if (action === 'status') {
        const dot = svc.active
          ? '<span class="term-ok">●</span>'
          : '<span class="term-fail">●</span>';
        const state = svc.active
          ? '<span class="term-ok">active (running)</span>'
          : '<span class="term-fail">inactive (dead)</span>';
        tl(`${dot} ${svcName}.service - ${svc.desc}`);
        tl(`     Loaded: loaded (/lib/systemd/system/${svcName}.service; enabled)`);
        tl(`     Active: ${state} since ${new Date(Date.now() - 3600000).toUTCString()}`);
        tl(`   Main PID: ${1000 + Math.floor(Math.random() * 5000)} (${svcName})`);
        tl(`      Tasks: ${2 + Math.floor(Math.random() * 10)} (limit: 4915)`);
        tl(`     Memory: ${(2 + Math.random() * 60).toFixed(1)}M`);
        tl(`        CPU: ${(0.1 + Math.random() * 2).toFixed(3)}s`);
      } else if (action === 'start') {
        if (svc.active) {
          tl(`Сервис ${svcName} уже запущен.`, 'info');
        } else {
          svc.active = true;
          tl(`<span class="term-ok">● ${svcName}.service запущен</span>`);
        }
      } else if (action === 'stop') {
        if (!svc.active) {
          tl(`Сервис ${svcName} уже остановлен.`, 'info');
        } else {
          svc.active = false;
          tl(`<span class="term-fail">● ${svcName}.service остановлен</span>`);
        }
      } else if (action === 'restart') {
        svc.active = true;
        tl(`<span class="term-ok">● ${svcName}.service перезапущен</span>`);
      } else {
        tl(`Неизвестное действие: ${action}. Используйте status, start, stop, restart.`, 'error');
      }
      addXP(3);
    },

    service(args) {
      if (args.length < 2) {
        tl('Использование: service &lt;name&gt; &lt;status|start|stop&gt;', 'error');
        return;
      }
      // service <name> <action> → systemctl <action> <name>
      TERM_COMMANDS.systemctl([args[1], args[0]]);
    },

    /* ==================== Сценарии ==================== */

    scenario(args) {
      _scenarioTermOutput = termOutput;

      // scenario hint
      if (args[0] === 'hint') {
        if (!activeScenario) {
          tl('\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u044F. \u0412\u0432\u0435\u0434\u0438\u0442\u0435 <span class="term-cmd">scenario</span> \u0434\u043B\u044F \u0441\u043F\u0438\u0441\u043A\u0430.', 'info');
          return;
        }
        const step = activeScenario.steps[activeStep];
        if (step) {
          tl(`\u{1F4A1} \u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430: <span class="term-cmd">${step.hint}</span>`, 'info');
        }
        return;
      }

      // scenario quit
      if (args[0] === 'quit' || args[0] === 'exit' || args[0] === 'stop') {
        if (!activeScenario) {
          tl('\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u044F.', 'info');
          return;
        }
        tl(`\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 \u00ab${activeScenario.title}\u00bb \u043F\u0440\u0435\u0440\u0432\u0430\u043D.`, 'info');
        activeScenario = null;
        activeStep = 0;
        return;
      }

      // scenario N — start scenario
      if (args[0] && /^\d+$/.test(args[0])) {
        const num = parseInt(args[0]);
        if (num < 1 || num > TERM_SCENARIOS.length) {
          tl(`\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440. \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0438 1\u2013${TERM_SCENARIOS.length}.`, 'error');
          return;
        }
        const sc = TERM_SCENARIOS[num - 1];
        activeScenario = sc;
        activeStep = 0;

        const total = sc.steps.length;
        const titleLine = `${sc.icon} \u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 ${num}: ${sc.title.replace(/^\d+\.\s*/, '')}`;
        const stepLine = `\u0428\u0430\u0433 1/${total}: ${sc.steps[0].instruction}`;
        const hintLine = '\u{1F4A1} \u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430: scenario hint';

        tl('\u2554' + '\u2550'.repeat(44) + '\u2557');
        tl('\u2551  ' + titleLine.padEnd(43) + '\u2551');
        tl('\u2551  ' + stepLine.padEnd(43) + '\u2551');
        tl('\u2551  ' + hintLine.padEnd(43) + '\u2551');
        tl('\u255A' + '\u2550'.repeat(44) + '\u255D');
        tl('');
        tl('\u0412\u044B\u043F\u043E\u043B\u043D\u044F\u0439\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u043F\u0440\u044F\u043C\u043E \u0432 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0435. \u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442 \u043A\u0430\u0436\u0434\u044B\u0439 \u0448\u0430\u0433 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438.', 'info');
        return;
      }

      // scenario (no args) — list all
      tl('\u2550\u2550\u2550 \u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0430 \u2550\u2550\u2550', 'header');
      tl('');
      TERM_SCENARIOS.forEach((sc, i) => {
        const done = completedScenarios.has(sc.id);
        const mark = done ? '\u2705' : '\u2B1C';
        const num = String(i + 1).padStart(2);
        tl(`  ${mark} <span class="term-cmd">scenario ${i + 1}</span>  ${sc.icon} ${sc.title}`);
        tl(`      ${sc.desc}  [\u0448\u0430\u0433\u043E\u0432: ${sc.steps.length}, XP: ${sc.xp}]`);
      });
      tl('');
      tl(`\u041F\u0440\u043E\u0439\u0434\u0435\u043D\u043E: ${completedScenarios.size}/${TERM_SCENARIOS.length}`, 'info');
      tl('');
      tl('\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435:', 'header');
      tl('  <span class="term-cmd">scenario N</span>       \u2014 \u043D\u0430\u0447\u0430\u0442\u044C \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439 N (1\u2013' + TERM_SCENARIOS.length + ')');
      tl('  <span class="term-cmd">scenario hint</span>    \u2014 \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 \u043A \u0442\u0435\u043A\u0443\u0449\u0435\u043C\u0443 \u0448\u0430\u0433\u0443');
      tl('  <span class="term-cmd">scenario quit</span>    \u2014 \u043F\u0440\u0435\u0440\u0432\u0430\u0442\u044C \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439');

      if (activeScenario) {
        tl('');
        const total = activeScenario.steps.length;
        tl(`\u25B6 \u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439: ${activeScenario.icon} ${activeScenario.title} \u2014 \u0448\u0430\u0433 ${activeStep + 1}/${total}`, 'info');
        tl(`  ${activeScenario.steps[activeStep].instruction}`);
      }
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
    params: [], flags: '<code>-f</code> FQDN &nbsp; <code>-I</code> все IP &nbsp; <code>-d</code> домен', build: () => 'hostname' },
  { cmd: 'cat', label: 'cat', desc: 'Показать содержимое файла. Конфигурационные файлы подсвечиваются автоматически.',
    params: [{ label: 'Файл', id: 'file', type: 'select', options: ['/etc/hosts','/etc/resolv.conf','/etc/network/interfaces','/etc/nginx/nginx.conf','/etc/bind/named.conf','/etc/dhcp/dhcpd.conf','/etc/sysctl.conf','/etc/iptables/rules.v4','/home/student/.bashrc'] }],
    flags: '', build: (p) => `cat ${p.file}` },
  { cmd: 'ls', label: 'ls', desc: 'Список файлов и каталогов. Каталоги выделены цветом.',
    params: [{ label: 'Путь', id: 'path', type: 'select', options: ['.','/etc','/var/log','/proc/net','/home/student','/etc/nginx','/etc/bind/zones'] }],
    flags: '<code>-l</code> подробный вывод (права, размер)',
    build: (p) => `ls -l ${p.path}` },
  { cmd: 'cd', label: 'cd', desc: 'Сменить текущий рабочий каталог. Поддерживает абсолютные и относительные пути, «..» и «~».',
    params: [{ label: 'Каталог', id: 'dir', type: 'select', options: ['/etc','/var/log','/proc/net','/home/student','..','~'] }],
    flags: '', build: (p) => `cd ${p.dir}` },
  { cmd: 'grep', label: 'grep', desc: 'Поиск строки (паттерна) в файле. Совпадения выделяются цветом.',
    params: [
      { label: 'Паттерн', id: 'pattern', type: 'input', placeholder: 'nameserver' },
      { label: 'Файл', id: 'file', type: 'select', options: ['/etc/resolv.conf','/etc/hosts','/var/log/syslog','/var/log/auth.log','/etc/nginx/nginx.conf'] }
    ],
    flags: '<code>-i</code> без учёта регистра &nbsp; <code>-n</code> номера строк &nbsp; <code>-c</code> количество совпадений',
    build: (p) => `grep ${p.pattern || 'nameserver'} ${p.file}` },
  { cmd: 'tail', label: 'tail', desc: 'Показать последние строки файла. С флагом -f симулирует потоковый вывод логов в реальном времени.',
    params: [{ label: 'Файл', id: 'file', type: 'select', options: ['/var/log/syslog','/var/log/auth.log','/var/log/nginx/access.log'] }],
    flags: '<code>-n N</code> кол-во строк &nbsp; <code>-f</code> следить за файлом (поток)',
    build: (p) => `tail -n 5 ${p.file}` },
  { cmd: 'systemctl', label: 'systemctl', desc: 'Управление системными сервисами — статус, запуск, остановка. Сервисы: nginx, dhcpd, named, sshd, iptables.',
    params: [
      { label: 'Действие', id: 'action', type: 'select', options: ['status','start','stop','restart'] },
      { label: 'Сервис', id: 'svc', type: 'select', options: ['nginx','sshd','named','dhcpd','iptables'] }
    ],
    flags: '', build: (p) => `systemctl ${p.action} ${p.svc}` },
  { cmd: 'scenario', label: '\u{1F3AF} scenario', desc: 'Пошаговые сценарии — 10 управляемых упражнений по настройке сети, DNS, DHCP, firewall, VPN и диагностике.',
    params: [
      { label: '\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439', id: 'num', type: 'select', options: ['','1','2','3','4','5','6','7','8','9','10','hint','quit'] }
    ],
    flags: '<code>scenario</code> \u0441\u043F\u0438\u0441\u043E\u043A &nbsp; <code>scenario N</code> \u043D\u0430\u0447\u0430\u0442\u044C &nbsp; <code>scenario hint</code> \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 &nbsp; <code>scenario quit</code> \u043F\u0440\u0435\u0440\u0432\u0430\u0442\u044C',
    build: (p) => p.num ? `scenario ${p.num}` : 'scenario' }
];
