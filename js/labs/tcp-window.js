import { addXP, unlockAchievement } from '../core/gamification.js';
import { sleep } from '../core/utils.js';

let windowAnimRunning = false;

export async function runTcpWindow(labState) {
  unlockAchievement('lab_window');
  addXP(3);
  const s = labState.tcpWindow;
  const windowSize = s.windowSize || 4;
  const mss = s.mss || 1000;
  const packetLoss = (s.packetLoss || 10) / 100;
  const speed = s.speed || 300;

  const result = document.getElementById('labResult-tcpWindow');
  windowAnimRunning = true;

  const totalSegments = 20;
  const segments = [];
  for (let i = 0; i < totalSegments; i++) {
    segments.push({
      seq: i * mss,
      status: 'pending', // pending, sent, acked, lost
      retransmits: 0
    });
  }

  let sendBase = 0; // First unacked segment
  let nextSeqNum = 0; // Next segment to send
  const logEntries = [];

  function renderWindow() {
    let html = `
      <div class="lab-result__title">Скользящее окно TCP</div>
      <div style="font-size:.72rem;color:var(--text-secondary);margin-bottom:8px">
        Window Size: ${windowSize} сегментов | MSS: ${mss} Б | Потери: ${Math.round(packetLoss * 100)}%
      </div>
      <div class="tcp-window-bar">
        ${segments.map((seg, i) => {
          let cls = 'tcp-seg';
          let label = i;
          if (seg.status === 'acked') cls += ' tcp-seg--acked';
          else if (seg.status === 'sent') cls += ' tcp-seg--sent';
          else if (seg.status === 'lost') cls += ' tcp-seg--lost';
          else if (i >= sendBase && i < sendBase + windowSize && i >= nextSeqNum) cls += ' tcp-seg--sendable';
          else if (i >= sendBase + windowSize) cls += ' tcp-seg--blocked';
          return `<div class="${cls}" data-tip="Seq: ${seg.seq}">${label}</div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin:8px 0;font-size:.68rem">
        <span><span class="tcp-seg tcp-seg--acked" style="display:inline-block;width:14px;height:14px;border-radius:2px;vertical-align:middle"></span> Подтверждённые</span>
        <span><span class="tcp-seg tcp-seg--sent" style="display:inline-block;width:14px;height:14px;border-radius:2px;vertical-align:middle"></span> Отправлены (ожидание ACK)</span>
        <span><span class="tcp-seg tcp-seg--sendable" style="display:inline-block;width:14px;height:14px;border-radius:2px;vertical-align:middle"></span> Можно отправить</span>
        <span><span class="tcp-seg tcp-seg--blocked" style="display:inline-block;width:14px;height:14px;border-radius:2px;vertical-align:middle"></span> Заблокировано (за окном)</span>
        <span><span class="tcp-seg tcp-seg--lost" style="display:inline-block;width:14px;height:14px;border-radius:2px;vertical-align:middle"></span> Потеряно</span>
      </div>
      <div class="card" style="padding:8px;font-size:.72rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span>Send Base: <strong>${sendBase}</strong></span>
          <span>Next Seq: <strong>${nextSeqNum}</strong></span>
          <span>Window: <strong>[${sendBase}..${sendBase + windowSize - 1}]</strong></span>
        </div>
        <div class="tcp-window-ptr">
          ${segments.map((_, i) => {
            let ptr = '';
            if (i === sendBase) ptr = '↑base';
            else if (i === nextSeqNum) ptr = '↑next';
            else if (i === sendBase + windowSize) ptr = '↑end';
            return `<div class="tcp-window-ptr__cell">${ptr}</div>`;
          }).join('')}
        </div>
      </div>
      <div class="tcp-window-log" id="tcpWindowLog">
        ${logEntries.slice(-12).map(e => `<div class="tcp-window-log__entry tcp-window-log--${e.type}">${e.text}</div>`).join('')}
      </div>
    `;

    result.innerHTML = html;
  }

  function addLog(type, text) {
    logEntries.push({ type, text });
  }

  renderWindow();

  // Animation loop
  while (sendBase < totalSegments && windowAnimRunning) {
    // Send segments within window
    while (nextSeqNum < sendBase + windowSize && nextSeqNum < totalSegments) {
      segments[nextSeqNum].status = 'sent';
      addLog('send', `→ Отправлен сегмент #${nextSeqNum} (Seq: ${nextSeqNum * mss})`);
      nextSeqNum++;
      renderWindow();
      await sleep(speed / 2);
      if (!windowAnimRunning) return;
    }

    // Wait for ACKs
    await sleep(speed);
    if (!windowAnimRunning) return;

    // Process ACKs for sent segments
    let advanced = false;
    for (let i = sendBase; i < nextSeqNum; i++) {
      if (segments[i].status !== 'sent') continue;

      const lost = Math.random() < packetLoss;
      if (lost) {
        segments[i].status = 'lost';
        segments[i].retransmits++;
        addLog('loss', `✕ Потерян сегмент #${i} (Seq: ${i * mss})`);
      } else {
        segments[i].status = 'acked';
        addLog('ack', `← ACK для #${i} (Ack: ${(i + 1) * mss})`);
        advanced = true;
      }
    }

    // Advance sendBase past contiguous acked
    while (sendBase < totalSegments && segments[sendBase].status === 'acked') {
      sendBase++;
    }

    // Retransmit lost segments
    for (let i = sendBase; i < nextSeqNum; i++) {
      if (segments[i].status === 'lost') {
        segments[i].status = 'sent';
        addLog('retransmit', `↻ Ретрансмит #${i} (попытка ${segments[i].retransmits})`);
      }
    }

    renderWindow();
    await sleep(speed);
  }

  if (windowAnimRunning) {
    addLog('done', '✓ Все сегменты доставлены!');
    addXP(5);
    renderWindow();
  }
}
