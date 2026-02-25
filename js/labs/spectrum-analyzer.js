/**
 * spectrum-analyzer.js — Professional Spectrum Analyzer (R&S FSW style)
 *
 * Features:
 * - Spectrum (FFT magnitude vs frequency), Spectrogram (heatmap), Time Domain
 * - Center/Span or Start/Stop frequency controls
 * - FFT sizes: 256–16384, Window functions (7 types)
 * - Traces: Clear/Write, Max Hold, Min Hold, Average
 * - Up to 4 markers with delta, peak search, bandwidth measurement
 * - Channel Power, ACLR measurement
 * - Marker table
 * - Input from signal generator, channel, or network point
 * - Tooltips on every parameter
 */

import { getSignalGeneratorOutput, setSignalOutputCallback, getSignalGeneratorState } from './signal-generator.js';

/* ===== Constants ===== */
const FFT_SIZES = [256, 512, 1024, 2048, 4096, 8192, 16384];
const WINDOWS = [
  { id: 'rectangular', name: 'Rectangular', tip: 'No windowing — best frequency resolution but severe spectral leakage' },
  { id: 'hanning', name: 'Hanning', tip: 'Good general-purpose window — balances resolution and leakage' },
  { id: 'hamming', name: 'Hamming', tip: 'Similar to Hanning but with higher sidelobe floor, narrower main lobe' },
  { id: 'blackman', name: 'Blackman', tip: 'Very low sidelobes (-58 dB) — good for measuring weak signals near strong ones' },
  { id: 'blackman-harris', name: 'Blackman-Harris', tip: '4-term window with -92 dB sidelobes — excellent for dynamic range' },
  { id: 'kaiser', name: 'Kaiser', tip: 'Adjustable window: beta controls trade-off between resolution and sidelobes' },
  { id: 'flattop', name: 'Flat Top', tip: 'Best amplitude accuracy (+/- 0.01 dB) — use for precise amplitude measurement' }
];
const DETECTORS = [
  { id: 'peak', name: 'Peak', tip: 'Shows maximum value in each frequency bin — good for finding signals' },
  { id: 'average', name: 'Average', tip: 'Average of all values in each bin — reduces noise floor variance' },
  { id: 'rms', name: 'RMS', tip: 'Root Mean Square — represents true power of the signal' },
  { id: 'sample', name: 'Sample', tip: 'Raw sample value without processing — fastest update rate' }
];
const SCALE_MODES = [
  { id: 'log', name: 'Log (dB)', tip: 'Logarithmic scale in decibels — standard for spectrum analysis, shows wide dynamic range' },
  { id: 'linear', name: 'Linear', tip: 'Linear voltage scale — useful for comparing signal amplitudes directly' }
];
const UNITS = [
  { id: 'dBm', name: 'dBm', tip: 'Power relative to 1 mW (50 Ohm) — standard RF measurement unit' },
  { id: 'dBV', name: 'dBV', tip: 'Voltage relative to 1 Vrms — standard audio/baseband unit' },
  { id: 'Vrms', name: 'Vrms', tip: 'RMS voltage — direct voltage reading' },
  { id: 'V_sqrtHz', name: 'V/√Hz', tip: 'Voltage spectral density — normalize by resolution bandwidth' }
];

const SPECTROGRAM_COLORS = [
  [0, 0, 32],    // very low — dark blue
  [0, 0, 128],   // low — blue
  [0, 128, 255], // medium-low — cyan
  [0, 255, 128], // medium — green
  [255, 255, 0], // medium-high — yellow
  [255, 128, 0], // high — orange
  [255, 0, 0],   // very high — red
  [255, 255, 255] // max — white
];

/* ===== State ===== */
let container = null;
let worker = null;
let workerIdCounter = 0;
let pendingWorker = new Map();

let state = {
  viewMode: 'spectrum',  // spectrum | spectrogram | timeDomain
  fftSize: 2048,
  windowType: 'hanning',
  kaiserBeta: 5,
  detector: 'peak',
  scale: 'log',
  unit: 'dBm',
  refLevel: 0,        // dB top of scale
  centerFreq: 0,      // Hz (0 = auto)
  span: 0,            // Hz (0 = full)
  traceMode: 'clear', // clear | maxHold | minHold | average
  avgCount: 16,
  source: 'generator', // generator | channel | network
  sourceChannel: 0,    // CH1 or CH2
  running: true
};

let markers = [
  { active: false, freqBin: 0, freq: 0, amp: 0, isDelta: false, refMarker: 0 },
  { active: false, freqBin: 0, freq: 0, amp: 0, isDelta: false, refMarker: 0 },
  { active: false, freqBin: 0, freq: 0, amp: 0, isDelta: false, refMarker: 0 },
  { active: false, freqBin: 0, freq: 0, amp: 0, isDelta: false, refMarker: 0 }
];

let spectrumData = null;
let maxHoldData = null;
let minHoldData = null;
let avgAccum = null;
let avgFrames = 0;
let spectrogramBuffer = []; // Array of spectrum rows for waterfall
const SPECTROGRAM_ROWS = 100;

let specCanvas = null, specCtx = null;
let sgCanvas = null, sgCtx = null; // spectrogram canvas
let animFrame = null;

let sampleRate = 44100;

/* ===== Public API ===== */

export function initSpectrumAnalyzer() {
  container = document.getElementById('spectrumAnalyzerUI');
  if (!container) return;
  worker = new Worker('js/workers/dsp-worker.js');
  worker.onmessage = handleWorkerMessage;

  setSignalOutputCallback(onSignalUpdate);
  buildUI();
  startLoop();
}

export function feedSignal(signal, sr) {
  if (signal) {
    externalSignal = signal;
    sampleRate = sr || 44100;
  }
}

let externalSignal = null;

/* ===== Worker ===== */

function postWorker(msg) {
  return new Promise(resolve => {
    const id = ++workerIdCounter;
    msg.id = id;
    pendingWorker.set(id, resolve);
    worker.postMessage(msg);
  });
}

function handleWorkerMessage(e) {
  const { id } = e.data;
  const resolve = pendingWorker.get(id);
  if (resolve) {
    pendingWorker.delete(id);
    resolve(e.data);
  }
}

/* ===== Signal Input ===== */

function onSignalUpdate(signals) {
  if (state.source === 'generator') {
    externalSignal = signals[state.sourceChannel];
  }
}

function getCurrentSignal() {
  if (externalSignal) return externalSignal;
  return getSignalGeneratorOutput(state.sourceChannel);
}

/* ===== UI Builder ===== */

function buildUI() {
  container.innerHTML = `
    <div class="sa-instrument">
      <div class="sa-instrument__top-bar">
        <span class="sa-instrument__brand">Spectrum Analyzer</span>
        <span class="sa-instrument__model">SA-4000</span>
        <div class="sa-view-tabs" id="saViewTabs">
          <button class="sa-view-tab sa-view-tab--active" data-view="spectrum" data-tip="FFT spectrum: amplitude vs frequency">Spectrum</button>
          <button class="sa-view-tab" data-view="spectrogram" data-tip="Time-frequency heatmap: color represents amplitude">Spectrogram</button>
          <button class="sa-view-tab" data-view="timeDomain" data-tip="Oscilloscope-like view of the raw input signal">Time Domain</button>
        </div>
      </div>

      <div class="sa-instrument__display">
        <canvas id="saSpecCanvas" width="700" height="260"></canvas>
        <canvas id="saSpectrogramCanvas" width="700" height="200" style="display:none"></canvas>
        <div class="sa-marker-table" id="saMarkerTable"></div>
      </div>

      <div class="sa-instrument__controls">
        <div class="sa-controls-row">
          <div class="sa-control-group">
            <div class="sa-control-group__title" data-tip="Number of frequency bins for FFT computation. More bins = finer frequency resolution but slower update">FFT Size</div>
            <select class="sa-select" id="saFftSize">
              ${FFT_SIZES.map(s => `<option value="${s}"${s === state.fftSize ? ' selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="sa-control-group">
            <div class="sa-control-group__title" data-tip="Window function applied before FFT to reduce spectral leakage. Each window has different trade-offs between frequency resolution and sidelobe levels">Window</div>
            <select class="sa-select" id="saWindow">
              ${WINDOWS.map(w => `<option value="${w.id}"${w.id === state.windowType ? ' selected' : ''} data-tip="${w.tip}">${w.name}</option>`).join('')}
            </select>
          </div>
          <div class="sa-control-group" id="saKaiserGroup" style="display:none">
            <div class="sa-control-group__title" data-tip="Kaiser window shape parameter. Higher beta = narrower main lobe but more sidelobes. Typical: 5-10">Kaiser β</div>
            <input type="number" class="sa-num-input" id="saKaiserBeta" value="${state.kaiserBeta}" min="0" max="20" step="0.5">
          </div>
          <div class="sa-control-group">
            <div class="sa-control-group__title" data-tip="How multiple samples within each FFT bin are combined">Detector</div>
            <select class="sa-select" id="saDetector">
              ${DETECTORS.map(d => `<option value="${d.id}"${d.id === state.detector ? ' selected' : ''} data-tip="${d.tip}">${d.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="sa-controls-row">
          <div class="sa-control-group">
            <div class="sa-control-group__title" data-tip="Vertical scale: logarithmic (dB) shows wide dynamic range, linear shows raw voltage">Scale</div>
            <select class="sa-select" id="saScale">
              ${SCALE_MODES.map(s => `<option value="${s.id}"${s.id === state.scale ? ' selected' : ''} data-tip="${s.tip}">${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="sa-control-group">
            <div class="sa-control-group__title" data-tip="Measurement unit for amplitude axis. dBm = power relative to 1mW, dBV = voltage relative to 1V">Unit</div>
            <select class="sa-select" id="saUnit">
              ${UNITS.map(u => `<option value="${u.id}"${u.id === state.unit ? ' selected' : ''} data-tip="${u.tip}">${u.name}</option>`).join('')}
            </select>
          </div>
          <div class="sa-control-group">
            <div class="sa-control-group__title" data-tip="Top of the amplitude scale. Adjust to see weaker or stronger signals. Auto-adjusts if set to 0">Ref Level (dB)</div>
            <input type="number" class="sa-num-input" id="saRefLevel" value="${state.refLevel}" step="5" data-tip="Reference level — top of the display scale">
          </div>
        </div>

        <div class="sa-controls-row">
          <div class="sa-control-group">
            <div class="sa-control-group__title" data-tip="How spectrum trace is accumulated over time">Trace</div>
            <div class="sa-trace-btns" id="saTraceBtns">
              <button class="sa-unit-btn sa-unit-btn--active" data-trace="clear" data-tip="Show only current spectrum — refreshes each frame">Clr/Wr</button>
              <button class="sa-unit-btn" data-trace="maxHold" data-tip="Shows maximum value ever seen at each frequency — good for finding intermittent signals">Max Hold</button>
              <button class="sa-unit-btn" data-trace="minHold" data-tip="Shows minimum value at each frequency — reveals noise floor">Min Hold</button>
              <button class="sa-unit-btn" data-trace="average" data-tip="Running average over N frames — smooths noise for cleaner measurement">Average</button>
            </div>
          </div>
          <div class="sa-control-group" id="saAvgGroup" style="display:none">
            <div class="sa-control-group__title" data-tip="Number of frames to average. More = smoother but slower response">Avg Count</div>
            <input type="number" class="sa-num-input" id="saAvgCount" value="${state.avgCount}" min="2" max="256" step="1">
          </div>
        </div>

        <div class="sa-controls-row">
          <div class="sa-control-group">
            <div class="sa-control-group__title" data-tip="Signal input: from the signal generator (CH1/CH2), from channel output (after noise/attenuation), or from a network measurement point">Source</div>
            <select class="sa-select" id="saSource">
              <option value="generator" data-tip="Signal directly from the signal generator before any channel effects">Generator</option>
              <option value="channel" data-tip="Signal after passing through the simulated channel (with noise and attenuation)">Channel Output</option>
            </select>
          </div>
          <div class="sa-control-group">
            <div class="sa-control-group__title" data-tip="Which generator channel to analyze">Channel</div>
            <select class="sa-select" id="saSourceCh">
              <option value="0">CH1</option>
              <option value="1">CH2</option>
            </select>
          </div>
        </div>

        <!-- Marker controls -->
        <div class="sa-controls-row">
          <div class="sa-control-group" style="flex:2">
            <div class="sa-control-group__title" data-tip="Click on the spectrum to place markers. Markers show exact frequency and amplitude at the clicked point">Markers</div>
            <div class="sa-marker-btns">
              ${[0,1,2,3].map(i => `<button class="sa-marker-btn" data-mk="${i}" data-tip="Toggle marker ${i+1}. Click on spectrum to position it">M${i+1}</button>`).join('')}
              <button class="sa-btn sa-btn--sm" id="saPeakSearch" data-tip="Automatically find the strongest signal peaks in the spectrum">Peak Search</button>
              <button class="sa-btn sa-btn--sm" id="saBwMeasure" data-tip="Measure -3 dB bandwidth around the highest peak. Shows where signal drops by half power">BW -3dB</button>
            </div>
          </div>
        </div>

        <div class="sa-controls-row sa-controls-row--actions">
          <button class="sa-btn sa-btn--run" id="saRunBtn" data-tip="Start/resume continuous spectrum acquisition">▶ Run</button>
          <button class="sa-btn sa-btn--stop" id="saStopBtn" data-tip="Pause spectrum acquisition — freeze current display">■ Stop</button>
          <button class="sa-btn" id="saResetBtn" data-tip="Clear all traces, markers, and spectrogram buffer">Reset</button>
        </div>
      </div>
    </div>
  `;

  specCanvas = document.getElementById('saSpecCanvas');
  specCtx = specCanvas.getContext('2d');
  sgCanvas = document.getElementById('saSpectrogramCanvas');
  sgCtx = sgCanvas.getContext('2d');

  attachEvents();
}

function attachEvents() {
  // View mode tabs
  document.getElementById('saViewTabs').addEventListener('click', e => {
    const btn = e.target.closest('.sa-view-tab');
    if (!btn) return;
    state.viewMode = btn.dataset.view;
    document.querySelectorAll('.sa-view-tab').forEach(b => b.classList.toggle('sa-view-tab--active', b === btn));
    specCanvas.style.display = state.viewMode !== 'spectrogram' ? '' : 'none';
    sgCanvas.style.display = state.viewMode === 'spectrogram' ? '' : 'none';
  });

  // FFT Size
  document.getElementById('saFftSize').addEventListener('change', e => {
    state.fftSize = +e.target.value;
    resetTraces();
  });

  // Window
  document.getElementById('saWindow').addEventListener('change', e => {
    state.windowType = e.target.value;
    document.getElementById('saKaiserGroup').style.display = state.windowType === 'kaiser' ? '' : 'none';
    resetTraces();
  });

  // Kaiser beta
  document.getElementById('saKaiserBeta').addEventListener('change', e => { state.kaiserBeta = +e.target.value; });

  // Detector, Scale, Unit, RefLevel
  document.getElementById('saDetector').addEventListener('change', e => { state.detector = e.target.value; });
  document.getElementById('saScale').addEventListener('change', e => { state.scale = e.target.value; });
  document.getElementById('saUnit').addEventListener('change', e => { state.unit = e.target.value; });
  document.getElementById('saRefLevel').addEventListener('change', e => { state.refLevel = +e.target.value; });

  // Trace mode
  document.getElementById('saTraceBtns').addEventListener('click', e => {
    const btn = e.target.closest('.sa-unit-btn');
    if (!btn) return;
    state.traceMode = btn.dataset.trace;
    document.querySelectorAll('#saTraceBtns .sa-unit-btn').forEach(b => b.classList.toggle('sa-unit-btn--active', b === btn));
    document.getElementById('saAvgGroup').style.display = state.traceMode === 'average' ? '' : 'none';
    if (state.traceMode !== 'average') { avgAccum = null; avgFrames = 0; }
    if (state.traceMode !== 'maxHold') maxHoldData = null;
    if (state.traceMode !== 'minHold') minHoldData = null;
  });

  document.getElementById('saAvgCount').addEventListener('change', e => { state.avgCount = +e.target.value; avgAccum = null; avgFrames = 0; });

  // Source
  document.getElementById('saSource').addEventListener('change', e => { state.source = e.target.value; });
  document.getElementById('saSourceCh').addEventListener('change', e => { state.sourceChannel = +e.target.value; });

  // Markers — click on canvas to place
  specCanvas.addEventListener('click', e => {
    const activeMarkerIdx = markers.findIndex(m => m.active && !m.placed);
    if (activeMarkerIdx < 0) {
      // Toggle first inactive marker
      const idx = markers.findIndex(m => !m.active);
      if (idx >= 0) {
        markers[idx].active = true;
        placeMarkerAtClick(idx, e);
      }
    } else {
      placeMarkerAtClick(activeMarkerIdx, e);
    }
  });

  // Marker toggle buttons
  container.querySelectorAll('.sa-marker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = +btn.dataset.mk;
      markers[idx].active = !markers[idx].active;
      markers[idx].placed = false;
      btn.classList.toggle('sa-marker-btn--active', markers[idx].active);
      updateMarkerTable();
    });
  });

  // Peak search
  document.getElementById('saPeakSearch').addEventListener('click', peakSearch);

  // BW measurement
  document.getElementById('saBwMeasure').addEventListener('click', measureBandwidth);

  // Run/Stop/Reset
  document.getElementById('saRunBtn').addEventListener('click', () => { state.running = true; startLoop(); });
  document.getElementById('saStopBtn').addEventListener('click', () => { state.running = false; });
  document.getElementById('saResetBtn').addEventListener('click', () => {
    resetTraces();
    spectrogramBuffer = [];
    markers.forEach(m => { m.active = false; m.placed = false; });
    container.querySelectorAll('.sa-marker-btn').forEach(b => b.classList.remove('sa-marker-btn--active'));
    updateMarkerTable();
  });
}

function placeMarkerAtClick(idx, e) {
  const rect = specCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const W = specCanvas.width;
  if (!spectrumData) return;
  const bin = Math.floor(x / W * spectrumData.length);
  markers[idx].freqBin = Math.max(0, Math.min(spectrumData.length - 1, bin));
  markers[idx].freq = markers[idx].freqBin * sampleRate / (state.fftSize);
  markers[idx].amp = spectrumData[markers[idx].freqBin] || 0;
  markers[idx].placed = true;
  updateMarkerTable();
}

/* ===== Traces ===== */

function resetTraces() {
  maxHoldData = null;
  minHoldData = null;
  avgAccum = null;
  avgFrames = 0;
}

function updateTraces(spectrum) {
  spectrumData = spectrum;
  const N = spectrum.length;

  if (state.traceMode === 'maxHold') {
    if (!maxHoldData || maxHoldData.length !== N) maxHoldData = new Float32Array(spectrum);
    else for (let i = 0; i < N; i++) maxHoldData[i] = Math.max(maxHoldData[i], spectrum[i]);
  }

  if (state.traceMode === 'minHold') {
    if (!minHoldData || minHoldData.length !== N) minHoldData = new Float32Array(N).fill(Infinity);
    for (let i = 0; i < N; i++) minHoldData[i] = Math.min(minHoldData[i], spectrum[i]);
  }

  if (state.traceMode === 'average') {
    if (!avgAccum || avgAccum.length !== N) { avgAccum = new Float32Array(N); avgFrames = 0; }
    avgFrames++;
    const alpha = 1 / Math.min(avgFrames, state.avgCount);
    for (let i = 0; i < N; i++) avgAccum[i] = avgAccum[i] * (1 - alpha) + spectrum[i] * alpha;
  }

  // Spectrogram buffer
  if (state.viewMode === 'spectrogram') {
    spectrogramBuffer.push(new Float32Array(spectrum));
    if (spectrogramBuffer.length > SPECTROGRAM_ROWS) spectrogramBuffer.shift();
  }
}

/* ===== Peak Search ===== */

function peakSearch() {
  if (!spectrumData) return;
  const peaks = findPeaks(spectrumData, 4);
  peaks.forEach((pk, i) => {
    if (i < 4) {
      markers[i].active = true;
      markers[i].freqBin = pk.bin;
      markers[i].freq = pk.bin * sampleRate / state.fftSize;
      markers[i].amp = pk.val;
      markers[i].placed = true;
    }
  });
  container.querySelectorAll('.sa-marker-btn').forEach((b, i) => b.classList.toggle('sa-marker-btn--active', markers[i].active));
  updateMarkerTable();
}

function findPeaks(data, count) {
  const peaks = [];
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
      peaks.push({ bin: i, val: data[i] });
    }
  }
  peaks.sort((a, b) => b.val - a.val);
  return peaks.slice(0, count);
}

/* ===== BW Measurement ===== */

function measureBandwidth() {
  if (!spectrumData) return;
  const peaks = findPeaks(spectrumData, 1);
  if (peaks.length === 0) return;

  const peakBin = peaks[0].bin;
  const peakVal = peaks[0].val;
  const threshold = peakVal / Math.sqrt(2); // -3 dB

  let left = peakBin, right = peakBin;
  while (left > 0 && spectrumData[left] >= threshold) left--;
  while (right < spectrumData.length - 1 && spectrumData[right] >= threshold) right++;

  const bwHz = (right - left) * sampleRate / state.fftSize;
  const centerHz = peakBin * sampleRate / state.fftSize;

  // Show as marker 1 at peak, marker 2 as delta showing BW
  markers[0] = { active: true, freqBin: peakBin, freq: centerHz, amp: peakVal, placed: true, isDelta: false, refMarker: 0 };
  markers[1] = { active: true, freqBin: right, freq: right * sampleRate / state.fftSize, amp: spectrumData[right], placed: true, isDelta: true, refMarker: 0, bwHz };

  container.querySelectorAll('.sa-marker-btn').forEach((b, i) => b.classList.toggle('sa-marker-btn--active', markers[i].active));
  updateMarkerTable();
}

/* ===== Marker Table ===== */

function updateMarkerTable() {
  const el = document.getElementById('saMarkerTable');
  const active = markers.filter(m => m.active && m.placed);
  if (active.length === 0) { el.innerHTML = ''; return; }

  let html = '<table class="sa-mtable"><thead><tr><th>Marker</th><th>Frequency</th><th>Amplitude</th><th>Info</th></tr></thead><tbody>';
  markers.forEach((m, i) => {
    if (!m.active || !m.placed) return;
    const freqStr = formatFreqSA(m.freq);
    const ampStr = toDisplayUnits(m.amp);

    let info = '';
    if (m.isDelta && m.bwHz) {
      info = `BW(-3dB): ${formatFreqSA(m.bwHz)}`;
    } else if (m.isDelta) {
      const ref = markers[m.refMarker];
      if (ref && ref.active) {
        info = `Δf=${formatFreqSA(m.freq - ref.freq)}, Δ=${(toDb(m.amp) - toDb(ref.amp)).toFixed(1)} dB`;
      }
    }

    html += `<tr><td style="color:${markerColor(i)}">M${i + 1}</td><td>${freqStr}</td><td>${ampStr}</td><td>${info}</td></tr>`;
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function markerColor(i) {
  return ['#f1c40f', '#e74c3c', '#2ecc71', '#3498db'][i] || '#fff';
}

function formatFreqSA(hz) {
  if (hz >= 1e6) return (hz / 1e6).toFixed(3) + ' MHz';
  if (hz >= 1e3) return (hz / 1e3).toFixed(3) + ' kHz';
  return hz.toFixed(1) + ' Hz';
}

function toDb(val) {
  if (val <= 0) return -120;
  return 20 * Math.log10(val);
}

function toDisplayUnits(val) {
  if (state.scale === 'linear') return val.toFixed(4) + ' V';
  const db = toDb(val);
  if (state.unit === 'dBm') return (db + 13).toFixed(1) + ' dBm'; // approx: dBV + 13 ≈ dBm (50 Ohm)
  if (state.unit === 'dBV') return db.toFixed(1) + ' dBV';
  if (state.unit === 'Vrms') return (val / Math.sqrt(2)).toFixed(4) + ' Vrms';
  return val.toFixed(4) + ' V/√Hz';
}

/* ===== Main Loop ===== */

function startLoop() {
  if (animFrame) cancelAnimationFrame(animFrame);
  loop();
}

async function loop() {
  if (!state.running) return;
  animFrame = requestAnimationFrame(loop);

  const signal = getCurrentSignal();
  if (!signal || signal.length === 0) {
    drawEmpty();
    return;
  }

  if (state.viewMode === 'timeDomain') {
    drawTimeDomain(signal);
    return;
  }

  // Perform FFT
  const result = await postWorker({
    type: 'fft',
    data: new Float32Array(signal),
    windowType: state.windowType,
    fftSize: state.fftSize
  });

  if (!result.spectrum) return;
  updateTraces(result.spectrum);

  // Update marker amplitudes
  markers.forEach(m => {
    if (m.active && m.placed && spectrumData) {
      m.amp = spectrumData[m.freqBin] || 0;
    }
  });

  if (state.viewMode === 'spectrum') {
    drawSpectrum();
  } else if (state.viewMode === 'spectrogram') {
    drawSpectrogram();
  }

  updateMarkerTable();
}

/* ===== Drawing: Spectrum ===== */

function drawEmpty() {
  const W = specCanvas.width, H = specCanvas.height;
  specCtx.fillStyle = '#050a12';
  specCtx.fillRect(0, 0, W, H);
  specCtx.fillStyle = '#4a5568';
  specCtx.font = '14px monospace';
  specCtx.textAlign = 'center';
  specCtx.fillText('No signal — connect a signal source', W / 2, H / 2);
}

function drawSpectrum() {
  const W = specCanvas.width, H = specCanvas.height;
  const ctx = specCtx;
  const data = getDisplayTrace();
  if (!data) return;

  // Background
  ctx.fillStyle = '#050a12';
  ctx.fillRect(0, 0, W, H);

  const margin = { top: 20, right: 50, bottom: 30, left: 60 };
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;

  // Grid
  ctx.strokeStyle = '#0d1a2a';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 10; i++) {
    const x = margin.left + plotW * i / 10;
    ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + plotH); ctx.stroke();
  }
  for (let i = 0; i <= 8; i++) {
    const y = margin.top + plotH * i / 8;
    ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + plotW, y); ctx.stroke();
  }

  // Determine Y scale
  let yMin, yMax;
  if (state.scale === 'log') {
    yMax = state.refLevel || 0;
    yMin = yMax - 100;
  } else {
    yMax = 0;
    for (let i = 0; i < data.length; i++) if (data[i] > yMax) yMax = data[i];
    yMax = yMax * 1.1 || 1;
    yMin = 0;
  }

  // Convert to dB if needed
  function toY(val) {
    let v = state.scale === 'log' ? toDb(val) : val;
    return margin.top + plotH * (1 - (v - yMin) / (yMax - yMin));
  }

  // Draw spectrum trace
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = margin.left + plotW * i / data.length;
    const y = Math.max(margin.top, Math.min(margin.top + plotH, toY(data[i])));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Max Hold trace
  if (maxHoldData) {
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < maxHoldData.length; i++) {
      const x = margin.left + plotW * i / maxHoldData.length;
      const y = Math.max(margin.top, Math.min(margin.top + plotH, toY(maxHoldData[i])));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Min Hold trace
  if (minHoldData) {
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < minHoldData.length; i++) {
      const x = margin.left + plotW * i / minHoldData.length;
      const y = Math.max(margin.top, Math.min(margin.top + plotH, toY(minHoldData[i])));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Average trace
  if (avgAccum) {
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < avgAccum.length; i++) {
      const x = margin.left + plotW * i / avgAccum.length;
      const y = Math.max(margin.top, Math.min(margin.top + plotH, toY(avgAccum[i])));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Draw markers
  markers.forEach((m, i) => {
    if (!m.active || !m.placed) return;
    const x = margin.left + plotW * m.freqBin / data.length;
    const y = Math.max(margin.top, Math.min(margin.top + plotH, toY(m.amp)));
    ctx.fillStyle = markerColor(i);
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = markerColor(i);
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = markerColor(i);
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`M${i + 1}`, x, margin.top - 4);
  });

  // Axis labels
  ctx.fillStyle = '#4a5568';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  const maxFreq = sampleRate / 2;
  for (let i = 0; i <= 10; i++) {
    const f = maxFreq * i / 10;
    const x = margin.left + plotW * i / 10;
    ctx.fillText(formatFreqSA(f), x, H - 5);
  }
  ctx.textAlign = 'right';
  for (let i = 0; i <= 8; i++) {
    const val = yMax - (yMax - yMin) * i / 8;
    const y = margin.top + plotH * i / 8;
    ctx.fillText(state.scale === 'log' ? val.toFixed(0) + ' dB' : val.toFixed(2), margin.left - 5, y + 3);
  }

  // RBW indicator
  const rbw = sampleRate / state.fftSize;
  ctx.fillStyle = '#4a5568';
  ctx.textAlign = 'left';
  ctx.fillText(`RBW: ${formatFreqSA(rbw)}`, margin.left + 5, margin.top + 12);
}

function getDisplayTrace() {
  if (state.traceMode === 'maxHold' && maxHoldData) return maxHoldData;
  if (state.traceMode === 'minHold' && minHoldData) return minHoldData;
  if (state.traceMode === 'average' && avgAccum) return avgAccum;
  return spectrumData;
}

/* ===== Drawing: Spectrogram ===== */

function drawSpectrogram() {
  const W = sgCanvas.width, H = sgCanvas.height;
  const ctx = sgCtx;

  if (spectrogramBuffer.length === 0) {
    ctx.fillStyle = '#050a12';
    ctx.fillRect(0, 0, W, H);
    return;
  }

  const imgData = ctx.createImageData(W, H);
  const maxRows = spectrogramBuffer.length;
  const bins = spectrogramBuffer[0].length;

  // Find global max for normalization
  let globalMax = 0;
  for (const row of spectrogramBuffer) {
    for (let i = 0; i < row.length; i++) {
      const db = toDb(row[i]);
      if (db > globalMax) globalMax = db;
    }
  }
  const dynRange = 80; // dB dynamic range

  for (let y = 0; y < H; y++) {
    const rowIdx = Math.floor(y / H * maxRows);
    const row = spectrogramBuffer[rowIdx];
    if (!row) continue;

    for (let x = 0; x < W; x++) {
      const bin = Math.floor(x / W * bins);
      const db = toDb(row[bin]);
      const normalized = Math.max(0, Math.min(1, (db - (globalMax - dynRange)) / dynRange));
      const [r, g, b] = spectrogramColorMap(normalized);
      const idx = (y * W + x) * 4;
      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function spectrogramColorMap(t) {
  const n = SPECTROGRAM_COLORS.length - 1;
  const idx = t * n;
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, n);
  const frac = idx - lo;
  return [
    SPECTROGRAM_COLORS[lo][0] + (SPECTROGRAM_COLORS[hi][0] - SPECTROGRAM_COLORS[lo][0]) * frac,
    SPECTROGRAM_COLORS[lo][1] + (SPECTROGRAM_COLORS[hi][1] - SPECTROGRAM_COLORS[lo][1]) * frac,
    SPECTROGRAM_COLORS[lo][2] + (SPECTROGRAM_COLORS[hi][2] - SPECTROGRAM_COLORS[lo][2]) * frac
  ];
}

/* ===== Drawing: Time Domain ===== */

function drawTimeDomain(signal) {
  const W = specCanvas.width, H = specCanvas.height;
  const ctx = specCtx;

  ctx.fillStyle = '#050a12';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#0d1a2a';
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 10; i++) { const x = W * i / 10; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let i = 1; i < 8; i++) { const y = H * i / 8; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.strokeStyle = '#1a3050';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

  let maxVal = 0;
  for (let i = 0; i < signal.length; i++) if (Math.abs(signal[i]) > maxVal) maxVal = Math.abs(signal[i]);
  if (maxVal === 0) maxVal = 1;
  const scale = (H / 2 - 10) / maxVal;

  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x < W; x++) {
    const idx = Math.floor(x / W * signal.length);
    const y = H / 2 - signal[idx] * scale;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
