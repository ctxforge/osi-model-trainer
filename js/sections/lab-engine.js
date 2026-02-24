import { LAB_GROUPS, LAB_EXPERIMENTS } from '../data/experiments.js';

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
import { initSignalsLab } from '../labs/signals-l1.js';
import { runTls } from '../labs/tls.js';

/* ==================== LAB STATE ==================== */
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

function initLabEngine() {
  buildLabTabs();
  buildLabParams();

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

  // Initialize self-initializing labs
  initDevicesLab();
  initChannelPhysics();
  initNetBuilder();
  initJourney();
  initMuxLab();
  initEncryptLab();
  initSignalsLab();
}

export { labState, initLabEngine };
