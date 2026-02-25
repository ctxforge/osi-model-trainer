import { ANTENNA_TYPES, FREQ_BANDS, WEATHER_EFFECTS, calcFSPL, FSPL_FORMULA, RADIO_EXPERIMENTS } from '../data/antenna-types.js';
import { addXP } from '../core/gamification.js';

/* ============================================================
   Radio Laboratory — Link Budget, Antennas & Freq Bands
   ============================================================ */

const BAND_CATEGORIES = {
  broadcast: '📻 Радиовещание (LW/MW/SW/FM/DAB/DVB)',
  satellite_tv: '📡 Спутниковое ТВ',
  navigation: '🧭 Навигация (GPS/ADS-B)',
  aviation: '✈️ Авиация',
  marine: '⚓ Морская связь',
  amateur: '🎙️ Любительское радио',
  professional: '📟 Профессиональные службы',
  iot: '🔌 IoT / RFID / NFC',
  cellular: '📱 Сотовые сети (GSM/LTE/5G)',
  wifi: '📶 Wi-Fi / WLAN',
  satellite: '🛰️ Спутниковая связь',
  radar: '🔍 Радиолокация',
};

let rlContainer = null;
let rlState = {
  txAntenna: 'omni_vertical',
  rxAntenna: 'yagi',
  txPowerDbm: 20,
  rxNoiseFigureDb: 5,
  freqBandId: 'wifi24',
  distM: 200,
  weather: 'clear',
  txAngleOffset: 0,
  bandCategory: 'wifi',
  // Custom antenna params
  customTxGain: null,
  customRxGain: null,
};

export function initRadioLab() {
  rlContainer = document.getElementById('radioLabUI');
  if (!rlContainer) return;

  const sectionEl = document.getElementById('section-radio-lab');
  if (sectionEl) {
    const observer = new MutationObserver(() => {
      if (sectionEl.classList.contains('active') && !rlContainer.children.length) buildUI();
    });
    observer.observe(sectionEl, { attributes: true, attributeFilter: ['class'] });
  }
  setTimeout(() => {
    if (document.getElementById('section-radio-lab')?.classList.contains('active')) buildUI();
  }, 200);
}

function getBandsForCategory(cat) {
  return FREQ_BANDS.filter(b => b.category === cat);
}

function buildUI() {
  const defaultBand = FREQ_BANDS.find(b => b.id === rlState.freqBandId) || FREQ_BANDS[0];

  rlContainer.innerHTML = `
    <div class="rl-header">
      <div class="rl-header__title">📡 Радиолаборатория</div>
      <div class="rl-header__subtitle">Link budget · Антенны · Все диапазоны — от NFC (13.56 МГц) до 5G mmWave (28 ГГц)</div>
    </div>

    <!-- Frequency Band Selector -->
    <div class="rl-band-section">
      <div class="rl-panel__title">📻 Выбор диапазона и технологии</div>
      <div class="rl-category-tabs" id="rlCategoryTabs">
        ${Object.entries(BAND_CATEGORIES).map(([cat, label]) => `
          <button class="rl-cat-btn ${cat === rlState.bandCategory ? 'rl-cat-btn--active' : ''}" data-cat="${cat}">${label}</button>
        `).join('')}
      </div>
      <div class="rl-band-cards" id="rlBandCards"></div>
    </div>

    <!-- Selected Band Info -->
    <div class="rl-selected-band" id="rlSelectedBandInfo"></div>

    <!-- TX / RX panels -->
    <div class="rl-panels">
      <div class="rl-panel">
        <div class="rl-panel__title">📤 Передатчик (TX)</div>
        <div class="rl-param">
          <label>Мощность TX:</label>
          <div class="rl-slider-row">
            <input type="range" id="rlTxPower" min="-20" max="60" value="${rlState.txPowerDbm}" step="1">
            <span class="rl-val" id="rlTxPowerVal">${rlState.txPowerDbm} дБм</span>
          </div>
          <div class="rl-power-presets">
            <button class="rl-preset-btn" data-pwr="-10" title="Маломощный IoT">IoT −10</button>
            <button class="rl-preset-btn" data-pwr="0" title="Ethernet">LAN 0</button>
            <button class="rl-preset-btn" data-pwr="20" title="Wi-Fi">Wi-Fi 20</button>
            <button class="rl-preset-btn" data-pwr="23" title="Стандартный Wi-Fi">AP 23</button>
            <button class="rl-preset-btn" data-pwr="33" title="LTE пикофота">pico 33</button>
            <button class="rl-preset-btn" data-pwr="43" title="LTE макрофота">LTE 43</button>
            <button class="rl-preset-btn" data-pwr="50" title="Спутник">SAT 50</button>
          </div>
        </div>
        <div class="rl-param">
          <label>Антенна TX:</label>
          <select id="rlTxAntenna">
            ${renderAntennaOptions(rlState.txAntenna)}
          </select>
        </div>
        <div class="rl-ant-info" id="rlTxAntennaInfo"></div>
        <div class="rl-param">
          <label>Или задать своё усиление TX:</label>
          <div class="rl-slider-row">
            <input type="range" id="rlCustomTxGain" min="-10" max="50" value="${rlState.customTxGain ?? 0}" step="0.5">
            <span class="rl-val" id="rlCustomTxGainVal">${rlState.customTxGain != null ? rlState.customTxGain + ' дБи' : 'авто'}</span>
          </div>
          <label><input type="checkbox" id="rlCustomTxCheck" ${rlState.customTxGain != null ? 'checked' : ''}> Ручной ввод усиления TX</label>
        </div>
        <div class="rl-param">
          <label>Отклонение от оси: <span id="rlTxAngleVal">${rlState.txAngleOffset}°</span></label>
          <input type="range" id="rlTxAngle" min="0" max="180" value="${rlState.txAngleOffset}" step="5" style="width:100%">
        </div>
      </div>

      <div class="rl-panel">
        <div class="rl-panel__title">📥 Приёмник (RX)</div>
        <div class="rl-param">
          <label>Антенна RX:</label>
          <select id="rlRxAntenna">
            ${renderAntennaOptions(rlState.rxAntenna)}
          </select>
        </div>
        <div class="rl-ant-info" id="rlRxAntennaInfo"></div>
        <div class="rl-param">
          <label>Или задать своё усиление RX:</label>
          <div class="rl-slider-row">
            <input type="range" id="rlCustomRxGain" min="-10" max="50" value="${rlState.customRxGain ?? 0}" step="0.5">
            <span class="rl-val" id="rlCustomRxGainVal">${rlState.customRxGain != null ? rlState.customRxGain + ' дБи' : 'авто'}</span>
          </div>
          <label><input type="checkbox" id="rlCustomRxCheck" ${rlState.customRxGain != null ? 'checked' : ''}> Ручной ввод усиления RX</label>
        </div>
        <div class="rl-param">
          <label>Шум-фигура приёмника (NF):</label>
          <div class="rl-slider-row">
            <input type="range" id="rlNoiseFigure" min="0" max="20" value="${rlState.rxNoiseFigureDb}" step="0.5">
            <span class="rl-val" id="rlNoiseFigureVal">${rlState.rxNoiseFigureDb} дБ</span>
          </div>
          <div style="font-size:.72rem;color:var(--text-secondary)">Типовые значения: SDR 8–15 дБ, LNA 0.5–2 дБ, проф. приёмник 3–6 дБ</div>
        </div>
      </div>
    </div>

    <!-- Channel params -->
    <div class="rl-channel-panel">
      <div class="rl-panel__title">🌐 Параметры канала</div>
      <div class="rl-channel-grid">
        <div class="rl-param">
          <label>Расстояние: <strong id="rlDistVal">${fmtDist(rlState.distM)}</strong></label>
          <input type="range" id="rlDist" min="1" max="50000" value="${rlState.distM}" step="10" style="width:100%">
          <div class="rl-dist-presets">
            <button class="rl-preset-btn" data-dist="10">10 м</button>
            <button class="rl-preset-btn" data-dist="100">100 м</button>
            <button class="rl-preset-btn" data-dist="1000">1 км</button>
            <button class="rl-preset-btn" data-dist="10000">10 км</button>
            <button class="rl-preset-btn" data-dist="50000">50 км</button>
          </div>
        </div>
        <div class="rl-param">
          <label>Погода:</label>
          <select id="rlWeather">
            ${WEATHER_EFFECTS.map(w => `<option value="${w.id}"${w.id === rlState.weather ? ' selected' : ''}>${w.name}${w.penaltyDb > 0 ? ' (−'+w.penaltyDb+' дБ)' : ''}</option>`).join('')}
          </select>
          <div style="font-size:.72rem;color:var(--text-secondary);margin-top:3px">Дождевое затухание критично выше 10 ГГц</div>
        </div>
      </div>
    </div>

    <!-- Lambda calculator -->
    <div class="rl-lambda-section" id="rlLambdaSection"></div>

    <!-- Link Budget -->
    <div class="rl-budget-panel" id="rlBudgetPanel"></div>

    <!-- Antenna Patterns -->
    <div class="rl-pattern-section">
      <div class="rl-panel__title">🎯 Диаграммы направленности антенн (вид сверху)</div>
      <div class="rl-patterns-row">
        <div class="rl-pattern-wrap">
          <div class="rl-pattern-label" id="rlTxPatternLabel">TX</div>
          <canvas id="rlTxCanvas" width="180" height="180"></canvas>
        </div>
        <div class="rl-pattern-wrap">
          <div class="rl-pattern-label" id="rlRxPatternLabel">RX</div>
          <canvas id="rlRxCanvas" width="180" height="180"></canvas>
        </div>
      </div>
    </div>

    <!-- FSPL Graph -->
    <div class="rl-fspl-section">
      <div class="rl-panel__title">📈 FSPL vs расстояние</div>
      <div class="rl-fspl-formula">${FSPL_FORMULA.simplified}</div>
      <canvas id="rlFsplCanvas" style="width:100%;height:180px;display:block"></canvas>
    </div>

    <!-- Experiments -->
    <div class="rl-experiments">
      <div class="rl-panel__title">🔬 Эксперименты</div>
      ${RADIO_EXPERIMENTS.map(exp => `
        <div class="rl-experiment">
          <div class="rl-experiment__title">${exp.title}</div>
          <div class="rl-experiment__task">${exp.task}</div>
          <div class="rl-experiment__insight" id="rlExpInsight-${exp.id}" style="display:none">💡 ${exp.insight}</div>
          <button class="rl-exp-btn" data-exp="${exp.id}">▶ Показать объяснение</button>
        </div>
      `).join('')}
    </div>
  `;

  renderBandCards(rlState.bandCategory);
  attachHandlers();
  updateAll();
}

function renderAntennaOptions(selectedId) {
  return ANTENNA_TYPES.map(a =>
    `<option value="${a.id}"${a.id === selectedId ? ' selected' : ''}>${a.icon} ${a.name} (${a.gain_dbi > 0 ? '+' : ''}${a.gain_dbi} дБи)</option>`
  ).join('');
}

function fmtDist(d) {
  return d >= 1000 ? (d/1000).toFixed(1) + ' км' : d + ' м';
}

function renderBandCards(cat) {
  const cardsEl = rlContainer.querySelector('#rlBandCards');
  if (!cardsEl) return;
  const bands = getBandsForCategory(cat);
  cardsEl.innerHTML = bands.map(b => `
    <div class="rl-band-card ${b.id === rlState.freqBandId ? 'rl-band-card--active' : ''}" data-band="${b.id}">
      <div class="rl-band-card__name">${b.name}</div>
      <div class="rl-band-card__freq">${b.freqGHz >= 1 ? b.freqGHz.toFixed(3) + ' ГГц' : (b.freqGHz * 1000).toFixed(1) + ' МГц'}</div>
      <div class="rl-band-card__lambda">λ: ${b.lambda}</div>
    </div>
  `).join('') || '<div style="color:var(--text-secondary);font-size:.8rem;padding:8px">Нет диапазонов в этой категории</div>';

  cardsEl.querySelectorAll('.rl-band-card').forEach(card => {
    card.addEventListener('click', () => {
      rlState.freqBandId = card.dataset.band;
      cardsEl.querySelectorAll('.rl-band-card').forEach(c => c.classList.toggle('rl-band-card--active', c === card));
      updateAll();
    });
  });
}

function attachHandlers() {
  // Category tabs
  rlContainer.querySelector('#rlCategoryTabs')?.addEventListener('click', e => {
    const btn = e.target.closest('.rl-cat-btn');
    if (!btn) return;
    rlState.bandCategory = btn.dataset.cat;
    rlContainer.querySelectorAll('.rl-cat-btn').forEach(b => b.classList.toggle('rl-cat-btn--active', b === btn));
    // Auto-select first band in category
    const firstBand = getBandsForCategory(rlState.bandCategory)[0];
    if (firstBand) rlState.freqBandId = firstBand.id;
    renderBandCards(rlState.bandCategory);
    updateAll();
  });

  // Power presets
  rlContainer.querySelectorAll('[data-pwr]').forEach(btn => {
    btn.addEventListener('click', () => {
      rlState.txPowerDbm = parseInt(btn.dataset.pwr);
      const sl = rlContainer.querySelector('#rlTxPower');
      if (sl) sl.value = rlState.txPowerDbm;
      rlContainer.querySelector('#rlTxPowerVal').textContent = rlState.txPowerDbm + ' дБм';
      updateAll();
    });
  });

  // Distance presets
  rlContainer.querySelectorAll('[data-dist]').forEach(btn => {
    btn.addEventListener('click', () => {
      rlState.distM = parseInt(btn.dataset.dist);
      const sl = rlContainer.querySelector('#rlDist');
      if (sl) sl.value = rlState.distM;
      rlContainer.querySelector('#rlDistVal').textContent = fmtDist(rlState.distM);
      updateAll();
    });
  });

  // Sliders & selects
  const bindings = [
    ['rlTxPower', 'txPowerDbm', parseFloat, '#rlTxPowerVal', v => v + ' дБм'],
    ['rlNoiseFigure', 'rxNoiseFigureDb', parseFloat, '#rlNoiseFigureVal', v => v + ' дБ'],
    ['rlTxAngle', 'txAngleOffset', parseInt, '#rlTxAngleVal', v => v + '°'],
    ['rlDist', 'distM', parseInt, '#rlDistVal', fmtDist],
    ['rlTxAntenna', 'txAntenna', v => v, null, null],
    ['rlRxAntenna', 'rxAntenna', v => v, null, null],
    ['rlWeather', 'weather', v => v, null, null],
  ];

  bindings.forEach(([id, key, transform, valId, fmt]) => {
    const el = rlContainer.querySelector('#' + id);
    if (!el) return;
    const update = e => {
      rlState[key] = transform(e.target.value);
      if (valId && fmt) {
        const valEl = rlContainer.querySelector(valId);
        if (valEl) valEl.textContent = fmt(rlState[key]);
      }
      updateAll();
    };
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  });

  // Custom gain
  const customTxCheck = rlContainer.querySelector('#rlCustomTxCheck');
  const customRxCheck = rlContainer.querySelector('#rlCustomRxCheck');
  rlContainer.querySelector('#rlCustomTxGain')?.addEventListener('input', e => {
    if (customTxCheck?.checked) {
      rlState.customTxGain = parseFloat(e.target.value);
      const valEl = rlContainer.querySelector('#rlCustomTxGainVal');
      if (valEl) valEl.textContent = rlState.customTxGain + ' дБи';
      updateAll();
    }
  });
  customTxCheck?.addEventListener('change', () => {
    rlState.customTxGain = customTxCheck.checked ? 0 : null;
    const valEl = rlContainer.querySelector('#rlCustomTxGainVal');
    if (valEl) valEl.textContent = rlState.customTxGain != null ? rlState.customTxGain + ' дБи' : 'авто';
    updateAll();
  });
  rlContainer.querySelector('#rlCustomRxGain')?.addEventListener('input', e => {
    if (customRxCheck?.checked) {
      rlState.customRxGain = parseFloat(e.target.value);
      const valEl = rlContainer.querySelector('#rlCustomRxGainVal');
      if (valEl) valEl.textContent = rlState.customRxGain + ' дБи';
      updateAll();
    }
  });
  customRxCheck?.addEventListener('change', () => {
    rlState.customRxGain = customRxCheck.checked ? 0 : null;
    const valEl = rlContainer.querySelector('#rlCustomRxGainVal');
    if (valEl) valEl.textContent = rlState.customRxGain != null ? rlState.customRxGain + ' дБи' : 'авто';
    updateAll();
  });

  // Experiments
  rlContainer.querySelectorAll('.rl-exp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = rlContainer.querySelector('#rlExpInsight-' + btn.dataset.exp);
      if (el) { el.style.display = el.style.display === 'none' ? 'block' : 'none'; addXP(5); }
    });
  });
}

function updateAll() {
  const txAnt = ANTENNA_TYPES.find(a => a.id === rlState.txAntenna) || ANTENNA_TYPES[0];
  const rxAnt = ANTENNA_TYPES.find(a => a.id === rlState.rxAntenna) || ANTENNA_TYPES[1];
  const band = FREQ_BANDS.find(b => b.id === rlState.freqBandId) || FREQ_BANDS[0];
  const wthr = WEATHER_EFFECTS.find(w => w.id === rlState.weather) || WEATHER_EFFECTS[0];

  // Update antenna info cards
  ['Tx', 'Rx'].forEach(side => {
    const ant = side === 'Tx' ? txAnt : rxAnt;
    const el = rlContainer.querySelector(`#rl${side}AntennaInfo`);
    if (el) el.innerHTML = `<div class="rl-ant-card">
      <span class="rl-ant-card__gain">+${ant.gain_dbi} дБи · ${ant.pattern === 'omnidirectional' ? '360° всенаправленная' : ant.pattern === 'highly_directional' ? 'остронаправленная' : 'направленная'}</span>
      <span>${ant.desc}</span>
      <span class="rl-ant-card__use">📌 ${ant.use}</span>
    </div>`;
  });
  rlContainer.querySelector('#rlTxPatternLabel').textContent = `TX: ${txAnt.icon} ${txAnt.name}`;
  rlContainer.querySelector('#rlRxPatternLabel').textContent = `RX: ${rxAnt.icon} ${rxAnt.name}`;

  // Selected band info
  const selBandEl = rlContainer.querySelector('#rlSelectedBandInfo');
  if (selBandEl) {
    const freqStr = band.freqGHz >= 1 ? band.freqGHz.toFixed(3) + ' ГГц' : (band.freqGHz * 1000).toFixed(2) + ' МГц';
    selBandEl.innerHTML = `<div class="rl-selected-band__card">
      <div class="rl-selected-band__name">${band.name}</div>
      <div class="rl-selected-band__meta">
        <span>📻 f = ${freqStr}</span>
        <span>λ ≈ ${band.lambda}</span>
        <span>Min SNR: ${band.minSnr} дБ</span>
      </div>
      <div class="rl-selected-band__desc">${band.desc}</div>
      <div class="rl-selected-band__examples">Примеры: ${band.examples}</div>
    </div>`;
  }

  // Lambda calculator
  const lambdaEl = rlContainer.querySelector('#rlLambdaSection');
  if (lambdaEl) {
    const c = 3e8;
    const fHz = band.freqGHz * 1e9;
    const lambda = c / fHz;
    const fmtLambda = lambda < 0.001 ? (lambda*1e6).toFixed(0)+' нм'
      : lambda < 0.01 ? (lambda*100).toFixed(2)+' см'
      : lambda < 1 ? (lambda*100).toFixed(1)+' см' : lambda.toFixed(2)+' м';
    lambdaEl.innerHTML = `<div class="rl-lambda-card">
      <div class="rl-lambda-title">📐 Длина волны и размеры антенны</div>
      <div class="rl-lambda-row">
        <span>λ = c/f = 3×10⁸ / ${fHz.toExponential(2)}</span>
        <strong>λ = ${fmtLambda}</strong>
      </div>
      <div class="rl-lambda-sizes">
        <div>λ/2 (диполь): <strong>${fmtMetric(lambda/2)}</strong></div>
        <div>λ/4 (монополь): <strong>${fmtMetric(lambda/4)}</strong></div>
        <div>5/8λ (улучш.): <strong>${fmtMetric(lambda*0.625)}</strong></div>
        <div>Параболика Ø (λ/m², G=${((3.14*(lambda/2)**2) / (lambda**2) * 10).toFixed(0)} дБи): зависит от D</div>
      </div>
      <div class="rl-lambda-hint">💡 Физический размер антенны пропорционален λ: на ${band.freqGHz >= 1 ? band.freqGHz.toFixed(1)+'ГГц' : (band.freqGHz*1000).toFixed(0)+'МГц'} монополь λ/4 = ${fmtMetric(lambda/4)}</div>
    </div>`;
  }

  // Link budget calculation
  const effectiveTxGain = rlState.customTxGain != null ? rlState.customTxGain
    : txAnt.gain_dbi + calcAntennaGainAtAngle(txAnt, rlState.txAngleOffset);
  const effectiveRxGain = rlState.customRxGain != null ? rlState.customRxGain : rxAnt.gain_dbi;

  const fspl = calcFSPL(rlState.distM, band.freqGHz);
  const weatherLoss = wthr.penaltyDb;
  const eirp = rlState.txPowerDbm + effectiveTxGain;
  const rxPowerDbm = eirp - fspl - weatherLoss + effectiveRxGain;

  // Noise floor: kTB + NF, assume 20 MHz BW
  const bwHz = 20e6;
  const noiseFloorDbm = -174 + 10 * Math.log10(bwHz) + rlState.rxNoiseFigureDb;
  const snr = rxPowerDbm - noiseFloorDbm;

  let quality, qualColor;
  const minSnr = band.minSnr;
  if (snr > minSnr + 20) { quality = 'Отличное'; qualColor = '#2ecc71'; }
  else if (snr > minSnr + 10) { quality = 'Хорошее'; qualColor = '#1abc9c'; }
  else if (snr > minSnr + 3) { quality = 'Среднее'; qualColor = '#f1c40f'; }
  else if (snr > minSnr) { quality = 'Плохое'; qualColor = '#e67e22'; }
  else { quality = 'Нет связи'; qualColor = '#e74c3c'; }

  let modulation = 'нет связи';
  if (snr > 32) modulation = 'QAM-256 (10 Гбит/с Wi-Fi)';
  else if (snr > 26) modulation = 'QAM-64 (802.11ac)';
  else if (snr > 20) modulation = 'QAM-16 (4G LTE)';
  else if (snr > 14) modulation = 'QPSK (DVB-S2 тестовый)';
  else if (snr > 8) modulation = 'BPSK (надёжная связь)';
  else if (snr > 3) modulation = 'BPSK (на пределе)';
  else if (snr > -10) modulation = 'LoRa / LoRa SF12 (IoT)';

  const panel = rlContainer.querySelector('#rlBudgetPanel');
  if (panel) panel.innerHTML = `
    <div class="rl-panel__title">📊 Полный бюджет мощности (Link Budget)</div>
    <div class="rl-budget-table">
      <div class="rl-brow"><span>📡 Мощность TX</span><span class="rl-bval rl-bval--good">+${rlState.txPowerDbm.toFixed(1)} дБм</span></div>
      <div class="rl-brow"><span>🎯 Усиление TX антенны (${txAnt.name}${rlState.txAngleOffset > 0 ? ', откл. '+rlState.txAngleOffset+'°' : ''})</span><span class="rl-bval ${effectiveTxGain >= 0 ? 'rl-bval--good' : 'rl-bval--bad'}">${effectiveTxGain >= 0 ? '+' : ''}${effectiveTxGain.toFixed(1)} дБи</span></div>
      <div class="rl-brow rl-brow--eirp"><span>= EIRP (эффективная мощность в направлении луча)</span><span class="rl-bval">${eirp >= 0 ? '+' : ''}${eirp.toFixed(1)} дБм</span></div>
      <div class="rl-brow"><span>📉 FSPL (${fmtDist(rlState.distM)}, ${band.freqGHz >= 1 ? band.freqGHz.toFixed(2)+'ГГц' : (band.freqGHz*1000).toFixed(0)+'МГц'})</span><span class="rl-bval rl-bval--bad">−${fspl.toFixed(1)} дБ</span></div>
      ${weatherLoss > 0 ? `<div class="rl-brow"><span>🌧 Потери на погоду (${wthr.name})</span><span class="rl-bval rl-bval--bad">−${weatherLoss.toFixed(1)} дБ</span></div>` : ''}
      <div class="rl-brow"><span>🎯 Усиление RX антенны (${rxAnt.name})</span><span class="rl-bval rl-bval--good">+${effectiveRxGain.toFixed(1)} дБи</span></div>
      <div class="rl-brow rl-brow--result"><span>📥 Мощность на приёмнике</span><span class="rl-bval" style="color:${qualColor}">${rxPowerDbm.toFixed(1)} дБм</span></div>
      <div class="rl-brow"><span>🔊 Шумовая полка (kTB·BW + NF=${rlState.rxNoiseFigureDb}дБ, BW=20МГц)</span><span class="rl-bval">${noiseFloorDbm.toFixed(1)} дБм</span></div>
      <div class="rl-brow rl-brow--snr"><span><strong>📶 SNR</strong></span><span class="rl-bval" style="color:${qualColor}"><strong>${snr.toFixed(1)} дБ — ${quality}</strong></span></div>
      <div class="rl-brow"><span>Максимальная модуляция</span><span class="rl-bval">${modulation}</span></div>
    </div>
    <div class="rl-snr-bar"><div class="rl-snr-bar__fill" style="width:${Math.min(Math.max((snr + 20) / 70 * 100, 0), 100)}%;background:${qualColor}"></div></div>
    ${snr < minSnr ? `<div class="rl-no-conn">
      🚫 <strong>SNR = ${snr.toFixed(1)} дБ ниже минимума для ${band.name} (${minSnr} дБ)</strong><br>
      • Мощность RX: ${rxPowerDbm.toFixed(1)} дБм (ниже шумовой полки ${noiseFloorDbm.toFixed(0)} дБм)<br>
      ✦ Увеличить мощность TX  ✦ Антенна с большим усилением  ✦ Уменьшить расстояние  ✦ Убрать дождь
    </div>` : ''}
  `;

  drawPattern(rlContainer.querySelector('#rlTxCanvas'), txAnt, rlState.txAngleOffset);
  drawPattern(rlContainer.querySelector('#rlRxCanvas'), rxAnt, 0);
  drawFsplGraph(rlContainer.querySelector('#rlFsplCanvas'), band.freqGHz, rlState.distM);
}

function fmtMetric(v) {
  if (v < 0.001) return (v*1000).toFixed(1) + ' мм';
  if (v < 1) return (v*100).toFixed(1) + ' см';
  return v.toFixed(2) + ' м';
}

function calcAntennaGainAtAngle(antenna, angleDeg) {
  const a = Math.abs(angleDeg % 360);
  switch (antenna.pattern) {
    case 'omnidirectional': return 0;
    case 'figure8': return 0; // simplified
    case 'directional': {
      const rad = a * Math.PI / 180;
      return -Math.min(12 * Math.pow(rad / (Math.PI/6), 2), antenna.gain_dbi);
    }
    case 'highly_directional': {
      const rad = a * Math.PI / 180;
      return -Math.min(12 * Math.pow(rad / (Math.PI/36), 2), antenna.gain_dbi);
    }
    case 'sector_90deg': case 'sector_30deg': case 'adaptive':
      return a <= 45 ? 0 : -Math.min((a-45)/45 * antenna.gain_dbi, antenna.gain_dbi);
    default: return 0;
  }
}

function drawPattern(canvas, antenna, rotDeg) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 180 * dpr; canvas.height = 180 * dpr;
  canvas.style.width = '180px'; canvas.style.height = '180px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const cx = 90, cy = 90, maxR = 76;
  ctx.clearRect(0, 0, 180, 180);

  // Grid
  [0.25, 0.5, 0.75, 1].forEach(r => {
    ctx.beginPath(); ctx.arc(cx, cy, maxR * r, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
  });
  for (let a = 0; a < 360; a += 45) {
    const rad = a * Math.PI / 180;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(rad)*maxR, cy + Math.sin(rad)*maxR);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.stroke();
  }
  // N/E/S/W labels
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('0°', cx, cy - maxR - 4);
  ctx.fillText('90°', cx + maxR + 8, cy + 3);
  ctx.fillText('180°', cx, cy + maxR + 12);
  ctx.fillText('270°', cx - maxR - 8, cy + 3);

  // Pattern shape
  ctx.beginPath();
  for (let i = 0; i <= 360; i++) {
    const theta = i * Math.PI / 180;
    const relAngle = ((i - rotDeg + 360) % 360);
    const eff = relAngle > 180 ? 360 - relAngle : relAngle;
    let gain;
    switch (antenna.pattern) {
      case 'omnidirectional': gain = 0.82; break;
      case 'figure8': gain = Math.max(0.02, Math.abs(Math.cos(theta)) * 0.85); break;
      case 'directional': gain = Math.max(0.05, Math.pow(Math.cos(eff/180*Math.PI), 2) * 0.9 + 0.05); break;
      case 'highly_directional': gain = Math.max(0.02, Math.pow(Math.cos(eff/180*Math.PI), 16) * 0.94); break;
      case 'sector_90deg': gain = eff <= 45 ? 0.88 : Math.max(0.05, 0.88 * Math.pow(Math.cos((eff-45)/90*Math.PI), 2)); break;
      case 'sector_30deg': gain = eff <= 15 ? 0.88 : Math.max(0.03, 0.88 * Math.pow(Math.cos((eff-15)/60*Math.PI), 3)); break;
      case 'adaptive': gain = eff <= 20 ? 0.88 : Math.max(0.04, 0.88 * Math.pow(Math.cos((eff-20)/80*Math.PI), 4)); break;
      default: gain = 0.75;
    }
    const r = gain * maxR;
    const x = cx + r * Math.cos(theta - Math.PI/2);
    const y = cy + r * Math.sin(theta - Math.PI/2);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = '#3498db'; ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(52,152,219,0.15)'; ctx.fill(); ctx.stroke();

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`${antenna.icon} ${antenna.name}`, cx, 175);
  ctx.fillStyle = 'rgba(52,152,219,0.9)';
  ctx.fillText(`+${antenna.gain_dbi} дБи`, cx, 165 > 170 ? 155 : 165);
}

function drawFsplGraph(canvas, freqGHz, currentDist) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 400, h = 180;
  canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.height = '180px';
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const maxDist = 50000;
  const minF = calcFSPL(10, freqGHz), maxF = calcFSPL(maxDist, freqGHz);
  const pl = { left: 55, right: 10, top: 10, bottom: 28 };
  const gw = w - pl.left - pl.right, gh = h - pl.top - pl.bottom;

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = pl.top + gh * (i / 5);
    ctx.beginPath(); ctx.moveTo(pl.left, y); ctx.lineTo(pl.left + gw, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
    const val = minF + (maxF - minF) * (1 - i/5);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(0) + 'дБ', pl.left - 3, y + 4);
  }

  // FSPL curve
  ctx.beginPath(); ctx.strokeStyle = '#3498db'; ctx.lineWidth = 2;
  for (let px = 0; px <= gw; px++) {
    const dist = 10 * Math.pow(maxDist/10, px/gw);
    const fspl = calcFSPL(dist, freqGHz);
    const y = pl.top + gh * (1 - (fspl - minF)/(maxF - minF));
    if (px === 0) ctx.moveTo(pl.left + px, y); else ctx.lineTo(pl.left + px, y);
  }
  ctx.stroke();

  // Current dist marker
  const curDist = Math.min(currentDist, maxDist);
  const curFspl = calcFSPL(curDist, freqGHz);
  const logR = Math.log10(curDist/10) / Math.log10(maxDist/10);
  const curX = pl.left + gw * logR;
  const curY = pl.top + gh * (1 - (curFspl - minF)/(maxF - minF));
  ctx.beginPath(); ctx.arc(curX, curY, 5, 0, Math.PI*2);
  ctx.fillStyle = '#e74c3c'; ctx.fill();
  ctx.fillStyle = '#e74c3c'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(curFspl.toFixed(0) + ' дБ', curX + 8, curY + 4);

  // X axis
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'center';
  [10, 100, 1000, 10000, 50000].forEach(d => {
    const x = pl.left + gw * (Math.log10(d/10) / Math.log10(maxDist/10));
    ctx.fillText(d >= 1000 ? (d/1000)+'км' : d+'м', x, h - 8);
  });
}
