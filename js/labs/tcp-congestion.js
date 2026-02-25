import { addXP, unlockAchievement } from '../core/gamification.js';

let congestionAnimId = null;
let congestionRunning = false;

export function runTcpCongestion(labState) {
  unlockAchievement('lab_congestion');
  addXP(3);
  const s = labState.tcpCongestion;
  const algorithm = ['tahoe', 'reno', 'newreno', 'cubic'][s.algorithm || 1];
  const mss = s.mss || 1460;
  const initSsthresh = s.ssthresh || 16;
  const lossProb = (s.lossProb || 5) / 100;
  const speed = s.speed || 200;

  const result = document.getElementById('labResult-tcpCongestion');

  // Simulate congestion control
  const maxRTTs = 60;
  let cwnd = 1;
  let ssthresh = initSsthresh;
  let phase = 'slow_start';
  const dataPoints = [];
  const events = [];

  let inFastRecovery = false; // NewReno: track fast recovery state
  let recoveryRtt = 0;       // NewReno: RTT when recovery started

  for (let rtt = 0; rtt < maxRTTs; rtt++) {
    const lost = Math.random() < lossProb;

    if (lost) {
      events.push({ rtt, type: 'loss', cwnd, ssthresh });
      if (algorithm === 'tahoe') {
        ssthresh = Math.max(Math.floor(cwnd / 2), 2);
        cwnd = 1;
        phase = 'slow_start';
        inFastRecovery = false;
      } else if (algorithm === 'reno') {
        ssthresh = Math.max(Math.floor(cwnd / 2), 2);
        cwnd = ssthresh; // Fast Recovery
        phase = 'congestion_avoidance';
      } else if (algorithm === 'newreno') {
        if (!inFastRecovery) {
          // Enter fast recovery
          ssthresh = Math.max(Math.floor(cwnd / 2), 2);
          cwnd = ssthresh + 3; // inflate by 3 dup ACKs
          inFastRecovery = true;
          recoveryRtt = rtt;
          phase = 'fast_recovery';
        } else {
          // Partial ACK during recovery — retransmit next lost segment
          cwnd += 1; // inflate window for each dup ACK
          phase = 'fast_recovery';
        }
      } else { // cubic
        ssthresh = Math.max(Math.floor(cwnd * 0.7), 2);
        cwnd = ssthresh;
        phase = 'congestion_avoidance';
      }
    } else {
      if (algorithm === 'newreno' && inFastRecovery) {
        // Full ACK received — exit fast recovery
        cwnd = ssthresh;
        inFastRecovery = false;
        phase = 'congestion_avoidance';
      } else if (phase === 'slow_start') {
        cwnd *= 2; // Double each RTT
        if (cwnd >= ssthresh) { phase = 'congestion_avoidance'; cwnd = ssthresh; }
      } else {
        if (algorithm === 'cubic') {
          cwnd += Math.max(1, Math.floor(0.4 * Math.cbrt(cwnd)));
        } else {
          cwnd += 1; // Linear growth in CA
        }
      }
    }

    cwnd = Math.max(1, Math.min(cwnd, 64));
    dataPoints.push({ rtt, cwnd, ssthresh, phase, lost });
  }

  // Draw canvas
  const canvasH = 220;
  result.innerHTML = `
    <div class="lab-result__title">Контроль перегрузки — ${algorithm.toUpperCase()}</div>
    <div class="card" style="padding:8px">
      <canvas id="congestionCanvas" style="width:100%;height:${canvasH}px"></canvas>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;font-size:.72rem">
      <span><span style="color:#2ecc71;font-weight:700">━</span> cwnd</span>
      <span><span style="color:#e74c3c;font-weight:700">- -</span> ssthresh</span>
      <span><span style="color:#e74c3c">✕</span> Потеря пакета</span>
      <span style="color:var(--text-secondary)">MSS: ${mss} Б | Алгоритм: ${algorithm.toUpperCase()}</span>
    </div>
    <div class="card mt-12" style="font-size:.75rem;line-height:1.6">
      <strong>Фазы:</strong><br>
      <span style="color:#3498db">● Slow Start</span> — cwnd удваивается каждый RTT (экспоненциальный рост)<br>
      <span style="color:#2ecc71">● Congestion Avoidance</span> — cwnd растёт на 1 MSS за RTT (линейный рост)<br>
      <span style="color:#e74c3c">● Потеря</span> — ${algorithm === 'tahoe' ? 'cwnd = 1, ssthresh = cwnd/2 (Tahoe: начинаем заново)' : algorithm === 'reno' ? 'ssthresh = cwnd/2, cwnd = ssthresh (Reno: Fast Recovery)' : algorithm === 'newreno' ? 'ssthresh = cwnd/2, cwnd = ssthresh+3 (NewReno: Fast Recovery с partial ACK)' : 'ssthresh = cwnd×0.7, cwnd = ssthresh (CUBIC: мягкий сброс)'}
    </div>
    <div style="margin-top:8px">
      <div class="lab-result__title">События</div>
      <div class="lab-stats">
        <div class="lab-stat"><div class="lab-stat__value">${events.length}</div><div class="lab-stat__label">Потерь</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${Math.max(...dataPoints.map(d => d.cwnd))}</div><div class="lab-stat__label">Макс. cwnd</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${Math.round(dataPoints.reduce((s, d) => s + d.cwnd, 0) / dataPoints.length)}</div><div class="lab-stat__label">Среднее cwnd</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${(Math.round(dataPoints.reduce((s, d) => s + d.cwnd, 0) / dataPoints.length * mss / 1024))} КБ/RTT</div><div class="lab-stat__label">Средняя скорость</div></div>
      </div>
    </div>
  `;

  // Draw the graph
  const canvas = document.getElementById('congestionCanvas');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = canvasH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const w = rect.width, h = canvasH;

  const pad = { top: 10, right: 10, bottom: 25, left: 35 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const maxCwnd = Math.max(64, ...dataPoints.map(d => d.cwnd));

  // Grid
  ctx.strokeStyle = '#1a2030';
  ctx.lineWidth = 1;
  for (let v = 0; v <= maxCwnd; v += Math.ceil(maxCwnd / 8)) {
    const y = pad.top + plotH - (v / maxCwnd) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(v, pad.left - 4, y + 3);
  }

  // Labels
  ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('RTT', w / 2, h - 2);
  ctx.save(); ctx.translate(10, h / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText('cwnd (MSS)', 0, 0); ctx.restore();

  // Animate points
  let animIdx = 0;

  function drawFrame() {
    if (animIdx >= dataPoints.length) { congestionRunning = false; return; }
    animIdx = Math.min(animIdx + 1, dataPoints.length);

    // Clear plot area
    ctx.clearRect(pad.left, pad.top, plotW, plotH);

    // Redraw grid
    ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 0.5;
    for (let v = 0; v <= maxCwnd; v += Math.ceil(maxCwnd / 8)) {
      const y = pad.top + plotH - (v / maxCwnd) * plotH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
    }

    // Draw ssthresh line
    ctx.setLineDash([4, 4]); ctx.strokeStyle = '#e74c3c80'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < animIdx; i++) {
      const x = pad.left + (i / maxRTTs) * plotW;
      const y = pad.top + plotH - (dataPoints[i].ssthresh / maxCwnd) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw cwnd line
    ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < animIdx; i++) {
      const x = pad.left + (i / maxRTTs) * plotW;
      const y = pad.top + plotH - (dataPoints[i].cwnd / maxCwnd) * plotH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Phase colors under the line
    for (let i = 0; i < animIdx; i++) {
      const x = pad.left + (i / maxRTTs) * plotW;
      const y = pad.top + plotH - (dataPoints[i].cwnd / maxCwnd) * plotH;
      const color = dataPoints[i].phase === 'slow_start' ? '#3498db40' : dataPoints[i].phase === 'fast_recovery' ? '#e67e2240' : '#2ecc7140';
      ctx.fillStyle = color;
      ctx.fillRect(x, y, plotW / maxRTTs, pad.top + plotH - y);
    }

    // Loss markers
    for (let i = 0; i < animIdx; i++) {
      if (dataPoints[i].lost) {
        const x = pad.left + (i / maxRTTs) * plotW;
        const y = pad.top + plotH - (dataPoints[i].cwnd / maxCwnd) * plotH;
        ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('✕', x, y - 4);
      }
    }

    congestionAnimId = setTimeout(() => requestAnimationFrame(drawFrame), speed);
  }

  if (congestionAnimId) clearTimeout(congestionAnimId);
  congestionRunning = true;
  requestAnimationFrame(drawFrame);
}
