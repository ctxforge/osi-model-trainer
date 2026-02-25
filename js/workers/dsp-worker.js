/**
 * dsp-worker.js — Web Worker для тяжёлых DSP-вычислений.
 *
 * Поддерживаемые сообщения:
 *   { type: 'fft',      id, data: Float32Array, windowType, fftSize }
 *   { type: 'generate', id, params: { waveform, freq, amp, phase, offset, duty, samples, sampleRate } }
 *   { type: 'channel',  id, signal: Float32Array, channel: { attenuation, snr, noiseType } }
 *
 * Ответы:
 *   { type: 'fft',      id, spectrum: Float32Array }      — передаётся через Transferable
 *   { type: 'generate', id, signal: Float32Array }         — передаётся через Transferable
 *   { type: 'channel',  id, signal: Float32Array }         — передаётся через Transferable
 *
 * Standalone-файл без ES-модулей — полностью автономный.
 */

/* =====================================================================
 *  Оконные функции (Window Functions)
 * ===================================================================== */

/**
 * Применяет оконную функцию к массиву данных (in-place).
 * @param {Float32Array|Float64Array} data
 * @param {string} windowType — 'rectangular' | 'hanning' | 'hamming' | 'blackman'
 */
function applyWindow(data, windowType) {
  var N = data.length;
  if (!windowType || windowType === 'rectangular') return;

  for (var i = 0; i < N; i++) {
    var w = 1;
    switch (windowType) {
      case 'hanning':
        w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
        break;
      case 'hamming':
        w = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
        break;
      case 'blackman':
        w = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1))
                    + 0.08 * Math.cos(4 * Math.PI * i / (N - 1));
        break;
      case 'blackman-harris':
        w = 0.35875 - 0.48829 * Math.cos(2 * Math.PI * i / (N - 1))
                     + 0.14128 * Math.cos(4 * Math.PI * i / (N - 1))
                     - 0.01168 * Math.cos(6 * Math.PI * i / (N - 1));
        break;
      case 'kaiser': {
        var beta = (typeof msg !== 'undefined' && msg.kaiserBeta) || 5;
        var M = N - 1;
        var arg = beta * Math.sqrt(1 - Math.pow(2 * i / M - 1, 2));
        w = besselI0(arg) / besselI0(beta);
        break;
      }
      case 'flattop':
        w = 0.21557895 - 0.41663158 * Math.cos(2 * Math.PI * i / (N - 1))
                        + 0.277263158 * Math.cos(4 * Math.PI * i / (N - 1))
                        - 0.083578947 * Math.cos(6 * Math.PI * i / (N - 1))
                        + 0.006947368 * Math.cos(8 * Math.PI * i / (N - 1));
        break;
    }
    data[i] *= w;
  }
}

/** Modified Bessel function I0 for Kaiser window */
function besselI0(x) {
  var sum = 1, term = 1;
  for (var k = 1; k <= 25; k++) {
    term *= (x / (2 * k)) * (x / (2 * k));
    sum += term;
    if (term < 1e-10 * sum) break;
  }
  return sum;
}

/* =====================================================================
 *  Cooley-Tukey radix-2 FFT (итеративная реализация)
 * ===================================================================== */

/**
 * Итеративная radix-2 FFT.  Работает in-place с массивами re/im.
 * Длина N ДОЛЖНА быть степенью двойки.
 * @param {Float64Array} re — реальная часть
 * @param {Float64Array} im — мнимая часть
 */
function fftRadix2(re, im) {
  var N = re.length;
  if (N <= 1) return;

  // Bit-reversal перестановка
  var j = 0;
  for (var i = 0; i < N - 1; i++) {
    if (i < j) {
      var tmpR = re[i]; re[i] = re[j]; re[j] = tmpR;
      var tmpI = im[i]; im[i] = im[j]; im[j] = tmpI;
    }
    var m = N >> 1;
    while (m >= 1 && j >= m) {
      j -= m;
      m >>= 1;
    }
    j += m;
  }

  // Бабочки Cooley-Tukey
  for (var len = 2; len <= N; len <<= 1) {
    var halfLen = len >> 1;
    var angle = -2 * Math.PI / len;
    var wR = Math.cos(angle);
    var wI = Math.sin(angle);

    for (var start = 0; start < N; start += len) {
      var curR = 1, curI = 0;
      for (var k = 0; k < halfLen; k++) {
        var evenIdx = start + k;
        var oddIdx  = start + k + halfLen;

        var tR = curR * re[oddIdx] - curI * im[oddIdx];
        var tI = curR * im[oddIdx] + curI * re[oddIdx];

        re[oddIdx] = re[evenIdx] - tR;
        im[oddIdx] = im[evenIdx] - tI;
        re[evenIdx] += tR;
        im[evenIdx] += tI;

        // Поворотный множитель
        var newCurR = curR * wR - curI * wI;
        curI = curR * wI + curI * wR;
        curR = newCurR;
      }
    }
  }
}

/**
 * Дополняет данные до ближайшей степени двойки >= fftSize.
 * @param {Float32Array} data  — входные отсчёты (time-domain)
 * @param {number}       fftSize — желаемый размер FFT (степень двойки)
 * @returns {number} — реально используемый N (степень двойки)
 */
function nextPow2(v) {
  v--;
  v |= v >> 1; v |= v >> 2; v |= v >> 4;
  v |= v >> 8; v |= v >> 16;
  return v + 1;
}

/* =====================================================================
 *  Обработчик: FFT
 * ===================================================================== */

function handleFFT(msg) {
  var data       = msg.data;         // Float32Array (time-domain)
  var windowType = msg.windowType || 'rectangular';
  var fftSize    = msg.fftSize || nextPow2(data.length);

  // Гарантируем степень двойки
  var N = nextPow2(Math.max(fftSize, data.length));

  // Копируем данные в Float64Array для точности вычислений
  var re = new Float64Array(N);
  var im = new Float64Array(N);
  for (var i = 0; i < data.length && i < N; i++) {
    re[i] = data[i];
  }

  // Оконная функция — применяем к реальным данным перед дополнением нулями
  applyWindow(re, windowType);

  // FFT
  fftRadix2(re, im);

  // Магнитудный спектр (только первая половина — до Найквиста)
  var halfN = N >> 1;
  var spectrum = new Float32Array(halfN);
  for (var i = 0; i < halfN; i++) {
    spectrum[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / N * 2;
  }

  return {
    type: 'fft',
    id: msg.id,
    spectrum: spectrum
  };
}

/* =====================================================================
 *  Генерация сигналов
 * ===================================================================== */

/** Box-Muller — генерация нормально распределённого шума */
function boxMuller() {
  var u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/** Розовый шум (Voss-McCartney IIR-аппроксимация) */
var pinkState = { b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0 };

function pinkNoiseReset() {
  pinkState = { b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0 };
}

function pinkNoiseSample() {
  var white = (Math.random() - 0.5) * 2;
  pinkState.b0 = 0.99886 * pinkState.b0 + white * 0.0555179;
  pinkState.b1 = 0.99332 * pinkState.b1 + white * 0.0750759;
  pinkState.b2 = 0.96900 * pinkState.b2 + white * 0.1538520;
  pinkState.b3 = 0.86650 * pinkState.b3 + white * 0.3104856;
  pinkState.b4 = 0.55000 * pinkState.b4 + white * 0.5329522;
  pinkState.b5 = -0.7616 * pinkState.b5 - white * 0.0168980;
  var pink = pinkState.b0 + pinkState.b1 + pinkState.b2 + pinkState.b3
           + pinkState.b4 + pinkState.b5 + pinkState.b6 + white * 0.5362;
  pinkState.b6 = white * 0.115926;
  return pink * 0.11; // нормализация примерно к [-1, 1]
}

function handleGenerate(msg) {
  var p          = msg.params;
  var waveform   = p.waveform   || 'sine';
  var freq       = p.freq       || 440;
  var amp        = p.amp != null ? p.amp : 1;
  var phase      = p.phase      || 0;      // в градусах
  var offset     = p.offset     || 0;      // DC offset
  var duty       = p.duty != null ? p.duty / 100 : 0.5;
  var numSamples = p.samples    || 1024;
  var sampleRate = p.sampleRate || 44100;

  var signal = new Float32Array(numSamples);
  var phaseRad = phase * Math.PI / 180;

  if (waveform === 'pink') pinkNoiseReset();

  for (var n = 0; n < numSamples; n++) {
    var t = n / sampleRate;
    var w = 2 * Math.PI * freq;
    var v = 0;

    switch (waveform) {
      case 'sine':
        v = Math.sin(w * t + phaseRad);
        break;
      case 'square': {
        var ph = ((freq * t + phase / 360) % 1 + 1) % 1;
        v = ph < duty ? 1 : -1;
        break;
      }
      case 'triangle': {
        var p2 = ((freq * t + phase / 360) % 1 + 1) % 1;
        v = p2 < 0.5 ? 4 * p2 - 1 : 3 - 4 * p2;
        break;
      }
      case 'sawtooth':
        v = 2 * ((freq * t + phase / 360) % 1) - 1;
        break;
      case 'noise':
        v = (Math.random() - 0.5) * 2;
        break;
      case 'pink':
        v = pinkNoiseSample();
        break;
      default:
        v = Math.sin(w * t + phaseRad);
    }

    signal[n] = v * amp + offset;
  }

  return {
    type: 'generate',
    id: msg.id,
    signal: signal
  };
}

/* =====================================================================
 *  Симуляция канала
 * ===================================================================== */

function handleChannel(msg) {
  var input       = msg.signal;          // Float32Array
  var ch          = msg.channel || {};
  var attenuation = ch.attenuation || 0; // дБ
  var snr         = ch.snr != null ? ch.snr : 40; // дБ
  var noiseType   = ch.noiseType || 'awgn';        // 'awgn' | 'pink' | 'uniform'

  var N      = input.length;
  var output = new Float32Array(N);

  // Коэффициент затухания: attenuation дБ -> линейный множитель
  var gain = Math.pow(10, -attenuation / 20);

  // Мощность сигнала (среднеквадратичная)
  var sigPower = 0;
  for (var i = 0; i < N; i++) {
    sigPower += input[i] * input[i];
  }
  sigPower /= N;
  if (sigPower === 0) sigPower = 1e-10; // защита от деления на ноль

  // Стандартное отклонение шума из SNR: noise_std = sqrt(sigPower / (10^(SNR/10)))
  var noiseStd = Math.sqrt((sigPower * gain * gain) / Math.pow(10, snr / 10));

  if (noiseType === 'pink') pinkNoiseReset();

  for (var i = 0; i < N; i++) {
    var noise = 0;
    switch (noiseType) {
      case 'awgn':
        noise = boxMuller() * noiseStd;
        break;
      case 'pink':
        noise = pinkNoiseSample() * noiseStd * 5; // масштабирование для розового шума
        break;
      case 'uniform':
        noise = (Math.random() - 0.5) * 2 * noiseStd * 1.732; // uniform с тем же std
        break;
      default:
        noise = boxMuller() * noiseStd;
    }
    output[i] = input[i] * gain + noise;
  }

  return {
    type: 'channel',
    id: msg.id,
    signal: output
  };
}

/* =====================================================================
 *  Диспетчер сообщений
 * ===================================================================== */

self.onmessage = function(e) {
  var msg = e.data;
  var result;

  try {
    switch (msg.type) {
      case 'fft':
        result = handleFFT(msg);
        // Передаём ArrayBuffer через Transferable для zero-copy
        self.postMessage(result, [result.spectrum.buffer]);
        break;

      case 'generate':
        result = handleGenerate(msg);
        self.postMessage(result, [result.signal.buffer]);
        break;

      case 'channel':
        result = handleChannel(msg);
        self.postMessage(result, [result.signal.buffer]);
        break;

      default:
        self.postMessage({
          type: 'error',
          id: msg.id,
          error: 'Неизвестный тип сообщения: ' + msg.type
        });
    }
  } catch (err) {
    self.postMessage({
      type: 'error',
      id: msg.id,
      error: err.message || String(err)
    });
  }
};
