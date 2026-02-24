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

  /* ==================== NETWORK PATH BUILDER ==================== */
  let nbPath = [
    { type: 'device', id: 'pc' },
    { type: 'link', id: 'wifi5' },
    { type: 'device', id: 'router' },
    { type: 'link', id: 'cat5e' },
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
    return mbps + ' Мбит/с';
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
        const ch = CHANNEL_TYPES.find(c => c.id === item.id);
        html += `<div class="nb-link" id="nbLink-${i}" data-idx="${i}">
          <div class="nb-link__line" style="background:${ch.color}" id="nbLine-${i}"></div>
          <select class="nb-link__select" data-idx="${i}">
            ${CHANNEL_TYPES.map(c => `<option value="${c.id}"${c.id === item.id ? ' selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
          </select>
          <div class="nb-link__speed">${formatSpeed(ch.speed)}</div>
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
        nbPath[parseInt(sel.dataset.idx)].id = sel.value;
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
      { type: 'link', id: 'cat5e' }
    );
    renderNBPath();
  });

  document.getElementById('nbSend').addEventListener('click', async () => {
    const result = document.getElementById('nbResult');
    let totalLatency = 0;
    let bottleneck = Infinity;
    let bottleneckName = '';
    const hops = [];
    const usedCh = new Set();

    for (let i = 0; i < nbPath.length; i++) {
      const item = nbPath[i];
      if (item.type === 'link') {
        const ch = CHANNEL_TYPES.find(c => c.id === item.id);
        totalLatency += ch.latency;
        usedCh.add(ch.id);
        if (ch.speed < bottleneck) { bottleneck = ch.speed; bottleneckName = ch.name; }
        hops.push({ icon: ch.icon, name: ch.name, latency: ch.latency, speed: ch.speed, type: 'link', medium: ch.medium, idx: i });
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

    const throughput = bottleneck;
    const transferTime = (1500 * 8 / (bottleneck * 1e6) * 1000).toFixed(4);

    result.innerHTML = `
      <div class="lab-result__title">Результат передачи</div>
      <div class="lab-stats">
        <div class="lab-stat">
          <div class="lab-stat__value">${totalLatency.toFixed(2)} мс</div>
          <div class="lab-stat__label">Общая задержка</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${formatSpeed(throughput)}</div>
          <div class="lab-stat__label">Пропускная способность</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${hops.filter(h => h.type === 'device').length}</div>
          <div class="lab-stat__label">Устройств</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${hops.filter(h => h.type === 'link').length}</div>
          <div class="lab-stat__label">Каналов</div>
        </div>
      </div>
      <div class="mt-16">
        <div class="lab-result__title">Путь пакета</div>
        ${hops.map((h, i) => `
          <div class="nb-result-row" id="nbRes-${i}">
            <div class="nb-result-row__icon">${h.icon}</div>
            <div class="nb-result-row__text">
              <strong>${h.name}</strong>
              ${h.type === 'link' ? ` — ${formatSpeed(h.speed)}, ${h.medium === 'copper' ? 'медь' : h.medium === 'fiber' ? 'оптоволокно' : 'радио'}` : ''}
              ${h.type === 'device' && h.layer ? ` — L${h.layer}` : ''}
            </div>
            <div class="nb-result-row__val">${h.latency > 0 ? '+' + h.latency + ' мс' : '—'}</div>
          </div>
        `).join('')}
      </div>
      <div class="card mt-16" style="font-size:.82rem;line-height:1.6">
        <strong>Узкое место:</strong> ${bottleneckName} (${formatSpeed(bottleneck)}). Это самый медленный канал, который ограничивает общую пропускную способность маршрута.
        Передача одного кадра Ethernet (1500 байт) через этот канал занимает ${transferTime} мс.
        ${totalLatency > 50 ? '<br><br><strong>Высокая задержка!</strong> Для интерактивных приложений (VoIP, игры) желательна задержка < 50 мс.' : ''}
      </div>
    `;

    document.querySelectorAll('.nb-device, .nb-link__line').forEach(el => el.classList.remove('nb-active'));

    for (let i = 0; i < hops.length; i++) {
      await sleep(300);
      const row = document.getElementById('nbRes-' + i);
      if (row) row.classList.add('visible');

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
})();
