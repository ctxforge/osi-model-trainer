import { addXP, unlockAchievement } from '../core/gamification.js';

const TCP_STATES = [
  { id: 'CLOSED', x: 50, y: 10, desc: 'Начальное/конечное состояние. Соединение не существует.' },
  { id: 'LISTEN', x: 15, y: 30, desc: 'Сервер ожидает входящие SYN. Пассивное открытие.' },
  { id: 'SYN_SENT', x: 85, y: 30, desc: 'Клиент отправил SYN, ждёт SYN+ACK.' },
  { id: 'SYN_RCVD', x: 15, y: 50, desc: 'Сервер получил SYN, отправил SYN+ACK, ждёт ACK.' },
  { id: 'ESTABLISHED', x: 50, y: 50, desc: 'Соединение установлено. Данные могут передаваться.' },
  { id: 'FIN_WAIT_1', x: 85, y: 60, desc: 'Активная сторона отправила FIN, ждёт ACK.' },
  { id: 'FIN_WAIT_2', x: 85, y: 75, desc: 'Получен ACK на FIN. Ждёт FIN от другой стороны.' },
  { id: 'CLOSE_WAIT', x: 15, y: 70, desc: 'Получен FIN. Приложение должно закрыть соединение.' },
  { id: 'CLOSING', x: 50, y: 70, desc: 'Обе стороны одновременно закрывают (FIN crossing).' },
  { id: 'LAST_ACK', x: 15, y: 88, desc: 'Пассивная сторона отправила FIN, ждёт финальный ACK.' },
  { id: 'TIME_WAIT', x: 50, y: 88, desc: '2×MSL ожидание. Гарантирует, что все пакеты доставлены.' }
];

const TCP_TRANSITIONS = [
  { from: 'CLOSED', to: 'LISTEN', trigger: 'Passive Open', segment: '-', label: 'passive open' },
  { from: 'CLOSED', to: 'SYN_SENT', trigger: 'Active Open', segment: 'SYN →', label: 'active open / SYN' },
  { from: 'LISTEN', to: 'SYN_RCVD', trigger: 'Receive SYN', segment: '← SYN, SYN+ACK →', label: 'rcv SYN / SYN+ACK' },
  { from: 'LISTEN', to: 'SYN_SENT', trigger: 'Send', segment: 'SYN →', label: 'send / SYN' },
  { from: 'SYN_SENT', to: 'ESTABLISHED', trigger: 'Receive SYN+ACK', segment: '← SYN+ACK, ACK →', label: 'rcv SYN+ACK / ACK' },
  { from: 'SYN_SENT', to: 'SYN_RCVD', trigger: 'Receive SYN', segment: '← SYN, SYN+ACK →', label: 'rcv SYN / SYN+ACK' },
  { from: 'SYN_RCVD', to: 'ESTABLISHED', trigger: 'Receive ACK', segment: '← ACK', label: 'rcv ACK' },
  { from: 'SYN_RCVD', to: 'FIN_WAIT_1', trigger: 'Close', segment: 'FIN →', label: 'close / FIN' },
  { from: 'ESTABLISHED', to: 'FIN_WAIT_1', trigger: 'Close', segment: 'FIN →', label: 'close / FIN' },
  { from: 'ESTABLISHED', to: 'CLOSE_WAIT', trigger: 'Receive FIN', segment: '← FIN, ACK →', label: 'rcv FIN / ACK' },
  { from: 'FIN_WAIT_1', to: 'FIN_WAIT_2', trigger: 'Receive ACK', segment: '← ACK', label: 'rcv ACK' },
  { from: 'FIN_WAIT_1', to: 'CLOSING', trigger: 'Receive FIN', segment: '← FIN, ACK →', label: 'rcv FIN / ACK' },
  { from: 'FIN_WAIT_1', to: 'TIME_WAIT', trigger: 'Receive FIN+ACK', segment: '← FIN+ACK, ACK →', label: 'rcv FIN+ACK / ACK' },
  { from: 'FIN_WAIT_2', to: 'TIME_WAIT', trigger: 'Receive FIN', segment: '← FIN, ACK →', label: 'rcv FIN / ACK' },
  { from: 'CLOSING', to: 'TIME_WAIT', trigger: 'Receive ACK', segment: '← ACK', label: 'rcv ACK' },
  { from: 'CLOSE_WAIT', to: 'LAST_ACK', trigger: 'Close', segment: 'FIN →', label: 'close / FIN' },
  { from: 'LAST_ACK', to: 'CLOSED', trigger: 'Receive ACK', segment: '← ACK', label: 'rcv ACK' },
  { from: 'TIME_WAIT', to: 'CLOSED', trigger: 'Timeout (2×MSL)', segment: '-', label: '2×MSL timeout' }
];

let currentState = 'CLOSED';
let history = [];

function getAvailableTransitions() {
  return TCP_TRANSITIONS.filter(t => t.from === currentState);
}

function renderFSM(container) {
  const stateInfo = TCP_STATES.find(s => s.id === currentState);
  const available = getAvailableTransitions();

  let html = `
    <div class="tcp-fsm">
      <div class="tcp-fsm__diagram" id="tcpFsmDiagram">
        <svg viewBox="0 0 100 100" style="width:100%;height:300px">
          <!-- Transition lines -->
          ${TCP_TRANSITIONS.map(t => {
            const from = TCP_STATES.find(s => s.id === t.from);
            const to = TCP_STATES.find(s => s.id === t.to);
            const isAvail = t.from === currentState;
            return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"
              stroke="${isAvail ? '#2ecc71' : '#1a2030'}" stroke-width="${isAvail ? 0.6 : 0.3}"
              stroke-dasharray="${isAvail ? '' : '1,1'}" />`;
          }).join('')}
          <!-- State circles -->
          ${TCP_STATES.map(s => {
            const isCurrent = s.id === currentState;
            const wasVisited = history.includes(s.id);
            const fill = isCurrent ? '#2ecc71' : wasVisited ? '#3498db20' : '#0d111880';
            const stroke = isCurrent ? '#2ecc71' : wasVisited ? '#3498db' : '#1a2030';
            return `
              <circle cx="${s.x}" cy="${s.y}" r="4.5" fill="${fill}" stroke="${stroke}" stroke-width="0.5" />
              <text x="${s.x}" y="${s.y + 1.2}" text-anchor="middle" fill="${isCurrent ? '#fff' : '#6c7a96'}" font-size="2.2" font-weight="bold">${s.id.replace('_', '\n')}</text>
            `;
          }).join('')}
        </svg>
      </div>

      <div class="card" style="margin-top:12px;padding:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="width:12px;height:12px;border-radius:50%;background:#2ecc71;flex-shrink:0"></div>
          <div style="font-weight:700;font-size:.9rem">${currentState}</div>
        </div>
        <div style="font-size:.78rem;color:var(--text-secondary);margin-bottom:12px">${stateInfo.desc}</div>

        <div style="font-size:.72rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;margin-bottom:6px">Доступные переходы:</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${available.map(t => `
            <button class="dnd-btn" data-transition="${t.to}" style="flex:none;padding:8px 14px;font-size:.78rem">
              ${t.trigger}<br><span style="font-size:.65rem;color:var(--text-secondary)">${t.segment}</span>
            </button>
          `).join('')}
          ${available.length === 0 ? '<div style="color:var(--text-secondary);font-size:.78rem">Нет переходов (конечное состояние)</div>' : ''}
        </div>
      </div>

      <div style="margin-top:8px;font-size:.72rem;color:var(--text-secondary)">
        <strong>История:</strong> ${history.length > 0 ? history.join(' → ') + ' → <strong style="color:var(--accent)">' + currentState + '</strong>' : '<em>Нажмите кнопку перехода</em>'}
      </div>

      <div style="display:flex;gap:6px;margin-top:12px">
        <button class="dnd-btn" id="tcpFsmReset" style="flex:1;padding:8px">⟳ Сбросить</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Bind transition buttons
  container.querySelectorAll('[data-transition]').forEach(btn => {
    btn.addEventListener('click', () => {
      history.push(currentState);
      currentState = btn.dataset.transition;
      addXP(1);
      if (currentState === 'CLOSED' && history.includes('TIME_WAIT')) {
        unlockAchievement('lab_tcp_fsm');
        addXP(5);
      }
      renderFSM(container);
    });
  });

  container.querySelector('#tcpFsmReset')?.addEventListener('click', () => {
    currentState = 'CLOSED';
    history = [];
    renderFSM(container);
  });
}

export function initTcpStateMachine() {
  const container = document.getElementById('labResult-tcpStateMachine');
  if (!container) return;

  const observer = new MutationObserver(() => {
    if (document.getElementById('lab-tcpStateMachine')?.classList.contains('active') && !container.children.length) {
      renderFSM(container);
    }
  });
  const labEl = document.getElementById('lab-tcpStateMachine');
  if (labEl) {
    observer.observe(labEl, { attributes: true, attributeFilter: ['class'] });
    if (labEl.classList.contains('active')) renderFSM(container);
  }
}
