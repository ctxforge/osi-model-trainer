import { toHex, ipToBytes, generateMAC, formatMAC, checksumPlaceholder } from '../core/utils.js';
import { addXP, unlockAchievement } from '../core/gamification.js';
import { simState } from '../core/lab-data.js';
import { OSI_LAYERS } from '../data/osi-layers.js';
import { initFileUpload } from './simulator-file.js';

let simProto = 'tcp';
let simL7Proto = 'http';
let simVlan = false;
let simIpv6 = false;
let simMode = 'encap';

function buildHexDump(bytes, hlRanges) {
  let html = '';
  for (let off = 0; off < bytes.length; off += 16) {
    const chunk = bytes.slice(off, off + 16);
    html += `<span class="hex-offset">${toHex(off, 4)}  </span>`;
    let hexPart = '';
    let asciiPart = '';
    for (let i = 0; i < 16; i++) {
      if (i < chunk.length) {
        const b = chunk[i];
        let cls = 'hex-byte';
        if (hlRanges) {
          for (const r of hlRanges) {
            if (off + i >= r.start && off + i < r.end) { cls = 'hex-byte-hl'; break; }
          }
        }
        hexPart += `<span class="${cls}" style="${cls === 'hex-byte-hl' && hlRanges ? 'color:' + (hlRanges.find(r => off+i >= r.start && off+i < r.end) || {}).color : ''}">${toHex(b)}</span> `;
        asciiPart += (b >= 32 && b < 127) ? String.fromCharCode(b) : '.';
      } else {
        hexPart += '   ';
        asciiPart += ' ';
      }
      if (i === 7) hexPart += ' ';
    }
    html += hexPart + ` <span class="hex-ascii">${asciiPart}</span>\n`;
  }
  return html;
}

function buildBinaryView(bytes) {
  let html = '';
  for (let i = 0; i < bytes.length; i++) {
    const bits = bytes[i].toString(2).padStart(8, '0');
    for (const bit of bits) html += `<span class="bit-${bit}">${bit}</span>`;
    if ((i + 1) % 4 === 0) html += '\n'; else html += ' ';
  }
  return html;
}

/* ========== Build Application Layer by protocol ========== */
function buildL7(message, dstIp, dstPort, srcPort) {
  const useFile = simState.uploadedFile && simState.uploadedBytes && simState.uploadedBytes.length > 0;
  const fileBytes = useFile ? simState.uploadedBytes.slice(0, 512) : null;

  if (simL7Proto === 'dns') {
    // DNS Query
    const domain = message || 'example.com';
    const txId = Math.floor(Math.random() * 65535);
    const labels = domain.split('.').flatMap(l => [l.length, ...Array.from(new TextEncoder().encode(l))]);
    const dnsBytes = [
      (txId >> 8) & 0xFF, txId & 0xFF, // Transaction ID
      0x01, 0x00, // Flags: standard query
      0x00, 0x01, // Questions: 1
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Answer/Auth/Additional: 0
      ...labels, 0x00, // QNAME
      0x00, 0x01, // QTYPE: A
      0x00, 0x01  // QCLASS: IN
    ];
    return {
      proto: 'DNS', bytes: dnsBytes, l4proto: 'udp',
      desc: `DNS Query для ${domain}`,
      body: `<table class="pdu-fields">
        <tr><td>Transaction ID</td><td>0x${toHex(txId, 4)}</td></tr>
        <tr><td>Flags</td><td>0x0100 (Standard Query)</td></tr>
        <tr><td>Questions</td><td>1</td></tr>
        <tr><td>QNAME</td><td>${domain}</td></tr>
        <tr><td>QTYPE</td><td>A (IPv4 address)</td></tr>
        <tr><td>QCLASS</td><td>IN (Internet)</td></tr>
      </table>`,
      port: 53
    };
  }

  if (simL7Proto === 'icmp') {
    // ICMP Echo Request
    const id = Math.floor(Math.random() * 65535);
    const seq = 1;
    const payload = Array.from(new TextEncoder().encode(message || 'ping'));
    const icmpBytes = [
      0x08, 0x00, // Type: Echo Request, Code: 0
      0x00, 0x00, // Checksum (placeholder)
      (id >> 8) & 0xFF, id & 0xFF,
      (seq >> 8) & 0xFF, seq & 0xFF,
      ...payload
    ];
    const cs = checksumPlaceholder(icmpBytes);
    icmpBytes[2] = cs[0]; icmpBytes[3] = cs[1];
    return {
      proto: 'ICMP', bytes: icmpBytes, l4proto: 'none', ipProto: 1,
      desc: 'ICMP Echo Request (ping)',
      body: `<table class="pdu-fields">
        <tr><td>Type</td><td>8 (Echo Request)</td></tr>
        <tr><td>Code</td><td>0</td></tr>
        <tr><td>Checksum</td><td>0x${toHex(icmpBytes[2])}${toHex(icmpBytes[3])}</td></tr>
        <tr><td>Identifier</td><td>0x${toHex(id, 4)}</td></tr>
        <tr><td>Sequence</td><td>${seq}</td></tr>
        <tr><td>Data</td><td>${message || 'ping'} (${payload.length} байт)</td></tr>
      </table>`
    };
  }

  if (simL7Proto === 'arp') {
    // ARP Request
    const srcMac = generateMAC();
    const srcIpB = ipToBytes(document.getElementById('simSrcIp').value.trim());
    const dstIpB = ipToBytes(dstIp);
    const arpBytes = [
      0x00, 0x01, // Hardware type: Ethernet
      0x08, 0x00, // Protocol type: IPv4
      0x06, 0x04, // HW size: 6, Proto size: 4
      0x00, 0x01, // Opcode: Request
      ...srcMac, ...srcIpB,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...dstIpB // Target: unknown MAC
    ];
    return {
      proto: 'ARP', bytes: arpBytes, l4proto: 'none', isArp: true,
      desc: `ARP: Кто имеет ${dstIp}? Скажите ${document.getElementById('simSrcIp').value.trim()}`,
      body: `<table class="pdu-fields">
        <tr><td>Hardware Type</td><td>1 (Ethernet)</td></tr>
        <tr><td>Protocol Type</td><td>0x0800 (IPv4)</td></tr>
        <tr><td>Opcode</td><td>1 (Request)</td></tr>
        <tr><td>Sender MAC</td><td>${formatMAC(srcMac)}</td></tr>
        <tr><td>Sender IP</td><td>${document.getElementById('simSrcIp').value.trim()}</td></tr>
        <tr><td>Target MAC</td><td>00:00:00:00:00:00</td></tr>
        <tr><td>Target IP</td><td>${dstIp}</td></tr>
      </table>`
    };
  }

  if (simL7Proto === 'dhcp') {
    // DHCP Discover
    const txId = Math.floor(Math.random() * 0xFFFFFFFF);
    const clientMac = generateMAC();
    // DHCP Discover (BOOTP): op=1, htype=1, hlen=6, hops=0
    const dhcpBytes = [
      0x01, 0x01, 0x06, 0x00, // Op, HType, HLen, Hops
      (txId >> 24) & 0xFF, (txId >> 16) & 0xFF, (txId >> 8) & 0xFF, txId & 0xFF, // Transaction ID
      0x00, 0x00, // Seconds elapsed
      0x80, 0x00, // Flags: Broadcast
      0x00, 0x00, 0x00, 0x00, // Client IP (0.0.0.0)
      0x00, 0x00, 0x00, 0x00, // Your IP (0.0.0.0)
      0x00, 0x00, 0x00, 0x00, // Server IP (0.0.0.0)
      0x00, 0x00, 0x00, 0x00, // Gateway IP (0.0.0.0)
      ...clientMac, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Client MAC + padding to 16
      // Server hostname (64 bytes) + Boot filename (128 bytes) — zeroed, just pad key fields
      ...new Array(192).fill(0x00),
      // Magic cookie
      0x63, 0x82, 0x53, 0x63,
      // Option 53: DHCP Message Type = 1 (Discover)
      0x35, 0x01, 0x01,
      // Option 55: Parameter Request List
      0x37, 0x04, 0x01, 0x03, 0x06, 0x0F,
      // End
      0xFF
    ];
    return {
      proto: 'DHCP', bytes: dhcpBytes, l4proto: 'udp',
      desc: 'DHCP Discover — клиент ищет DHCP-сервер (broadcast)',
      body: `<table class="pdu-fields">
        <tr><td>Op</td><td>1 (BOOTREQUEST)</td></tr>
        <tr><td>HType</td><td>1 (Ethernet)</td></tr>
        <tr><td>Transaction ID</td><td>0x${txId.toString(16).toUpperCase().padStart(8, '0')}</td></tr>
        <tr><td>Flags</td><td>0x8000 (Broadcast)</td></tr>
        <tr><td>Client MAC</td><td>${formatMAC(clientMac)}</td></tr>
        <tr><td>DHCP Type</td><td>1 (Discover)</td></tr>
        <tr><td>Options</td><td>Subnet Mask, Router, DNS, Domain Name</td></tr>
      </table>
      <div class="pdu-note" style="margin-top:8px">
        <strong>Процесс DORA:</strong><br>
        1. <strong>Discover</strong> — клиент отправляет broadcast (0.0.0.0 → 255.255.255.255)<br>
        2. <strong>Offer</strong> — сервер предлагает IP-адрес<br>
        3. <strong>Request</strong> — клиент запрашивает предложенный IP<br>
        4. <strong>Ack</strong> — сервер подтверждает аренду (lease)
      </div>`,
      port: 67
    };
  }

  // Default: HTTP
  const contentType = useFile ? simState.uploadedFile.type : 'text/plain';
  const contentLen = useFile ? simState.uploadedFile.size : message.length;
  const bodyForHttp = useFile ? `[binary data: ${simState.uploadedFile.name}]` : message;
  const httpReq = `POST /upload HTTP/1.1\r\nHost: ${dstIp}\r\nContent-Type: ${contentType}\r\nContent-Length: ${contentLen}\r\n\r\n${bodyForHttp}`;
  const httpBytes = useFile
    ? [...Array.from(new TextEncoder().encode(`POST /upload HTTP/1.1\r\nHost: ${dstIp}\r\nContent-Type: ${contentType}\r\nContent-Length: ${contentLen}\r\n\r\n`)), ...fileBytes]
    : Array.from(new TextEncoder().encode(httpReq));

  return {
    proto: 'HTTP', bytes: httpBytes, l4proto: simProto,
    desc: useFile ? 'HTTP-запрос для передачи файла' : 'HTTP-запрос с сообщением',
    body: `
      ${useFile && simState.uploadedImg ? `<img src="${simState.uploadedImg}" style="max-width:100%;max-height:80px;border-radius:6px;margin-bottom:8px;display:block">` : ''}
      <div class="pdu-appdata">${httpReq.replace(/\r\n/g, '\n').replace(/</g, '&lt;')}</div>
      <table class="pdu-fields mt-12">
        <tr><td>Метод</td><td>POST /upload</td></tr>
        <tr><td>Host</td><td>${dstIp}</td></tr>
        <tr><td>Content-Type</td><td>${contentType}</td></tr>
        <tr><td>Content-Length</td><td>${contentLen.toLocaleString()} байт</td></tr>
        ${useFile ? `<tr><td>Файл</td><td>${simState.uploadedFile.name}</td></tr>` : `<tr><td>Тело</td><td>${message}</td></tr>`}
      </table>
      ${useFile ? `<div class="pdu-note">Всего пакетов для передачи файла: ${Math.ceil(contentLen / 1460)} TCP-сегментов (показан первый)</div>` : ''}`,
    port: dstPort
  };
}

function buildFullPacket() {
  const message = document.getElementById('simMessage').value || 'Hello';
  const srcIp = document.getElementById('simSrcIp').value.trim();
  const dstIp = document.getElementById('simDstIp').value.trim();
  const srcPort = parseInt(document.getElementById('simSrcPort').value) || 49152;
  const dstPort = parseInt(document.getElementById('simDstPort').value) || 80;

  const srcIpB = ipToBytes(srcIp);
  const dstIpB = ipToBytes(dstIp);
  if (srcIpB.length !== 4 || dstIpB.length !== 4 || srcIpB.some(x => isNaN(x) || x > 255) || dstIpB.some(x => isNaN(x) || x > 255)) {
    document.getElementById('simResult').innerHTML = '<div class="card" style="color:#e74c3c;margin-top:16px">Некорректный IP-адрес</div>';
    return;
  }

  // Build L7
  const l7 = buildL7(message, dstIp, dstPort, srcPort);
  const appBytes = l7.bytes;
  const effectiveL4 = l7.l4proto || simProto;
  const effectiveDstPort = l7.port || dstPort;
  const isTCP = effectiveL4 === 'tcp';
  const noL4 = effectiveL4 === 'none';

  // L4 header
  let l4Header = [], l4Fields = [], l4Name = '', pduName = '';
  const seqNum = 1000 + Math.floor(Math.random() * 9000);

  if (noL4) {
    l4Header = [];
    l4Name = l7.proto;
    pduName = 'Пакет';
  } else if (isTCP) {
    l4Name = 'TCP'; pduName = 'Сегмент';
    l4Header = [
      (srcPort >> 8) & 0xFF, srcPort & 0xFF,
      (effectiveDstPort >> 8) & 0xFF, effectiveDstPort & 0xFF,
      (seqNum >> 24) & 0xFF, (seqNum >> 16) & 0xFF, (seqNum >> 8) & 0xFF, seqNum & 0xFF,
      0x00, 0x00, 0x00, 0x00, 0x50, 0x18, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00
    ];
    const tcpCs = checksumPlaceholder([...l4Header, ...appBytes]);
    l4Header[16] = tcpCs[0]; l4Header[17] = tcpCs[1];
    l4Fields = [
      ['Порт источника', `${srcPort}  (0x${toHex(srcPort, 4)})`],
      ['Порт назначения', `${effectiveDstPort}  (0x${toHex(effectiveDstPort, 4)})`],
      ['Sequence Number', `${seqNum}  (0x${toHex(seqNum, 8)})`],
      ['Acknowledgment', '0  (0x00000000)'],
      ['Data Offset', '5 (20 байт)'], ['Флаги', 'PSH, ACK (0x018)'],
      ['Window Size', '65535 (0xFFFF)'],
      ['Checksum', `0x${toHex(l4Header[16])}${toHex(l4Header[17])}`],
      ['Urgent Pointer', '0']
    ];
  } else {
    l4Name = 'UDP'; pduName = 'Датаграмма';
    const udpLen = 8 + appBytes.length;
    l4Header = [
      (srcPort >> 8) & 0xFF, srcPort & 0xFF,
      (effectiveDstPort >> 8) & 0xFF, effectiveDstPort & 0xFF,
      (udpLen >> 8) & 0xFF, udpLen & 0xFF, 0x00, 0x00
    ];
    const udpCs = checksumPlaceholder([...l4Header, ...appBytes]);
    l4Header[6] = udpCs[0]; l4Header[7] = udpCs[1];
    l4Fields = [
      ['Порт источника', `${srcPort}  (0x${toHex(srcPort, 4)})`],
      ['Порт назначения', `${effectiveDstPort}  (0x${toHex(effectiveDstPort, 4)})`],
      ['Длина', `${udpLen} байт`],
      ['Checksum', `0x${toHex(l4Header[6])}${toHex(l4Header[7])}`]
    ];
  }

  // L3: IP header
  let ipHeader, ipFields;
  const ipId = Math.floor(Math.random() * 65535);

  if (l7.isArp) {
    // ARP has no IP header
    ipHeader = [];
    ipFields = [];
  } else if (simIpv6) {
    // IPv6 header (40 bytes fixed)
    const payloadLen = l4Header.length + appBytes.length;
    const nextHeader = noL4 ? (l7.ipProto || 58) : (isTCP ? 6 : 17);
    ipHeader = [
      0x60, 0x00, 0x00, 0x00, // Version + Traffic Class + Flow Label
      (payloadLen >> 8) & 0xFF, payloadLen & 0xFF,
      nextHeader, 64, // Next Header, Hop Limit
      // Source: ::1 (simplified)
      0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01,
      // Dest: ::1
      0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x01
    ];
    // Replace with real IPs (simplified — use first 4 bytes)
    srcIpB.forEach((b, i) => ipHeader[8 + 12 + i] = b);
    dstIpB.forEach((b, i) => ipHeader[24 + 12 + i] = b);
    ipFields = [
      ['Версия', '6 (IPv6)'],
      ['Traffic Class', '0x00'],
      ['Flow Label', '0x00000'],
      ['Payload Length', `${payloadLen} байт`],
      ['Next Header', `${nextHeader} (${noL4 ? l7.proto : l4Name})`],
      ['Hop Limit', '64'],
      ['IP источника', srcIp + ' (mapped to IPv6)'],
      ['IP назначения', dstIp + ' (mapped to IPv6)']
    ];
  } else {
    // IPv4
    const ipTotalLen = 20 + l4Header.length + appBytes.length;
    const ipProtoNum = noL4 ? (l7.ipProto || 1) : (isTCP ? 6 : 17);
    ipHeader = [
      0x45, 0x00,
      (ipTotalLen >> 8) & 0xFF, ipTotalLen & 0xFF,
      (ipId >> 8) & 0xFF, ipId & 0xFF,
      0x40, 0x00, 0x40, ipProtoNum,
      0x00, 0x00, ...srcIpB, ...dstIpB
    ];
    const ipCs = checksumPlaceholder(ipHeader);
    ipHeader[10] = ipCs[0]; ipHeader[11] = ipCs[1];
    ipFields = [
      ['Версия', '4 (IPv4)'], ['IHL', '5 (20 байт)'], ['DSCP / ECN', '0x00'],
      ['Total Length', `${ipTotalLen} байт`], ['Identification', `0x${toHex(ipId, 4)}`],
      ['Flags', 'DF (Don\'t Fragment)'], ['Fragment Offset', '0'], ['TTL', '64'],
      ['Protocol', `${ipProtoNum} (${noL4 ? l7.proto : l4Name})`],
      ['Header Checksum', `0x${toHex(ipHeader[10])}${toHex(ipHeader[11])}`],
      ['IP источника', srcIp], ['IP назначения', dstIp]
    ];
  }

  // L2: Ethernet
  const srcMAC = generateMAC();
  const dstMAC = generateMAC();
  const etherType = l7.isArp ? [0x08, 0x06] : (simIpv6 ? [0x86, 0xDD] : [0x08, 0x00]);
  let ethHeader = [...dstMAC, ...srcMAC];

  // VLAN tag (802.1Q) — 4 bytes
  let vlanTag = [];
  if (simVlan && !l7.isArp) {
    const vlanId = 100;
    vlanTag = [0x81, 0x00, (vlanId >> 8) & 0x0F, vlanId & 0xFF];
    ethHeader = [...ethHeader, ...vlanTag];
  }
  ethHeader = [...ethHeader, ...etherType];

  const ethPayload = [...ipHeader, ...l4Header, ...appBytes];
  const crc = checksumPlaceholder(ethPayload);
  const ethTrailer = [crc[0], crc[1], crc[0] ^ 0xFF, crc[1] ^ 0xFF];

  const ethFields = [
    ['MAC назначения', formatMAC(dstMAC)],
    ['MAC источника', formatMAC(srcMAC)],
    ...(simVlan ? [['802.1Q VLAN Tag', `VLAN ID: 100, Priority: 0`]] : []),
    ['EtherType', l7.isArp ? '0x0806 (ARP)' : (simIpv6 ? '0x86DD (IPv6)' : '0x0800 (IPv4)')],
    ['FCS (CRC-32)', `0x${ethTrailer.map(b => toHex(b)).join('')}`]
  ];

  // Complete frame
  const frame = [...ethHeader, ...ethPayload, ...ethTrailer];
  const preamble = [0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAB];
  const physFrame = [...preamble, ...frame];

  const getL = (n) => OSI_LAYERS.find(l => l.number === n);

  // Size bar segments
  const ethHdrSize = ethHeader.length;
  const ipHdrSize = ipHeader.length;
  const segments = [
    { label: simVlan ? 'ETH+VLAN' : 'ETH', size: ethHdrSize, color: getL(2).color },
    ...(ipHdrSize > 0 ? [{ label: simIpv6 ? 'IPv6' : 'IP', size: ipHdrSize, color: getL(3).color }] : []),
    ...(l4Header.length > 0 ? [{ label: l4Name, size: l4Header.length, color: getL(4).color }] : []),
    { label: l7.proto, size: appBytes.length, color: getL(7).color },
    { label: 'CRC', size: 4, color: getL(2).color }
  ];
  const totalSize = frame.length;

  // Build layers for rendering
  const ethEnd = ethHdrSize;
  const ipEnd = ethEnd + ipHdrSize;
  const l4End = ipEnd + l4Header.length;
  const dataEnd = l4End + appBytes.length;

  const hlAll = [
    { start: 0, end: ethEnd, color: getL(2).color },
    ...(ipHdrSize > 0 ? [{ start: ethEnd, end: ipEnd, color: getL(3).color }] : []),
    ...(l4Header.length > 0 ? [{ start: ipEnd, end: l4End, color: getL(4).color }] : []),
    { start: l4End, end: dataEnd, color: getL(7).color },
    { start: dataEnd, end: frame.length, color: getL(2).color }
  ];

  const layers = [];

  // L7
  layers.push({
    num: 7, name: getL(7).name, nameEn: 'Application', color: getL(7).color,
    pdu: 'Данные', totalSize: appBytes.length,
    diagramSegs: [{ label: `${l7.proto} (${appBytes.length} Б)`, pct: 100, color: getL(7).color }],
    body: `<div class="pdu-note">${l7.desc}</div>${l7.body}`,
    hex: appBytes
  });

  // L6
  layers.push({
    num: 6, name: getL(6).name, nameEn: 'Presentation', color: getL(6).color,
    pdu: 'Данные', totalSize: appBytes.length,
    diagramSegs: [{ label: `Данные (${appBytes.length} Б)`, pct: 100, color: getL(6).color }],
    body: `<div class="pdu-note">Уровень представления: кодирование данных${simL7Proto === 'http' ? ' (UTF-8)' : ''}</div>`,
    hex: null
  });

  // L5
  layers.push({
    num: 5, name: getL(5).name, nameEn: 'Session', color: getL(5).color,
    pdu: 'Данные', totalSize: appBytes.length,
    diagramSegs: [{ label: `Сеанс (${appBytes.length} Б)`, pct: 100, color: getL(5).color }],
    body: `<div class="pdu-note">Управление сеансом</div><table class="pdu-fields"><tr><td>Тип</td><td>${noL4 ? 'Без соединения' : isTCP ? 'Надёжный (TCP)' : 'Без соединения (UDP)'}</td></tr></table>`,
    hex: null
  });

  // L4 (only if present)
  if (!noL4) {
    layers.push({
      num: 4, name: getL(4).name, nameEn: 'Transport', color: getL(4).color,
      pdu: pduName, totalSize: l4Header.length + appBytes.length,
      diagramSegs: [
        { label: `${l4Name} (${l4Header.length} Б)`, pct: (l4Header.length / (l4Header.length + appBytes.length)) * 100, color: getL(4).color },
        { label: `Данные (${appBytes.length} Б)`, pct: (appBytes.length / (l4Header.length + appBytes.length)) * 100, color: getL(7).color + '99' }
      ],
      body: `<table class="pdu-fields">${l4Fields.map(f => `<tr><td>${f[0]}</td><td>${f[1]}</td></tr>`).join('')}</table>`,
      hex: [...l4Header, ...appBytes],
      hlRanges: [{ start: 0, end: l4Header.length, color: getL(4).color }]
    });
  }

  // L3 (only if present)
  if (ipHeader.length > 0) {
    const l3Total = ipHdrSize + l4Header.length + appBytes.length;
    layers.push({
      num: 3, name: getL(3).name, nameEn: 'Network', color: getL(3).color,
      pdu: 'Пакет', totalSize: l3Total,
      diagramSegs: [
        { label: `${simIpv6 ? 'IPv6' : 'IP'} (${ipHdrSize} Б)`, pct: (ipHdrSize / l3Total) * 100, color: getL(3).color },
        ...(l4Header.length ? [{ label: `${l4Name} (${l4Header.length} Б)`, pct: (l4Header.length / l3Total) * 100, color: getL(4).color }] : []),
        { label: `Данные (${appBytes.length} Б)`, pct: (appBytes.length / l3Total) * 100, color: getL(7).color + '99' }
      ],
      body: `<table class="pdu-fields">${ipFields.map(f => `<tr><td>${f[0]}</td><td>${f[1]}</td></tr>`).join('')}</table>`,
      hex: [...ipHeader, ...l4Header, ...appBytes],
      hlRanges: [{ start: 0, end: ipHdrSize, color: getL(3).color }]
    });
  }

  // L2
  layers.push({
    num: 2, name: getL(2).name, nameEn: 'Data Link', color: getL(2).color,
    pdu: 'Кадр', totalSize: frame.length,
    diagramSegs: segments.map(s => ({ label: `${s.label} (${s.size} Б)`, pct: (s.size / totalSize) * 100, color: s.color })),
    body: `<table class="pdu-fields">${ethFields.map(f => `<tr><td>${f[0]}</td><td>${f[1]}</td></tr>`).join('')}</table>`,
    hex: frame, hlRanges: hlAll
  });

  // L1
  layers.push({
    num: 1, name: getL(1).name, nameEn: 'Physical', color: getL(1).color,
    pdu: 'Биты', totalSize: physFrame.length,
    diagramSegs: [
      { label: 'Преамбула (8 Б)', pct: (8 / physFrame.length) * 100, color: getL(1).color },
      ...segments.map(s => ({ label: `${s.label} (${s.size} Б)`, pct: (s.size / physFrame.length) * 100, color: s.color }))
    ],
    body: null, isBinary: true, binaryData: physFrame
  });

  // Deencapsulation: reverse order (L1 → L7)
  const renderLayers = simMode === 'deencap' ? [...layers].reverse() : layers;

  renderResult(renderLayers, segments, totalSize, frame, hlAll);
}

function renderResult(layers, segments, totalSize, frame, hlAll) {
  const result = document.getElementById('simResult');
  let html = '';

  const dirLabel = simMode === 'deencap' ? 'Деинкапсуляция: разбор кадра снизу вверх' : `Структура кадра (${totalSize} байт)`;

  html += `<div class="pdu-overview">
    <div class="pdu-overview__title">${dirLabel}</div>
    <div class="pdu-size-bar">
      ${segments.map(s => `<div class="pdu-size-bar__seg" style="flex:${s.size};background:${s.color}">${s.size > 10 ? s.label : ''}</div>`).join('')}
    </div>
    <div class="pdu-size-bar__legend">
      ${segments.map(s => `<div class="pdu-size-bar__legend-item"><div class="pdu-size-bar__legend-dot" style="background:${s.color}"></div>${s.label} ${s.size}Б</div>`).join('')}
    </div>
  </div>`;

  layers.forEach((layer, idx) => {
    const isOpen = idx === 0;
    html += `<div class="pdu-card${isOpen ? ' open' : ''}" data-pdu-card="${layer.num}">
      <div class="pdu-card__header">
        <div class="pdu-card__badge" style="background:${layer.color}">L${layer.num}</div>
        <div class="pdu-card__title-area">
          <div class="pdu-card__title">${layer.name}</div>
          <div class="pdu-card__subtitle">${layer.nameEn} → ${layer.pdu}</div>
        </div>
        <div class="pdu-card__size">${layer.totalSize} Б</div>
        <div class="pdu-card__toggle">›</div>
      </div>
      <div class="pdu-card__body">
        <div class="pdu-diagram">
          ${layer.diagramSegs.map(s => `<div class="pdu-diagram__seg" style="flex:${Math.max(s.pct, 3)};background:${s.color}">${s.pct > 8 ? s.label : ''}</div>`).join('')}
        </div>
        ${layer.body || ''}
        ${layer.isBinary ? `
          <div class="pdu-note">Физический уровень передаёт кадр как последовательность битов (${layer.binaryData.length * 8} бит):</div>
          <div class="pdu-binary">${buildBinaryView(layer.binaryData)}</div>
        ` : ''}
        ${layer.hex ? `
          <button class="pdu-hex-toggle" data-hex="${layer.num}">
            <span class="pdu-hex-toggle__arrow">›</span> Hex-дамп (${layer.hex.length} байт)
          </button>
          <div class="pdu-hex" data-hex-body="${layer.num}">${buildHexDump(layer.hex, layer.hlRanges)}</div>
        ` : ''}
      </div>
    </div>`;
  });

  html += `<div class="full-frame">
    <div class="full-frame__title">Полный кадр — Hex-дамп (${frame.length} байт)</div>
    <div class="pdu-hex open">${buildHexDump(frame, hlAll)}</div>
  </div>`;

  result.innerHTML = html;

  result.querySelectorAll('.pdu-card__header').forEach(header => {
    header.addEventListener('click', () => header.parentElement.classList.toggle('open'));
  });
  result.querySelectorAll('.pdu-hex-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('open');
      const body = result.querySelector(`[data-hex-body="${btn.dataset.hex}"]`);
      if (body) body.classList.toggle('open');
    });
  });
}

export function initSimulator() {
  // L7 protocol select
  document.getElementById('simL7Proto')?.addEventListener('change', (e) => {
    simL7Proto = e.target.value;
    // Auto-switch transport for certain protocols
    if (simL7Proto === 'dns' || simL7Proto === 'dhcp') simProto = 'udp';
    if (simL7Proto === 'icmp' || simL7Proto === 'arp') {
      document.getElementById('simProtoToggle').style.opacity = '.4';
    } else {
      document.getElementById('simProtoToggle').style.opacity = '1';
    }
  });

  // L4 toggle
  document.querySelectorAll('#simProtoToggle .lab-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#simProtoToggle .lab-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simProto = btn.dataset.proto;
    });
  });

  // VLAN toggle
  document.getElementById('simVlanToggle')?.addEventListener('change', (e) => { simVlan = e.target.checked; });

  // IPv6 toggle
  document.getElementById('simIpv6Toggle')?.addEventListener('change', (e) => { simIpv6 = e.target.checked; });

  // Encap/deencap mode
  document.querySelectorAll('#simModeToggle .lab-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#simModeToggle .lab-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simMode = btn.dataset.mode;
    });
  });

  // Build button
  document.getElementById('simBuild').addEventListener('click', () => {
    buildFullPacket();
    unlockAchievement('first_encap');
    addXP(5);
  });

  initFileUpload();
}
