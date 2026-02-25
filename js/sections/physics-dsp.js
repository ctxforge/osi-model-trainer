/* ==================== DSP: Signal Generation, FFT, Drawing ==================== */
import { CHANNEL_TYPES } from '../data/channels.js';

/* =====================================================================
 *  Web Worker для DSP-вычислений (singleton, lazy init)
 * ===================================================================== */

let _dspWorker = null;
let _dspWorkerSupported = null;  // null = ещё не проверяли
let _workerMsgId = 0;
const _workerCallbacks = new Map();

/**
 * Возвращает singleton-экземпляр DSP-воркера.
 * При первом вызове создаёт воркер и настраивает обработчик сообщений.
 * Возвращает null если Worker API недоступен.
 */
function getDSPWorker() {
  // Feature detection: проверяем поддержку Worker
  if (_dspWorkerSupported === null) {
    _dspWorkerSupported = typeof Worker !== 'undefined';
  }
  if (!_dspWorkerSupported) return null;

  if (!_dspWorker) {
    try {
      // Путь относительно index.html — корня проекта
      _dspWorker = new Worker('js/workers/dsp-worker.js');

      _dspWorker.onmessage = function(e) {
        const msg = e.data;
        const cb = _workerCallbacks.get(msg.id);
        if (cb) {
          _workerCallbacks.delete(msg.id);
          if (msg.type === 'error') {
            cb.reject(new Error(msg.error));
          } else {
            cb.resolve(msg);
          }
        }
      };

      _dspWorker.onerror = function(err) {
        console.warn('[DSP Worker] Ошибка воркера, переключаемся на основной поток:', err.message);
        _dspWorkerSupported = false;
        _dspWorker = null;
        // Отклоняем все ожидающие промисы
        for (const [id, cb] of _workerCallbacks) {
          cb.reject(new Error('Worker terminated'));
        }
        _workerCallbacks.clear();
      };
    } catch (e) {
      console.warn('[DSP Worker] Не удалось создать воркер:', e.message);
      _dspWorkerSupported = false;
      return null;
    }
  }
  return _dspWorker;
}

/**
 * Отправляет сообщение воркеру и возвращает Promise с результатом.
 * @param {Object} message — объект сообщения (без id, он добавится автоматически)
 * @param {Transferable[]} [transfers] — массив буферов для zero-copy передачи
 * @returns {Promise<Object>}
 */
function postToWorker(message, transfers) {
  return new Promise((resolve, reject) => {
    const worker = getDSPWorker();
    if (!worker) {
      reject(new Error('Worker недоступен'));
      return;
    }
    const id = ++_workerMsgId;
    message.id = id;
    _workerCallbacks.set(id, { resolve, reject });
    if (transfers) {
      worker.postMessage(message, transfers);
    } else {
      worker.postMessage(message);
    }
  });
}

/**
 * Вычисляет FFT в Web Worker (если доступен), иначе — в основном потоке.
 *
 * @param {Float32Array|Float64Array|number[]} data — time-domain отсчёты
 * @param {string} [windowType='rectangular'] — тип оконной функции:
 *        'rectangular' | 'hanning' | 'hamming' | 'blackman'
 * @param {number} [fftSize] — размер FFT (степень двойки). По умолчанию = data.length
 * @returns {Promise<Float32Array>} — магнитудный спектр (N/2 точек)
 */
export function computeFFTInWorker(data, windowType, fftSize) {
  windowType = windowType || 'rectangular';
  fftSize = fftSize || data.length;

  // Пробуем воркер
  const worker = getDSPWorker();
  if (worker) {
    // Копируем данные в Float32Array для передачи через Transferable
    const f32 = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) f32[i] = data[i];
    const buffer = f32.buffer;

    return postToWorker(
      { type: 'fft', data: f32, windowType: windowType, fftSize: fftSize },
      [buffer]
    ).then(function(msg) {
      return msg.spectrum;
    });
  }

  // Fallback: синхронный FFT в основном потоке
  return Promise.resolve(_fftFallback(data, windowType, fftSize));
}

/**
 * Синхронный fallback FFT (используется когда Worker недоступен).
 * Повторяет логику drawSpectrum, но возвращает спектр как Float32Array.
 */
function _fftFallback(data, windowType, fftSize) {
  const N = fftSize || data.length;
  const re = new Float64Array(N);
  const im = new Float64Array(N);

  for (let i = 0; i < N && i < data.length; i++) {
    let win = 1;
    if (windowType === 'hanning' || windowType === 'hann') {
      win = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
    } else if (windowType === 'hamming') {
      win = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
    } else if (windowType === 'blackman') {
      win = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1))
                  + 0.08 * Math.cos(4 * Math.PI * i / (N - 1));
    }
    re[i] = (data[i] || 0) * win;
  }

  fft(re, im);

  const halfN = N >> 1;
  const spectrum = new Float32Array(halfN);
  for (let i = 0; i < halfN; i++) {
    spectrum[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / N * 2;
  }
  return spectrum;
}

export function fft(re, im) {
  const n = re.length;
  if (n <= 1) return;
  const hre = new Float64Array(n / 2), him = new Float64Array(n / 2);
  const gre = new Float64Array(n / 2), gim = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    hre[i] = re[2 * i]; him[i] = im[2 * i];
    gre[i] = re[2 * i + 1]; gim[i] = im[2 * i + 1];
  }
  fft(hre, him); fft(gre, gim);
  for (let k = 0; k < n / 2; k++) {
    const angle = -2 * Math.PI * k / n;
    const wr = Math.cos(angle), wi = Math.sin(angle);
    const tr = wr * gre[k] - wi * gim[k];
    const ti = wr * gim[k] + wi * gre[k];
    re[k] = hre[k] + tr; im[k] = him[k] + ti;
    re[k + n / 2] = hre[k] - tr; im[k + n / 2] = him[k] - ti;
  }
}

/* ---- Box-Muller transform for Gaussian noise ---- */
function boxMuller() {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/* ---- Pink noise via Voss-McCartney (IIR approximation) ---- */
let pinkState = { b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0 };
function pinkNoiseReset() { pinkState = { b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0 }; }
function pinkNoiseSample() {
  const white = (Math.random() - 0.5) * 2;
  pinkState.b0 = 0.99886 * pinkState.b0 + white * 0.0555179;
  pinkState.b1 = 0.99332 * pinkState.b1 + white * 0.0750759;
  pinkState.b2 = 0.96900 * pinkState.b2 + white * 0.1538520;
  pinkState.b3 = 0.86650 * pinkState.b3 + white * 0.3104856;
  pinkState.b4 = 0.55000 * pinkState.b4 + white * 0.5329522;
  pinkState.b5 = -0.7616 * pinkState.b5 - white * 0.0168980;
  const pink = pinkState.b0 + pinkState.b1 + pinkState.b2 + pinkState.b3 + pinkState.b4 + pinkState.b5 + pinkState.b6 + white * 0.5362;
  pinkState.b6 = white * 0.115926;
  return pink * 0.11; // normalize roughly to [-1, 1]
}

/* ---- Generate pseudo-random bit sequence for digital modulation ---- */
function generateBitSequence(numBits) {
  const bits = new Uint8Array(numBits);
  for (let i = 0; i < numBits; i++) bits[i] = Math.random() < 0.5 ? 0 : 1;
  return bits;
}

export function genSamples(sgComponents, sgImportedSamples, sgFs, sgN) {
  if (sgImportedSamples) return sgImportedSamples;
  const samples = new Float64Array(sgN);
  // Store constellation data for QAM/QPSK display
  let constellationData = null;

  sgComponents.forEach(c => {
    const duty = c.duty != null ? c.duty / 100 : 0.5;

    // Digital modulation types
    if (c.carrier > 0 && ['ask', 'fsk', 'bpsk', 'qpsk', 'qam16'].includes(c.modType)) {
      const result = genDigitalModulation(c, sgFs, sgN, duty);
      for (let n = 0; n < sgN; n++) samples[n] += result.samples[n];
      if (result.constellation) constellationData = result.constellation;
      return;
    }

    // Reset pink noise state per component to keep it deterministic within a render
    if (c.type === 'pink') pinkNoiseReset();

    for (let n = 0; n < sgN; n++) {
      const t = n / sgFs;
      const w = 2 * Math.PI * c.freq;
      let v = 0;
      if (c.type === 'sin') v = Math.sin(w * t + c.phase * Math.PI / 180);
      else if (c.type === 'cos') v = Math.cos(w * t + c.phase * Math.PI / 180);
      else if (c.type === 'square') {
        const phase = ((c.freq * t + c.phase / 360) % 1 + 1) % 1;
        v = phase < duty ? 1 : -1;
      }
      else if (c.type === 'sawtooth') v = 2 * ((c.freq * t + c.phase / 360) % 1) - 1;
      else if (c.type === 'triangle') { const p = (c.freq * t + c.phase / 360) % 1; v = p < 0.5 ? 4 * p - 1 : 3 - 4 * p; }
      else if (c.type === 'noise') v = (Math.random() - 0.5) * 2;
      else if (c.type === 'pink') v = pinkNoiseSample();
      else if (c.type === 'gauss') v = boxMuller() * 0.5; // scale to approx [-1,1] range
      let baseband = v * c.amp + c.dc;

      if (c.carrier > 0 && c.modType !== 'none') {
        const wc = 2 * Math.PI * c.carrier;
        if (c.modType === 'am') {
          samples[n] += (1 + c.modDepth * baseband) * Math.cos(wc * t);
        } else if (c.modType === 'fm') {
          let integral = 0;
          for (let k = 0; k <= n; k++) { const tk = k / sgFs; let vk = 0;
            if (c.type === 'sin') vk = Math.sin(2*Math.PI*c.freq*tk); else vk = baseband;
            integral += vk / sgFs;
          }
          samples[n] += c.amp * Math.cos(wc * t + 2 * Math.PI * c.modDepth * integral);
        } else if (c.modType === 'pm') {
          samples[n] += c.amp * Math.cos(wc * t + c.modDepth * baseband);
        }
      } else if (c.carrier > 0) {
        samples[n] += baseband * Math.cos(2 * Math.PI * c.carrier * t);
      } else {
        samples[n] += baseband;
      }
    }
  });
  // Attach constellation metadata to samples array
  samples._constellation = constellationData;
  return samples;
}

/* ---- Digital modulation generator ---- */
function genDigitalModulation(c, sgFs, sgN, duty) {
  const samples = new Float64Array(sgN);
  const symbolRate = c.freq; // use freq as symbol rate for digital modulations
  const fc = c.carrier;
  const amp = c.amp;
  let constellation = null;

  if (c.modType === 'ask') {
    // ASK (On-Off Keying by default): bit 1 = carrier, bit 0 = off
    const samplesPerSymbol = Math.max(1, Math.round(sgFs / symbolRate));
    const numSymbols = Math.ceil(sgN / samplesPerSymbol);
    const bits = generateBitSequence(numSymbols);
    for (let n = 0; n < sgN; n++) {
      const t = n / sgFs;
      const symbolIdx = Math.floor(n / samplesPerSymbol);
      const bit = bits[symbolIdx % bits.length];
      samples[n] = bit * amp * Math.cos(2 * Math.PI * fc * t);
    }
  } else if (c.modType === 'fsk') {
    // FSK: bit 0 = fc - delta, bit 1 = fc + delta
    const delta = c.modDepth || (symbolRate * 2); // frequency deviation
    const samplesPerSymbol = Math.max(1, Math.round(sgFs / symbolRate));
    const numSymbols = Math.ceil(sgN / samplesPerSymbol);
    const bits = generateBitSequence(numSymbols);
    let phase = 0;
    for (let n = 0; n < sgN; n++) {
      const symbolIdx = Math.floor(n / samplesPerSymbol);
      const bit = bits[symbolIdx % bits.length];
      const freq = bit === 1 ? fc + delta : fc - delta;
      phase += 2 * Math.PI * freq / sgFs;
      samples[n] = amp * Math.cos(phase);
    }
  } else if (c.modType === 'bpsk') {
    // BPSK: bit 0 = phase 0, bit 1 = phase 180
    const samplesPerSymbol = Math.max(1, Math.round(sgFs / symbolRate));
    const numSymbols = Math.ceil(sgN / samplesPerSymbol);
    const bits = generateBitSequence(numSymbols);
    const constPoints = [];
    for (let n = 0; n < sgN; n++) {
      const t = n / sgFs;
      const symbolIdx = Math.floor(n / samplesPerSymbol);
      const bit = bits[symbolIdx % bits.length];
      const phaseShift = bit === 1 ? Math.PI : 0;
      samples[n] = amp * Math.cos(2 * Math.PI * fc * t + phaseShift);
      if (n % samplesPerSymbol === 0) {
        constPoints.push({ i: Math.cos(phaseShift), q: Math.sin(phaseShift) });
      }
    }
    constellation = { points: constPoints, type: 'BPSK' };
  } else if (c.modType === 'qpsk') {
    // QPSK: 2 bits per symbol, 4 phases: 45, 135, 225, 315 degrees
    const samplesPerSymbol = Math.max(1, Math.round(sgFs / symbolRate));
    const bitsPerSymbol = 2;
    const numSymbols = Math.ceil(sgN / samplesPerSymbol);
    const bits = generateBitSequence(numSymbols * bitsPerSymbol);
    const qpskPhases = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]; // 45, 135, 225, 315
    const constPoints = [];
    for (let n = 0; n < sgN; n++) {
      const t = n / sgFs;
      const symbolIdx = Math.floor(n / samplesPerSymbol);
      const b0 = bits[(symbolIdx * 2) % bits.length];
      const b1 = bits[(symbolIdx * 2 + 1) % bits.length];
      const symbolVal = b0 * 2 + b1;
      const phaseShift = qpskPhases[symbolVal];
      samples[n] = amp * Math.cos(2 * Math.PI * fc * t + phaseShift);
      if (n % samplesPerSymbol === 0) {
        constPoints.push({ i: Math.cos(phaseShift), q: Math.sin(phaseShift) });
      }
    }
    constellation = { points: constPoints, type: 'QPSK' };
  } else if (c.modType === 'qam16') {
    // QAM-16: 4 bits per symbol, 16 points in constellation
    const samplesPerSymbol = Math.max(1, Math.round(sgFs / symbolRate));
    const bitsPerSymbol = 4;
    const numSymbols = Math.ceil(sgN / samplesPerSymbol);
    const bits = generateBitSequence(numSymbols * bitsPerSymbol);
    // QAM-16 constellation: 4x4 grid, values -3, -1, +1, +3
    const levels = [-3, -1, 1, 3];
    const constPoints = [];
    for (let n = 0; n < sgN; n++) {
      const t = n / sgFs;
      const symbolIdx = Math.floor(n / samplesPerSymbol);
      const bi = symbolIdx * bitsPerSymbol;
      const b0 = bits[bi % bits.length];
      const b1 = bits[(bi + 1) % bits.length];
      const b2 = bits[(bi + 2) % bits.length];
      const b3 = bits[(bi + 3) % bits.length];
      const iVal = levels[b0 * 2 + b1]; // I component from first 2 bits
      const qVal = levels[b2 * 2 + b3]; // Q component from last 2 bits
      const norm = 1 / Math.sqrt(10); // normalize average power
      samples[n] = amp * norm * (iVal * Math.cos(2 * Math.PI * fc * t) - qVal * Math.sin(2 * Math.PI * fc * t));
      if (n % samplesPerSymbol === 0) {
        constPoints.push({ i: iVal * norm, q: qVal * norm });
      }
    }
    constellation = { points: constPoints, type: 'QAM-16' };
  }

  return { samples, constellation };
}

export function applyChannel(samples, chId, dist, sgFs, sgN) {
  if (chId === 'none') return { rx: samples.slice(), snr: 999, atten: 0, bw: sgFs / 2 };
  const ch = CHANNEL_TYPES.find(c => c.id === chId);
  if (!ch) return { rx: samples.slice(), snr: 999, atten: 0, bw: sgFs / 2 };
  const distUnit = ch.medium === 'fiber' ? dist / 1000 : dist / 100;
  const atten = ch.attenuation * distUnit;
  const snr = Math.max(ch.snrBase - atten, -5);
  const gain = Math.pow(10, -atten / 20);
  const noiseStd = gain / Math.max(Math.pow(10, snr / 20), 0.01);
  const bw = Math.min(ch.bandwidthMHz * 1e6, sgFs / 2);
  const bwNorm = bw / (sgFs / 2);
  const rx = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    rx[i] = samples[i] * gain + (Math.random() - 0.5) * 2 * noiseStd * 0.3;
  }
  if (bwNorm < 1) {
    const cutoff = Math.floor(samples.length * bwNorm / 2);
    const re = new Float64Array(sgN), im = new Float64Array(sgN);
    for (let i = 0; i < sgN; i++) re[i] = rx[i];
    fft(re, im);
    for (let i = cutoff; i < sgN - cutoff; i++) { re[i] = 0; im[i] = 0; }
    const re2 = new Float64Array(sgN), im2 = new Float64Array(sgN);
    for (let i = 0; i < sgN; i++) { re2[i] = re[i]; im2[i] = -im[i]; }
    fft(re2, im2);
    for (let i = 0; i < sgN; i++) rx[i] = re2[i] / sgN;
  }
  return { rx, snr, atten, bw, ch };
}

export function drawTimeDomain(canvas, samples) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 140 * dpr;
  canvas.style.height = '140px';
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const w = rect.width, h = 140, mid = h / 2;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke(); ctx.setLineDash([]);
  for (let v = -1; v <= 1; v += 0.5) { if (v === 0) continue; ctx.strokeStyle = '#1a203040'; ctx.beginPath(); ctx.moveTo(0, mid - v * mid * 0.8); ctx.lineTo(w, mid - v * mid * 0.8); ctx.stroke(); }

  let maxA = 0;
  for (let i = 0; i < samples.length; i++) if (Math.abs(samples[i]) > maxA) maxA = Math.abs(samples[i]);
  if (maxA === 0) maxA = 1;

  ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 1.5; ctx.beginPath();
  const show = Math.min(samples.length, 256);
  for (let i = 0; i < show; i++) {
    const x = (i / show) * w;
    const y = mid - (samples[i] / maxA) * mid * 0.85;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#4a5568'; ctx.font = '9px sans-serif';
  ctx.fillText(`${(maxA).toFixed(2)}`, 2, 12);
  ctx.fillText(`-${(maxA).toFixed(2)}`, 2, h - 4);
}

export function drawSpectrum(canvas, samples, sgFs, sgN, sgSpectrumScale, sgSpectrumWindow) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 160 * dpr;
  canvas.style.height = '160px';
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const w = rect.width, h = 160;
  const scale = sgSpectrumScale;
  ctx.clearRect(0, 0, w, h);

  const re = new Float64Array(sgN);
  const im = new Float64Array(sgN);
  for (let i = 0; i < sgN; i++) {
    let win = 1;
    if (sgSpectrumWindow === 'hann') win = 0.5 * (1 - Math.cos(2 * Math.PI * i / (sgN - 1)));
    else if (sgSpectrumWindow === 'hamming') win = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (sgN - 1));
    re[i] = (samples[i] || 0) * win;
  }
  fft(re, im);

  const mag = new Float64Array(sgN / 2);
  let maxM = 0;
  for (let i = 0; i < sgN / 2; i++) {
    mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / sgN * 2;
    if (mag[i] > maxM) maxM = mag[i];
  }
  if (maxM === 0) maxM = 1;

  // Grid
  ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
  for (let db = 0; db >= -scale; db -= 10) {
    const y = h * 0.04 + (h * 0.88) * (-db / scale);
    ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(w, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#4a5568'; ctx.font = '8px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(db + '', 26, y + 3);
  }
  ctx.textAlign = 'left';

  // Frequency grid
  for (let f = 0; f <= sgFs / 2; f += 500) {
    const x = 28 + (f / (sgFs / 2)) * (w - 32);
    ctx.strokeStyle = '#1a203030'; ctx.beginPath(); ctx.moveTo(x, h * 0.04); ctx.lineTo(x, h * 0.92); ctx.stroke();
  }

  // Spectrum fill + line
  const plotW = w - 32;
  const barW = plotW / (sgN / 2);
  ctx.fillStyle = '#e67e2230';
  ctx.beginPath();
  ctx.moveTo(28, h * 0.92);
  for (let i = 0; i < sgN / 2; i++) {
    const dbVal = mag[i] > 0 ? 20 * Math.log10(mag[i] / maxM) : -scale;
    const barH = Math.max((-dbVal) / scale, 0);
    const x = 28 + i * barW;
    const y = h * 0.04 + barH * h * 0.88;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(28 + plotW, h * 0.92);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < sgN / 2; i++) {
    const dbVal = mag[i] > 0 ? 20 * Math.log10(mag[i] / maxM) : -scale;
    const barH = Math.max((-dbVal) / scale, 0);
    const x = 28 + i * barW;
    const y = h * 0.04 + barH * h * 0.88;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Peak markers
  for (let i = 1; i < sgN / 2 - 1; i++) {
    if (mag[i] > mag[i-1] && mag[i] > mag[i+1] && mag[i] > maxM * 0.1) {
      const freq = (i / (sgN / 2)) * sgFs / 2;
      const dbVal = 20 * Math.log10(mag[i] / maxM);
      const x = 28 + i * barW;
      const y = h * 0.04 + Math.max((-dbVal) / scale, 0) * h * 0.88;
      ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(Math.round(freq) + 'Hz', x, y - 6);
      ctx.fillText(dbVal.toFixed(1) + 'dB', x, y - 14);
      ctx.textAlign = 'left';
    }
  }

  // Axis labels
  ctx.fillStyle = '#4a5568'; ctx.font = '8px sans-serif';
  const freqs = [0, sgFs / 8, sgFs / 4, sgFs * 3 / 8, sgFs / 2];
  freqs.forEach((f, i) => { ctx.fillText(f + '', 28 + (i / (freqs.length - 1)) * plotW - 8, h - 2); });
  ctx.fillText('\u0434\u0411', 2, 12);
}

/* ---- Constellation diagram for QPSK/QAM ---- */
export function drawConstellation(canvas, constellationData) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const size = Math.min(rect.width, 160);
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.height = size + 'px';
  canvas.style.width = size + 'px';
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const w = size, h = size;
  const pad = 20;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.moveTo(pad, h / 2); ctx.lineTo(w - pad, h / 2); ctx.stroke(); // I axis
  ctx.beginPath(); ctx.moveTo(w / 2, pad); ctx.lineTo(w / 2, h - pad); ctx.stroke(); // Q axis
  ctx.setLineDash([]);

  // Labels
  ctx.fillStyle = '#4a5568'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('I', w - 10, h / 2 + 12);
  ctx.fillText('Q', w / 2 + 10, pad - 4);
  ctx.fillText(constellationData.type, w / 2, h - 4);

  if (!constellationData.points || constellationData.points.length === 0) return;

  // Find max extent for scaling
  let maxVal = 0;
  constellationData.points.forEach(p => {
    if (Math.abs(p.i) > maxVal) maxVal = Math.abs(p.i);
    if (Math.abs(p.q) > maxVal) maxVal = Math.abs(p.q);
  });
  if (maxVal === 0) maxVal = 1;

  const plotSize = (w - 2 * pad) / 2;

  // Draw constellation points
  ctx.fillStyle = '#2ecc71';
  const drawn = new Set();
  constellationData.points.forEach(p => {
    const x = w / 2 + (p.i / maxVal) * plotSize * 0.85;
    const y = h / 2 - (p.q / maxVal) * plotSize * 0.85;
    const key = Math.round(x * 10) + ',' + Math.round(y * 10);
    if (drawn.has(key)) return;
    drawn.add(key);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw ideal constellation grid points (dimmed) for reference
  ctx.fillStyle = '#e67e2240';
  if (constellationData.type === 'QAM-16') {
    const levels = [-3, -1, 1, 3];
    const norm = 1 / Math.sqrt(10);
    ctx.strokeStyle = '#e67e2260'; ctx.lineWidth = 1;
    levels.forEach(i => {
      levels.forEach(q => {
        const x = w / 2 + (i * norm / maxVal) * plotSize * 0.85;
        const y = h / 2 - (q * norm / maxVal) * plotSize * 0.85;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
      });
    });
  } else if (constellationData.type === 'QPSK') {
    const phases = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    ctx.strokeStyle = '#e67e2260'; ctx.lineWidth = 1;
    phases.forEach(ph => {
      const x = w / 2 + (Math.cos(ph) / maxVal) * plotSize * 0.85;
      const y = h / 2 - (Math.sin(ph) / maxVal) * plotSize * 0.85;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
    });
  } else if (constellationData.type === 'BPSK') {
    const bpskPhases = [0, Math.PI];
    ctx.strokeStyle = '#e67e2260'; ctx.lineWidth = 1;
    bpskPhases.forEach(ph => {
      const x = w / 2 + (Math.cos(ph) / maxVal) * plotSize * 0.85;
      const y = h / 2 - (Math.sin(ph) / maxVal) * plotSize * 0.85;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
    });
  }
}

/* =====================================================================
 *  Waterfall display — scrolling spectrogram (time × frequency × power)
 * ===================================================================== */

// Waterfall history buffer (ring buffer of spectrum lines)
let _waterfallHistory = [];
const WATERFALL_MAX_LINES = 80;

export function drawWaterfall(canvas, samples, sgFs, sgN, sgSpectrumWindow) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 160 * dpr;
  canvas.style.height = '160px';
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const w = rect.width, h = 160;

  // Compute current spectrum
  const re = new Float64Array(sgN);
  const im = new Float64Array(sgN);
  for (let i = 0; i < sgN; i++) {
    let win = 1;
    if (sgSpectrumWindow === 'hann') win = 0.5 * (1 - Math.cos(2 * Math.PI * i / (sgN - 1)));
    else if (sgSpectrumWindow === 'hamming') win = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (sgN - 1));
    re[i] = (samples[i] || 0) * win;
  }
  fft(re, im);
  const halfN = sgN >> 1;
  const mag = new Float32Array(halfN);
  let maxM = 0;
  for (let i = 0; i < halfN; i++) {
    mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / sgN * 2;
    if (mag[i] > maxM) maxM = mag[i];
  }
  if (maxM === 0) maxM = 1;

  // Convert to dB, normalize to 0..1
  const dbLine = new Float32Array(halfN);
  for (let i = 0; i < halfN; i++) {
    const db = mag[i] > 0 ? 20 * Math.log10(mag[i] / maxM) : -80;
    dbLine[i] = Math.max(0, Math.min(1, (db + 80) / 80)); // 0 = -80dB, 1 = 0dB
  }

  // Push to history
  _waterfallHistory.push(dbLine);
  if (_waterfallHistory.length > WATERFALL_MAX_LINES) _waterfallHistory.shift();

  // Draw
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, w, h);

  const lineH = h / WATERFALL_MAX_LINES;
  for (let row = 0; row < _waterfallHistory.length; row++) {
    const line = _waterfallHistory[row];
    const y = h - (row + 1) * lineH;
    const binW = w / halfN;
    for (let i = 0; i < halfN; i++) {
      const val = line[i];
      // Color map: dark blue -> cyan -> yellow -> red
      const r = Math.floor(Math.min(255, val * 3 * 255));
      const g = Math.floor(Math.min(255, Math.max(0, (val - 0.33) * 3) * 255));
      const b = Math.floor(Math.max(0, (1 - val * 2)) * 200);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(i * binW, y, Math.ceil(binW), Math.ceil(lineH));
    }
  }

  // Axis labels
  ctx.fillStyle = '#aaa'; ctx.font = '8px sans-serif';
  ctx.fillText('0 Гц', 2, h - 2);
  ctx.fillText(`${sgFs / 2} Гц`, w - 35, h - 2);
  ctx.fillText('Waterfall', w / 2 - 20, 10);
}

export function resetWaterfall() {
  _waterfallHistory = [];
}

/* =====================================================================
 *  Spectrum averaging
 * ===================================================================== */
let _avgBuffer = null;
let _avgCount = 0;

/**
 * Apply spectrum averaging.
 * @param {Float32Array|Float64Array} currentSpectrum - current magnitude spectrum
 * @param {'none'|'exponential'|'linear'} mode
 * @param {number} alpha - exponential averaging weight (0..1), or linear count
 * @returns {Float32Array} averaged spectrum
 */
export function averageSpectrum(currentSpectrum, mode, alpha) {
  if (mode === 'none' || !mode) {
    _avgBuffer = null;
    _avgCount = 0;
    return currentSpectrum;
  }

  const n = currentSpectrum.length;
  if (!_avgBuffer || _avgBuffer.length !== n) {
    _avgBuffer = new Float32Array(n);
    _avgCount = 0;
  }

  if (mode === 'exponential') {
    const a = alpha || 0.3;
    if (_avgCount === 0) {
      _avgBuffer.set(currentSpectrum);
    } else {
      for (let i = 0; i < n; i++) {
        _avgBuffer[i] = a * currentSpectrum[i] + (1 - a) * _avgBuffer[i];
      }
    }
  } else if (mode === 'linear') {
    const maxFrames = alpha || 8;
    if (_avgCount === 0) {
      _avgBuffer.set(currentSpectrum);
    } else {
      const w = Math.min(_avgCount, maxFrames);
      for (let i = 0; i < n; i++) {
        _avgBuffer[i] = (_avgBuffer[i] * w + currentSpectrum[i]) / (w + 1);
      }
    }
  }
  _avgCount++;
  return _avgBuffer;
}

export function resetAveraging() {
  _avgBuffer = null;
  _avgCount = 0;
}

/* =====================================================================
 *  Enhanced peak detection with delta markers
 * ===================================================================== */

/**
 * Detect peaks in a magnitude spectrum and compute deltas between them.
 * @param {Float32Array|Float64Array} mag - magnitude spectrum (half-FFT)
 * @param {number} sgFs - sample rate
 * @param {number} sgN - FFT size
 * @param {number} threshold - minimum relative amplitude (0..1) to consider a peak
 * @returns {{ peaks: Array<{bin: number, freq: number, db: number, mag: number}>, deltas: Array<{from: number, to: number, deltaFreq: number, deltaDb: number}> }}
 */
export function detectPeaks(mag, sgFs, sgN, threshold) {
  threshold = threshold || 0.05;
  const halfN = sgN >> 1;
  let maxM = 0;
  for (let i = 0; i < halfN; i++) if (mag[i] > maxM) maxM = mag[i];
  if (maxM === 0) return { peaks: [], deltas: [] };

  const peaks = [];
  for (let i = 1; i < halfN - 1; i++) {
    if (mag[i] > mag[i - 1] && mag[i] > mag[i + 1] && mag[i] > maxM * threshold) {
      const freq = (i / halfN) * sgFs / 2;
      const db = 20 * Math.log10(mag[i] / maxM);
      peaks.push({ bin: i, freq, db, mag: mag[i] });
    }
  }

  // Sort by magnitude descending, keep top 8
  peaks.sort((a, b) => b.mag - a.mag);
  const topPeaks = peaks.slice(0, 8);
  topPeaks.sort((a, b) => a.freq - b.freq);

  // Compute deltas between adjacent peaks
  const deltas = [];
  for (let i = 0; i < topPeaks.length - 1; i++) {
    deltas.push({
      from: i,
      to: i + 1,
      deltaFreq: topPeaks[i + 1].freq - topPeaks[i].freq,
      deltaDb: topPeaks[i + 1].db - topPeaks[i].db
    });
  }

  return { peaks: topPeaks, deltas };
}
