import { toHex, ipToBytes, generateMAC, formatMAC, checksumPlaceholder } from '../core/utils.js';
import { addXP, unlockAchievement } from '../core/gamification.js';
import { simState } from '../core/lab-data.js';
import { OSI_LAYERS } from '../data/osi-layers.js';
import { CHANNEL_TYPES } from '../data/channels.js';
import { initFileUpload } from './simulator-file.js';

let simProto = 'tcp';

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
    for (const bit of bits) {
      html += `<span class="bit-${bit}">${bit}</span>`;
    }
    if ((i + 1) % 4 === 0) html += '\n'; else html += ' ';
  }
  return html;
}

function buildFullPacket() {
  const message = document.getElementById('simMessage').value || 'Hello';
  const srcIp = document.getElementById('simSrcIp').value.trim();
  const dstIp = document.getElementById('simDstIp').value.trim();
  const srcPort = parseInt(document.getElementById('simSrcPort').value) || 49152;
  const dstPort = parseInt(document.getElementById('simDstPort').value) || 80;
  const isTCP = simProto === 'tcp';

  const srcIpB = ipToBytes(srcIp);
  const dstIpB = ipToBytes(dstIp);
  if (srcIpB.length !== 4 || dstIpB.length !== 4 || srcIpB.some(x => isNaN(x) || x > 255) || dstIpB.some(x => isNaN(x) || x > 255)) {
    document.getElementById('simResult').innerHTML = '<div class="card" style="color:#e74c3c;margin-top:16px">Некорректный IP-адрес</div>';
    return;
  }

  const useFile = simState.uploadedFile && simState.uploadedBytes && simState.uploadedBytes.length > 0;
  const fileBytes = useFile ? simState.uploadedBytes.slice(0, 512) : null;
  const contentType = useFile ? simState.uploadedFile.type : 'text/plain';
  const contentLen = useFile ? simState.uploadedFile.size : message.length;
  const bodyForHttp = useFile ? `[binary data: ${simState.uploadedFile.name}]` : message;

  const httpReq = `POST /upload HTTP/1.1\r\nHost: ${dstIp}\r\nContent-Type: ${contentType}\r\nContent-Length: ${contentLen}\r\n\r\n${bodyForHttp}`;
  const appBytes = useFile
    ? [...Array.from(new TextEncoder().encode(`POST /upload HTTP/1.1\r\nHost: ${dstIp}\r\nContent-Type: ${contentType}\r\nContent-Length: ${contentLen}\r\n\r\n`)), ...fileBytes]
    : Array.from(new TextEncoder().encode(httpReq));
  const msgRawBytes = useFile ? fileBytes : Array.from(new TextEncoder().encode(message));

  // L4: TCP (20 bytes) or UDP (8 bytes)
  let l4Header, l4Fields, l4Name, pduName;
  const seqNum = 1000 + Math.floor(Math.random() * 9000);

  if (isTCP) {
    l4Name = 'TCP';
    pduName = 'Сегмент';
    l4Header = [
      (srcPort >> 8) & 0xFF, srcPort & 0xFF,
      (dstPort >> 8) & 0xFF, dstPort & 0xFF,
      (seqNum >> 24) & 0xFF, (seqNum >> 16) & 0xFF, (seqNum >> 8) & 0xFF, seqNum & 0xFF,
      0x00, 0x00, 0x00, 0x00,
      0x50, 0x18,
      0xFF, 0xFF,
      0x00, 0x00,
      0x00, 0x00
    ];
    const tcpCs = checksumPlaceholder([...l4Header, ...appBytes]);
    l4Header[16] = tcpCs[0]; l4Header[17] = tcpCs[1];

    l4Fields = [
      ['Порт источника', `${srcPort}  (0x${toHex(srcPort, 4)})`],
      ['Порт назначения', `${dstPort}  (0x${toHex(dstPort, 4)})`],
      ['Sequence Number', `${seqNum}  (0x${toHex(seqNum, 8)})`],
      ['Acknowledgment', `0  (0x00000000)`],
      ['Data Offset', '5 (20 байт)'],
      ['Флаги', 'PSH, ACK (0x018)'],
      ['Window Size', '65535 (0xFFFF)'],
      ['Checksum', `0x${toHex(l4Header[16])}${toHex(l4Header[17])}`],
      ['Urgent Pointer', '0']
    ];
  } else {
    l4Name = 'UDP';
    pduName = 'Датаграмма';
    const udpLen = 8 + appBytes.length;
    l4Header = [
      (srcPort >> 8) & 0xFF, srcPort & 0xFF,
      (dstPort >> 8) & 0xFF, dstPort & 0xFF,
      (udpLen >> 8) & 0xFF, udpLen & 0xFF,
      0x00, 0x00
    ];
    const udpCs = checksumPlaceholder([...l4Header, ...appBytes]);
    l4Header[6] = udpCs[0]; l4Header[7] = udpCs[1];

    l4Fields = [
      ['Порт источника', `${srcPort}  (0x${toHex(srcPort, 4)})`],
      ['Порт назначения', `${dstPort}  (0x${toHex(dstPort, 4)})`],
      ['Длина', `${udpLen} байт`],
      ['Checksum', `0x${toHex(l4Header[6])}${toHex(l4Header[7])}`]
    ];
  }

  // L3: IP header (20 bytes)
  const ipTotalLen = 20 + l4Header.length + appBytes.length;
  const ipId = Math.floor(Math.random() * 65535);
  const ipHeader = [
    0x45,
    0x00,
    (ipTotalLen >> 8) & 0xFF, ipTotalLen & 0xFF,
    (ipId >> 8) & 0xFF, ipId & 0xFF,
    0x40, 0x00,
    0x40,
    isTCP ? 0x06 : 0x11,
    0x00, 0x00,
    ...srcIpB,
    ...dstIpB
  ];
  const ipCs = checksumPlaceholder(ipHeader);
  ipHeader[10] = ipCs[0]; ipHeader[11] = ipCs[1];

  const ipFields = [
    ['Версия', '4 (IPv4)'],
    ['IHL', '5 (20 байт)'],
    ['DSCP / ECN', '0x00'],
    ['Total Length', `${ipTotalLen} байт`],
    ['Identification', `0x${toHex(ipId, 4)}`],
    ['Flags', 'DF (Don\'t Fragment)'],
    ['Fragment Offset', '0'],
    ['TTL', '64'],
    ['Protocol', `${isTCP ? '6 (TCP)' : '17 (UDP)'}`],
    ['Header Checksum', `0x${toHex(ipHeader[10])}${toHex(ipHeader[11])}`],
    ['IP источника', srcIp],
    ['IP назначения', dstIp]
  ];

  // L2: Ethernet (14 header + 4 CRC)
  const srcMAC = generateMAC();
  const dstMAC = generateMAC();
  const ethHeader = [...dstMAC, ...srcMAC, 0x08, 0x00];
  const ethPayload = [...ipHeader, ...l4Header, ...appBytes];
  const crc = checksumPlaceholder(ethPayload);
  const ethTrailer = [crc[0], crc[1], crc[0] ^ 0xFF, crc[1] ^ 0xFF];

  const ethFields = [
    ['MAC назначения', formatMAC(dstMAC)],
    ['MAC источника', formatMAC(srcMAC)],
    ['EtherType', '0x0800 (IPv4)'],
    ['FCS (CRC-32)', `0x${ethTrailer.map(b => toHex(b)).join('')}`]
  ];

  // Complete frame
  const frame = [...ethHeader, ...ethPayload, ...ethTrailer];

  // Preamble + SFD for L1
  const preamble = [0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAB];
  const physFrame = [...preamble, ...frame];

  // Now build the visualization
  const getL = (n) => OSI_LAYERS.find(l => l.number === n);

  // Size bar segments
  const segments = [
    { label: 'ETH', size: 14, color: getL(2).color },
    { label: 'IP', size: 20, color: getL(3).color },
    { label: l4Name, size: l4Header.length, color: getL(4).color },
    { label: 'HTTP', size: appBytes.length, color: getL(7).color },
    { label: 'CRC', size: 4, color: getL(2).color }
  ];
  const totalSize = frame.length;

  // Byte offset ranges for hex highlighting
  const ethEnd = 14;
  const ipEnd = ethEnd + 20;
  const l4End = ipEnd + l4Header.length;
  const dataEnd = l4End + appBytes.length;

  const hlAll = [
    { start: 0, end: ethEnd, color: getL(2).color },
    { start: ethEnd, end: ipEnd, color: getL(3).color },
    { start: ipEnd, end: l4End, color: getL(4).color },
    { start: l4End, end: dataEnd, color: getL(7).color },
    { start: dataEnd, end: frame.length, color: getL(2).color }
  ];

  const layers = [
    {
      num: 7, name: getL(7).name, nameEn: 'Application', color: getL(7).color,
      pdu: 'Данные', totalSize: appBytes.length,
      diagramSegs: [{ label: `Данные HTTP (${appBytes.length} Б)`, pct: 100, color: getL(7).color }],
      body: `
        <div class="pdu-note">${useFile ? 'Приложение формирует HTTP-запрос для передачи файла' : 'Приложение формирует HTTP-запрос с вашим сообщением'}</div>
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
      hex: appBytes
    },
    {
      num: 6, name: getL(6).name, nameEn: 'Presentation', color: getL(6).color,
      pdu: 'Данные', totalSize: appBytes.length,
      diagramSegs: [{ label: `UTF-8 данные (${appBytes.length} Б)`, pct: 100, color: getL(6).color }],
      body: `
        <div class="pdu-note">${useFile ? `Файл ${simState.uploadedFile.name} — бинарные данные (${contentType}). Первые ${Math.min(msgRawBytes.length, 16)} байт:` : 'Данные кодируются в UTF-8. Каждый символ сообщения в байтах:'}</div>
        <table class="pdu-fields">
          ${msgRawBytes.slice(0, 16).map((b, i) => `<tr><td>${useFile ? 'Байт ' + i : "'" + (message[i] || '?') + "'"}</td><td>0x${toHex(b)} (${b}) → ${b.toString(2).padStart(8, '0')}</td></tr>`).join('')}
          ${msgRawBytes.length > 16 ? `<tr><td colspan="2" style="color:var(--text-secondary);text-align:center">… ещё ${msgRawBytes.length - 16} байт</td></tr>` : ''}
        </table>`,
      hex: appBytes
    },
    {
      num: 5, name: getL(5).name, nameEn: 'Session', color: getL(5).color,
      pdu: 'Данные', totalSize: appBytes.length,
      diagramSegs: [{ label: `Данные сеанса (${appBytes.length} Б)`, pct: 100, color: getL(5).color }],
      body: `
        <div class="pdu-note">Сеансовый уровень управляет соединением. В TCP/IP его функции реализуются на прикладном и транспортном уровне.</div>
        <table class="pdu-fields">
          <tr><td>Состояние</td><td>ESTABLISHED</td></tr>
          <tr><td>Тип сеанса</td><td>${isTCP ? 'Надёжный (TCP)' : 'Без соединения (UDP)'}</td></tr>
          <tr><td>Направление</td><td>Полудуплекс (запрос → ответ)</td></tr>
        </table>`,
      hex: null
    },
    {
      num: 4, name: getL(4).name, nameEn: 'Transport', color: getL(4).color,
      pdu: pduName, totalSize: l4Header.length + appBytes.length,
      diagramSegs: [
        { label: `${l4Name} (${l4Header.length} Б)`, pct: (l4Header.length / (l4Header.length + appBytes.length)) * 100, color: getL(4).color },
        { label: `Данные (${appBytes.length} Б)`, pct: (appBytes.length / (l4Header.length + appBytes.length)) * 100, color: getL(7).color + '99' }
      ],
      body: `
        <table class="pdu-fields">${l4Fields.map(f => `<tr><td>${f[0]}</td><td>${f[1]}</td></tr>`).join('')}</table>`,
      hex: [...l4Header, ...appBytes],
      hlRanges: [{ start: 0, end: l4Header.length, color: getL(4).color }]
    },
    {
      num: 3, name: getL(3).name, nameEn: 'Network', color: getL(3).color,
      pdu: 'Пакет', totalSize: 20 + l4Header.length + appBytes.length,
      diagramSegs: [
        { label: `IP (20 Б)`, pct: (20 / ipTotalLen) * 100, color: getL(3).color },
        { label: `${l4Name} (${l4Header.length} Б)`, pct: (l4Header.length / ipTotalLen) * 100, color: getL(4).color },
        { label: `Данные (${appBytes.length} Б)`, pct: (appBytes.length / ipTotalLen) * 100, color: getL(7).color + '99' }
      ],
      body: `
        <table class="pdu-fields">${ipFields.map(f => `<tr><td>${f[0]}</td><td>${f[1]}</td></tr>`).join('')}</table>`,
      hex: [...ipHeader, ...l4Header, ...appBytes],
      hlRanges: [{ start: 0, end: 20, color: getL(3).color }]
    },
    {
      num: 2, name: getL(2).name, nameEn: 'Data Link', color: getL(2).color,
      pdu: 'Кадр', totalSize: frame.length,
      diagramSegs: segments.map(s => ({
        label: `${s.label} (${s.size} Б)`, pct: (s.size / totalSize) * 100, color: s.color
      })),
      body: `
        <table class="pdu-fields">${ethFields.map(f => `<tr><td>${f[0]}</td><td>${f[1]}</td></tr>`).join('')}</table>`,
      hex: frame,
      hlRanges: hlAll
    },
    {
      num: 1, name: getL(1).name, nameEn: 'Physical', color: getL(1).color,
      pdu: 'Биты', totalSize: physFrame.length,
      diagramSegs: [
        { label: 'Преамбула (8 Б)', pct: (8 / physFrame.length) * 100, color: getL(1).color },
        ...segments.map(s => ({
          label: `${s.label} (${s.size} Б)`, pct: (s.size / physFrame.length) * 100, color: s.color
        }))
      ],
      body: null,
      isBinary: true,
      binaryData: physFrame
    }
  ];

  // Render
  const result = document.getElementById('simResult');
  let html = '';

  // Overview size bar
  html += `<div class="pdu-overview">
    <div class="pdu-overview__title">Структура кадра (${totalSize} байт)</div>
    <div class="pdu-size-bar">
      ${segments.map(s => `<div class="pdu-size-bar__seg" style="flex:${s.size};background:${s.color}">${s.size > 10 ? s.label : ''}</div>`).join('')}
    </div>
    <div class="pdu-size-bar__legend">
      ${segments.map(s => `<div class="pdu-size-bar__legend-item"><div class="pdu-size-bar__legend-dot" style="background:${s.color}"></div>${s.label} ${s.size}Б</div>`).join('')}
    </div>
  </div>`;

  // Layer cards
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

  // Full frame hex dump
  html += `<div class="full-frame">
    <div class="full-frame__title">Полный кадр — Hex-дамп (${frame.length} байт)</div>
    <div class="pdu-hex open">${buildHexDump(frame, hlAll)}</div>
  </div>`;

  result.innerHTML = html;

  // Card collapse/expand
  result.querySelectorAll('.pdu-card__header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('open');
    });
  });

  // Hex toggle
  result.querySelectorAll('.pdu-hex-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('open');
      const body = result.querySelector(`[data-hex-body="${btn.dataset.hex}"]`);
      if (body) body.classList.toggle('open');
    });
  });
}

export function initSimulator() {
  // Protocol toggle
  document.querySelectorAll('#simProtoToggle .lab-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#simProtoToggle .lab-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simProto = btn.dataset.proto;
    });
  });

  // Build packet button
  document.getElementById('simBuild').addEventListener('click', () => {
    buildFullPacket();
    unlockAchievement('first_encap');
    addXP(5);
  });

  // File upload handlers
  initFileUpload();
}
