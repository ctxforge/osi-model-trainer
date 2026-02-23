(function () {
  'use strict';

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
  }

  selectStudyLayer(7);

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
  let simAnimating = false;

  function buildSimStacks() {
    ['simSenderStack', 'simReceiverStack'].forEach(id => {
      const container = document.getElementById(id);
      const title = container.querySelector('.sim-stack__title');
      container.innerHTML = '';
      container.appendChild(title);
      OSI_LAYERS.forEach(layer => {
        const el = document.createElement('div');
        el.className = 'sim-stack__layer';
        el.dataset.layer = layer.number;
        el.style.background = layer.color;
        el.textContent = `L${layer.number} ${layer.name}`;
        container.appendChild(el);
      });
    });

    const packet = document.getElementById('simPacket');
    const titleEl = packet.querySelector('.sim-packet__title');
    packet.innerHTML = '';
    packet.appendChild(titleEl);
    ENCAPSULATION_HEADERS.forEach(h => {
      if (h.layer === 7) return;
      const el = document.createElement('div');
      el.className = 'sim-packet__header';
      el.dataset.layer = h.layer;
      el.style.background = h.color;
      el.textContent = h.short;
      packet.appendChild(el);
    });
    const msg = document.createElement('div');
    msg.className = 'sim-packet__msg';
    msg.id = 'simPacketMsg';
    msg.textContent = '…';
    packet.appendChild(msg);
  }

  buildSimStacks();

  const simSpeed = document.getElementById('simSpeed');
  const simSpeedLabel = document.getElementById('simSpeedLabel');
  simSpeed.addEventListener('input', () => {
    simSpeedLabel.textContent = simSpeed.value + 'мс';
  });

  function resetSim() {
    document.querySelectorAll('.sim-stack__layer').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sim-packet__header').forEach(el => el.classList.remove('visible'));
    document.getElementById('simPacketMsg').textContent = '…';
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function runEncapsulation() {
    if (simAnimating) return;
    simAnimating = true;
    resetSim();
    const msg = document.getElementById('simMessage').value || 'Hello';
    const speed = parseInt(simSpeed.value);
    document.getElementById('simPacketMsg').textContent = msg;

    const senderLayers = document.querySelectorAll('#simSenderStack .sim-stack__layer');
    const headers = document.querySelectorAll('.sim-packet__header');

    for (let i = 0; i < senderLayers.length; i++) {
      senderLayers[i].classList.add('active');
      if (i > 0) {
        const h = headers[i - 1];
        if (h) h.classList.add('visible');
      }
      await sleep(speed);
    }
    simAnimating = false;
  }

  async function runDecapsulation() {
    if (simAnimating) return;
    simAnimating = true;
    const speed = parseInt(simSpeed.value);

    const receiverLayers = document.querySelectorAll('#simReceiverStack .sim-stack__layer');
    const headers = Array.from(document.querySelectorAll('.sim-packet__header')).reverse();

    for (let i = receiverLayers.length - 1; i >= 0; i--) {
      receiverLayers[i].classList.add('active');
      if (i < receiverLayers.length - 1) {
        const h = headers[receiverLayers.length - 2 - i];
        if (h) h.classList.remove('visible');
      }
      await sleep(speed);
    }
    simAnimating = false;
  }

  async function runFullCycle() {
    if (simAnimating) return;
    resetSim();
    await runEncapsulation();
    await sleep(parseInt(simSpeed.value));
    await runDecapsulation();
  }

  document.getElementById('simEncap').addEventListener('click', () => { resetSim(); runEncapsulation(); });
  document.getElementById('simDecap').addEventListener('click', () => {
    resetSim();
    const msg = document.getElementById('simMessage').value || 'Hello';
    document.getElementById('simPacketMsg').textContent = msg;
    document.querySelectorAll('#simSenderStack .sim-stack__layer').forEach(el => el.classList.add('active'));
    document.querySelectorAll('.sim-packet__header').forEach(el => el.classList.add('visible'));
    setTimeout(runDecapsulation, 300);
  });
  document.getElementById('simFull').addEventListener('click', runFullCycle);

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
