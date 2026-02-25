import { addXP, unlockAchievement } from '../core/gamification.js';

/* ============================================================
   Firewall Simulator — iptables-style rules, packet tracing, NAT
   ============================================================ */

const DEFAULT_RULES = [
  { id: 1, chain: 'INPUT', proto: 'TCP', srcIp: '*', dstIp: '192.168.1.1', dstPort: '22', action: 'ACCEPT', comment: 'SSH' },
  { id: 2, chain: 'INPUT', proto: 'TCP', srcIp: '*', dstIp: '192.168.1.1', dstPort: '80', action: 'ACCEPT', comment: 'HTTP' },
  { id: 3, chain: 'INPUT', proto: 'TCP', srcIp: '*', dstIp: '192.168.1.1', dstPort: '443', action: 'ACCEPT', comment: 'HTTPS' },
  { id: 4, chain: 'INPUT', proto: 'ICMP', srcIp: '192.168.1.0/24', dstIp: '*', dstPort: '*', action: 'ACCEPT', comment: 'LAN ping' },
  { id: 5, chain: 'INPUT', proto: '*', srcIp: '*', dstIp: '*', dstPort: '*', action: 'DROP', comment: 'Deny all' },
  { id: 6, chain: 'FORWARD', proto: '*', srcIp: '192.168.1.0/24', dstIp: '*', dstPort: '*', action: 'ACCEPT', comment: 'LAN→WAN' },
  { id: 7, chain: 'FORWARD', proto: '*', srcIp: '*', dstIp: '192.168.1.0/24', dstPort: '*', action: 'DROP', comment: 'Block inbound' },
  { id: 8, chain: 'OUTPUT', proto: '*', srcIp: '*', dstIp: '*', dstPort: '*', action: 'ACCEPT', comment: 'Allow all out' }
];

const NAT_RULES = [
  { id: 1, type: 'MASQUERADE', chain: 'POSTROUTING', srcIp: '192.168.1.0/24', outIf: 'eth0', comment: 'LAN NAT' },
  { id: 2, type: 'DNAT', chain: 'PREROUTING', dstPort: '8080', toAddr: '192.168.1.10:80', comment: 'Web redirect' }
];

let rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
let nextId = 9;
let fwTraceLog = [];
let activeChain = 'INPUT';

function ipInSubnet(ip, subnet) {
  if (subnet === '*') return true;
  if (!subnet.includes('/')) return ip === subnet;
  const [net, bits] = subnet.split('/');
  const mask = ~((1 << (32 - parseInt(bits))) - 1) >>> 0;
  const ipToNum = a => a.split('.').reduce((s, o) => (s << 8) + parseInt(o), 0) >>> 0;
  return (ipToNum(ip) & mask) === (ipToNum(net) & mask);
}

function matchRule(rule, pkt) {
  if (rule.chain !== pkt.chain) return false;
  if (rule.proto !== '*' && rule.proto !== pkt.proto) return false;
  if (rule.srcIp !== '*' && !ipInSubnet(pkt.srcIp, rule.srcIp)) return false;
  if (rule.dstIp !== '*' && !ipInSubnet(pkt.dstIp, rule.dstIp)) return false;
  if (rule.dstPort !== '*' && rule.dstPort !== String(pkt.dstPort)) return false;
  return true;
}

function renderFirewall() {
  const container = document.getElementById('labResult-firewallSim');
  if (!container) return;

  const chains = ['INPUT', 'OUTPUT', 'FORWARD'];
  const chainRules = rules.filter(r => r.chain === activeChain);

  const rulesHtml = chainRules.map(r => {
    const actionClass = r.action === 'ACCEPT' ? 'fw-accept' : r.action === 'DROP' ? 'fw-drop' : 'fw-reject';
    return `
      <div class="fw-rule ${actionClass}">
        <span class="fw-rule__num">#${r.id}</span>
        <span class="fw-rule__proto">${r.proto}</span>
        <span class="fw-rule__addr">${r.srcIp} → ${r.dstIp}${r.dstPort !== '*' ? ':' + r.dstPort : ''}</span>
        <span class="fw-rule__action">${r.action}</span>
        <span class="fw-rule__comment">${r.comment}</span>
        <button class="fw-rule__del" data-rule-id="${r.id}">✕</button>
      </div>`;
  }).join('');

  const natHtml = NAT_RULES.map(r => `
    <div class="fw-rule fw-nat">
      <span class="fw-rule__num">${r.type}</span>
      <span class="fw-rule__addr">${r.chain}: ${r.type === 'MASQUERADE' ? r.srcIp + ' → ' + r.outIf : 'dst:' + r.dstPort + ' → ' + r.toAddr}</span>
      <span class="fw-rule__comment">${r.comment}</span>
    </div>`).join('');

  const traceHtml = fwTraceLog.map(e =>
    `<div class="tcp-window-log__entry tcp-window-log--${e.type}">${e.text}</div>`
  ).join('');

  container.innerHTML = `
    <div class="lab-result__title">Firewall (iptables)</div>

    <div class="sig-tabs" style="margin-bottom:8px">
      ${chains.map(c => `<button class="sig-tab${c === activeChain ? ' active' : ''}" data-fw-chain="${c}">${c} (${rules.filter(r => r.chain === c).length})</button>`).join('')}
      <button class="sig-tab" data-fw-chain="NAT">NAT</button>
    </div>

    ${activeChain === 'NAT' ? `
      <div class="fw-rules">${natHtml}</div>
      <div class="card mt-12" style="font-size:.78rem;line-height:1.7">
        <strong>MASQUERADE:</strong> Подменяет src IP пакетов из LAN на IP внешнего интерфейса (динамический SNAT).<br>
        <strong>DNAT:</strong> Перенаправляет входящие пакеты на внутренний адрес (port forwarding).
      </div>
    ` : `
      <div class="fw-rules">${rulesHtml}</div>

      <div class="fw-add-form" id="fwAddForm">
        <select id="fwNewProto"><option value="*">Любой</option><option value="TCP">TCP</option><option value="UDP">UDP</option><option value="ICMP">ICMP</option></select>
        <input id="fwNewSrc" placeholder="Src IP" value="*" style="width:100px">
        <input id="fwNewDst" placeholder="Dst IP" value="*" style="width:100px">
        <input id="fwNewPort" placeholder="Port" value="*" style="width:60px">
        <select id="fwNewAction"><option value="ACCEPT">ACCEPT</option><option value="DROP">DROP</option><option value="REJECT">REJECT</option><option value="LOG">LOG</option></select>
        <button class="lab-run-btn" id="fwAddRuleBtn" style="width:auto;padding:8px 12px;margin:0;font-size:.72rem">+ Добавить</button>
      </div>

      <div class="vlan-trace" style="margin-top:12px">
        <div class="enc-step__title">Трассировка пакета</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;align-items:center">
          <select id="fwTraceProto" style="padding:5px;border-radius:4px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.72rem">
            <option value="TCP">TCP</option><option value="UDP">UDP</option><option value="ICMP">ICMP</option>
          </select>
          <input id="fwTraceSrc" placeholder="Src IP" value="10.0.0.5" style="width:100px;padding:5px;border-radius:4px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.72rem">
          <span style="font-size:.72rem">→</span>
          <input id="fwTraceDst" placeholder="Dst IP" value="192.168.1.1" style="width:100px;padding:5px;border-radius:4px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.72rem">
          <input id="fwTracePort" placeholder="Port" value="80" style="width:60px;padding:5px;border-radius:4px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.72rem">
          <button class="lab-run-btn" id="fwTraceBtn" style="width:auto;padding:8px 16px;margin:0;font-size:.72rem">▶ Проверить</button>
        </div>
        <div id="fwTraceLog" class="tcp-window-log" style="min-height:40px;max-height:200px">
          ${traceHtml || '<div style="color:var(--text-secondary);font-size:.7rem;text-align:center;padding:8px">Укажите пакет и нажмите «Проверить»</div>'}
        </div>
      </div>
    `}

    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="dnd-btn" id="fwReset" style="flex:1;padding:8px;font-size:.72rem">↺ Сброс правил</button>
    </div>

    <div class="card mt-12" style="font-size:.78rem;line-height:1.7">
      <strong>Порядок важен:</strong> Пакет проверяется по правилам сверху вниз — первое совпавшее правило определяет действие.<br>
      <strong>Политика по умолчанию:</strong> Если ни одно правило не сработало — пакет отбрасывается (DROP).<br>
      <strong>Stateful:</strong> В реальном iptables есть отслеживание соединений (ESTABLISHED, RELATED).
    </div>
  `;

  // Bind events
  container.querySelectorAll('[data-fw-chain]').forEach(btn => {
    btn.addEventListener('click', () => { activeChain = btn.dataset.fwChain; renderFirewall(); });
  });

  container.querySelectorAll('.fw-rule__del').forEach(btn => {
    btn.addEventListener('click', () => {
      rules = rules.filter(r => r.id !== parseInt(btn.dataset.ruleId));
      renderFirewall();
    });
  });

  document.getElementById('fwAddRuleBtn')?.addEventListener('click', () => {
    rules.push({
      id: nextId++,
      chain: activeChain,
      proto: document.getElementById('fwNewProto').value,
      srcIp: document.getElementById('fwNewSrc').value || '*',
      dstIp: document.getElementById('fwNewDst').value || '*',
      dstPort: document.getElementById('fwNewPort').value || '*',
      action: document.getElementById('fwNewAction').value,
      comment: ''
    });
    renderFirewall();
  });

  document.getElementById('fwTraceBtn')?.addEventListener('click', runFwTrace);
  document.getElementById('fwReset')?.addEventListener('click', () => {
    rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
    nextId = 9;
    fwTraceLog = [];
    renderFirewall();
  });
}

function runFwTrace() {
  const pkt = {
    chain: activeChain,
    proto: document.getElementById('fwTraceProto')?.value || 'TCP',
    srcIp: document.getElementById('fwTraceSrc')?.value || '10.0.0.5',
    dstIp: document.getElementById('fwTraceDst')?.value || '192.168.1.1',
    dstPort: document.getElementById('fwTracePort')?.value || '80'
  };

  fwTraceLog = [];
  fwTraceLog.push({ type: 'send', text: `→ Пакет: ${pkt.proto} ${pkt.srcIp} → ${pkt.dstIp}:${pkt.dstPort}` });
  fwTraceLog.push({ type: 'send', text: `  Цепочка: ${pkt.chain}` });

  const chainRules = rules.filter(r => r.chain === pkt.chain);
  let matched = false;

  for (const rule of chainRules) {
    const hit = matchRule(rule, pkt);
    if (hit) {
      fwTraceLog.push({ type: rule.action === 'ACCEPT' ? 'ack' : 'loss',
        text: `  Правило #${rule.id}: ${rule.proto} ${rule.srcIp}→${rule.dstIp}:${rule.dstPort} → ${rule.action} ${rule.comment ? '(' + rule.comment + ')' : ''} ✓ СОВПАЛО` });

      if (rule.action === 'ACCEPT') {
        fwTraceLog.push({ type: 'done', text: `✓ ACCEPT — пакет пропущен` });
      } else if (rule.action === 'DROP') {
        fwTraceLog.push({ type: 'loss', text: `✕ DROP — пакет молча отброшен` });
      } else if (rule.action === 'REJECT') {
        fwTraceLog.push({ type: 'loss', text: `✕ REJECT — пакет отброшен, отправлен ICMP Destination Unreachable` });
      } else if (rule.action === 'LOG') {
        fwTraceLog.push({ type: 'retransmit', text: `📝 LOG — пакет записан в лог, продолжаем проверку...` });
        continue; // LOG doesn't terminate
      }
      matched = true;
      break;
    } else {
      fwTraceLog.push({ type: 'send', text: `  Правило #${rule.id}: ${rule.proto} ${rule.srcIp}→${rule.dstIp}:${rule.dstPort} → ${rule.action} — не совпало` });
    }
  }

  if (!matched) {
    fwTraceLog.push({ type: 'loss', text: `✕ Политика по умолчанию: DROP (ни одно правило не сработало)` });
  }

  addXP(2);
  unlockAchievement('lab_firewall');
  renderFirewall();
}

export function initFirewallSim() {
  const obs = new MutationObserver(() => {
    const el = document.getElementById('lab-firewallSim');
    if (el?.classList.contains('active')) renderFirewall();
  });
  const labEl = document.getElementById('lab-firewallSim');
  if (labEl) {
    obs.observe(labEl, { attributes: true, attributeFilter: ['class'] });
    if (labEl.classList.contains('active')) renderFirewall();
  }
}
