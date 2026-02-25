import { addXP, unlockAchievement } from '../core/gamification.js';

/* ============================================================
   Digital Oscilloscope — 2-channel, triggers, measurements, math
   ============================================================ */

const TIME_DIVS = [
  { val: 0.000001, label: '1 мкс' }, { val: 0.000002, label: '2 мкс' },
  { val: 0.000005, label: '5 мкс' }, { val: 0.00001, label: '10 мкс' },
  { val: 0.00002, label: '20 мкс' }, { val: 0.00005, label: '50 мкс' },
  { val: 0.0001, label: '100 мкс' }, { val: 0.0002, label: '200 мкс' },
  { val: 0.0005, label: '500 мкс' }, { val: 0.001, label: '1 мс' },
  { val: 0.002, label: '2 мс' }, { val: 0.005, label: '5 мс' },
  { val: 0.01, label: '10 мс' }, { val: 0.02, label: '20 мс' },
  { val: 0.05, label: '50 мс' }, { val: 0.1, label: '100 мс' },
  { val: 0.2, label: '200 мс' }, { val: 0.5, label: '500 мс' },
  { val: 1, label: '1 с' }
];

const VOLT_DIVS = [
  { val: 0.001, label: '1 мВ' }, { val: 0.002, label: '2 мВ' },
  { val: 0.005, label: '5 мВ' }, { val: 0.01, label: '10 мВ' },
  { val: 0.02, label: '20 мВ' }, { val: 0.05, label: '50 мВ' },
  { val: 0.1, label: '100 мВ' }, { val: 0.2, label: '200 мВ' },
  { val: 0.5, label: '500 мВ' }, { val: 1, label: '1 В' },
  { val: 2, label: '2 В' }, { val: 5, label: '5 В' }
];

const WAVEFORMS = [
  { id: 'sine', name: 'Синус', fn: (t, f) => Math.sin(2 * Math.PI * f * t) },
  { id: 'square', name: 'Прямоуг.', fn: (t, f) => Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1 },
  { id: 'triangle', name: 'Треуг.', fn: (t, f) => 2 * Math.abs(2 * (t * f - Math.floor(t * f + 0.5))) - 1 },
  { id: 'sawtooth', name: 'Пила', fn: (t, f) => 2 * (t * f - Math.floor(t * f)) - 1 },
  { id: 'noise', name: 'Шум', fn: () => Math.random() * 2 - 1 }
];

let oscState = {
  ch1: { on: true, wave: 0, freq: 1000, amp: 1.0, offset: 0, coupling: 'DC' },
  ch2: { on: false, wave: 0, freq: 500, amp: 0.5, offset: 0, coupling: 'DC' },
  timeIdx: 9, // 1 ms/div
  ch1VoltIdx: 9, // 1 V/div
  ch2VoltIdx: 9,
  trigger: { source: 'ch1', edge: 'rising', level: 0, mode: 'auto' },
  math: 'none', // none, add, sub, mul, fft1, fft2
  running: true,
  cursorMode: false,
  cursor1X: 0.3, cursor2X: 0.7
};

let animFrame = null;
let oscCanvas = null;

function generateSamples(ch, totalTime, numSamples) {
  const wf = WAVEFORMS[ch.wave];
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = (i / numSamples) * totalTime;
    let v = wf.fn(t, ch.freq) * ch.amp + ch.offset;
    if (ch.coupling === 'AC') v -= ch.offset;
    if (ch.coupling === 'GND') v = 0;
    samples[i] = v;
  }
  return samples;
}

function measure(samples, totalTime) {
  let min = Infinity, max = -Infinity, sum = 0, sumSq = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
    sumSq += v * v;
  }
  const vpp = max - min;
  const vrms = Math.sqrt(sumSq / samples.length);
  // Freq estimation via zero crossings
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if ((samples[i - 1] < 0 && samples[i] >= 0) || (samples[i - 1] >= 0 && samples[i] < 0)) crossings++;
  }
  const freq = crossings / (2 * totalTime);
  const period = freq > 0 ? 1 / freq : 0;
  return { vpp, vrms, freq, period, min, max };
}

function simpleFFT(samples, size) {
  const n = Math.min(size, samples.length);
  const mag = new Float32Array(n / 2);
  for (let k = 0; k < n / 2; k++) {
    let re = 0, im = 0;
    for (let i = 0; i < n; i++) {
      const angle = -2 * Math.PI * k * i / n;
      re += samples[i] * Math.cos(angle);
      im += samples[i] * Math.sin(angle);
    }
    mag[k] = Math.sqrt(re * re + im * im) / n;
  }
  return mag;
}

function drawOscilloscope() {
  if (!oscCanvas) return;
  const ctx = oscCanvas.getContext('2d');
  const W = oscCanvas.width;
  const H = oscCanvas.height;
  const divX = 10, divY = 8;
  const timeDiv = TIME_DIVS[oscState.timeIdx].val;
  const totalTime = timeDiv * divX;
  const numSamples = 1024;

  // Background
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#1a2030';
  ctx.lineWidth = 1;
  for (let i = 0; i <= divX; i++) {
    const x = (i / divX) * W;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let i = 0; i <= divY; i++) {
    const y = (i / divY) * H;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // Center crosshair
  ctx.strokeStyle = '#2a3444';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

  // Draw channels
  const drawCh = (ch, voltIdx, color) => {
    if (!ch.on) return null;
    const vDiv = VOLT_DIVS[voltIdx].val;
    const samples = generateSamples(ch, totalTime, numSamples);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < numSamples; i++) {
      const x = (i / numSamples) * W;
      const y = H / 2 - (samples[i] / (vDiv * divY / 2)) * (H / 2);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    return samples;
  };

  const s1 = drawCh(oscState.ch1, oscState.ch1VoltIdx, '#f1c40f');
  const s2 = drawCh(oscState.ch2, oscState.ch2VoltIdx, '#3498db');

  // Math channel
  if (oscState.math !== 'none' && s1 && s2) {
    const mathSamples = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      if (oscState.math === 'add') mathSamples[i] = s1[i] + s2[i];
      else if (oscState.math === 'sub') mathSamples[i] = s1[i] - s2[i];
      else if (oscState.math === 'mul') mathSamples[i] = s1[i] * s2[i];
    }
    if (['add', 'sub', 'mul'].includes(oscState.math)) {
      const vDiv = VOLT_DIVS[oscState.ch1VoltIdx].val;
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i < numSamples; i++) {
        const x = (i / numSamples) * W;
        const y = H / 2 - (mathSamples[i] / (vDiv * divY / 2)) * (H / 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // FFT display
  if ((oscState.math === 'fft1' && s1) || (oscState.math === 'fft2' && s2)) {
    const src = oscState.math === 'fft1' ? s1 : s2;
    const fftSize = 512;
    const mag = simpleFFT(src, fftSize);
    const maxMag = Math.max(...mag) || 1;
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < fftSize / 2; i++) {
      const x = (i / (fftSize / 2)) * W;
      const y = H - (mag[i] / maxMag) * H * 0.9;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Label
    ctx.fillStyle = '#2ecc71';
    ctx.font = '11px monospace';
    ctx.fillText('FFT', 8, 14);
  }

  // Cursors
  if (oscState.cursorMode) {
    [oscState.cursor1X, oscState.cursor2X].forEach((cx, i) => {
      ctx.strokeStyle = i === 0 ? '#e74c3c' : '#2ecc71';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 3]);
      const x = cx * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = '10px monospace';
      const tVal = cx * totalTime;
      ctx.fillText(`C${i + 1}: ${tVal < 0.001 ? (tVal * 1e6).toFixed(0) + 'мкс' : (tVal * 1e3).toFixed(2) + 'мс'}`, x + 4, 14 + i * 14);
    });
    // Delta
    const dt = Math.abs(oscState.cursor2X - oscState.cursor1X) * totalTime;
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`Δt=${dt < 0.001 ? (dt * 1e6).toFixed(0) + 'мкс' : (dt * 1e3).toFixed(2) + 'мс'}  f=${dt > 0 ? (1 / dt).toFixed(1) + 'Гц' : '—'}`, W - 200, 14);
  }

  // Trigger level line
  if (oscState.trigger.source !== 'none') {
    const vDiv = VOLT_DIVS[oscState.trigger.source === 'ch1' ? oscState.ch1VoltIdx : oscState.ch2VoltIdx].val;
    const y = H / 2 - (oscState.trigger.level / (vDiv * divY / 2)) * (H / 2);
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(20, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#e67e22';
    ctx.font = '9px monospace';
    ctx.fillText('T', 2, y - 3);
    // Show trigger mode label
    const modeLabel = oscState.trigger.mode === 'auto' ? 'Auto' : oscState.trigger.mode === 'normal' ? 'Norm' : 'Sngl';
    ctx.fillText(modeLabel, W - 40, 14);
  }

  // Labels
  ctx.font = '10px monospace';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText(`CH1: ${VOLT_DIVS[oscState.ch1VoltIdx].label}/div`, 4, H - 24);
  ctx.fillStyle = '#3498db';
  ctx.fillText(`CH2: ${VOLT_DIVS[oscState.ch2VoltIdx].label}/div`, 4, H - 10);
  ctx.fillStyle = '#aaa';
  ctx.fillText(`${TIME_DIVS[oscState.timeIdx].label}/div`, W - 80, H - 10);

  if (oscState.running) animFrame = requestAnimationFrame(drawOscilloscope);
}

function renderOscControls() {
  const container = document.getElementById('labResult-oscilloscope');
  if (!container) return;

  const m1 = oscState.ch1.on ? measure(generateSamples(oscState.ch1, TIME_DIVS[oscState.timeIdx].val * 10, 1024), TIME_DIVS[oscState.timeIdx].val * 10) : null;
  const m2 = oscState.ch2.on ? measure(generateSamples(oscState.ch2, TIME_DIVS[oscState.timeIdx].val * 10, 1024), TIME_DIVS[oscState.timeIdx].val * 10) : null;

  container.innerHTML = `
    <div class="lab-result__title">Осциллограф (2 канала)</div>
    <div class="sig-canvas-wrap">
      <canvas id="oscCanvas" width="800" height="400"></canvas>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;align-items:center">
      <button class="sig-tab${oscState.running ? ' active' : ''}" id="oscRunStop">${oscState.running ? '⏸ Стоп' : '▶ Старт'}</button>
      <button class="sig-tab${oscState.cursorMode ? ' active' : ''}" id="oscCursors">📏 Курсоры</button>
      <span style="font-size:.72rem;color:var(--text-secondary);margin-left:8px">Триггер:</span>
      <button class="sig-tab${oscState.trigger.mode === 'auto' ? ' active' : ''}" data-trigmode="auto">Auto</button>
      <button class="sig-tab${oscState.trigger.mode === 'normal' ? ' active' : ''}" data-trigmode="normal">Normal</button>
      <button class="sig-tab${oscState.trigger.mode === 'single' ? ' active' : ''}" data-trigmode="single">Single</button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
      <div class="enc-step" style="padding:8px;border-left:3px solid #f1c40f">
        <div class="enc-step__title">CH1 <label style="float:right"><input type="checkbox" id="oscCh1On" ${oscState.ch1.on ? 'checked' : ''}> Вкл</label></div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
          <select id="oscCh1Wave" style="flex:1;padding:4px;border-radius:4px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.7rem">
            ${WAVEFORMS.map((w, i) => `<option value="${i}"${i === oscState.ch1.wave ? ' selected' : ''}>${w.name}</option>`).join('')}
          </select>
          <select id="oscCh1Coup" style="padding:4px;border-radius:4px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.7rem">
            <option${oscState.ch1.coupling === 'DC' ? ' selected' : ''}>DC</option>
            <option${oscState.ch1.coupling === 'AC' ? ' selected' : ''}>AC</option>
            <option${oscState.ch1.coupling === 'GND' ? ' selected' : ''}>GND</option>
          </select>
        </div>
        <div class="lab-param" style="margin:6px 0 0"><div class="lab-param__label"><span>Частота</span><span class="lab-param__value" id="oscCh1FreqVal">${oscState.ch1.freq} Гц</span></div>
        <input type="range" id="oscCh1Freq" min="10" max="100000" value="${oscState.ch1.freq}" step="10"></div>
        <div class="lab-param" style="margin:4px 0 0"><div class="lab-param__label"><span>Амплитуда</span><span class="lab-param__value">${oscState.ch1.amp} В</span></div>
        <input type="range" id="oscCh1Amp" min="0.01" max="5" value="${oscState.ch1.amp}" step="0.01"></div>
        <div class="lab-param" style="margin:4px 0 0"><div class="lab-param__label"><span>В/дел</span><span class="lab-param__value">${VOLT_DIVS[oscState.ch1VoltIdx].label}</span></div>
        <input type="range" id="oscCh1Volt" min="0" max="${VOLT_DIVS.length - 1}" value="${oscState.ch1VoltIdx}" step="1"></div>
      </div>

      <div class="enc-step" style="padding:8px;border-left:3px solid #3498db">
        <div class="enc-step__title">CH2 <label style="float:right"><input type="checkbox" id="oscCh2On" ${oscState.ch2.on ? 'checked' : ''}> Вкл</label></div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
          <select id="oscCh2Wave" style="flex:1;padding:4px;border-radius:4px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.7rem">
            ${WAVEFORMS.map((w, i) => `<option value="${i}"${i === oscState.ch2.wave ? ' selected' : ''}>${w.name}</option>`).join('')}
          </select>
          <select id="oscCh2Coup" style="padding:4px;border-radius:4px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.7rem">
            <option${oscState.ch2.coupling === 'DC' ? ' selected' : ''}>DC</option>
            <option${oscState.ch2.coupling === 'AC' ? ' selected' : ''}>AC</option>
            <option${oscState.ch2.coupling === 'GND' ? ' selected' : ''}>GND</option>
          </select>
        </div>
        <div class="lab-param" style="margin:6px 0 0"><div class="lab-param__label"><span>Частота</span><span class="lab-param__value" id="oscCh2FreqVal">${oscState.ch2.freq} Гц</span></div>
        <input type="range" id="oscCh2Freq" min="10" max="100000" value="${oscState.ch2.freq}" step="10"></div>
        <div class="lab-param" style="margin:4px 0 0"><div class="lab-param__label"><span>Амплитуда</span><span class="lab-param__value">${oscState.ch2.amp} В</span></div>
        <input type="range" id="oscCh2Amp" min="0.01" max="5" value="${oscState.ch2.amp}" step="0.01"></div>
        <div class="lab-param" style="margin:4px 0 0"><div class="lab-param__label"><span>В/дел</span><span class="lab-param__value">${VOLT_DIVS[oscState.ch2VoltIdx].label}</span></div>
        <input type="range" id="oscCh2Volt" min="0" max="${VOLT_DIVS.length - 1}" value="${oscState.ch2VoltIdx}" step="1"></div>
      </div>
    </div>

    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
      <label style="font-size:.72rem;font-weight:600">Развёртка:</label>
      <span class="lab-param__value" id="oscTimeDivVal">${TIME_DIVS[oscState.timeIdx].label}/div</span>
      <input type="range" id="oscTimeDiv" min="0" max="${TIME_DIVS.length - 1}" value="${oscState.timeIdx}" step="1" style="flex:1;accent-color:var(--accent)">
    </div>

    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
      <label style="font-size:.72rem;font-weight:600">Матем.:</label>
      <select id="oscMath" style="padding:5px 8px;border-radius:4px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.72rem">
        <option value="none"${oscState.math === 'none' ? ' selected' : ''}>Нет</option>
        <option value="add"${oscState.math === 'add' ? ' selected' : ''}>CH1 + CH2</option>
        <option value="sub"${oscState.math === 'sub' ? ' selected' : ''}>CH1 − CH2</option>
        <option value="mul"${oscState.math === 'mul' ? ' selected' : ''}>CH1 × CH2</option>
        <option value="fft1"${oscState.math === 'fft1' ? ' selected' : ''}>FFT(CH1)</option>
        <option value="fft2"${oscState.math === 'fft2' ? ' selected' : ''}>FFT(CH2)</option>
      </select>
    </div>

    ${m1 || m2 ? `
    <div class="lab-stats" style="margin-bottom:12px">
      ${m1 ? `
        <div class="lab-stat" style="border-left:3px solid #f1c40f"><div class="lab-stat__value" style="font-size:.9rem;color:#f1c40f">${m1.vpp.toFixed(3)} В</div><div class="lab-stat__label">Vpp CH1</div></div>
        <div class="lab-stat"><div class="lab-stat__value" style="font-size:.9rem">${m1.vrms.toFixed(3)} В</div><div class="lab-stat__label">Vrms CH1</div></div>
        <div class="lab-stat"><div class="lab-stat__value" style="font-size:.9rem">${m1.freq.toFixed(1)} Гц</div><div class="lab-stat__label">Freq CH1</div></div>
        <div class="lab-stat"><div class="lab-stat__value" style="font-size:.9rem">${m1.period < 0.001 ? (m1.period * 1e6).toFixed(0) + ' мкс' : (m1.period * 1e3).toFixed(2) + ' мс'}</div><div class="lab-stat__label">Period CH1</div></div>
      ` : ''}
      ${m2 ? `
        <div class="lab-stat" style="border-left:3px solid #3498db"><div class="lab-stat__value" style="font-size:.9rem;color:#3498db">${m2.vpp.toFixed(3)} В</div><div class="lab-stat__label">Vpp CH2</div></div>
        <div class="lab-stat"><div class="lab-stat__value" style="font-size:.9rem">${m2.freq.toFixed(1)} Гц</div><div class="lab-stat__label">Freq CH2</div></div>
      ` : ''}
    </div>` : ''}
  `;

  // Get canvas and start rendering
  oscCanvas = document.getElementById('oscCanvas');
  if (oscCanvas) {
    oscCanvas.style.width = '100%';
    oscCanvas.style.height = 'auto';
    if (oscState.running) {
      cancelAnimationFrame(animFrame);
      drawOscilloscope();
    } else {
      drawOscilloscope();
    }
  }

  // Bind controls
  const bind = (id, handler) => document.getElementById(id)?.addEventListener('input', handler);
  const bindChange = (id, handler) => document.getElementById(id)?.addEventListener('change', handler);
  const bindClick = (id, handler) => document.getElementById(id)?.addEventListener('click', handler);

  bindClick('oscRunStop', () => { oscState.running = !oscState.running; if (oscState.running) drawOscilloscope(); renderOscControls(); });
  bindClick('oscCursors', () => { oscState.cursorMode = !oscState.cursorMode; renderOscControls(); });

  // Trigger mode buttons
  container.querySelectorAll('[data-trigmode]').forEach(btn => {
    btn.addEventListener('click', () => {
      oscState.trigger.mode = btn.dataset.trigmode;
      if (oscState.trigger.mode === 'single') {
        // Single: run one frame, then stop
        oscState.running = true;
        cancelAnimationFrame(animFrame);
        drawOscilloscope();
        oscState.running = false;
      } else if (oscState.trigger.mode === 'normal' || oscState.trigger.mode === 'auto') {
        oscState.running = true;
        drawOscilloscope();
      }
      renderOscControls();
    });
  });
  bindChange('oscCh1On', (e) => { oscState.ch1.on = e.target.checked; renderOscControls(); });
  bindChange('oscCh2On', (e) => { oscState.ch2.on = e.target.checked; renderOscControls(); });
  bindChange('oscCh1Wave', (e) => { oscState.ch1.wave = parseInt(e.target.value); });
  bindChange('oscCh2Wave', (e) => { oscState.ch2.wave = parseInt(e.target.value); });
  bindChange('oscCh1Coup', (e) => { oscState.ch1.coupling = e.target.value; });
  bindChange('oscCh2Coup', (e) => { oscState.ch2.coupling = e.target.value; });
  bind('oscCh1Freq', (e) => { oscState.ch1.freq = parseFloat(e.target.value); document.getElementById('oscCh1FreqVal').textContent = e.target.value + ' Гц'; });
  bind('oscCh2Freq', (e) => { oscState.ch2.freq = parseFloat(e.target.value); document.getElementById('oscCh2FreqVal').textContent = e.target.value + ' Гц'; });
  bind('oscCh1Amp', (e) => { oscState.ch1.amp = parseFloat(e.target.value); renderOscControls(); });
  bind('oscCh2Amp', (e) => { oscState.ch2.amp = parseFloat(e.target.value); renderOscControls(); });
  bind('oscCh1Volt', (e) => { oscState.ch1VoltIdx = parseInt(e.target.value); renderOscControls(); });
  bind('oscCh2Volt', (e) => { oscState.ch2VoltIdx = parseInt(e.target.value); renderOscControls(); });
  bind('oscTimeDiv', (e) => { oscState.timeIdx = parseInt(e.target.value); document.getElementById('oscTimeDivVal').textContent = TIME_DIVS[oscState.timeIdx].label + '/div'; });
  bindChange('oscMath', (e) => { oscState.math = e.target.value; });

  addXP(2);
  unlockAchievement('lab_oscilloscope');
}

export function initOscilloscope() {
  const obs = new MutationObserver(() => {
    const el = document.getElementById('lab-oscilloscope');
    if (el?.classList.contains('active')) {
      if (!oscCanvas) renderOscControls();
    } else {
      oscState.running = false;
      cancelAnimationFrame(animFrame);
      oscCanvas = null;
    }
  });
  const labEl = document.getElementById('lab-oscilloscope');
  if (labEl) {
    obs.observe(labEl, { attributes: true, attributeFilter: ['class'] });
    if (labEl.classList.contains('active')) renderOscControls();
  }
}
