import { LAB_GROUPS, LAB_EXPERIMENTS } from '../data/experiments.js';
import { navigateTo } from '../core/router.js';

import { runPacketTransmission } from '../labs/packet-transmission.js';
import { runFragmentation } from '../labs/fragmentation.js';
import { runRouting } from '../labs/routing.js';
import { runIpCalc } from '../labs/ip-calc.js';
import { runTcpHandshake } from '../labs/tcp-handshake.js';
import { runScenario } from '../labs/scenario.js';
import { initDevicesLab } from '../labs/devices.js';
import { runTcpVsUdp } from '../labs/tcp-vs-udp.js';
import { initChannelPhysics } from '../labs/channel-physics.js';
import { initNetBuilder } from '../labs/net-builder.js';
import { initJourney } from '../labs/journey.js';
import { initMuxLab } from '../labs/multiplexing.js';
import { initEncryptLab } from '../labs/encryption.js';
import { initVlanSim } from '../labs/vlan-sim.js';
import { initFirewallSim } from '../labs/firewall-sim.js';
import { initSignalsLab } from '../labs/signals-l1.js';
import { runTls } from '../labs/tls.js';
import { initTcpStateMachine } from '../labs/tcp-state-machine.js';
import { runTcpCongestion } from '../labs/tcp-congestion.js';
import { runTcpWindow } from '../labs/tcp-window.js';
import { initOscilloscope } from '../labs/oscilloscope.js';
import { runRoutingSim } from '../labs/routing-sim.js';
import { initTopologyBuilder } from '../labs/topology-builder.js';

/* ==================== UTILS ==================== */
function throttle(fn, ms) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn.apply(this, args); }
  };
}

/* ==================== LAB STATE ==================== */
const labState = {};

let activeLabGroup = 'overview';
let showDashboard = true;

function buildLabDashboard() {
  const container = document.getElementById('labTabs');
  const dataPanel = document.getElementById('labDataPanel');
  if (dataPanel) dataPanel.style.display = 'none';

  // Hide all lab-content panels when showing dashboard
  document.querySelectorAll('.lab-content').forEach(c => c.classList.remove('active'));

  let html = '<div class="lab-dashboard__header"><h2>Лаборатории</h2><p>Выберите категорию для начала экспериментов</p></div>';
  html += '<div class="lab-dashboard">';

  LAB_GROUPS.forEach(group => {
    const expChips = group.experiments.map(key => {
      const exp = LAB_EXPERIMENTS[key];
      if (!exp) return '';
      return `<span class="lab-dashboard__exp-chip">${exp.icon} ${exp.title}</span>`;
    }).join('');

    html += `<div class="lab-dashboard__card" data-dash-group="${group.id}">
      <div class="lab-dashboard__icon">${group.name.split(' ')[0]}</div>
      <div class="lab-dashboard__title">${group.name.split(' ').slice(1).join(' ')}</div>
      <div class="lab-dashboard__count">${group.experiments.length} экспериментов</div>
      <div class="lab-dashboard__desc">${group.desc}</div>
      <div class="lab-dashboard__experiments">${expChips}</div>
    </div>`;
  });

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('[data-dash-group]').forEach(card => {
    card.addEventListener('click', () => {
      showDashboard = false;
      activeLabGroup = card.dataset.dashGroup;
      buildLabTabs();
    });
  });
}

function buildLabTabs() {
  const container = document.getElementById('labTabs');
  const dataPanel = document.getElementById('labDataPanel');
  if (dataPanel) dataPanel.style.display = '';

  const group = LAB_GROUPS.find(g => g.id === activeLabGroup) || LAB_GROUPS[0];

  // Back button
  let html = '<button class="lab-back-btn" id="labBackBtn">← Все лаборатории</button>';

  // Group pills row
  html += '<div class="lab-groups">';
  LAB_GROUPS.forEach(g => {
    html += `<button class="lab-group-btn${g.id === activeLabGroup ? ' active' : ''}" data-group="${g.id}">
      <span class="lab-group-btn__icon">${g.name.split(' ')[0]}</span>
      <span class="lab-group-btn__label">${g.name.split(' ').slice(1).join(' ')}</span>
    </button>`;
  });
  html += '</div>';

  // Group description
  html += `<div class="lab-group-desc">${group.desc}</div>`;

  // Experiment tabs
  html += '<div class="lab-exp-tabs">';
  group.experiments.forEach((key, i) => {
    const exp = LAB_EXPERIMENTS[key];
    if (!exp) return;
    html += `<button class="lab-tab${i === 0 ? ' active' : ''}" data-lab="${key}">
      <span class="lab-tab__icon">${exp.icon}</span>
      <span class="lab-tab__name">${exp.title}</span>
    </button>`;
  });
  html += '</div>';

  container.innerHTML = html;

  // Back button handler
  document.getElementById('labBackBtn')?.addEventListener('click', () => {
    showDashboard = true;
    buildLabDashboard();
  });

  // Group switching
  container.querySelectorAll('[data-group]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeLabGroup = btn.dataset.group;
      buildLabTabs();
      const grp = LAB_GROUPS.find(g => g.id === activeLabGroup);
      if (grp && grp.experiments[0]) switchLabTab(grp.experiments[0]);
    });
  });

  // Experiment switching
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
        range.addEventListener('input', throttle(() => {
          labState[key][param.id] = parseFloat(range.value);
          valEl.textContent = range.value + (param.unit ? ' ' + param.unit : '');
        }, 16));
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

/* ==================== ARP DISCOVERY ==================== */
async function runArpDiscovery(state) {
  const out = document.getElementById('labResult-arpDiscovery');
  if (!out) return;
  const delay = state.arpDiscovery?.speed || 500;
  const srcMAC = '00:1A:2B:3C:4D:5E';
  const dstMAC = '00:AA:BB:CC:DD:EE';
  const srcIP = '192.168.1.10';
  const dstIP = '192.168.1.1';

  const steps = [
    { label: '1. ARP Request (Broadcast)', from: 'PC', to: 'Сеть', color: '#e74c3c',
      detail: `Кто имеет ${dstIP}? Скажите ${srcIP} (${srcMAC})`, type: 'FF:FF:FF:FF:FF:FF' },
    { label: '2. Switch пересылает на все порты', from: 'Switch', to: 'Все порты', color: '#f39c12',
      detail: 'Broadcast → flooding на все порты, кроме входящего', type: 'flooding' },
    { label: '3. Целевое устройство отвечает', from: 'Router', to: 'PC', color: '#27ae60',
      detail: `${dstIP} это ${dstMAC}`, type: 'unicast' },
    { label: '4. ARP-кэш обновлён', from: '—', to: '—', color: '#3498db',
      detail: `PC запомнил: ${dstIP} → ${dstMAC} (TTL 120с)`, type: 'cache' }
  ];

  out.innerHTML = '<div class="card"><div id="arpSteps"></div><div id="arpTable" style="margin-top:12px"></div></div>';
  const stepsEl = document.getElementById('arpSteps');
  const tableEl = document.getElementById('arpTable');

  for (const step of steps) {
    await new Promise(r => setTimeout(r, delay));
    stepsEl.innerHTML += `<div style="padding:8px 12px;margin-bottom:6px;border-left:3px solid ${step.color};background:var(--bg-card);border-radius:4px;animation:fadeIn .3s">
      <div style="font-weight:700;font-size:.85rem;color:${step.color}">${step.label}</div>
      <div style="font-size:.8rem;color:var(--text-secondary);margin-top:2px">${step.detail}</div>
      <div style="font-size:.7rem;color:var(--text-secondary);opacity:.7">Тип: ${step.type}</div>
    </div>`;
  }

  tableEl.innerHTML = `<div style="font-weight:700;font-size:.85rem;margin-bottom:6px">📋 ARP-таблица PC:</div>
    <table style="width:100%;font-size:.8rem;border-collapse:collapse">
      <tr style="background:var(--bg-main)"><th style="padding:4px 8px;text-align:left">IP</th><th style="padding:4px 8px;text-align:left">MAC</th><th style="padding:4px 8px;text-align:left">TTL</th></tr>
      <tr><td style="padding:4px 8px">${dstIP}</td><td style="padding:4px 8px;font-family:monospace">${dstMAC}</td><td style="padding:4px 8px">120 с</td></tr>
    </table>`;
}

/* ==================== NAT TRAVERSAL ==================== */
async function runNatTraversal(state) {
  const out = document.getElementById('labResult-natTraversal');
  if (!out) return;
  const delay = state.natTraversal?.speed || 400;
  const natType = state.natTraversal?.natType ?? 2;
  const types = ['Static NAT', 'Dynamic NAT', 'PAT'];

  const entries = natType === 0 ? [
    { inside: '192.168.1.10', insPort: '*', outside: '203.0.113.10', outPort: '*', dst: '8.8.8.8' }
  ] : natType === 1 ? [
    { inside: '192.168.1.10', insPort: '*', outside: '203.0.113.10', outPort: '*', dst: '8.8.8.8' },
    { inside: '192.168.1.11', insPort: '*', outside: '203.0.113.11', outPort: '*', dst: '1.1.1.1' }
  ] : [
    { inside: '192.168.1.10', insPort: '49152', outside: '203.0.113.1', outPort: '10001', dst: '8.8.8.8:443' },
    { inside: '192.168.1.11', insPort: '49153', outside: '203.0.113.1', outPort: '10002', dst: '8.8.8.8:443' },
    { inside: '192.168.1.10', insPort: '49154', outside: '203.0.113.1', outPort: '10003', dst: '1.1.1.1:80' }
  ];

  const steps = [
    { label: '1. Пакет из внутренней сети', color: '#3498db',
      detail: `Src: ${entries[0].inside}:${entries[0].insPort} → Dst: ${entries[0].dst}` },
    { label: `2. NAT-роутер транслирует (${types[natType]})`, color: '#e67e22',
      detail: natType === 2
        ? `Src: ${entries[0].inside}:${entries[0].insPort} → ${entries[0].outside}:${entries[0].outPort} (PAT: один внешний IP, разные порты)`
        : `Src: ${entries[0].inside} → ${entries[0].outside} (${types[natType]}: ${natType === 0 ? 'статическое соответствие' : 'из пула адресов'})` },
    { label: '3. Пакет уходит в интернет', color: '#27ae60',
      detail: `Src: ${entries[0].outside}:${entries[0].outPort} → Dst: ${entries[0].dst}` },
    { label: '4. Ответ приходит обратно', color: '#9b59b6',
      detail: `NAT находит запись в таблице и транслирует обратно: ${entries[0].outside}:${entries[0].outPort} → ${entries[0].inside}:${entries[0].insPort}` }
  ];

  out.innerHTML = '<div class="card"><div id="natSteps"></div><div id="natTable" style="margin-top:12px"></div></div>';
  const stepsEl = document.getElementById('natSteps');

  for (const step of steps) {
    await new Promise(r => setTimeout(r, delay));
    stepsEl.innerHTML += `<div style="padding:8px 12px;margin-bottom:6px;border-left:3px solid ${step.color};background:var(--bg-card);border-radius:4px;animation:fadeIn .3s">
      <div style="font-weight:700;font-size:.85rem;color:${step.color}">${step.label}</div>
      <div style="font-size:.8rem;color:var(--text-secondary);margin-top:2px">${step.detail}</div>
    </div>`;
  }

  await new Promise(r => setTimeout(r, delay));
  const tableEl = document.getElementById('natTable');
  tableEl.innerHTML = `<div style="font-weight:700;font-size:.85rem;margin-bottom:6px">📋 NAT-таблица (${types[natType]}):</div>
    <table style="width:100%;font-size:.75rem;border-collapse:collapse">
      <tr style="background:var(--bg-main)">
        <th style="padding:4px 6px;text-align:left">Inside</th><th style="padding:4px 6px;text-align:left">Port</th>
        <th style="padding:4px 6px;text-align:left">Outside</th><th style="padding:4px 6px;text-align:left">Port</th>
        <th style="padding:4px 6px;text-align:left">Destination</th>
      </tr>
      ${entries.map(e => `<tr>
        <td style="padding:4px 6px;font-family:monospace">${e.inside}</td><td style="padding:4px 6px">${e.insPort}</td>
        <td style="padding:4px 6px;font-family:monospace">${e.outside}</td><td style="padding:4px 6px">${e.outPort}</td>
        <td style="padding:4px 6px;font-family:monospace">${e.dst}</td>
      </tr>`).join('')}
    </table>`;
}

/* ==================== DHCP LEASE ==================== */
async function runDhcpLease(state) {
  const out = document.getElementById('labResult-dhcpLease');
  if (!out) return;
  const delay = state.dhcpLease?.speed || 600;

  const clientMAC = '00:1A:2B:3C:4D:5E';
  const offeredIP = '192.168.1.100';
  const serverIP = '192.168.1.1';
  const subnet = '255.255.255.0';
  const gateway = '192.168.1.1';
  const dns = '8.8.8.8';
  const lease = 86400;
  const txnId = '0x' + Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');

  const steps = [
    { label: 'D — Discover', from: 'Клиент', to: 'Broadcast', color: '#e74c3c', icon: '📢',
      detail: `Клиент (${clientMAC}) → 255.255.255.255:67<br>«Мне нужен IP-адрес!» Transaction ID: ${txnId}`,
      packet: `Src: 0.0.0.0:68 → Dst: 255.255.255.255:67 | Op: BOOTREQUEST | XID: ${txnId}` },
    { label: 'O — Offer', from: 'DHCP-сервер', to: 'Клиент', color: '#f39c12', icon: '📨',
      detail: `Сервер ${serverIP} предлагает ${offeredIP}<br>Маска: ${subnet} | Шлюз: ${gateway} | DNS: ${dns}`,
      packet: `Src: ${serverIP}:67 → Dst: 255.255.255.255:68 | yiaddr: ${offeredIP} | Lease: ${lease}s` },
    { label: 'R — Request', from: 'Клиент', to: 'Broadcast', color: '#3498db', icon: '✋',
      detail: `Клиент принимает предложение от ${serverIP}<br>«Хочу именно ${offeredIP}!» (broadcast, чтобы другие DHCP-серверы знали)`,
      packet: `Src: 0.0.0.0:68 → Dst: 255.255.255.255:67 | Option 54: ${serverIP} | Option 50: ${offeredIP}` },
    { label: 'A — Acknowledge', from: 'DHCP-сервер', to: 'Клиент', color: '#27ae60', icon: '✅',
      detail: `Подтверждение: ${offeredIP} закреплён за ${clientMAC}<br>Аренда: ${lease / 3600} ч | T1 (renewal): ${lease / 7200} ч | T2 (rebind): ${lease * 7 / 8 / 3600} ч`,
      packet: `Src: ${serverIP}:67 → Dst: ${offeredIP}:68 | ACK | Lease: ${lease}s` }
  ];

  out.innerHTML = '<div class="card"><div id="dhcpSteps"></div><div id="dhcpSummary" style="margin-top:12px"></div></div>';
  const stepsEl = document.getElementById('dhcpSteps');

  for (const step of steps) {
    await new Promise(r => setTimeout(r, delay));
    stepsEl.innerHTML += `<div style="padding:8px 12px;margin-bottom:6px;border-left:3px solid ${step.color};background:var(--bg-card);border-radius:4px;animation:fadeIn .3s">
      <div style="font-weight:700;font-size:.9rem;color:${step.color}">${step.icon} ${step.label}</div>
      <div style="font-size:.8rem;color:var(--text-secondary);margin-top:4px">${step.detail}</div>
      <div style="font-size:.7rem;font-family:monospace;color:var(--text-secondary);opacity:.7;margin-top:4px;word-break:break-all">${step.packet}</div>
    </div>`;
  }

  await new Promise(r => setTimeout(r, delay));
  const summaryEl = document.getElementById('dhcpSummary');
  summaryEl.innerHTML = `<div style="font-weight:700;font-size:.85rem;margin-bottom:6px">📋 Результат конфигурации:</div>
    <table style="width:100%;font-size:.8rem;border-collapse:collapse">
      <tr><td style="padding:4px 8px;font-weight:600">IP-адрес</td><td style="padding:4px 8px;font-family:monospace">${offeredIP}</td></tr>
      <tr style="background:var(--bg-main)"><td style="padding:4px 8px;font-weight:600">Маска подсети</td><td style="padding:4px 8px;font-family:monospace">${subnet}</td></tr>
      <tr><td style="padding:4px 8px;font-weight:600">Шлюз</td><td style="padding:4px 8px;font-family:monospace">${gateway}</td></tr>
      <tr style="background:var(--bg-main)"><td style="padding:4px 8px;font-weight:600">DNS</td><td style="padding:4px 8px;font-family:monospace">${dns}</td></tr>
      <tr><td style="padding:4px 8px;font-weight:600">Аренда</td><td style="padding:4px 8px">${lease / 3600} часов</td></tr>
      <tr style="background:var(--bg-main)"><td style="padding:4px 8px;font-weight:600">DHCP-сервер</td><td style="padding:4px 8px;font-family:monospace">${serverIP}</td></tr>
    </table>`;
}

function initLabEngine() {
  buildLabDashboard();
  buildLabParams();

  // Sidebar lab-group navigation
  document.querySelectorAll('[data-lab-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo('lab');
      showDashboard = false;
      activeLabGroup = btn.dataset.labNav;
      buildLabTabs();
    });
  });

  // Register click handlers for labs with run buttons
  document.getElementById('labRun-packetTransmission')?.addEventListener('click', () => {
    runPacketTransmission(labState);
  });

  document.getElementById('labRun-fragmentation')?.addEventListener('click', () => {
    runFragmentation(labState);
  });

  document.getElementById('labRun-routing')?.addEventListener('click', async () => {
    await runRouting(labState);
  });

  document.getElementById('labRun-ipCalc')?.addEventListener('click', () => {
    runIpCalc(labState);
  });

  document.getElementById('labRun-tcpHandshake')?.addEventListener('click', async () => {
    await runTcpHandshake(labState);
  });

  document.getElementById('labRun-scenario')?.addEventListener('click', async () => {
    await runScenario();
  });

  document.getElementById('labRun-tcpVsUdp')?.addEventListener('click', async () => {
    await runTcpVsUdp(labState);
  });

  document.getElementById('labRun-tls')?.addEventListener('click', async () => {
    await runTls(labState);
  });

  document.getElementById('labRun-tcpCongestion')?.addEventListener('click', () => {
    runTcpCongestion(labState);
  });

  document.getElementById('labRun-tcpWindow')?.addEventListener('click', async () => {
    await runTcpWindow(labState);
  });

  document.getElementById('labRun-routingSim')?.addEventListener('click', () => {
    runRoutingSim(labState);
  });

  // Initialize self-initializing labs
  initTcpStateMachine();
  initDevicesLab();
  initChannelPhysics();
  initNetBuilder();
  initJourney();
  initMuxLab();
  initEncryptLab();
  initVlanSim();
  initFirewallSim();
  initSignalsLab();
  initOscilloscope();
  initTopologyBuilder();

  // Redirect buttons to physics-lab / multiplexing
  document.getElementById('labGo-signalGenerator')?.addEventListener('click', () => navigateTo('siggen'));
  document.getElementById('labGo-channelTransmit')?.addEventListener('click', () => navigateTo('siggen'));
  document.getElementById('labGo-spectrumAnalyzer')?.addEventListener('click', () => navigateTo('siggen'));
  document.getElementById('labGo-wdmMultiplex')?.addEventListener('click', () => {
    activeLabGroup = 'l1';
    buildLabTabs();
    switchLabTab('multiplexing');
  });

  // ARP Discovery
  document.getElementById('labRun-arpDiscovery')?.addEventListener('click', () => {
    runArpDiscovery(labState);
  });

  // NAT Traversal
  document.getElementById('labRun-natTraversal')?.addEventListener('click', () => {
    runNatTraversal(labState);
  });

  // DHCP Lease
  document.getElementById('labRun-dhcpLease')?.addEventListener('click', () => {
    runDhcpLease(labState);
  });
}

export { labState, initLabEngine };
