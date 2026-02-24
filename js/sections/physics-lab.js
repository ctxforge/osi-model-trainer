/* ==================== PHYSICS LAB BENCH ==================== */
import { CHANNEL_TYPES } from '../data/channels.js';
import { addXP, showToast } from '../core/gamification.js';
import { physicsState } from '../core/router.js';
import { genSamples, applyChannel, drawTimeDomain, drawSpectrum } from './physics-dsp.js';
import { initChannelSimulator, initFileUpload } from './physics-channel.js';

const sgFs = 8000;
const sgN = 512;

let sgComponents = [
  { type: 'sin', freq: 100, amp: 1, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }
];
let sgImportedSamples = null;
let sgSpectrumScale = 60;
let sgSpectrumWindow = 'rect';

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
  carrier: 'Несущая частота для модуляции. 0 = без модуляции (baseband). >0 = сигнал модулирует несущую этой частоты. Разные несущие = FDM.',
  modType: 'AM — меняется амплитуда несущей. FM — меняется частота. PM — меняется фаза. На спектре видны боковые полосы.',
  modDepth: 'AM: глубина 0-1 (1 = 100%). FM: девиация частоты (Гц). PM: индекс модуляции (рад). Больше → шире спектр.',
  noise: 'Аддитивный белый гауссовский шум (AWGN). Присутствует в любом канале — тепловой шум электроники, космическое излучение. Увеличьте, чтобы увидеть шумовую полку на спектре.'
};

const SG_CH_PRESETS = [
  { id: 'none', name: '— Без канала (идеальный) —' },
  ...CHANNEL_TYPES.map(c => ({ id: c.id, name: `${c.icon} ${c.name} (${c.medium === 'copper' ? 'медь' : c.medium === 'fiber' ? 'оптика' : 'радио'})` }))
];

const SG_SIGNAL_PRESETS = [
  { name: '🎵 Тон 440 Гц (нота Ля)', components: [{ type: 'sin', freq: 440, amp: 1, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }] },
  { name: '📻 AM-радио (несущая 1 кГц)', components: [{ type: 'sin', freq: 100, amp: 1, phase: 0, dc: 0, carrier: 1000, modType: 'am', modDepth: 0.8 }] },
  { name: '📡 FM-сигнал (несущая 2 кГц)', components: [{ type: 'sin', freq: 50, amp: 1, phase: 0, dc: 0, carrier: 2000, modType: 'fm', modDepth: 200 }] },
  { name: '🔀 FDM 3 канала', components: [
    { type: 'sin', freq: 50, amp: 0.8, phase: 0, dc: 0, carrier: 500, modType: 'am', modDepth: 0.7 },
    { type: 'sin', freq: 80, amp: 0.6, phase: 0, dc: 0, carrier: 1200, modType: 'am', modDepth: 0.7 },
    { type: 'sin', freq: 30, amp: 0.7, phase: 0, dc: 0, carrier: 2000, modType: 'am', modDepth: 0.7 }
  ]},
  { name: '🎼 Аккорд (3 гармоники)', components: [
    { type: 'sin', freq: 261, amp: 1, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 },
    { type: 'sin', freq: 329, amp: 0.8, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 },
    { type: 'sin', freq: 392, amp: 0.6, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }
  ]},
  { name: '📊 Прямоугольный импульс', components: [{ type: 'square', freq: 100, amp: 1, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }] },
  { name: '📶 Цифровая модуляция (PSK)', components: [{ type: 'square', freq: 100, amp: 1, phase: 0, dc: 0, carrier: 1500, modType: 'pm', modDepth: 3.14 }] },
  { name: '🔊 Белый шум', components: [{ type: 'noise', freq: 1, amp: 1, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }] }
];

const WAVE_TYPES = {
  sin: 'Синус', cos: 'Косинус', square: 'Прямоугольный',
  sawtooth: 'Пила', triangle: 'Треугольный', noise: 'Белый шум'
};

function render() {
  const container = document.getElementById('siggenUI');
  const sgChannelId = getSgChannelId();
  const sgChDistance = getSgChDistance();
  const sgNoiseLevel = getSgNoiseLevel();

  const samples = genSamples(sgComponents, sgImportedSamples, sgFs, sgN);
  let matlabCode = `Fs = ${sgFs};\nt = (0:${sgN - 1})/Fs;\n`;
  const parts = [];
  sgComponents.forEach((c, i) => {
    const varName = `s${i + 1}`;
    if (c.type === 'sin') matlabCode += `${varName} = ${c.amp}*sin(2*pi*${c.freq}*t + ${c.phase}*pi/180) + ${c.dc};\n`;
    else if (c.type === 'cos') matlabCode += `${varName} = ${c.amp}*cos(2*pi*${c.freq}*t + ${c.phase}*pi/180) + ${c.dc};\n`;
    else if (c.type === 'square') matlabCode += `${varName} = ${c.amp}*square(2*pi*${c.freq}*t + ${c.phase}*pi/180) + ${c.dc};\n`;
    else if (c.type === 'sawtooth') matlabCode += `${varName} = ${c.amp}*sawtooth(2*pi*${c.freq}*t + ${c.phase}*pi/180) + ${c.dc};\n`;
    else if (c.type === 'triangle') matlabCode += `${varName} = ${c.amp}*sawtooth(2*pi*${c.freq}*t + ${c.phase}*pi/180, 0.5) + ${c.dc};\n`;
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

  container.innerHTML = `
    <div class="study-section__title">① Пресеты сигналов</div>
    <div style="display:flex;gap:4px;overflow-x:auto;margin-bottom:12px;scrollbar-width:none">
      ${SG_SIGNAL_PRESETS.map((p, i) => `<button class="lab-tab" data-preset="${i}" style="font-size:.65rem">${p.name}</button>`).join('')}
    </div>

    <div class="study-section__title">② Генератор сигналов</div>
    ${sgComponents.map((c, i) => `
      <div class="sg-component">
        <div class="sg-component__header">
          <span class="sg-component__title">#${i + 1}${c.carrier > 0 ? ` → несущая ${c.carrier} Гц (${c.modType === 'am' ? 'AM' : c.modType === 'fm' ? 'FM' : c.modType === 'pm' ? 'PM' : 'DSB'})` : `: ${WAVE_TYPES[c.type]} ${c.freq} Гц`}</span>
          ${sgComponents.length > 1 ? `<button class="sg-component__remove" data-rm="${i}">✕</button>` : ''}
        </div>
        <div class="sg-param-grid">
          <div class="sg-param"><label>Форма <span class="sg-help" data-help="type">?</span></label><select data-ci="${i}" data-p="type">${Object.entries(WAVE_TYPES).map(([k, v]) => `<option value="${k}"${k === c.type ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="sg-param"><label>Частота (Гц) <span class="sg-help" data-help="freq">?</span></label><input type="number" data-ci="${i}" data-p="freq" value="${c.freq}" min="1" max="3900" step="10"></div>
          <div class="sg-param"><label>Амплитуда <span class="sg-help" data-help="amp">?</span></label><input type="number" data-ci="${i}" data-p="amp" value="${c.amp}" min="0" max="10" step="0.1"></div>
          <div class="sg-param"><label>Фаза (°) <span class="sg-help" data-help="phase">?</span></label><input type="number" data-ci="${i}" data-p="phase" value="${c.phase}" min="0" max="360" step="15"></div>
          <div class="sg-param"><label>Несущая (Гц) <span class="sg-help" data-help="carrier">?</span></label><input type="number" data-ci="${i}" data-p="carrier" value="${c.carrier || 0}" min="0" max="3900" step="50"></div>
          <div class="sg-param"><label>Модуляция <span class="sg-help" data-help="modType">?</span></label><select data-ci="${i}" data-p="modType"><option value="none"${c.modType === 'none' ? ' selected' : ''}>Нет</option><option value="am"${c.modType === 'am' ? ' selected' : ''}>AM</option><option value="fm"${c.modType === 'fm' ? ' selected' : ''}>FM</option><option value="pm"${c.modType === 'pm' ? ' selected' : ''}>PM</option></select></div>
          ${c.modType !== 'none' ? `<div class="sg-param" style="grid-column:span 2"><label>${c.modType === 'am' ? 'Глубина (0-1)' : c.modType === 'fm' ? 'Девиация (Гц)' : 'Индекс (рад)'} <span class="sg-help" data-help="modDepth">?</span></label><input type="number" data-ci="${i}" data-p="modDepth" value="${c.modDepth}" min="0" max="${c.modType === 'fm' ? 500 : 10}" step="${c.modType === 'fm' ? 10 : 0.1}"></div>` : ''}
        </div>
      </div>
    `).join('')}
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <button class="dnd-btn" id="sgAddComp" style="flex:1;padding:8px;font-size:.72rem"${sgComponents.length >= 4 ? ' disabled' : ''}>+ Компонента</button>
      <button class="dnd-btn" id="sgAddFDM" style="flex:1;padding:8px;font-size:.72rem"${sgComponents.length >= 4 ? ' disabled' : ''}>+ FDM канал</button>
    </div>
    <div id="sgHelpBox" style="display:none;font-size:.72rem;color:var(--text-secondary);padding:8px;background:var(--bg-surface);border-radius:6px;margin-bottom:8px;border-left:3px solid var(--accent)"></div>

    <div class="study-section__title">③ Генератор помех (AWGN)</div>
    <div class="sg-param-grid" style="margin-bottom:10px">
      <div class="sg-param"><label>Уровень шума <span class="sg-help" data-help="noise">?</span></label><input type="range" id="sgNoiseSlider" min="0" max="2" step="0.05" value="${sgNoiseLevel}"></div>
      <div class="sg-param"><label>Шум: ${sgNoiseLevel.toFixed(2)}</label><div style="font-size:.65rem;color:var(--text-secondary)">${sgNoiseLevel === 0 ? 'Без шума' : sgNoiseLevel < 0.3 ? 'Слабый' : sgNoiseLevel < 0.8 ? 'Умеренный' : 'Сильный'}</div></div>
    </div>

    <div class="study-section__title">④ Передатчик (TX) — осциллограмма</div>
    <div class="sg-canvas-wrap">
      <canvas id="sgTimeDomain"></canvas>
      <div class="sg-canvas-label"><span>Время →</span><span>Fs = ${sgFs} Гц, N = ${sgN}</span></div>
    </div>
    <div class="sg-canvas-wrap">
      <canvas id="sgSpectrum"></canvas>
      <div class="sg-canvas-label"><span>0 Гц</span><span>📊 Анализатор спектра TX (FFT ${sgN} точек, 0..${sgFs/2} Гц, шкала ${sgSpectrumScale} дБ)</span><span>${sgFs/2} Гц</span></div>
    </div>
    <div class="sg-param-grid" style="margin-bottom:10px">
      <div class="sg-param"><label>Шкала спектра (дБ)</label><input type="range" id="sgScaleSlider" min="20" max="100" step="10" value="${sgSpectrumScale}"></div>
      <div class="sg-param"><label>Окно FFT</label><select id="sgWindowSel"><option value="rect"${sgSpectrumWindow==='rect'?' selected':''}>Прямоугольное</option><option value="hann"${sgSpectrumWindow==='hann'?' selected':''}>Ханна</option><option value="hamming"${sgSpectrumWindow==='hamming'?' selected':''}>Хэмминга</option></select></div>
    </div>

    <div class="study-section__title" style="margin-top:16px">⑤ Канал связи</div>
    <div class="sg-param-grid" style="margin-bottom:8px">
      <div class="sg-param"><label>Тип канала <span class="sg-help" data-help="carrier">?</span></label><select id="sgChannelSel">${SG_CH_PRESETS.map(p => `<option value="${p.id}"${p.id === sgChannelId ? ' selected' : ''}>${p.name}</option>`).join('')}</select></div>
      <div class="sg-param"><label>Расстояние</label><input type="number" id="sgChDist" value="${sgChDistance}" min="1" max="100000" step="10"></div>
    </div>
    ${sgChannelId !== 'none' ? (() => {
      const r = applyChannel(samples, sgChannelId, sgChDistance, sgFs, sgN);
      const quality = r.snr > 30 ? '🟢 Отличное' : r.snr > 20 ? '🟡 Хорошее' : r.snr > 10 ? '🟠 Среднее' : r.snr > 0 ? '🔴 Плохое' : '⚫ Нет связи';
      return `<div class="card" style="font-size:.72rem;line-height:1.7;padding:10px">
        <strong>${r.ch?.icon} ${r.ch?.name}</strong> — ${r.ch?.medium === 'copper' ? 'медный кабель' : r.ch?.medium === 'fiber' ? 'оптоволокно' : 'радиоканал'}<br>
        <strong>Затухание:</strong> ${r.atten.toFixed(1)} дБ (сигнал ослаблен в ${Math.pow(10, r.atten/20).toFixed(1)} раз)<br>
        <strong>SNR:</strong> ${r.snr.toFixed(1)} дБ — ${quality}<br>
        <strong>Полоса:</strong> ${r.bw >= 1e6 ? (r.bw/1e6).toFixed(0) + ' МГц' : (r.bw/1e3).toFixed(0) + ' кГц'} (частоты выше обрезаются)<br>
        <strong>Шум:</strong> AWGN (аддитивный белый гауссов шум) — тепловой шум электроники + внешние помехи<br>
        <strong>Помехи:</strong> ${r.ch?.interference === 'high' ? '⚠ Высокие' : r.ch?.interference === 'medium' ? '~ Средние' : r.ch?.interference === 'none' ? '✓ Нет' : '✓ Низкие'}
      </div>`;
    })() : '<div style="font-size:.72rem;color:var(--text-secondary);margin-bottom:8px">Выберите канал — увидите как он искажает сигнал. Спектр RX покажет шумовую полку (AWGN) и ограничение полосы.</div>'}

    <div class="study-section__title">⑥ Приёмник (RX) — осциллограмма</div>
    <div class="sg-canvas-wrap">
      <canvas id="sgRxTime"></canvas>
      <div class="sg-canvas-label"><span>Время →</span><span>Принятый сигнал</span></div>
    </div>
    <div class="sg-canvas-wrap">
      <canvas id="sgRxSpectrum"></canvas>
      <div class="sg-canvas-label"><span>0 Гц</span><span>📊 Анализатор спектра RX</span><span>${sgFs/2} Гц</span></div>
    </div>

    <div class="study-section__title" style="margin-top:16px">MATLAB / Octave код</div>
    <div class="sg-formula">${matlabCode}</div>
    <div class="sg-export-btns">
      <button id="sgExportCSV">📄 TX CSV</button>
      <button id="sgExportRxCSV">📄 RX CSV</button>
      <button id="sgCopyMatlab">📋 MATLAB</button>
      <button id="sgImportCSV">📂 Импорт CSV</button>
    </div>
    <input type="file" id="sgImportFileInput" hidden accept=".csv,.txt">
  `;

  drawTimeDomain(document.getElementById('sgTimeDomain'), txSamples);
  drawSpectrum(document.getElementById('sgSpectrum'), txSamples, sgFs, sgN, sgSpectrumScale, sgSpectrumWindow);
  drawTimeDomain(document.getElementById('sgRxTime'), rxSamples);
  drawSpectrum(document.getElementById('sgRxSpectrum'), rxSamples, sgFs, sgN, sgSpectrumScale, sgSpectrumWindow);

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
      render();
    });
  });

  container.querySelectorAll('[data-rm]').forEach(btn => {
    btn.addEventListener('click', () => { sgComponents.splice(parseInt(btn.dataset.rm), 1); render(); });
  });

  document.getElementById('sgAddComp')?.addEventListener('click', () => {
    if (sgComponents.length < 4) { sgComponents.push({ type: 'sin', freq: 200 * (sgComponents.length + 1), amp: 0.5, phase: 0, dc: 0, carrier: 0, modType: 'none', modDepth: 1 }); render(); }
  });

  document.getElementById('sgAddFDM')?.addEventListener('click', () => {
    if (sgComponents.length < 4) {
      const carriers = [500, 1000, 1500, 2000];
      sgComponents.push({ type: 'sin', freq: 50, amp: 0.8, phase: 0, dc: 0, carrier: carriers[sgComponents.length] || 2500, modType: 'am', modDepth: 0.8 });
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
    navigator.clipboard.writeText(matlabCode).then(() => { showToast('📋', 'MATLAB код скопирован', ''); });
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
      if (data.length < 4) { showToast('⚠️', 'Файл слишком мал', ''); return; }
      const imported = new Float64Array(sgN);
      for (let i = 0; i < sgN; i++) imported[i] = data[i % data.length] || 0;
      sgComponents = [];
      sgImportedSamples = imported;
      showToast('📂', `Импортировано ${data.length} отсчётов`, '+3 XP');
      addXP(3);
      render();
    };
    reader.readAsText(file);
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
