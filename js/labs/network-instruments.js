/**
 * network-instruments.js — Network Instrument Toolkit
 *
 * Instruments that connect to topology builder network points:
 * 1. Protocol Analyzer (mini-Wireshark) — packet capture and OSI decode
 * 2. Cable Tester / TDR — wire map, attenuation, NEXT/FEXT
 * 3. Network Monitor (mini-PRTG) — bandwidth, latency, loss graphs
 * 4. Signal Meter — dBm, SNR, noise floor for wireless links
 * 5. BER Tester — PRBS generator, error counting, pattern analysis
 *
 * Every parameter has a tooltip explaining its meaning and behavior.
 */

import { addXP } from '../core/gamification.js';

/* ===== Constants ===== */

const INSTRUMENTS = [
  { id: 'protoAnalyzer', name: 'Protocol Analyzer', icon: '🔍', tip: 'Captures and decodes packets on a link — like a mini Wireshark. Shows OSI layer breakdown of each packet.' },
  { id: 'cableTester', name: 'Cable Tester / TDR', icon: '🔌', tip: 'Tests physical cable: wire map (continuity), length, attenuation at different frequencies, crosstalk (NEXT/FEXT). Pass/Fail per standard.' },
  { id: 'netMonitor', name: 'Network Monitor', icon: '📊', tip: 'Real-time dashboard for the entire network: bandwidth utilization, latency, packet loss. Color-coded link health.' },
  { id: 'signalMeter', name: 'Signal Meter', icon: '📶', tip: 'Measures wireless signal strength (dBm), noise floor, SNR. Analog + digital display. Shows Wi-Fi channel scan.' },
  { id: 'berTester', name: 'BER Tester', icon: '⚡', tip: 'Generates pseudo-random bit sequence (PRBS) and measures bit errors: BER, errored seconds, error distribution.' }
];

const PROTOCOLS_DB = [
  { name: 'ARP Request', proto: 'ARP', l2: { src: 'AA:BB:CC:00:00:01', dst: 'FF:FF:FF:FF:FF:FF', type: '0x0806' },
    l3: null, l4: null, l7: null, info: 'Who has 192.168.1.1? Tell 192.168.1.10',
    explain: { dst: 'FF:FF:FF:FF:FF:FF — broadcast MAC, sent to ALL devices on the segment', type: '0x0806 — EtherType for ARP protocol' } },
  { name: 'ARP Reply', proto: 'ARP', l2: { src: 'AA:BB:CC:00:00:02', dst: 'AA:BB:CC:00:00:01', type: '0x0806' },
    l3: null, l4: null, l7: null, info: '192.168.1.1 is at AA:BB:CC:00:00:02',
    explain: { src: 'Source MAC — the device that has the requested IP replies with its MAC address' } },
  { name: 'DHCP Discover', proto: 'DHCP', l2: { src: 'AA:BB:CC:00:00:01', dst: 'FF:FF:FF:FF:FF:FF', type: '0x0800' },
    l3: { src: '0.0.0.0', dst: '255.255.255.255', proto: 'UDP', ttl: 128 }, l4: { srcPort: 68, dstPort: 67 },
    l7: { type: 'DHCP Discover', xid: '0x3903F326' }, info: 'DHCP Discover — client looking for DHCP server',
    explain: { 'src 0.0.0.0': 'Client has no IP yet, uses 0.0.0.0', 'dst 255.255.255.255': 'Broadcast — reaches all devices on subnet', ttl: 'TTL=128 — packet can traverse up to 128 routers before being dropped', dstPort: 'Port 67 — standard DHCP server port', srcPort: 'Port 68 — standard DHCP client port' } },
  { name: 'DNS Query', proto: 'DNS', l2: { src: 'AA:BB:CC:00:00:01', dst: 'AA:BB:CC:00:00:02', type: '0x0800' },
    l3: { src: '192.168.1.10', dst: '8.8.8.8', proto: 'UDP', ttl: 64 }, l4: { srcPort: 52431, dstPort: 53 },
    l7: { type: 'Standard query', name: 'example.com', qtype: 'A' }, info: 'Standard query A example.com',
    explain: { ttl: 'TTL=64 — typical Linux/macOS default. Packet can pass through 64 routers.', dstPort: 'Port 53 — DNS service. Both UDP (queries) and TCP (zone transfers) use this port.', qtype: 'A record — maps domain name to IPv4 address' } },
  { name: 'TCP SYN', proto: 'TCP', l2: { src: 'AA:BB:CC:00:00:01', dst: 'AA:BB:CC:00:00:02', type: '0x0800' },
    l3: { src: '192.168.1.10', dst: '93.184.216.34', proto: 'TCP', ttl: 64 }, l4: { srcPort: 49152, dstPort: 80, flags: 'SYN', seq: 1000, ack: 0, window: 65535 },
    l7: null, info: 'TCP SYN → 93.184.216.34:80 (HTTP)',
    explain: { flags: 'SYN — first step of TCP 3-way handshake. Client requests to open connection.', seq: 'Sequence number — random initial value (ISN). Tracks byte position in stream.', window: 'Window size — how many bytes client can receive before ACK needed. 65535 = 64KB.' } },
  { name: 'TCP SYN-ACK', proto: 'TCP', l2: { src: 'AA:BB:CC:00:00:02', dst: 'AA:BB:CC:00:00:01', type: '0x0800' },
    l3: { src: '93.184.216.34', dst: '192.168.1.10', proto: 'TCP', ttl: 56 }, l4: { srcPort: 80, dstPort: 49152, flags: 'SYN,ACK', seq: 5000, ack: 1001, window: 28960 },
    l7: null, info: 'TCP SYN-ACK ← server accepts connection',
    explain: { flags: 'SYN,ACK — server acknowledges client SYN and sends its own SYN. Step 2 of handshake.', ack: 'ACK=1001 — confirms receipt of client SEQ 1000 (next expected byte = 1001)', ttl: 'TTL=56 — server is likely 64 - 56 = 8 hops away (started at TTL=64)' } },
  { name: 'HTTP GET', proto: 'HTTP', l2: { src: 'AA:BB:CC:00:00:01', dst: 'AA:BB:CC:00:00:02', type: '0x0800' },
    l3: { src: '192.168.1.10', dst: '93.184.216.34', proto: 'TCP', ttl: 64 }, l4: { srcPort: 49152, dstPort: 80, flags: 'PSH,ACK', seq: 1001, ack: 5001, window: 65535 },
    l7: { method: 'GET', path: '/', host: 'example.com', userAgent: 'Mozilla/5.0' }, info: 'HTTP GET / HTTP/1.1',
    explain: { flags: 'PSH,ACK — PSH tells receiver to push data to application immediately (don\'t buffer)', method: 'GET — HTTP method to retrieve a resource. The most common request type.', path: '/ — root path of the website' } },
  { name: 'ICMP Echo', proto: 'ICMP', l2: { src: 'AA:BB:CC:00:00:01', dst: 'AA:BB:CC:00:00:02', type: '0x0800' },
    l3: { src: '192.168.1.10', dst: '192.168.1.1', proto: 'ICMP', ttl: 64 }, l4: null,
    l7: { type: 'Echo Request', id: 1234, seq: 1 }, info: 'Echo (ping) request to 192.168.1.1',
    explain: { type: 'Echo Request — the "ping" packet. Target should reply with Echo Reply.', ttl: 'TTL=64 — used by traceroute to discover routers (increment TTL from 1)', id: 'Identifier — matches request/reply pairs. OS uses process ID.' } }
];

/* ===== Context Cards — "When to use this instrument?" ===== */
const INSTRUMENT_CONTEXT = {
  protoAnalyzer: {
    scenario: '«Сайт не открывается, ping работает — в чём проблема?»',
    solve: 'Запусти захват → ищи DNS-запросы без ответа (NXDOMAIN) или TCP RST пакеты от сервера.',
    layers: 'L2–L7',
    tip: 'Смотри на флаги TCP: RST = соединение отклонено, SYN без SYN-ACK = сервер недоступен или заблокирован файрволом.',
  },
  cableTester: {
    scenario: '«Устройство не получает DHCP-адрес, хотя кабель вставлен»',
    solve: 'Проверь Wire Map — возможен обрыв одной из пар. Проверь затухание — кабель может быть длиннее 100 м.',
    layers: 'L1',
    tip: 'Open = обрыв проводника, Short = замыкание пар, Reversed = перекрутили пары при обжиме.',
  },
  netMonitor: {
    scenario: '«Сеть "лагает" — пинги высокие, загрузки нет»',
    solve: 'Смотри на Packet Loss > 1% и Latency spike — это признак перегруженного линка или плохого соединения.',
    layers: 'L1–L4',
    tip: 'Утилизация > 80% — скорость начинает падать из-за перегрузки буферов. Packet Loss > 0.5% — проблемы с TCP.',
  },
  signalMeter: {
    scenario: '«Wi-Fi "ловит", но скорость низкая»',
    solve: 'Если RSSI < −75 дБм или SNR < 20 дБ — слабый сигнал. Проверь загруженность канала (соседние сети).',
    layers: 'L1',
    tip: 'SNR < 10 дБ → только BPSK (низкая скорость). SNR > 25 дБ → QAM-64+ (максимальная скорость для Wi-Fi).',
  },
  berTester: {
    scenario: '«Файлы передаются с ошибками, но утилизация нормальная»',
    solve: 'BER > 10⁻⁶ указывает на физическую проблему: плохой кабель, помехи, несогласованность импедансов.',
    layers: 'L1',
    tip: 'PRBS31 — стандартный тестовый паттерн для BER. Порог для Ethernet: BER < 10⁻¹². Значит: максимум 1 ошибка на триллион бит.',
  },
};

const MEASUREMENT_GUIDES = {
  cableTester: [
    { n: 1, title: 'Выберите кабель', text: 'Кликни на медный линк в топологии (Cat5e/6/6a), затем выбери Cable Tester' },
    { n: 2, title: 'Wire Map', text: 'Все 8 контактов должны показывать OK. Open = обрыв, Short = замыкание, Reversed = перекрутили' },
    { n: 3, title: 'Затухание', text: 'Measured < Max → PASS. Если FAIL → кабель длиннее нормы или плохой обжим. Каждые 10°C → +4% затухания.' },
    { n: 4, title: 'NEXT/FEXT', text: 'Перекрёстные наводки между парами. Ниже нормы → плохая скрутка или сильные внешние помехи.' },
  ],
  protoAnalyzer: [
    { n: 1, title: 'Запусти захват', text: 'Нажми Capture. Пакеты генерируются для выбранного линка/устройства.' },
    { n: 2, title: 'Фильтрация', text: 'Используй фильтр по протоколу (ARP, DNS, TCP…) чтобы найти нужные пакеты.' },
    { n: 3, title: 'OSI декодирование', text: 'Кликни на пакет → увидишь полный разбор по уровням OSI с объяснением каждого поля.' },
    { n: 4, title: 'Интерпретация', text: 'RST = соединение разрывается. NXDOMAIN = DNS не нашёл домен. ACK без данных = квитирование.' },
  ],
};

const CABLE_STANDARDS = {
  cat5e: { name: 'Cat5e', maxFreq: 100, attenuation: { 1: 2.1, 10: 6.5, 100: 22 }, next: 35.3, fext: 23.8, rl: 20 },
  cat6: { name: 'Cat6', maxFreq: 250, attenuation: { 1: 2.0, 10: 6.0, 100: 19.8, 250: 35.9 }, next: 44.3, fext: 27.8, rl: 20 },
  cat6a: { name: 'Cat6a', maxFreq: 500, attenuation: { 1: 1.8, 10: 5.7, 100: 18.0, 250: 30.0, 500: 45.3 }, next: 46.0, fext: 30.2, rl: 20 }
};

/* ===== State ===== */
let container = null;
let currentInstrument = null;
let selectedLink = null;
let selectedDevice = null;

// Network monitor state
let monitorInterval = null;
let monitorHistory = []; // Array of { time, metrics: Map<linkKey, { bw, latency, loss }> }

/* ===== Public API ===== */

export function initNetworkInstruments() {
  container = document.getElementById('networkInstrumentsUI');
  if (!container) return;
  buildUI();
}

export function connectToLink(link, devices, linkTypes) {
  selectedLink = { link, devices, linkTypes };
  if (currentInstrument) renderInstrumentResult();
}

export function connectToDevice(device) {
  selectedDevice = device;
}

/* ===== UI Builder ===== */

function buildUI() {
  container.innerHTML = `
    <div class="ni-rack">
      <div class="ni-rack__header">
        <span class="ni-rack__title">Network Instrument Rack</span>
        <span class="ni-rack__subtitle" data-tip="Select an instrument, then click on a link or device in the topology to connect">Select instrument → Click network point</span>
      </div>

      <div class="ni-instrument-selector" id="niSelector">
        ${INSTRUMENTS.map(inst => `
          <button class="ni-inst-btn" data-inst="${inst.id}" data-tip="${inst.tip}">
            <span class="ni-inst-btn__icon">${inst.icon}</span>
            <span class="ni-inst-btn__name">${inst.name}</span>
          </button>
        `).join('')}
      </div>

      <div class="ni-connection-status" id="niConnectionStatus">
        <span data-tip="Shows what network element the instrument is currently connected to">Not connected — select a link or device in topology</span>
      </div>

      <div class="ni-result" id="niResult"></div>
    </div>
  `;

  document.getElementById('niSelector').addEventListener('click', e => {
    const btn = e.target.closest('.ni-inst-btn');
    if (!btn) return;
    currentInstrument = btn.dataset.inst;
    container.querySelectorAll('.ni-inst-btn').forEach(b => b.classList.toggle('ni-inst-btn--active', b === btn));
    renderInstrumentResult();
  });
}

function renderContextCard(inst) {
  const ctx = INSTRUMENT_CONTEXT[inst];
  if (!ctx) return '';
  const guide = MEASUREMENT_GUIDES[inst];
  return `
    <details class="ni-context-card">
      <summary>🔍 Когда использовать ${INSTRUMENTS.find(i => i.id === inst)?.name}? (уровни: ${ctx.layers})</summary>
      <div class="ni-context-card__body">
        <div class="ni-context-scenario"><strong>Сценарий:</strong> ${ctx.scenario}</div>
        <div class="ni-context-solve"><strong>Решение:</strong> ${ctx.solve}</div>
        <div class="ni-context-tip">💡 <em>${ctx.tip}</em></div>
        ${guide ? `
          <div class="ni-guide">
            <div style="font-weight:700;font-size:.78rem;margin:8px 0 4px">Пошаговое измерение:</div>
            ${guide.map(s => `<div class="ni-guide-step"><span class="ni-guide-step__n">${s.n}</span><div><strong>${s.title}</strong><br>${s.text}</div></div>`).join('')}
          </div>
        ` : ''}
      </div>
    </details>
  `;
}

function renderInstrumentResult() {
  const el = document.getElementById('niResult');
  if (!currentInstrument) { el.innerHTML = '<div class="ni-placeholder">Select an instrument above</div>'; return; }

  // Prepend context card
  const ctxCard = renderContextCard(currentInstrument);

  switch (currentInstrument) {
    case 'protoAnalyzer': renderProtocolAnalyzer(el, ctxCard); break;
    case 'cableTester': renderCableTester(el, ctxCard); break;
    case 'netMonitor': renderNetworkMonitor(el, ctxCard); break;
    case 'signalMeter': renderSignalMeter(el, ctxCard); break;
    case 'berTester': renderBerTester(el, ctxCard); break;
  }
  addXP(5);
}

/* ===== 1. Protocol Analyzer ===== */

function renderProtocolAnalyzer(el, ctxCard = '') {
  // Generate simulated packet capture
  const packets = generatePacketCapture();

  el.innerHTML = ctxCard + `
    <div class="ni-proto-analyzer">
      <div class="ni-pa-toolbar">
        <span class="ni-pa-title" data-tip="Protocol Analyzer captures and decodes network packets at all OSI layers">Protocol Analyzer</span>
        <select class="sa-select" id="niPaFilter" data-tip="Filter packets by protocol type. Only matching packets will be shown.">
          <option value="all">All Protocols</option>
          <option value="ARP">ARP</option>
          <option value="DHCP">DHCP</option>
          <option value="DNS">DNS</option>
          <option value="TCP">TCP</option>
          <option value="HTTP">HTTP</option>
          <option value="ICMP">ICMP</option>
        </select>
        <button class="sa-btn sa-btn--sm" id="niPaCapture" data-tip="Generate a new set of simulated network packets">Capture</button>
      </div>
      <div class="ni-pa-table" id="niPaTable"></div>
      <div class="ni-pa-detail" id="niPaDetail"></div>
    </div>
  `;

  renderPacketTable(packets);

  document.getElementById('niPaFilter').addEventListener('change', e => {
    const filtered = e.target.value === 'all' ? packets : packets.filter(p => p.proto === e.target.value);
    renderPacketTable(filtered);
  });

  document.getElementById('niPaCapture').addEventListener('click', () => {
    renderProtocolAnalyzer(el);
  });
}

function generatePacketCapture() {
  // Shuffle and timestamp protocols
  const shuffled = [...PROTOCOLS_DB].sort(() => Math.random() - 0.5);
  let time = 0;
  return shuffled.map((p, i) => {
    time += Math.random() * 200 + 10;
    return { ...p, id: i + 1, time: time.toFixed(3), length: 64 + Math.floor(Math.random() * 1400) };
  });
}

function renderPacketTable(packets) {
  const table = document.getElementById('niPaTable');
  table.innerHTML = `
    <table class="ni-packet-table">
      <thead>
        <tr>
          <th data-tip="Packet sequence number">#</th>
          <th data-tip="Relative time from start of capture in milliseconds">Time (ms)</th>
          <th data-tip="Source IP or MAC address">Source</th>
          <th data-tip="Destination IP or MAC address">Destination</th>
          <th data-tip="Highest-level protocol identified in this packet">Protocol</th>
          <th data-tip="Total packet size including all headers">Length</th>
          <th data-tip="Human-readable summary of what the packet does">Info</th>
        </tr>
      </thead>
      <tbody>
        ${packets.map(p => `
          <tr class="ni-pkt-row" data-pkt="${p.id}" style="color:${protoColor(p.proto)}" data-tip="Click to see full packet decode at all OSI layers">
            <td>${p.id}</td>
            <td>${p.time}</td>
            <td>${p.l3 ? p.l3.src : p.l2.src}</td>
            <td>${p.l3 ? p.l3.dst : p.l2.dst}</td>
            <td><b>${p.proto}</b></td>
            <td>${p.length}</td>
            <td>${p.info}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  table.querySelectorAll('.ni-pkt-row').forEach(row => {
    row.addEventListener('click', () => {
      const pkt = packets.find(p => p.id === +row.dataset.pkt);
      if (pkt) renderPacketDetail(pkt);
    });
  });
}

function renderPacketDetail(pkt) {
  const el = document.getElementById('niPaDetail');
  const layers = [];

  // L2 - Data Link
  if (pkt.l2) {
    layers.push({
      name: 'Layer 2 — Data Link (Ethernet II)',
      color: '#3498db',
      fields: Object.entries(pkt.l2).map(([k, v]) => ({
        name: k.toUpperCase(),
        value: v,
        explain: pkt.explain?.[k] || fieldExplain(k, v)
      }))
    });
  }

  // L3 - Network
  if (pkt.l3) {
    layers.push({
      name: `Layer 3 — Network (${pkt.l3.proto === 'ICMP' ? 'ICMP' : 'IPv4'})`,
      color: '#2ecc71',
      fields: Object.entries(pkt.l3).map(([k, v]) => ({
        name: k.toUpperCase(),
        value: v,
        explain: pkt.explain?.[k] || fieldExplain(k, v)
      }))
    });
  }

  // L4 - Transport
  if (pkt.l4) {
    layers.push({
      name: `Layer 4 — Transport (${pkt.l3?.proto || 'TCP'})`,
      color: '#f39c12',
      fields: Object.entries(pkt.l4).map(([k, v]) => ({
        name: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
        value: v,
        explain: pkt.explain?.[k] || fieldExplain(k, v)
      }))
    });
  }

  // L7 - Application
  if (pkt.l7) {
    layers.push({
      name: `Layer 7 — Application (${pkt.proto})`,
      color: '#9b59b6',
      fields: Object.entries(pkt.l7).map(([k, v]) => ({
        name: k.toUpperCase(),
        value: v,
        explain: pkt.explain?.[k] || fieldExplain(k, v)
      }))
    });
  }

  el.innerHTML = `
    <div class="ni-pkt-detail">
      <div class="ni-pkt-detail__title" data-tip="Packet decoded at each OSI layer from bottom (L2) to top (L7)">${pkt.name}</div>
      ${layers.map(l => `
        <div class="ni-pkt-layer" style="border-left:3px solid ${l.color}">
          <div class="ni-pkt-layer__name" style="color:${l.color}">${l.name}</div>
          ${l.fields.map(f => `
            <div class="ni-pkt-field" data-tip="${f.explain}">
              <span class="ni-pkt-field__name">${f.name}:</span>
              <span class="ni-pkt-field__value">${f.value}</span>
              <span class="ni-pkt-field__explain">${f.explain}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function fieldExplain(key, value) {
  const explains = {
    src: `Source address: ${value}`,
    dst: `Destination address: ${value}`,
    type: `EtherType: identifies the protocol encapsulated in the Ethernet frame`,
    proto: `Protocol: ${value}`,
    ttl: `Time To Live = ${value} — decremented by each router. Reaches 0 = packet discarded (prevents loops).`,
    srcPort: `Source port ${value} — ephemeral port chosen by OS for this connection`,
    dstPort: `Destination port ${value} — well-known service port`,
    flags: `TCP flags: ${value}`,
    seq: `Sequence number: ${value} — position of first data byte in the stream`,
    ack: `Acknowledgment: ${value} — next byte expected from the other side`,
    window: `Window size: ${value} bytes — flow control: how much data can be sent before waiting for ACK`,
    method: `HTTP method: ${value}`,
    path: `Request path: ${value}`,
    host: `Host header: ${value} — allows multiple websites on one IP (virtual hosting)`,
    name: `Query name: ${value}`,
    qtype: `Query type: ${value}`
  };
  return explains[key] || `${key}: ${value}`;
}

function protoColor(proto) {
  const colors = { ARP: '#f1c40f', DHCP: '#2ecc71', DNS: '#3498db', TCP: '#9b59b6', HTTP: '#e67e22', ICMP: '#e74c3c' };
  return colors[proto] || '#aaa';
}

/* ===== 2. Cable Tester ===== */

function renderCableTester(el, ctxCard = '') {
  const linkType = selectedLink?.link?.type || 'cat5e';
  const std = CABLE_STANDARDS[linkType] || CABLE_STANDARDS.cat5e;
  const distance = selectedLink ? calcDistance(selectedLink) : 85;

  // Generate random test results with some realistic variance
  const wireMap = Array.from({ length: 8 }, (_, i) => ({
    pair: Math.floor(i / 2) + 1,
    pin: i + 1,
    status: Math.random() > 0.05 ? 'OK' : (Math.random() > 0.5 ? 'Open' : 'Short'),
    color: ['W/O', 'O', 'W/G', 'Bl', 'W/Bl', 'G', 'W/Br', 'Br'][i]
  }));

  const attenResults = Object.entries(std.attenuation).map(([freq, maxAtt]) => {
    const measured = maxAtt * (distance / 100) * (0.9 + Math.random() * 0.2);
    const pass = measured <= maxAtt;
    return { freq: +freq, maxAtt, measured: measured.toFixed(1), pass };
  });

  const nextVal = std.next - Math.random() * 5;
  const fextVal = std.fext - Math.random() * 5;
  const rlVal = std.rl + Math.random() * 5;
  const allOk = wireMap.every(w => w.status === 'OK') && attenResults.every(a => a.pass);

  el.innerHTML = ctxCard + `
    <div class="ni-cable-tester">
      <div class="ni-ct-header">
        <span class="ni-ct-title">Cable Tester / TDR</span>
        <span class="ni-ct-verdict ${allOk ? 'ni-ct-pass' : 'ni-ct-fail'}" data-tip="Overall test result based on the selected cable standard">${allOk ? '✓ PASS' : '✗ FAIL'} (${std.name})</span>
      </div>

      <div class="ni-ct-sections">
        <div class="ni-ct-section">
          <div class="ni-ct-section__title" data-tip="Tests continuity of all 8 wires/4 pairs. Detects opens (breaks), shorts, and miswires.">Wire Map</div>
          <table class="ni-ct-table">
            <thead><tr><th data-tip="Physical pin number on RJ-45 connector">Pin</th><th data-tip="Wire color per T568B standard">Color</th><th data-tip="Pair number (1-4)">Pair</th><th data-tip="Test result: OK, Open (break), Short (pins touching)">Status</th></tr></thead>
            <tbody>
              ${wireMap.map(w => `
                <tr>
                  <td>${w.pin}</td>
                  <td>${w.color}</td>
                  <td>${w.pair}</td>
                  <td class="${w.status === 'OK' ? 'ni-ct-ok' : 'ni-ct-fail-cell'}" data-tip="${w.status === 'OK' ? 'Wire is continuous — signal can pass' : w.status === 'Open' ? 'Wire is broken — no signal can pass at this point' : 'Short circuit — two wires are touching, will cause errors'}">${w.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="ni-ct-section">
          <div class="ni-ct-section__title" data-tip="Measured cable length using TDR (Time Domain Reflectometry) — sends a pulse and measures the reflection delay">Cable Length</div>
          <div class="ni-ct-value" data-tip="Estimated from TDR measurement. Maximum for Cat5e/6: 100m for Ethernet.">${distance.toFixed(1)} m</div>
        </div>

        <div class="ni-ct-section">
          <div class="ni-ct-section__title" data-tip="Signal loss at different frequencies. Higher frequencies lose more signal. Must not exceed the standard's maximum.">Attenuation</div>
          <table class="ni-ct-table">
            <thead><tr><th data-tip="Test frequency in MHz">Freq (MHz)</th><th data-tip="Measured attenuation in dB — how much signal was lost">Measured (dB)</th><th data-tip="Maximum allowed by the cable standard">Max (dB)</th><th>Result</th></tr></thead>
            <tbody>
              ${attenResults.map(a => `
                <tr>
                  <td>${a.freq}</td>
                  <td>${a.measured}</td>
                  <td>${a.maxAtt}</td>
                  <td class="${a.pass ? 'ni-ct-ok' : 'ni-ct-fail-cell'}" data-tip="${a.pass ? 'Within specification — signal loss acceptable' : 'EXCEEDS specification — signal too weak at this frequency, may cause errors'}">${a.pass ? 'PASS' : 'FAIL'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="ni-ct-section">
          <div class="ni-ct-section__title" data-tip="Crosstalk — interference between wire pairs inside the cable. NEXT = Near-End, FEXT = Far-End.">Crosstalk & Return Loss</div>
          <div class="ni-ct-metrics">
            <div class="ni-ct-metric" data-tip="Near-End Crosstalk: signal from one pair leaking into adjacent pair at the transmitter end. Higher is better (more isolation). Min required: ${std.next} dB">
              <span class="ni-ct-metric__label">NEXT</span>
              <span class="ni-ct-metric__value ${nextVal >= std.next ? '' : 'ni-ct-fail-text'}">${nextVal.toFixed(1)} dB</span>
              <span class="ni-ct-metric__req">min ${std.next} dB</span>
            </div>
            <div class="ni-ct-metric" data-tip="Far-End Crosstalk: signal from one pair leaking into adjacent pair at the receiver end. Higher is better. Min required: ${std.fext} dB">
              <span class="ni-ct-metric__label">FEXT</span>
              <span class="ni-ct-metric__value ${fextVal >= std.fext ? '' : 'ni-ct-fail-text'}">${fextVal.toFixed(1)} dB</span>
              <span class="ni-ct-metric__req">min ${std.fext} dB</span>
            </div>
            <div class="ni-ct-metric" data-tip="Return Loss: how much signal bounces back due to impedance mismatches. Higher is better (less reflection). Min required: ${std.rl} dB">
              <span class="ni-ct-metric__label">Return Loss</span>
              <span class="ni-ct-metric__value ${rlVal >= std.rl ? '' : 'ni-ct-fail-text'}">${rlVal.toFixed(1)} dB</span>
              <span class="ni-ct-metric__req">min ${std.rl} dB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function calcDistance(linkData) {
  if (!linkData || !linkData.devices) return 85;
  return 10 + Math.random() * 90; // Random realistic distance
}

/* ===== 3. Network Monitor ===== */

function renderNetworkMonitor(el, ctxCard = '') {
  // Generate simulated metrics for demo
  const linkCount = 5;
  const links = Array.from({ length: linkCount }, (_, i) => ({
    id: i,
    name: `Link ${i + 1}`,
    bw: [1000, 100, 10000, 150, 300][i % 5],
    utilization: Math.random() * 100,
    latency: Math.random() * 50 + 0.5,
    loss: Math.random() * 2
  }));

  const topTalkers = [
    { name: 'Server', ip: '10.0.0.2', bytes: 1234567 },
    { name: 'PC-1', ip: '10.0.0.10', bytes: 567890 },
    { name: 'PC-3', ip: '10.0.0.12', bytes: 234567 }
  ];

  el.innerHTML = ctxCard + `
    <div class="ni-net-monitor">
      <div class="ni-nm-header">
        <span class="ni-nm-title" data-tip="Real-time network health dashboard showing all links and devices">Network Monitor Dashboard</span>
      </div>

      <div class="ni-nm-grid">
        <div class="ni-nm-section">
          <div class="ni-nm-section__title" data-tip="Link status color: Green < 50% utilization, Yellow 50-80%, Red > 80%">Link Health</div>
          <div class="ni-nm-links">
            ${links.map(l => `
              <div class="ni-nm-link" data-tip="${l.name}: ${l.utilization.toFixed(1)}% utilization, ${l.latency.toFixed(1)}ms latency, ${l.loss.toFixed(2)}% loss">
                <div class="ni-nm-link__bar" style="width:${l.utilization}%;background:${utilColor(l.utilization)}" data-tip="Bandwidth utilization: ${l.utilization.toFixed(1)}% of ${l.bw} Mbps"></div>
                <span class="ni-nm-link__name">${l.name}</span>
                <span class="ni-nm-link__stats">${l.utilization.toFixed(0)}% | ${l.latency.toFixed(1)}ms | ${l.loss.toFixed(2)}% loss</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="ni-nm-section">
          <div class="ni-nm-section__title" data-tip="Devices generating the most network traffic">Top Talkers</div>
          ${topTalkers.map((t, i) => `
            <div class="ni-nm-talker" data-tip="${t.name} (${t.ip}) has transferred ${(t.bytes / 1024).toFixed(0)} KB">
              <span>${i + 1}. ${t.name} (${t.ip})</span>
              <span>${(t.bytes / 1024).toFixed(0)} KB</span>
            </div>
          `).join('')}
        </div>

        <div class="ni-nm-section">
          <div class="ni-nm-section__title" data-tip="Issues requiring attention: high utilization, high latency, or packet loss">Alerts</div>
          <div class="ni-nm-alerts">
            ${links.filter(l => l.utilization > 80 || l.loss > 1 || l.latency > 30).map(l => `
              <div class="ni-nm-alert" data-tip="Threshold exceeded — investigate this link">
                ⚠️ ${l.name}: ${l.utilization > 80 ? `High utilization (${l.utilization.toFixed(0)}%)` : ''}${l.loss > 1 ? ` Loss ${l.loss.toFixed(1)}%` : ''}${l.latency > 30 ? ` Latency ${l.latency.toFixed(0)}ms` : ''}
              </div>
            `).join('') || '<div style="color:var(--text-secondary);font-size:.75rem" data-tip="All metrics within normal range">No alerts — network healthy</div>'}
          </div>
        </div>

        <div class="ni-nm-section">
          <div class="ni-nm-section__title" data-tip="Network-wide performance summary">Summary</div>
          <canvas id="niNmChart" width="300" height="150" data-tip="Bandwidth utilization over time for all links"></canvas>
        </div>
      </div>
    </div>
  `;

  // Draw simple chart
  requestAnimationFrame(() => drawMonitorChart(links));
}

function drawMonitorChart(links) {
  const canvas = document.getElementById('niNmChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, W, H);

  // Simulated history
  const history = Array.from({ length: 30 }, () => links.map(l => l.utilization * (0.7 + Math.random() * 0.6)));

  const colors = ['#2ecc71', '#3498db', '#e74c3c', '#f1c40f', '#9b59b6'];
  history[0].forEach((_, linkIdx) => {
    ctx.strokeStyle = colors[linkIdx % colors.length];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    history.forEach((frame, x) => {
      const px = x / (history.length - 1) * W;
      const py = H - (frame[linkIdx] / 100) * H;
      if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
  });
}

function utilColor(pct) {
  if (pct < 50) return '#2ecc71';
  if (pct < 80) return '#f1c40f';
  return '#e74c3c';
}

/* ===== 4. Signal Meter ===== */

function renderSignalMeter(el, ctxCard = '') {
  const signalDbm = -30 - Math.random() * 60; // -30 to -90 dBm
  const noiseFloor = -95 + Math.random() * 10; // around -90 dBm
  const snr = signalDbm - noiseFloor;
  const quality = snr > 30 ? 'Excellent' : snr > 20 ? 'Good' : snr > 10 ? 'Fair' : 'Poor';

  const channels = Array.from({ length: 13 }, (_, i) => ({
    ch: i + 1,
    freq: 2412 + i * 5,
    signal: -40 - Math.random() * 50,
    ssid: ['HomeNet', 'Office', 'Guest', 'Neighbor1', 'IoT', ''][Math.floor(Math.random() * 6)]
  }));

  el.innerHTML = ctxCard + `
    <div class="ni-signal-meter">
      <div class="ni-sm-header">
        <span class="ni-sm-title" data-tip="Measures wireless signal strength, noise, and signal-to-noise ratio at the selected point">Signal Level Meter</span>
      </div>

      <div class="ni-sm-display">
        <div class="ni-sm-gauge" data-tip="Analog-style signal strength indicator. Further right = stronger signal.">
          <canvas id="niSmGauge" width="200" height="120"></canvas>
        </div>
        <div class="ni-sm-digital">
          <div class="ni-sm-reading" data-tip="Received Signal Strength Indicator in dBm. -30 = excellent, -60 = good, -80 = weak, -90 = barely usable">
            <span class="ni-sm-reading__label">Signal</span>
            <span class="ni-sm-reading__value" style="color:${signalDbm > -60 ? '#2ecc71' : signalDbm > -80 ? '#f1c40f' : '#e74c3c'}">${signalDbm.toFixed(1)} dBm</span>
          </div>
          <div class="ni-sm-reading" data-tip="Background noise level in dBm. Lower (more negative) is better. Typical: -90 to -100 dBm">
            <span class="ni-sm-reading__label">Noise Floor</span>
            <span class="ni-sm-reading__value">${noiseFloor.toFixed(1)} dBm</span>
          </div>
          <div class="ni-sm-reading" data-tip="Signal-to-Noise Ratio: difference between signal and noise in dB. >30 = excellent, >20 = good, >10 = marginal, <10 = poor">
            <span class="ni-sm-reading__label">SNR</span>
            <span class="ni-sm-reading__value" style="color:${snr > 20 ? '#2ecc71' : snr > 10 ? '#f1c40f' : '#e74c3c'}">${snr.toFixed(1)} dB</span>
          </div>
          <div class="ni-sm-reading" data-tip="Overall signal quality assessment based on SNR">
            <span class="ni-sm-reading__label">Quality</span>
            <span class="ni-sm-reading__value">${quality}</span>
          </div>
        </div>
      </div>

      <div class="ni-sm-scan">
        <div class="ni-sm-scan__title" data-tip="Scan of all Wi-Fi channels showing signal strength of detected access points">Wi-Fi Channel Scan (2.4 GHz)</div>
        <canvas id="niSmScan" width="400" height="120" data-tip="Bar chart of detected signals per Wi-Fi channel. Taller bars = stronger signals."></canvas>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    drawGauge(signalDbm);
    drawChannelScan(channels);
  });
}

function drawGauge(dbm) {
  const canvas = document.getElementById('niSmGauge');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H - 10;
  const r = 80;

  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, W, H);

  // Scale arc
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.stroke();

  // Color zones
  const zones = [
    { start: Math.PI, end: Math.PI * 0.72, color: '#e74c3c' },
    { start: Math.PI * 0.72, end: Math.PI * 0.44, color: '#f1c40f' },
    { start: Math.PI * 0.44, end: 0, color: '#2ecc71' }
  ];
  zones.forEach(z => {
    ctx.strokeStyle = z.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, z.start, z.end, true);
    ctx.stroke();
  });

  // Needle
  const normalizedDbm = Math.max(0, Math.min(1, (dbm + 100) / 70)); // -100 to -30 range
  const angle = Math.PI * (1 - normalizedDbm);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * (r - 10), cy - Math.sin(angle) * (r - 10));
  ctx.stroke();

  // Center dot
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();

  // Labels
  ctx.fillStyle = '#666';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('-100', cx - r + 10, cy - 5);
  ctx.fillText('-30', cx + r - 10, cy - 5);
  ctx.fillText('dBm', cx, cy - r + 20);
}

function drawChannelScan(channels) {
  const canvas = document.getElementById('niSmScan');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, W, H);

  const barW = W / channels.length - 4;
  channels.forEach((ch, i) => {
    const normalized = Math.max(0, (ch.signal + 100) / 70); // -100 to -30
    const barH = normalized * (H - 20);
    const x = i * (barW + 4) + 2;
    const y = H - barH - 15;

    ctx.fillStyle = ch.signal > -60 ? '#2ecc71' : ch.signal > -80 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(x, y, barW, barH);

    ctx.fillStyle = '#666';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ch.ch, x + barW / 2, H - 2);
  });
}

/* ===== 5. BER Tester ===== */

function renderBerTester(el, ctxCard = '') {
  const totalBits = 100000;
  const linkLoss = selectedLink?.link ? 0.001 : 0;
  const errorRate = linkLoss + Math.random() * 0.005;
  const errors = Math.floor(totalBits * errorRate);
  const ber = errors / totalBits;
  const testDuration = 10; // seconds

  const errorPattern = Array.from({ length: 50 }, () => Math.random() < errorRate * 10);

  el.innerHTML = ctxCard + `
    <div class="ni-ber-tester">
      <div class="ni-bt-header">
        <span class="ni-bt-title" data-tip="Bit Error Rate Tester — measures transmission quality by sending known patterns and counting errors">BER Tester (BERT)</span>
      </div>

      <div class="ni-bt-config">
        <div class="ni-bt-config-row">
          <div class="ni-bt-field" data-tip="Pattern type: PRBS (Pseudo-Random Bit Sequence) generates a deterministic pattern that looks random. Both sides know the pattern, so errors are detectable.">
            <label>Pattern</label>
            <select class="sa-select">
              <option data-tip="2^7-1 = 127 bit repeating sequence — short, fast sync">PRBS-7</option>
              <option data-tip="2^15-1 = 32767 bit sequence — standard testing pattern" selected>PRBS-15</option>
              <option data-tip="2^23-1 = 8.3M bit sequence — stresses equalizers">PRBS-23</option>
              <option data-tip="2^31-1 = 2.1B bit sequence — thorough test">PRBS-31</option>
              <option data-tip="All ones — tests DC balance and power handling">All 1s</option>
              <option data-tip="Alternating 1010... — maximum transition density">1010...</option>
            </select>
          </div>
          <div class="ni-bt-field" data-tip="Number of bits to transmit for the test. More bits = more statistically significant result.">
            <label>Test Bits</label>
            <span class="ni-bt-value">${(totalBits / 1000).toFixed(0)}K</span>
          </div>
          <div class="ni-bt-field" data-tip="Duration of the test in seconds">
            <label>Duration</label>
            <span class="ni-bt-value">${testDuration} sec</span>
          </div>
        </div>
      </div>

      <div class="ni-bt-results">
        <div class="ni-bt-main">
          <div class="ni-bt-ber ${ber < 1e-6 ? 'ni-bt-ber--ok' : ber < 1e-3 ? 'ni-bt-ber--warn' : 'ni-bt-ber--fail'}" data-tip="Bit Error Rate — fraction of received bits that are wrong. Telecom standard: < 10^-6 for copper, < 10^-12 for fiber">
            <div class="ni-bt-ber__label">BER</div>
            <div class="ni-bt-ber__value">${ber.toExponential(2)}</div>
            <div class="ni-bt-ber__note">${ber < 1e-6 ? 'Excellent — within telecom standards' : ber < 1e-3 ? 'Marginal — may cause visible errors' : 'Poor — too many errors for reliable transmission'}</div>
          </div>
        </div>

        <div class="ni-bt-stats">
          <div class="ni-bt-stat" data-tip="Total number of bits transmitted during the test">
            <span class="ni-bt-stat__label">Bits Tested</span>
            <span class="ni-bt-stat__value">${totalBits.toLocaleString()}</span>
          </div>
          <div class="ni-bt-stat" data-tip="Number of bits received incorrectly">
            <span class="ni-bt-stat__label">Errors</span>
            <span class="ni-bt-stat__value">${errors.toLocaleString()}</span>
          </div>
          <div class="ni-bt-stat" data-tip="Errored Seconds — number of 1-second intervals with at least one error. Fewer = more stable link.">
            <span class="ni-bt-stat__label">Errored Seconds</span>
            <span class="ni-bt-stat__value">${Math.ceil(errors > 0 ? testDuration * 0.3 : 0)}</span>
          </div>
          <div class="ni-bt-stat" data-tip="Severely Errored Seconds — seconds with BER > 10^-3. These represent significant link degradation.">
            <span class="ni-bt-stat__label">SES</span>
            <span class="ni-bt-stat__value">${Math.floor(errors > 100 ? testDuration * 0.1 : 0)}</span>
          </div>
        </div>

        <div class="ni-bt-pattern" data-tip="Visual pattern of errors over time: green = no errors in this interval, red = errors detected">
          <div class="ni-bt-pattern__label">Error Distribution</div>
          <div class="ni-bt-pattern__grid">
            ${errorPattern.map((err, i) => `<span class="ni-bt-pattern__cell ${err ? 'ni-bt-err' : 'ni-bt-ok'}" data-tip="Interval ${i + 1}: ${err ? 'errors detected' : 'clean'}"></span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}
