import { CHANNEL_TYPES } from '../data/channels.js';
import { labData, getLabText, getLabBits, onLabDataChange } from '../core/lab-data.js';
import { drawLineCode, drawModulation } from './signals-canvas.js';

/* ==================== SIGNAL PRESETS ==================== */
export const SIGNAL_PRESETS = [
  // === Базовые ===
  { name: 'Синусоида 1 кГц', category: 'basic', icon: '〰️', bits: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    description: 'Чистая синусоида частотой 1 кГц — базовый тестовый тон. Используется для калибровки оборудования.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration);
      const buf = new Float32Array(N);
      for (let i = 0; i < N; i++) buf[i] = Math.sin(2 * Math.PI * 1000 * i / sampleRate);
      return buf;
    }
  },
  { name: 'Меандр 1 кГц', category: 'basic', icon: '⏹', bits: [1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0],
    description: 'Прямоугольный сигнал (меандр) 1 кГц — содержит нечётные гармоники (3 кГц, 5 кГц...). Основа цифровой логики.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration);
      const buf = new Float32Array(N);
      for (let i = 0; i < N; i++) buf[i] = Math.sin(2 * Math.PI * 1000 * i / sampleRate) >= 0 ? 1 : -1;
      return buf;
    }
  },
  { name: 'Треугольник 1 кГц', category: 'basic', icon: '🔺', bits: [0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,0],
    description: 'Треугольный сигнал 1 кГц — линейно нарастает и спадает. Более мягкий спектр, чем у меандра.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration);
      const buf = new Float32Array(N);
      for (let i = 0; i < N; i++) { const t = (1000 * i / sampleRate) % 1; buf[i] = t < 0.5 ? 4 * t - 1 : 3 - 4 * t; }
      return buf;
    }
  },

  // === Телекоммуникации ===
  { name: 'DTMF «1» (697+1209 Гц)', category: 'telecom', icon: '📞', bits: [1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0],
    description: 'Двухтональный многочастотный сигнал для кнопки «1»: смесь 697 Гц и 1209 Гц. Стандарт набора номера на тональных телефонах.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration);
      const buf = new Float32Array(N);
      for (let i = 0; i < N; i++) buf[i] = 0.5 * (Math.sin(2 * Math.PI * 697 * i / sampleRate) + Math.sin(2 * Math.PI * 1209 * i / sampleRate));
      return buf;
    }
  },
  { name: 'DTMF «5» (770+1336 Гц)', category: 'telecom', icon: '📞', bits: [0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0],
    description: 'DTMF для кнопки «5»: 770 Гц + 1336 Гц. Центральная кнопка телефонной клавиатуры.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration);
      const buf = new Float32Array(N);
      for (let i = 0; i < N; i++) buf[i] = 0.5 * (Math.sin(2 * Math.PI * 770 * i / sampleRate) + Math.sin(2 * Math.PI * 1336 * i / sampleRate));
      return buf;
    }
  },
  { name: 'DTMF «0» (941+1336 Гц)', category: 'telecom', icon: '📞', bits: [1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1],
    description: 'DTMF для кнопки «0»: 941 Гц + 1336 Гц. Нижний ряд телефонной клавиатуры.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration);
      const buf = new Float32Array(N);
      for (let i = 0; i < N; i++) buf[i] = 0.5 * (Math.sin(2 * Math.PI * 941 * i / sampleRate) + Math.sin(2 * Math.PI * 1336 * i / sampleRate));
      return buf;
    }
  },
  { name: 'Гудок 425 Гц', category: 'telecom', icon: '📠', bits: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    description: 'Непрерывный тон 425 Гц — стандартный гудок в телефонных сетях России и Европы (ITU-T).',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration);
      const buf = new Float32Array(N);
      for (let i = 0; i < N; i++) buf[i] = Math.sin(2 * Math.PI * 425 * i / sampleRate);
      return buf;
    }
  },
  { name: 'Вызывной сигнал 25 Гц', category: 'telecom', icon: '🔔', bits: [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
    description: 'Сигнал вызова 25 Гц (90 В переменного тока) — заставляет звонить телефонный аппарат. Частота ниже слышимого диапазона.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration);
      const buf = new Float32Array(N);
      for (let i = 0; i < N; i++) { const t = i / sampleRate; const ring = (t % 5) < 2 ? 1 : 0; buf[i] = ring * Math.sin(2 * Math.PI * 25 * i / sampleRate); }
      return buf;
    }
  },

  // === Цифровые кодировки ===
  { name: 'NRZ «10110»', category: 'digital', icon: '🔢', bits: [1,0,1,1,0],
    description: 'NRZ-кодирование последовательности 10110. Высокий уровень = 1, низкий = 0. Простейший линейный код, используется в RS-232.',
    generate(sampleRate, duration) {
      const bits = [1,0,1,1,0]; const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N);
      const bitLen = N / bits.length;
      for (let i = 0; i < N; i++) { const bi = Math.min(Math.floor(i / bitLen), bits.length - 1); buf[i] = bits[bi] ? 0.8 : -0.8; }
      return buf;
    }
  },
  { name: 'Манчестер «10110»', category: 'digital', icon: '📊', bits: [1,0,1,1,0],
    description: 'Манчестерское кодирование 10110. Переход в середине каждого бита: вверх = 1, вниз = 0. Самосинхронизирующийся код Ethernet 10BASE-T.',
    generate(sampleRate, duration) {
      const bits = [1,0,1,1,0]; const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N);
      const bitLen = N / bits.length;
      for (let i = 0; i < N; i++) {
        const bi = Math.min(Math.floor(i / bitLen), bits.length - 1);
        const inBit = (i % bitLen) / bitLen;
        const half1 = bits[bi] ? -0.8 : 0.8; const half2 = bits[bi] ? 0.8 : -0.8;
        buf[i] = inBit < 0.5 ? half1 : half2;
      }
      return buf;
    }
  },
  { name: '8B/10B паттерн', category: 'digital', icon: '🧬', bits: [0,1,1,0,1,1,0,1,0,0],
    description: 'Пример 8B/10B кода (D5.6): 8 бит данных кодируются в 10 бит с DC-балансом. USB 3.0, SATA, PCIe 1.0–2.0, Gigabit Ethernet.',
    generate(sampleRate, duration) {
      const bits = [0,1,1,0,1,1,0,1,0,0]; const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N);
      const bitLen = N / bits.length; let prev = -0.8;
      for (let i = 0; i < N; i++) {
        const bi = Math.min(Math.floor(i / bitLen), bits.length - 1);
        if (bi > 0 && Math.floor((i - 1) / bitLen) !== bi && bits[bi]) prev = -prev;
        buf[i] = prev;
      }
      return buf;
    }
  },

  // === Модулированные ===
  { name: 'AM-радио (концепт)', category: 'modulated', icon: '📻', bits: [1,0,1,0,0,1,1,0,1,0,0,1,0,1,1,0],
    description: 'Амплитудная модуляция: информационный сигнал изменяет амплитуду несущей. Принцип AM-радио (530–1700 кГц). Частоты масштабированы для наглядности.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N);
      const fc = 5000, fm = 400;
      for (let i = 0; i < N; i++) { const t = i / sampleRate; buf[i] = (1 + 0.7 * Math.sin(2 * Math.PI * fm * t)) * Math.sin(2 * Math.PI * fc * t) * 0.5; }
      return buf;
    }
  },
  { name: 'FM-сигнал', category: 'modulated', icon: '📡', bits: [1,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0],
    description: 'Частотная модуляция: информационный сигнал изменяет частоту несущей. Принцип FM-радио (88–108 МГц). Более устойчива к помехам, чем AM.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N);
      const fc = 5000, fm = 300, beta = 5;
      for (let i = 0; i < N; i++) { const t = i / sampleRate; buf[i] = Math.sin(2 * Math.PI * fc * t + beta * Math.sin(2 * Math.PI * fm * t)) * 0.8; }
      return buf;
    }
  },
  { name: 'BPSK 1200 бод', category: 'modulated', icon: '🛰️', bits: [1,0,1,1,0,0,1,0],
    description: 'Двоичная фазовая манипуляция (BPSK) 1200 бод. Бит 1 = фаза 0°, бит 0 = фаза 180°. Основа спутниковой связи, GPS.',
    generate(sampleRate, duration) {
      const bits = [1,0,1,1,0,0,1,0]; const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N);
      const fc = 4800; const bitLen = N / bits.length;
      for (let i = 0; i < N; i++) {
        const bi = Math.min(Math.floor(i / bitLen), bits.length - 1);
        const phase = bits[bi] ? 0 : Math.PI;
        buf[i] = Math.sin(2 * Math.PI * fc * i / sampleRate + phase) * 0.8;
      }
      return buf;
    }
  },

  // === Тестовые ===
  { name: 'Чирп (свип)', category: 'test', icon: '📈', bits: [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1],
    description: 'Линейная частотная развёртка (chirp) от 200 Гц до 8000 Гц. Используется в радарах, сонарах и для тестирования АЧХ оборудования.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N);
      const f0 = 200, f1 = 8000;
      for (let i = 0; i < N; i++) { const t = i / sampleRate; const freq = f0 + (f1 - f0) * t / duration; buf[i] = Math.sin(2 * Math.PI * freq * t) * 0.8; }
      return buf;
    }
  },
  { name: 'Импульс', category: 'test', icon: '⚡', bits: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
    description: 'Единичный импульс (дельта-функция). Содержит ВСЕ частоты с одинаковой амплитудой. Идеален для измерения импульсной характеристики системы.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N);
      buf[Math.floor(N / 2)] = 1.0;
      return buf;
    }
  },
  { name: 'Белый шум', category: 'test', icon: '🌫️', bits: [1,0,1,1,0,1,0,0,1,1,0,1,0,1,1,0],
    description: 'Случайный сигнал с равномерным спектром — одинаковая энергия на всех частотах. Используется для тестирования, маскировки, генерации речи.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N);
      for (let i = 0; i < N; i++) buf[i] = (Math.random() * 2 - 1) * 0.7;
      return buf;
    }
  },
  { name: 'Розовый шум (1/f)', category: 'test', icon: '🌸', bits: [1,1,0,1,0,0,1,0,1,1,0,0,1,0,1,1],
    description: 'Шум с спектром 1/f — энергия уменьшается с ростом частоты. Звучит «теплее» белого. Встречается в природе, музыке, электронике.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N);
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < N; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886*b0 + white*0.0555179; b1 = 0.99332*b1 + white*0.0750759;
        b2 = 0.96900*b2 + white*0.1538520; b3 = 0.86650*b3 + white*0.3104856;
        b4 = 0.55000*b4 + white*0.5329522; b5 = -0.7616*b5 - white*0.0168980;
        buf[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362) * 0.11;
        b6 = white * 0.115926;
      }
      return buf;
    }
  },

  // === Реальные протоколы ===
  { name: 'Ethernet преамбула', category: 'real', icon: '🔌', bits: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1],
    description: 'Преамбула Ethernet: 7 байт 10101010 + SFD (10101011). 64 бита для синхронизации тактовых генераторов приёмника и передатчика. IEEE 802.3.',
    generate(sampleRate, duration) {
      const bits = [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1];
      const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N); const bitLen = N / bits.length;
      for (let i = 0; i < N; i++) {
        const bi = Math.min(Math.floor(i / bitLen), bits.length - 1);
        const inBit = (i % bitLen) / bitLen;
        buf[i] = bits[bi] ? (inBit < 0.5 ? -0.8 : 0.8) : (inBit < 0.5 ? 0.8 : -0.8);
      }
      return buf;
    }
  },
  { name: 'Wi-Fi OFDM символ', category: 'real', icon: '📶', bits: [1,0,1,1,0,0,1,0,1,1,0,1,0,0,1,1,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1],
    description: 'Многочастотный OFDM-символ Wi-Fi (802.11a/g/n/ac/ax): данные передаются параллельно на 52 поднесущих. Устойчив к многолучёвости.',
    generate(sampleRate, duration) {
      const N = Math.floor(sampleRate * duration); const buf = new Float32Array(N);
      const subcarriers = [800,1000,1200,1400,1600,1800,2000,2200,2400,2600,2800,3000,3400,3600,3800,4000];
      const phases = [0,1.2,2.5,0.8,3.1,1.7,0.3,2.9,1.1,3.5,0.6,2.2,1.9,3.3,0.4,2.7];
      for (let i = 0; i < N; i++) {
        let v = 0; const t = i / sampleRate;
        for (let s = 0; s < subcarriers.length; s++) v += Math.sin(2 * Math.PI * subcarriers[s] * t + phases[s]);
        buf[i] = v / subcarriers.length * 0.8;
      }
      return buf;
    }
  }
];

const PRESET_CATEGORIES = [
  { id: 'basic',     name: 'Базовые',     icon: '〰️' },
  { id: 'telecom',   name: 'Телеком',      icon: '📞' },
  { id: 'digital',   name: 'Цифровые',     icon: '🔢' },
  { id: 'modulated', name: 'Модулированные', icon: '📡' },
  { id: 'test',      name: 'Тестовые',     icon: '📈' },
  { id: 'real',      name: 'Реальные',     icon: '🔌' }
];

/* ==================== SIGNAL EXPORT UTILITIES ==================== */

function generateSamplesFromCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  const mid = h / 2;
  const amp = h * 0.35;
  const samples = [];
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let x = 0; x < Math.floor(w); x++) {
    const px = Math.floor(x * (window.devicePixelRatio || 1));
    let foundY = -1;
    for (let y = 0; y < canvas.height; y++) {
      const idx = (y * canvas.width + px) * 4;
      const r = imageData.data[idx], g = imageData.data[idx + 1], b = imageData.data[idx + 2], a = imageData.data[idx + 3];
      if (g > 150 && a > 100) { foundY = y / (window.devicePixelRatio || 1); break; }
    }
    const value = foundY >= 0 ? -(foundY - mid) / amp : 0;
    samples.push({ time: x / w, amplitude: Math.max(-1, Math.min(1, value)) });
  }
  return samples;
}

function exportCSV(samples, filename) {
  let csv = 'time,amplitude\n';
  samples.forEach(s => { csv += s.time.toFixed(6) + ',' + s.amplitude.toFixed(6) + '\n'; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, filename || 'signal.csv');
}

function exportWAV(audioData, sampleRate, filename) {
  sampleRate = sampleRate || 44100;
  const numSamples = audioData.length;
  const bitsPerSample = 16;
  const numChannels = 1;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);             // chunk size
  view.setUint16(20, 1, true);              // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM samples (16-bit signed)
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(44 + i * 2, intSample, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  downloadBlob(blob, filename || 'signal.wav');
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
}

function exportJSON(params, filename) {
  const json = JSON.stringify(params, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, filename || 'signal.json');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function generateLineCodeSamples(bits, encoding, sampleRate, duration) {
  const N = Math.floor(sampleRate * duration);
  const buf = new Float32Array(N);
  const bitLen = N / bits.length;
  let prev = 0, amiP = 1;
  for (let i = 0; i < N; i++) {
    const bi = Math.min(Math.floor(i / bitLen), bits.length - 1);
    const b = bits[bi];
    const inBit = (i % bitLen) / bitLen;
    let val = 0;
    if (encoding === 'nrz') val = b ? 1 : -1;
    else if (encoding === 'manchester') val = b ? (inBit < 0.5 ? -1 : 1) : (inBit < 0.5 ? 1 : -1);
    else if (encoding === 'ami') { if (b) { val = amiP; if (inBit > 0.95) amiP *= -1; } }
    else if (encoding === 'nrzi') { if (b && inBit < 0.01) prev = prev ? 0 : 1; val = prev ? 1 : -1; }
    else if (encoding === 'diffmanch') {
      if (b === 0 && inBit < 0.01) prev = prev ? 0 : 1;
      const startV = prev ? 1 : -1; val = inBit < 0.5 ? startV : -startV;
      if (inBit > 0.95) prev = prev ? 0 : 1;
    }
    else if (encoding === 'mlt3') {
      const mlt3L = [0, 1, 0, -1];
      if (b && inBit < 0.01) amiP = ((amiP || 0) + 1) % 4;
      val = mlt3L[amiP % 4];
    }
    else if (encoding === 'scrambling') {
      const lfsr = ((bi * 131 + 17) ^ (bi * 37)) & 1;
      val = (b ^ lfsr) ? 1 : -1;
    }
    else val = b ? 1 : -1;
    buf[i] = val * 0.8;
  }
  return buf;
}

export function initSignalsLab() {
  const container = document.getElementById('signalsUI');
  let sigText = '';
  let sigAnimId = null;
  let sigEncoding = 'nrz';
  let sigModulation = 'ask';
  let sigView = 'line';
  let sigChannel = 'cat5e';
  let activePreset = null;
  let presetCategory = null;
  let presetAnimId = null;

  const LINE_CODES = {
    nrz:        { name: 'NRZ (Non-Return-to-Zero)', desc: 'Простейший код: 1 = высокий уровень, 0 = низкий. Используется в RS-232. Проблема: длинные последовательности одинаковых битов — потеря синхронизации.', where: 'RS-232, UART' },
    nrzi:       { name: 'NRZ-I (Inverted)', desc: 'При «1» сигнал меняет уровень, при «0» остаётся. Решает проблему длинных серий единиц. Используется в USB, FDDI.', where: 'USB, FDDI, 4B5B+NRZI' },
    manchester:  { name: 'Manchester (IEEE)', desc: 'Переход в середине каждого бита: вверх = 1, вниз = 0. Самосинхронизирующийся — тактовый сигнал встроен. Ethernet 10BASE-T.', where: '10BASE-T Ethernet' },
    diffmanch:   { name: 'Differential Manchester', desc: 'Переход в середине всегда. Переход на границе бита = 0, нет перехода = 1. Используется в Token Ring.', where: 'Token Ring' },
    ami:        { name: 'AMI (Alternate Mark Inversion)', desc: '0 = нулевой уровень, 1 = чередование +V и −V. Нет DC-составляющей. Проблема с длинными нулями.', where: 'T1/E1, ISDN' },
    pam4:       { name: 'PAM-4 (4 уровня)', desc: '4 уровня напряжения: −3V, −1V, +1V, +3V. Каждый символ = 2 бита. Удваивает пропускную способность при той же полосе.', where: '100GBASE-T, 400G Ethernet, PCIe 6.0' },
    mlt3:       { name: 'MLT-3 (Multi-Level Transmit)', desc: '3 уровня (−1, 0, +1). При «1» сигнал переходит к следующему уровню циклически: 0→+1→0→−1→0→+1... При «0» — остаётся. Снижает частоту сигнала вдвое.', where: '100BASE-TX (Fast Ethernet)' },
    pam5:       { name: 'PAM-5 (5 уровней)', desc: '5 уровней (−2, −1, 0, +1, +2). Каждый символ несёт log₂(5) ≈ 2.32 бита. Четыре пары проводов одновременно = 1 Гбит/с. Пятый уровень для коррекции ошибок (Trellis coding).', where: '1000BASE-T (Gigabit Ethernet)' },
    fourb5b:    { name: '4B/5B', desc: 'Каждые 4 бита заменяются 5-битным кодом по таблице (16 записей). Гарантирует не более 3 нулей подряд — решает проблему синхронизации. Overhead: 25%. Используется вместе с NRZI.', where: 'FDDI, 100BASE-FX' },
    eightb10b:  { name: '8B/10B', desc: 'Каждые 8 бит → 10 бит. DC-баланс: разница между 0 и 1 (running disparity) ≤ 2. Обеспечивает достаточно переходов для тактовой синхронизации. Overhead: 25%.', where: 'Gigabit Ethernet (1000BASE-X), Fibre Channel, USB 3.0, SATA, PCIe 1.0-2.0' },
    sixfour66b: { name: '64B/66B', desc: '64 бита данных + 2-битный синхро-заголовок (01 = данные, 10 = управление). Overhead всего 3% вместо 25%. Использует самосинхронизирующийся скремблер.', where: '10GBASE-R, 25/40/100G Ethernet, PCIe 3.0+' },
    scrambling: { name: 'Scrambling', desc: 'Скремблирование: XOR данных с псевдослучайной последовательностью (LFSR). Устраняет длинные серии одинаковых битов без overhead. Полином x⁷+x⁴+1 (V.35) или x²³+x¹⁸+1 (SDH). Обратимо: приёмник повторяет XOR.', where: 'V.35, SONET/SDH, 802.3 10GBASE-R (вместе с 64B/66B)' }
  };

  const MOD_TYPES = {
    ask:  { name: 'ASK (Amplitude)', desc: 'Амплитуда несущей изменяется: 1 = полная амплитуда, 0 = малая. Простейшая модуляция. Чувствительна к помехам.', bps: 1 },
    fsk:  { name: 'FSK (Frequency)', desc: 'Частота несущей изменяется: 1 = высокая частота, 0 = низкая. Устойчивее к помехам чем ASK. Модемы, Bluetooth.', bps: 1 },
    bpsk: { name: 'BPSK (Phase)', desc: 'Фаза несущей: 1 = 0°, 0 = 180° (инверсия). 1 бит на символ. Очень устойчива к шуму. Wi-Fi на слабом сигнале.', bps: 1 },
    qpsk: { name: 'QPSK (4 фазы)', desc: '4 значения фазы (0°, 90°, 180°, 270°). 2 бита на символ. Удвоение скорости при той же полосе. DVB-S, LTE.', bps: 2 },
    qam16:{ name: 'QAM-16', desc: '16 комбинаций амплитуды и фазы. 4 бита на символ. Кабельное ТВ, Wi-Fi на среднем сигнале.', bps: 4 },
    qam64:{ name: 'QAM-64', desc: '64 комбинации амплитуды и фазы. 6 бит на символ. Баланс между скоростью и помехоустойчивостью. Wi-Fi, LTE, DOCSIS.', bps: 6 },
    qam256:{ name: 'QAM-256', desc: '256 комбинаций — 8 бит на символ! Максимальная эффективность, но требует высокий SNR > 30 дБ. Wi-Fi 5/6, DOCSIS 3.1.', bps: 8 }
  };

  function render() {
    const isLine = sigView === 'line';
    const enc = isLine ? LINE_CODES[sigEncoding] : MOD_TYPES[sigModulation];
    const ch = CHANNEL_TYPES.find(c => c.id === sigChannel);
    sigText = getLabText();
    const sigBits = getLabBits(4);
    const useFile = labData.type === 'file';
    const breakdown = labData.bytes.slice(0, 4).map((b, i) => ({
      char: useFile ? '0x' + b.toString(16).toUpperCase().padStart(2, '0') : (labData.text[i] || '?'),
      dec: b, hex: b.toString(16).toUpperCase().padStart(2, '0'),
      bin: b.toString(2).padStart(8, '0')
    }));

    const presetObj = activePreset !== null ? SIGNAL_PRESETS[activePreset] : null;
    const filteredPresets = presetCategory
      ? SIGNAL_PRESETS.map((p, i) => ({ ...p, _idx: i })).filter(p => p.category === presetCategory)
      : SIGNAL_PRESETS.map((p, i) => ({ ...p, _idx: i }));

    container.innerHTML = `
      <div class="sig-section-title">Источник: ${labData.type === 'file' ? '📎 ' + labData.fileName : labData.type === 'random' ? '🎲 Случайные данные' : '✏️ ' + labData.text} (${labData.size} Б)</div>

      <div class="sig-section-title">Байты → Биты (первые ${breakdown.length} символа)</div>
      <div class="enc-step" style="overflow-x:auto">
        <table class="pdu-fields" style="margin:0;font-size:.7rem">
          <tr><td style="width:20%">Символ</td>${breakdown.map(b => `<td style="text-align:center;font-weight:700">${b.char}</td>`).join('')}</tr>
          <tr><td>Десятичный</td>${breakdown.map(b => `<td style="text-align:center">${b.dec}</td>`).join('')}</tr>
          <tr><td>Hex</td>${breakdown.map(b => `<td style="text-align:center;color:var(--accent)">0x${b.hex}</td>`).join('')}</tr>
          <tr><td>Двоичный</td>${breakdown.map(b => `<td style="text-align:center;font-family:monospace;font-size:.65rem">${b.bin}</td>`).join('')}</tr>
        </table>
      </div>

      <div class="sig-section-title">Биты на линии (из вашего сообщения — ${sigBits.length} бит = ${Math.ceil(sigBits.length/8)} байт)</div>
      <div class="sig-bits" id="sigBitsRow">
        ${sigBits.map((b, i) => `<div class="sig-bit sig-bit--${b}" data-idx="${i}">${b}</div>`).join('')}
      </div>

      <div class="sig-section-title">Канал связи</div>
      <select class="ch-phy-select" id="sigChannelSelect">
        ${CHANNEL_TYPES.map(c => `<option value="${c.id}"${c.id === sigChannel ? ' selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
      </select>

      <div class="lab-toggle mb-12">
        <button class="lab-toggle__btn${isLine ? ' active' : ''}" id="sigViewLine">⚡ ${ch.medium === 'copper' ? 'Напряжение' : ch.medium === 'fiber' ? 'Свет' : 'Радиоволна'}</button>
        <button class="lab-toggle__btn${!isLine ? ' active' : ''}" id="sigViewMod">📡 Модуляция</button>
      </div>

      <div class="sig-tabs" id="sigTabs">
        ${isLine
          ? Object.entries(LINE_CODES).map(([k, v]) => `<button class="sig-tab${k === sigEncoding ? ' active' : ''}" data-sig="${k}">${v.name.split('(')[0].trim()}</button>`).join('')
          : Object.entries(MOD_TYPES).map(([k, v]) => `<button class="sig-tab${k === sigModulation ? ' active' : ''}" data-sig="${k}">${v.name.split('(')[0].trim()}</button>`).join('')
        }
      </div>

      <div class="sig-canvas-wrap">
        <canvas id="sigCanvas" style="height:${isLine ? '120px' : '240px'}"></canvas>
        <div class="sig-canvas-label">${isLine
          ? (ch.medium === 'copper' ? '⚡ Напряжение на медном проводе ↕ / Время →' : ch.medium === 'fiber' ? '💡 Мощность света в оптоволокне ↕ / Время →' : '📶 Амплитуда радиосигнала ↕ / Время →')
          : `📡 Вверху: несущая частота | Внизу: модулированный сигнал (${ch.name})`}</div>
      </div>

      <div class="sig-export-bar" style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap">
        <button class="sig-export-btn" id="sigExportCSV" style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:var(--radius-xs);border:1px solid var(--border);background:var(--bg-card);color:var(--text-secondary);font-size:.75rem;font-weight:600;cursor:pointer;transition:all var(--transition)">📄 Экспорт CSV</button>
        <button class="sig-export-btn" id="sigExportWAV" style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:var(--radius-xs);border:1px solid var(--border);background:var(--bg-card);color:var(--text-secondary);font-size:.75rem;font-weight:600;cursor:pointer;transition:all var(--transition)">🔊 Экспорт WAV</button>
        <button class="sig-export-btn" id="sigExportJSON" style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:var(--radius-xs);border:1px solid var(--border);background:var(--bg-card);color:var(--text-secondary);font-size:.75rem;font-weight:600;cursor:pointer;transition:all var(--transition)">📋 Экспорт JSON</button>
      </div>

      <div class="card" style="font-size:.82rem;line-height:1.7">
        <strong>${enc.name}</strong><br>${enc.desc}
        ${enc.where ? `<br><strong>Используется:</strong> ${enc.where}` : ''}
        ${enc.bps ? `<br><strong>Бит на символ:</strong> ${enc.bps}` : ''}
      </div>

      <div class="card mt-12" style="font-size:.78rem;line-height:1.6">
        <strong>Привязка к каналу ${ch.icon} ${ch.name}:</strong><br>
        ${ch.medium === 'copper'
          ? `В медном кабеле биты передаются как уровни напряжения. ${ch.name} использует кодирование ${ch.encoding}. На расстоянии ${ch.maxDist} м сигнал затухает на ${ch.attenuation} дБ/100м. ${ch.duplex === 'full' ? 'Полный дуплекс — передача и приём одновременно.' : 'Полудуплекс — по очереди.'}`
          : ch.medium === 'fiber'
          ? `В оптоволокне биты — это вспышки лазера (1) и отсутствие света (0). Затухание всего ${ch.attenuation} дБ/км — сигнал может идти ${(ch.maxDist/1000).toFixed(0)} км. Невосприимчив к электромагнитным помехам.`
          : `В радиоканале биты модулируют несущую частоту. ${ch.name} использует ${ch.encoding}. Сигнал распространяется со скоростью света, но затухает (${ch.attenuation} дБ) и подвержен помехам (${ch.interference}). ${ch.duplex === 'half' ? 'Полудуплекс (CSMA/CA) — одновременно передаёт только одно устройство.' : 'Полный дуплекс (FDD/TDD).'}`
        }
      </div>

      <div class="sig-section-title" style="margin-top:18px">Готовые сигналы (пресеты)</div>
      <div class="sig-preset-categories" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;-ms-overflow-style:none">
        <button class="sig-preset-cat${!presetCategory ? ' active' : ''}" data-cat="" style="padding:6px 12px;border-radius:20px;border:1px solid var(--border);background:${!presetCategory ? 'var(--accent)' : 'var(--bg-card)'};color:${!presetCategory ? '#fff' : 'var(--text-secondary)'};font-size:.72rem;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all var(--transition)">Все</button>
        ${PRESET_CATEGORIES.map(c => `<button class="sig-preset-cat${presetCategory === c.id ? ' active' : ''}" data-cat="${c.id}" style="padding:6px 12px;border-radius:20px;border:1px solid var(--border);background:${presetCategory === c.id ? 'var(--accent)' : 'var(--bg-card)'};color:${presetCategory === c.id ? '#fff' : 'var(--text-secondary)'};font-size:.72rem;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all var(--transition)">${c.icon} ${c.name}</button>`).join('')}
      </div>

      <div class="sig-preset-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:8px 0">
        ${filteredPresets.map(p => `
          <button class="sig-preset-card${activePreset === p._idx ? ' active' : ''}" data-pidx="${p._idx}"
            style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:10px;border-radius:var(--radius-xs);border:1px solid ${activePreset === p._idx ? 'var(--accent)' : 'var(--border)'};background:${activePreset === p._idx ? 'var(--accent)' : 'var(--bg-card)'};color:${activePreset === p._idx ? '#fff' : 'var(--text)'};font-size:.72rem;cursor:pointer;text-align:left;transition:all var(--transition)">
            <span style="font-size:1.1rem">${p.icon}</span>
            <span style="font-weight:700;line-height:1.3">${p.name}</span>
          </button>
        `).join('')}
      </div>

      ${presetObj ? `
        <div class="card mt-12" style="font-size:.78rem;line-height:1.6">
          <strong>${presetObj.icon} ${presetObj.name}</strong><br>
          ${presetObj.description}
          <br><strong>Биты:</strong> <code style="font-size:.68rem;color:var(--accent)">${presetObj.bits.join('')}</code>
        </div>
        <div class="sig-canvas-wrap" style="margin-top:8px">
          <canvas id="sigPresetCanvas" style="height:120px"></canvas>
          <div class="sig-canvas-label">Форма сигнала пресета: ${presetObj.name}</div>
        </div>
        <div class="sig-export-bar" style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap">
          <button class="sig-export-btn" id="sigPresetExportCSV" style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:var(--radius-xs);border:1px solid var(--border);background:var(--bg-card);color:var(--text-secondary);font-size:.75rem;font-weight:600;cursor:pointer;transition:all var(--transition)">📄 CSV пресета</button>
          <button class="sig-export-btn" id="sigPresetExportWAV" style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:var(--radius-xs);border:1px solid var(--border);background:var(--bg-card);color:var(--text-secondary);font-size:.75rem;font-weight:600;cursor:pointer;transition:all var(--transition)">🔊 WAV пресета</button>
          <button class="sig-export-btn" id="sigPresetExportJSON" style="display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:var(--radius-xs);border:1px solid var(--border);background:var(--bg-card);color:var(--text-secondary);font-size:.75rem;font-weight:600;cursor:pointer;transition:all var(--transition)">📋 JSON пресета</button>
        </div>
      ` : ''}
    `;

    const canvas = document.getElementById('sigCanvas');
    if (sigAnimId) cancelAnimationFrame(sigAnimId);

    if (isLine) {
      const allBits = getLabBits(8);
      function animLine(now) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 120 * dpr;
        canvas.style.height = '120px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const w = rect.width, h = 120;
        const offset = ((now || 0) / 80) % (w * 0.5);
        const mid = h / 2, amp = h * 0.35;
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
        const bitW = w / allBits.length;
        for (let i = 0; i <= allBits.length; i++) {
          const x = i * bitW - offset % bitW;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#6c7a96'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        allBits.forEach((b, i) => { const x = i * bitW + bitW / 2 - offset % bitW; if (x > -bitW && x < w + bitW) ctx.fillText(b, x, 12); });
        ctx.textAlign = 'left';
        ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2.5; ctx.beginPath();
        let prev = 0, amiP = 1;
        for (let px = 0; px < w; px++) {
          const realX = px + offset;
          const bi = ((Math.floor(realX / bitW) % allBits.length) + allBits.length) % allBits.length;
          const b = allBits[bi];
          const inBit = (realX % bitW) / bitW;
          let val = 0;
          if (sigEncoding === 'nrz') val = b ? 1 : -1;
          else if (sigEncoding === 'manchester') { val = b ? (inBit < 0.5 ? -1 : 1) : (inBit < 0.5 ? 1 : -1); }
          else if (sigEncoding === 'ami') { if (b) { val = amiP; amiP *= (inBit > 0.9 ? -1 : 1); } }
          else if (sigEncoding === 'nrzi') { if (b) prev = prev ? 0 : 1; val = prev ? 1 : -1; }
          else if (sigEncoding === 'mlt3') {
            const mlt3L = [0, 1, 0, -1];
            if (b) amiP = ((amiP || 0) + 1) % 4;
            val = mlt3L[amiP % 4];
          }
          else if (sigEncoding === 'pam4') { val = b ? 1 : -1; }
          else if (sigEncoding === 'pam5') {
            const pLevels = [-1, -0.5, 0, 0.5, 1];
            val = pLevels[Math.floor(b * 2.5 + (bi % 2))];
          }
          else if (sigEncoding === 'scrambling') {
            // Scramble: XOR with LFSR (x^7+x^4+1) output
            const lfsr = ((bi * 131 + 17) ^ (bi * 37)) & 1;
            val = (b ^ lfsr) ? 1 : -1;
          }
          else val = b ? 1 : -1;
          const edge = 0.06;
          if (inBit < edge) val *= inBit / edge;
          const y = mid - val * amp;
          if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.arc(w * 0.8, mid, 3, 0, Math.PI * 2); ctx.fill();
        sigAnimId = requestAnimationFrame(animLine);
      }
      sigAnimId = requestAnimationFrame(animLine);
    } else {
      drawModulation(canvas, sigBits, sigModulation, MOD_TYPES);
    }

    container.querySelector('#sigChannelSelect').addEventListener('change', (e) => {
      sigChannel = e.target.value;
      render();
    });

    document.getElementById('sigViewLine')?.addEventListener('click', () => { sigView = 'line'; render(); });
    document.getElementById('sigViewMod')?.addEventListener('click', () => { sigView = 'mod'; render(); });

    container.querySelectorAll('.sig-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (sigView === 'line') sigEncoding = tab.dataset.sig;
        else sigModulation = tab.dataset.sig;
        render();
      });
    });

    // --- Preset category filters ---
    container.querySelectorAll('.sig-preset-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        presetCategory = btn.dataset.cat || null;
        render();
      });
    });

    // --- Preset cards ---
    container.querySelectorAll('.sig-preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.pidx);
        activePreset = activePreset === idx ? null : idx;
        render();
      });
    });

    // --- Preset canvas drawing ---
    if (presetObj && presetObj.generate) {
      const presetCanvas = document.getElementById('sigPresetCanvas');
      if (presetCanvas) {
        if (presetAnimId) cancelAnimationFrame(presetAnimId);
        const sampleRate = 44100;
        const duration = 0.05;
        const audioSamples = presetObj.generate(sampleRate, duration);

        function drawPresetWaveform(now) {
          const dpr = window.devicePixelRatio || 1;
          const rect = presetCanvas.getBoundingClientRect();
          presetCanvas.width = rect.width * dpr;
          presetCanvas.height = 120 * dpr;
          presetCanvas.style.height = '120px';
          const pCtx = presetCanvas.getContext('2d');
          pCtx.scale(dpr, dpr);
          const w = rect.width, h = 120;
          const mid = h / 2, amp = h * 0.4;

          pCtx.clearRect(0, 0, w, h);

          // Grid
          pCtx.strokeStyle = '#1a2030'; pCtx.lineWidth = 1;
          pCtx.setLineDash([3, 3]);
          pCtx.beginPath(); pCtx.moveTo(0, mid); pCtx.lineTo(w, mid); pCtx.stroke();
          pCtx.setLineDash([]);

          // Axis labels
          pCtx.fillStyle = '#4a5568'; pCtx.font = '8px sans-serif';
          pCtx.fillText('+1', 2, mid - amp + 10);
          pCtx.fillText('0', 4, mid + 3);
          pCtx.fillText('-1', 2, mid + amp - 2);

          // Waveform with scroll
          const scrollOffset = ((now || 0) / 60) % (w * 0.3);
          pCtx.strokeStyle = '#e67e22'; pCtx.lineWidth = 2; pCtx.beginPath();
          for (let px = 0; px < w; px++) {
            const sampleIdx = Math.floor(((px + scrollOffset) / w) * audioSamples.length) % audioSamples.length;
            const val = audioSamples[sampleIdx];
            const y = mid - val * amp;
            if (px === 0) pCtx.moveTo(px, y); else pCtx.lineTo(px, y);
          }
          pCtx.stroke();

          // Label
          pCtx.fillStyle = '#e67e2280'; pCtx.font = 'bold 9px sans-serif';
          pCtx.fillText(presetObj.name, w - pCtx.measureText(presetObj.name).width - 6, 14);

          presetAnimId = requestAnimationFrame(drawPresetWaveform);
        }
        presetAnimId = requestAnimationFrame(drawPresetWaveform);
      }
    }

    // --- Export: main signal ---
    document.getElementById('sigExportCSV')?.addEventListener('click', () => {
      const mainCanvas = document.getElementById('sigCanvas');
      if (!mainCanvas) return;
      const samples = generateSamplesFromCanvas(mainCanvas);
      const encName = isLine ? sigEncoding : sigModulation;
      exportCSV(samples, `signal_${encName}.csv`);
    });

    document.getElementById('sigExportWAV')?.addEventListener('click', () => {
      const allBits = isLine ? getLabBits(8) : getLabBits(4);
      const sampleRate = 44100;
      const duration = 1.0;
      let audioData;
      if (isLine) {
        audioData = generateLineCodeSamples(allBits, sigEncoding, sampleRate, duration);
      } else {
        // For modulation, generate a simple modulated signal
        const mod = sigModulation;
        const bps = MOD_TYPES[mod]?.bps || 1;
        const symbols = [];
        for (let i = 0; i < allBits.length; i += bps) {
          let val = 0;
          for (let j = 0; j < bps && i + j < allBits.length; j++) val = val * 2 + allBits[i + j];
          symbols.push(val);
        }
        const N = Math.floor(sampleRate * duration);
        audioData = new Float32Array(N);
        const fc = 4000;
        const symLen = N / symbols.length;
        for (let i = 0; i < N; i++) {
          const si = Math.min(Math.floor(i / symLen), symbols.length - 1);
          const v = symbols[si];
          const maxVal = Math.max(Math.pow(2, bps) - 1, 1);
          const t = i / sampleRate;
          if (mod === 'ask') audioData[i] = (v ? 0.8 : 0.1) * Math.sin(2 * Math.PI * fc * t);
          else if (mod === 'fsk') audioData[i] = 0.8 * Math.sin(2 * Math.PI * (v ? fc * 1.5 : fc * 0.6) * t);
          else if (mod === 'bpsk') audioData[i] = 0.8 * Math.sin(2 * Math.PI * fc * t + (v ? 0 : Math.PI));
          else if (mod === 'qpsk') audioData[i] = 0.8 * Math.sin(2 * Math.PI * fc * t + (v % 4) * Math.PI / 2);
          else {
            const norm = v / maxVal;
            const a = 0.2 + norm * 0.8;
            const phase = (v % 4) * Math.PI / 2;
            audioData[i] = a * Math.sin(2 * Math.PI * fc * t + phase);
          }
        }
      }
      const encName = isLine ? sigEncoding : sigModulation;
      exportWAV(audioData, sampleRate, `signal_${encName}.wav`);
    });

    document.getElementById('sigExportJSON')?.addEventListener('click', () => {
      const allBits = isLine ? getLabBits(8) : getLabBits(4);
      const encName = isLine ? sigEncoding : sigModulation;
      const encObj = isLine ? LINE_CODES[sigEncoding] : MOD_TYPES[sigModulation];
      const params = {
        type: isLine ? 'line_code' : 'modulation',
        encoding: encName,
        name: encObj.name,
        description: encObj.desc,
        bits: allBits,
        channel: sigChannel,
        source: labData.type,
        sourceText: labData.text,
        bitsPerSymbol: encObj.bps || 1,
        timestamp: new Date().toISOString()
      };
      exportJSON(params, `signal_${encName}.json`);
    });

    // --- Export: preset signal ---
    if (presetObj) {
      document.getElementById('sigPresetExportCSV')?.addEventListener('click', () => {
        const sampleRate = 44100;
        const duration = 0.5;
        const audioSamples = presetObj.generate(sampleRate, duration);
        const samples = [];
        for (let i = 0; i < audioSamples.length; i++) {
          samples.push({ time: i / sampleRate, amplitude: audioSamples[i] });
        }
        const safeName = presetObj.name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, '_');
        exportCSV(samples, `preset_${safeName}.csv`);
      });

      document.getElementById('sigPresetExportWAV')?.addEventListener('click', () => {
        const sampleRate = 44100;
        const duration = 1.0;
        const audioData = presetObj.generate(sampleRate, duration);
        const safeName = presetObj.name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, '_');
        exportWAV(audioData, sampleRate, `preset_${safeName}.wav`);
      });

      document.getElementById('sigPresetExportJSON')?.addEventListener('click', () => {
        const params = {
          type: 'preset',
          name: presetObj.name,
          category: presetObj.category,
          description: presetObj.description,
          bits: presetObj.bits,
          sampleRate: 44100,
          duration: 1.0,
          timestamp: new Date().toISOString()
        };
        const safeName = presetObj.name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, '_');
        exportJSON(params, `preset_${safeName}.json`);
      });
    }
  }

  const observer = new MutationObserver(() => {
    if (document.getElementById('lab-signals')?.classList.contains('active') && !container.children.length) render();
  });
  observer.observe(document.getElementById('lab-signals'), { attributes: true, attributeFilter: ['class'] });
  setTimeout(() => { if (document.getElementById('lab-signals')?.classList.contains('active')) render(); }, 100);

  onLabDataChange(() => {
    if (document.getElementById('lab-signals')?.classList.contains('active')) render();
  });
}
