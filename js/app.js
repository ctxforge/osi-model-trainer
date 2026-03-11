(function () {
  'use strict';

  /* ==================== SHARED STATE ==================== */
  let sgChannelId = 'none';
  let sgChDistance = 50;
  let sgImportedSamples = null;
  let sgNoiseLevel = 0;
  let sgSpectrumScale = 60;
  let sgSpectrumWindow = 'rect';

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
  const sections = document.querySelectorAll('.section');
  const navCards = document.querySelectorAll('.nav-card');
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  const menuItems = document.querySelectorAll('.side-menu__item');

  function navigateTo(sectionId) {
    sections.forEach(s => s.classList.remove('active'));
    menuItems.forEach(b => b.classList.remove('active'));
    const target = document.getElementById('section-' + sectionId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    menuItems.forEach(b => {
      if (b.dataset.section === sectionId) b.classList.add('active');
    });
    closeMenu();
  }

  function openMenu() { sideMenu.classList.add('open'); menuOverlay.classList.add('open'); }
  function closeMenu() { sideMenu.classList.remove('open'); menuOverlay.classList.remove('open'); }

  document.getElementById('hamburgerBtn').addEventListener('click', openMenu);
  menuOverlay.addEventListener('click', closeMenu);
  menuItems.forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.section)));
  navCards.forEach(card => card.addEventListener('click', () => navigateTo(card.dataset.nav)));

  // Physics lab tab switching
  function updateChChannelInfo() {
    const info = document.getElementById('chChannelInfo');
    if (!info) return;
    if (sgChannelId === 'none') {
      info.innerHTML = '<div style="color:var(--l7);font-size:.82rem;font-weight:700">⚠ Канал не выбран. Перейдите на вкладку «Генератор + Канал» и выберите канал связи в блоке ⑤</div>';
    } else {
      const ch = CHANNEL_TYPES.find(c => c.id === sgChannelId);
      const phys = calcChannelPhysics(ch, sgChDistance, 'normal');
      const q = phys.snr > 30 ? '🟢 Отличное' : phys.snr > 20 ? '🟡 Хорошее' : phys.snr > 10 ? '🟠 Среднее' : phys.snr > 0 ? '🔴 Плохое' : '⚫ Нет связи';
      info.innerHTML = `<div class="study-section__title">Канал из генератора</div>
        <div style="font-size:.78rem;line-height:1.7">
          <strong>${ch.icon} ${ch.name}</strong> — расстояние: ${sgChDistance >= 1000 ? (sgChDistance/1000).toFixed(1)+' км' : sgChDistance+' м'}<br>
          ${ch.medium === 'radio' ? `FSPL: ${phys.attenTotal.toFixed(1)} дБ (обратный квадрат расстояния)` : `Затухание: ${phys.attenTotal.toFixed(1)} дБ`} | SNR: ${phys.snr.toFixed(1)} дБ ${q}<br>
          ${ch.freqGHz ? `Несущая: ${ch.freqGHz} ГГц | TX: ${ch.txPowerDbm} дБм | RX антенна: +${ch.rxAntennaGain || 0} дБ<br>` : ''}
          Помехи: ${ch.interference}
        </div>`;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target.id === 'physTabGen') {
      document.getElementById('physGenPane').style.display = 'block';
      document.getElementById('physChanPane').style.display = 'none';
      document.getElementById('physTabGen').classList.add('active');
      document.getElementById('physTabChan').classList.remove('active');
    } else if (e.target.id === 'physTabChan') {
      document.getElementById('physGenPane').style.display = 'none';
      document.getElementById('physChanPane').style.display = 'block';
      document.getElementById('physTabGen').classList.remove('active');
      document.getElementById('physTabChan').classList.add('active');
      updateChChannelInfo();
    }
  });

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
            <div class="study-section__title">PDU — ${layer.pdu}</div>
            ${layer.pduFields ? `<div class="pdu-diagram" style="height:auto;flex-wrap:wrap;margin-bottom:8px">
              ${layer.pduFields.map(f => `<div class="pdu-diagram__seg" style="flex:${f.size === 'N' || f.size.includes('1500') ? 4 : 1};background:${f.color};padding:6px 4px;min-height:36px;flex-direction:column;gap:1px">
                <span>${f.name}</span>
                ${f.size ? `<span style="font-size:.5rem;opacity:.7">${f.size}</span>` : ''}
              </div>`).join('')}
            </div>` : ''}
          </div>
          <div class="study-section">
            <div class="study-section__title">Инкапсуляция</div>
            <div class="study-section__text">${layer.encapsulation}</div>
          </div>
          <div class="study-section">
            <div class="study-section__title">Аналогия</div>
            <div class="analogy-box" style="border-color:${layer.color}">${layer.analogy}</div>
          </div>
          ${layer.examples && layer.examples.length ? `
          <div class="study-section">
            <div class="study-section__title">Примеры — как это выглядит</div>
            ${layer.examples.map(ex => `
              <div style="margin-bottom:8px">
                <div style="font-size:.78rem;font-weight:700;margin-bottom:4px;color:${layer.color}">${ex.name}</div>
                <div class="pdu-appdata" style="font-size:.68rem;line-height:1.5;max-height:none">${ex.code}</div>
              </div>
            `).join('')}
          </div>` : ''}
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
  let simUploadedFile = null;
  let simUploadedBytes = null;
  let simUploadedImg = null;

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

    const useFile = simUploadedFile && simUploadedBytes && simUploadedBytes.length > 0;
    const fileBytes = useFile ? simUploadedBytes.slice(0, 512) : null;
    const contentType = useFile ? simUploadedFile.type : 'text/plain';
    const contentLen = useFile ? simUploadedFile.size : message.length;
    const bodyForHttp = useFile ? `[binary data: ${simUploadedFile.name}]` : message;

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
          ${useFile && simUploadedImg ? `<img src="${simUploadedImg}" style="max-width:100%;max-height:80px;border-radius:6px;margin-bottom:8px;display:block">` : ''}
          <div class="pdu-appdata">${httpReq.replace(/\r\n/g, '\n').replace(/</g, '&lt;')}</div>
          <table class="pdu-fields mt-12">
            <tr><td>Метод</td><td>POST /upload</td></tr>
            <tr><td>Host</td><td>${dstIp}</td></tr>
            <tr><td>Content-Type</td><td>${contentType}</td></tr>
            <tr><td>Content-Length</td><td>${contentLen.toLocaleString()} байт</td></tr>
            ${useFile ? `<tr><td>Файл</td><td>${simUploadedFile.name}</td></tr>` : `<tr><td>Тело</td><td>${message}</td></tr>`}
          </table>
          ${useFile ? `<div class="pdu-note">Всего пакетов для передачи файла: ${Math.ceil(contentLen / 1460)} TCP-сегментов (показан первый)</div>` : ''}`,
        hex: appBytes
      },
      {
        num: 6, name: getL(6).name, nameEn: 'Presentation', color: getL(6).color,
        pdu: 'Данные', totalSize: appBytes.length,
        diagramSegs: [{ label: `UTF-8 данные (${appBytes.length} Б)`, pct: 100, color: getL(6).color }],
        body: `
          <div class="pdu-note">${useFile ? `Файл ${simUploadedFile.name} — бинарные данные (${contentType}). Первые ${Math.min(msgRawBytes.length, 16)} байт:` : 'Данные кодируются в UTF-8. Каждый символ сообщения в байтах:'}</div>
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

  document.getElementById('simBuild').addEventListener('click', () => {
    buildFullPacket();
    unlockAchievement('first_encap');
    addXP(5);
  });

  /* ==================== LAB DATA SOURCE ==================== */
  const labData = {
    type: 'text',
    text: 'Привет, OSI!',
    bytes: Array.from(new TextEncoder().encode('Привет, OSI!')),
    fileName: null,
    fileType: null,
    imgPreview: null,
    size: 0
  };
  labData.size = labData.bytes.length;

  const labDataListeners = [];
  function onLabDataChange(fn) { labDataListeners.push(fn); }

  function notifyLabDataChange() {
    labDataListeners.forEach(fn => { try { fn(); } catch(e) {} });
  }

  function updateLabData() {
    const sizeEl = document.getElementById('labDataSize');
    const previewEl = document.getElementById('labDataPreview');
    if (!sizeEl) return;

    const s = labData.size;
    sizeEl.textContent = s >= 1048576 ? (s / 1048576).toFixed(1) + ' МБ' : s >= 1024 ? (s / 1024).toFixed(1) + ' КБ' : s + ' Б';

    const hexPreview = labData.bytes.slice(0, 24).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    let preview = `<div class="lab-data-panel__hex">${hexPreview}${labData.bytes.length > 24 ? ' …' : ''}</div>`;

    if (labData.type === 'file' && labData.imgPreview) {
      preview = `<div class="lab-data-panel__preview">
        <img src="${labData.imgPreview}">
        <div class="lab-data-panel__preview-info">${labData.fileName}<br>${labData.fileType}</div>
      </div>` + preview;
    } else if (labData.type === 'file') {
      preview = `<div class="lab-data-panel__preview">
        <span style="font-size:1.3rem">📄</span>
        <div class="lab-data-panel__preview-info">${labData.fileName}<br>${labData.fileType}</div>
      </div>` + preview;
    }

    previewEl.innerHTML = preview;

    simUploadedBytes = labData.bytes;
    simUploadedFile = labData.fileName ? { name: labData.fileName, type: labData.fileType, size: labData.size } : null;
    simUploadedImg = labData.imgPreview;
    notifyLabDataChange();
  }

  document.getElementById('labDataText').addEventListener('input', (e) => {
    labData.type = 'text';
    labData.text = e.target.value;
    labData.bytes = Array.from(new TextEncoder().encode(e.target.value));
    labData.size = labData.bytes.length;
    labData.fileName = null; labData.fileType = null; labData.imgPreview = null;
    updateLabData();
  });

  document.getElementById('labDataFileBtn').addEventListener('click', () => {
    document.getElementById('labDataFileInput').click();
  });

  document.getElementById('labDataFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 50 * 1024 * 1024) return;
    labData.type = 'file';
    labData.fileName = file.name;
    labData.fileType = file.type;
    labData.size = file.size;

    if (file.type.startsWith('image/')) {
      const imgR = new FileReader();
      imgR.onload = () => { labData.imgPreview = imgR.result; updateLabData(); };
      imgR.readAsDataURL(file);
    } else {
      labData.imgPreview = null;
    }

    const reader = new FileReader();
    reader.onload = () => {
      labData.bytes = Array.from(new Uint8Array(reader.result)).slice(0, 65536);
      labData.text = labData.fileName;
      document.getElementById('labDataText').value = labData.fileName;
      updateLabData();
    };
    reader.readAsArrayBuffer(file);
  });

  document.getElementById('labDataRandom').addEventListener('click', () => {
    const len = 64 + Math.floor(Math.random() * 200);
    const bytes = [];
    for (let i = 0; i < len; i++) bytes.push(Math.floor(Math.random() * 256));
    labData.type = 'random';
    labData.text = `[${len} случайных байт]`;
    labData.bytes = bytes;
    labData.size = len;
    labData.fileName = null; labData.fileType = null; labData.imgPreview = null;
    document.getElementById('labDataText').value = labData.text;
    updateLabData();
  });

  updateLabData();

  function getLabBits(maxBytes) {
    const b = labData.bytes.slice(0, maxBytes || 4);
    const bits = [];
    b.forEach(byte => { for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1); });
    return bits;
  }

  function getLabText() { return labData.text || 'Hello'; }
  function getLabBytes() { return labData.bytes; }

  /* ==================== LAB ==================== */
  const labState = {};

  let activeLabGroup = 'overview';

  function buildLabTabs() {
    const container = document.getElementById('labTabs');
    const group = LAB_GROUPS.find(g => g.id === activeLabGroup) || LAB_GROUPS[0];

    let html = `<select class="ch-phy-select" id="labGroupSelect" style="margin-bottom:8px;font-weight:700">
      ${LAB_GROUPS.map(g => `<option value="${g.id}"${g.id === activeLabGroup ? ' selected' : ''}>${g.name} — ${g.desc}</option>`).join('')}
    </select>`;
    html += '<div style="display:flex;gap:5px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px">';
    group.experiments.forEach((key, i) => {
      const exp = LAB_EXPERIMENTS[key];
      if (!exp) return;
      html += `<button class="lab-tab${i === 0 ? ' active' : ''}" data-lab="${key}">${exp.icon} ${exp.title}</button>`;
    });
    html += '</div>';
    container.innerHTML = html;

    container.querySelector('#labGroupSelect').addEventListener('change', (e) => {
      activeLabGroup = e.target.value;
      buildLabTabs();
      const grp = LAB_GROUPS.find(g => g.id === activeLabGroup);
      if (grp && grp.experiments[0]) switchLabTab(grp.experiments[0]);
    });

    container.querySelectorAll('[data-lab]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-lab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        switchLabTab(btn.dataset.lab);
      });
    });

    if (group.experiments[0]) switchLabTab(group.experiments[0]);
  }

  function switchLabTab(key) {
    document.querySelectorAll('.lab-tab[data-lab]').forEach(t => t.classList.toggle('active', t.dataset.lab === key));
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
    const mss = 1460;
    const dataBytes = getLabBytes();
    const dataSize = labData.size;
    const totalSegments = Math.max(Math.ceil(dataSize / mss), 1);
    const segments = [];
    let seqBase = 1000 + Math.floor(Math.random() * 5000);
    let delivered = 0, lost = 0, retransmitted = 0;

    for (let i = 0; i < totalSegments; i++) {
      const offset = i * mss;
      const segSize = Math.min(mss, dataSize - offset);
      const segBytes = dataBytes.slice(offset, offset + segSize);
      const hexPreview = segBytes.slice(0, 12).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
      const seq = seqBase + offset;
      const isLost = Math.random() * 100 < s.packetLoss;

      if (isLost) {
        lost++;
        segments.push({ id: i + 1, status: 'lost', seq, size: segSize, hex: hexPreview, offset });
        if (isTCP) {
          retransmitted++;
          segments.push({ id: i + 1, status: 'retransmit', seq, size: segSize, hex: hexPreview, offset });
          delivered++;
        }
      } else {
        delivered++;
        segments.push({ id: i + 1, status: 'ok', seq, size: segSize, hex: hexPreview, offset });
      }
      if (isTCP) {
        segments.push({ id: i + 1, status: 'ack', seq: seq + segSize, size: 0, hex: '', offset });
      }
    }

    const totalTime = (totalSegments * (s.latency / 2) + retransmitted * s.latency).toFixed(0);
    const result = document.getElementById('labResult-packetTransmission');

    result.innerHTML = `
      <div class="lab-result__title">Передача «${labData.type === 'file' ? labData.fileName : labData.text.slice(0, 20)}» (${isTCP ? 'TCP' : 'UDP'})</div>
      <div class="lab-stats">
        <div class="lab-stat"><div class="lab-stat__value">${dataSize}</div><div class="lab-stat__label">Байт данных</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${totalSegments}</div><div class="lab-stat__label">Сегментов</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${delivered}/${totalSegments}</div><div class="lab-stat__label">Доставлено</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${totalTime} мс</div><div class="lab-stat__label">Время</div></div>
      </div>
      <div class="lab-packets">
        ${segments.map((seg, idx) => {
          if (seg.status === 'ack') {
            return `<div class="lab-packet" style="animation:slideIn .3s ease ${idx * 0.04}s both;border-left:3px solid var(--l3)">
              <div class="lab-packet__status lab-packet__status--ok"></div>
              <div class="lab-packet__label" style="color:var(--text-secondary);font-style:italic">← ACK ${seg.seq}</div>
            </div>`;
          }
          const stLabel = seg.status === 'ok' ? '✓ Доставлен' : seg.status === 'lost' ? '✗ Потерян' : '↻ Повтор';
          const stColor = seg.status === 'ok' ? 'var(--l4)' : seg.status === 'lost' ? 'var(--l7)' : 'var(--l5)';
          return `<div class="lab-packet" style="animation:slideIn .3s ease ${idx * 0.04}s both;border-left:3px solid ${stColor}">
            <div class="lab-packet__status lab-packet__status--${seg.status}"></div>
            <div class="lab-packet__label">
              <strong>Seg #${seg.id}</strong> ${stLabel}<br>
              <span style="font-size:.65rem;color:var(--text-secondary)">Seq=${seg.seq} Len=${seg.size}Б [${seg.offset}:${seg.offset + seg.size}]</span><br>
              <span style="font-size:.62rem;font-family:monospace;color:var(--accent)">${seg.hex}${seg.size > 12 ? ' …' : ''}</span>
            </div>
            <div class="lab-packet__size">${seg.size} Б</div>
          </div>`;
        }).join('')}
      </div>
      <div class="card mt-16" style="font-size:.82rem;line-height:1.6">
        <strong>Нарезка:</strong> Ваше сообщение (${dataSize} байт) разрезано на ${totalSegments} TCP-сегментов по ${mss} байт (MSS). 
        Каждый сегмент получает Sequence Number = номер первого байта в потоке.
        ${isTCP ? `<br><strong>TCP:</strong> Потеряно ${lost}, повторено ${retransmitted}. Каждый сегмент подтверждается ACK.` : `<br><strong>UDP:</strong> Потеряно ${lost} навсегда. Нет ACK, нет повторов.`}
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

  // Lab: IP Calculator
  document.getElementById('labRun-ipCalc').addEventListener('click', () => {
    unlockAchievement('ip_calc');
    addXP(3);
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

    let chPhyAnimId = null;

    function drawSignal(canvas, txAmp, rxAmp, noiseAmp, color) {
      if (chPhyAnimId) cancelAnimationFrame(chPhyAnimId);
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx0 = canvas.getContext('2d');
      ctx0.scale(dpr, dpr);
      const w = rect.width, h = rect.height;
      const midTx = h * 0.28, midRx = h * 0.72;

      const bits = getLabBits(4);

      function frame(now) {
        const offset = ((now || 0) / 60) % (w);
        const ctx = ctx0;
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = '#2a2e3d'; ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#6c7a96'; ctx.font = '10px sans-serif';
        ctx.fillText('TX (передано)', 4, 14);
        ctx.fillText('RX (получено)', 4, h * 0.5 + 14);

        const bitWidth = w / bits.length;

        ctx.beginPath(); ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2;
        for (let x = 0; x < w; x++) {
          const rx = x + offset;
          const bitIdx = ((Math.floor(rx / bitWidth) % bits.length) + bits.length) % bits.length;
          const inBit = (rx % bitWidth) / bitWidth;
          let val = bits[bitIdx] ? 1 : -1;
          const edge = 0.08;
          if (inBit < edge) val *= inBit / edge;
          const y = midTx - val * txAmp * (h * 0.2);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.5;
        for (let x = 0; x < w; x++) {
          const rx = x + offset;
          const bitIdx = ((Math.floor(rx / bitWidth) % bits.length) + bits.length) % bits.length;
          const inBit = (rx % bitWidth) / bitWidth;
          let val = bits[bitIdx] ? 1 : -1;
          const edge = 0.08;
          if (inBit < edge) val *= inBit / edge;
          const signal = val * rxAmp * (h * 0.2);
          const noise = (Math.random() - 0.5) * 2 * noiseAmp * (h * 0.2);
          const y = midRx - signal - noise;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        if (rxAmp > 0.05) {
          ctx.strokeStyle = '#e74c3c44'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
          ctx.beginPath(); ctx.moveTo(0, midRx); ctx.lineTo(w, midRx); ctx.stroke(); ctx.setLineDash([]);
        }

        ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.arc(w * 0.85, midTx, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(w * 0.85, midRx, 3, 0, Math.PI * 2); ctx.fill();

        chPhyAnimId = requestAnimationFrame(frame);
      }
      chPhyAnimId = requestAnimationFrame(frame);
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
        <input type="text" class="enc-input" id="chPhyMsg" value="${chState.msg || 'Hi'}" placeholder="Сообщение для визуализации сигнала...">
        ${simUploadedFile && simUploadedBytes?.length ? `<div style="font-size:.72rem;color:var(--l4);margin:-6px 0 8px">📎 Файл: ${simUploadedFile.name} — биты файла отображаются на графике</div>` : ''}

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

      container.querySelector('#chPhyMsg').addEventListener('input', (e) => {
        chState.msg = e.target.value;
        render();
      });

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
    onLabDataChange(() => { if (document.getElementById('lab-channelPhysics')?.classList.contains('active')) render(); });
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
    let attenTotal;
    const envPenalty = env === 'harsh' ? (ch.medium === 'radio' ? 18 : ch.medium === 'fiber' ? 5 : 10) : env === 'ideal' ? 0 : (ch.medium === 'radio' ? 5 : ch.medium === 'fiber' ? 1 : 3);

    if (ch.medium === 'radio' && ch.freqGHz) {
      const distM = Math.max(dist, 1);
      const fspl = 20 * Math.log10(distM) + 20 * Math.log10(ch.freqGHz * 1e9) - 147.55;
      const rxPowerDbm = ch.txPowerDbm - fspl + (ch.rxAntennaGain || 0) - envPenalty;
      const thermalNoise = -174 + 10 * Math.log10(ch.bandwidthMHz * 1e6) + (ch.noiseFigure || 6);
      const snrCalc = rxPowerDbm - thermalNoise;
      const snr = Math.max(snrCalc, -5);
      const snrLinear = Math.pow(10, snr / 10);
      attenTotal = fspl + envPenalty;
      const shannonMbps = ch.bandwidthMHz * Math.log2(1 + Math.max(snrLinear, 0));
      const effectiveSpeed = Math.min(ch.speed, shannonMbps) * (snr > 0 ? 1 : 0);
      const propagationDelay = (distM / (ch.propagation * 299792458)) * 1000;
      const totalDelay = ch.latency + propagationDelay;
      let ber; if (snr > 30) ber = 1e-12; else if (snr > 20) ber = 1e-9; else if (snr > 15) ber = 1e-6; else if (snr > 10) ber = 1e-4; else if (snr > 5) ber = 1e-2; else ber = 0.5;
      let quality; if (snr > 30) quality = 'excellent'; else if (snr > 20) quality = 'good'; else if (snr > 10) quality = 'fair'; else if (snr > 3) quality = 'poor'; else quality = 'dead';
      return { attenTotal, snr, shannonMbps, effectiveSpeed, propagationDelay, totalDelay, ber, quality, overMax: dist > ch.maxDist };
    }

    const distUnit = ch.medium === 'fiber' ? dist / 1000 : dist / 100;
    const cableAtten = ch.attenuation * distUnit;
    attenTotal = cableAtten + envPenalty;
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
            const dl = h.layer;
            const isEndpoint = dl >= 7;
            const osiActions = {
              1: { action: 'Принимает электрический/оптический сигнал → усиливает → отправляет на все порты', pdu: 'Биты → Биты' },
              2: { action: 'Читает MAC-адрес назначения в кадре → ищет в MAC-таблице → отправляет на нужный порт. Не трогает IP.', pdu: 'Кадр → Кадр (новый L2 на выходе)' },
              3: { action: 'Снимает L2 → читает IP назначения → ищет маршрут → создаёт новый L2 заголовок (новый MAC) → отправляет.', pdu: 'Пакет → Пакет (MAC меняется, IP остаётся)' },
              4: { action: 'Снимает L2-L3 → анализирует порты и флаги TCP/UDP → проверяет правила → пропускает или блокирует.', pdu: 'Сегмент проверен → пакет пересобран' },
              7: { action: 'Полная обработка: L1→L7 декапсуляция / L7→L1 инкапсуляция. Приложение формирует/принимает данные.', pdu: 'Данные ↔ Биты (все 7 уровней)' }
            };
            const osi = osiActions[Math.min(dl, 7)] || osiActions[7];

            return `<div class="nb-result-row" id="nbRes-${idx}">
              <div class="nb-result-row__icon">${h.icon}</div>
              <div class="nb-result-row__text"><strong>${h.name}</strong> — L${dl}</div>
              <div class="nb-result-row__val">${h.latency > 0 ? '+' + h.latency.toFixed(2) + ' мс' : '—'}</div>
            </div>
            <div class="nb-osi-stack">
              ${[7,6,5,4,3,2,1].map(n => {
                const l = OSI_LAYERS.find(x => x.number === n);
                const active = isEndpoint || n <= dl;
                return `<div class="nb-osi-layer${active ? ' active' : ''}" style="background:${l.color}">L${n}</div>`;
              }).join('')}
            </div>
            <div class="nb-osi-action">
              <strong>${isEndpoint ? 'Все уровни L1–L7' : 'Обработка до L' + dl}:</strong> ${osi.action}<br>
              <strong>PDU:</strong> ${osi.pdu}
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
            <div class="journey-signal" style="margin-top:6px"><canvas class="nb-sig-canvas" data-snr="${p.snr.toFixed(1)}" data-medium="${h.ch.medium}"></canvas></div>
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

    // Draw signal canvases for each link
    const nbMsg = document.getElementById('nbMessage')?.value || getLabText();
    const nbMsgBytes = labData.bytes.length > 0 ? labData.bytes.slice(0, 2) : Array.from(new TextEncoder().encode(nbMsg.slice(0, 2)));
    const nbMsgBits = [];
    nbMsgBytes.forEach(b => { for (let i = 7; i >= 0; i--) nbMsgBits.push((b >> i) & 1); });

    result.querySelectorAll('.nb-sig-canvas').forEach(cv => {
      const snr = parseFloat(cv.dataset.snr);
      const medium = cv.dataset.medium;
      const dpr = window.devicePixelRatio || 1;
      const rect = cv.getBoundingClientRect();
      cv.width = rect.width * dpr;
      cv.height = 60 * dpr;
      cv.style.height = '60px';
      const ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);
      const cw = rect.width, ch = 60;
      const mid = ch / 2;
      const bitW = cw / nbMsgBits.length;

      ctx.clearRect(0, 0, cw, ch);
      ctx.setLineDash([3,3]); ctx.strokeStyle = '#1a203050'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(cw, mid); ctx.stroke(); ctx.setLineDash([]);

      const rxAmp = Math.max(Math.min(snr / 40, 1), 0.05);
      const noiseLevel = Math.max(0.01, 0.5 - snr / 60);
      const color = snr > 20 ? '#2ecc71' : snr > 10 ? '#f1c40f' : '#e74c3c';

      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath();
      if (medium === 'radio') {
        for (let x = 0; x < cw; x++) {
          const sIdx = Math.min(Math.floor(x / bitW), nbMsgBits.length - 1);
          const bit = nbMsgBits[sIdx];
          const freq = bit ? 0.22 : 0.1;
          const noise = (Math.random() - 0.5) * 2 * noiseLevel * ch * 0.3;
          const y = mid + Math.sin(x * freq) * ch * 0.3 * rxAmp + noise;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      } else {
        for (let x = 0; x < cw; x++) {
          const sIdx = Math.min(Math.floor(x / bitW), nbMsgBits.length - 1);
          const bit = nbMsgBits[sIdx];
          const val = bit ? 1 : -1;
          const noise = (Math.random() - 0.5) * 2 * noiseLevel * ch * 0.3;
          const y = mid - val * ch * 0.3 * rxAmp + noise;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.fillStyle = '#4a5568'; ctx.font = '8px sans-serif';
      ctx.fillText(medium === 'radio' ? 'FSK модуляция' : medium === 'fiber' ? 'OOK (свет)' : 'NRZ напряжение', 4, 10);
      ctx.fillText(`SNR: ${snr.toFixed(0)} дБ`, cw - 60, 10);
    });

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

  /* ==================== PHYSICS LAB BENCH ==================== */

  (function initPhysLab() {
    const container = document.getElementById('siggenUI');
    let sgComponents = [
      { type: 'sin', freq: 100, amp: 1, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }
    ];
    const sgFs = 8000;
    const sgN = 512;

    const PARAM_HELP = {
      type: 'Форма базового сигнала. Синус — основа всех сигналов (теорема Фурье). Прямоугольный содержит нечётные гармоники. Шум — случайный.',
      freq: 'Частота базового сигнала в Гц. Определяет высоту тона / скорость изменения. Макс = Fs/2 (Найквист).',
      amp: 'Амплитуда — максимальное отклонение от нуля. Определяет мощность сигнала.',
      phase: 'Начальная фаза в градусах. Сдвигает сигнал по времени. 180° = инверсия.',
      carrier: 'Несущая частота для модуляции. 0 = без модуляции (baseband). >0 = сигнал модулирует несущую этой частоты. Разные несущие = FDM.',
      modType: 'AM — меняется амплитуда несущей. FM — меняется частота. PM — меняется фаза. На спектре видны боковые полосы.',
      modDepth: 'AM: глубина 0-1 (1 = 100%). FM: девиация частоты (Гц). PM: индекс модуляции (рад). Больше → шире спектр.',
      noise: 'Аддитивный белый гауссовский шум (AWGN). Присутствует в любом канале — тепловой шум электроники, космическое излучение. Увеличьте, чтобы увидеть шумовую полку на спектре.'
    };

    const SG_CH_PRESETS = [
      { id: 'none', name: '— Без канала (идеальный) —' },
      ...CHANNEL_TYPES.map(c => ({ id: c.id, name: `${c.icon} ${c.name} (${c.medium === 'copper' ? 'медь' : c.medium === 'fiber' ? 'оптика' : 'радио'})` }))
    ];

    const SG_SIGNAL_PRESETS = [
      { name: '🎵 Тон 440 Гц (нота Ля)', components: [{ type: 'sin', freq: 440, amp: 1, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }] },
      { name: '📻 AM-радио (несущая 1 кГц)', components: [{ type: 'sin', freq: 100, amp: 1, phase: 0, dc: 0, carrier: 1000, modType: 'am', modDepth: 0.8 }] },
      { name: '📡 FM-сигнал (несущая 2 кГц)', components: [{ type: 'sin', freq: 50, amp: 1, phase: 0, dc: 0, carrier: 2000, modType: 'fm', modDepth: 200 }] },
      { name: '🔀 FDM 3 канала', components: [
        { type: 'sin', freq: 50, amp: 0.8, phase: 0, dc: 0, carrier: 500, modType: 'am', modDepth: 0.7 },
        { type: 'sin', freq: 80, amp: 0.6, phase: 0, dc: 0, carrier: 1200, modType: 'am', modDepth: 0.7 },
        { type: 'sin', freq: 30, amp: 0.7, phase: 0, dc: 0, carrier: 2000, modType: 'am', modDepth: 0.7 }
      ]},
      { name: '🎼 Аккорд (3 гармоники)', components: [
        { type: 'sin', freq: 261, amp: 1, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 },
        { type: 'sin', freq: 329, amp: 0.8, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 },
        { type: 'sin', freq: 392, amp: 0.6, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }
      ]},
      { name: '📊 Прямоугольный импульс', components: [{ type: 'square', freq: 100, amp: 1, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }] },
      { name: '📶 Цифровая модуляция (PSK)', components: [{ type: 'square', freq: 100, amp: 1, phase: 0, dc: 0, carrier: 1500, modType: 'pm', modDepth: 3.14 }] },
      { name: '🔊 Белый шум', components: [{ type: 'noise', freq: 1, amp: 1, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }] }
    ];

    function applyChannel(samples, chId, dist) {
      if (chId === 'none') return { rx: samples.slice(), snr: 999, atten: 0, bw: sgFs / 2 };
      const ch = CHANNEL_TYPES.find(c => c.id === chId);
      if (!ch) return { rx: samples.slice(), snr: 999, atten: 0, bw: sgFs / 2 };
      let atten, snr;
      if (ch.medium === 'radio' && ch.freqGHz) {
        const distM = Math.max(dist, 1);
        const fspl = 20 * Math.log10(distM) + 20 * Math.log10(ch.freqGHz * 1e9) - 147.55;
        const rxPower = ch.txPowerDbm - fspl + (ch.rxAntennaGain || 0);
        const thermalNoise = -174 + 10 * Math.log10(ch.bandwidthMHz * 1e6) + (ch.noiseFigure || 6);
        snr = Math.max(rxPower - thermalNoise, -5);
        atten = fspl;
      } else {
        const distUnit = ch.medium === 'fiber' ? dist / 1000 : dist / 100;
        atten = ch.attenuation * distUnit;
        snr = Math.max(ch.snrBase - atten, -5);
      }
      const gain = Math.pow(10, -Math.min(atten, 100) / 20);
      const noiseStd = gain / Math.max(Math.pow(10, snr / 20), 0.01);
      const bw = Math.min(ch.bandwidthMHz * 1e6, sgFs / 2);
      const bwNorm = bw / (sgFs / 2);
      const rx = new Float64Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        rx[i] = samples[i] * gain + (Math.random() - 0.5) * 2 * noiseStd * 0.3;
      }
      if (bwNorm < 1) {
        const cutoff = Math.floor(samples.length * bwNorm / 2);
        const re = new Float64Array(sgN), im = new Float64Array(sgN);
        for (let i = 0; i < sgN; i++) re[i] = rx[i];
        fft(re, im);
        for (let i = cutoff; i < sgN - cutoff; i++) { re[i] = 0; im[i] = 0; }
        const re2 = new Float64Array(sgN), im2 = new Float64Array(sgN);
        for (let i = 0; i < sgN; i++) { re2[i] = re[i]; im2[i] = -im[i]; }
        fft(re2, im2);
        for (let i = 0; i < sgN; i++) rx[i] = re2[i] / sgN;
      }
      return { rx, snr, atten, bw, ch };
    }

    const WAVE_TYPES = {
      sin: 'Синус', cos: 'Косинус', square: 'Прямоугольный',
      sawtooth: 'Пила', triangle: 'Треугольный', noise: 'Белый шум'
    };

    function genSamples() {
      if (sgImportedSamples) return sgImportedSamples;
      const samples = new Float64Array(sgN);
      sgComponents.forEach(c => {
        for (let n = 0; n < sgN; n++) {
          const t = n / sgFs;
          const w = 2 * Math.PI * c.freq;
          let v = 0;
          if (c.type === 'sin') v = Math.sin(w * t + c.phase * Math.PI / 180);
          else if (c.type === 'cos') v = Math.cos(w * t + c.phase * Math.PI / 180);
          else if (c.type === 'square') v = Math.sin(w * t + c.phase * Math.PI / 180) >= 0 ? 1 : -1;
          else if (c.type === 'sawtooth') v = 2 * ((c.freq * t + c.phase / 360) % 1) - 1;
          else if (c.type === 'triangle') { const p = (c.freq * t + c.phase / 360) % 1; v = p < 0.5 ? 4 * p - 1 : 3 - 4 * p; }
          else if (c.type === 'noise') v = (Math.random() - 0.5) * 2;
          let baseband = v * c.amp + c.dc;

          if (c.carrier > 0 && c.modType !== 'none') {
            const wc = 2 * Math.PI * c.carrier;
            if (c.modType === 'am') {
              samples[n] += (1 + c.modDepth * baseband) * Math.cos(wc * t);
            } else if (c.modType === 'fm') {
              let integral = 0;
              for (let k = 0; k <= n; k++) { const tk = k / sgFs; let vk = 0;
                if (c.type === 'sin') vk = Math.sin(2*Math.PI*c.freq*tk); else vk = baseband;
                integral += vk / sgFs;
              }
              samples[n] += c.amp * Math.cos(wc * t + 2 * Math.PI * c.modDepth * integral);
            } else if (c.modType === 'pm') {
              samples[n] += c.amp * Math.cos(wc * t + c.modDepth * baseband);
            }
          } else if (c.carrier > 0) {
            samples[n] += baseband * Math.cos(2 * Math.PI * c.carrier * t);
          } else {
            samples[n] += baseband;
          }
        }
      });
      return samples;
    }

    function fft(re, im) {
      const n = re.length;
      if (n <= 1) return;
      const hre = new Float64Array(n / 2), him = new Float64Array(n / 2);
      const gre = new Float64Array(n / 2), gim = new Float64Array(n / 2);
      for (let i = 0; i < n / 2; i++) {
        hre[i] = re[2 * i]; him[i] = im[2 * i];
        gre[i] = re[2 * i + 1]; gim[i] = im[2 * i + 1];
      }
      fft(hre, him); fft(gre, gim);
      for (let k = 0; k < n / 2; k++) {
        const angle = -2 * Math.PI * k / n;
        const wr = Math.cos(angle), wi = Math.sin(angle);
        const tr = wr * gre[k] - wi * gim[k];
        const ti = wr * gim[k] + wi * gre[k];
        re[k] = hre[k] + tr; im[k] = him[k] + ti;
        re[k + n / 2] = hre[k] - tr; im[k + n / 2] = him[k] - ti;
      }
    }

    function drawTimeDomain(canvas, samples) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr; canvas.height = 140 * dpr;
      canvas.style.height = '140px';
      const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
      const w = rect.width, h = 140, mid = h / 2;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke(); ctx.setLineDash([]);
      for (let v = -1; v <= 1; v += 0.5) { if (v === 0) continue; ctx.strokeStyle = '#1a203040'; ctx.beginPath(); ctx.moveTo(0, mid - v * mid * 0.8); ctx.lineTo(w, mid - v * mid * 0.8); ctx.stroke(); }

      let maxA = 0;
      for (let i = 0; i < samples.length; i++) if (Math.abs(samples[i]) > maxA) maxA = Math.abs(samples[i]);
      if (maxA === 0) maxA = 1;

      ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 1.5; ctx.beginPath();
      const show = Math.min(samples.length, 256);
      for (let i = 0; i < show; i++) {
        const x = (i / show) * w;
        const y = mid - (samples[i] / maxA) * mid * 0.85;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#4a5568'; ctx.font = '9px sans-serif';
      ctx.fillText(`${(maxA).toFixed(2)}`, 2, 12);
      ctx.fillText(`-${(maxA).toFixed(2)}`, 2, h - 4);
    }

    function drawSpectrum(canvas, samples) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr; canvas.height = 160 * dpr;
      canvas.style.height = '160px';
      const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
      const w = rect.width, h = 160;
      const scale = sgSpectrumScale;
      ctx.clearRect(0, 0, w, h);

      const re = new Float64Array(sgN);
      const im = new Float64Array(sgN);
      for (let i = 0; i < sgN; i++) {
        let win = 1;
        if (sgSpectrumWindow === 'hann') win = 0.5 * (1 - Math.cos(2 * Math.PI * i / (sgN - 1)));
        else if (sgSpectrumWindow === 'hamming') win = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (sgN - 1));
        re[i] = (samples[i] || 0) * win;
      }
      fft(re, im);

      const mag = new Float64Array(sgN / 2);
      let maxM = 0;
      for (let i = 0; i < sgN / 2; i++) {
        mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / sgN * 2;
        if (mag[i] > maxM) maxM = mag[i];
      }
      if (maxM === 0) maxM = 1;

      // Grid
      ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
      for (let db = 0; db >= -scale; db -= 10) {
        const y = h * 0.04 + (h * 0.88) * (-db / scale);
        ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(w, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#4a5568'; ctx.font = '8px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(db + '', 26, y + 3);
      }
      ctx.textAlign = 'left';

      // Frequency grid
      for (let f = 0; f <= sgFs / 2; f += 500) {
        const x = 28 + (f / (sgFs / 2)) * (w - 32);
        ctx.strokeStyle = '#1a203030'; ctx.beginPath(); ctx.moveTo(x, h * 0.04); ctx.lineTo(x, h * 0.92); ctx.stroke();
      }

      // Spectrum fill + line
      const plotW = w - 32;
      const barW = plotW / (sgN / 2);
      ctx.fillStyle = '#e67e2230';
      ctx.beginPath();
      ctx.moveTo(28, h * 0.92);
      for (let i = 0; i < sgN / 2; i++) {
        const dbVal = mag[i] > 0 ? 20 * Math.log10(mag[i] / maxM) : -scale;
        const barH = Math.max((-dbVal) / scale, 0);
        const x = 28 + i * barW;
        const y = h * 0.04 + barH * h * 0.88;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(28 + plotW, h * 0.92);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < sgN / 2; i++) {
        const dbVal = mag[i] > 0 ? 20 * Math.log10(mag[i] / maxM) : -scale;
        const barH = Math.max((-dbVal) / scale, 0);
        const x = 28 + i * barW;
        const y = h * 0.04 + barH * h * 0.88;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Peak markers
      for (let i = 1; i < sgN / 2 - 1; i++) {
        if (mag[i] > mag[i-1] && mag[i] > mag[i+1] && mag[i] > maxM * 0.1) {
          const freq = (i / (sgN / 2)) * sgFs / 2;
          const dbVal = 20 * Math.log10(mag[i] / maxM);
          const x = 28 + i * barW;
          const y = h * 0.04 + Math.max((-dbVal) / scale, 0) * h * 0.88;
          ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(Math.round(freq) + 'Hz', x, y - 6);
          ctx.fillText(dbVal.toFixed(1) + 'dB', x, y - 14);
          ctx.textAlign = 'left';
        }
      }

      // Axis labels
      ctx.fillStyle = '#4a5568'; ctx.font = '8px sans-serif';
      const freqs = [0, sgFs / 8, sgFs / 4, sgFs * 3 / 8, sgFs / 2];
      freqs.forEach((f, i) => { ctx.fillText(f + '', 28 + (i / (freqs.length - 1)) * plotW - 8, h - 2); });
      ctx.fillText('дБ', 2, 12);
    }

    function render() {
      const samples = genSamples();
      let matlabCode = `Fs = ${sgFs};\nt = (0:${sgN - 1})/Fs;\n`;
      const parts = [];
      sgComponents.forEach((c, i) => {
        const varName = `s${i + 1}`;
        if (c.type === 'sin') matlabCode += `${varName} = ${c.amp}*sin(2*pi*${c.freq}*t + ${c.phase}*pi/180) + ${c.dc};\n`;
        else if (c.type === 'cos') matlabCode += `${varName} = ${c.amp}*cos(2*pi*${c.freq}*t + ${c.phase}*pi/180) + ${c.dc};\n`;
        else if (c.type === 'square') matlabCode += `${varName} = ${c.amp}*square(2*pi*${c.freq}*t + ${c.phase}*pi/180) + ${c.dc};\n`;
        else if (c.type === 'sawtooth') matlabCode += `${varName} = ${c.amp}*sawtooth(2*pi*${c.freq}*t + ${c.phase}*pi/180) + ${c.dc};\n`;
        else if (c.type === 'triangle') matlabCode += `${varName} = ${c.amp}*sawtooth(2*pi*${c.freq}*t + ${c.phase}*pi/180, 0.5) + ${c.dc};\n`;
        else matlabCode += `${varName} = ${c.amp}*randn(1, length(t)) + ${c.dc};\n`;
        parts.push(varName);
      });
      matlabCode += `x = ${parts.join(' + ')};\nplot(t, x); xlabel('Time (s)'); ylabel('Amplitude');\nfigure; plot(Fs/length(x)*(0:length(x)/2-1), abs(fft(x))/length(x)*2); xlabel('Freq (Hz)');`;

      // Add manual noise
      const txSamples = samples;
      for (let i = 0; i < txSamples.length && sgNoiseLevel > 0; i++) {
        txSamples[i] += (Math.random() - 0.5) * 2 * sgNoiseLevel;
      }
      const chResult = applyChannel(txSamples, sgChannelId, sgChDistance);
      const rxSamples = chResult.rx;

      container.innerHTML = `
        <div class="study-section__title">① Пресеты сигналов</div>
        <div style="display:flex;gap:4px;overflow-x:auto;margin-bottom:12px;scrollbar-width:none">
          ${SG_SIGNAL_PRESETS.map((p, i) => `<button class="lab-tab" data-preset="${i}" style="font-size:.65rem">${p.name}</button>`).join('')}
        </div>

        <div class="study-section__title">② Генератор сигналов</div>
        ${sgComponents.map((c, i) => `
          <div class="sg-component">
            <div class="sg-component__header">
              <span class="sg-component__title">#${i + 1}${c.carrier > 0 ? ` → несущая ${c.carrier} Гц (${c.modType === 'am' ? 'AM' : c.modType === 'fm' ? 'FM' : c.modType === 'pm' ? 'PM' : 'DSB'})` : `: ${WAVE_TYPES[c.type]} ${c.freq} Гц`}</span>
              ${sgComponents.length > 1 ? `<button class="sg-component__remove" data-rm="${i}">✕</button>` : ''}
            </div>
            <div class="sg-param-grid">
              <div class="sg-param"><label>Форма <span class="sg-help" data-help="type">?</span></label><select data-ci="${i}" data-p="type">${Object.entries(WAVE_TYPES).map(([k, v]) => `<option value="${k}"${k === c.type ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
              <div class="sg-param"><label>Частота (Гц) <span class="sg-help" data-help="freq">?</span></label><input type="number" data-ci="${i}" data-p="freq" value="${c.freq}" min="1" max="3900" step="10"></div>
              <div class="sg-param"><label>Амплитуда <span class="sg-help" data-help="amp">?</span></label><input type="number" data-ci="${i}" data-p="amp" value="${c.amp}" min="0" max="10" step="0.1"></div>
              <div class="sg-param"><label>Фаза (°) <span class="sg-help" data-help="phase">?</span></label><input type="number" data-ci="${i}" data-p="phase" value="${c.phase}" min="0" max="360" step="15"></div>
              <div class="sg-param"><label>Несущая (Гц) <span class="sg-help" data-help="carrier">?</span></label><input type="number" data-ci="${i}" data-p="carrier" value="${c.carrier || 0}" min="0" max="3900" step="50"></div>
              <div class="sg-param"><label>Модуляция <span class="sg-help" data-help="modType">?</span></label><select data-ci="${i}" data-p="modType"><option value="none"${c.modType === 'none' ? ' selected' : ''}>Нет</option><option value="am"${c.modType === 'am' ? ' selected' : ''}>AM</option><option value="fm"${c.modType === 'fm' ? ' selected' : ''}>FM</option><option value="pm"${c.modType === 'pm' ? ' selected' : ''}>PM</option></select></div>
              ${c.modType !== 'none' ? `<div class="sg-param" style="grid-column:span 2"><label>${c.modType === 'am' ? 'Глубина (0-1)' : c.modType === 'fm' ? 'Девиация (Гц)' : 'Индекс (рад)'} <span class="sg-help" data-help="modDepth">?</span></label><input type="number" data-ci="${i}" data-p="modDepth" value="${c.modDepth}" min="0" max="${c.modType === 'fm' ? 500 : 10}" step="${c.modType === 'fm' ? 10 : 0.1}"></div>` : ''}
            </div>
          </div>
        `).join('')}
        <div style="display:flex;gap:6px;margin-bottom:8px">
          <button class="dnd-btn" id="sgAddComp" style="flex:1;padding:8px;font-size:.72rem"${sgComponents.length >= 4 ? ' disabled' : ''}>+ Компонента</button>
          <button class="dnd-btn" id="sgAddFDM" style="flex:1;padding:8px;font-size:.72rem"${sgComponents.length >= 4 ? ' disabled' : ''}>+ FDM канал</button>
        </div>
        <div id="sgHelpBox" style="display:none;font-size:.72rem;color:var(--text-secondary);padding:8px;background:var(--bg-surface);border-radius:6px;margin-bottom:8px;border-left:3px solid var(--accent)"></div>

        <div class="study-section__title">③ Генератор помех (AWGN)</div>
        <div class="sg-param-grid" style="margin-bottom:10px">
          <div class="sg-param"><label>Уровень шума <span class="sg-help" data-help="noise">?</span></label><input type="range" id="sgNoiseSlider" min="0" max="2" step="0.05" value="${sgNoiseLevel}"></div>
          <div class="sg-param"><label>Шум: ${sgNoiseLevel.toFixed(2)}</label><div style="font-size:.65rem;color:var(--text-secondary)">${sgNoiseLevel === 0 ? 'Без шума' : sgNoiseLevel < 0.3 ? 'Слабый' : sgNoiseLevel < 0.8 ? 'Умеренный' : 'Сильный'}</div></div>
        </div>

        <div class="study-section__title">④ Передатчик (TX) — осциллограмма</div>
        <div class="sg-canvas-wrap">
          <canvas id="sgTimeDomain"></canvas>
          <div class="sg-canvas-label"><span>Время →</span><span>Fs = ${sgFs} Гц, N = ${sgN}</span></div>
        </div>
        <div class="sg-canvas-wrap">
          <canvas id="sgSpectrum"></canvas>
          <div class="sg-canvas-label"><span>0 Гц</span><span>📊 Анализатор спектра TX (FFT ${sgN} точек, 0..${sgFs/2} Гц, шкала ${sgSpectrumScale} дБ)</span><span>${sgFs/2} Гц</span></div>
        </div>
        <div class="sg-param-grid" style="margin-bottom:10px">
          <div class="sg-param"><label>Шкала спектра (дБ)</label><input type="range" id="sgScaleSlider" min="20" max="100" step="10" value="${sgSpectrumScale}"></div>
          <div class="sg-param"><label>Окно FFT</label><select id="sgWindowSel"><option value="rect"${sgSpectrumWindow==='rect'?' selected':''}>Прямоугольное</option><option value="hann"${sgSpectrumWindow==='hann'?' selected':''}>Ханна</option><option value="hamming"${sgSpectrumWindow==='hamming'?' selected':''}>Хэмминга</option></select></div>
        </div>

        <div class="study-section__title" style="margin-top:16px">⑤ Канал связи</div>
        <div class="sg-param-grid" style="margin-bottom:8px">
          <div class="sg-param"><label>Тип канала <span class="sg-help" data-help="carrier">?</span></label><select id="sgChannelSel">${SG_CH_PRESETS.map(p => `<option value="${p.id}"${p.id === sgChannelId ? ' selected' : ''}>${p.name}</option>`).join('')}</select></div>
          <div class="sg-param"><label>Расстояние</label><input type="number" id="sgChDist" value="${sgChDistance}" min="1" max="100000" step="10"></div>
        </div>
        ${sgChannelId !== 'none' ? (() => {
          const r = applyChannel(samples, sgChannelId, sgChDistance);
          const quality = r.snr > 30 ? '🟢 Отличное' : r.snr > 20 ? '🟡 Хорошее' : r.snr > 10 ? '🟠 Среднее' : r.snr > 0 ? '🔴 Плохое' : '⚫ Нет связи';
          return `<div class="card" style="font-size:.72rem;line-height:1.7;padding:10px">
            <strong>${r.ch?.icon} ${r.ch?.name}</strong> — ${r.ch?.medium === 'copper' ? 'медный кабель' : r.ch?.medium === 'fiber' ? 'оптоволокно' : 'радиоканал'}<br>
            <strong>Затухание:</strong> ${r.atten.toFixed(1)} дБ (сигнал ослаблен в ${Math.pow(10, r.atten/20).toFixed(1)} раз)<br>
            <strong>SNR:</strong> ${r.snr.toFixed(1)} дБ — ${quality}<br>
            <strong>Полоса:</strong> ${r.bw >= 1e6 ? (r.bw/1e6).toFixed(0) + ' МГц' : (r.bw/1e3).toFixed(0) + ' кГц'} (частоты выше обрезаются)<br>
            <strong>Шум:</strong> AWGN (аддитивный белый гауссов шум) — тепловой шум электроники + внешние помехи<br>
            <strong>Помехи:</strong> ${r.ch?.interference === 'high' ? '⚠ Высокие' : r.ch?.interference === 'medium' ? '~ Средние' : r.ch?.interference === 'none' ? '✓ Нет' : '✓ Низкие'}
          </div>`;
        })() : '<div style="font-size:.72rem;color:var(--text-secondary);margin-bottom:8px">Выберите канал — увидите как он искажает сигнал. Спектр RX покажет шумовую полку (AWGN) и ограничение полосы.</div>'}

        <div class="study-section__title">⑥ Приёмник (RX) — осциллограмма</div>
        <div class="sg-canvas-wrap">
          <canvas id="sgRxTime"></canvas>
          <div class="sg-canvas-label"><span>Время →</span><span>Принятый сигнал</span></div>
        </div>
        <div class="sg-canvas-wrap">
          <canvas id="sgRxSpectrum"></canvas>
          <div class="sg-canvas-label"><span>0 Гц</span><span>📊 Анализатор спектра RX</span><span>${sgFs/2} Гц</span></div>
        </div>

        <div class="study-section__title" style="margin-top:16px">MATLAB / Octave код</div>
        <div class="sg-formula">${matlabCode}</div>
        <div class="sg-export-btns">
          <button id="sgExportCSV">📄 TX CSV</button>
          <button id="sgExportRxCSV">📄 RX CSV</button>
          <button id="sgCopyMatlab">📋 MATLAB</button>
          <button id="sgImportCSV">📂 Импорт CSV</button>
        </div>
        <input type="file" id="sgImportFileInput" hidden accept=".csv,.txt">
      `;

      drawTimeDomain(document.getElementById('sgTimeDomain'), txSamples);
      drawSpectrum(document.getElementById('sgSpectrum'), txSamples);
      drawTimeDomain(document.getElementById('sgRxTime'), rxSamples);
      drawSpectrum(document.getElementById('sgRxSpectrum'), rxSamples);

      // Preset buttons
      container.querySelectorAll('[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = SG_SIGNAL_PRESETS[parseInt(btn.dataset.preset)];
          sgComponents = JSON.parse(JSON.stringify(preset.components));
          sgImportedSamples = null;
          render();
        });
      });

      container.querySelectorAll('[data-ci]').forEach(el => {
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
          const ci = parseInt(el.dataset.ci);
          const p = el.dataset.p;
          sgComponents[ci][p] = el.tagName === 'SELECT' ? el.value : parseFloat(el.value) || 0;
          render();
        });
      });

      container.querySelectorAll('[data-rm]').forEach(btn => {
        btn.addEventListener('click', () => { sgComponents.splice(parseInt(btn.dataset.rm), 1); render(); });
      });

      document.getElementById('sgAddComp')?.addEventListener('click', () => {
        if (sgComponents.length < 4) { sgComponents.push({ type: 'sin', freq: 200 * (sgComponents.length + 1), amp: 0.5, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }); render(); }
      });

      document.getElementById('sgAddFDM')?.addEventListener('click', () => {
        if (sgComponents.length < 4) {
          const carriers = [500, 1000, 1500, 2000];
          sgComponents.push({ type: 'sin', freq: 50, amp: 0.8, phase: 0, dc: 0, carrier: carriers[sgComponents.length] || 2500, modType: 'am', modDepth: 0.8 });
          render();
        }
      });

      container.querySelectorAll('.sg-help').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const box = document.getElementById('sgHelpBox');
          const key = btn.dataset.help;
          box.textContent = PARAM_HELP[key] || '';
          box.style.display = box.style.display === 'none' ? 'block' : 'none';
        });
      });

      document.getElementById('sgNoiseSlider')?.addEventListener('input', (e) => { sgNoiseLevel = parseFloat(e.target.value); render(); });
      document.getElementById('sgScaleSlider')?.addEventListener('input', (e) => { sgSpectrumScale = parseInt(e.target.value); render(); });
      document.getElementById('sgWindowSel')?.addEventListener('change', (e) => { sgSpectrumWindow = e.target.value; render(); });
      document.getElementById('sgChannelSel')?.addEventListener('change', (e) => { sgChannelId = e.target.value; render(); });
      document.getElementById('sgChDist')?.addEventListener('input', (e) => { sgChDistance = parseInt(e.target.value) || 50; render(); });

      document.getElementById('sgExportCSV')?.addEventListener('click', () => {
        let csv = 'time,tx_amplitude\n';
        for (let i = 0; i < sgN; i++) csv += `${(i / sgFs).toFixed(6)},${txSamples[i].toFixed(6)}\n`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'signal_tx.csv'; a.click();
        addXP(3);
      });

      document.getElementById('sgExportRxCSV')?.addEventListener('click', () => {
        let csv = 'time,rx_amplitude\n';
        for (let i = 0; i < sgN; i++) csv += `${(i / sgFs).toFixed(6)},${rxSamples[i].toFixed(6)}\n`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'signal_rx.csv'; a.click();
      });

      document.getElementById('sgCopyMatlab')?.addEventListener('click', () => {
        navigator.clipboard.writeText(matlabCode).then(() => { showToast('📋', 'MATLAB код скопирован', ''); });
      });

      document.getElementById('sgImportCSV')?.addEventListener('click', () => document.getElementById('sgImportFileInput').click());
      document.getElementById('sgImportFileInput')?.addEventListener('change', (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const lines = reader.result.split('\n').filter(l => l.trim());
          const hasHeader = isNaN(parseFloat(lines[0].split(',')[0]));
          const data = (hasHeader ? lines.slice(1) : lines).map(l => {
            const cols = l.split(/[,\t;]/);
            return parseFloat(cols[cols.length > 1 ? 1 : 0]) || 0;
          }).slice(0, sgN);
          if (data.length < 4) { showToast('⚠️', 'Файл слишком мал', ''); return; }
          sgComponents = [{ type: 'sin', freq: 0, amp: 0, phase: 0, dc: 0 }];
          const imported = new Float64Array(sgN);
          for (let i = 0; i < sgN; i++) imported[i] = data[i % data.length] || 0;
          sgComponents = []; // clear components, use imported directly
          sgImportedSamples = imported;
          showToast('📂', `Импортировано ${data.length} отсчётов`, '+3 XP');
          addXP(3);
          render();
        };
        reader.readAsText(file);
      });
    }

    const obs = new MutationObserver(() => {
      if (document.getElementById('section-siggen')?.classList.contains('active') && !container.children.length) render();
    });
    obs.observe(document.getElementById('section-siggen'), { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { if (document.getElementById('section-siggen')?.classList.contains('active')) render(); }, 200);
  })();

  /* ==================== CHANNEL SIMULATOR ==================== */
  let chSrcBytes = null;
  let chSrcImgData = null;
  let chSrcFileName = null;
  let chSrcType = 'text';
  let chNoiseMode = 'awgn';
  const noiseDescs = {
    awgn: 'AWGN — белый гауссовский шум. Каждый бит имеет независимую вероятность ошибки.',
    impulse: 'Импульсный — пачки ошибок 4-16 бит. Молния, моторы, коммутация.',
    fading: 'Замирание — периодическое ослабление. Многолучевость, движение.'
  };

  // Channel SNR now comes from the generator's channel model

  document.getElementById('chSrcFileBtn')?.addEventListener('click', () => document.getElementById('chSrcFileInput')?.click());
  document.getElementById('chSrcLabData')?.addEventListener('click', () => {
    chSrcBytes = labData.bytes.slice();
    chSrcImgData = labData.imgPreview;
    chSrcFileName = labData.fileName || labData.text;
    chSrcType = labData.type;
    document.getElementById('chSrcText').value = labData.text;
    const p = document.getElementById('chSrcPreview');
    p.innerHTML = chSrcImgData ? `<img src="${chSrcImgData}" style="max-width:100%;max-height:80px;border-radius:6px;margin-top:6px">` : `<div style="font-size:.72rem;color:var(--l4);margin-top:4px">Загружено ${chSrcBytes.length} байт</div>`;
  });

  document.getElementById('chSrcText')?.addEventListener('input', (e) => {
    chSrcBytes = Array.from(new TextEncoder().encode(e.target.value));
    chSrcImgData = null; chSrcFileName = null; chSrcType = 'text';
    document.getElementById('chSrcPreview').innerHTML = '';
  });

  document.getElementById('chSrcFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 50 * 1024 * 1024) return;
    chSrcFileName = file.name;
    chSrcType = file.type.startsWith('image/') ? 'image' : 'file';
    if (file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = () => { chSrcImgData = r.result; document.getElementById('chSrcPreview').innerHTML = `<img src="${r.result}" style="max-width:100%;max-height:80px;border-radius:6px;margin-top:6px"><div style="font-size:.72rem;color:var(--text-secondary);margin-top:2px">${file.name}</div>`; };
      r.readAsDataURL(file);
    } else { chSrcImgData = null; }
    const r2 = new FileReader();
    r2.onload = () => { chSrcBytes = Array.from(new Uint8Array(r2.result)); document.getElementById('chSrcText').value = file.name; };
    r2.readAsArrayBuffer(file);
  });

  document.getElementById('chTransmit')?.addEventListener('click', () => {
    if (sgChannelId === 'none') {
      document.getElementById('chResult').innerHTML = '<div class="card mt-16" style="color:var(--l7)">⚠ Сначала выберите канал на вкладке «Генератор + Канал» (блок ⑤)</div>';
      return;
    }

    if (!chSrcBytes || chSrcBytes.length === 0) {
      const txt = document.getElementById('chSrcText')?.value || 'Hello';
      chSrcBytes = Array.from(new TextEncoder().encode(txt));
      chSrcType = 'text';
    }

    const ch = CHANNEL_TYPES.find(c => c.id === sgChannelId);
    const phys = calcChannelPhysics(ch, sgChDistance, 'normal');
    const snr = Math.round(phys.snr);
    const atten = phys.attenTotal;
    const txBytes = chSrcBytes.slice(0, 4096);
    const txBits = [];
    txBytes.forEach(b => { for (let i = 7; i >= 0; i--) txBits.push((b >> i) & 1); });

    // Apply noise
    let ber;
    if (snr > 30) ber = 1e-10;
    else if (snr > 20) ber = 1e-7;
    else if (snr > 15) ber = 1e-4;
    else if (snr > 10) ber = 5e-3;
    else if (snr > 5) ber = 5e-2;
    else if (snr > 0) ber = 0.15;
    else ber = 0.35;

    const rxBits = txBits.slice();
    let errCount = 0;
    const errPositions = [];

    if (chNoiseMode === 'awgn') {
      for (let i = 0; i < rxBits.length; i++) {
        if (Math.random() < ber) { rxBits[i] ^= 1; errCount++; errPositions.push(i); }
      }
    } else if (chNoiseMode === 'impulse') {
      for (let i = 0; i < rxBits.length; i++) {
        if (Math.random() < ber * 0.3) {
          const burstLen = 4 + Math.floor(Math.random() * 12);
          for (let j = 0; j < burstLen && i + j < rxBits.length; j++) {
            rxBits[i + j] ^= 1; errCount++; errPositions.push(i + j);
          }
          i += burstLen;
        }
      }
    } else {
      for (let i = 0; i < rxBits.length; i++) {
        const fade = Math.sin(i / 50) * 0.5 + 0.5;
        const effectiveBer = ber * (1 + fade * 3);
        if (Math.random() < effectiveBer) { rxBits[i] ^= 1; errCount++; errPositions.push(i); }
      }
    }

    // Reconstruct bytes
    const rxBytes = [];
    for (let i = 0; i < rxBits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8 && i + j < rxBits.length; j++) byte = (byte << 1) | rxBits[i + j];
      rxBytes.push(byte);
    }

    const actualBer = txBits.length > 0 ? (errCount / txBits.length) : 0;

    // Build damaged image if possible
    let rxImgHtml = '';
    if (chSrcType === 'image' && chSrcImgData) {
      const origBytes = atob(chSrcImgData.split(',')[1]);
      const mime = chSrcImgData.split(';')[0].split(':')[1];
      const arr = new Uint8Array(origBytes.length);
      for (let i = 0; i < origBytes.length; i++) arr[i] = origBytes.charCodeAt(i);
      const headerSafe = Math.min(20, arr.length);
      for (let i = headerSafe; i < Math.min(arr.length, txBytes.length); i++) arr[i] = rxBytes[i] !== undefined ? rxBytes[i] : arr[i];
      try {
        const blob = new Blob([arr], { type: mime });
        const url = URL.createObjectURL(blob);
        rxImgHtml = `<img src="${url}" class="ch-compare__img" onerror="this.style.display='none';this.nextSibling.style.display='block'" alt=""><div style="display:none;font-size:.75rem;color:var(--l7);padding:8px">Файл повреждён слишком сильно для отображения</div>`;
      } catch(e) { rxImgHtml = '<div style="font-size:.75rem;color:var(--l7)">Ошибка реконструкции</div>'; }
    }

    // Bits comparison (first 256 bits)
    const showBits = Math.min(txBits.length, 256);
    let bitsHtml = '';
    for (let i = 0; i < showBits; i++) {
      const isErr = errPositions.includes(i);
      bitsHtml += `<span class="bit-${isErr ? 'err' : 'ok'}">${rxBits[i]}</span>`;
      if ((i + 1) % 8 === 0) bitsHtml += ' ';
    }
    if (txBits.length > 256) bitsHtml += ' …';

    // Hex comparison (first 32 bytes)
    const showBytes = Math.min(txBytes.length, 32);
    let hexCompHtml = '';
    for (let i = 0; i < showBytes; i++) {
      const isErr = txBytes[i] !== rxBytes[i];
      hexCompHtml += `<div class="ch-hex-byte ch-hex-byte--${isErr ? 'err' : 'ok'}">${txBytes[i].toString(16).toUpperCase().padStart(2, '0')}${isErr ? '→' + rxBytes[i].toString(16).toUpperCase().padStart(2, '0') : ''}</div>`;
    }

    const rxText = chSrcType === 'text' ? new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(rxBytes)) : null;

    const result = document.getElementById('chResult');
    result.innerHTML = `
      <div class="lab-stats mt-16">
        <div class="lab-stat"><div class="lab-stat__value">${txBits.length.toLocaleString()}</div><div class="lab-stat__label">Бит передано</div></div>
        <div class="lab-stat"><div class="lab-stat__value" style="color:${errCount > 0 ? 'var(--l7)' : 'var(--l4)'}">${errCount}</div><div class="lab-stat__label">Бит повреждено</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${(actualBer * 100).toFixed(actualBer > 0.01 ? 1 : 4)}%</div><div class="lab-stat__label">BER</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${txBytes.length}</div><div class="lab-stat__label">Байт</div></div>
      </div>

      ${chSrcType === 'image' && chSrcImgData ? `
        <div class="lab-result__title mt-16">Оригинал vs Полученное</div>
        <div class="ch-compare">
          <div class="ch-compare__side" style="border-color:var(--l4)">
            <div class="ch-compare__title" style="color:var(--l4)">📤 Отправлено</div>
            <img src="${chSrcImgData}" class="ch-compare__img">
          </div>
          <div class="ch-compare__side" style="border-color:${errCount > 0 ? 'var(--l7)' : 'var(--l4)'}">
            <div class="ch-compare__title" style="color:${errCount > 0 ? 'var(--l7)' : 'var(--l4)'}">📥 Получено ${errCount > 0 ? '(повреждено)' : '(OK)'}</div>
            ${rxImgHtml}
          </div>
        </div>
      ` : ''}

      ${rxText !== null ? `
        <div class="lab-result__title mt-16">Текст: оригинал vs полученный</div>
        <div class="ch-compare">
          <div class="ch-compare__side" style="border-color:var(--l4)">
            <div class="ch-compare__title" style="color:var(--l4)">📤 Отправлено</div>
            <div class="ch-compare__text">${document.getElementById('chSrcText').value || ''}</div>
          </div>
          <div class="ch-compare__side" style="border-color:${errCount > 0 ? 'var(--l7)' : 'var(--l4)'}">
            <div class="ch-compare__title" style="color:${errCount > 0 ? 'var(--l7)' : 'var(--l4)'}">📥 Получено</div>
            <div class="ch-compare__text">${rxText}</div>
          </div>
        </div>
      ` : ''}

      <div class="lab-result__title mt-16">Биты (повреждённые <span style="color:var(--l7)">красным</span>)</div>
      <div class="ch-bits-compare">${bitsHtml}</div>

      <div class="lab-result__title">Байты TX vs RX (первые ${showBytes})</div>
      <div class="ch-hex-compare">${hexCompHtml}</div>

      <div class="card mt-12" style="font-size:.78rem;line-height:1.6">
        <strong>Канал:</strong> ${ch.icon} ${ch.name}, расстояние ${sgChDistance >= 1000 ? (sgChDistance/1000).toFixed(1)+' км' : sgChDistance+' м'}, SNR = ${snr} дБ, затухание ${atten.toFixed(1)} дБ.<br>
        <strong>Результат:</strong> из ${txBits.length.toLocaleString()} бит повреждено ${errCount} (BER = ${(actualBer * 100).toFixed(4)}%).
        ${errCount === 0 ? ' Идеальная передача!' : errCount < 10 ? ' Минимальные повреждения.' : errCount < 100 ? ' Заметные повреждения.' : ' Серьёзное повреждение данных!'}
        ${chSrcType === 'image' && errCount > 0 ? '<br>Артефакты на изображении — результат повреждённых байтов.' : ''}
      </div>
    `;
    addXP(5);
  });

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

    simUploadedFile = file;

    if (file.type.startsWith('image/')) {
      const imgReader = new FileReader();
      imgReader.onload = () => {
        simUploadedImg = imgReader.result;
        const imgEl = document.createElement('div');
        imgEl.innerHTML = `<img src="${imgReader.result}" style="max-width:100%;max-height:100px;border-radius:8px;margin:8px 0;display:block">`;
        document.getElementById('fileResult').prepend(imgEl);
      };
      imgReader.readAsDataURL(file);
    } else {
      simUploadedImg = null;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result);
      simUploadedBytes = Array.from(bytes);
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

  /* ==================== LAB: JOURNEY ==================== */
  (function initJourney() {
    let journeyFile = null;
    let journeyImgData = null;

    const jFileDrop = document.getElementById('journeyFileDrop');
    const jFileInput = document.getElementById('journeyFileInput');
    jFileDrop.addEventListener('click', () => jFileInput.click());
    jFileInput.addEventListener('change', () => {
      if (jFileInput.files.length) loadJourneyFile(jFileInput.files[0]);
    });
    jFileDrop.addEventListener('dragover', e => { e.preventDefault(); jFileDrop.style.borderColor = 'var(--accent)'; });
    jFileDrop.addEventListener('dragleave', () => { jFileDrop.style.borderColor = ''; });
    jFileDrop.addEventListener('drop', e => { e.preventDefault(); jFileDrop.style.borderColor = ''; if (e.dataTransfer.files.length) loadJourneyFile(e.dataTransfer.files[0]); });

    function loadJourneyFile(file) {
      journeyFile = file;
      const preview = document.getElementById('journeyPreview');
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          journeyImgData = reader.result;
          preview.innerHTML = `<img src="${reader.result}" class="journey-img-preview" style="margin-top:8px;max-height:100px">
            <div style="font-size:.72rem;color:var(--text-secondary);margin-top:4px">${file.name} (${(file.size/1024).toFixed(1)} КБ)</div>`;
        };
        reader.readAsDataURL(file);
      } else {
        journeyImgData = null;
        preview.innerHTML = `<div style="font-size:.8rem;margin-top:8px">📄 ${file.name} (${(file.size/1024).toFixed(1)} КБ)</div>`;
      }
    }

    function animateSignal(canvas, duration) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = 70 * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      const w = rect.width, h = 70;
      const bits = [1,0,1,1,0,0,1,0,1,1,0,1,0,1,1,0,0,1,0,1];
      let offset = 0;
      const start = performance.now();

      function frame(now) {
        const elapsed = now - start;
        if (elapsed > duration) return;
        offset = (elapsed / duration) * w * 2;
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = '#2ecc7140'; ctx.lineWidth = 1;
        ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke(); ctx.setLineDash([]);

        const bitW = 18;
        ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2; ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const bx = x + offset;
          const bitIdx = Math.floor(bx / bitW) % bits.length;
          const inBit = (bx % bitW) / bitW;
          let val = bits[bitIdx] ? 1 : -1;
          const edge = 0.1;
          if (inBit < edge) val *= inBit / edge;
          else if (inBit > 1 - edge) val *= (1 - inBit) / edge;
          const noise = (Math.random() - 0.5) * 0.15;
          const y = h / 2 - (val + noise) * h * 0.3;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        const headX = Math.min((elapsed / duration) * w, w);
        ctx.fillStyle = '#2ecc71'; ctx.beginPath();
        ctx.arc(headX, h/2, 4, 0, Math.PI * 2); ctx.fill();

        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    document.getElementById('journeyRun').addEventListener('click', async () => {
      const msg = document.getElementById('journeyMsg').value || getLabText();
      const result = document.getElementById('journeyResult');
      const hasFile = labData.type === 'file';
      const dataSize = labData.size || new TextEncoder().encode(msg).length;
      const dataDesc = hasFile ? `${labData.fileName} (${(dataSize/1024).toFixed(1)} КБ)` : `"${msg}"`;
      const mtu = 1500;
      const segments = Math.ceil(dataSize / (mtu - 40));
      const srcPort = 49000 + Math.floor(Math.random() * 16000);
      const seqNum = 1000 + Math.floor(Math.random() * 9000);

      const hexPreview = hasFile
        ? `[бинарные данные ${dataSize} байт]`
        : Array.from(new TextEncoder().encode(msg)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

      const steps = [
        { icon: '⌨️', color: '#e74c3c', title: 'Клавиатура / Файл → Приложение', sub: 'Пользователь вводит данные',
          data: hasFile ? `File: ${journeyFile.name}\nType: ${journeyFile.type}\nSize: ${dataSize} bytes` : `User input: "${msg}"`,
          desc: 'Вы набираете текст или выбираете файл. Приложение (браузер) формирует данные для отправки.' },
        { icon: '🌐', color: '#e74c3c', title: 'L7 Прикладной — HTTP запрос', sub: 'Формирование HTTP-запроса',
          data: `POST /send HTTP/1.1\r\nHost: receiver.com\r\nContent-Type: ${hasFile ? journeyFile.type : 'text/plain'}\r\nContent-Length: ${dataSize}\r\n\r\n${hasFile ? '[binary data]' : msg}`,
          desc: 'Приложение оборачивает данные в HTTP-запрос с заголовками.' },
        { icon: '🔐', color: '#e67e22', title: 'L6 Представления — TLS шифрование', sub: 'AES-256-GCM шифрование',
          data: `TLS Record:\n  Content Type: Application Data (23)\n  Version: TLS 1.3\n  Cipher: AES-256-GCM\n  Encrypted: ${Array.from({length: Math.min(dataSize, 20)}, () => Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(' ')}...`,
          desc: 'Данные шифруются ключом сессии (AES-256-GCM). Никто в канале не может прочитать содержимое.' },
        { icon: '🔗', color: '#f1c40f', title: 'L5 Сеансовый — TCP сессия', sub: 'Управление соединением',
          data: `Session: ESTABLISHED\nSocket: 192.168.1.100:${srcPort} → 93.184.216.34:443`,
          desc: 'TCP-соединение уже установлено (3-way handshake). Данные передаются внутри сессии.' },
        { icon: '📦', color: '#2ecc71', title: `L4 Транспортный — TCP сегментация (${segments} сегм.)`, sub: `Порт ${srcPort} → 443, Seq=${seqNum}`,
          data: `TCP Segment:\n  Src Port: ${srcPort}\n  Dst Port: 443\n  Seq: ${seqNum}\n  Flags: PSH, ACK\n  Window: 65535\n  Payload: ${Math.min(dataSize, mtu-40)} bytes\n  ${segments > 1 ? `(всего ${segments} сегментов)` : ''}`,
          desc: `Данные (${dataSize} байт) разбиваются на ${segments} TCP-сегментов по ${mtu-40} байт. Каждый получает порт источника/назначения и номер последовательности.` },
        { icon: '🗺️', color: '#1abc9c', title: 'L3 Сетевой — IP-пакет, маршрутизация', sub: '192.168.1.100 → 93.184.216.34',
          data: `IP Header:\n  Version: 4  IHL: 5  TTL: 64\n  Protocol: TCP (6)\n  Src: 192.168.1.100\n  Dst: 93.184.216.34\n  Total: ${Math.min(dataSize + 40, mtu)} bytes`,
          desc: 'Добавляется IP-заголовок с адресами. Маршрутизатор определит путь по таблице маршрутов.' },
        { icon: '🔀', color: '#3498db', title: 'L2 Канальный — Ethernet кадр', sub: 'MAC: AA:BB:CC:11:22:33 → FF:EE:DD:44:55:66',
          data: `Ethernet Frame:\n  Dst MAC: FF:EE:DD:44:55:66\n  Src MAC: AA:BB:CC:11:22:33\n  Type: 0x0800 (IPv4)\n  Payload: IP packet\n  FCS: CRC-32`,
          desc: 'Пакет помещается в Ethernet-кадр с MAC-адресами. ARP определил MAC шлюза.' },
        { icon: '⚡', color: '#9b59b6', title: 'L1 Физический — Биты → Сигнал', sub: 'Manchester / OFDM / Лазер',
          data: `Bits: ${Array.from({length: 32}, () => Math.round(Math.random())).join('')}...\nEncoding: Manchester (Ethernet) / OFDM (Wi-Fi)\nSignal: электрический / радио / оптический`,
          desc: 'Биты кадра преобразуются в физический сигнал: электрические импульсы (медь), световые импульсы (оптоволокно) или радиоволны (Wi-Fi).', signal: true },
        { icon: '📡', color: '#34495e', title: 'Канал связи — сигнал в среде', sub: 'Затухание, шум, задержка распространения',
          data: `Medium: copper / fiber / radio\nAttenuation: signal weakens\nNoise: environmental interference\nPropagation: ~2/3 speed of light`,
          desc: 'Сигнал проходит по среде: затухает с расстоянием, подвергается помехам. Приёмник должен выделить данные из шума.', signal: true },
        { icon: '⚡', color: '#9b59b6', title: 'L1 Получатель — Сигнал → Биты', sub: 'Демодуляция, восстановление тактов',
          data: `Received signal → Clock recovery → Bit decisions\nBER: < 10⁻¹⁰ (no errors detected)`,
          desc: 'Приёмник восстанавливает тактовую частоту, определяет пороги «0» и «1», извлекает биты из сигнала.' },
        { icon: '🔀', color: '#3498db', title: 'L2 Получатель — Проверка CRC', sub: 'Целостность кадра OK',
          data: `CRC check: PASS\nDst MAC matches: YES\nExtract IP packet`,
          desc: 'Проверяется контрольная сумма кадра (CRC-32). MAC-адрес совпадает — кадр принимается.' },
        { icon: '🗺️', color: '#1abc9c', title: 'L3 Получатель — IP проверка', sub: 'IP назначения совпадает',
          data: `Dst IP: 93.184.216.34 → matches local\nTTL: 58 (was 64, -6 hops)\nExtract TCP segment`,
          desc: 'IP-адрес назначения совпадает с локальным. Пакет принят, IP-заголовок снимается.' },
        { icon: '📦', color: '#2ecc71', title: `L4 Получатель — Сборка ${segments} сегментов`, sub: 'TCP ACK → отправителю',
          data: `Port 443 → deliver to application\nReassemble ${segments} segments\nSend ACK seq=${seqNum + dataSize}`,
          desc: `TCP собирает все ${segments} сегментов в правильном порядке, отправляет ACK отправителю.` },
        { icon: '🔗', color: '#f1c40f', title: 'L5 Получатель — Сессия активна', sub: 'Данные для приложения',
          data: `Session: ESTABLISHED\nDeliver to application layer`, desc: 'Сессионный уровень передаёт данные приложению.' },
        { icon: '🔓', color: '#e67e22', title: 'L6 Получатель — Расшифровка', sub: 'AES-256-GCM → открытый текст',
          data: `Decrypt: AES-256-GCM(session_key)\nVerify: HMAC integrity OK\nResult: ${hasFile ? '[binary data restored]' : msg}`,
          desc: 'Зашифрованные данные расшифровываются ключом сессии. Проверяется целостность (HMAC).' },
        { icon: '🖥️', color: '#e74c3c', title: 'L7 Получатель — Данные приложению', sub: 'HTTP 200 OK → отображение',
          data: `HTTP/1.1 200 OK\nContent received: ${dataDesc}\nRender on screen`,
          desc: 'Приложение получает данные и отображает их на экране получателя.' }
      ];

      result.innerHTML = `<div class="mt-16">${steps.map((s, i) => `
        <div class="journey-step" id="jStep-${i}">
          <div class="journey-step__timeline">
            <div class="journey-step__icon" style="color:${s.color}">${s.icon}</div>
            ${i < steps.length - 1 ? '<div class="journey-step__wire"></div>' : ''}
          </div>
          <div class="journey-step__body">
            <div class="journey-step__title" style="color:${s.color}">${s.title}</div>
            <div class="journey-step__sub">${s.sub}</div>
            <div style="font-size:.72rem;color:var(--text-secondary);line-height:1.5;margin-bottom:4px">${s.desc}</div>
            <div class="journey-step__data">${s.data}</div>
            ${s.signal ? '<div class="journey-signal"><canvas class="journey-signal-canvas"></canvas></div>' : ''}
          </div>
        </div>
      `).join('')}
      <div class="journey-received" id="jReceived" style="display:none">
        <div class="journey-received__icon">✅</div>
        <div class="journey-received__msg">${hasFile && journeyImgData ? '' : (hasFile ? '📄 ' + journeyFile.name : msg)}</div>
        ${hasFile && labData.imgPreview ? `<img src="${labData.imgPreview}" style="max-width:100%;max-height:120px;border-radius:8px;margin-top:8px">` : ''}
        <div style="font-size:.72rem;color:var(--text-secondary);margin-top:6px">Доставлено за ${segments} сегментов через 7 уровней OSI</div>
      </div></div>`;

      for (let i = 0; i < steps.length; i++) {
        await sleep(450);
        const el = document.getElementById('jStep-' + i);
        if (el) {
          el.classList.add('visible');
          if (steps[i].signal) {
            const cv = el.querySelector('.journey-signal-canvas');
            if (cv) animateSignal(cv, 2000);
          }
        }
        termScroll.call ? null : null;
        result.scrollIntoView({ block: 'end', behavior: 'smooth' });
      }

      await sleep(500);
      const recv = document.getElementById('jReceived');
      if (recv) recv.style.display = 'block';
      result.scrollIntoView({ block: 'end', behavior: 'smooth' });
      addXP(10);
    });
  })();

  /* ==================== LAB: MULTIPLEXING ==================== */
  (function initMuxLab() {
    const container = document.getElementById('muxUI');
    let muxType = 'tdm';
    const devColors = ['#e74c3c','#3498db','#2ecc71','#e67e22','#9b59b6','#1abc9c'];
    const devNames = ['Браузер','Почта','Видео','Игра','VoIP','Торрент'];
    let muxDevCount = 4;

    const MUX_TYPES = {
      tdm: { name: 'TDM — Time Division', full: 'Временное мультиплексирование',
        desc: 'Каждому устройству/потоку выделяется фиксированный временной слот. Все по очереди. Даже если устройству нечего передавать — слот пустует. Используется в T1/E1 (телефония), GSM.',
        how: 'Кабель: 1 → время делится на слоты → каждый получает свою долю секунды' },
      fdm: { name: 'FDM — Frequency Division', full: 'Частотное мультиплексирование',
        desc: 'Полоса частот делится на каналы, каждый передаёт на своей частоте одновременно. Радиостанции, кабельное ТВ, ADSL. Защитные полосы (guard bands) предотвращают интерференцию.',
        how: 'Кабель/эфир: 1 → частотный спектр делится → каждый на своей частоте' },
      ofdma: { name: 'OFDMA — Orthogonal FDM', full: 'Ортогональное частотное мультиплексирование',
        desc: 'Множество узких поднесущих (subcarriers) распределяются между устройствами. Поднесущие ортогональны → нет интерференции, нет guard bands. Wi-Fi 6 (802.11ax), LTE, 5G.',
        how: 'Эфир: сотни поднесущих → группы назначаются устройствам → параллельная передача' },
      csma: { name: 'CSMA/CA — Collision Avoidance', full: 'Множественный доступ с контролем несущей',
        desc: 'Все устройства делят один канал. Перед передачей слушают: занят → ждут случайное время (backoff). Свободен → передают. Если коллизия → повторяют с увеличенным backoff. Wi-Fi использует CSMA/CA.',
        how: 'Эфир: 1 канал → слушай → жди → передавай → надейся что не столкнёшься' },
      ports: { name: 'Порты TCP/UDP', full: 'Мультиплексирование через порты',
        desc: 'Один IP-адрес, один кабель — но каждое приложение использует свой порт (0-65535). ОС смотрит порт назначения в пакете и направляет данные нужному приложению. Это L4 — транспортный уровень.',
        how: 'Браузер :443 | Почта :993 | SSH :22 | DNS :53 — все через один кабель' }
    };

    let muxAnimId = null;

    function drawMux(canvas) {
      if (muxAnimId) cancelAnimationFrame(muxAnimId);
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = 200 * dpr;
      canvas.style.height = '200px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      const w = rect.width, h = 200;
      const n = muxDevCount;

      let startTime = performance.now();

      function frame(now) {
        const t = (now - startTime) / 1000;
        ctx.clearRect(0, 0, w, h);

      if (muxType === 'tdm') {
        ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
        ctx.fillText('Время →', w - 45, 12);
        const slotW = w / (n * 3);
        for (let round = 0; round < 3; round++) {
          for (let d = 0; d < n; d++) {
            const x = (round * n + d) * slotW;
            ctx.fillStyle = devColors[d] + '30';
            ctx.fillRect(x + 1, 20, slotW - 2, h - 30);
            ctx.fillStyle = devColors[d];
            const dataH = 20 + Math.random() * (h - 60);
            ctx.fillRect(x + 3, h - 10 - dataH, slotW - 6, dataH);
            if (round === 0) { ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(devNames[d]?.charAt(0) || d, x + slotW / 2, h - 16 - dataH); ctx.textAlign = 'left'; }
          }
        }
      } else if (muxType === 'fdm' || muxType === 'ofdma') {
        ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
        ctx.fillText('Частота ↕', 2, 12); ctx.fillText('Время →', w - 45, 12);
        const bandH = (h - 30) / n;
        const guardH = muxType === 'fdm' ? 4 : 0;
        for (let d = 0; d < n; d++) {
          const y = 20 + d * bandH;
          ctx.fillStyle = devColors[d] + '20';
          ctx.fillRect(0, y + guardH, w, bandH - guardH * 2);
          for (let x = 0; x < w; x += 2) {
            const amp = (Math.sin(x * 0.05 * (d + 1)) * 0.5 + 0.5) * (bandH - guardH * 2 - 4);
            ctx.fillStyle = devColors[d] + '90';
            ctx.fillRect(x, y + guardH + (bandH - guardH * 2) / 2 - amp / 2, 1.5, amp);
          }
          ctx.fillStyle = devColors[d]; ctx.font = 'bold 9px sans-serif';
          ctx.fillText(devNames[d] || 'Dev ' + d, 4, y + bandH / 2 + 3);
        }
        if (muxType === 'fdm') {
          ctx.fillStyle = '#6c7a9640'; ctx.font = '7px sans-serif';
          for (let d = 1; d < n; d++) { const y = 20 + d * bandH; ctx.fillRect(0, y - 2, w, 4); }
        }
      } else if (muxType === 'csma') {
        ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
        ctx.fillText('Время →', w - 45, 12);
        const laneH = (h - 20) / n;
        let xPos = 0;
        const events = [];
        for (let t = 0; t < 12 && xPos < w; t++) {
          const dev = Math.floor(Math.random() * n);
          const waitW = 8 + Math.random() * 15;
          const txW = 15 + Math.random() * 25;
          events.push({ dev, x: xPos, waitW, txW });
          xPos += waitW + txW + 3;
        }
        for (let d = 0; d < n; d++) {
          const y = 20 + d * laneH;
          ctx.fillStyle = devColors[d] + '08';
          ctx.fillRect(0, y, w, laneH - 2);
          ctx.fillStyle = devColors[d]; ctx.font = '8px sans-serif';
          ctx.fillText(devNames[d] || '', 2, y + laneH / 2 + 3);
        }
        events.forEach(ev => {
          const y = 20 + ev.dev * laneH;
          ctx.fillStyle = '#f1c40f30';
          ctx.fillRect(ev.x, y, ev.waitW, laneH - 2);
          ctx.fillStyle = devColors[ev.dev];
          ctx.fillRect(ev.x + ev.waitW, y, ev.txW, laneH - 2);
        });
        ctx.fillStyle = '#6c7a96'; ctx.font = '8px sans-serif';
        ctx.fillText('█ передача   ░ ожидание (backoff)', 4, h - 4);
      } else if (muxType === 'ports') {
        const portApps = [
          { port: 443, app: 'Браузер (HTTPS)', proto: 'TCP' },
          { port: 993, app: 'Почта (IMAPS)', proto: 'TCP' },
          { port: 53, app: 'DNS', proto: 'UDP' },
          { port: 22, app: 'SSH', proto: 'TCP' },
          { port: 5060, app: 'VoIP (SIP)', proto: 'UDP' },
          { port: 51820, app: 'VPN (WireGuard)', proto: 'UDP' }
        ].slice(0, n);
        const rowH = (h - 20) / portApps.length;
        ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
        ctx.fillText('1 IP-адрес, 1 кабель →', w / 2 - 50, 12);
        portApps.forEach((p, i) => {
          const y = 20 + i * rowH;
          ctx.fillStyle = devColors[i] + '15';
          ctx.fillRect(0, y, w, rowH - 2);
          ctx.fillStyle = devColors[i];
          ctx.fillRect(0, y, 4, rowH - 2);
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`:${p.port}`, 10, y + rowH / 2 + 4);
          ctx.font = '10px sans-serif';
          ctx.fillText(`${p.app}`, 65, y + rowH / 2 + 4);
          ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
          ctx.fillText(p.proto, w - 30, y + rowH / 2 + 4);
        });
      }

      // Animated time cursor for TDM/CSMA/FDM
      if (muxType !== 'ports') {
        const cursorX = ((t * 40) % w);
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.moveTo(cursorX, 16); ctx.lineTo(cursorX, h - 4); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath(); ctx.arc(cursorX, 16, 4, 0, Math.PI * 2); ctx.fill();
      }

      muxAnimId = requestAnimationFrame(frame);
      }
      muxAnimId = requestAnimationFrame(frame);
    }

    function render() {
      const mt = MUX_TYPES[muxType];
      container.innerHTML = `
        <div class="sig-tabs">
          ${Object.entries(MUX_TYPES).map(([k, v]) => `<button class="sig-tab${k === muxType ? ' active' : ''}" data-mux="${k}">${v.name.split('—')[0].trim()}</button>`).join('')}
        </div>
        <div class="mux-devices">
          ${Array.from({length: muxDevCount}, (_, i) => `<div class="mux-device" style="background:${devColors[i]}20;border-color:${devColors[i]}"><div class="mux-device__dot" style="background:${devColors[i]}"></div>${devNames[i]}</div>`).join('')}
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          <button class="dnd-btn" id="muxRemDev" style="flex:1;padding:8px;font-size:.75rem"${muxDevCount <= 2 ? ' disabled' : ''}>− Устройство</button>
          <button class="dnd-btn" id="muxAddDev" style="flex:1;padding:8px;font-size:.75rem"${muxDevCount >= 6 ? ' disabled' : ''}>+ Устройство</button>
        </div>
        <div class="mux-visual"><canvas id="muxCanvas"></canvas></div>
        <div class="card" style="font-size:.82rem;line-height:1.7">
          <strong>${mt.full}</strong><br>${mt.desc}<br><br>
          <strong>Принцип:</strong> ${mt.how}
        </div>
        ${muxType === 'ports' ? `<div class="card mt-12" style="font-size:.78rem;line-height:1.6">
          <strong>Как это работает:</strong> Когда ваш браузер открывает google.com, ОС назначает ему случайный порт (например, 52341). Пакет уходит на сервер: <code>192.168.1.100:52341 → 142.250.74.78:443</code>. Когда ответ приходит на :52341, ОС знает — это для браузера. Одновременно почта работает через :993, SSH через :22 — все по одному кабелю, но каждый на своём порту.
        </div>` : ''}
        ${muxType === 'csma' ? `<div class="card mt-12" style="font-size:.78rem;line-height:1.6">
          <strong>Почему Wi-Fi замедляется при множестве устройств?</strong><br>
          CSMA/CA — полудуплекс: в один момент передаёт только одно устройство. Остальные ждут. Чем больше устройств — тем больше коллизий, backoff и ожидания. Wi-Fi 6 (OFDMA) решает это: даёт каждому устройству свои поднесущие, как мини-канал.
        </div>` : ''}
      `;
      drawMux(document.getElementById('muxCanvas'));
      container.querySelectorAll('[data-mux]').forEach(t => t.addEventListener('click', () => { if (muxAnimId) cancelAnimationFrame(muxAnimId); muxType = t.dataset.mux; render(); }));
      document.getElementById('muxAddDev')?.addEventListener('click', () => { if (muxDevCount < 6) { muxDevCount++; render(); } });
      document.getElementById('muxRemDev')?.addEventListener('click', () => { if (muxDevCount > 2) { muxDevCount--; render(); } });
    }

    const obs = new MutationObserver(() => { if (document.getElementById('lab-multiplexing')?.classList.contains('active') && !container.children.length) render(); });
    obs.observe(document.getElementById('lab-multiplexing'), { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { if (document.getElementById('lab-multiplexing')?.classList.contains('active')) render(); }, 100);
    onLabDataChange(() => { if (document.getElementById('lab-multiplexing')?.classList.contains('active')) render(); });
  })();

  /* ==================== LAB: ENCRYPTION ==================== */
  (function initEncryptLab() {
    const container = document.getElementById('encryptUI');
    let encType = 'xor';
    let encText = '';
    let encKey = 'Key';
    let caesarShift = 3;

    function toBin(n) { return n.toString(2).padStart(8, '0'); }

    function xorEncrypt(text, key) {
      const textBytes = Array.from(new TextEncoder().encode(text));
      const keyBytes = Array.from(new TextEncoder().encode(key));
      const result = textBytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
      return { textBytes, keyBytes, result };
    }

    function caesarEncrypt(text, shift) {
      const chars = [];
      for (const ch of text) {
        const code = ch.charCodeAt(0);
        if (code >= 65 && code <= 90) chars.push({ from: ch, to: String.fromCharCode((code - 65 + shift) % 26 + 65), shifted: true });
        else if (code >= 97 && code <= 122) chars.push({ from: ch, to: String.fromCharCode((code - 97 + shift) % 26 + 97), shifted: true });
        else if (code >= 0x410 && code <= 0x42F) chars.push({ from: ch, to: String.fromCharCode((code - 0x410 + shift) % 32 + 0x410), shifted: true });
        else if (code >= 0x430 && code <= 0x44F) chars.push({ from: ch, to: String.fromCharCode((code - 0x430 + shift) % 32 + 0x430), shifted: true });
        else chars.push({ from: ch, to: ch, shifted: false });
      }
      return chars;
    }

    function simpleHash(text) {
      let h = 0x811c9dc5;
      for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
      }
      const hex = (h >>> 0).toString(16).padStart(8, '0');
      return hex + hex.split('').reverse().join('') + ((h >>> 0) ^ 0xDEADBEEF).toString(16).padStart(8, '0') + ((h >>> 0) ^ 0xCAFEBABE).toString(16).padStart(8, '0');
    }

    const ENC_TYPES = {
      xor: { name: 'XOR (побитовый)', desc: 'Простейшее шифрование: каждый бит текста XOR-ится с битом ключа. Тот же ключ расшифровывает обратно. Основа всех современных шифров.' },
      caesar: { name: 'Шифр Цезаря', desc: 'Каждая буква сдвигается на N позиций в алфавите. Юлий Цезарь использовал сдвиг 3. Легко взломать перебором (26 вариантов).' },
      sym: { name: 'AES (симметричный)', desc: 'AES-256: один ключ для шифрования и дешифрования. 14 раундов трансформации: SubBytes → ShiftRows → MixColumns → AddRoundKey. Стандарт для TLS, дисков, VPN.' },
      asym: { name: 'RSA (асимметричный)', desc: 'Два ключа: публичный (шифрует) и приватный (расшифровывает). Основан на сложности факторизации больших чисел. Используется для обмена ключами в TLS.' },
      hash: { name: 'Хеширование (SHA-256)', desc: 'Одностороннее преобразование: из данных любого размера → фиксированный хеш 256 бит. Невозможно восстановить исходные данные. Пароли, цифровые подписи, блокчейн.' }
    };

    function render() {
      const et = ENC_TYPES[encType];
      let resultHTML = '';

      if (encType === 'xor') {
        const { textBytes, keyBytes, result } = xorEncrypt(encText || 'Hi', encKey || 'K');
        resultHTML = `
          <div class="enc-key-row"><label>Ключ</label><input type="text" id="encKeyInput" value="${encKey}" placeholder="Ключ"></div>
          <div class="enc-step">
            <div class="enc-step__title">Шаг 1: Текст → биты</div>
            <div class="enc-bits">${textBytes.map((b, i) => `<span title="${encText[i] || '?'}">${toBin(b)}</span>`).join(' ')}</div>
          </div>
          <div class="enc-step">
            <div class="enc-step__title">Шаг 2: Ключ → биты (повторяется циклически)</div>
            <div class="enc-bits">${textBytes.map((_, i) => `<span class="bk">${toBin(keyBytes[i % keyBytes.length])}</span>`).join(' ')}</div>
          </div>
          <div class="enc-step">
            <div class="enc-step__title">Шаг 3: Текст XOR Ключ = Шифротекст</div>
            <div class="enc-bits">${textBytes.map((b, i) => {
              const k = keyBytes[i % keyBytes.length];
              const r = b ^ k;
              return toBin(b).split('').map((bit, j) => {
                const kb = toBin(k)[j];
                const rb = toBin(r)[j];
                return `<span class="${rb === '1' ? 'br' : 'b0'}">${rb}</span>`;
              }).join('');
            }).join(' ')}</div>
          </div>
          <div class="enc-step">
            <div class="enc-step__title">Результат (hex)</div>
            <div class="enc-bits" style="font-size:.85rem"><span class="br">${result.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}</span></div>
          </div>
          <div class="card mt-12" style="font-size:.78rem">
            <strong>Расшифровка:</strong> Применяем XOR с тем же ключом ещё раз → получаем исходный текст. <code>A ⊕ K ⊕ K = A</code>
          </div>`;
      } else if (encType === 'caesar') {
        const chars = caesarEncrypt(encText || 'Привет', caesarShift);
        resultHTML = `
          <div class="enc-key-row"><label>Сдвиг</label><input type="range" id="encCaesarShift" min="1" max="25" value="${caesarShift}"><span style="font-weight:700;color:var(--accent);min-width:24px">${caesarShift}</span></div>
          <div class="enc-step">
            <div class="enc-step__title">Каждая буква сдвигается на ${caesarShift}</div>
            <div class="enc-char-grid">
              ${chars.map(c => `<div class="enc-char" style="background:${c.shifted ? 'var(--accent)' : 'var(--bg-surface)'}; color:${c.shifted ? '#fff' : 'var(--text-secondary)'}">
                ${c.to}<div class="enc-char__from">${c.shifted ? c.from + '→' : ''}</div>
              </div>`).join('')}
            </div>
          </div>
          <div class="enc-step">
            <div class="enc-step__title">Результат</div>
            <div style="font-family:monospace;font-size:1rem;font-weight:700;color:var(--l7)">${chars.map(c => c.to).join('')}</div>
          </div>`;
      } else if (encType === 'sym') {
        const hexCipher = Array.from(new TextEncoder().encode(encText || 'Hi')).map((b, i) => ((b ^ 0xA5 ^ (i * 37)) & 0xFF).toString(16).padStart(2, '0').toUpperCase()).join(' ');
        resultHTML = `
          <div class="enc-key-row"><label>Ключ AES-256</label><input type="text" value="2b7e151628aed2a6abf7158809cf4f3c" readonly style="font-size:.65rem;color:var(--accent)"></div>
          <div class="enc-step"><div class="enc-step__title">Открытый текст</div><div style="font-family:monospace">${encText}</div></div>
          <div class="enc-step"><div class="enc-step__title">14 раундов AES-256</div>
            <div style="font-size:.72rem;color:var(--text-secondary);line-height:1.8">
              Round 1: SubBytes → ShiftRows → MixColumns → AddRoundKey<br>
              Round 2: SubBytes → ShiftRows → MixColumns → AddRoundKey<br>
              <span style="color:var(--text-secondary)">... (раунды 3-13 аналогичны) ...</span><br>
              Round 14: SubBytes → ShiftRows → AddRoundKey (без MixColumns)
            </div>
          </div>
          <div class="enc-step"><div class="enc-step__title">Шифротекст (hex)</div><div class="enc-bits"><span class="br">${hexCipher}</span></div></div>
          <div class="card mt-12" style="font-size:.78rem;line-height:1.6">
            <strong>SubBytes:</strong> замена байтов по S-Box (нелинейность)<br>
            <strong>ShiftRows:</strong> циклический сдвиг строк состояния<br>
            <strong>MixColumns:</strong> умножение столбцов в поле Галуа GF(2⁸)<br>
            <strong>AddRoundKey:</strong> XOR с раундовым ключом (из исходного через Key Schedule)
          </div>`;
      } else if (encType === 'asym') {
        const p = 61, q = 53;
        const n = p * q;
        const phi = (p - 1) * (q - 1);
        const e = 17;
        const d = 2753;
        const m = (encText || 'A').charCodeAt(0) % n;
        const c = Number(BigInt(m) ** BigInt(e) % BigInt(n));
        resultHTML = `
          <div class="enc-step"><div class="enc-step__title">Шаг 1: Генерация ключей</div>
            <div style="font-size:.75rem;line-height:1.8">
              p = ${p}, q = ${q} (простые числа)<br>
              n = p × q = <span style="color:var(--accent);font-weight:700">${n}</span><br>
              φ(n) = (p−1)(q−1) = ${phi}<br>
              e = ${e} (публичная экспонента, взаимно проста с φ)<br>
              d = ${d} (приватная, d × e ≡ 1 mod φ)
            </div>
          </div>
          <div class="lab-stats">
            <div class="lab-stat"><div class="lab-stat__value" style="font-size:1rem">(${e}, ${n})</div><div class="lab-stat__label">Публичный ключ</div></div>
            <div class="lab-stat"><div class="lab-stat__value" style="font-size:1rem">(${d}, ${n})</div><div class="lab-stat__label">Приватный ключ 🔒</div></div>
          </div>
          <div class="enc-step mt-12"><div class="enc-step__title">Шаг 2: Шифрование (публичным ключом)</div>
            <div style="font-size:.75rem">m = '${String.fromCharCode(m)}' = ${m}<br>c = m<sup>e</sup> mod n = ${m}<sup>${e}</sup> mod ${n} = <span class="br" style="font-size:.9rem">${c}</span></div>
          </div>
          <div class="enc-step"><div class="enc-step__title">Шаг 3: Дешифрование (приватным ключом)</div>
            <div style="font-size:.75rem">m = c<sup>d</sup> mod n = ${c}<sup>${d}</sup> mod ${n} = <span class="term-ok" style="font-size:.9rem;font-weight:700">${m} = '${String.fromCharCode(m)}'</span></div>
          </div>
          <div class="card mt-12" style="font-size:.78rem;line-height:1.6">
            <strong>Безопасность:</strong> зная публичный ключ (e=${e}, n=${n}), нужно разложить n на множители p и q. Для n=${n} это легко, но для реального RSA-2048 (n из 617 цифр) — невозможно за разумное время.
          </div>`;
      } else if (encType === 'hash') {
        const hashVal = simpleHash(encText || '');
        const hashVal2 = simpleHash((encText || '') + '!');
        resultHTML = `
          <div class="enc-step"><div class="enc-step__title">Входные данные</div><div style="font-family:monospace">"${encText}"</div></div>
          <div class="enc-step"><div class="enc-step__title">Хеш (SHA-256 симуляция)</div><div class="enc-bits"><span class="br" style="font-size:.8rem">${hashVal}</span></div></div>
          <div class="enc-step"><div class="enc-step__title">Эффект лавины: "${encText}!" (добавлен !)</div><div class="enc-bits"><span class="br" style="font-size:.8rem">${hashVal2}</span></div></div>
          <div class="card mt-12" style="font-size:.78rem;line-height:1.6">
            <strong>Лавинный эффект:</strong> изменение 1 бита входа → изменение ~50% битов хеша. Невозможно предсказать хеш, невозможно найти вход по хешу.<br><br>
            <strong>Применение:</strong> хранение паролей (bcrypt), цифровые подписи, проверка целостности файлов (checksum), блокчейн (Bitcoin).
          </div>`;
      }

      container.innerHTML = `
        <div class="sig-tabs">
          ${Object.entries(ENC_TYPES).map(([k, v]) => `<button class="sig-tab${k === encType ? ' active' : ''}" data-enc="${k}">${v.name.split('(')[0].trim()}</button>`).join('')}
        </div>
        <div class="sig-section-title">Источник: ${labData.type === 'file' ? '📎 ' + labData.fileName : labData.type === 'random' ? '🎲 Случайные данные' : '✏️ Текст'} (${labData.size} Б)</div>
        <input type="text" class="enc-input" id="encTextInput" value="${encText || getLabText()}" placeholder="Или введите текст...">
        ${resultHTML}
        <div class="card mt-12" style="font-size:.82rem;line-height:1.7"><strong>${et.name}</strong><br>${et.desc}</div>
      `;

      container.querySelector('#encTextInput').addEventListener('input', (e) => { encText = e.target.value; render(); });
      container.querySelector('#encKeyInput')?.addEventListener('input', (e) => { encKey = e.target.value; render(); });
      container.querySelector('#encCaesarShift')?.addEventListener('input', (e) => { caesarShift = parseInt(e.target.value); render(); });
      container.querySelectorAll('[data-enc]').forEach(t => t.addEventListener('click', () => { encType = t.dataset.enc; render(); }));
    }

    const obs = new MutationObserver(() => { if (document.getElementById('lab-encryption')?.classList.contains('active') && !container.children.length) render(); });
    obs.observe(document.getElementById('lab-encryption'), { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { if (document.getElementById('lab-encryption')?.classList.contains('active')) render(); }, 100);
    onLabDataChange(() => { encText = ''; if (document.getElementById('lab-encryption')?.classList.contains('active')) render(); });
  })();

  /* ==================== LAB: SIGNALS L1 ==================== */
  (function initSignalsLab() {
    const container = document.getElementById('signalsUI');
    let sigText = '';
    let sigAnimId = null;
    let sigEncoding = 'nrz';
    let sigModulation = 'ask';
    let sigView = 'line';
    let sigChannel = 'cat5e';

    function textToBits(text) {
      const bytes = Array.from(new TextEncoder().encode(text)).slice(0, 4);
      const bits = [];
      bytes.forEach(b => { for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1); });
      return bits;
    }

    function fileBytesToBits(bytes) {
      const limited = bytes.slice(0, 4);
      const bits = [];
      limited.forEach(b => { for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1); });
      return bits;
    }

    function bytesBreakdown(text) {
      const bytes = Array.from(new TextEncoder().encode(text)).slice(0, 4);
      return bytes.map((b, i) => ({
        char: text[i] || '?',
        dec: b,
        hex: b.toString(16).toUpperCase().padStart(2, '0'),
        bin: b.toString(2).padStart(8, '0')
      }));
    }

    const LINE_CODES = {
      nrz:        { name: 'NRZ (Non-Return-to-Zero)', desc: 'Простейший код: 1 = высокий уровень, 0 = низкий. Используется в RS-232. Проблема: длинные последовательности одинаковых битов — потеря синхронизации.', where: 'RS-232, UART' },
      nrzi:       { name: 'NRZ-I (Inverted)', desc: 'При «1» сигнал меняет уровень, при «0» остаётся. Решает проблему длинных серий единиц. Используется в USB, FDDI.', where: 'USB, FDDI, 4B5B+NRZI' },
      manchester:  { name: 'Manchester (IEEE)', desc: 'Переход в середине каждого бита: вверх = 1, вниз = 0. Самосинхронизирующийся — тактовый сигнал встроен. Ethernet 10BASE-T.', where: '10BASE-T Ethernet' },
      diffmanch:   { name: 'Differential Manchester', desc: 'Переход в середине всегда. Переход на границе бита = 0, нет перехода = 1. Используется в Token Ring.', where: 'Token Ring' },
      ami:        { name: 'AMI (Alternate Mark Inversion)', desc: '0 = нулевой уровень, 1 = чередование +V и −V. Нет DC-составляющей. Проблема с длинными нулями.', where: 'T1/E1, ISDN' },
      pam4:       { name: 'PAM-4 (4 уровня)', desc: '4 уровня напряжения: −3V, −1V, +1V, +3V. Каждый символ = 2 бита. Удваивает пропускную способность при той же полосе.', where: '100GBASE-T, 400G Ethernet, PCIe 6.0' }
    };

    const MOD_TYPES = {
      ask:  { name: 'ASK (Amplitude)', desc: 'Амплитуда несущей изменяется: 1 = полная амплитуда, 0 = малая. Простейшая модуляция. Чувствительна к помехам.', bps: 1 },
      fsk:  { name: 'FSK (Frequency)', desc: 'Частота несущей изменяется: 1 = высокая частота, 0 = низкая. Устойчивее к помехам чем ASK. Модемы, Bluetooth.', bps: 1 },
      bpsk: { name: 'BPSK (Phase)', desc: 'Фаза несущей: 1 = 0°, 0 = 180° (инверсия). 1 бит на символ. Очень устойчива к шуму. Wi-Fi на слабом сигнале.', bps: 1 },
      qpsk: { name: 'QPSK (4 фазы)', desc: '4 значения фазы (0°, 90°, 180°, 270°). 2 бита на символ. Удвоение скорости при той же полосе. DVB-S, LTE.', bps: 2 },
      qam16:{ name: 'QAM-16', desc: '16 комбинаций амплитуды и фазы. 4 бита на символ. Кабельное ТВ, Wi-Fi на среднем сигнале.', bps: 4 },
      qam256:{ name: 'QAM-256', desc: '256 комбинаций — 8 бит на символ! Максимальная эффективность, но требует высокий SNR > 30 дБ. Wi-Fi 5/6, DOCSIS 3.1.', bps: 8 }
    };

    function setupCanvas(canvas, h) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = h * dpr;
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      return { ctx, w: rect.width, h };
    }

    function drawLineCode(canvas, bits, type) {
      const { ctx, w, h } = setupCanvas(canvas, 120);
      const bitW = w / bits.length;
      const mid = h / 2;
      const amp = h * 0.35;
      ctx.clearRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = '#1a2030';
      ctx.lineWidth = 1;
      for (let i = 0; i <= bits.length; i++) {
        ctx.beginPath(); ctx.moveTo(i * bitW, 0); ctx.lineTo(i * bitW, h); ctx.stroke();
      }
      ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke(); ctx.setLineDash([]);

      // voltage labels
      ctx.fillStyle = '#4a5568'; ctx.font = '9px sans-serif';
      if (type === 'pam4') {
        ['+3V','+1V','−1V','−3V'].forEach((l, i) => ctx.fillText(l, 2, mid - amp + i * (amp * 2 / 3) + 4));
      } else {
        ctx.fillText('+V', 2, mid - amp + 10); ctx.fillText('0', 2, mid + 3); ctx.fillText('−V', 2, mid + amp - 2);
      }

      // bit labels
      ctx.fillStyle = '#6c7a96'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
      bits.forEach((b, i) => ctx.fillText(b, i * bitW + bitW / 2, 12));
      ctx.textAlign = 'left';

      // signal
      ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2.5; ctx.beginPath();
      let prevLevel = 0;
      let amiPolarity = 1;

      for (let i = 0; i < bits.length; i++) {
        const x0 = i * bitW;
        const x1 = (i + 1) * bitW;
        const xm = x0 + bitW / 2;
        const b = bits[i];

        if (type === 'nrz') {
          const y = b ? mid - amp : mid + amp;
          if (i === 0) ctx.moveTo(x0, y);
          else ctx.lineTo(x0, y);
          ctx.lineTo(x1, y);
        } else if (type === 'nrzi') {
          if (b) prevLevel = prevLevel === 0 ? 1 : 0;
          const y = prevLevel ? mid - amp : mid + amp;
          if (i === 0) ctx.moveTo(x0, y);
          else ctx.lineTo(x0, y);
          ctx.lineTo(x1, y);
        } else if (type === 'manchester') {
          const yH = mid - amp, yL = mid + amp;
          if (b) { // 1: low→high
            if (i === 0) ctx.moveTo(x0, yL); else ctx.lineTo(x0, yL);
            ctx.lineTo(xm, yL); ctx.lineTo(xm, yH); ctx.lineTo(x1, yH);
          } else { // 0: high→low
            if (i === 0) ctx.moveTo(x0, yH); else ctx.lineTo(x0, yH);
            ctx.lineTo(xm, yH); ctx.lineTo(xm, yL); ctx.lineTo(x1, yL);
          }
        } else if (type === 'diffmanch') {
          const yH = mid - amp, yL = mid + amp;
          if (b === 0) prevLevel = prevLevel ? 0 : 1;
          const startY = prevLevel ? yH : yL;
          const endY = prevLevel ? yL : yH;
          if (i === 0) ctx.moveTo(x0, startY); else ctx.lineTo(x0, startY);
          ctx.lineTo(xm, startY); ctx.lineTo(xm, endY); ctx.lineTo(x1, endY);
          prevLevel = prevLevel ? 0 : 1;
        } else if (type === 'ami') {
          if (b === 0) {
            if (i === 0) ctx.moveTo(x0, mid); else ctx.lineTo(x0, mid);
            ctx.lineTo(x1, mid);
          } else {
            const y = amiPolarity > 0 ? mid - amp : mid + amp;
            if (i === 0) ctx.moveTo(x0, mid); else ctx.lineTo(x0, mid);
            ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, mid);
            amiPolarity *= -1;
          }
        } else if (type === 'pam4') {
          const pair = (i % 2 === 0 && i + 1 < bits.length) ? bits[i] * 2 + bits[i + 1] : bits[i] * 2;
          const levels = [-3, -1, 1, 3];
          const symIdx = Math.min(pair, 3);
          const y = mid - (levels[symIdx] / 3) * amp;
          if (i === 0) ctx.moveTo(x0, y); else ctx.lineTo(x0, y);
          ctx.lineTo(x1, y);
        }
      }
      ctx.stroke();
    }

    function drawModulation(canvas, bits, type) {
      const totalH = 240;
      const { ctx, w, h } = setupCanvas(canvas, totalH);
      const bps = MOD_TYPES[type]?.bps || 1;
      const symbols = [];
      for (let i = 0; i < bits.length; i += bps) {
        let val = 0;
        for (let j = 0; j < bps && i + j < bits.length; j++) val = val * 2 + bits[i + j];
        symbols.push(val);
      }
      const symW = w / symbols.length;
      const carrierH = h * 0.28;
      const modH = h * 0.55;
      const carrierMid = carrierH / 2 + 16;
      const modMid = carrierH + 28 + modH / 2;
      const carrierAmp = carrierH * 0.38;
      const modAmp = modH * 0.4;
      const freqLow = 0.08, freqHigh = 0.24, freqMid = 0.15;

      ctx.clearRect(0, 0, w, h);

      // Labels
      ctx.fillStyle = '#4a5568'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Несущая (carrier)', 4, 12);
      ctx.fillText('Модулированный сигнал', 4, carrierH + 24);

      // Symbol labels
      ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      const symColors = ['#e74c3c','#3498db','#2ecc71','#e67e22','#9b59b6','#1abc9c','#f1c40f','#e74c3c'];
      symbols.forEach((s, i) => {
        const bitStr = s.toString(2).padStart(bps, '0');
        ctx.fillStyle = symColors[s % symColors.length] + '30';
        ctx.fillRect(i * symW, carrierH + 28, symW, modH);
        ctx.fillStyle = symColors[s % symColors.length];
        ctx.fillText(bitStr, i * symW + symW / 2, carrierH + 24 + modH + 14);
      });
      ctx.textAlign = 'left';

      // Symbol boundary lines
      ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
      for (let i = 0; i <= symbols.length; i++) {
        ctx.beginPath(); ctx.moveTo(i * symW, carrierH + 26); ctx.lineTo(i * symW, carrierH + 28 + modH); ctx.stroke();
      }

      // Zero lines
      ctx.setLineDash([3,3]); ctx.strokeStyle = '#1a203050';
      ctx.beginPath(); ctx.moveTo(0, carrierMid); ctx.lineTo(w, carrierMid); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, modMid); ctx.lineTo(w, modMid); ctx.stroke();
      ctx.setLineDash([]);

      // Carrier wave
      ctx.strokeStyle = '#3498db50'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const y = carrierMid + Math.sin(x * freqMid) * carrierAmp;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // What changes annotation
      const changeLabel = type === 'ask' ? '↕ Амплитуда меняется' : type === 'fsk' ? '↔ Частота меняется' : type === 'bpsk' || type === 'qpsk' ? '⟲ Фаза меняется' : '↕⟲ Амплитуда + Фаза';
      ctx.fillStyle = '#e67e22'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText(changeLabel, w - ctx.measureText(changeLabel).width - 4, carrierH + 24);

      // Modulated signal
      ctx.lineWidth = 2.5; ctx.beginPath();
      let prevPhase = 0;
      for (let x = 0; x < w; x++) {
        const sIdx = Math.min(Math.floor(x / symW), symbols.length - 1);
        const val = symbols[sIdx];
        const maxVal = Math.max(Math.pow(2, bps) - 1, 1);
        let y;
        ctx.strokeStyle = symColors[val % symColors.length];

        if (type === 'ask') {
          const a = val ? 1 : 0.12;
          y = modMid + Math.sin(x * freqMid) * modAmp * a;
        } else if (type === 'fsk') {
          const freq = val ? freqHigh : freqLow;
          y = modMid + Math.sin(x * freq) * modAmp * 0.85;
        } else if (type === 'bpsk') {
          const phase = val ? 0 : Math.PI;
          y = modMid + Math.sin(x * freqMid + phase) * modAmp * 0.85;
        } else if (type === 'qpsk') {
          const phases = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
          y = modMid + Math.sin(x * freqMid + phases[val % 4]) * modAmp * 0.85;
        } else {
          const norm = val / maxVal;
          const a = 0.2 + norm * 0.8;
          const phase = (val % 4) * Math.PI / 2;
          y = modMid + Math.sin(x * freqMid + phase) * modAmp * a;
        }

        if (x === 0 || Math.floor((x - 1) / symW) !== sIdx) {
          ctx.stroke();
          ctx.beginPath();
          ctx.strokeStyle = symColors[val % symColors.length];
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    function render() {
      const isLine = sigView === 'line';
      const enc = isLine ? LINE_CODES[sigEncoding] : MOD_TYPES[sigModulation];
      const ch = CHANNEL_TYPES.find(c => c.id === sigChannel);
      sigText = getLabText();
      const sigBits = getLabBits(4);
      const useFile = labData.type === 'file';
      const breakdown = labData.bytes.slice(0, 4).map((b, i) => ({
        char: useFile ? '0x' + b.toString(16).toUpperCase().padStart(2, '0') : (labData.text[i] || '?'),
        dec: b, hex: b.toString(16).toUpperCase().padStart(2, '0'),
        bin: b.toString(2).padStart(8, '0')
      }));

      container.innerHTML = `
        <div class="sig-section-title">Источник: ${labData.type === 'file' ? '📎 ' + labData.fileName : labData.type === 'random' ? '🎲 Случайные данные' : '✏️ ' + labData.text} (${labData.size} Б)</div>

        <div class="sig-section-title">Байты → Биты (первые ${breakdown.length} символа)</div>
        <div class="enc-step" style="overflow-x:auto">
          <table class="pdu-fields" style="margin:0;font-size:.7rem">
            <tr><td style="width:20%">Символ</td>${breakdown.map(b => `<td style="text-align:center;font-weight:700">${b.char}</td>`).join('')}</tr>
            <tr><td>Десятичный</td>${breakdown.map(b => `<td style="text-align:center">${b.dec}</td>`).join('')}</tr>
            <tr><td>Hex</td>${breakdown.map(b => `<td style="text-align:center;color:var(--accent)">0x${b.hex}</td>`).join('')}</tr>
            <tr><td>Двоичный</td>${breakdown.map(b => `<td style="text-align:center;font-family:monospace;font-size:.65rem">${b.bin}</td>`).join('')}</tr>
          </table>
        </div>

        <div class="sig-section-title">Биты на линии (из вашего сообщения — ${sigBits.length} бит = ${Math.ceil(sigBits.length/8)} байт)</div>
        <div class="sig-bits" id="sigBitsRow">
          ${sigBits.map((b, i) => `<div class="sig-bit sig-bit--${b}" data-idx="${i}">${b}</div>`).join('')}
        </div>

        <div class="sig-section-title">Канал связи</div>
        <select class="ch-phy-select" id="sigChannelSelect">
          ${CHANNEL_TYPES.map(c => `<option value="${c.id}"${c.id === sigChannel ? ' selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
        </select>

        <div class="lab-toggle mb-12">
          <button class="lab-toggle__btn${isLine ? ' active' : ''}" id="sigViewLine">⚡ ${ch.medium === 'copper' ? 'Напряжение' : ch.medium === 'fiber' ? 'Свет' : 'Радиоволна'}</button>
          <button class="lab-toggle__btn${!isLine ? ' active' : ''}" id="sigViewMod">📡 Модуляция</button>
        </div>

        <div class="sig-tabs" id="sigTabs">
          ${isLine
            ? Object.entries(LINE_CODES).map(([k, v]) => `<button class="sig-tab${k === sigEncoding ? ' active' : ''}" data-sig="${k}">${v.name.split('(')[0].trim()}</button>`).join('')
            : Object.entries(MOD_TYPES).map(([k, v]) => `<button class="sig-tab${k === sigModulation ? ' active' : ''}" data-sig="${k}">${v.name.split('(')[0].trim()}</button>`).join('')
          }
        </div>

        <div class="sig-canvas-wrap">
          <canvas id="sigCanvas" style="height:${isLine ? '120px' : '240px'}"></canvas>
          <div class="sig-canvas-label">${isLine
            ? (ch.medium === 'copper' ? '⚡ Напряжение на медном проводе ↕ / Время →' : ch.medium === 'fiber' ? '💡 Мощность света в оптоволокне ↕ / Время →' : '📶 Амплитуда радиосигнала ↕ / Время →')
            : `📡 Вверху: несущая частота | Внизу: модулированный сигнал (${ch.name})`}</div>
        </div>

        <div class="card" style="font-size:.82rem;line-height:1.7">
          <strong>${enc.name}</strong><br>${enc.desc}
          ${enc.where ? `<br><strong>Используется:</strong> ${enc.where}` : ''}
          ${enc.bps ? `<br><strong>Бит на символ:</strong> ${enc.bps}` : ''}
        </div>

        <div class="card mt-12" style="font-size:.78rem;line-height:1.6">
          <strong>Привязка к каналу ${ch.icon} ${ch.name}:</strong><br>
          ${ch.medium === 'copper'
            ? `В медном кабеле биты передаются как уровни напряжения. ${ch.name} использует кодирование ${ch.encoding}. На расстоянии ${ch.maxDist} м сигнал затухает на ${ch.attenuation} дБ/100м. ${ch.duplex === 'full' ? 'Полный дуплекс — передача и приём одновременно.' : 'Полудуплекс — по очереди.'}`
            : ch.medium === 'fiber'
            ? `В оптоволокне биты — это вспышки лазера (1) и отсутствие света (0). Затухание всего ${ch.attenuation} дБ/км — сигнал может идти ${(ch.maxDist/1000).toFixed(0)} км. Невосприимчив к электромагнитным помехам.`
            : `В радиоканале биты модулируют несущую частоту. ${ch.name} использует ${ch.encoding}. Сигнал распространяется со скоростью света, но затухает (${ch.attenuation} дБ) и подвержен помехам (${ch.interference}). ${ch.duplex === 'half' ? 'Полудуплекс (CSMA/CA) — одновременно передаёт только одно устройство.' : 'Полный дуплекс (FDD/TDD).'}`
          }
        </div>
      `;

      const canvas = document.getElementById('sigCanvas');
      if (sigAnimId) cancelAnimationFrame(sigAnimId);

      if (isLine) {
        const allBits = getLabBits(8);
        function animLine(now) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width * dpr;
          canvas.height = 120 * dpr;
          canvas.style.height = '120px';
          const ctx = canvas.getContext('2d');
          ctx.scale(dpr, dpr);
          const w = rect.width, h = 120;
          const offset = ((now || 0) / 80) % (w * 0.5);
          const mid = h / 2, amp = h * 0.35;
          ctx.clearRect(0, 0, w, h);
          ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
          const bitW = w / allBits.length;
          for (let i = 0; i <= allBits.length; i++) {
            const x = i * bitW - offset % bitW;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
          }
          ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#6c7a96'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
          allBits.forEach((b, i) => { const x = i * bitW + bitW / 2 - offset % bitW; if (x > -bitW && x < w + bitW) ctx.fillText(b, x, 12); });
          ctx.textAlign = 'left';
          ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2.5; ctx.beginPath();
          let prev = 0, amiP = 1;
          for (let px = 0; px < w; px++) {
            const realX = px + offset;
            const bi = ((Math.floor(realX / bitW) % allBits.length) + allBits.length) % allBits.length;
            const b = allBits[bi];
            const inBit = (realX % bitW) / bitW;
            let val = 0;
            if (sigEncoding === 'nrz') val = b ? 1 : -1;
            else if (sigEncoding === 'manchester') { val = b ? (inBit < 0.5 ? -1 : 1) : (inBit < 0.5 ? 1 : -1); }
            else if (sigEncoding === 'ami') { if (b) { val = amiP; amiP *= (inBit > 0.9 ? -1 : 1); } }
            else if (sigEncoding === 'nrzi') { if (b) prev = prev ? 0 : 1; val = prev ? 1 : -1; }
            else val = b ? 1 : -1;
            const edge = 0.06;
            if (inBit < edge) val *= inBit / edge;
            const y = mid - val * amp;
            if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
          }
          ctx.stroke();
          ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.arc(w * 0.8, mid, 3, 0, Math.PI * 2); ctx.fill();
          sigAnimId = requestAnimationFrame(animLine);
        }
        sigAnimId = requestAnimationFrame(animLine);
      } else {
        drawModulation(canvas, sigBits, sigModulation);
      }

      container.querySelector('#sigChannelSelect').addEventListener('change', (e) => {
        sigChannel = e.target.value;
        render();
      });

      document.getElementById('sigViewLine')?.addEventListener('click', () => { sigView = 'line'; render(); });
      document.getElementById('sigViewMod')?.addEventListener('click', () => { sigView = 'mod'; render(); });

      container.querySelectorAll('.sig-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          if (sigView === 'line') sigEncoding = tab.dataset.sig;
          else sigModulation = tab.dataset.sig;
          render();
        });
      });
    }

    const observer = new MutationObserver(() => {
      if (document.getElementById('lab-signals')?.classList.contains('active') && !container.children.length) render();
    });
    observer.observe(document.getElementById('lab-signals'), { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { if (document.getElementById('lab-signals')?.classList.contains('active')) render(); }, 100);

    onLabDataChange(() => {
      if (document.getElementById('lab-signals')?.classList.contains('active')) render();
    });
  })();

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
      termLine('═══ Диагностика и мониторинг ═══', 'header');
      const diag = [
        ['ping &lt;host&gt;', 'ICMP эхо — проверка доступности'],
        ['traceroute &lt;host&gt;', 'Трассировка маршрута (хопы)'],
        ['mtr &lt;host&gt;', 'ping + traceroute в реальном времени'],
        ['tcpdump [-i iface] [-c N]', 'Перехват сетевых пакетов'],
        ['nmap &lt;host&gt;', 'Сканирование портов и сервисов'],
      ];
      diag.forEach(c => termLine(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      termLine('');
      termLine('═══ DNS и домены ═══', 'header');
      const dns = [
        ['nslookup &lt;host&gt;', 'DNS-запрос (A, MX, NS записи)'],
        ['whois &lt;domain&gt;', 'Регистрационные данные домена'],
      ];
      dns.forEach(c => termLine(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      termLine('');
      termLine('═══ Интерфейсы и маршруты ═══', 'header');
      const iface = [
        ['ifconfig', 'Сетевые интерфейсы (IP, MAC, MTU)'],
        ['ip addr | route | neigh | link', 'Современная замена ifconfig/route/arp'],
        ['ethtool &lt;iface&gt;', 'Параметры Ethernet (скорость, дуплекс)'],
        ['iwconfig', 'Параметры Wi-Fi (ESSID, сигнал)'],
        ['route', 'Таблица маршрутизации'],
        ['arp', 'ARP-таблица (IP → MAC)'],
        ['hostname', 'Имя машины и FQDN'],
      ];
      iface.forEach(c => termLine(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      termLine('');
      termLine('═══ Соединения и безопасность ═══', 'header');
      const conn = [
        ['ss', 'Socket Statistics (соединения, порты)'],
        ['netstat', 'Активные соединения (устаревший)'],
        ['iptables -L', 'Правила файрвола'],
        ['telnet &lt;host&gt; &lt;port&gt;', 'Проверка TCP-порта'],
        ['ssh &lt;user@host&gt;', 'Удалённое подключение (SSH)'],
      ];
      conn.forEach(c => termLine(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      termLine('');
      termLine('═══ HTTP и файлы ═══', 'header');
      const http = [
        ['curl &lt;url&gt;', 'HTTP-запрос (заголовки ответа)'],
        ['wget &lt;url&gt;', 'Скачать файл'],
      ];
      http.forEach(c => termLine(`  <span class="term-cmd">${c[0].padEnd(30)}</span> ${c[1]}`));
      termLine('');
      termLine('  <span class="term-cmd">clear                         </span> Очистить экран');
      termLine('  <span class="term-cmd">help                          </span> Эта справка');
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

  TERM_COMMANDS.hostname = function() {
    termLine('osi-lab.local');
    termLine('');
    termLine('Hostname:  osi-lab');
    termLine('FQDN:     osi-lab.local');
    termLine('IP:       192.168.1.100');
    addXP(1);
  };

  TERM_COMMANDS.ss = function(args) {
    termLine('State      Recv-Q  Send-Q  Local Address:Port    Peer Address:Port', 'header');
    SIM_NET.connections.forEach(c => {
      const st = c.state || 'UNCONN';
      const rq = st === 'ESTABLISHED' ? Math.floor(Math.random() * 100) : 0;
      termLine(`<span class="${st === 'ESTABLISHED' ? 'term-ok' : 'term-time'}">${st.padEnd(11)}</span>${String(rq).padEnd(8)}0       ${c.local.padEnd(23)}${c.remote}`);
    });
    addXP(2);
  };

  TERM_COMMANDS.tcpdump = async function(args) {
    const iface = args.includes('-i') ? args[args.indexOf('-i') + 1] || 'eth0' : 'eth0';
    const count = args.includes('-c') ? parseInt(args[args.indexOf('-c') + 1]) || 5 : 5;
    termLine(`tcpdump: listening on ${iface}, link-type EN10MB (Ethernet), capture size 262144 bytes`);
    termScroll();
    const protos = ['TCP','UDP','ICMP','TCP','TCP','UDP','TCP','ARP'];
    const ports = [80,443,53,22,8080,3000,5432,0];
    for (let i = 0; i < Math.min(count, 8); i++) {
      await sleep(400 + Math.random() * 300);
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(Math.floor(Math.random()*999)).padStart(3,'0')}`;
      const proto = protos[i % protos.length];
      const srcP = 49000 + Math.floor(Math.random() * 16000);
      const dstP = ports[i % ports.length] || 443;
      const len = 40 + Math.floor(Math.random() * 1400);
      if (proto === 'ARP') {
        termLine(`<span class="term-time">${ts}</span> ARP, Request who-has 192.168.1.1 tell <span class="term-ip">192.168.1.100</span>, length 28`);
      } else if (proto === 'ICMP') {
        termLine(`<span class="term-time">${ts}</span> IP <span class="term-ip">192.168.1.100</span> > 8.8.8.8: ICMP echo request, id ${1000+i}, seq ${i+1}, length 64`);
      } else {
        const flags = proto === 'TCP' ? ['[S]','[S.]','[.]','[P.]','[F.]'][Math.floor(Math.random()*5)] : '';
        const src = `<span class="term-ip">192.168.1.100</span>.${srcP}`;
        const dst = `<span class="term-ip">${93+i*10}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${1+Math.floor(Math.random()*254)}</span>.${dstP}`;
        termLine(`<span class="term-time">${ts}</span> IP ${src} > ${dst}: ${proto} ${flags} seq ${1000+i*1460}:${1000+(i+1)*1460}, ack ${5000+i*100}, win 65535, length ${len}`);
      }
      termScroll();
    }
    termLine(`\n${count} packets captured`);
    addXP(3);
  };

  TERM_COMMANDS.nmap = async function(args) {
    const host = args[0];
    if (!host) { termLine('Использование: nmap &lt;host&gt;', 'error'); return; }
    const resolved = resolveHost(host);
    termLine(`Starting Nmap 7.94 ( https://nmap.org )`);
    termLine(`Nmap scan report for ${host} (${resolved.ip})`);
    termLine(`Host is up (<span class="term-time">${(0.005 + Math.random() * 0.03).toFixed(3)}s</span> latency).\n`);
    await sleep(800);
    termLine('PORT      STATE    SERVICE         VERSION', 'header');
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
      termLine(`${p[0].padEnd(10)}<span class="${stColor}">${p[1].padEnd(9)}</span>${p[2].padEnd(16)}${p[3]}`);
      termScroll();
    }
    termLine(`\nNmap done: 1 IP address (1 host up) scanned in <span class="term-time">${(2 + Math.random() * 3).toFixed(2)}</span> seconds`);
    addXP(3);
  };

  TERM_COMMANDS.iptables = function(args) {
    if (args[0] === '-L' || args.length === 0) {
      termLine('Chain INPUT (policy ACCEPT)', 'header');
      termLine('target     prot  source          destination');
      termLine('<span class="term-ok">ACCEPT</span>     tcp   0.0.0.0/0       0.0.0.0/0       tcp dpt:22');
      termLine('<span class="term-ok">ACCEPT</span>     tcp   0.0.0.0/0       0.0.0.0/0       tcp dpt:80');
      termLine('<span class="term-ok">ACCEPT</span>     tcp   0.0.0.0/0       0.0.0.0/0       tcp dpt:443');
      termLine('<span class="term-fail">DROP</span>       tcp   0.0.0.0/0       0.0.0.0/0       tcp dpt:3306');
      termLine('<span class="term-ok">ACCEPT</span>     icmp  0.0.0.0/0       0.0.0.0/0');
      termLine('');
      termLine('Chain FORWARD (policy DROP)', 'header');
      termLine('target     prot  source          destination');
      termLine('');
      termLine('Chain OUTPUT (policy ACCEPT)', 'header');
      termLine('target     prot  source          destination');
      termLine('<span class="term-ok">ACCEPT</span>     all   0.0.0.0/0       0.0.0.0/0');
    } else {
      termLine(`iptables: правило ${args.join(' ')} добавлено (симуляция)`, 'info');
    }
    addXP(2);
  };

  TERM_COMMANDS.telnet = async function(args) {
    const host = args[0] || 'localhost';
    const port = args[1] || '80';
    const resolved = resolveHost(host);
    termLine(`Trying <span class="term-ip">${resolved.ip}</span>...`);
    await sleep(600);
    if (['80','443','22','8080'].includes(port)) {
      termLine(`Connected to ${host}.`);
      termLine(`Escape character is '^]'.`);
      if (port === '80') termLine('<span class="term-info">HTTP/1.1 200 OK</span>');
      else if (port === '22') termLine('<span class="term-info">SSH-2.0-OpenSSH_8.9</span>');
    } else {
      termLine(`<span class="term-fail">telnet: Unable to connect to remote host: Connection refused</span>`);
    }
    addXP(2);
  };

  TERM_COMMANDS.nc = TERM_COMMANDS.telnet;
  TERM_COMMANDS.netcat = TERM_COMMANDS.telnet;

  TERM_COMMANDS.mtr = async function(args) {
    const host = args[0];
    if (!host) { termLine('Использование: mtr &lt;host&gt;', 'error'); return; }
    const resolved = resolveHost(host);
    termLine(`mtr to ${host} (${resolved.ip})`, 'header');
    termLine('Host                          Loss%  Snt   Last   Avg  Best  Wrst', 'header');
    for (let i = 0; i < resolved.hops + 1; i++) {
      await sleep(300);
      const rIp = i === resolved.hops ? resolved.ip : `${10+i*12}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${1+Math.floor(Math.random()*254)}`;
      const rName = i === resolved.hops ? host : `hop-${i+1}.net`;
      const base = (i+1) * 2.5 + Math.random() * 3;
      const loss = Math.random() < 0.1 ? (Math.random()*5).toFixed(1) : '0.0';
      termLine(`${String(i+1).padStart(2)}. ${(rName+' ('+rIp+')').padEnd(36)} <span class="${parseFloat(loss) > 0 ? 'term-fail' : 'term-ok'}">${loss.padStart(5)}%</span>   10  <span class="term-time">${base.toFixed(1).padStart(5)}  ${(base+1).toFixed(1).padStart(5)}  ${(base-1).toFixed(1).padStart(5)}  ${(base+5).toFixed(1).padStart(5)}</span>`);
      termScroll();
    }
    addXP(3);
  };

  TERM_COMMANDS.ethtool = function(args) {
    const iface = args[0] || 'eth0';
    const ifData = SIM_NET.interfaces.find(i => i.name === iface);
    if (!ifData) { termLine(`ethtool: ${iface}: нет такого интерфейса`, 'error'); return; }
    termLine(`Settings for ${iface}:`, 'header');
    termLine(`        Speed: ${iface === 'lo' ? '10000Mb/s' : '1000Mb/s'}`);
    termLine(`        Duplex: Full`);
    termLine(`        Auto-negotiation: on`);
    termLine(`        Port: Twisted Pair`);
    termLine(`        Link detected: <span class="term-ok">yes</span>`);
    termLine(`        Supported link modes:   10baseT/Half 10baseT/Full`);
    termLine(`                                100baseT/Half 100baseT/Full`);
    termLine(`                                1000baseT/Full`);
    termLine(`        Supports Wake-on: g`);
    termLine(`        Wake-on: d`);
    termLine(`        Current message level: 0x00000007 (7)`);
    termLine(`        Driver: e1000e`);
    termLine(`        Firmware-version: 3.25`);
    addXP(2);
  };

  TERM_COMMANDS.iwconfig = function(args) {
    termLine('wlan0     IEEE 802.11  ESSID:"OSI-Lab-5G"', 'header');
    termLine('          Mode:Managed  Frequency:5.18 GHz  Access Point: 00:1A:2B:3C:4D:5E');
    termLine('          Bit Rate=866.7 Mb/s   Tx-Power=20 dBm');
    termLine('          Retry short limit:7   RTS thr:off   Fragment thr:off');
    termLine('          Power Management:on');
    termLine('          Link Quality=<span class="term-ok">68/70</span>  Signal level=<span class="term-ok">-42 dBm</span>');
    termLine('          Rx invalid nwid:0  Rx invalid crypt:0  Rx invalid frag:0');
    termLine('          Tx excessive retries:3  Invalid misc:0   Missed beacon:0');
    termLine('');
    termLine('eth0      no wireless extensions.');
    termLine('lo        no wireless extensions.');
    addXP(2);
  };

  TERM_COMMANDS.wget = async function(args) {
    const url = args[0] || 'http://example.com/index.html';
    const host = url.replace(/^https?:\/\//, '').split('/')[0];
    const file = url.split('/').pop() || 'index.html';
    termLine(`--${new Date().toISOString().replace('T',' ').slice(0,19)}--  ${url}`);
    termLine(`Resolving ${host}... <span class="term-ip">${resolveHost(host).ip}</span>`);
    termLine(`Connecting to ${host}... connected.`);
    termLine(`HTTP request sent, awaiting response... <span class="term-ok">200 OK</span>`);
    termLine(`Length: 12543 (12K) [text/html]`);
    termLine(`Saving to: '${file}'`);
    await sleep(400);
    termLine('');
    termLine(`${file}            100%[===================>]  12.25K  --.-KB/s    in 0.001s`);
    termLine(`\n<span class="term-ok">'${file}' saved [12543/12543]</span>`);
    addXP(2);
  };

  TERM_COMMANDS.ssh = function(args) {
    const target = args[0] || 'user@server';
    const host = target.includes('@') ? target.split('@')[1] : target;
    const resolved = resolveHost(host);
    termLine(`ssh: connect to host ${host} port 22 (${resolved.ip})`);
    termLine('Host key fingerprint: SHA256:' + Array.from({length:32}, () => Math.floor(Math.random()*16).toString(16)).join(''));
    termLine('<span class="term-ok">Authentication successful (publickey).</span>');
    termLine(`Welcome to ${host} (Ubuntu 22.04.3 LTS)`);
    termLine(`Last login: ${new Date(Date.now() - 86400000).toUTCString()}`);
    addXP(2);
  };

  TERM_COMMANDS.tracert = TERM_COMMANDS.traceroute;
  TERM_COMMANDS.dig = TERM_COMMANDS.nslookup;
  TERM_COMMANDS.host = TERM_COMMANDS.nslookup;
  TERM_COMMANDS['ip'] = function(args) {
    if (args[0] === 'addr' || args[0] === 'a') TERM_COMMANDS.ifconfig();
    else if (args[0] === 'route' || args[0] === 'r') TERM_COMMANDS.route();
    else if (args[0] === 'neigh' || args[0] === 'n') TERM_COMMANDS.arp();
    else if (args[0] === 'link' || args[0] === 'l') {
      SIM_NET.interfaces.forEach(i => termLine(`${i.name}: <${i.status},BROADCAST,MULTICAST> mtu ${i.mtu} link/ether ${i.mac}`));
    }
    else termLine('Использование: ip addr | ip route | ip neigh | ip link', 'error');
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
