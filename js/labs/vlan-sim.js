import { addXP, unlockAchievement } from '../core/gamification.js';

/* ============================================================
   VLAN Simulator — 802.1Q tagging, trunk ports, inter-VLAN routing
   ============================================================ */

const INITIAL_SWITCH = {
  ports: [
    { id: 1, mode: 'access', vlan: 1, label: 'PC-A', mac: 'AA:AA:AA:00:00:01' },
    { id: 2, mode: 'access', vlan: 1, label: 'PC-B', mac: 'AA:AA:AA:00:00:02' },
    { id: 3, mode: 'access', vlan: 10, label: 'PC-C', mac: 'AA:AA:AA:00:00:03' },
    { id: 4, mode: 'access', vlan: 10, label: 'PC-D', mac: 'AA:AA:AA:00:00:04' },
    { id: 5, mode: 'access', vlan: 20, label: 'PC-E', mac: 'AA:AA:AA:00:00:05' },
    { id: 6, mode: 'access', vlan: 20, label: 'PC-F', mac: 'AA:AA:AA:00:00:06' },
    { id: 7, mode: 'trunk', vlan: 1, label: 'Uplink', mac: '', allowedVlans: [1, 10, 20, 30], nativeVlan: 1 },
    { id: 8, mode: 'trunk', vlan: 1, label: 'Router', mac: '', allowedVlans: [1, 10, 20, 30], nativeVlan: 1 }
  ],
  vlans: [
    { id: 1, name: 'Default', color: '#6c7a96' },
    { id: 10, name: 'Engineering', color: '#3498db' },
    { id: 20, name: 'Sales', color: '#2ecc71' },
    { id: 30, name: 'Management', color: '#e67e22' }
  ]
};

let switchState = JSON.parse(JSON.stringify(INITIAL_SWITCH));
let traceLog = [];
let interVlanEnabled = false;

function getVlanColor(vid) {
  const v = switchState.vlans.find(v => v.id === vid);
  return v ? v.color : '#6c7a96';
}

function getVlanName(vid) {
  const v = switchState.vlans.find(v => v.id === vid);
  return v ? v.name : 'VLAN ' + vid;
}

function renderVlanSim() {
  const container = document.getElementById('labResult-vlanSim');
  if (!container) return;

  const portsHtml = switchState.ports.map(p => {
    const color = getVlanColor(p.vlan);
    const isTrunk = p.mode === 'trunk';
    return `
      <div class="vlan-port" style="border-left:3px solid ${color}">
        <div class="vlan-port__header">
          <span class="vlan-port__id">Port ${p.id}</span>
          <span class="vlan-port__label">${p.label}</span>
        </div>
        <div class="vlan-port__config">
          <select class="vlan-port__mode" data-port="${p.id}">
            <option value="access"${!isTrunk ? ' selected' : ''}>Access</option>
            <option value="trunk"${isTrunk ? ' selected' : ''}>Trunk</option>
          </select>
          ${isTrunk ? `
            <div class="vlan-port__trunk-info">
              <span style="font-size:.65rem;color:var(--text-secondary)">Native: ${p.nativeVlan} | Allowed: ${(p.allowedVlans || [1]).join(', ')}</span>
            </div>
          ` : `
            <select class="vlan-port__vlan" data-port="${p.id}">
              ${switchState.vlans.map(v => `<option value="${v.id}"${v.id === p.vlan ? ' selected' : ''}>${v.id} - ${v.name}</option>`).join('')}
            </select>
          `}
        </div>
        ${p.mac ? `<div style="font-size:.6rem;color:var(--text-secondary);font-family:monospace">${p.mac}</div>` : ''}
      </div>`;
  }).join('');

  const vlansHtml = switchState.vlans.map(v => {
    const members = switchState.ports.filter(p => p.mode === 'access' && p.vlan === v.id);
    return `
      <div class="vlan-entry" style="border-left:3px solid ${v.color}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span><strong>VLAN ${v.id}</strong> — ${v.name}</span>
          <span style="font-size:.7rem;color:var(--text-secondary)">${members.length} порт(ов)</span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">
          ${members.map(m => `<span class="vlan-member-chip" style="background:${v.color}20;color:${v.color};border:1px solid ${v.color}40">${m.label} (P${m.id})</span>`).join('')}
          ${switchState.ports.filter(p => p.mode === 'trunk').map(p => `<span class="vlan-member-chip" style="background:${v.color}10;color:${v.color};border:1px dashed ${v.color}40">🔗 ${p.label} (P${p.id})</span>`).join('')}
        </div>
      </div>`;
  }).join('');

  // Trace section
  const traceSourcePorts = switchState.ports.filter(p => p.mode === 'access');
  const traceHtml = `
    <div class="vlan-trace">
      <div class="enc-step__title">Трассировка кадра</div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
        <label style="font-size:.75rem">От:</label>
        <select id="vlanTraceFrom" style="padding:6px 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.75rem">
          ${traceSourcePorts.map(p => `<option value="${p.id}">${p.label} (Port ${p.id}, VLAN ${p.vlan})</option>`).join('')}
        </select>
        <label style="font-size:.75rem">→ Кому:</label>
        <select id="vlanTraceTo" style="padding:6px 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.75rem">
          ${traceSourcePorts.map((p, i) => `<option value="${p.id}"${i === 1 ? ' selected' : ''}>${p.label} (Port ${p.id}, VLAN ${p.vlan})</option>`).join('')}
        </select>
        <button class="lab-run-btn" id="vlanTraceBtn" style="width:auto;padding:8px 16px;margin:0;font-size:.75rem">▶ Отправить</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <label class="ch-env-toggle" style="font-size:.75rem">
          <input type="checkbox" id="vlanInterVlan" ${interVlanEnabled ? 'checked' : ''}>
          Inter-VLAN Routing (Router-on-a-Stick на Port 8)
        </label>
      </div>
      <div id="vlanTraceLog" class="tcp-window-log" style="min-height:60px;max-height:250px">
        ${traceLog.map(e => `<div class="tcp-window-log__entry tcp-window-log--${e.type}">${e.text}</div>`).join('')}
        ${traceLog.length === 0 ? '<div style="color:var(--text-secondary);font-size:.7rem;text-align:center;padding:12px">Нажмите «Отправить» для трассировки кадра</div>' : ''}
      </div>
    </div>`;

  container.innerHTML = `
    <div class="lab-result__title">VLAN-симулятор (802.1Q)</div>

    <div class="enc-step__title" style="margin-top:12px">Коммутатор — 8 портов</div>
    <div class="vlan-ports-grid">${portsHtml}</div>

    <div class="enc-step__title" style="margin-top:16px">Таблица VLAN</div>
    <div class="vlan-list">${vlansHtml}</div>

    ${traceHtml}

    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="dnd-btn" id="vlanAddVlan" style="flex:1;padding:8px;font-size:.72rem">+ Добавить VLAN</button>
      <button class="dnd-btn" id="vlanReset" style="flex:1;padding:8px;font-size:.72rem">↺ Сброс</button>
    </div>

    <div class="card mt-12" style="font-size:.78rem;line-height:1.7">
      <strong>802.1Q:</strong> Trunk-порты добавляют 4-байтовый тег (TPID 0x8100 + VID) в Ethernet-кадр.
      Access-порты работают с нетегированными кадрами. Native VLAN на trunk — кадры без тега.<br>
      <strong>Inter-VLAN:</strong> Для связи между VLAN нужен маршрутизатор (Router-on-a-Stick) или L3-коммутатор.
    </div>
  `;

  // Bind events
  container.querySelectorAll('.vlan-port__mode').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const portId = parseInt(e.target.dataset.port);
      const port = switchState.ports.find(p => p.id === portId);
      if (!port) return;
      port.mode = e.target.value;
      if (port.mode === 'trunk') {
        port.allowedVlans = switchState.vlans.map(v => v.id);
        port.nativeVlan = 1;
      }
      renderVlanSim();
    });
  });

  container.querySelectorAll('.vlan-port__vlan').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const portId = parseInt(e.target.dataset.port);
      const port = switchState.ports.find(p => p.id === portId);
      if (port) { port.vlan = parseInt(e.target.value); renderVlanSim(); }
    });
  });

  document.getElementById('vlanTraceBtn')?.addEventListener('click', runTrace);
  document.getElementById('vlanInterVlan')?.addEventListener('change', (e) => {
    interVlanEnabled = e.target.checked;
  });
  document.getElementById('vlanAddVlan')?.addEventListener('click', addVlan);
  document.getElementById('vlanReset')?.addEventListener('click', () => {
    switchState = JSON.parse(JSON.stringify(INITIAL_SWITCH));
    traceLog = [];
    renderVlanSim();
  });
}

function addVlan() {
  const existing = switchState.vlans.map(v => v.id);
  let newId = 30;
  while (existing.includes(newId)) newId += 10;
  if (newId > 4094) return;
  const colors = ['#9b59b6', '#e74c3c', '#1abc9c', '#f39c12', '#2980b9'];
  switchState.vlans.push({
    id: newId,
    name: 'VLAN ' + newId,
    color: colors[switchState.vlans.length % colors.length]
  });
  // Update trunk ports to include new VLAN
  switchState.ports.filter(p => p.mode === 'trunk').forEach(p => {
    if (!p.allowedVlans.includes(newId)) p.allowedVlans.push(newId);
  });
  renderVlanSim();
}

function runTrace() {
  const fromId = parseInt(document.getElementById('vlanTraceFrom')?.value);
  const toId = parseInt(document.getElementById('vlanTraceTo')?.value);
  const fromPort = switchState.ports.find(p => p.id === fromId);
  const toPort = switchState.ports.find(p => p.id === toId);
  if (!fromPort || !toPort) return;

  traceLog = [];
  const srcVlan = fromPort.vlan;
  const dstVlan = toPort.vlan;
  const srcColor = getVlanColor(srcVlan);
  const dstColor = getVlanColor(dstVlan);

  traceLog.push({ type: 'send', text: `→ Кадр от ${fromPort.label} (Port ${fromPort.id}, VLAN ${srcVlan})` });
  traceLog.push({ type: 'send', text: `  Src MAC: ${fromPort.mac} → Dst MAC: ${toPort.mac}` });

  if (fromId === toId) {
    traceLog.push({ type: 'ack', text: `✓ Loopback — кадр возвращается отправителю` });
    renderVlanSim();
    return;
  }

  // Same VLAN — direct switching
  if (srcVlan === dstVlan) {
    traceLog.push({ type: 'ack', text: `  Коммутатор: src и dst в одном VLAN ${srcVlan} (${getVlanName(srcVlan)})` });

    // Check if frame goes through trunk
    const trunkPorts = switchState.ports.filter(p => p.mode === 'trunk' && p.allowedVlans?.includes(srcVlan));
    if (trunkPorts.length > 0 && fromPort.mode === 'access' && toPort.mode === 'access') {
      traceLog.push({ type: 'ack', text: `  Прямая коммутация — trunk не требуется` });
    }

    traceLog.push({ type: 'ack', text: `  → Кадр доставлен на Port ${toPort.id} (${toPort.label})` });
    traceLog.push({ type: 'done', text: `✓ Доставлено! Кадр без тега (access→access в VLAN ${srcVlan})` });
    addXP(2);
  } else {
    // Different VLANs
    traceLog.push({ type: 'loss', text: `  Коммутатор: src VLAN ${srcVlan} ≠ dst VLAN ${dstVlan}` });

    if (interVlanEnabled) {
      const routerPort = switchState.ports.find(p => p.id === 8 && p.mode === 'trunk');
      if (routerPort) {
        traceLog.push({ type: 'send', text: `  → Кадр отправлен на Router (Port 8, trunk)` });

        if (srcVlan === routerPort.nativeVlan) {
          traceLog.push({ type: 'send', text: `    Без тега (native VLAN ${routerPort.nativeVlan})` });
        } else {
          traceLog.push({ type: 'send', text: `    + 802.1Q тег: TPID=0x8100, VID=${srcVlan}, PCP=0` });
        }

        traceLog.push({ type: 'ack', text: `  Router: маршрутизация VLAN ${srcVlan} → VLAN ${dstVlan}` });
        traceLog.push({ type: 'ack', text: `    sub-if: .${srcVlan} (${getVlanName(srcVlan)}) → .${dstVlan} (${getVlanName(dstVlan)})` });
        traceLog.push({ type: 'send', text: `  ← Кадр возвращается на коммутатор (Port 8, trunk)` });

        if (dstVlan === routerPort.nativeVlan) {
          traceLog.push({ type: 'send', text: `    Без тега (native VLAN ${routerPort.nativeVlan})` });
        } else {
          traceLog.push({ type: 'send', text: `    + 802.1Q тег: TPID=0x8100, VID=${dstVlan}` });
        }

        traceLog.push({ type: 'ack', text: `  Коммутатор: снимает тег, отправляет на Port ${toPort.id}` });
        traceLog.push({ type: 'done', text: `✓ Доставлено через Inter-VLAN routing!` });
        addXP(3);
        unlockAchievement('lab_vlan');
      } else {
        traceLog.push({ type: 'loss', text: `✕ Port 8 не настроен как trunk — маршрутизация невозможна` });
      }
    } else {
      traceLog.push({ type: 'loss', text: `✕ ЗАБЛОКИРОВАНО: кадры не могут переходить между VLAN` });
      traceLog.push({ type: 'loss', text: `  Включите Inter-VLAN Routing для маршрутизации между VLAN` });
    }
  }

  renderVlanSim();
}

export function initVlanSim() {
  // Render when tab becomes active
  const obs = new MutationObserver(() => {
    const el = document.getElementById('lab-vlanSim');
    if (el?.classList.contains('active')) renderVlanSim();
  });
  const labEl = document.getElementById('lab-vlanSim');
  if (labEl) {
    obs.observe(labEl, { attributes: true, attributeFilter: ['class'] });
    if (labEl.classList.contains('active')) renderVlanSim();
  }
}
