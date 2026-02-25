/* ==================== TERMINAL: UI & Input Handling ==================== */
import { buildCommands, TERM_CMD_INFO, getCwd, checkScenarioStep } from './terminal-commands.js';
import { termLine, termScroll } from './terminal-network.js';

let TERM_COMMANDS;
let termOutput;
let termInput;
const cmdHistory = [];
let historyIdx = -1;
let activeTermCmd = null;

async function executeCommand(input) {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  const promptDir = getCwd() === '/root' ? '~' : getCwd();
  termLine(termOutput, `<span class="term-line--cmd">root@osi-lab:${promptDir}$ ${input.replace(/</g, '&lt;')}</span>`);

  if (!cmd) { termScroll(termOutput); return; }

  if (TERM_COMMANDS[cmd]) {
    await TERM_COMMANDS[cmd](args);
  } else {
    termLine(termOutput, `bash: ${cmd}: command not found. Введите <span class="term-cmd">help</span> для списка команд`, 'error');
  }

  // Check active scenario step against the full input
  checkScenarioStep(input.trim().toLowerCase());

  termLine(termOutput, '');
  termScroll(termOutput);
}

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

export function initTerminal() {
  termOutput = document.getElementById('termOutput');
  termInput = document.getElementById('termInput');
  TERM_COMMANDS = buildCommands(termOutput);

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

  renderTermQuickPanel();
}
