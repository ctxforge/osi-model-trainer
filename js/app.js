(function () {
  'use strict';

  /* ==================== GAMIFICATION ==================== */
  let gameState = JSON.parse(localStorage.getItem('osi-game') || '{}');
  if (!gameState.xp) gameState.xp = 0;
  if (!gameState.achievements) gameState.achievements = [];
  if (!gameState.studiedLayers) gameState.studiedLayers = [];
  if (!gameState.usedChannels) gameState.usedChannels = [];

  function saveGame() { localStorage.setItem('osi-game', JSON.stringify(gameState)); }

  function getCurrentLevel() {
    let lvl = XP_LEVELS[0];
    for (const l of XP_LEVELS) { if (gameState.xp >= l.minXp) lvl = l; }
    return lvl;
  }

  function getNextLevel() {
    const cur = getCurrentLevel();
    return XP_LEVELS.find(l => l.minXp > cur.minXp) || cur;
  }

  function addXP(amount) {
    const oldLevel = getCurrentLevel().level;
    gameState.xp += amount;
    saveGame();
    const newLevel = getCurrentLevel().level;
    updateXPDisplay();
    if (newLevel > oldLevel) {
      const lvl = getCurrentLevel();
      showToast(lvl.icon, `Уровень ${lvl.level}: ${lvl.name}!`, '');
    }
    if (gameState.xp >= 100) unlockAchievement('xp_100');
    if (gameState.xp >= 300) unlockAchievement('xp_300');
  }

  function unlockAchievement(id) {
    if (gameState.achievements.includes(id)) return;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return;
    gameState.achievements.push(id);
    saveGame();
    showToast(ach.icon, ach.name, ach.xp > 0 ? `+${ach.xp} XP` : '');
    if (ach.xp > 0) addXP(ach.xp);
    updateXPDisplay();
  }

  function showToast(icon, text, xpText) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast__icon">${icon}</span><span>${text}</span>${xpText ? `<span class="toast__xp">${xpText}</span>` : ''}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  function updateXPDisplay() {
    const lvl = getCurrentLevel();
    const next = getNextLevel();
    document.getElementById('xpIcon').textContent = lvl.icon;
    document.getElementById('xpValue').textContent = gameState.xp + ' XP';

    const panel = document.getElementById('xpPanel');
    const pct = next.minXp > lvl.minXp ? ((gameState.xp - lvl.minXp) / (next.minXp - lvl.minXp)) * 100 : 100;
    panel.innerHTML = `
      <div class="xp-panel__header">
        <div class="xp-panel__avatar">${lvl.icon}</div>
        <div>
          <div class="xp-panel__level-name">Уровень ${lvl.level}: ${lvl.name}</div>
          <div class="xp-panel__level-sub">${gameState.xp} XP</div>
        </div>
      </div>
      <div class="xp-bar"><div class="xp-bar__fill" style="width:${pct}%"></div></div>
      <div class="xp-bar__label">${next.minXp > lvl.minXp ? `${gameState.xp}/${next.minXp} XP до «${next.name}»` : 'Максимальный уровень!'}</div>
      <div class="xp-achievements">
        <div class="xp-achievements__title">Достижения (${gameState.achievements.length}/${ACHIEVEMENTS.length})</div>
        ${ACHIEVEMENTS.map(a => {
          const unlocked = gameState.achievements.includes(a.id);
          return `<div class="xp-ach ${unlocked ? '' : 'xp-ach--locked'}">
            <div class="xp-ach__icon">${a.icon}</div>
            <div class="xp-ach__info"><div class="xp-ach__name">${a.name}</div><div class="xp-ach__desc">${a.desc}</div></div>
            ${a.xp > 0 ? `<div class="xp-ach__xp">${unlocked ? '✓' : '+' + a.xp}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
    `;
  }

  updateXPDisplay();

  document.getElementById('xpBadge').addEventListener('click', () => {
    const panel = document.getElementById('xpPanel');
    panel.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    const panel = document.getElementById('xpPanel');
    if (panel.classList.contains('open') && !panel.contains(e.target) && !document.getElementById('xpBadge').contains(e.target)) {
      panel.classList.remove('open');
    }
  });

  /* ==================== THEME ==================== */
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('osi-theme', theme);
  }

  setTheme(localStorage.getItem('osi-theme') || 'dark');
  themeToggle.addEventListener('click', () => {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ==================== NAVIGATION ==================== */
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.section');
  const navCards = document.querySelectorAll('.nav-card');

  function navigateTo(sectionId) {
    sections.forEach(s => s.classList.remove('active'));
    navBtns.forEach(b => b.classList.remove('active'));
    const target = document.getElementById('section-' + sectionId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    navBtns.forEach(b => {
      if (b.dataset.section === sectionId) b.classList.add('active');
    });
  }

  navBtns.forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.section)));
  navCards.forEach(card => card.addEventListener('click', () => navigateTo(card.dataset.nav)));

  /* ==================== OSI TOWER BUILDER ==================== */
  function buildTower(container, onClick) {
    container.innerHTML = '';
    OSI_LAYERS.forEach(layer => {
      const el = document.createElement('div');
      el.className = 'osi-layer';
      el.dataset.layer = layer.number;
      el.style.setProperty('--lc', layer.color);
      el.innerHTML = `
        <div class="osi-layer__number" style="background:${layer.color}">${layer.number}</div>
        <div class="osi-layer__info">
          <div class="osi-layer__name">${layer.name}</div>
          <div class="osi-layer__name-en">${layer.nameEn}</div>
        </div>
        <span class="osi-layer__arrow">›</span>
      `;
      el.style.cssText += `border-color: transparent;`;
      el.querySelector('.osi-layer__number').style.background = layer.color;
      el.addEventListener('click', () => onClick(layer.number));
      container.appendChild(el);

      const style = el.style;
      style.setProperty('background', `${layer.color}10`);
    });
  }

  /* ==================== HOME ==================== */
  buildTower(document.getElementById('homeTower'), (num) => {
    navigateTo('study');
    selectStudyLayer(num);
  });

  /* ==================== STUDY ==================== */
  let currentStudyLayer = 7;

  buildTower(document.getElementById('studyTower'), selectStudyLayer);

  function selectStudyLayer(num) {
    currentStudyLayer = num;
    const layer = OSI_LAYERS.find(l => l.number === num);

    document.querySelectorAll('#studyTower .osi-layer').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.layer) === num);
      if (parseInt(el.dataset.layer) === num) {
        el.style.borderColor = layer.color;
      } else {
        el.style.borderColor = 'transparent';
      }
    });

    const panel = document.getElementById('studyPanel');
    panel.innerHTML = `
      <div class="study-panel">
        <div class="study-panel__header" style="background:${layer.color}">
          <div class="study-panel__layer-num">L${layer.number}</div>
          <div class="study-panel__layer-name">${layer.name}</div>
          <div class="study-panel__layer-name-en">${layer.nameEn}</div>
        </div>
        <div class="study-panel__body">
          <div class="study-section">
            <div class="study-section__title">Описание</div>
            <div class="study-section__text">${layer.description}</div>
          </div>
          <div class="study-section">
            <div class="study-section__title">Основные функции</div>
            <ul class="func-list">
              ${layer.functions.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>
          <div class="study-section">
            <div class="study-section__title">Протоколы</div>
            <div class="tag-list">
              ${layer.protocols.map(p => `<span class="tag" style="color:${layer.color};border-color:${layer.color}40">${p}</span>`).join('')}
            </div>
          </div>
          <div class="study-section">
            <div class="study-section__title">Устройства</div>
            <div class="tag-list">
              ${layer.devices.map(d => `<span class="tag" style="color:${layer.color};border-color:${layer.color}40">⚙ ${d}</span>`).join('')}
            </div>
          </div>
          <div class="study-section">
            <div class="study-section__title">PDU (единица данных)</div>
            <div class="study-section__text">${layer.pdu}</div>
          </div>
          <div class="study-section">
            <div class="study-section__title">Инкапсуляция</div>
            <div class="study-section__text">${layer.encapsulation}</div>
          </div>
          <div class="study-section">
            <div class="study-section__title">Аналогия</div>
            <div class="analogy-box" style="border-color:${layer.color}">${layer.analogy}</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('studyPrev').disabled = num === 7;
    document.getElementById('studyNext').disabled = num === 1;
    trackStudyLayer(num);
  }

  selectStudyLayer(7);

  function trackStudyLayer(num) {
    if (!gameState.studiedLayers.includes(num)) {
      gameState.studiedLayers.push(num);
      saveGame();
      addXP(3);
    }
    if (gameState.studiedLayers.length === 7) unlockAchievement('study_all');
  }

  document.getElementById('studyPrev').addEventListener('click', () => {
    if (currentStudyLayer < 7) selectStudyLayer(currentStudyLayer + 1);
  });
  document.getElementById('studyNext').addEventListener('click', () => {
    if (currentStudyLayer > 1) selectStudyLayer(currentStudyLayer - 1);
  });

  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('section-study').classList.contains('active')) return;
    if (e.key === 'ArrowUp' && currentStudyLayer < 7) selectStudyLayer(currentStudyLayer + 1);
    if (e.key === 'ArrowDown' && currentStudyLayer > 1) selectStudyLayer(currentStudyLayer - 1);
  });

  // Comparison table
  (function buildComparisonTable() {
    const table = document.getElementById('comparisonTable');
    let html = `<thead><tr><th>OSI</th><th>Уровень</th><th>TCP/IP</th></tr></thead><tbody>`;
    const used = {};
    OSI_LAYERS.forEach(layer => {
      const tcpip = TCPIP_MAPPING.find(m => m.osiLayers.includes(layer.number));
      const rowspan = tcpip && !used[tcpip.name] ? tcpip.osiLayers.length : 0;
      if (tcpip) used[tcpip.name] = true;
      html += `<tr>
        <td style="color:${layer.color};font-weight:700">L${layer.number}</td>
        <td>${layer.name}</td>
        ${rowspan ? `<td rowspan="${rowspan}" style="color:${tcpip.color};font-weight:700">${tcpip.name}</td>` : ''}
      </tr>`;
    });
    html += '</tbody>';
    table.innerHTML = html;
  })();

  /* ==================== SIMULATOR ==================== */
  let simProto = 'tcp';

  document.querySelectorAll('#simProtoToggle .lab-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#simProtoToggle .lab-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simProto = btn.dataset.proto;
    });
  });

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function toHex(b, pad) { return b.toString(16).toUpperCase().padStart(pad || 2, '0'); }
  function ipToBytes(ip) { return ip.split('.').map(Number); }

  function generateMAC() {
    const m = [];
    for (let i = 0; i < 6; i++) m.push(Math.floor(Math.random() * 256));
    m[0] = m[0] & 0xFE; // unicast
    return m;
  }

  function formatMAC(bytes) { return bytes.map(b => toHex(b)).join(':'); }

  function checksumPlaceholder(bytes) {
    let sum = 0;
    for (let i = 0; i < bytes.length; i += 2) {
      sum += (bytes[i] << 8) | (bytes[i + 1] || 0);
    }
    while (sum >> 16) sum = (sum & 0xFFFF) + (sum >> 16);
    const cs = (~sum) & 0xFFFF;
    return [(cs >> 8) & 0xFF, cs & 0xFF];
  }

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

    const httpReq = `GET / HTTP/1.1\r\nHost: ${dstIp}\r\nContent-Length: ${message.length}\r\n\r\n${message}`;
    const appBytes = Array.from(new TextEncoder().encode(httpReq));
    const msgRawBytes = Array.from(new TextEncoder().encode(message));

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
          <div class="pdu-note">Приложение формирует HTTP-запрос с вашим сообщением</div>
          <div class="pdu-appdata">${httpReq.replace(/\r\n/g, '\n').replace(/</g, '&lt;')}</div>
          <table class="pdu-fields mt-12">
            <tr><td>Метод</td><td>GET /</td></tr>
            <tr><td>Host</td><td>${dstIp}</td></tr>
            <tr><td>Content-Length</td><td>${message.length}</td></tr>
            <tr><td>Тело</td><td>${message}</td></tr>
          </table>`,
        hex: appBytes
      },
      {
        num: 6, name: getL(6).name, nameEn: 'Presentation', color: getL(6).color,
        pdu: 'Данные', totalSize: appBytes.length,
        diagramSegs: [{ label: `UTF-8 данные (${appBytes.length} Б)`, pct: 100, color: getL(6).color }],
        body: `
          <div class="pdu-note">Данные кодируются в UTF-8. Каждый символ сообщения в байтах:</div>
          <table class="pdu-fields">
            ${msgRawBytes.map((b, i) => `<tr><td>'${message[i] || '?'}'</td><td>0x${toHex(b)} (${b}) → ${b.toString(2).padStart(8, '0')}</td></tr>`).join('')}
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

  document.getElementById('simBuild').addEventListener('click', () => {
    buildFullPacket();
    unlockAchievement('first_encap');
    addXP(5);
  });

  /* ==================== LAB ==================== */
  const labState = {};

  function buildLabTabs() {
    const container = document.getElementById('labTabs');
    const keys = Object.keys(LAB_EXPERIMENTS);
    keys.forEach((key, i) => {
      const exp = LAB_EXPERIMENTS[key];
      const tab = document.createElement('button');
      tab.className = 'lab-tab' + (i === 0 ? ' active' : '');
      tab.dataset.lab = key;
      tab.textContent = exp.icon + ' ' + exp.title;
      tab.addEventListener('click', () => switchLabTab(key));
      container.appendChild(tab);
    });
  }

  function switchLabTab(key) {
    document.querySelectorAll('.lab-tab').forEach(t => t.classList.toggle('active', t.dataset.lab === key));
    document.querySelectorAll('.lab-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById('lab-' + key);
    if (target) target.classList.add('active');
  }

  function buildLabParams() {
    Object.entries(LAB_EXPERIMENTS).forEach(([key, exp]) => {
      const container = document.getElementById('labParams-' + key);
      if (!container) return;
      labState[key] = {};

      exp.params.forEach(param => {
        labState[key][param.id] = param.default;
        const wrapper = document.createElement('div');
        wrapper.className = 'lab-param';

        if (param.type === 'range') {
          wrapper.innerHTML = `
            <div class="lab-param__label">
              <span>${param.label}</span>
              <span class="lab-param__value" id="labVal-${key}-${param.id}">${param.default}${param.unit ? ' ' + param.unit : ''}</span>
            </div>
            <input type="range" min="${param.min}" max="${param.max}" step="${param.step}" value="${param.default}"
              id="labRange-${key}-${param.id}">
          `;
          container.appendChild(wrapper);
          const range = wrapper.querySelector('input[type="range"]');
          const valEl = wrapper.querySelector('.lab-param__value');
          range.addEventListener('input', () => {
            labState[key][param.id] = parseFloat(range.value);
            valEl.textContent = range.value + (param.unit ? ' ' + param.unit : '');
          });
        } else if (param.type === 'toggle') {
          wrapper.innerHTML = `
            <div class="lab-param__label"><span>${param.label}</span></div>
            <div class="lab-toggle" id="labToggle-${key}-${param.id}">
              ${param.options.map((opt, i) => `<button class="lab-toggle__btn${i === param.default ? ' active' : ''}" data-idx="${i}">${opt}</button>`).join('')}
            </div>
          `;
          container.appendChild(wrapper);
          wrapper.querySelectorAll('.lab-toggle__btn').forEach(btn => {
            btn.addEventListener('click', () => {
              wrapper.querySelectorAll('.lab-toggle__btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              labState[key][param.id] = parseInt(btn.dataset.idx);
            });
          });
        } else if (param.type === 'ip') {
          wrapper.innerHTML = `
            <div class="lab-param__label"><span>${param.label}</span></div>
            <input type="text" class="lab-ip-input" id="labIp-${key}-${param.id}" value="${param.default}"
              inputmode="decimal" pattern="[0-9.]*">
          `;
          container.appendChild(wrapper);
          wrapper.querySelector('input').addEventListener('input', (e) => {
            labState[key][param.id] = e.target.value;
          });
        }
      });
    });
  }

  buildLabTabs();
  buildLabParams();

  // Lab: Packet Transmission
  document.getElementById('labRun-packetTransmission').addEventListener('click', () => {
    const s = labState.packetTransmission;
    const isTCP = s.protocol === 0;
    const totalPackets = 10;
    const packets = [];
    let delivered = 0;
    let lost = 0;
    let retransmitted = 0;

    for (let i = 0; i < totalPackets; i++) {
      const isLost = Math.random() * 100 < s.packetLoss;
      if (isLost) {
        lost++;
        packets.push({ id: i + 1, status: 'lost', label: `Пакет #${i + 1} — потерян` });
        if (isTCP) {
          retransmitted++;
          packets.push({ id: i + 1, status: 'retransmit', label: `Пакет #${i + 1} — повторная передача (TCP)` });
          delivered++;
        }
      } else {
        delivered++;
        packets.push({ id: i + 1, status: 'ok', label: `Пакет #${i + 1} — доставлен` });
      }
    }

    const totalTime = (totalPackets * (s.latency / 2) + retransmitted * s.latency).toFixed(0);
    const throughput = (delivered * 1000 / (s.bandwidth * 1024)).toFixed(2);

    const result = document.getElementById('labResult-packetTransmission');
    result.innerHTML = `
      <div class="lab-result__title">Результат передачи (${isTCP ? 'TCP' : 'UDP'})</div>
      <div class="lab-stats">
        <div class="lab-stat">
          <div class="lab-stat__value">${delivered}</div>
          <div class="lab-stat__label">Доставлено</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${lost}</div>
          <div class="lab-stat__label">Потеряно</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${retransmitted}</div>
          <div class="lab-stat__label">Повторов</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${totalTime} мс</div>
          <div class="lab-stat__label">Общее время</div>
        </div>
      </div>
      <div class="lab-packets">
        ${packets.map(p => `
          <div class="lab-packet" style="animation: slideIn .3s ease ${packets.indexOf(p) * 0.05}s both">
            <div class="lab-packet__status lab-packet__status--${p.status}"></div>
            <div class="lab-packet__label">${p.label}</div>
          </div>
        `).join('')}
      </div>
      <div class="card mt-16" style="font-size:.82rem;line-height:1.6">
        <strong>${isTCP ? 'TCP' : 'UDP'}:</strong>
        ${isTCP
          ? `Все ${totalPackets} пакетов гарантированно доставлены благодаря механизму повторной передачи. Потеряно ${lost}, повторно отправлено ${retransmitted}. Задержка увеличивается при потерях.`
          : `Из ${totalPackets} пакетов доставлено ${delivered}. Потеряно ${lost} без повторной передачи. UDP не гарантирует доставку, но работает быстрее.`
        }
      </div>
    `;
  });

  // Lab: Fragmentation
  document.getElementById('labRun-fragmentation').addEventListener('click', () => {
    const s = labState.fragmentation;
    const payload = s.mtu - s.headerSize;
    const fragments = Math.ceil(s.messageSize / payload);
    const lastSize = s.messageSize % payload || payload;

    const pieces = [];
    for (let i = 0; i < fragments; i++) {
      const size = (i === fragments - 1) ? lastSize : payload;
      pieces.push({
        id: i + 1,
        offset: i * payload,
        size: size,
        totalSize: size + s.headerSize,
        moreFragments: i < fragments - 1
      });
    }

    const result = document.getElementById('labResult-fragmentation');
    const widthScale = 100 / s.messageSize;

    result.innerHTML = `
      <div class="lab-result__title">Результат фрагментации</div>
      <div class="lab-stats">
        <div class="lab-stat">
          <div class="lab-stat__value">${fragments}</div>
          <div class="lab-stat__label">Фрагментов</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${s.messageSize} Б</div>
          <div class="lab-stat__label">Размер данных</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${payload} Б</div>
          <div class="lab-stat__label">Полезная нагрузка</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${fragments * s.headerSize} Б</div>
          <div class="lab-stat__label">Накладные расходы</div>
        </div>
      </div>
      <div class="lab-frag-visual mt-16">
        <div class="lab-frag-original">Исходное сообщение: ${s.messageSize} байт</div>
        <div class="lab-frag-arrow">↓ MTU = ${s.mtu} байт ↓</div>
        <div class="lab-frag-pieces">
          ${pieces.map((p, i) => {
            const w = Math.max(p.size * widthScale, 8);
            return `<div class="lab-frag-piece" style="width:${w}%;min-width:60px;background:${OSI_LAYERS.find(l => l.number === 3).color};animation:slideIn .3s ease ${i * 0.08}s both">
              #${p.id} (${p.totalSize}Б)
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="lab-packets mt-16">
        ${pieces.map((p, i) => `
          <div class="lab-packet" style="animation:slideIn .3s ease ${i * 0.06}s both">
            <div class="lab-packet__status lab-packet__status--ok"></div>
            <div class="lab-packet__label">Фрагмент #${p.id}: offset=${p.offset}, size=${p.size}, MF=${p.moreFragments ? 1 : 0}</div>
            <div class="lab-packet__size">${p.totalSize} Б</div>
          </div>
        `).join('')}
      </div>
      <div class="card mt-16" style="font-size:.82rem;line-height:1.6">
        <strong>Эффективность:</strong> ${((s.messageSize / (s.messageSize + fragments * s.headerSize)) * 100).toFixed(1)}% полезной нагрузки.
        ${fragments > 1 ? `При MTU=${s.mtu} сообщение в ${s.messageSize} байт разбивается на ${fragments} фрагментов. Каждый фрагмент получает собственный IP-заголовок (${s.headerSize} байт), что увеличивает накладные расходы.` : 'Фрагментация не требуется — сообщение помещается в один пакет.'}
      </div>
    `;
  });

  // Lab: Routing
  document.getElementById('labRun-routing').addEventListener('click', async () => {
    const s = labState.routing;
    const result = document.getElementById('labResult-routing');
    const hops = s.hops;
    const ttl = s.ttl;
    const reaches = ttl > hops;

    const nodes = [{ type: 'pc', label: 'Источник', icon: '💻' }];
    for (let i = 0; i < hops; i++) {
      nodes.push({ type: 'router', label: `R${i + 1}`, icon: '🔀' });
    }
    nodes.push({ type: 'pc', label: 'Назначение', icon: '🖥️' });

    result.innerHTML = `
      <div class="lab-result__title">Маршрут пакета</div>
      <div class="lab-route-visual" id="routeVisual">
        ${nodes.map((n, i) => {
          const isLast = i === nodes.length - 1;
          return `
            <div class="lab-route-node" id="routeNode-${i}">
              <div class="lab-route-node__icon">${n.icon}</div>
              <div class="lab-route-node__label">${n.label}</div>
              <div class="lab-route-node__ttl" id="routeTTL-${i}"></div>
            </div>
            ${!isLast ? `<div class="lab-route-link" id="routeLink-${i}"></div>` : ''}
          `;
        }).join('')}
      </div>
      <div class="lab-stats" id="routeStats">
        <div class="lab-stat">
          <div class="lab-stat__value">${ttl}</div>
          <div class="lab-stat__label">Начальный TTL</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${hops}</div>
          <div class="lab-stat__label">Хопов</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${reaches ? '✓' : '✗'}</div>
          <div class="lab-stat__label">${reaches ? 'Доставлен' : 'TTL истёк'}</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${reaches ? ttl - hops : 0}</div>
          <div class="lab-stat__label">Оставшийся TTL</div>
        </div>
      </div>
    `;

    let currentTTL = ttl;
    for (let i = 0; i < nodes.length; i++) {
      await sleep(400);
      const node = document.getElementById('routeNode-' + i);
      const ttlEl = document.getElementById('routeTTL-' + i);
      if (!node) break;

      if (currentTTL <= 0 && i > 0) {
        node.classList.add('lab-route-node--dead');
        ttlEl.textContent = 'TTL=0 ✗';
        ttlEl.style.color = '#e74c3c';
        break;
      }

      node.classList.add('lab-route-node--active');
      ttlEl.textContent = `TTL=${currentTTL}`;

      if (i > 0 && i < nodes.length) {
        const link = document.getElementById('routeLink-' + (i - 1));
        if (link) link.classList.add('active');
      }

      if (i > 0 && i < nodes.length - 1) {
        currentTTL--;
      }
    }

    if (!reaches) {
      await sleep(500);
      const explanation = document.createElement('div');
      explanation.className = 'card mt-16';
      explanation.style.cssText = 'font-size:.82rem;line-height:1.6';
      explanation.innerHTML = `<strong>TTL истёк!</strong> Пакет был уничтожен на маршрутизаторе R${ttl} после ${ttl} хопов. 
        Маршрутизатор отправил ICMP-сообщение «Time Exceeded» источнику. Увеличьте TTL до ${hops + 1} или больше для доставки.`;
      result.appendChild(explanation);
    } else {
      await sleep(300);
      const explanation = document.createElement('div');
      explanation.className = 'card mt-16';
      explanation.style.cssText = 'font-size:.82rem;line-height:1.6';
      explanation.innerHTML = `<strong>Доставлен!</strong> Пакет прошёл ${hops} хопов и достиг назначения с TTL=${ttl - hops}. 
        Каждый маршрутизатор уменьшал TTL на 1.`;
      result.appendChild(explanation);
    }
  });

  document.getElementById('labRun-ipCalc').addEventListener('click', () => {
    unlockAchievement('ip_calc');
    addXP(3);
  });

  // Lab: IP Calculator
  document.getElementById('labRun-ipCalc').addEventListener('click', () => {
    const s = labState.ipCalc;
    const ipStr = s.ip;
    const cidr = s.cidr;

    const octets = ipStr.split('.').map(Number);
    if (octets.length !== 4 || octets.some(o => isNaN(o) || o < 0 || o > 255)) {
      document.getElementById('labResult-ipCalc').innerHTML = '<div class="card" style="color:#e74c3c">Неверный IP-адрес. Формат: 0-255.0-255.0-255.0-255</div>';
      return;
    }

    const ipNum = (octets[0] << 24 | octets[1] << 16 | octets[2] << 8 | octets[3]) >>> 0;
    const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const networkNum = (ipNum & maskNum) >>> 0;
    const broadcastNum = (networkNum | ~maskNum) >>> 0;
    const firstHost = (networkNum + 1) >>> 0;
    const lastHost = (broadcastNum - 1) >>> 0;
    const totalHosts = Math.pow(2, 32 - cidr) - 2;

    function numToIp(n) {
      return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
    }

    function numToBin(n) {
      return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
        .map(o => o.toString(2).padStart(8, '0')).join('.');
    }

    const ipBin = numToBin(ipNum);
    const netBits = ipBin.replace(/\./g, '').substring(0, cidr);
    const hostBits = ipBin.replace(/\./g, '').substring(cidr);

    const result = document.getElementById('labResult-ipCalc');
    result.innerHTML = `
      <div class="lab-result__title">Результат расчёта</div>
      <div class="ip-result-grid">
        <div class="ip-result-row">
          <span class="ip-result-row__label">IP-адрес</span>
          <span class="ip-result-row__value">${ipStr}/${cidr}</span>
        </div>
        <div class="ip-result-row">
          <span class="ip-result-row__label">Маска подсети</span>
          <span class="ip-result-row__value">${numToIp(maskNum)}</span>
        </div>
        <div class="ip-result-row">
          <span class="ip-result-row__label">Адрес сети</span>
          <span class="ip-result-row__value">${numToIp(networkNum)}</span>
        </div>
        <div class="ip-result-row">
          <span class="ip-result-row__label">Широковещательный</span>
          <span class="ip-result-row__value">${numToIp(broadcastNum)}</span>
        </div>
        <div class="ip-result-row">
          <span class="ip-result-row__label">Первый хост</span>
          <span class="ip-result-row__value">${numToIp(firstHost)}</span>
        </div>
        <div class="ip-result-row">
          <span class="ip-result-row__label">Последний хост</span>
          <span class="ip-result-row__value">${numToIp(lastHost)}</span>
        </div>
        <div class="ip-result-row">
          <span class="ip-result-row__label">Хостов в подсети</span>
          <span class="ip-result-row__value">${totalHosts > 0 ? totalHosts.toLocaleString() : 0}</span>
        </div>
      </div>
      <div class="ip-binary mt-16">
        <div style="margin-bottom:6px;color:var(--text-secondary);font-size:.7rem">IP в двоичном виде (сеть | хост):</div>
        <span class="ip-binary__net">${netBits}</span><span class="ip-binary__host">${hostBits}</span>
        <div style="margin-top:6px;font-size:.68rem;color:var(--text-secondary)">
          <span class="ip-binary__net">■</span> Сетевая часть (${cidr} бит) &nbsp;
          <span class="ip-binary__host">■</span> Хостовая часть (${32 - cidr} бит)
        </div>
      </div>
    `;
  });

  /* ==================== LAB: TCP HANDSHAKE ==================== */
  document.getElementById('labRun-tcpHandshake').addEventListener('click', async () => {
    const speed = labState.tcpHandshake ? labState.tcpHandshake.speed : 600;
    const result = document.getElementById('labResult-tcpHandshake');

    const clientSeq = 1000 + Math.floor(Math.random() * 9000);
    const serverSeq = 5000 + Math.floor(Math.random() * 9000);

    const steps = [
      { dir: 'right', label: 'SYN', detail: `Seq=${clientSeq}`, color: '#3498db',
        desc: 'Клиент отправляет SYN — запрос на установку соединения. Указывает начальный Sequence Number.' },
      { dir: 'left', label: 'SYN-ACK', detail: `Seq=${serverSeq}, Ack=${clientSeq + 1}`, color: '#2ecc71',
        desc: 'Сервер подтверждает (ACK) и отправляет свой SYN. Указывает свой Sequence Number и подтверждает клиентский +1.' },
      { dir: 'right', label: 'ACK', detail: `Seq=${clientSeq + 1}, Ack=${serverSeq + 1}`, color: '#1abc9c',
        desc: 'Клиент подтверждает SYN сервера. Соединение установлено (ESTABLISHED). Трёхстороннее рукопожатие завершено.' },
      { dir: 'right', label: 'PSH+ACK [Data]', detail: `Seq=${clientSeq + 1}, Len=11`, color: '#e67e22',
        desc: 'Клиент отправляет данные (HTTP-запрос). Флаг PSH указывает серверу передать данные приложению немедленно.' },
      { dir: 'left', label: 'ACK', detail: `Ack=${clientSeq + 12}`, color: '#2ecc71',
        desc: 'Сервер подтверждает получение данных. Acknowledgment = Seq клиента + длина данных.' },
      { dir: 'left', label: 'PSH+ACK [Data]', detail: `Seq=${serverSeq + 1}, Len=42`, color: '#e67e22',
        desc: 'Сервер отправляет ответ (HTTP 200 OK с данными).' },
      { dir: 'right', label: 'ACK', detail: `Ack=${serverSeq + 43}`, color: '#1abc9c',
        desc: 'Клиент подтверждает получение ответа.' },
      { dir: 'right', label: 'FIN+ACK', detail: `Seq=${clientSeq + 12}`, color: '#e74c3c',
        desc: 'Клиент инициирует завершение соединения — отправляет FIN.' },
      { dir: 'left', label: 'FIN+ACK', detail: `Seq=${serverSeq + 43}, Ack=${clientSeq + 13}`, color: '#e74c3c',
        desc: 'Сервер подтверждает FIN клиента и отправляет свой FIN.' },
      { dir: 'right', label: 'ACK', detail: `Ack=${serverSeq + 44}`, color: '#9b59b6',
        desc: 'Клиент подтверждает FIN сервера. Соединение закрыто (CLOSED).' }
    ];

    result.innerHTML = `
      <div class="seq-diagram">
        <div class="seq-cols">
          <div class="seq-col">💻 Клиент</div>
          <div class="seq-col">🖥️ Сервер</div>
        </div>
        <div class="seq-lines" id="seqLines">
          ${steps.map((s, i) => `
            <div class="seq-step" id="seqStep-${i}">
              <div class="seq-arrow seq-arrow--${s.dir}">
                <div class="seq-arrow__line" style="background:${s.color};border-color:${s.color}"></div>
                <div class="seq-arrow__label" style="color:${s.color}">${s.label}</div>
                <div class="seq-arrow__detail">${s.detail}</div>
              </div>
            </div>
            <div class="seq-desc" id="seqDesc-${i}">${s.desc}</div>
          `).join('')}
        </div>
      </div>
    `;

    for (let i = 0; i < steps.length; i++) {
      await sleep(speed);
      const step = document.getElementById('seqStep-' + i);
      const desc = document.getElementById('seqDesc-' + i);
      if (step) step.classList.add('visible');
      if (desc) desc.classList.add('visible');
    }
    unlockAchievement('tcp_hand');
    addXP(5);
  });

  /* ==================== LAB: SCENARIO ==================== */
  document.getElementById('labRun-scenario').addEventListener('click', async () => {
    const result = document.getElementById('labResult-scenario');

    const scenarioSteps = [
      { title: 'Ввод URL в адресную строку', text: 'Пользователь вводит https://example.com в браузер и нажимает Enter.',
        layers: [7], color: '#e74c3c', icon: '⌨️' },
      { title: 'DNS-запрос', text: 'Браузер отправляет DNS-запрос (UDP:53) для определения IP-адреса example.com. DNS-сервер отвечает: 93.184.216.34.',
        layers: [7, 4, 3, 2, 1], color: '#3498db', icon: '🔍' },
      { title: 'ARP-запрос (если нужен)', text: 'Если MAC-адрес шлюза не в ARP-кэше, отправляется ARP-broadcast: «Кто имеет IP 192.168.1.1?». Шлюз отвечает своим MAC.',
        layers: [2, 3], color: '#1abc9c', icon: '📡' },
      { title: 'TCP SYN → Сервер', text: 'Браузер инициирует TCP-соединение: отправляет SYN-сегмент на 93.184.216.34:443. Пакет проходит через маршрутизаторы.',
        layers: [4, 3, 2, 1], color: '#2ecc71', icon: '🤝' },
      { title: 'TCP SYN-ACK ← Сервер', text: 'Сервер отвечает SYN-ACK. Подтверждает запрос клиента и предлагает свой Sequence Number.',
        layers: [4, 3, 2, 1], color: '#2ecc71', icon: '✅' },
      { title: 'TCP ACK → Сервер', text: 'Клиент отправляет ACK. Трёхстороннее рукопожатие завершено — TCP-соединение установлено.',
        layers: [4], color: '#2ecc71', icon: '🔗' },
      { title: 'TLS Handshake', text: 'Клиент и сервер обмениваются ключами шифрования (Client Hello → Server Hello → Certificate → Key Exchange). Устанавливается защищённый канал.',
        layers: [6, 5], color: '#e67e22', icon: '🔐' },
      { title: 'HTTP GET → Сервер', text: 'Браузер отправляет зашифрованный HTTP-запрос: GET / HTTP/1.1. Данные шифруются на уровне представления и передаются через TCP.',
        layers: [7, 6, 5, 4, 3, 2, 1], color: '#e74c3c', icon: '📤' },
      { title: 'HTTP 200 OK ← Сервер', text: 'Сервер отвечает HTTP 200 OK с HTML-страницей. Данные дешифруются и передаются браузеру.',
        layers: [7, 6, 5, 4, 3, 2, 1], color: '#e74c3c', icon: '📥' },
      { title: 'Рендеринг страницы', text: 'Браузер разбирает HTML, загружает CSS/JS/изображения (повторяя цикл DNS → TCP → HTTP для каждого ресурса) и отображает страницу.',
        layers: [7], color: '#9b59b6', icon: '🖼️' }
    ];

    result.innerHTML = `
      <div class="lab-result__title">Что происходит при открытии https://example.com</div>
      <div class="scenario-steps">
        ${scenarioSteps.map((s, i) => `
          <div class="scenario-step" id="scenarioStep-${i}">
            <div class="scenario-step__timeline">
              <div class="scenario-step__dot" style="background:${s.color}">${s.icon}</div>
              <div class="scenario-step__line"></div>
            </div>
            <div class="scenario-step__content">
              <div class="scenario-step__title">${s.title}</div>
              <div class="scenario-step__text">${s.text}</div>
              <div class="scenario-step__layers">
                ${s.layers.map(l => {
                  const layer = OSI_LAYERS.find(ol => ol.number === l);
                  return `<span class="scenario-step__layer-tag" style="background:${layer.color}">L${l} ${layer.name}</span>`;
                }).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    for (let i = 0; i < scenarioSteps.length; i++) {
      await sleep(500);
      const el = document.getElementById('scenarioStep-' + i);
      if (el) el.classList.add('visible');
    }
    unlockAchievement('scenario_done');
    addXP(5);
  });

  /* ==================== LAB: HUB vs SWITCH vs ROUTER ==================== */
  (function initDevicesLab() {
    const result = document.getElementById('labResult-devices');

    const devicesInfo = {
      hub: {
        name: 'Хаб (Hub)', layer: 1, icon: '🔌',
        description: 'Хаб работает на L1 (физический). Он не анализирует адреса — просто повторяет электрический сигнал на ВСЕ порты, кроме входящего. Все устройства получают кадр, даже если он предназначен не им.',
        behavior: [true, true, true]
      },
      switch_: {
        name: 'Коммутатор (Switch)', layer: 2, icon: '🔀',
        description: 'Коммутатор работает на L2 (канальный). Он читает MAC-адрес назначения в кадре и отправляет его ТОЛЬКО на нужный порт. Ведёт MAC-таблицу: какой MAC на каком порту.',
        behavior: [false, false, true]
      },
      router: {
        name: 'Маршрутизатор (Router)', layer: 3, icon: '🌐',
        description: 'Маршрутизатор работает на L3 (сетевой). Он анализирует IP-адрес назначения и перенаправляет пакет в нужную подсеть. Меняет MAC-заголовок (L2) при пересылке, но IP остаётся прежним.',
        behavior: [false, false, true]
      }
    };

    let activeDevice = 'hub';

    function renderDevices() {
      const dev = devicesInfo[activeDevice];
      const layerData = OSI_LAYERS.find(l => l.number === dev.layer);

      result.innerHTML = `
        <div class="device-tabs">
          ${Object.entries(devicesInfo).map(([key, d]) => `
            <button class="device-tab${key === activeDevice ? ' active' : ''}" data-dev="${key}">
              ${d.icon} ${d.name.split(' ')[0]}
            </button>
          `).join('')}
        </div>
        <div class="device-network">
          <div class="device-nodes">
            <div class="device-node" id="devNode-0">
              <div class="device-node__icon" style="${dev.behavior[0] ? 'border-color:var(--l4);box-shadow:0 0 8px rgba(46,204,113,.3)' : ''}">💻</div>
              <div class="device-node__label">PC-A<br><span style="font-size:.55rem;color:var(--text-secondary)">192.168.1.10</span></div>
            </div>
            <div class="device-node" id="devNode-1">
              <div class="device-node__icon" style="${dev.behavior[1] ? 'border-color:var(--l4);box-shadow:0 0 8px rgba(46,204,113,.3)' : ''}">💻</div>
              <div class="device-node__label">PC-B<br><span style="font-size:.55rem;color:var(--text-secondary)">192.168.1.20</span></div>
            </div>
            <div class="device-node" id="devNode-2">
              <div class="device-node__icon" style="border-color:var(--l4);box-shadow:0 0 8px rgba(46,204,113,.3)">💻</div>
              <div class="device-node__label">PC-C<br><span style="font-size:.55rem;color:var(--text-secondary)">192.168.1.30</span></div>
            </div>
          </div>
          <div class="device-links">
            <div class="device-link ${dev.behavior[0] ? 'active' : 'inactive'}"></div>
            <div class="device-link ${dev.behavior[1] ? 'active' : 'inactive'}"></div>
            <div class="device-link active"></div>
          </div>
          <div class="device-center">
            <div class="device-center__icon">${dev.icon}</div>
            <div class="device-center__label">${dev.name}</div>
            <span style="font-size:.7rem;color:${layerData.color};font-weight:700">L${dev.layer} — ${layerData.name}</span>
          </div>
          <div style="text-align:center;font-size:.75rem;color:var(--text-secondary);margin-top:8px">
            PC-A отправляет кадр → PC-C (${activeDevice === 'hub' ? 'получают ВСЕ' : 'получает ТОЛЬКО PC-C'})
          </div>
        </div>
        <div class="card mt-12" style="font-size:.82rem;line-height:1.6">
          ${dev.description}
        </div>
        <table class="pdu-fields mt-12">
          <tr><td>Уровень OSI</td><td>L${dev.layer} — ${layerData.name}</td></tr>
          <tr><td>Анализирует</td><td>${dev.layer === 1 ? 'Ничего (электрический сигнал)' : dev.layer === 2 ? 'MAC-адрес назначения' : 'IP-адрес назначения'}</td></tr>
          <tr><td>Доменов коллизий</td><td>${dev.layer === 1 ? '1 (общий)' : 'По одному на порт'}</td></tr>
          <tr><td>Широковещательный домен</td><td>${dev.layer <= 2 ? '1 (общий)' : 'Разделяет'}</td></tr>
          <tr><td>Скорость обработки</td><td>${dev.layer === 1 ? 'Мгновенно (без анализа)' : dev.layer === 2 ? 'Быстро (аппаратные ASIC)' : 'Медленнее (анализ IP + таблица маршрутов)'}</td></tr>
        </table>
      `;

      result.querySelectorAll('.device-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          activeDevice = tab.dataset.dev;
          renderDevices();
        });
      });
    }

    renderDevices();
  })();

  /* ==================== LAB: TCP vs UDP ==================== */
  document.getElementById('labRun-tcpVsUdp').addEventListener('click', async () => {
    const s = labState.tcpVsUdp || { packetLoss: 20, speed: 350 };
    const loss = s.packetLoss;
    const speed = s.speed;
    const totalPkts = 8;
    const result = document.getElementById('labResult-tcpVsUdp');

    const fate = [];
    for (let i = 0; i < totalPkts; i++) {
      fate.push(Math.random() * 100 < loss);
    }

    const tcpEvents = [];
    const udpEvents = [];

    for (let i = 0; i < totalPkts; i++) {
      if (fate[i]) {
        tcpEvents.push({ type: 'lost', label: `Пакет #${i + 1} — потерян` });
        tcpEvents.push({ type: 'retransmit', label: `Пакет #${i + 1} — повтор` });
        tcpEvents.push({ type: 'ack', label: `ACK #${i + 1}` });
        udpEvents.push({ type: 'lost', label: `Пакет #${i + 1} — потерян` });
      } else {
        tcpEvents.push({ type: 'ok', label: `Пакет #${i + 1}` });
        tcpEvents.push({ type: 'ack', label: `ACK #${i + 1}` });
        udpEvents.push({ type: 'ok', label: `Пакет #${i + 1}` });
      }
    }

    const tcpDelivered = totalPkts;
    const udpDelivered = fate.filter(f => !f).length;
    const udpLost = totalPkts - udpDelivered;
    const tcpRetransmits = fate.filter(f => f).length;

    result.innerHTML = `
      <div class="lab-result__title">Параллельная передача ${totalPkts} пакетов (потери: ${loss}%)</div>
      <div class="versus-grid">
        <div class="versus-col">
          <div class="versus-col__header" style="background:var(--l4)">TCP</div>
          <div class="versus-col__body" id="vsTcpBody">
            ${tcpEvents.map((e, i) => `<div class="versus-pkt versus-pkt--${e.type}" id="vsTcp-${i}"><div class="versus-pkt__dot"></div>${e.label}</div>`).join('')}
          </div>
        </div>
        <div class="versus-col">
          <div class="versus-col__header" style="background:var(--l7)">UDP</div>
          <div class="versus-col__body" id="vsUdpBody">
            ${udpEvents.map((e, i) => `<div class="versus-pkt versus-pkt--${e.type}" id="vsUdp-${i}"><div class="versus-pkt__dot"></div>${e.label}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="versus-summary">
        <div class="lab-stats">
          <div class="lab-stat">
            <div class="lab-stat__value" style="color:var(--l4)">${tcpDelivered}/${totalPkts}</div>
            <div class="lab-stat__label">TCP доставлено</div>
          </div>
          <div class="lab-stat">
            <div class="lab-stat__value" style="color:var(--l7)">${udpDelivered}/${totalPkts}</div>
            <div class="lab-stat__label">UDP доставлено</div>
          </div>
          <div class="lab-stat">
            <div class="lab-stat__value">${tcpRetransmits}</div>
            <div class="lab-stat__label">TCP повторов</div>
          </div>
          <div class="lab-stat">
            <div class="lab-stat__value">${udpLost}</div>
            <div class="lab-stat__label">UDP потеряно</div>
          </div>
        </div>
        <div class="card mt-12" style="font-size:.82rem;line-height:1.6">
          <strong>TCP:</strong> Гарантировал доставку всех ${totalPkts} пакетов${tcpRetransmits > 0 ? `, выполнив ${tcpRetransmits} повторных передач` : ''}. Каждый пакет подтверждается (ACK). Надёжно, но медленнее.<br><br>
          <strong>UDP:</strong> Доставил ${udpDelivered} из ${totalPkts}. ${udpLost > 0 ? `Потерял ${udpLost} пакетов безвозвратно.` : 'Все пакеты дошли (повезло).'} Без подтверждений и повторов — быстро, но ненадёжно. Используется для видео, VoIP, игр.
        </div>
      </div>
    `;

    let ti = 0, ui = 0;
    const maxLen = Math.max(tcpEvents.length, udpEvents.length);
    for (let step = 0; step < maxLen; step++) {
      await sleep(speed);
      if (ti < tcpEvents.length) {
        const el = document.getElementById('vsTcp-' + ti);
        if (el) el.classList.add('visible');
        ti++;
      }
      if (ui < udpEvents.length) {
        const el = document.getElementById('vsUdp-' + ui);
        if (el) el.classList.add('visible');
        ui++;
      }
    }
    while (ti < tcpEvents.length) {
      await sleep(speed);
      const el = document.getElementById('vsTcp-' + ti);
      if (el) el.classList.add('visible');
      ti++;
    }
    unlockAchievement('tcp_vs_udp');
    addXP(5);
  });

  /* ==================== CHANNEL PHYSICS LAB ==================== */
  (function initChannelPhysics() {
    const container = document.getElementById('channelPhysicsUI');
    let chState = { channelId: 'cat5e', dist: 30, env: {} };

    function calcEnvPenalty(ch, env) {
      const envType = getChannelEnvType(ch.id);
      const effects = ENV_EFFECTS[envType] || [];
      let totalDb = 0;
      let speedFactor = 1;
      effects.forEach(eff => {
        const val = env[eff.id];
        if (val === undefined) return;
        if (eff.type === 'toggle') {
          if (val && eff.dbPenalty) totalDb += eff.dbPenalty;
          if (val && eff.dbBonus) totalDb -= eff.dbBonus;
        } else if (eff.type === 'range') {
          if (eff.dbPenalty) totalDb += val * eff.dbPenalty;
          if (eff.dbPenPerDeg) totalDb += Math.max(0, val - (eff.baseline || 0)) * eff.dbPenPerDeg;
          if (eff.speedPenalty) speedFactor = Math.max(0.05, 1 - (val * eff.speedPenalty / 100));
        } else if (eff.type === 'select') {
          if (eff.dbPenalties) totalDb += eff.dbPenalties[val] || 0;
        }
      });
      return { totalDb: Math.max(totalDb, 0), speedFactor };
    }

    function drawSignal(canvas, txAmp, rxAmp, noiseAmp, color) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      const w = rect.width, h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const midTx = h * 0.28;
      const midRx = h * 0.72;

      ctx.strokeStyle = '#2a2e3d';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#6c7a96';
      ctx.font = '10px sans-serif';
      ctx.fillText('TX (передано)', 4, 14);
      ctx.fillText('RX (получено)', 4, h * 0.5 + 14);

      const bits = [1,0,1,1,0,0,1,0,1,1,0,1,0,0,1,1];
      const bitWidth = w / bits.length;

      ctx.beginPath();
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x++) {
        const bitIdx = Math.floor(x / bitWidth) % bits.length;
        const inBit = (x % bitWidth) / bitWidth;
        let val = bits[bitIdx] ? 1 : -1;
        const edge = 0.08;
        if (inBit < edge) val *= inBit / edge;
        else if (inBit > 1 - edge) val *= (1 - inBit) / edge;
        const y = midTx - val * txAmp * (h * 0.2);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      for (let x = 0; x < w; x++) {
        const bitIdx = Math.floor(x / bitWidth) % bits.length;
        const inBit = (x % bitWidth) / bitWidth;
        let val = bits[bitIdx] ? 1 : -1;
        const edge = 0.08;
        if (inBit < edge) val *= inBit / edge;
        else if (inBit > 1 - edge) val *= (1 - inBit) / edge;
        const signal = val * rxAmp * (h * 0.2);
        const noise = (Math.random() - 0.5) * 2 * noiseAmp * (h * 0.2);
        const y = midRx - signal - noise;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (rxAmp > 0.05) {
        ctx.strokeStyle = '#e74c3c44';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(0, midRx); ctx.lineTo(w, midRx); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e74c3c88';
        ctx.font = '9px sans-serif';
        ctx.fillText('порог', w - 34, midRx - 3);
      }
    }

    function render() {
      const ch = CHANNEL_TYPES.find(c => c.id === chState.channelId);
      const envType = getChannelEnvType(ch.id);
      const effects = ENV_EFFECTS[envType] || [];

      effects.forEach(eff => {
        if (chState.env[eff.id] === undefined) {
          chState.env[eff.id] = eff.default !== undefined ? eff.default : 0;
        }
      });

      const envPen = calcEnvPenalty(ch, chState.env);
      const distUnit = ch.medium === 'fiber' ? chState.dist / 1000 : chState.dist / 100;
      const cableAtten = ch.attenuation * distUnit;
      const envAtten = envPen.totalDb;
      const totalAtten = cableAtten + envAtten;
      const txPower = ch.snrBase + 10;
      const rxPower = txPower - totalAtten;
      const noiseFloor = -5 + (ch.interference === 'high' ? 5 : ch.interference === 'medium' ? 2 : 0);
      const snr = rxPower - noiseFloor;
      const snrLin = Math.pow(10, Math.max(snr, 0) / 10);
      const shannon = ch.bandwidthMHz * Math.log2(1 + snrLin);
      const effSpeed = Math.min(ch.speed, shannon) * envPen.speedFactor * (snr > 0 ? 1 : 0);

      let ber;
      if (snr > 30) ber = '< 10⁻¹²';
      else if (snr > 20) ber = '~10⁻⁹';
      else if (snr > 15) ber = '~10⁻⁶';
      else if (snr > 10) ber = '~10⁻⁴';
      else if (snr > 5) ber = '~10⁻²';
      else ber = '~0.5 (нет связи)';

      let quality, qualColor;
      if (snr > 30) { quality = 'Отличное'; qualColor = '#2ecc71'; }
      else if (snr > 20) { quality = 'Хорошее'; qualColor = '#1abc9c'; }
      else if (snr > 10) { quality = 'Среднее'; qualColor = '#f1c40f'; }
      else if (snr > 3) { quality = 'Плохое'; qualColor = '#e67e22'; }
      else { quality = 'Нет связи'; qualColor = '#e74c3c'; }

      const overMax = chState.dist > ch.maxDist;
      const snrPct = Math.min(Math.max(snr / 50 * 100, 0), 100);
      const propDelay = (chState.dist / (ch.propagation * 299792458)) * 1000;

      container.innerHTML = `
        <select class="ch-phy-select" id="chPhySelect">
          ${CHANNEL_TYPES.map(c => `<option value="${c.id}"${c.id === chState.channelId ? ' selected' : ''}>${c.icon} ${c.name} — ${c.medium === 'copper' ? 'медь' : c.medium === 'fiber' ? 'оптоволокно' : 'радио'}</option>`).join('')}
        </select>

        <div class="lab-param">
          <div class="lab-param__label">
            <span>Расстояние</span>
            <span class="lab-param__value" style="${overMax ? 'color:var(--l7)' : ''}">${chState.dist >= 1000 ? (chState.dist/1000).toFixed(1) + ' км' : chState.dist + ' м'}${overMax ? ' ⚠ > макс.' : ''}</span>
          </div>
          <input type="range" id="chPhyDist" min="1" max="${Math.max(ch.maxDist * 2, 200)}" step="${ch.maxDist > 5000 ? 100 : 1}" value="${chState.dist}">
        </div>

        <div class="ch-canvas-wrap">
          <canvas id="chPhyCanvas" style="height:180px"></canvas>
          <div class="ch-canvas-legend">
            <div class="ch-canvas-legend__item"><div class="ch-canvas-legend__dot" style="background:#2ecc71"></div> Переданный</div>
            <div class="ch-canvas-legend__item"><div class="ch-canvas-legend__dot" style="background:${qualColor}"></div> Принятый</div>
            <div class="ch-canvas-legend__item"><div class="ch-canvas-legend__dot" style="background:#e74c3c"></div> Порог</div>
          </div>
        </div>

        <div class="lab-result__title">Бюджет мощности</div>
        <div class="ch-budget">
          <div class="ch-budget__row"><div class="ch-budget__icon">📡</div><div class="ch-budget__label">Мощность передатчика</div><div class="ch-budget__val ch-budget__val--good">+${txPower.toFixed(1)} дБ</div></div>
          <div class="ch-budget__row"><div class="ch-budget__icon">📉</div><div class="ch-budget__label">Затухание в среде (${chState.dist >= 1000 ? (chState.dist/1000).toFixed(1)+'км' : chState.dist+'м'})</div><div class="ch-budget__val ch-budget__val--bad">−${cableAtten.toFixed(1)} дБ</div></div>
          ${envAtten > 0 ? `<div class="ch-budget__row"><div class="ch-budget__icon">🌧️</div><div class="ch-budget__label">Потери среды (помехи, условия)</div><div class="ch-budget__val ch-budget__val--bad">−${envAtten.toFixed(1)} дБ</div></div>` : ''}
          <div class="ch-budget__row"><div class="ch-budget__icon">📥</div><div class="ch-budget__label">Мощность на приёмнике</div><div class="ch-budget__val" style="color:${qualColor}">${rxPower.toFixed(1)} дБ</div></div>
          <div class="ch-budget__row"><div class="ch-budget__icon">🔊</div><div class="ch-budget__label">Шумовая полка</div><div class="ch-budget__val">${noiseFloor.toFixed(1)} дБ</div></div>
          <div class="ch-budget__row" style="font-weight:700"><div class="ch-budget__icon">📶</div><div class="ch-budget__label">SNR (сигнал/шум)</div><div class="ch-budget__val" style="color:${qualColor}">${snr.toFixed(1)} дБ — ${quality}</div></div>
        </div>
        <div class="ch-budget__bar"><div class="ch-budget__bar-fill" style="width:${snrPct}%;background:${qualColor}"></div></div>

        <div class="lab-stats">
          <div class="lab-stat"><div class="lab-stat__value" style="color:${qualColor}">${snr.toFixed(1)} дБ</div><div class="lab-stat__label">SNR</div></div>
          <div class="lab-stat"><div class="lab-stat__value">${ber}</div><div class="lab-stat__label">BER</div></div>
          <div class="lab-stat"><div class="lab-stat__value">${formatSpeed(Math.max(effSpeed, 0))}</div><div class="lab-stat__label">Эфф. скорость</div></div>
          <div class="lab-stat"><div class="lab-stat__value">${formatSpeed(shannon)}</div><div class="lab-stat__label">Ёмкость Шеннона</div></div>
          <div class="lab-stat"><div class="lab-stat__value">${propDelay.toFixed(3)} мс</div><div class="lab-stat__label">Задержка распр.</div></div>
          <div class="lab-stat"><div class="lab-stat__value">${ch.duplex === 'full' ? 'Full' : 'Half'}</div><div class="lab-stat__label">Дуплекс</div></div>
        </div>

        ${effects.length ? `
        <div class="ch-env-section">
          <div class="ch-env-section__title">Условия среды — ${ch.medium === 'copper' ? 'медный кабель' : ch.medium === 'fiber' ? 'оптоволокно' : ch.id === 'satellite' ? 'спутниковый канал' : 'радиоканал'}</div>
          ${effects.map(eff => {
            const val = chState.env[eff.id];
            if (eff.type === 'range') {
              return `<div class="ch-env-item">
                <div class="ch-env-item__row"><span>${eff.label}</span><span class="ch-env-item__val" id="chEnvVal-${eff.id}">${val}</span></div>
                <input type="range" min="${eff.min}" max="${eff.max}" value="${val}" data-env="${eff.id}">
                <div class="ch-env-item__desc">${eff.desc}</div>
              </div>`;
            } else if (eff.type === 'toggle') {
              return `<div class="ch-env-item">
                <label class="ch-env-toggle"><input type="checkbox" data-env="${eff.id}"${val ? ' checked' : ''}> ${eff.label}</label>
                <div class="ch-env-item__desc">${eff.desc}</div>
              </div>`;
            } else if (eff.type === 'select') {
              return `<div class="ch-env-item">
                <div class="ch-env-item__row"><span>${eff.label}</span></div>
                <select data-env="${eff.id}">${eff.options.map((o, i) => `<option value="${i}"${i === val ? ' selected' : ''}>${o}</option>`).join('')}</select>
                <div class="ch-env-item__desc">${eff.desc}</div>
              </div>`;
            }
            return '';
          }).join('')}
        </div>` : ''}

        <div class="card mt-16" style="font-size:.82rem;line-height:1.6">
          <strong>${ch.icon} ${ch.name}</strong> — ${ch.desc}
          <br><br><strong>Кодирование:</strong> ${ch.encoding} | <strong>Полоса:</strong> ${ch.bandwidthMHz >= 1000 ? ch.bandwidthMHz/1000 + ' ГГц' : ch.bandwidthMHz + ' МГц'} | <strong>Макс. дальность:</strong> ${ch.maxDist >= 1000 ? (ch.maxDist/1000).toFixed(0) + ' км' : ch.maxDist + ' м'}
        </div>
      `;

      const canvas = document.getElementById('chPhyCanvas');
      const txAmp = 1;
      const rxAmp = Math.max(Math.pow(10, -totalAtten / 40), 0.01);
      const noiseAmp = Math.pow(10, -snr / 30) * 0.8;
      drawSignal(canvas, txAmp, Math.min(rxAmp, 1), Math.min(noiseAmp, 1.2), qualColor);

      container.querySelector('#chPhySelect').addEventListener('change', (e) => {
        const newCh = CHANNEL_TYPES.find(c => c.id === e.target.value);
        chState.channelId = e.target.value;
        chState.dist = newCh.defaultDist;
        chState.env = {};
        render();
      });

      container.querySelector('#chPhyDist').addEventListener('input', (e) => {
        chState.dist = parseInt(e.target.value);
        render();
      });

      container.querySelectorAll('[data-env]').forEach(el => {
        const handler = () => {
          const key = el.dataset.env;
          if (el.type === 'checkbox') chState.env[key] = el.checked;
          else if (el.tagName === 'SELECT') chState.env[key] = parseInt(el.value);
          else { chState.env[key] = parseFloat(el.value); const valEl = document.getElementById('chEnvVal-' + key); if (valEl) valEl.textContent = el.value; }
          render();
        };
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', handler);
      });
    }

    const observer = new MutationObserver(() => {
      if (document.getElementById('lab-channelPhysics')?.classList.contains('active') && !container.children.length) render();
    });
    observer.observe(document.getElementById('lab-channelPhysics'), { attributes: true, attributeFilter: ['class'] });

    setTimeout(() => {
      if (document.getElementById('lab-channelPhysics')?.classList.contains('active')) render();
    }, 100);
  })();

  /* ==================== NETWORK PATH BUILDER ==================== */
  const SPEED_OF_LIGHT = 299792458; // m/s

  let nbPath = [
    { type: 'device', id: 'pc' },
    { type: 'link', id: 'wifi5', dist: 10 },
    { type: 'device', id: 'router' },
    { type: 'link', id: 'cat5e', dist: 30 },
    { type: 'device', id: 'server' }
  ];

  function renderNBPresets() {
    const c = document.getElementById('nbPresets');
    c.innerHTML = NET_PRESETS.map((p, i) => `<button class="nb-preset" data-preset="${i}">${p.name}</button>`).join('');
    c.querySelectorAll('.nb-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        nbPath = JSON.parse(JSON.stringify(NET_PRESETS[parseInt(btn.dataset.preset)].path));
        renderNBPath();
      });
    });
  }

  function formatSpeed(mbps) {
    if (mbps >= 1000) return (mbps / 1000).toFixed(mbps >= 10000 ? 0 : 1) + ' Гбит/с';
    return Math.round(mbps) + ' Мбит/с';
  }

  function formatDist(m) {
    if (m >= 1000) return (m / 1000).toFixed(m >= 10000 ? 0 : 1) + ' км';
    return m + ' м';
  }

  function calcChannelPhysics(ch, dist, env) {
    const distUnit = ch.medium === 'fiber' ? dist / 1000 : dist / 100;
    const cableAtten = ch.attenuation * distUnit;
    const envPenalty = env === 'harsh' ? (ch.medium === 'radio' ? 18 : ch.medium === 'fiber' ? 5 : 10) : env === 'ideal' ? 0 : (ch.medium === 'radio' ? 5 : ch.medium === 'fiber' ? 1 : 3);
    const attenTotal = cableAtten + envPenalty;
    const snr = Math.max(ch.snrBase - attenTotal, -5);
    const snrLinear = Math.pow(10, snr / 10);

    const shannonMbps = ch.bandwidthMHz * Math.log2(1 + Math.max(snrLinear, 0));
    const effectiveSpeed = Math.min(ch.speed, shannonMbps) * (snr > 0 ? 1 : 0);

    const propagationDelay = (dist / (ch.propagation * SPEED_OF_LIGHT)) * 1000;
    const totalDelay = ch.latency + propagationDelay;

    let ber;
    if (snr > 30) ber = 1e-12;
    else if (snr > 20) ber = 1e-9;
    else if (snr > 15) ber = 1e-6;
    else if (snr > 10) ber = 1e-4;
    else if (snr > 5) ber = 1e-2;
    else ber = 0.5;

    let quality;
    if (snr > 30) quality = 'excellent';
    else if (snr > 20) quality = 'good';
    else if (snr > 10) quality = 'fair';
    else if (snr > 3) quality = 'poor';
    else quality = 'dead';

    const overMax = dist > ch.maxDist;

    return { attenTotal, snr, shannonMbps, effectiveSpeed, propagationDelay, totalDelay, ber, quality, overMax };
  }

  function signalBarHTML(quality) {
    const heights = [4, 7, 10, 14];
    const levels = { excellent: 4, good: 3, fair: 2, poor: 1, dead: 0 };
    const n = levels[quality] || 0;
    const cls = quality === 'fair' ? 'signal-bar--fair' : quality === 'poor' ? 'signal-bar--poor' : quality === 'dead' ? 'signal-bar--dead' : '';
    return `<div class="signal-bar ${cls}">${heights.map((h, i) => `<div class="signal-bar__seg${i < n ? ' on' : ''}" style="height:${h}px"></div>`).join('')}</div>`;
  }

  function renderNBPath() {
    const c = document.getElementById('nbPath');
    let html = '';
    nbPath.forEach((item, i) => {
      if (item.type === 'device') {
        const dev = NET_DEVICES.find(d => d.id === item.id);
        const isEndpoint = i === 0 || i === nbPath.length - 1;
        const lyr = OSI_LAYERS.find(l => l.number === dev.layer);
        html += `<div class="nb-device" id="nbDev-${i}" data-idx="${i}">
          <div class="nb-device__icon" style="background:${dev.color}20;border:1px solid ${dev.color}40">${dev.icon}</div>
          <div class="nb-device__info">
            <div class="nb-device__name">${dev.name}</div>
            <div class="nb-device__layer" style="color:${lyr.color}">L${dev.layer} ${lyr.name}</div>
          </div>
          ${isEndpoint ? '' : `
            <select class="nb-device__select" data-idx="${i}">
              ${NET_DEVICES.filter(d => !['pc','server'].includes(d.id)).map(d => `<option value="${d.id}"${d.id === item.id ? ' selected' : ''}>${d.icon} ${d.name}</option>`).join('')}
            </select>
            <button class="nb-device__remove" data-idx="${i}">✕</button>
          `}
        </div>`;
      } else {
        const ch = CHANNEL_TYPES.find(ct => ct.id === item.id);
        const dist = item.dist || ch.defaultDist;
        const phys = calcChannelPhysics(ch, dist, item.env || 'normal');
        html += `<div class="nb-link" id="nbLink-${i}" data-idx="${i}" style="flex-wrap:wrap">
          <div class="nb-link__line" style="background:${ch.color}" id="nbLine-${i}"></div>
          <select class="nb-link__select" data-idx="${i}">
            ${CHANNEL_TYPES.map(ct => `<option value="${ct.id}"${ct.id === item.id ? ' selected' : ''}>${ct.icon} ${ct.name}</option>`).join('')}
          </select>
          ${signalBarHTML(phys.quality)}
          <div class="nb-link__dist">
            <input type="range" min="1" max="${ch.maxDist * 2}" step="${ch.maxDist > 1000 ? 100 : 1}" value="${dist}" data-idx="${i}">
            <div class="nb-link__dist-val">${formatDist(dist)}</div>
          </div>
          <div class="nb-link__details">
            <span class="nb-link__tag">${ch.duplex === 'full' ? 'Full-duplex' : 'Half-duplex'}</span>
            <span class="nb-link__tag">${ch.encoding}</span>
            <span class="nb-link__tag">${ch.medium === 'copper' ? 'Медь' : ch.medium === 'fiber' ? 'Свет' : 'Радио'}</span>
            <span class="nb-link__tag">${ch.interference === 'high' ? 'Помехи ⚠' : ch.interference === 'medium' ? 'Помехи ~' : ch.interference === 'none' ? 'Без помех' : 'Мало помех'}</span>
            ${phys.overMax ? `<span class="nb-link__tag nb-link__tag--warn">Превышение дальности!</span>` : ''}
            <select class="nb-device__select" data-env-idx="${i}" style="margin-left:auto;max-width:100px">
              <option value="ideal"${(item.env || 'normal') === 'ideal' ? ' selected' : ''}>Идеально</option>
              <option value="normal"${(item.env || 'normal') === 'normal' ? ' selected' : ''}>Норма</option>
              <option value="harsh"${(item.env || 'normal') === 'harsh' ? ' selected' : ''}>Тяжёлые</option>
            </select>
          </div>
        </div>`;
      }
    });
    c.innerHTML = html;

    c.querySelectorAll('.nb-device__select').forEach(sel => {
      sel.addEventListener('change', () => {
        nbPath[parseInt(sel.dataset.idx)].id = sel.value;
        renderNBPath();
      });
    });

    c.querySelectorAll('.nb-link__select').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.dataset.idx);
        const newCh = CHANNEL_TYPES.find(ct => ct.id === sel.value);
        nbPath[idx].id = sel.value;
        nbPath[idx].dist = newCh.defaultDist;
        renderNBPath();
      });
    });

    c.querySelectorAll('[data-env-idx]').forEach(sel => {
      sel.addEventListener('change', () => {
        nbPath[parseInt(sel.dataset.envIdx)].env = sel.value;
        renderNBPath();
      });
    });

    c.querySelectorAll('.nb-link__dist input[type="range"]').forEach(slider => {
      slider.addEventListener('input', () => {
        const idx = parseInt(slider.dataset.idx);
        nbPath[idx].dist = parseInt(slider.value);
        renderNBPath();
      });
    });

    c.querySelectorAll('.nb-device__remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        nbPath.splice(idx - 1, 2);
        renderNBPath();
      });
    });
  }

  renderNBPresets();
  renderNBPath();

  document.getElementById('nbAddHop').addEventListener('click', () => {
    const lastLinkIdx = nbPath.length - 1;
    nbPath.splice(lastLinkIdx, 0,
      { type: 'device', id: 'switch' },
      { type: 'link', id: 'cat5e', dist: 30 }
    );
    renderNBPath();
  });

  document.getElementById('nbSend').addEventListener('click', async () => {
    const result = document.getElementById('nbResult');
    let totalLatency = 0;
    let totalJitter = 0;
    let bottleneck = Infinity;
    let bottleneckName = '';
    let worstBER = 0;
    let worstSNR = 999;
    let worstQuality = 'excellent';
    const hops = [];
    const usedCh = new Set();
    const qualityOrder = ['dead', 'poor', 'fair', 'good', 'excellent'];

    for (let i = 0; i < nbPath.length; i++) {
      const item = nbPath[i];
      if (item.type === 'link') {
        const ch = CHANNEL_TYPES.find(ct => ct.id === item.id);
        const dist = item.dist || ch.defaultDist;
        const phys = calcChannelPhysics(ch, dist, item.env || 'normal');
        totalLatency += phys.totalDelay;
        totalJitter += ch.jitter;
        usedCh.add(ch.id);
        if (phys.effectiveSpeed < bottleneck) { bottleneck = phys.effectiveSpeed; bottleneckName = ch.name; }
        if (phys.ber > worstBER) worstBER = phys.ber;
        if (phys.snr < worstSNR) worstSNR = phys.snr;
        if (qualityOrder.indexOf(phys.quality) < qualityOrder.indexOf(worstQuality)) worstQuality = phys.quality;
        hops.push({
          icon: ch.icon, name: ch.name, type: 'link', idx: i, ch, dist, phys,
          latency: phys.totalDelay
        });
      } else {
        const dev = NET_DEVICES.find(d => d.id === item.id);
        totalLatency += dev.proc;
        hops.push({ icon: dev.icon, name: dev.name, latency: dev.proc, layer: dev.layer, type: 'device', desc: dev.desc, idx: i });
      }
    }

    usedCh.forEach(id => {
      if (!gameState.usedChannels.includes(id)) {
        gameState.usedChannels.push(id);
        saveGame();
      }
    });
    if (gameState.usedChannels.length >= 5) unlockAchievement('all_channels');

    const berStr = worstBER < 1e-10 ? '< 10⁻¹⁰' : worstBER < 1e-6 ? worstBER.toExponential(0) : worstBER.toExponential(1);

    result.innerHTML = `
      <div class="lab-result__title">Анализ маршрута</div>
      <div class="lab-stats">
        <div class="lab-stat">
          <div class="lab-stat__value">${totalLatency.toFixed(2)} мс</div>
          <div class="lab-stat__label">Общая задержка</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${bottleneck > 0 ? formatSpeed(bottleneck) : '0'}</div>
          <div class="lab-stat__label">Эфф. пропускная способность</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${worstSNR.toFixed(1)} дБ</div>
          <div class="lab-stat__label">Мин. SNR</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${berStr}</div>
          <div class="lab-stat__label">BER (макс.)</div>
        </div>
      </div>
      <div class="lab-stats mt-12">
        <div class="lab-stat">
          <div class="lab-stat__value">${totalJitter.toFixed(2)} мс</div>
          <div class="lab-stat__label">Джиттер (сумм.)</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${signalBarHTML(worstQuality)}</div>
          <div class="lab-stat__label">Качество сигнала</div>
        </div>
      </div>
      <div class="mt-16">
        <div class="lab-result__title">Путь пакета — детали</div>
        ${hops.map((h, idx) => {
          if (h.type === 'device') {
            return `<div class="nb-result-row" id="nbRes-${idx}">
              <div class="nb-result-row__icon">${h.icon}</div>
              <div class="nb-result-row__text"><strong>${h.name}</strong> — L${h.layer}</div>
              <div class="nb-result-row__val">${h.latency > 0 ? '+' + h.latency.toFixed(2) + ' мс' : '—'}</div>
            </div>`;
          }
          const p = h.phys;
          return `<div class="nb-result-row" id="nbRes-${idx}">
            <div class="nb-result-row__icon">${h.icon}</div>
            <div class="nb-result-row__text"><strong>${h.name}</strong> — ${formatDist(h.dist)}</div>
            <div class="nb-result-row__val">${signalBarHTML(p.quality)}</div>
          </div>
          <div class="nb-chan-detail" id="nbResDet-${idx}">
            <div class="nb-chan-detail__grid">
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Среда</span><span class="nb-chan-detail__val">${h.ch.medium === 'copper' ? 'Медь' : h.ch.medium === 'fiber' ? 'Оптоволокно' : 'Радио'}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Дуплекс</span><span class="nb-chan-detail__val">${h.ch.duplex === 'full' ? 'Full' : 'Half'}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Затухание</span><span class="nb-chan-detail__val">${p.attenTotal.toFixed(1)} дБ</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">SNR</span><span class="nb-chan-detail__val">${p.snr.toFixed(1)} дБ</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Номинал</span><span class="nb-chan-detail__val">${formatSpeed(h.ch.speed)}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Шеннон</span><span class="nb-chan-detail__val">${formatSpeed(p.shannonMbps)}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Эффективная</span><span class="nb-chan-detail__val" style="color:${p.effectiveSpeed < h.ch.speed * 0.5 ? 'var(--l7)' : 'var(--l4)'}">${formatSpeed(p.effectiveSpeed)}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">BER</span><span class="nb-chan-detail__val">${p.ber < 1e-10 ? '< 10⁻¹⁰' : p.ber.toExponential(0)}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Задержка распр.</span><span class="nb-chan-detail__val">${p.propagationDelay.toFixed(3)} мс</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Джиттер</span><span class="nb-chan-detail__val">${h.ch.jitter} мс</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Кодирование</span><span class="nb-chan-detail__val">${h.ch.encoding}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Полоса</span><span class="nb-chan-detail__val">${h.ch.bandwidthMHz >= 1000 ? (h.ch.bandwidthMHz / 1000) + ' ГГц' : h.ch.bandwidthMHz + ' МГц'}</span></div>
            </div>
            ${p.overMax ? `<div style="color:var(--l7);font-weight:700;margin-top:6px">⚠ Расстояние (${formatDist(h.dist)}) превышает макс. дальность (${formatDist(h.ch.maxDist)})</div>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="card mt-16" style="font-size:.82rem;line-height:1.6">
        <strong>Узкое место:</strong> ${bottleneckName} (${bottleneck > 0 ? formatSpeed(bottleneck) : 'нет сигнала'}).<br>
        ${worstQuality === 'dead' ? '<span style="color:var(--l7)"><strong>Сигнал потерян!</strong> Уменьшите расстояние или выберите канал с меньшим затуханием.</span>' :
          worstQuality === 'poor' ? '<span style="color:var(--l6)"><strong>Слабый сигнал!</strong> Высокая вероятность ошибок. Рекомендуется усилитель или смена канала.</span>' :
          totalLatency > 100 ? '<strong>Высокая задержка!</strong> Для VoIP/игр нужно < 50 мс. Спутниковый канал — основная причина.' :
          totalJitter > 5 ? '<strong>Значительный джиттер.</strong> Буферизация потребуется для потоковых приложений.' :
          'Маршрут в хорошем состоянии.'}
      </div>
    `;

    document.querySelectorAll('.nb-device, .nb-link__line').forEach(el => el.classList.remove('nb-active'));

    for (let i = 0; i < hops.length; i++) {
      await sleep(250);
      const row = document.getElementById('nbRes-' + i);
      if (row) row.classList.add('visible');
      const det = document.getElementById('nbResDet-' + i);
      if (det) det.classList.add('visible');

      const idx = hops[i].idx;
      if (hops[i].type === 'device') {
        const devEl = document.getElementById('nbDev-' + idx);
        if (devEl) devEl.classList.add('nb-active');
      } else {
        const lineEl = document.getElementById('nbLine-' + idx);
        if (lineEl) lineEl.classList.add('nb-active');
      }
    }

    unlockAchievement('net_builder');
    addXP(5);
  });

  /* ==================== DRAG & DROP ==================== */
  let dndCurrentItems = [];
  let draggedItem = null;
  let draggedEl = null;
  let touchClone = null;

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function initDnD() {
    dndCurrentItems = shuffleArray(DRAG_DROP_ITEMS).slice(0, 12);
    const itemsContainer = document.getElementById('dndItems');
    const zonesContainer = document.getElementById('dndZones');
    document.getElementById('dndScore').innerHTML = '';

    itemsContainer.innerHTML = '';
    dndCurrentItems.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = `dnd-item dnd-item--type-${item.type}`;
      el.textContent = item.name;
      el.dataset.idx = idx;
      el.dataset.layer = item.layer;
      el.draggable = true;

      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragend', onDragEnd);
      el.addEventListener('touchstart', onTouchStart, { passive: false });
      el.addEventListener('touchmove', onTouchMove, { passive: false });
      el.addEventListener('touchend', onTouchEnd);

      itemsContainer.appendChild(el);
    });

    zonesContainer.innerHTML = '';
    OSI_LAYERS.forEach(layer => {
      const zone = document.createElement('div');
      zone.className = 'dnd-zone';
      zone.dataset.layer = layer.number;
      zone.style.borderColor = layer.color + '60';
      zone.style.background = layer.color + '08';

      zone.innerHTML = `<div class="dnd-zone__label" style="background:${layer.color}">L${layer.number} ${layer.name}</div><div class="dnd-zone__items"></div>`;

      zone.addEventListener('dragover', onDragOver);
      zone.addEventListener('dragleave', onDragLeave);
      zone.addEventListener('drop', onDrop);

      zonesContainer.appendChild(zone);
    });
  }

  function onDragStart(e) {
    draggedEl = e.target;
    draggedItem = {
      idx: e.target.dataset.idx,
      layer: e.target.dataset.layer,
      name: e.target.textContent
    };
    e.target.classList.add('dnd-item--dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragEnd(e) {
    e.target.classList.remove('dnd-item--dragging');
    document.querySelectorAll('.dnd-zone').forEach(z => z.classList.remove('drag-over'));
  }

  function onDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }

  function onDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  function onDrop(e) {
    e.preventDefault();
    const zone = e.currentTarget;
    zone.classList.remove('drag-over');
    if (!draggedEl) return;
    const itemsArea = zone.querySelector('.dnd-zone__items');
    draggedEl.classList.remove('dnd-item--dragging');
    itemsArea.appendChild(draggedEl);
    draggedEl = null;
    draggedItem = null;
  }

  // Touch support
  function onTouchStart(e) {
    e.preventDefault();
    const el = e.target.closest('.dnd-item');
    if (!el) return;
    draggedEl = el;
    draggedItem = { idx: el.dataset.idx, layer: el.dataset.layer, name: el.textContent };

    touchClone = el.cloneNode(true);
    touchClone.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:.85;transform:scale(1.08);`;
    document.body.appendChild(touchClone);

    const touch = e.touches[0];
    touchClone.style.left = (touch.clientX - 40) + 'px';
    touchClone.style.top = (touch.clientY - 20) + 'px';
    el.classList.add('dnd-item--dragging');
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (!touchClone) return;
    const touch = e.touches[0];
    touchClone.style.left = (touch.clientX - 40) + 'px';
    touchClone.style.top = (touch.clientY - 20) + 'px';

    document.querySelectorAll('.dnd-zone').forEach(z => {
      const rect = z.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        z.classList.add('drag-over');
      } else {
        z.classList.remove('drag-over');
      }
    });
  }

  function onTouchEnd(e) {
    if (touchClone) {
      touchClone.remove();
      touchClone = null;
    }
    if (!draggedEl) return;
    draggedEl.classList.remove('dnd-item--dragging');

    const touch = e.changedTouches[0];
    const zones = document.querySelectorAll('.dnd-zone');
    let dropped = false;

    zones.forEach(z => {
      z.classList.remove('drag-over');
      const rect = z.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        z.querySelector('.dnd-zone__items').appendChild(draggedEl);
        dropped = true;
      }
    });

    if (!dropped) {
      document.getElementById('dndItems').appendChild(draggedEl);
    }

    draggedEl = null;
    draggedItem = null;
  }

  // Check answers
  document.getElementById('dndCheck').addEventListener('click', () => {
    let correct = 0;
    let total = 0;

    document.querySelectorAll('.dnd-zone').forEach(zone => {
      const zoneLayer = parseInt(zone.dataset.layer);
      zone.querySelectorAll('.dnd-item').forEach(item => {
        total++;
        const itemLayer = parseInt(item.dataset.layer);
        item.classList.remove('dnd-item--correct', 'dnd-item--wrong');
        if (itemLayer === zoneLayer) {
          item.classList.add('dnd-item--correct');
          correct++;
        } else {
          item.classList.add('dnd-item--wrong');
        }
      });
    });

    const remaining = document.querySelectorAll('#dndItems .dnd-item').length;
    const scoreEl = document.getElementById('dndScore');

    if (total === 0) {
      scoreEl.innerHTML = '<div class="dnd-score"><div class="dnd-score__label">Перетащите элементы на уровни OSI</div></div>';
      return;
    }

    const pct = Math.round((correct / total) * 100);
    addXP(correct);
    if (pct === 100 && remaining === 0) unlockAchievement('dnd_perfect');
    scoreEl.innerHTML = `
      <div class="dnd-score">
        <div class="dnd-score__value">${correct}/${total}</div>
        <div class="dnd-score__label">${pct}% правильных${remaining > 0 ? ` (ещё ${remaining} не размещено)` : ''}</div>
      </div>
    `;
  });

  document.getElementById('dndReset').addEventListener('click', initDnD);

  initDnD();

  /* ==================== FILE UPLOAD ==================== */
  const fileDrop = document.getElementById('fileDrop');
  const fileInput = document.getElementById('fileInput');
  const MAX_FILE = 50 * 1024 * 1024;

  fileDrop.addEventListener('click', () => fileInput.click());
  fileDrop.addEventListener('dragover', (e) => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
  fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag-over'));
  fileDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDrop.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });

  function handleFile(file) {
    const result = document.getElementById('fileResult');
    if (file.size > MAX_FILE) {
      result.innerHTML = '<div class="card mt-12" style="color:var(--l7)">Файл слишком большой. Максимум 50 МБ.</div>';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result);
      const preview = bytes.slice(0, 128);
      let hexLines = '';
      for (let off = 0; off < preview.length; off += 16) {
        const chunk = preview.slice(off, off + 16);
        let hex = '', ascii = '';
        for (let i = 0; i < 16; i++) {
          if (i < chunk.length) {
            hex += chunk[i].toString(16).toUpperCase().padStart(2, '0') + ' ';
            ascii += (chunk[i] >= 32 && chunk[i] < 127) ? String.fromCharCode(chunk[i]) : '.';
          } else { hex += '   '; ascii += ' '; }
          if (i === 7) hex += ' ';
        }
        hexLines += off.toString(16).toUpperCase().padStart(4, '0') + '  ' + hex + ' ' + ascii + '\n';
      }

      const mtu = 1500;
      const tcpPayload = mtu - 20 - 20;
      const segments = Math.ceil(file.size / tcpPayload);
      const ipPackets = segments;
      const frames = segments;
      const totalOverhead = segments * (14 + 20 + 20 + 4);
      const totalOnWire = file.size + totalOverhead;
      const overheadPct = ((totalOverhead / totalOnWire) * 100).toFixed(1);

      const sizeStr = file.size >= 1048576 ? (file.size / 1048576).toFixed(2) + ' МБ'
        : file.size >= 1024 ? (file.size / 1024).toFixed(1) + ' КБ' : file.size + ' Б';

      const icon = file.type.startsWith('image/') ? '🖼️' :
        file.type.startsWith('video/') ? '🎬' : file.type.startsWith('audio/') ? '🎵' :
        file.type.includes('pdf') ? '📄' : file.type.includes('zip') || file.type.includes('rar') ? '📦' : '📄';

      let channelRows = '';
      CHANNEL_TYPES.forEach(ch => {
        const timeSec = (totalOnWire * 8) / (ch.speed * 1e6);
        const timeStr = timeSec >= 60 ? (timeSec / 60).toFixed(1) + ' мин' : timeSec >= 1 ? timeSec.toFixed(2) + ' с' : (timeSec * 1000).toFixed(1) + ' мс';
        channelRows += `<tr><td>${ch.icon} ${ch.name}</td><td>${formatSpeed(ch.speed)}</td><td>${timeStr}</td></tr>`;
      });

      result.innerHTML = `
        <div class="file-info">
          <div class="file-info__header">
            <div class="file-info__icon">${icon}</div>
            <div>
              <div class="file-info__name">${file.name}</div>
              <div class="file-info__meta">${file.type || 'unknown'} — ${sizeStr} — ${file.size.toLocaleString()} байт</div>
            </div>
          </div>
          <div class="study-section__title">Hex-превью (первые ${preview.length} байт)</div>
          <div class="file-hex">${hexLines}</div>
          <div class="lab-stats">
            <div class="lab-stat"><div class="lab-stat__value">${segments.toLocaleString()}</div><div class="lab-stat__label">TCP-сегментов</div></div>
            <div class="lab-stat"><div class="lab-stat__value">${ipPackets.toLocaleString()}</div><div class="lab-stat__label">IP-пакетов</div></div>
            <div class="lab-stat"><div class="lab-stat__value">${frames.toLocaleString()}</div><div class="lab-stat__label">Ethernet-кадров</div></div>
            <div class="lab-stat"><div class="lab-stat__value">${overheadPct}%</div><div class="lab-stat__label">Overhead заголовков</div></div>
          </div>
          <div class="pdu-fields mt-12">
            <tr><td>Payload данных</td><td>${sizeStr}</td></tr>
            <tr><td>+ TCP заголовки</td><td>${(segments * 20).toLocaleString()} Б (${segments} × 20)</td></tr>
            <tr><td>+ IP заголовки</td><td>${(segments * 20).toLocaleString()} Б (${segments} × 20)</td></tr>
            <tr><td>+ Ethernet + CRC</td><td>${(segments * 18).toLocaleString()} Б (${segments} × 18)</td></tr>
            <tr><td><strong>Итого на линии</strong></td><td><strong>${(totalOnWire / 1024).toFixed(1)} КБ</strong></td></tr>
          </div>
          <div class="study-section__title mt-16">Время передачи по каналам</div>
          <div style="overflow-x:auto">
            <table class="file-transfer-table">
              <thead><tr><th>Канал</th><th>Скорость</th><th>Время</th></tr></thead>
              <tbody>${channelRows}</tbody>
            </table>
          </div>
        </div>
      `;
      addXP(5);
    };
    reader.readAsArrayBuffer(file);
  }

  /* ==================== LAB: TLS / ENCRYPTION ==================== */
  document.getElementById('labRun-tls').addEventListener('click', async () => {
    const isTLS13 = labState.tls ? labState.tls.tlsVersion === 1 : true;
    const speed = labState.tls ? labState.tls.speed : 500;
    const result = document.getElementById('labResult-tls');

    const sessionId = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    const randomC = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    const randomS = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');

    const steps13 = [
      { icon: '📤', bg: '#3498db', title: 'Client Hello', dir: '→',
        detail: 'Клиент отправляет: поддерживаемые версии TLS, cipher suites, расширения (SNI, ALPN), свой случайный ключ и key_share (для ECDHE).',
        code: `TLS 1.3 Client Hello\nRandom: ${randomC}\nCipher Suites:\n  TLS_AES_256_GCM_SHA384\n  TLS_CHACHA20_POLY1305_SHA256\nKey Share: x25519\nSNI: example.com` },
      { icon: '📥', bg: '#2ecc71', title: 'Server Hello + EncryptedExtensions + Certificate + Finished', dir: '←',
        detail: 'TLS 1.3: сервер сразу отвечает всем — выбранный cipher, свой key_share, сертификат и Finished. Всё кроме Server Hello уже зашифровано! Рукопожатие за 1-RTT.',
        code: `TLS 1.3 Server Hello\nRandom: ${randomS}\nCipher: TLS_AES_256_GCM_SHA384\nKey Share: x25519\n--- Encrypted ---\nCertificate: CN=example.com\nCertificate Verify: ECDSA-SHA256\nFinished: HMAC verified` },
      { icon: '🔍', bg: '#e67e22', title: 'Проверка сертификата', dir: '⚙',
        detail: 'Клиент проверяет цепочку: сертификат сервера → промежуточный CA → корневой CA (встроен в ОС/браузер). Проверяется: срок действия, домен (SAN), подпись, отзыв (OCSP).',
        cert: true },
      { icon: '🔑', bg: '#9b59b6', title: 'Key Derivation (HKDF)', dir: '⚙',
        detail: 'Из ECDHE shared secret генерируются ключи через HKDF-Expand: handshake keys → traffic keys → IV. Разные ключи для клиента и сервера.',
        code: `ECDHE Shared Secret → HKDF-Extract\n→ Handshake Secret\n  → client_handshake_key (AES-256)\n  → server_handshake_key (AES-256)\n→ Master Secret\n  → client_traffic_key\n  → server_traffic_key` },
      { icon: '📤', bg: '#1abc9c', title: 'Client Finished', dir: '→',
        detail: 'Клиент отправляет Finished (HMAC от всех сообщений рукопожатия). Уже зашифровано handshake key.',
        code: 'Finished: verify_data = HMAC(handshake_secret, transcript_hash)' },
      { icon: '🔒', bg: '#2ecc71', title: 'Защищённый канал установлен', dir: '✓',
        detail: 'Все последующие данные шифруются AES-256-GCM с уникальными traffic keys. Каждый пакет имеет свой nonce (IV + sequence number). Forward Secrecy обеспечен ECDHE — даже при утечке приватного ключа прошлый трафик не расшифровать.',
        code: `Application Data ← AES-256-GCM\nKey:   client_traffic_key\nIV:    client_traffic_iv\nNonce: IV ⊕ seq_number\nAAD:   TLS record header` }
    ];

    const steps12 = [
      { icon: '📤', bg: '#3498db', title: 'Client Hello', dir: '→',
        detail: 'Клиент отправляет поддерживаемые cipher suites, TLS-версию, случайное число.',
        code: `TLS 1.2 Client Hello\nRandom: ${randomC}\nCipher Suites:\n  TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\n  TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\nSNI: example.com` },
      { icon: '📥', bg: '#2ecc71', title: 'Server Hello', dir: '←',
        detail: 'Сервер выбирает cipher suite и отправляет свой случайный номер.',
        code: `TLS 1.2 Server Hello\nRandom: ${randomS}\nCipher: TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\nSession ID: ${sessionId.slice(0, 16)}...` },
      { icon: '📜', bg: '#e67e22', title: 'Certificate + Server Key Exchange + Server Hello Done', dir: '←',
        detail: 'Сервер отправляет свой X.509 сертификат, параметры ECDHE (публичный ключ на кривой), и завершает свою часть Hello.',
        cert: true },
      { icon: '🔑', bg: '#9b59b6', title: 'Client Key Exchange + Change Cipher Spec + Finished', dir: '→',
        detail: 'Клиент генерирует свой ECDHE-ключ, вычисляет Pre-Master Secret, генерирует Master Secret и сессионные ключи. Переключается на шифрование.',
        code: `Client Key Exchange: ECDHE public key\nPre-Master Secret: ECDH(client_priv, server_pub)\nMaster Secret: PRF(pre_master, random_C + random_S)\n→ client_write_key + server_write_key + IVs` },
      { icon: '✅', bg: '#1abc9c', title: 'Change Cipher Spec + Finished', dir: '←',
        detail: 'Сервер переключается на шифрование и подтверждает Finished. 2-RTT рукопожатие завершено (TLS 1.3 быстрее — 1-RTT).',
        code: 'Server Finished: verify_data OK' },
      { icon: '🔒', bg: '#2ecc71', title: 'Защищённый канал установлен', dir: '✓',
        detail: 'Данные шифруются AES-256-GCM. TLS 1.2 требует 2 RTT (дольше чем TLS 1.3 с 1 RTT).',
        code: 'Application Data ← AES-256-GCM(session_key, nonce, plaintext)' }
    ];

    const steps = isTLS13 ? steps13 : steps12;

    result.innerHTML = `
      <div class="lab-result__title">${isTLS13 ? 'TLS 1.3' : 'TLS 1.2'} Handshake (${isTLS13 ? '1-RTT' : '2-RTT'})</div>
      <div class="lab-stats mb-12">
        <div class="lab-stat"><div class="lab-stat__value">${isTLS13 ? '1' : '2'} RTT</div><div class="lab-stat__label">Рукопожатие</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${isTLS13 ? 'AES-256-GCM' : 'AES-256-GCM'}</div><div class="lab-stat__label">Шифр</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${isTLS13 ? 'x25519' : 'ECDHE'}</div><div class="lab-stat__label">Обмен ключами</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${isTLS13 ? 'ECDSA' : 'RSA'}</div><div class="lab-stat__label">Подпись</div></div>
      </div>
      ${steps.map((s, i) => `
        <div class="tls-step" id="tlsStep-${i}">
          <div class="tls-step__icon" style="background:${s.bg}">${s.icon}</div>
          <div class="tls-step__body">
            <div class="tls-step__title">${s.dir === '→' ? '🖥→🌐 ' : s.dir === '←' ? '🌐→🖥 ' : ''}${s.title}</div>
            <div class="tls-step__detail">${s.detail}</div>
            ${s.code ? `<div class="tls-step__code">${s.code}</div>` : ''}
            ${s.cert ? `
              <div class="tls-cert">
                <div class="tls-cert__title"><span class="tls-lock">🔒</span> X.509 Сертификат</div>
                <table class="pdu-fields" style="margin:0">
                  <tr><td>Subject</td><td>CN=example.com</td></tr>
                  <tr><td>Issuer</td><td>CN=Let's Encrypt Authority X3</td></tr>
                  <tr><td>Validity</td><td>2025-01-15 — 2025-04-15</td></tr>
                  <tr><td>Public Key</td><td>ECDSA P-256 (64 bytes)</td></tr>
                  <tr><td>SAN</td><td>example.com, www.example.com</td></tr>
                  <tr><td>Signature</td><td>SHA-256 with ECDSA</td></tr>
                  <tr><td>OCSP</td><td>http://ocsp.letsencrypt.org</td></tr>
                </table>
                <div style="margin-top:6px;font-size:.68rem;color:var(--text-secondary)">Цепочка: example.com → Let's Encrypt X3 → ISRG Root X1 (корневой, встроен в ОС)</div>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    `;

    for (let i = 0; i < steps.length; i++) {
      await sleep(speed);
      const el = document.getElementById('tlsStep-' + i);
      if (el) el.classList.add('visible');
    }
    addXP(5);
  });

  /* ==================== TERMINAL ==================== */
  const termOutput = document.getElementById('termOutput');
  const termInput = document.getElementById('termInput');
  const cmdHistory = [];
  let historyIdx = -1;

  const SIM_NET = {
    hostname: 'osi-lab',
    ip: '192.168.1.100',
    mask: '255.255.255.0',
    gateway: '192.168.1.1',
    mac: 'AA:BB:CC:11:22:33',
    dns: '8.8.8.8',
    interfaces: [
      { name: 'eth0', ip: '192.168.1.100', mask: '255.255.255.0', mac: 'AA:BB:CC:11:22:33', status: 'UP', mtu: 1500, rx: 1547823, tx: 892341 },
      { name: 'wlan0', ip: '192.168.1.101', mask: '255.255.255.0', mac: 'DD:EE:FF:44:55:66', status: 'UP', mtu: 1500, rx: 328941, tx: 124567 },
      { name: 'lo', ip: '127.0.0.1', mask: '255.0.0.0', mac: '00:00:00:00:00:00', status: 'UP', mtu: 65536, rx: 45123, tx: 45123 }
    ],
    arp: [
      { ip: '192.168.1.1', mac: '00:1A:2B:3C:4D:5E', iface: 'eth0' },
      { ip: '192.168.1.50', mac: '11:22:33:AA:BB:CC', iface: 'eth0' },
      { ip: '192.168.1.200', mac: 'FF:EE:DD:CC:BB:AA', iface: 'wlan0' }
    ],
    connections: [
      { proto: 'tcp', local: '192.168.1.100:443', remote: '93.184.216.34:54321', state: 'ESTABLISHED' },
      { proto: 'tcp', local: '192.168.1.100:22', remote: '0.0.0.0:*', state: 'LISTEN' },
      { proto: 'tcp', local: '192.168.1.100:80', remote: '0.0.0.0:*', state: 'LISTEN' },
      { proto: 'tcp', local: '192.168.1.100:52341', remote: '142.250.74.78:443', state: 'ESTABLISHED' },
      { proto: 'udp', local: '192.168.1.100:53', remote: '0.0.0.0:*', state: '' },
      { proto: 'tcp', local: '192.168.1.100:49200', remote: '151.101.1.69:443', state: 'TIME_WAIT' }
    ],
    routes: [
      { dest: '0.0.0.0', mask: '0.0.0.0', gw: '192.168.1.1', iface: 'eth0', metric: 100 },
      { dest: '192.168.1.0', mask: '255.255.255.0', gw: '0.0.0.0', iface: 'eth0', metric: 0 },
      { dest: '127.0.0.0', mask: '255.0.0.0', gw: '0.0.0.0', iface: 'lo', metric: 0 }
    ],
    hosts: {
      'google.com': { ip: '142.250.74.78', hops: 8 },
      'example.com': { ip: '93.184.216.34', hops: 11 },
      'github.com': { ip: '140.82.121.4', hops: 9 },
      'ya.ru': { ip: '87.250.250.242', hops: 6 },
      'cloudflare.com': { ip: '104.16.132.229', hops: 5 },
      'localhost': { ip: '127.0.0.1', hops: 0 },
      '8.8.8.8': { ip: '8.8.8.8', hops: 7 }
    }
  };

  function resolveHost(host) {
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return { ip: host, hops: 5 + Math.floor(Math.random() * 8) };
    return SIM_NET.hosts[host] || { ip: `${100 + Math.floor(Math.random()*55)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`, hops: 6 + Math.floor(Math.random() * 8) };
  }

  function termLine(text, cls) {
    const div = document.createElement('div');
    div.className = 'term-line' + (cls ? ' term-line--' + cls : '');
    div.innerHTML = text;
    termOutput.appendChild(div);
  }

  function termScroll() { termOutput.scrollTop = termOutput.scrollHeight; }

  const TERM_COMMANDS = {
    help() {
      termLine('Доступные команды:', 'header');
      const cmds = [
        ['ping &lt;host&gt;', 'ICMP эхо-запрос к узлу'],
        ['traceroute &lt;host&gt;', 'Трассировка маршрута до узла'],
        ['nslookup &lt;host&gt;', 'DNS-запрос имени'],
        ['ifconfig', 'Показать сетевые интерфейсы'],
        ['netstat', 'Показать активные соединения'],
        ['arp', 'Показать ARP-таблицу'],
        ['route', 'Показать таблицу маршрутизации'],
        ['curl &lt;url&gt;', 'HTTP HEAD-запрос'],
        ['whois &lt;domain&gt;', 'Информация о домене'],
        ['clear', 'Очистить экран']
      ];
      cmds.forEach(c => termLine(`  <span class="term-cmd">${c[0].padEnd(25)}</span> ${c[1]}`));
      addXP(2);
    },

    clear() { termOutput.innerHTML = ''; },

    async ping(args) {
      const host = args[0];
      if (!host) { termLine('Использование: ping &lt;host&gt;', 'error'); return; }
      const resolved = resolveHost(host);
      termLine(`PING ${host} (${resolved.ip}) 56(84) bytes of data.`);
      termScroll();
      const baseLatency = resolved.hops * 3 + Math.random() * 10;
      for (let i = 0; i < 4; i++) {
        await sleep(800);
        const lat = (baseLatency + (Math.random() - 0.5) * 8).toFixed(1);
        const ttl = 64 - resolved.hops;
        termLine(`64 bytes from <span class="term-ip">${resolved.ip}</span>: icmp_seq=${i + 1} ttl=${ttl} time=<span class="term-time">${lat} ms</span>`);
        termScroll();
      }
      const avg = baseLatency.toFixed(1);
      termLine(`\n--- ${host} ping statistics ---`);
      termLine(`4 packets transmitted, 4 received, <span class="term-ok">0% packet loss</span>`);
      termLine(`rtt min/avg/max = ${(baseLatency - 4).toFixed(1)}/${avg}/${(baseLatency + 4).toFixed(1)} ms`);
      addXP(3);
    },

    async traceroute(args) {
      const host = args[0];
      if (!host) { termLine('Использование: traceroute &lt;host&gt;', 'error'); return; }
      const resolved = resolveHost(host);
      termLine(`traceroute to ${host} (${resolved.ip}), 30 hops max, 60 byte packets`);
      termScroll();
      const routers = ['gateway', 'isp-gw', 'core-1', 'core-2', 'ix-peer', 'cdn-edge', 'border-gw', 'dc-spine', 'dc-leaf', 'rack-sw', 'target'];
      for (let i = 0; i < resolved.hops; i++) {
        await sleep(600);
        const rIp = `${10 + i * 12}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${1 + Math.floor(Math.random() * 254)}`;
        const t1 = ((i + 1) * 3 + Math.random() * 5).toFixed(1);
        const t2 = ((i + 1) * 3 + Math.random() * 5).toFixed(1);
        const t3 = ((i + 1) * 3 + Math.random() * 5).toFixed(1);
        const rName = (routers[i] || 'hop-' + (i + 1)) + '.net';
        termLine(` ${String(i + 1).padStart(2)}  ${rName} (<span class="term-ip">${rIp}</span>)  <span class="term-time">${t1} ms  ${t2} ms  ${t3} ms</span>`);
        termScroll();
      }
      await sleep(600);
      const ft = ((resolved.hops) * 3 + Math.random() * 3).toFixed(1);
      termLine(` ${String(resolved.hops + 1).padStart(2)}  ${host} (<span class="term-ip">${resolved.ip}</span>)  <span class="term-time">${ft} ms  ${ft} ms  ${ft} ms</span>`);
      addXP(3);
    },

    nslookup(args) {
      const host = args[0];
      if (!host) { termLine('Использование: nslookup &lt;host&gt;', 'error'); return; }
      const resolved = resolveHost(host);
      termLine('Server:   8.8.8.8');
      termLine('Address:  8.8.8.8#53\n');
      termLine('Non-authoritative answer:');
      termLine(`Name:     ${host}`);
      termLine(`Address:  <span class="term-ip">${resolved.ip}</span>`);
      addXP(2);
    },

    ifconfig() {
      SIM_NET.interfaces.forEach(iface => {
        termLine(`<span class="term-cmd">${iface.name}</span>: flags=4163&lt;${iface.status},BROADCAST,MULTICAST&gt;  mtu ${iface.mtu}`);
        termLine(`        inet <span class="term-ip">${iface.ip}</span>  netmask ${iface.mask}`);
        termLine(`        ether ${iface.mac}`);
        termLine(`        RX packets ${iface.rx}  TX packets ${iface.tx}`);
        termLine('');
      });
      addXP(2);
    },

    netstat() {
      termLine('Proto  Local Address            Foreign Address          State', 'header');
      SIM_NET.connections.forEach(c => {
        const stateColor = c.state === 'ESTABLISHED' ? 'term-ok' : c.state === 'LISTEN' ? 'term-time' : '';
        termLine(`${c.proto.padEnd(7)}${c.local.padEnd(25)}${c.remote.padEnd(25)}<span class="${stateColor}">${c.state}</span>`);
      });
      addXP(2);
    },

    arp() {
      termLine('Address          HWtype  HWaddress           Iface', 'header');
      SIM_NET.arp.forEach(a => {
        termLine(`<span class="term-ip">${a.ip.padEnd(17)}</span>ether   ${a.mac}   ${a.iface}`);
      });
      addXP(2);
    },

    route() {
      termLine('Destination      Gateway          Genmask          Iface    Metric', 'header');
      SIM_NET.routes.forEach(r => {
        termLine(`${r.dest.padEnd(17)}${r.gw.padEnd(17)}${r.mask.padEnd(17)}${r.iface.padEnd(9)}${r.metric}`);
      });
      addXP(2);
    },

    curl(args) {
      const url = args[0];
      if (!url) { termLine('Использование: curl &lt;url&gt;', 'error'); return; }
      const host = url.replace(/^https?:\/\//, '').split('/')[0];
      const resolved = resolveHost(host);
      termLine(`> GET / HTTP/1.1`);
      termLine(`> Host: ${host}`);
      termLine(`> User-Agent: curl/7.88.1`);
      termLine(`> Accept: */*`);
      termLine('');
      termLine('<span class="term-ok">HTTP/1.1 200 OK</span>');
      termLine(`Server: nginx/1.24.0`);
      termLine(`Date: ${new Date().toUTCString()}`);
      termLine(`Content-Type: text/html; charset=UTF-8`);
      termLine(`Content-Length: 1256`);
      termLine(`Connection: keep-alive`);
      termLine(`X-Served-By: cache-${resolved.ip.split('.')[0]}`);
      termLine(`Cache-Control: max-age=604800`);
      addXP(2);
    },

    whois(args) {
      const domain = args[0];
      if (!domain) { termLine('Использование: whois &lt;domain&gt;', 'error'); return; }
      const resolved = resolveHost(domain);
      termLine(`Domain Name: ${domain.toUpperCase()}`, 'header');
      termLine(`Registry Domain ID: D${Math.floor(Math.random() * 9e8)}`);
      termLine(`Registrar: Example Registrar, Inc.`);
      termLine(`Created: 2005-08-13T04:16:17Z`);
      termLine(`Updated: 2024-08-14T06:35:09Z`);
      termLine(`Expires: 2025-08-13T04:16:17Z`);
      termLine(`Status: clientDeleteProhibited`);
      termLine(`Name Server: ns1.${domain}`);
      termLine(`Name Server: ns2.${domain}`);
      termLine(`IP Address: <span class="term-ip">${resolved.ip}</span>`);
      addXP(2);
    }
  };

  TERM_COMMANDS.tracert = TERM_COMMANDS.traceroute;
  TERM_COMMANDS.dig = TERM_COMMANDS.nslookup;
  TERM_COMMANDS['ip'] = function(args) {
    if (args[0] === 'addr' || args[0] === 'a') TERM_COMMANDS.ifconfig();
    else if (args[0] === 'route' || args[0] === 'r') TERM_COMMANDS.route();
    else termLine('Использование: ip addr | ip route', 'error');
  };

  async function executeCommand(input) {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    termLine(`<span class="term-line--cmd">root@osi-lab:~$ ${input.replace(/</g, '&lt;')}</span>`);

    if (!cmd) { termScroll(); return; }

    if (TERM_COMMANDS[cmd]) {
      await TERM_COMMANDS[cmd](args);
    } else {
      termLine(`bash: ${cmd}: command not found. Введите <span class="term-cmd">help</span> для списка команд`, 'error');
    }
    termLine('');
    termScroll();
  }

  termInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && termInput.value.trim()) {
      const val = termInput.value;
      cmdHistory.unshift(val);
      historyIdx = -1;
      termInput.value = '';
      await executeCommand(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIdx < cmdHistory.length - 1) {
        historyIdx++;
        termInput.value = cmdHistory[historyIdx];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        historyIdx--;
        termInput.value = cmdHistory[historyIdx];
      } else {
        historyIdx = -1;
        termInput.value = '';
      }
    }
  });

  document.getElementById('section-terminal').addEventListener('click', (e) => {
    if (e.target.closest('.terminal__input-row') || e.target === termInput) return;
    if (e.target.closest('.term-quick')) return;
    termInput.focus();
  });

  /* Terminal quick-command panel */
  const TERM_CMD_INFO = [
    { cmd: 'ping', label: 'ping', desc: 'Отправляет ICMP Echo Request и измеряет время ответа (RTT). Проверяет доступность узла.',
      params: [{ label: 'Хост', id: 'host', type: 'select', options: ['google.com','ya.ru','github.com','8.8.8.8','example.com','cloudflare.com'] }],
      flags: '<code>-c N</code> кол-во пакетов &nbsp; <code>-i N</code> интервал &nbsp; <code>-t N</code> TTL &nbsp; <code>-s N</code> размер пакета',
      build: (p) => `ping ${p.host}` },
    { cmd: 'traceroute', label: 'traceroute', desc: 'Показывает маршрут пакета до узла — каждый промежуточный маршрутизатор (хоп) и задержку.',
      params: [{ label: 'Хост', id: 'host', type: 'select', options: ['google.com','ya.ru','github.com','8.8.8.8','example.com'] }],
      flags: '<code>-m N</code> макс. хопов &nbsp; <code>-w N</code> таймаут &nbsp; <code>-I</code> использовать ICMP',
      build: (p) => `traceroute ${p.host}` },
    { cmd: 'nslookup', label: 'nslookup', desc: 'DNS-запрос: преобразует доменное имя в IP-адрес через указанный DNS-сервер.',
      params: [{ label: 'Домен', id: 'host', type: 'select', options: ['google.com','ya.ru','github.com','example.com','cloudflare.com'] }],
      flags: '<code>-type=MX</code> почтовые записи &nbsp; <code>-type=NS</code> серверы имён &nbsp; <code>-type=AAAA</code> IPv6',
      build: (p) => `nslookup ${p.host}` },
    { cmd: 'curl', label: 'curl', desc: 'HTTP-клиент. Отправляет запрос и показывает заголовки ответа сервера.',
      params: [{ label: 'URL', id: 'host', type: 'input', placeholder: 'example.com' }],
      flags: '<code>-I</code> только заголовки &nbsp; <code>-v</code> подробно &nbsp; <code>-X POST</code> метод &nbsp; <code>-H</code> заголовок',
      build: (p) => `curl ${p.host || 'example.com'}` },
    { cmd: 'ifconfig', label: 'ifconfig', desc: 'Показывает сетевые интерфейсы: IP, MAC-адрес, MTU, счётчики пакетов.',
      params: [], flags: '<code>eth0 up/down</code> включить/выключить &nbsp; <code>eth0 192.168.1.1</code> назначить IP', build: () => 'ifconfig' },
    { cmd: 'netstat', label: 'netstat', desc: 'Показывает активные сетевые соединения, порты и их состояния.',
      params: [], flags: '<code>-t</code> TCP &nbsp; <code>-u</code> UDP &nbsp; <code>-l</code> только LISTEN &nbsp; <code>-p</code> PID процесса &nbsp; <code>-n</code> без DNS', build: () => 'netstat' },
    { cmd: 'arp', label: 'arp', desc: 'ARP-таблица: соответствие IP-адресов и MAC-адресов в локальной сети.',
      params: [], flags: '<code>-d IP</code> удалить запись &nbsp; <code>-s IP MAC</code> добавить статическую', build: () => 'arp' },
    { cmd: 'route', label: 'route', desc: 'Таблица маршрутизации: куда отправляются пакеты для разных сетей назначения.',
      params: [], flags: '<code>add -net</code> добавить маршрут &nbsp; <code>del -net</code> удалить &nbsp; <code>-n</code> без DNS', build: () => 'route' },
    { cmd: 'whois', label: 'whois', desc: 'Информация о владельце домена: регистратор, даты, DNS-серверы.',
      params: [{ label: 'Домен', id: 'host', type: 'select', options: ['google.com','ya.ru','github.com','example.com'] }],
      flags: '', build: (p) => `whois ${p.host}` }
  ];

  let activeTermCmd = null;

  function renderTermQuickPanel() {
    const btnsEl = document.getElementById('termCmdButtons');
    btnsEl.innerHTML = TERM_CMD_INFO.map(c => `<button class="term-quick__btn" data-qcmd="${c.cmd}">${c.label}</button>`).join('');

    btnsEl.querySelectorAll('.term-quick__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = TERM_CMD_INFO.find(c => c.cmd === btn.dataset.qcmd);
        if (activeTermCmd === cmd.cmd) {
          activeTermCmd = null;
          document.getElementById('termParamsArea').classList.remove('open');
          btnsEl.querySelectorAll('.term-quick__btn').forEach(b => b.classList.remove('active'));
          return;
        }
        activeTermCmd = cmd.cmd;
        btnsEl.querySelectorAll('.term-quick__btn').forEach(b => b.classList.toggle('active', b.dataset.qcmd === cmd.cmd));

        const area = document.getElementById('termParamsArea');
        area.classList.add('open');
        area.innerHTML = `
          <div class="term-quick__desc">${cmd.desc}</div>
          ${cmd.params.map(p => `
            <div class="term-param-row">
              <label>${p.label}</label>
              ${p.type === 'select'
                ? `<select id="termParam-${p.id}">${p.options.map(o => `<option>${o}</option>`).join('')}</select>`
                : `<input type="text" id="termParam-${p.id}" placeholder="${p.placeholder || ''}" value="${p.placeholder || ''}">`
              }
            </div>
          `).join('')}
          ${cmd.flags ? `<div class="term-flags"><strong>Флаги:</strong> ${cmd.flags}</div>` : ''}
          <button class="term-quick__run" id="termQuickRun">▶ Выполнить ${cmd.label}</button>
        `;

        area.querySelector('#termQuickRun').addEventListener('click', () => {
          const params = {};
          cmd.params.forEach(p => {
            const el = document.getElementById('termParam-' + p.id);
            if (el) params[p.id] = el.value;
          });
          const fullCmd = cmd.build(params);
          termInput.value = '';
          executeCommand(fullCmd);
        });
      });
    });
  }

  renderTermQuickPanel();

})();
