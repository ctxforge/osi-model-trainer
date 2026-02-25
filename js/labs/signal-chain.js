/**
 * signal-chain.js — Signal Chain Visualizer
 *
 * Shows the complete transmission chain step-by-step:
 * [Data] → [Line Coding] → [Modulation] → [Channel] → [Demodulation] → [Decoding] → [Data]
 *
 * Each stage is clickable with before/after graphs, formulas, and plain-language explanations.
 * Diagnostic panel explains WHY transmission failed and WHAT to do.
 * All parameters have tooltips.
 */

import { addXP } from '../core/gamification.js';

/* ===== Constants ===== */

const LINE_CODES = [
  { id: 'nrz', name: 'NRZ-L', tip: 'Non-Return-to-Zero Level: 1=+V, 0=-V. Simple but no self-clocking. Long runs of same bit cause DC wander and sync loss.' },
  { id: 'nrzi', name: 'NRZ-I', tip: 'NRZ Inverted: transition on 1, no change on 0. Solves 1-run problem but 0-runs still problematic.' },
  { id: 'manchester', name: 'Manchester', tip: 'Transition in MIDDLE of each bit (1=high→low, 0=low→high). Self-clocking but doubles bandwidth. Used in 10BASE-T Ethernet.' },
  { id: 'diffManchester', name: 'Diff. Manchester', tip: 'Transition at middle always. Start of bit: transition=0, no transition=1. Used in Token Ring.' },
  { id: 'ami', name: 'AMI', tip: 'Alternate Mark Inversion: 0=0V, 1=alternating +V/-V. No DC component. Used in T1/E1 lines.' },
  { id: 'b8zs', name: 'B8ZS', tip: 'Bipolar with 8-Zero Substitution: like AMI but replaces 8 consecutive zeros with a pattern containing violations. Used in T1.' },
  { id: 'hdb3', name: 'HDB3', tip: 'High Density Bipolar 3: like AMI but replaces 4 zeros with violation pattern. Used in E1.' },
  { id: '4b5b', name: '4B/5B', tip: '4-bit data → 5-bit code. Guarantees transitions for clock recovery. Used in 100BASE-TX. 25% overhead.' },
  { id: 'mlt3', name: 'MLT-3', tip: 'Multi-Level Transmit 3: cycles through -1, 0, +1, 0. Used with 4B/5B in 100BASE-TX. Reduces bandwidth.' }
];

const MODULATIONS = [
  { id: 'ask', name: 'ASK', tip: 'Amplitude Shift Keying: amplitude changes between levels. Simple, but vulnerable to noise on amplitude.' },
  { id: 'fsk', name: 'FSK', tip: 'Frequency Shift Keying: frequency changes per bit. More robust than ASK. Used in modems, Bluetooth.' },
  { id: 'psk', name: 'BPSK', tip: 'Binary Phase Shift Keying: phase shifts 180° per bit. 1 bit/symbol. Very robust, used in deep-space comm.' },
  { id: 'qpsk', name: 'QPSK', tip: 'Quadrature PSK: 4 phase states (45°, 135°, 225°, 315°). 2 bits/symbol. Used in DVB-S, CDMA.' },
  { id: 'qam16', name: 'QAM-16', tip: '16-QAM: 4 bits/symbol using 16 amplitude+phase combinations. Needs SNR > 17 dB. Used in Wi-Fi, LTE.' },
  { id: 'qam64', name: 'QAM-64', tip: '64-QAM: 6 bits/symbol. Needs SNR > 23 dB. Higher throughput but less robust. Used in Wi-Fi 802.11n/ac.' },
  { id: 'ofdm', name: 'OFDM', tip: 'Orthogonal FDM: many narrowband subcarriers. Resists multipath fading. Used in Wi-Fi, LTE, 5G, DVB-T.' }
];

const CHANNEL_TYPES = [
  { id: 'ideal', name: 'Ideal (no noise)', attenuation: 0, snr: 100, bw: Infinity, tip: 'Perfect channel — no attenuation, no noise, infinite bandwidth. Theoretical reference.' },
  { id: 'cat5e', name: 'Cat5e 100m', attenuation: 22, snr: 35, bw: 100e6, tip: 'Standard Ethernet cable. 22 dB attenuation at 100MHz over 100m. Good for 1Gbps up to 100m.' },
  { id: 'cat6a', name: 'Cat6a 100m', attenuation: 18, snr: 40, bw: 500e6, tip: 'Enhanced Ethernet cable. Less attenuation, 10Gbps capable. Better shielding.' },
  { id: 'fiber_sm', name: 'Fiber SM 10km', attenuation: 3, snr: 50, bw: 10e9, tip: 'Single-mode fiber. Very low loss (0.3 dB/km). Used for long-distance backbone.' },
  { id: 'wifi_good', name: 'Wi-Fi (good)', attenuation: 60, snr: 30, bw: 40e6, tip: 'Wi-Fi at ~10m. Decent signal, some multipath. Typical home environment.' },
  { id: 'wifi_bad', name: 'Wi-Fi (weak)', attenuation: 80, snr: 12, bw: 20e6, tip: 'Wi-Fi at ~30m through walls. Weak signal, high noise floor. Frequent errors expected.' },
  { id: 'satellite', name: 'Satellite GEO', attenuation: 200, snr: 8, bw: 36e6, tip: 'Geostationary satellite. Extreme path loss, 600ms RTT. Needs strong FEC.' }
];

/* ===== State ===== */
let container = null;
let chainState = {
  inputText: 'Hello',
  lineCode: 'nrz',
  modulation: 'ask',
  channel: 'cat5e',
  carrierFreq: 10000,
  symbolRate: 1000,
  activeStage: -1 // -1 = overview, 0-6 = individual stage
};

let simulationResult = null;

/* ===== Public API ===== */

export function initSignalChain() {
  container = document.getElementById('signalChainUI');
  if (!container) return;
  buildUI();
}

/* ===== UI Builder ===== */

function buildUI() {
  container.innerHTML = `
    <div class="sc-instrument">
      <div class="sc-instrument__header">
        <span class="sc-instrument__brand">Signal Chain Visualizer</span>
        <span class="sc-instrument__subtitle">Transparent Transmission Pipeline</span>
      </div>

      <!-- Input controls -->
      <div class="sc-config">
        <div class="sc-config-row">
          <div class="sc-config-field">
            <label data-tip="Enter text to transmit. Each character becomes 8 bits (ASCII). You'll see the exact bytes and bits.">Message</label>
            <input type="text" class="sg-num-input sg-num-input--wide" id="scInputText" value="${chainState.inputText}" placeholder="Enter text...">
          </div>
        </div>
        <div class="sc-config-row">
          <div class="sc-config-field">
            <label data-tip="How bits are converted to voltage levels on the wire. Different codes have different properties for clocking, DC balance, and bandwidth.">Line Code</label>
            <select class="sa-select" id="scLineCode">
              ${LINE_CODES.map(lc => `<option value="${lc.id}" data-tip="${lc.tip}"${lc.id === chainState.lineCode ? ' selected' : ''}>${lc.name}</option>`).join('')}
            </select>
          </div>
          <div class="sc-config-field">
            <label data-tip="How the baseband signal is mapped onto a carrier frequency for transmission. Higher-order modulations carry more bits but need better SNR.">Modulation</label>
            <select class="sa-select" id="scModulation">
              ${MODULATIONS.map(m => `<option value="${m.id}" data-tip="${m.tip}"${m.id === chainState.modulation ? ' selected' : ''}>${m.name}</option>`).join('')}
            </select>
          </div>
          <div class="sc-config-field">
            <label data-tip="The physical medium the signal travels through. Each channel adds attenuation (signal loss), noise, and bandwidth limitations.">Channel</label>
            <select class="sa-select" id="scChannel">
              ${CHANNEL_TYPES.map(ch => `<option value="${ch.id}" data-tip="${ch.tip}"${ch.id === chainState.channel ? ' selected' : ''}>${ch.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="sc-config-row">
          <div class="sc-config-field">
            <label data-tip="Frequency of the carrier wave in Hz. The carrier 'transports' your data through the medium. Higher frequencies can carry more data but attenuate faster.">Carrier Freq (Hz)</label>
            <input type="number" class="sg-num-input" id="scCarrierFreq" value="${chainState.carrierFreq}" min="100" step="100">
          </div>
          <div class="sc-config-field">
            <label data-tip="How many symbols per second. Each symbol can carry 1 or more bits depending on modulation. Higher rate = more data but needs wider bandwidth.">Symbol Rate (baud)</label>
            <input type="number" class="sg-num-input" id="scSymbolRate" value="${chainState.symbolRate}" min="10" step="10">
          </div>
        </div>
        <button class="sg-btn sg-btn--run" id="scRunBtn" style="margin-top:8px">▶ Simulate Transmission</button>
      </div>

      <!-- Chain diagram -->
      <div class="sc-chain" id="scChain"></div>

      <!-- Stage detail -->
      <div class="sc-detail" id="scDetail"></div>

      <!-- Diagnostic panel -->
      <div class="sc-diagnostic" id="scDiagnostic" style="display:none"></div>
    </div>
  `;

  attachChainEvents();
}

function attachChainEvents() {
  document.getElementById('scInputText').addEventListener('input', e => { chainState.inputText = e.target.value; });
  document.getElementById('scLineCode').addEventListener('change', e => { chainState.lineCode = e.target.value; });
  document.getElementById('scModulation').addEventListener('change', e => { chainState.modulation = e.target.value; });
  document.getElementById('scChannel').addEventListener('change', e => { chainState.channel = e.target.value; });
  document.getElementById('scCarrierFreq').addEventListener('change', e => { chainState.carrierFreq = +e.target.value; });
  document.getElementById('scSymbolRate').addEventListener('change', e => { chainState.symbolRate = +e.target.value; });
  document.getElementById('scRunBtn').addEventListener('click', runSimulation);
}

/* ===== Simulation ===== */

function runSimulation() {
  const text = chainState.inputText || 'Hi';
  const bytes = Array.from(text).map(c => c.charCodeAt(0));
  const bits = bytes.flatMap(b => Array.from({ length: 8 }, (_, i) => (b >> (7 - i)) & 1));

  // Stage 1: Line coding
  const lineSignal = applyLineCode(bits, chainState.lineCode);

  // Stage 2: Modulation
  const modSignal = applyModulationChain(bits, chainState.modulation, chainState.carrierFreq, chainState.symbolRate);

  // Stage 3: Channel effects
  const ch = CHANNEL_TYPES.find(c => c.id === chainState.channel);
  const rxSignal = applyChannelEffects(modSignal, ch);

  // Stage 4: Demodulation
  const demodBits = demodulate(rxSignal, modSignal.length, bits.length, chainState.modulation, chainState.carrierFreq, chainState.symbolRate);

  // Stage 5: Decoding
  const decodedBits = decodeLineBits(demodBits, chainState.lineCode);

  // Stage 6: Reconstruct
  const rxBytes = [];
  for (let i = 0; i < decodedBits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < decodedBits.length; j++) {
      byte = (byte << 1) | decodedBits[i + j];
    }
    rxBytes.push(byte);
  }
  const rxText = rxBytes.map(b => {
    if (b >= 32 && b < 127) return String.fromCharCode(b);
    return '?';
  }).join('');

  // Count errors
  let errorBits = 0;
  for (let i = 0; i < bits.length && i < decodedBits.length; i++) {
    if (bits[i] !== decodedBits[i]) errorBits++;
  }
  const ber = errorBits / bits.length;

  simulationResult = {
    text, bytes, bits,
    lineSignal, modSignal, rxSignal,
    demodBits, decodedBits, rxBytes, rxText,
    errorBits, ber,
    channel: ch
  };

  renderChain();
  if (ber > 0) {
    renderDiagnostic();
  } else {
    document.getElementById('scDiagnostic').style.display = 'none';
  }
  chainState.activeStage = -1;
  addXP(10);
}

/* ===== Signal Processing Functions ===== */

function applyLineCode(bits, codeId) {
  const N = bits.length;
  const samplesPerBit = 10;
  const signal = new Float32Array(N * samplesPerBit);
  let lastLevel = -1;
  let polarity = 1;

  for (let i = 0; i < N; i++) {
    const b = bits[i];
    let level = 0;

    switch (codeId) {
      case 'nrz': level = b ? 1 : -1; break;
      case 'nrzi': { if (b) lastLevel *= -1; level = lastLevel; break; }
      case 'manchester': {
        for (let s = 0; s < samplesPerBit; s++) {
          const first = s < samplesPerBit / 2;
          signal[i * samplesPerBit + s] = b ? (first ? 1 : -1) : (first ? -1 : 1);
        }
        continue;
      }
      case 'diffManchester': {
        if (b === 0) lastLevel *= -1;
        for (let s = 0; s < samplesPerBit; s++) {
          signal[i * samplesPerBit + s] = s < samplesPerBit / 2 ? lastLevel : -lastLevel;
        }
        lastLevel = -lastLevel;
        continue;
      }
      case 'ami': {
        if (b) { level = polarity; polarity *= -1; } else level = 0;
        break;
      }
      case 'b8zs': case 'hdb3': {
        if (b) { level = polarity; polarity *= -1; } else level = 0;
        break;
      }
      case '4b5b': level = b ? 1 : -1; break;
      case 'mlt3': {
        if (b) { lastLevel = lastLevel === 0 ? polarity : (lastLevel === polarity ? 0 : -polarity); if (lastLevel === 0) polarity *= -1; }
        level = lastLevel;
        break;
      }
      default: level = b ? 1 : -1;
    }

    for (let s = 0; s < samplesPerBit; s++) {
      signal[i * samplesPerBit + s] = level;
    }
  }
  return signal;
}

function applyModulationChain(bits, modId, carrierFreq, symbolRate) {
  const bitsPerSymbol = modId === 'qpsk' ? 2 : modId === 'qam16' ? 4 : modId === 'qam64' ? 6 : 1;
  const numSymbols = Math.ceil(bits.length / bitsPerSymbol);
  const samplesPerSymbol = 40;
  const N = numSymbols * samplesPerSymbol;
  const signal = new Float32Array(N);
  const sr = symbolRate * samplesPerSymbol;

  for (let sym = 0; sym < numSymbols; sym++) {
    const bitSlice = [];
    for (let j = 0; j < bitsPerSymbol; j++) {
      const idx = sym * bitsPerSymbol + j;
      bitSlice.push(idx < bits.length ? bits[idx] : 0);
    }

    for (let s = 0; s < samplesPerSymbol; s++) {
      const n = sym * samplesPerSymbol + s;
      const t = n / sr;
      const carrier = 2 * Math.PI * carrierFreq * t;

      switch (modId) {
        case 'ask':
          signal[n] = (bitSlice[0] ? 1 : 0.2) * Math.sin(carrier);
          break;
        case 'fsk':
          signal[n] = Math.sin(2 * Math.PI * (bitSlice[0] ? carrierFreq * 1.5 : carrierFreq * 0.75) * t);
          break;
        case 'psk':
          signal[n] = Math.sin(carrier + (bitSlice[0] ? Math.PI : 0));
          break;
        case 'qpsk': {
          const phase = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
          const idx = bitSlice[0] * 2 + bitSlice[1];
          signal[n] = Math.sin(carrier + phase[idx]);
          break;
        }
        case 'qam16': {
          const val = bitSlice.reduce((a, b, i) => a + (b << (3 - i)), 0);
          const I = ((val >> 2) - 1.5) / 1.5;
          const Q = ((val & 3) - 1.5) / 1.5;
          signal[n] = I * Math.cos(carrier) + Q * Math.sin(carrier);
          break;
        }
        case 'qam64': {
          const val = bitSlice.reduce((a, b, i) => a + (b << (5 - i)), 0);
          const I = ((val >> 3) - 3.5) / 3.5;
          const Q = ((val & 7) - 3.5) / 3.5;
          signal[n] = I * Math.cos(carrier) + Q * Math.sin(carrier);
          break;
        }
        case 'ofdm': {
          signal[n] = Math.sin(carrier) * (bitSlice[0] ? 1 : -1) * 0.7 + Math.sin(carrier * 2) * (bitSlice[0] ? 0.5 : -0.5) * 0.3;
          break;
        }
        default:
          signal[n] = Math.sin(carrier) * (bitSlice[0] ? 1 : 0);
      }
    }
  }
  return signal;
}

function applyChannelEffects(signal, ch) {
  const N = signal.length;
  const out = new Float32Array(N);
  const gain = Math.pow(10, -ch.attenuation / 20);

  let sigPower = 0;
  for (let i = 0; i < N; i++) sigPower += signal[i] * signal[i];
  sigPower /= N;
  if (sigPower === 0) sigPower = 1e-10;

  const noiseStd = Math.sqrt((sigPower * gain * gain) / Math.pow(10, ch.snr / 10));

  for (let i = 0; i < N; i++) {
    const u1 = Math.random() || 0.0001;
    const u2 = Math.random() || 0.0001;
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * noiseStd;
    out[i] = signal[i] * gain + noise;
  }
  return out;
}

function demodulate(rxSignal, originalLen, numBits, modId, carrierFreq, symbolRate) {
  const bitsPerSymbol = modId === 'qpsk' ? 2 : modId === 'qam16' ? 4 : modId === 'qam64' ? 6 : 1;
  const numSymbols = Math.ceil(numBits / bitsPerSymbol);
  const samplesPerSymbol = 40;
  const sr = symbolRate * samplesPerSymbol;
  const decoded = [];

  for (let sym = 0; sym < numSymbols && decoded.length < numBits; sym++) {
    let sumI = 0, sumQ = 0;
    for (let s = 0; s < samplesPerSymbol; s++) {
      const n = sym * samplesPerSymbol + s;
      if (n >= rxSignal.length) break;
      const t = n / sr;
      const carrier = 2 * Math.PI * carrierFreq * t;
      sumI += rxSignal[n] * Math.cos(carrier);
      sumQ += rxSignal[n] * Math.sin(carrier);
    }
    sumI /= samplesPerSymbol;
    sumQ /= samplesPerSymbol;

    switch (modId) {
      case 'ask':
        decoded.push(Math.abs(sumI) + Math.abs(sumQ) > 0.15 ? 1 : 0);
        break;
      case 'fsk':
        decoded.push(sumI > 0 ? 1 : 0);
        break;
      case 'psk':
        decoded.push(sumQ < 0 ? 1 : 0);
        break;
      case 'qpsk': {
        decoded.push(sumI < 0 ? 1 : 0);
        decoded.push(sumQ > 0 ? 1 : 0);
        break;
      }
      case 'qam16': {
        const Iq = Math.round((sumI * 1.5 + 1.5));
        const Qq = Math.round((sumQ * 1.5 + 1.5));
        const val = (Math.max(0, Math.min(3, Iq)) << 2) | Math.max(0, Math.min(3, Qq));
        for (let j = 3; j >= 0; j--) decoded.push((val >> j) & 1);
        break;
      }
      case 'qam64': {
        const Iq = Math.round((sumI * 3.5 + 3.5));
        const Qq = Math.round((sumQ * 3.5 + 3.5));
        const val = (Math.max(0, Math.min(7, Iq)) << 3) | Math.max(0, Math.min(7, Qq));
        for (let j = 5; j >= 0; j--) decoded.push((val >> j) & 1);
        break;
      }
      default:
        decoded.push(sumI > 0 || sumQ > 0 ? 1 : 0);
    }
  }
  return decoded.slice(0, numBits);
}

function decodeLineBits(bits) {
  return bits; // Line decoding is inverse of encoding - simplified for visualization
}

/* ===== Rendering ===== */

function renderChain() {
  const r = simulationResult;
  if (!r) return;

  const stages = [
    { icon: '📝', name: 'Data', desc: 'Source data as bytes/bits', color: '#3498db' },
    { icon: '⚡', name: 'Line Coding', desc: `${chainState.lineCode.toUpperCase()}: bits → voltage levels`, color: '#e67e22' },
    { icon: '📡', name: 'Modulation', desc: `${chainState.modulation.toUpperCase()}: baseband → carrier`, color: '#9b59b6' },
    { icon: '🌊', name: 'Channel', desc: `${r.channel.name}: attenuation + noise`, color: '#2ecc71' },
    { icon: '📡', name: 'Demodulation', desc: 'Carrier → recovered baseband', color: '#e74c3c' },
    { icon: '⚡', name: 'Decoding', desc: 'Voltage levels → bits', color: '#f39c12' },
    { icon: '📝', name: 'Result', desc: `Received data (BER: ${(r.ber * 100).toFixed(1)}%)`, color: r.ber > 0 ? '#e74c3c' : '#2ecc71' }
  ];

  const chainEl = document.getElementById('scChain');
  chainEl.innerHTML = `
    <div class="sc-chain-flow">
      ${stages.map((s, i) => `
        <div class="sc-stage${chainState.activeStage === i ? ' sc-stage--active' : ''}${i === 6 && r.ber > 0 ? ' sc-stage--error' : ''}" data-stage="${i}" style="border-color:${s.color}" data-tip="Click to see details of this stage">
          <div class="sc-stage__icon">${s.icon}</div>
          <div class="sc-stage__name">${s.name}</div>
          <div class="sc-stage__desc">${s.desc}</div>
        </div>
        ${i < 6 ? '<div class="sc-stage-arrow">→</div>' : ''}
      `).join('')}
    </div>
    <div class="sc-chain-summary">
      <span data-tip="TX message — what was sent">${r.text}</span>
      <span>→</span>
      <span class="${r.ber > 0 ? 'sc-error-text' : 'sc-ok-text'}" data-tip="RX message — what was received after transmission">${r.rxText}</span>
      <span class="sc-ber" data-tip="Bit Error Rate — percentage of incorrectly received bits. 0% means perfect transmission.">BER: ${(r.ber * 100).toFixed(2)}% (${r.errorBits}/${r.bits.length} errors)</span>
    </div>
  `;

  // Click handlers for stages
  chainEl.querySelectorAll('.sc-stage').forEach(el => {
    el.addEventListener('click', () => {
      chainState.activeStage = +el.dataset.stage;
      renderChain();
      renderStageDetail(chainState.activeStage);
    });
  });
}

function renderStageDetail(stageIdx) {
  const r = simulationResult;
  const el = document.getElementById('scDetail');
  if (!r) { el.innerHTML = ''; return; }

  const detailRenderers = [
    renderDataStage,
    renderLineCodingStage,
    renderModulationStage,
    renderChannelStage,
    renderDemodStage,
    renderDecodingStage,
    renderResultStage
  ];

  el.innerHTML = `<div class="sc-detail-panel">${detailRenderers[stageIdx](r)}</div>`;

  // Draw canvases after DOM is updated
  requestAnimationFrame(() => drawStageCanvases(stageIdx, r));
}

function renderDataStage(r) {
  const hexDump = r.bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  const bitStr = r.bits.join('');
  return `
    <h3>Stage 1: Source Data</h3>
    <p class="sc-explain" data-tip="Your text is converted to binary using ASCII encoding. Each character = 1 byte = 8 bits.">Your message "<b>${r.text}</b>" converted to binary:</p>
    <div class="sc-data-box">
      <div class="sc-data-label" data-tip="Each byte shown as 2 hexadecimal digits (0-9, A-F). Hex is a compact way to write binary.">Hex bytes:</div>
      <div class="sc-hex">${hexDump}</div>
      <div class="sc-data-label" data-tip="The actual binary data — this is exactly what gets transmitted as voltage levels on the wire.">Binary:</div>
      <div class="sc-bits">${bitStr.match(/.{1,8}/g).map(g => `<span class="sc-byte-group" data-tip="1 byte = 8 bits = 1 ASCII character '${String.fromCharCode(parseInt(g, 2))}'.">${g}</span>`).join(' ')}</div>
      <div class="sc-data-label">Size:</div>
      <div>${r.bytes.length} bytes = ${r.bits.length} bits</div>
    </div>
  `;
}

function renderLineCodingStage(r) {
  const lc = LINE_CODES.find(l => l.id === chainState.lineCode);
  return `
    <h3>Stage 2: Line Coding (${lc.name})</h3>
    <p class="sc-explain" data-tip="${lc.tip}">${lc.tip}</p>
    <div class="sc-graph-pair">
      <div class="sc-graph">
        <div class="sc-graph-label" data-tip="Original binary data: sequence of 0s and 1s">Bits (input)</div>
        <canvas id="scLineBitsCanvas" width="600" height="60"></canvas>
      </div>
      <div class="sc-graph">
        <div class="sc-graph-label" data-tip="Voltage levels on the wire after line coding. The pattern depends on the chosen code.">Voltage (output)</div>
        <canvas id="scLineSignalCanvas" width="600" height="80"></canvas>
      </div>
    </div>
  `;
}

function renderModulationStage(r) {
  const mod = MODULATIONS.find(m => m.id === chainState.modulation);
  return `
    <h3>Stage 3: Modulation (${mod.name})</h3>
    <p class="sc-explain" data-tip="${mod.tip}">${mod.tip}</p>
    <div class="sc-graph-pair">
      <div class="sc-graph">
        <div class="sc-graph-label" data-tip="Pure carrier wave — a sinusoidal signal at the carrier frequency. This is the 'vehicle' for your data.">Carrier (${chainState.carrierFreq} Hz)</div>
        <canvas id="scModCarrierCanvas" width="600" height="60"></canvas>
      </div>
      <div class="sc-graph">
        <div class="sc-graph-label" data-tip="Modulated signal — the carrier modified by your data. The changes in amplitude/frequency/phase encode the information.">Modulated signal (TX)</div>
        <canvas id="scModSignalCanvas" width="600" height="80"></canvas>
      </div>
    </div>
  `;
}

function renderChannelStage(r) {
  const ch = r.channel;
  const snrLinear = Math.pow(10, ch.snr / 10);
  return `
    <h3>Stage 4: Channel (${ch.name})</h3>
    <p class="sc-explain" data-tip="The channel attenuates (weakens) the signal and adds random noise. The ratio of signal power to noise power (SNR) determines how many errors occur.">Signal passes through ${ch.name}: attenuation ${ch.attenuation} dB, SNR ${ch.snr} dB</p>
    <div class="sc-channel-stats">
      <div class="sc-stat" data-tip="Signal strength reduction in decibels. Every 3 dB halves the power. 20 dB = 100x weaker signal.">
        <div class="sc-stat__label">Attenuation</div>
        <div class="sc-stat__value">${ch.attenuation} dB</div>
        <div class="sc-stat__note">Signal amplitude × ${Math.pow(10, -ch.attenuation / 20).toExponential(2)}</div>
      </div>
      <div class="sc-stat" data-tip="Signal-to-Noise Ratio — how many times the signal is stronger than noise. Higher = better. Below ~10 dB most modulations fail.">
        <div class="sc-stat__label">SNR</div>
        <div class="sc-stat__value">${ch.snr} dB</div>
        <div class="sc-stat__note">Signal ${snrLinear.toFixed(0)}× stronger than noise</div>
      </div>
      <div class="sc-stat" data-tip="Maximum frequency the channel can pass. Frequencies above this are filtered out (like a low-pass filter).">
        <div class="sc-stat__label">Bandwidth</div>
        <div class="sc-stat__value">${ch.bw === Infinity ? '∞' : formatBW(ch.bw)}</div>
      </div>
    </div>
    <div class="sc-graph-pair">
      <div class="sc-graph">
        <div class="sc-graph-label" data-tip="Clean transmitted signal (green) overlaid with noisy received signal (red). The difference is caused by channel impairments.">TX (green) vs RX (red)</div>
        <canvas id="scChannelCompareCanvas" width="600" height="120"></canvas>
      </div>
    </div>
  `;
}

function renderDemodStage(r) {
  return `
    <h3>Stage 5: Demodulation</h3>
    <p class="sc-explain" data-tip="The receiver extracts the original bits from the noisy received signal by correlating with the expected carrier frequency and making threshold decisions.">Recovering bits from the noisy received signal using coherent detection</p>
    <div class="sc-graph">
      <div class="sc-graph-label" data-tip="Received signal with decision thresholds. When noise pushes a sample past the threshold, a bit error occurs.">Decision regions</div>
      <canvas id="scDemodCanvas" width="600" height="100"></canvas>
    </div>
    <div class="sc-bit-compare" data-tip="Bit-by-bit comparison: green = correctly received, red = bit error (noise flipped the bit)">
      ${renderBitComparison(r.bits, r.demodBits)}
    </div>
  `;
}

function renderDecodingStage(r) {
  return `
    <h3>Stage 6: Line Decoding</h3>
    <p class="sc-explain" data-tip="Inverse of line coding — converts voltage decisions back to binary bits. Any errors from demodulation propagate through this stage.">Inverse ${chainState.lineCode.toUpperCase()}: voltage decisions → bits</p>
    <div class="sc-bit-compare" data-tip="Final decoded bits compared with original transmitted bits">
      ${renderBitComparison(r.bits, r.decodedBits)}
    </div>
  `;
}

function renderResultStage(r) {
  return `
    <h3>Stage 7: Received Data</h3>
    <div class="sc-result-compare">
      <div class="sc-result-side">
        <div class="sc-result-label" data-tip="Original message before transmission">TX (sent)</div>
        <div class="sc-result-text">${r.text}</div>
        <div class="sc-result-hex">${r.bytes.map(b => b.toString(16).padStart(2, '0')).join(' ')}</div>
      </div>
      <div class="sc-result-arrow">→</div>
      <div class="sc-result-side">
        <div class="sc-result-label" data-tip="Received message after passing through the channel">RX (received)</div>
        <div class="sc-result-text${r.ber > 0 ? ' sc-error-text' : ''}">${r.rxText}</div>
        <div class="sc-result-hex">${r.rxBytes.map((b, i) => `<span class="${b !== r.bytes[i] ? 'sc-hex-err' : ''}" data-tip="${b !== r.bytes[i] ? `Error: expected ${r.bytes[i].toString(16)}, got ${b.toString(16)}` : 'Correct'}">${b.toString(16).padStart(2, '0')}</span>`).join(' ')}</div>
      </div>
    </div>
    <div class="sc-ber-display ${r.ber > 0 ? 'sc-ber-display--error' : 'sc-ber-display--ok'}">
      <span class="sc-ber-label" data-tip="Bit Error Rate — the fraction of bits that were incorrectly received">BER:</span>
      <span class="sc-ber-value">${(r.ber * 100).toFixed(2)}%</span>
      <span class="sc-ber-detail">${r.errorBits} errors out of ${r.bits.length} bits</span>
    </div>
  `;
}

function renderBitComparison(txBits, rxBits) {
  let html = '<div class="sc-bits-grid">';
  for (let i = 0; i < txBits.length; i++) {
    const ok = i < rxBits.length && txBits[i] === rxBits[i];
    html += `<span class="sc-bit ${ok ? 'sc-bit--ok' : 'sc-bit--err'}" data-tip="${ok ? `Bit #${i}: correctly received as ${txBits[i]}` : `Bit #${i}: ERROR — sent ${txBits[i]}, received ${rxBits[i]}. Noise exceeded decision threshold.`}">${rxBits[i] != null ? rxBits[i] : '?'}</span>`;
  }
  html += '</div>';
  return html;
}

/* ===== Stage Canvas Drawing ===== */

function drawStageCanvases(stageIdx, r) {
  if (stageIdx === 1) {
    drawBitsCanvas('scLineBitsCanvas', r.bits.slice(0, 40));
    drawSignalCanvas('scLineSignalCanvas', r.lineSignal, '#e67e22', 400);
  }
  if (stageIdx === 2) {
    drawCarrierCanvas('scModCarrierCanvas', chainState.carrierFreq, 200);
    drawSignalCanvas('scModSignalCanvas', r.modSignal, '#9b59b6', 400);
  }
  if (stageIdx === 3) {
    drawCompareCanvas('scChannelCompareCanvas', r.modSignal, r.rxSignal, 400);
  }
  if (stageIdx === 4) {
    drawSignalCanvas('scDemodCanvas', r.rxSignal, '#e74c3c', 400);
  }
}

function drawBitsCanvas(id, bits) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, W, H);

  const bitW = W / bits.length;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i < bits.length; i++) {
    ctx.fillStyle = bits[i] ? '#2ecc71' : '#3498db';
    ctx.fillRect(i * bitW, bits[i] ? 5 : H / 2, bitW - 1, bits[i] ? H / 2 - 5 : H / 2 - 5);
    ctx.fillStyle = '#aaa';
    ctx.fillText(bits[i], i * bitW + bitW / 2, bits[i] ? H / 2 + 15 : 15);
  }
}

function drawSignalCanvas(id, signal, color, maxSamples) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, W, H);

  const show = Math.min(signal.length, maxSamples);
  let maxV = 0;
  for (let i = 0; i < show; i++) if (Math.abs(signal[i]) > maxV) maxV = Math.abs(signal[i]);
  if (maxV === 0) maxV = 1;
  const scale = (H / 2 - 5) / maxV;

  ctx.strokeStyle = '#1a2a3a';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x < W; x++) {
    const i = Math.floor(x / W * show);
    const y = H / 2 - signal[i] * scale;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawCarrierCanvas(id, freq, maxSamples) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x < W; x++) {
    const t = x / W * (10 / freq);
    const y = H / 2 - Math.sin(2 * Math.PI * freq * t) * (H / 2 - 5);
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawCompareCanvas(id, txSig, rxSig, maxSamples) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, W, H);

  const show = Math.min(txSig.length, rxSig.length, maxSamples);
  let maxV = 0;
  for (let i = 0; i < show; i++) {
    if (Math.abs(txSig[i]) > maxV) maxV = Math.abs(txSig[i]);
    if (Math.abs(rxSig[i]) > maxV) maxV = Math.abs(rxSig[i]);
  }
  if (maxV === 0) maxV = 1;
  const scale = (H / 2 - 5) / maxV;

  // TX (green)
  ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < W; x++) {
    const i = Math.floor(x / W * show);
    const y = H / 2 - txSig[i] * scale;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // RX (red)
  ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x < W; x++) {
    const i = Math.floor(x / W * show);
    const y = H / 2 - rxSig[i] * scale;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/* ===== Diagnostic Panel ===== */

function renderDiagnostic() {
  const r = simulationResult;
  const ch = r.channel;
  const el = document.getElementById('scDiagnostic');
  el.style.display = '';

  const mod = MODULATIONS.find(m => m.id === chainState.modulation);
  const modRequiredSnr = { ask: 12, fsk: 14, psk: 10, qpsk: 13, qam16: 17, qam64: 23, ofdm: 15 };
  const requiredSnr = modRequiredSnr[chainState.modulation] || 15;

  const recommendations = [];

  if (ch.snr < requiredSnr) {
    const betterMods = Object.entries(modRequiredSnr)
      .filter(([id, snr]) => snr <= ch.snr && id !== chainState.modulation)
      .sort((a, b) => b[1] - a[1]);
    if (betterMods.length > 0) {
      const best = betterMods[0];
      const bestMod = MODULATIONS.find(m => m.id === best[0]);
      recommendations.push({
        text: `Switch modulation to ${bestMod.name} (requires ${best[1]} dB, you have ${ch.snr} dB)`,
        action: () => {
          chainState.modulation = best[0];
          document.getElementById('scModulation').value = best[0];
          runSimulation();
        }
      });
    }
  }

  if (ch.attenuation > 30) {
    const betterChannels = CHANNEL_TYPES.filter(c => c.attenuation < ch.attenuation && c.id !== ch.id);
    if (betterChannels.length > 0) {
      const best = betterChannels.sort((a, b) => a.attenuation - b.attenuation)[0];
      recommendations.push({
        text: `Switch to ${best.name} channel (attenuation: ${best.attenuation} dB instead of ${ch.attenuation} dB)`,
        action: () => {
          chainState.channel = best.id;
          document.getElementById('scChannel').value = best.id;
          runSimulation();
        }
      });
    }
  }

  if (chainState.symbolRate > 500) {
    recommendations.push({
      text: `Reduce symbol rate from ${chainState.symbolRate} to ${Math.floor(chainState.symbolRate / 2)} baud (slower but more reliable)`,
      action: () => {
        chainState.symbolRate = Math.floor(chainState.symbolRate / 2);
        document.getElementById('scSymbolRate').value = chainState.symbolRate;
        runSimulation();
      }
    });
  }

  el.innerHTML = `
    <div class="sc-diag-header">
      <span class="sc-diag-icon">⚠️</span>
      <span>Transmission errors detected</span>
    </div>
    <div class="sc-diag-cause" data-tip="The main reason why bit errors occurred">
      <b>Cause:</b> SNR ${ch.snr} dB is ${ch.snr < requiredSnr ? 'too low' : 'marginal'} for ${mod.name} modulation (requires >${requiredSnr} dB)
    </div>
    <div class="sc-diag-recs">
      <div class="sc-diag-recs-title">Recommendations (click to apply):</div>
      ${recommendations.map((rec, i) => `<button class="sc-diag-rec-btn" data-rec="${i}" data-tip="Click to automatically apply this fix and re-simulate">${i + 1}. ${rec.text}</button>`).join('')}
    </div>
    <div class="sc-diag-tip" data-tip="In real networks, this adaptation happens automatically">
      💡 In practice, Wi-Fi automatically lowers modulation when signal is weak (MCS fallback). Try this manually!
    </div>
  `;

  el.querySelectorAll('.sc-diag-rec-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      recommendations[+btn.dataset.rec].action();
    });
  });
}

function formatBW(hz) {
  if (hz >= 1e9) return (hz / 1e9).toFixed(1) + ' GHz';
  if (hz >= 1e6) return (hz / 1e6).toFixed(1) + ' MHz';
  if (hz >= 1e3) return (hz / 1e3).toFixed(1) + ' kHz';
  return hz + ' Hz';
}
