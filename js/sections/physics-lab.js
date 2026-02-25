/* ==================== PHYSICS LAB BENCH ==================== */
import { CHANNEL_TYPES } from '../data/channels.js';
import { addXP, showToast } from '../core/gamification.js';
import { SIGNAL_MISSIONS } from '../data/signal-missions.js';
import { PARAM_THEORY, SPECTRUM_EXPLANATIONS } from '../data/signal-theory.js';
import { physicsState } from '../core/router.js';
import { genSamples, applyChannel, drawTimeDomain, drawSpectrum, drawConstellation, drawWaterfall, averageSpectrum, resetAveraging, detectPeaks, resetWaterfall } from './physics-dsp.js';
import { initChannelSimulator, initFileUpload } from './physics-channel.js';

let sgFs = 8000;
let sgN = 512;

let sgComponents = [
  { type: 'sin', freq: 100, amp: 1, phase: 0, dc: 0, duty: 50, carrier: 0, modType: 'none', modDepth: 1 }
];
let sgImportedSamples = null;
let sgSpectrumScale = 60;
let sgSpectrumWindow = 'rect';
let sgShowWaterfall = false;
let sgAvgMode = 'none'; // none, exponential, linear

// Web Audio API playback state
let audioCtx = null;
let audioSource = null;
let isPlaying = false;
let audioVolume = 0.3;
const hasWebAudio = !!(window.AudioContext || window.webkitAudioContext);

function playSignal(samples, sampleRate) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  stopSignal(); // stop previous

  const buffer = audioCtx.createBuffer(1, samples.length, sampleRate);
  buffer.getChannelData(0).set(samples);

  audioSource = audioCtx.createBufferSource();
  audioSource.buffer = buffer;
  audioSource.loop = true;

  const gainNode = audioCtx.createGain();
  gainNode.gain.value = audioVolume;

  audioSource.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  audioSource.start();
  isPlaying = true;

  // Store gainNode reference for live volume control
  audioSource._gainNode = gainNode;
}

function stopSignal() {
  if (audioSource) {
    try { audioSource.stop(); } catch (e) { /* already stopped */ }
    audioSource.disconnect();
    audioSource = null;
  }
  isPlaying = false;
}

// Aliases for physicsState
function getSgChannelId() { return physicsState.channelId; }
function setSgChannelId(v) { physicsState.channelId = v; }
function getSgChDistance() { return physicsState.chDistance; }
function setSgChDistance(v) { physicsState.chDistance = v; }
function getSgNoiseLevel() { return physicsState.noiseLevel; }
function setSgNoiseLevel(v) { physicsState.noiseLevel = v; }

const PARAM_HELP = {
  type: 'Форма базового сигнала. Синус — основа всех сигналов (теорема Фурье). Прямоугольный содержит нечётные гармоники. Шум — случайный.',
  freq: 'Частота базового сигнала в Гц. Определяет высоту тона / скорость изменения. Макс = Fs/2 (Найквист).',
  amp: 'Амплитуда — максимальное отклонение от нуля. Определяет мощность сигнала.',
  phase: 'Начальная фаза в градусах. Сдвигает сигнал по времени. 180° = инверсия.',
  dc: 'Постоянная составляющая (DC offset). Сдвигает сигнал вверх или вниз по оси амплитуды. Видна как пик на 0 Гц в спектре.',
  duty: 'Скважность прямоугольного сигнала. 50% = меандр (равные полупериоды). Влияет на спектральный состав гармоник.',
  carrier: 'Несущая частота для модуляции. 0 = без модуляции (baseband). >0 = сигнал модулирует несущую этой частоты. Разные несущие = FDM.',
  modType: 'AM — меняется амплитуда несущей. FM — меняется частота. PM — меняется фаза. ASK/FSK/BPSK/QPSK/QAM — цифровые модуляции.',
  modDepth: 'AM: глубина 0-1 (1 = 100%). FM: девиация частоты (Гц). PM: индекс модуляции (рад). FSK: частотное расстояние. Больше → шире спектр.',
  noise: 'Аддитивный белый гауссовский шум (AWGN). Присутствует в любом канале — тепловой шум электроники, космическое излучение. Увеличьте, чтобы увидеть шумовую полку на спектре.',
  sampleRate: 'Частота дискретизации (Fs) — сколько отсчётов в секунду. По Найквисту, максимальная частота сигнала = Fs/2. Больше Fs = точнее представление.',
  fftSize: 'Количество точек FFT. Больше точек = выше частотное разрешение (df = Fs/N), но больше вычислений.'
};

const SG_CH_PRESETS = [
  { id: 'none', name: '— Без канала (идеальный) —' },
  ...CHANNEL_TYPES.map(c => ({ id: c.id, name: `${c.icon} ${c.name} (${c.medium === 'copper' ? 'медь' : c.medium === 'fiber' ? 'оптика' : 'радио'})` }))
];

const SG_SIGNAL_PRESETS = [
  { name: '🎵 Тон 440 Гц (нота Ля)', components: [{ type: 'sin', freq: 440, amp: 1, phase: 0, dc: 0, duty: 50, carrier: 0, modType: 'none', modDepth: 1 }] },
  { name: '📻 AM-радио (несущая 1 кГц)', components: [{ type: 'sin', freq: 100, amp: 1, phase: 0, dc: 0, duty: 50, carrier: 1000, modType: 'am', modDepth: 0.8 }] },
  { name: '📡 FM-сигнал (несущая 2 кГц)', components: [{ type: 'sin', freq: 50, amp: 1, phase: 0, dc: 0, duty: 50, carrier: 2000, modType: 'fm', modDepth: 200 }] },
  { name: '🔀 FDM 3 канала', components: [
    { type: 'sin', freq: 50, amp: 0.8, phase: 0, dc: 0, duty: 50, carrier: 500, modType: 'am', modDepth: 0.7 },
    { type: 'sin', freq: 80, amp: 0.6, phase: 0, dc: 0, duty: 50, carrier: 1200, modType: 'am', modDepth: 0.7 },
    { type: 'sin', freq: 30, amp: 0.7, phase: 0, dc: 0, duty: 50, carrier: 2000, modType: 'am', modDepth: 0.7 }
  ]},
  { name: '🎼 Аккорд (3 гармоники)', components: [
    { type: 'sin', freq: 261, amp: 1, phase: 0, dc: 0, duty: 50, carrier: 0, modType: 'none', modDepth: 1 },
    { type: 'sin', freq: 329, amp: 0.8, phase: 0, dc: 0, duty: 50, carrier: 0, modType: 'none', modDepth: 1 },
    { type: 'sin', freq: 392, amp: 0.6, phase: 0, dc: 0, duty: 50, carrier: 0, modType: 'none', modDepth: 1 }
  ]},
  { name: '📊 Прямоугольный импульс', components: [{ type: 'square', freq: 100, amp: 1, phase: 0, dc: 0, duty: 50, carrier: 0, modType: 'none', modDepth: 1 }] },
  { name: '📶 BPSK (цифровая)', components: [{ type: 'sin', freq: 200, amp: 1, phase: 0, dc: 0, duty: 50, carrier: 1500, modType: 'bpsk', modDepth: 1 }] },
  { name: '📶 QPSK (цифровая)', components: [{ type: 'sin', freq: 200, amp: 1, phase: 0, dc: 0, duty: 50, carrier: 1500, modType: 'qpsk', modDepth: 1 }] },
  { name: '📶 QAM-16 (цифровая)', components: [{ type: 'sin', freq: 200, amp: 1, phase: 0, dc: 0, duty: 50, carrier: 1500, modType: 'qam16', modDepth: 1 }] },
  { name: '🔊 Белый шум', components: [{ type: 'noise', freq: 1, amp: 1, phase: 0, dc: 0, duty: 50, carrier: 0, modType: 'none', modDepth: 1 }] },
  { name: '🎀 Розовый шум', components: [{ type: 'pink', freq: 1, amp: 1, phase: 0, dc: 0, duty: 50, carrier: 0, modType: 'none', modDepth: 1 }] }
];

const WAVE_TYPES = {
  sin: 'Синус', cos: 'Косинус', square: 'Прямоугольный',
  sawtooth: 'Пила', triangle: 'Треугольный', noise: 'Белый шум',
  pink: 'Розовый шум', gauss: 'Гауссов шум'
};

const MOD_TYPES = {
  none: 'Нет',
  am: 'AM', fm: 'FM', pm: 'PM',
  ask: 'ASK', fsk: 'FSK', bpsk: 'BPSK', qpsk: 'QPSK', qam16: 'QAM-16'
};

const SAMPLE_RATES = [8000, 22050, 44100, 48000, 96000];
const FFT_SIZES = [256, 512, 1024, 2048, 4096];

function isDigitalMod(modType) {
  return ['ask', 'fsk', 'bpsk', 'qpsk', 'qam16'].includes(modType);
}

function getModDepthLabel(modType) {
  if (modType === 'am') return 'Глубина (0-1)';
  if (modType === 'fm') return 'Девиация (Гц)';
  if (modType === 'pm') return 'Индекс (рад)';
  if (modType === 'fsk') return 'Частотн. расст. (Гц)';
  return 'Глубина';
}

function getModDepthMax(modType) {
  if (modType === 'fm' || modType === 'fsk') return 500;
  return 10;
}

function getModDepthStep(modType) {
  if (modType === 'fm' || modType === 'fsk') return 10;
  return 0.1;
}

function render() {
  // Auto-stop playback when signal parameters change
  if (isPlaying) stopSignal();

  const container = document.getElementById('siggenUI');
  const sgChannelId = getSgChannelId();
  const sgChDistance = getSgChDistance();
  const sgNoiseLevel = getSgNoiseLevel();

  const samples = genSamples(sgComponents, sgImportedSamples, sgFs, sgN);
  const constellationData = samples._constellation || null;

  let matlabCode = `Fs = ${sgFs};\nt = (0:${sgN - 1})/Fs;\n`;
  const parts = [];
  sgComponents.forEach((c, i) => {
    const varName = `s${i + 1}`;
    if (c.type === 'sin') matlabCode += `${varName} = ${c.amp}*sin(2*pi*${c.freq}*t + ${c.phase}*pi/180) + ${c.dc};\n`;
    else if (c.type === 'cos') matlabCode += `${varName} = ${c.amp}*cos(2*pi*${c.freq}*t + ${c.phase}*pi/180) + ${c.dc};\n`;
    else if (c.type === 'square') matlabCode += `${varName} = ${c.amp}*square(2*pi*${c.freq}*t + ${c.phase}*pi/180, ${c.duty || 50}) + ${c.dc};\n`;
    else if (c.type === 'sawtooth') matlabCode += `${varName} = ${c.amp}*sawtooth(2*pi*${c.freq}*t + ${c.phase}*pi/180) + ${c.dc};\n`;
    else if (c.type === 'triangle') matlabCode += `${varName} = ${c.amp}*sawtooth(2*pi*${c.freq}*t + ${c.phase}*pi/180, 0.5) + ${c.dc};\n`;
    else if (c.type === 'pink') matlabCode += `${varName} = ${c.amp}*pinknoise(1, length(t)) + ${c.dc}; % requires DSP System Toolbox\n`;
    else if (c.type === 'gauss') matlabCode += `${varName} = ${c.amp}*randn(1, length(t)) + ${c.dc};\n`;
    else matlabCode += `${varName} = ${c.amp}*randn(1, length(t)) + ${c.dc};\n`;
    parts.push(varName);
  });
  matlabCode += `x = ${parts.join(' + ')};\nplot(t, x); xlabel('Time (s)'); ylabel('Amplitude');\nfigure; plot(Fs/length(x)*(0:length(x)/2-1), abs(fft(x))/length(x)*2); xlabel('Freq (Hz)');`;

  const txSamples = samples;
  for (let i = 0; i < txSamples.length && sgNoiseLevel > 0; i++) {
    txSamples[i] += (Math.random() - 0.5) * 2 * sgNoiseLevel;
  }
  const chResult = applyChannel(txSamples, sgChannelId, sgChDistance, sgFs, sgN);
  const rxSamples = chResult.rx;

  const hasConstellation = constellationData && constellationData.points && constellationData.points.length > 0;

  container.innerHTML = `
    <div class="study-section__title">\u2460 Пресеты сигналов</div>
    <div style="display:flex;gap:4px;overflow-x:auto;margin-bottom:12px;scrollbar-width:none;flex-wrap:wrap">
      ${SG_SIGNAL_PRESETS.map((p, i) => `<button class="lab-tab" data-preset="${i}" style="font-size:.65rem">${p.name}</button>`).join('')}
    </div>

    <div class="study-section__title">\u2461 Генератор сигналов</div>
    <div class="sg-param-grid" style="margin-bottom:10px">
      <div class="sg-param"><label>Частота дискретизации <span class="sg-help" data-help="sampleRate">?</span></label><select id="sgSampleRateSel">${SAMPLE_RATES.map(r => `<option value="${r}"${r === sgFs ? ' selected' : ''}>${r >= 1000 ? (r / 1000) + ' кГц' : r + ' Гц'}</option>`).join('')}</select></div>
      <div class="sg-param"><label>Размер FFT <span class="sg-help" data-help="fftSize">?</span></label><select id="sgFFTSizeSel">${FFT_SIZES.map(n => `<option value="${n}"${n === sgN ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
    </div>
    ${sgComponents.map((c, i) => `
      <div class="sg-component">
        <div class="sg-component__header">
          <span class="sg-component__title">#${i + 1}${c.carrier > 0 ? ` \u2192 ${isDigitalMod(c.modType) ? MOD_TYPES[c.modType] : c.modType === 'am' ? 'AM' : c.modType === 'fm' ? 'FM' : c.modType === 'pm' ? 'PM' : 'DSB'} \u043D\u0435\u0441\u0443\u0449\u0430\u044F ${c.carrier} \u0413\u0446` : `: ${WAVE_TYPES[c.type]} ${c.freq} \u0413\u0446`}</span>
          ${sgComponents.length > 1 ? `<button class="sg-component__remove" data-rm="${i}">\u2715</button>` : ''}
        </div>
        <div class="sg-param-grid">
          <div class="sg-param"><label>Форма <span class="sg-help" data-help="type">?</span></label><select data-ci="${i}" data-p="type">${Object.entries(WAVE_TYPES).map(([k, v]) => `<option value="${k}"${k === c.type ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="sg-param"><label>${isDigitalMod(c.modType) ? 'Символьная скорость (Бод)' : 'Частота (Гц)'} <span class="sg-help" data-help="freq">?</span></label><input type="number" data-ci="${i}" data-p="freq" value="${c.freq}" min="1" max="${sgFs / 2}" step="10"></div>
          <div class="sg-param"><label>Амплитуда <span class="sg-help" data-help="amp">?</span></label><input type="number" data-ci="${i}" data-p="amp" value="${c.amp}" min="0" max="10" step="0.1"></div>
          <div class="sg-param"><label>Фаза (\u00B0) <span class="sg-help" data-help="phase">?</span></label><input type="number" data-ci="${i}" data-p="phase" value="${c.phase}" min="0" max="360" step="15"></div>
          <div class="sg-param"><label>DC смещение (В) <span class="sg-help" data-help="dc">?</span></label><input type="number" data-ci="${i}" data-p="dc" value="${c.dc}" min="-5" max="5" step="0.01"></div>
          ${c.type === 'square' ? `<div class="sg-param"><label>Скважность (%) <span class="sg-help" data-help="duty">?</span></label><input type="number" data-ci="${i}" data-p="duty" value="${c.duty != null ? c.duty : 50}" min="1" max="99" step="1"></div>` : ''}
          <div class="sg-param"><label>Несущая (Гц) <span class="sg-help" data-help="carrier">?</span></label><input type="number" data-ci="${i}" data-p="carrier" value="${c.carrier || 0}" min="0" max="${sgFs / 2}" step="50"></div>
          <div class="sg-param"><label>Модуляция <span class="sg-help" data-help="modType">?</span></label><select data-ci="${i}" data-p="modType">${Object.entries(MOD_TYPES).map(([k, v]) => `<option value="${k}"${k === c.modType ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
          ${c.modType !== 'none' && !isDigitalMod(c.modType) ? `<div class="sg-param" style="grid-column:span 2"><label>${getModDepthLabel(c.modType)} <span class="sg-help" data-help="modDepth">?</span></label><input type="number" data-ci="${i}" data-p="modDepth" value="${c.modDepth}" min="0" max="${getModDepthMax(c.modType)}" step="${getModDepthStep(c.modType)}"></div>` : ''}
          ${c.modType === 'fsk' ? `<div class="sg-param" style="grid-column:span 2"><label>${getModDepthLabel(c.modType)} <span class="sg-help" data-help="modDepth">?</span></label><input type="number" data-ci="${i}" data-p="modDepth" value="${c.modDepth}" min="0" max="${getModDepthMax(c.modType)}" step="${getModDepthStep(c.modType)}"></div>` : ''}
        </div>
      </div>
    `).join('')}
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <button class="dnd-btn" id="sgAddComp" style="flex:1;padding:8px;font-size:.72rem"${sgComponents.length >= 4 ? ' disabled' : ''}>+ Компонента</button>
      <button class="dnd-btn" id="sgAddFDM" style="flex:1;padding:8px;font-size:.72rem"${sgComponents.length >= 4 ? ' disabled' : ''}>+ FDM канал</button>
    </div>
    <div id="sgHelpBox" style="display:none;font-size:.72rem;color:var(--text-secondary);padding:8px;background:var(--bg-surface);border-radius:6px;margin-bottom:8px;border-left:3px solid var(--accent)"></div>

    <div class="study-section__title">\u2462 Генератор помех (AWGN)</div>
    <div class="sg-param-grid" style="margin-bottom:10px">
      <div class="sg-param"><label>Уровень шума <span class="sg-help" data-help="noise">?</span></label><input type="range" id="sgNoiseSlider" min="0" max="2" step="0.05" value="${sgNoiseLevel}"></div>
      <div class="sg-param"><label>Шум: ${sgNoiseLevel.toFixed(2)}</label><div style="font-size:.65rem;color:var(--text-secondary)">${sgNoiseLevel === 0 ? 'Без шума' : sgNoiseLevel < 0.3 ? 'Слабый' : sgNoiseLevel < 0.8 ? 'Умеренный' : 'Сильный'}</div></div>
    </div>

    ${hasWebAudio ? `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
      <button class="dnd-btn" id="sgPlayBtn" style="padding:8px 14px;font-size:.72rem">${isPlaying ? '\u23F9 Остановить' : '\uD83D\uDD0A Воспроизвести'}</button>
      <label style="font-size:.68rem;color:var(--text-secondary);display:flex;align-items:center;gap:4px">Громкость <input type="range" id="sgVolumeSlider" min="0" max="100" step="1" value="${Math.round(audioVolume * 100)}" style="width:80px"> <span id="sgVolumeLabel">${Math.round(audioVolume * 100)}%</span></label>
    </div>` : ''}

    <div class="study-section__title">\u2463 Передатчик (TX) — осциллограмма</div>
    <div class="sg-canvas-wrap">
      <canvas id="sgTimeDomain"></canvas>
      <div class="sg-canvas-label"><span>Время \u2192</span><span>Fs = ${sgFs >= 1000 ? (sgFs / 1000) + ' кГц' : sgFs + ' Гц'}, N = ${sgN}</span></div>
    </div>
    <div ${hasConstellation ? 'style="display:flex;gap:8px;align-items:stretch"' : ''}>
      <div class="sg-canvas-wrap" style="${hasConstellation ? 'flex:1;min-width:0' : ''}">
        <canvas id="sgSpectrum"></canvas>
        <div class="sg-canvas-label"><span>0 Гц</span><span>\uD83D\uDCCA Анализатор спектра TX (FFT ${sgN} точек, 0..${sgFs/2} Гц, шкала ${sgSpectrumScale} дБ)</span><span>${sgFs/2} Гц</span></div>
      </div>
      ${hasConstellation ? `
      <div class="sg-canvas-wrap" style="flex:0 0 160px">
        <canvas id="sgConstellation"></canvas>
        <div class="sg-canvas-label" style="justify-content:center"><span>\u2B50 Диаграмма созвездия</span></div>
      </div>` : ''}
    </div>
    <div class="sg-param-grid" style="margin-bottom:10px">
      <div class="sg-param"><label>Шкала спектра (дБ)</label><input type="range" id="sgScaleSlider" min="20" max="100" step="10" value="${sgSpectrumScale}"></div>
      <div class="sg-param"><label>Окно FFT</label><select id="sgWindowSel"><option value="rect"${sgSpectrumWindow==='rect'?' selected':''}>Прямоугольное</option><option value="hann"${sgSpectrumWindow==='hann'?' selected':''}>Ханна</option><option value="hamming"${sgSpectrumWindow==='hamming'?' selected':''}>Хэмминга</option></select></div>
    </div>

    <div class="study-section__title" style="margin-top:16px">\u2464 Канал связи</div>
    <div class="sg-param-grid" style="margin-bottom:8px">
      <div class="sg-param"><label>Тип канала <span class="sg-help" data-help="carrier">?</span></label><select id="sgChannelSel">${SG_CH_PRESETS.map(p => `<option value="${p.id}"${p.id === sgChannelId ? ' selected' : ''}>${p.name}</option>`).join('')}</select></div>
      <div class="sg-param"><label>Расстояние</label><input type="number" id="sgChDist" value="${sgChDistance}" min="1" max="100000" step="10"></div>
    </div>
    ${sgChannelId !== 'none' ? (() => {
      const r = applyChannel(samples, sgChannelId, sgChDistance, sgFs, sgN);
      const quality = r.snr > 30 ? '\uD83D\uDFE2 Отличное' : r.snr > 20 ? '\uD83D\uDFE1 Хорошее' : r.snr > 10 ? '\uD83D\uDFE0 Среднее' : r.snr > 0 ? '\uD83D\uDD34 Плохое' : '\u26AB Нет связи';
      return `<div class="card" style="font-size:.72rem;line-height:1.7;padding:10px">
        <strong>${r.ch?.icon} ${r.ch?.name}</strong> — ${r.ch?.medium === 'copper' ? 'медный кабель' : r.ch?.medium === 'fiber' ? 'оптоволокно' : 'радиоканал'}<br>
        <strong>Затухание:</strong> ${r.atten.toFixed(1)} дБ (сигнал ослаблен в ${Math.pow(10, r.atten/20).toFixed(1)} раз)<br>
        <strong>SNR:</strong> ${r.snr.toFixed(1)} дБ — ${quality}<br>
        <strong>Полоса:</strong> ${r.bw >= 1e6 ? (r.bw/1e6).toFixed(0) + ' МГц' : (r.bw/1e3).toFixed(0) + ' кГц'} (частоты выше обрезаются)<br>
        <strong>Шум:</strong> AWGN (аддитивный белый гауссов шум) — тепловой шум электроники + внешние помехи<br>
        <strong>Помехи:</strong> ${r.ch?.interference === 'high' ? '\u26A0 Высокие' : r.ch?.interference === 'medium' ? '~ Средние' : r.ch?.interference === 'none' ? '\u2713 Нет' : '\u2713 Низкие'}
      </div>`;
    })() : '<div style="font-size:.72rem;color:var(--text-secondary);margin-bottom:8px">Выберите канал — увидите как он искажает сигнал. Спектр RX покажет шумовую полку (AWGN) и ограничение полосы.</div>'}

    <div class="study-section__title">\u2465 Приёмник (RX) — осциллограмма</div>
    <div class="sg-canvas-wrap">
      <canvas id="sgRxTime"></canvas>
      <div class="sg-canvas-label"><span>Время \u2192</span><span>Принятый сигнал</span></div>
    </div>
    <div class="sg-canvas-wrap">
      <canvas id="sgRxSpectrum"></canvas>
      <div class="sg-canvas-label"><span>0 Гц</span><span>\uD83D\uDCCA Анализатор спектра RX</span><span>${sgFs/2} Гц</span></div>
    </div>

    <div class="study-section__title" style="margin-top:16px">\u2466 Расширенный анализ</div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
      <label style="font-size:.72rem;font-weight:600">Усреднение:</label>
      <select id="sgAvgMode" style="padding:5px 8px;border-radius:4px;border:1px solid var(--border);background:var(--bg-surface);color:var(--text);font-size:.72rem">
        <option value="none"${sgAvgMode==='none'?' selected':''}>Нет</option>
        <option value="exponential"${sgAvgMode==='exponential'?' selected':''}>Экспоненциальное</option>
        <option value="linear"${sgAvgMode==='linear'?' selected':''}>Линейное</option>
      </select>
      <button class="dnd-btn" id="sgToggleWaterfall" style="padding:6px 12px;font-size:.72rem">${sgShowWaterfall ? '\uD83C\uDF0A Скрыть Waterfall' : '\uD83C\uDF0A Waterfall'}</button>
    </div>
    ${sgShowWaterfall ? `
    <div class="sg-canvas-wrap">
      <canvas id="sgWaterfall"></canvas>
      <div class="sg-canvas-label"><span>0 Гц</span><span>\uD83C\uDF0A Waterfall (спектрограмма)</span><span>${sgFs/2} Гц</span></div>
    </div>
    ` : ''}

    <div class="study-section__title" style="margin-top:16px">MATLAB / Octave код</div>
    <div class="sg-formula">${matlabCode}</div>
    <div class="sg-export-btns">
      <button id="sgExportCSV">\uD83D\uDCC4 TX CSV</button>
      <button id="sgExportRxCSV">\uD83D\uDCC4 RX CSV</button>
      <button id="sgExportJSON">\uD83D\uDCCB JSON</button>
      <button id="sgCopyMatlab">\uD83D\uDCCB MATLAB</button>
      <button id="sgImportCSV">\uD83D\uDCC2 Импорт CSV</button>
    </div>
    <input type="file" id="sgImportFileInput" hidden accept=".csv,.txt">

    <div id="sgMissionsPanel" style="margin-top:16px"></div>
  `;

  // Render missions panel
  renderMissionsPanel();

  drawTimeDomain(document.getElementById('sgTimeDomain'), txSamples);
  drawSpectrum(document.getElementById('sgSpectrum'), txSamples, sgFs, sgN, sgSpectrumScale, sgSpectrumWindow);
  drawTimeDomain(document.getElementById('sgRxTime'), rxSamples);
  drawSpectrum(document.getElementById('sgRxSpectrum'), rxSamples, sgFs, sgN, sgSpectrumScale, sgSpectrumWindow);

  // Draw constellation diagram if available
  if (hasConstellation) {
    drawConstellation(document.getElementById('sgConstellation'), constellationData);
  }

  // Draw waterfall display
  if (sgShowWaterfall) {
    const wfCanvas = document.getElementById('sgWaterfall');
    if (wfCanvas) drawWaterfall(wfCanvas, txSamples, sgFs, sgN, sgSpectrumWindow);
  }

  // Waterfall toggle
  document.getElementById('sgToggleWaterfall')?.addEventListener('click', () => {
    sgShowWaterfall = !sgShowWaterfall;
    if (!sgShowWaterfall) resetWaterfall();
    render();
  });

  // Averaging mode
  document.getElementById('sgAvgMode')?.addEventListener('change', (e) => {
    sgAvgMode = e.target.value;
    if (sgAvgMode === 'none') resetAveraging();
    render();
  });

  // JSON export
  document.getElementById('sgExportJSON')?.addEventListener('click', () => {
    const jsonData = {
      type: 'signal_generator',
      sampleRate: sgFs,
      fftSize: sgN,
      components: sgComponents.map(c => ({ ...c })),
      spectrumScale: sgSpectrumScale,
      spectrumWindow: sgSpectrumWindow,
      channelId: getSgChannelId(),
      channelDistance: getSgChDistance(),
      noiseLevel: getSgNoiseLevel(),
      txSamples: Array.from(txSamples.slice(0, 256)),
      rxSamples: Array.from(rxSamples.slice(0, 256)),
      timestamp: new Date().toISOString()
    };
    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'signal_data.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  // Preset buttons
  container.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = SG_SIGNAL_PRESETS[parseInt(btn.dataset.preset)];
      sgComponents = JSON.parse(JSON.stringify(preset.components));
      sgImportedSamples = null;
      render();
    });
  });

  container.querySelectorAll('[data-ci]').forEach(el => {
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
      const ci = parseInt(el.dataset.ci);
      const p = el.dataset.p;
      sgComponents[ci][p] = el.tagName === 'SELECT' ? el.value : parseFloat(el.value) || 0;
      // Initialize duty to 50 if switching to square
      if (p === 'type' && el.value === 'square' && sgComponents[ci].duty == null) {
        sgComponents[ci].duty = 50;
      }
      render();
    });
  });

  container.querySelectorAll('[data-rm]').forEach(btn => {
    btn.addEventListener('click', () => { sgComponents.splice(parseInt(btn.dataset.rm), 1); render(); });
  });

  document.getElementById('sgAddComp')?.addEventListener('click', () => {
    if (sgComponents.length < 4) { sgComponents.push({ type: 'sin', freq: 200 * (sgComponents.length + 1), amp: 0.5, phase: 0, dc: 0, duty: 50, carrier: 0, modType: 'none', modDepth: 1 }); render(); }
  });

  document.getElementById('sgAddFDM')?.addEventListener('click', () => {
    if (sgComponents.length < 4) {
      const carriers = [500, 1000, 1500, 2000];
      sgComponents.push({ type: 'sin', freq: 50, amp: 0.8, phase: 0, dc: 0, duty: 50, carrier: carriers[sgComponents.length] || 2500, modType: 'am', modDepth: 0.8 });
      render();
    }
  });

  container.querySelectorAll('.sg-help').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const box = document.getElementById('sgHelpBox');
      const key = btn.dataset.help;
      box.textContent = PARAM_HELP[key] || '';
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });
  });

  document.getElementById('sgNoiseSlider')?.addEventListener('input', (e) => { setSgNoiseLevel(parseFloat(e.target.value)); render(); });
  document.getElementById('sgScaleSlider')?.addEventListener('input', (e) => { sgSpectrumScale = parseInt(e.target.value); render(); });
  document.getElementById('sgWindowSel')?.addEventListener('change', (e) => { sgSpectrumWindow = e.target.value; render(); });
  document.getElementById('sgChannelSel')?.addEventListener('change', (e) => { setSgChannelId(e.target.value); render(); });
  document.getElementById('sgChDist')?.addEventListener('input', (e) => { setSgChDistance(parseInt(e.target.value) || 50); render(); });

  // Web Audio playback controls
  document.getElementById('sgPlayBtn')?.addEventListener('click', () => {
    if (isPlaying) {
      stopSignal();
    } else {
      playSignal(txSamples, sgFs);
    }
    // Update button text without full re-render (to keep audio playing)
    const btn = document.getElementById('sgPlayBtn');
    if (btn) btn.textContent = isPlaying ? '\u23F9 Остановить' : '\uD83D\uDD0A Воспроизвести';
  });

  document.getElementById('sgVolumeSlider')?.addEventListener('input', (e) => {
    audioVolume = parseInt(e.target.value) / 100;
    const label = document.getElementById('sgVolumeLabel');
    if (label) label.textContent = `${Math.round(audioVolume * 100)}%`;
    // Live volume update if playing
    if (isPlaying && audioSource && audioSource._gainNode) {
      audioSource._gainNode.gain.value = audioVolume;
    }
  });

  // Sample rate selector
  document.getElementById('sgSampleRateSel')?.addEventListener('change', (e) => {
    sgFs = parseInt(e.target.value);
    render();
  });

  // FFT size selector
  document.getElementById('sgFFTSizeSel')?.addEventListener('change', (e) => {
    sgN = parseInt(e.target.value);
    render();
  });

  document.getElementById('sgExportCSV')?.addEventListener('click', () => {
    let csv = 'time,tx_amplitude\n';
    for (let i = 0; i < sgN; i++) csv += `${(i / sgFs).toFixed(6)},${txSamples[i].toFixed(6)}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'signal_tx.csv'; a.click();
    addXP(3);
  });

  document.getElementById('sgExportRxCSV')?.addEventListener('click', () => {
    let csv = 'time,rx_amplitude\n';
    for (let i = 0; i < sgN; i++) csv += `${(i / sgFs).toFixed(6)},${rxSamples[i].toFixed(6)}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'signal_rx.csv'; a.click();
  });

  document.getElementById('sgCopyMatlab')?.addEventListener('click', () => {
    navigator.clipboard.writeText(matlabCode).then(() => { showToast('\uD83D\uDCCB', 'MATLAB код скопирован', ''); });
  });

  document.getElementById('sgImportCSV')?.addEventListener('click', () => document.getElementById('sgImportFileInput').click());
  document.getElementById('sgImportFileInput')?.addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = reader.result.split('\n').filter(l => l.trim());
      const hasHeader = isNaN(parseFloat(lines[0].split(',')[0]));
      const data = (hasHeader ? lines.slice(1) : lines).map(l => {
        const cols = l.split(/[,\t;]/);
        return parseFloat(cols[cols.length > 1 ? 1 : 0]) || 0;
      }).slice(0, sgN);
      if (data.length < 4) { showToast('\u26A0\uFE0F', 'Файл слишком мал', ''); return; }
      const imported = new Float64Array(sgN);
      for (let i = 0; i < sgN; i++) imported[i] = data[i % data.length] || 0;
      sgComponents = [];
      sgImportedSamples = imported;
      showToast('\uD83D\uDCC2', `Импортировано ${data.length} отсчётов`, '+3 XP');
      addXP(3);
      render();
    };
    reader.readAsText(file);
  });
}

/* ==================== SIGNAL MISSIONS ==================== */
let missionResults = {}; // missionId → 'pass' | 'fail'

function renderMissionsPanel() {
  const el = document.getElementById('sgMissionsPanel');
  if (!el) return;
  el.innerHTML = `
    <details class="sg-missions-details">
      <summary class="sg-missions-summary">🎯 Задания-миссии (${Object.values(missionResults).filter(r => r === 'pass').length}/${SIGNAL_MISSIONS.length} выполнено)</summary>
      <div class="sg-missions-list">
        ${SIGNAL_MISSIONS.map(m => {
          const result = missionResults[m.id];
          return `
            <div class="sg-mission ${result === 'pass' ? 'sg-mission--pass' : result === 'fail' ? 'sg-mission--fail' : ''}">
              <div class="sg-mission__header">
                <span class="sg-mission__status">${result === 'pass' ? '✅' : result === 'fail' ? '❌' : '⬜'}</span>
                <span class="sg-mission__title">${m.title}</span>
                <span class="sg-mission__xp">+${m.xp} XP</span>
              </div>
              <div class="sg-mission__desc">${m.desc}</div>
              ${result === 'pass' ? `<div class="sg-mission__insight">💡 ${m.insight}</div>` : ''}
              ${!result ? `<button class="sg-mission__btn" data-mission="${m.id}">▶ Проверить</button>` : ''}
              ${result === 'fail' ? `
                <div class="sg-mission__hint">${m.hint}</div>
                <button class="sg-mission__btn" data-mission="${m.id}">🔄 Попробовать снова</button>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </details>
  `;

  el.querySelectorAll('.sg-mission__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mid = btn.dataset.mission;
      const mission = SIGNAL_MISSIONS.find(m => m.id === mid);
      if (!mission) return;
      const pass = mission.validate(sgComponents);
      missionResults[mid] = pass ? 'pass' : 'fail';
      if (pass) {
        addXP(mission.xp);
        showToast('🎯', `Миссия «${mission.title}» выполнена!`, `+${mission.xp} XP`);
      } else {
        showToast('❌', `Миссия не пройдена`, mission.hint.slice(0, 40) + '…');
      }
      renderMissionsPanel();
    });
  });
}

export function initPhysicsLab() {
  const container = document.getElementById('siggenUI');

  const obs = new MutationObserver(() => {
    if (document.getElementById('section-siggen')?.classList.contains('active') && !container.children.length) render();
  });
  obs.observe(document.getElementById('section-siggen'), { attributes: true, attributeFilter: ['class'] });
  setTimeout(() => { if (document.getElementById('section-siggen')?.classList.contains('active')) render(); }, 200);

  initChannelSimulator();
  initFileUpload();
}
