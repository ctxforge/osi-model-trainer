import { DB_SCALE_POINTS, MODULATIONS_FOR_BAUD } from '../data/units-reference.js';

export function initUnitsRef() {
  const container = document.getElementById('unitsRefUI');
  if (!container) return;

  const sectionEl = document.getElementById('section-units-ref');
  if (sectionEl) {
    const observer = new MutationObserver(() => {
      if (sectionEl.classList.contains('active') && !container.children.length) renderUnitsRef(container);
    });
    observer.observe(sectionEl, { attributes: true, attributeFilter: ['class'] });
  }
  setTimeout(() => {
    if (document.getElementById('section-units-ref')?.classList.contains('active')) renderUnitsRef(container);
  }, 200);
}

function renderUnitsRef(container) {
  container.innerHTML = `
    <div class="uref-page">
      <div class="uref-intro">
        Интерактивный справочник единиц измерений в телекоммуникациях.
        Нажимайте на биты, двигайте слайдеры — каждый виджет помогает «пощупать» физический смысл.
      </div>

      <div class="uref-block">
        <div class="uref-block__title">💾 Числовые системы и информация</div>
        <div class="uref-widget-card">
          <div class="uref-widget-card__title">Бит и байт — интерактивно</div>
          <div class="uref-bit-row" id="bitToggleRow">
            ${Array(8).fill(0).map((_, i) => `<button class="uref-bit" data-bit="${i}" title="Bit ${7-i}">0</button>`).join('')}
          </div>
          <div class="uref-bit-result">
            <span>Десятичное: <strong id="bitDecVal">0</strong></span>
            <span>Hex: <strong id="bitHexVal">0x00</strong></span>
            <span>ASCII: <strong id="bitAsciiVal">NUL</strong></span>
          </div>
          <div class="uref-bit-hint">Нажмите на биты чтобы переключить 0↔1 · Bit 7 — старший (MSB), Bit 0 — младший (LSB)</div>
        </div>
        <div class="uref-table">
          <div class="uref-table__head"><span>Единица</span><span>Значение</span><span>Пример</span></div>
          <div class="uref-table__row"><span>1 бит (b)</span><span>0 или 1</span><span>Один переключатель</span></div>
          <div class="uref-table__row"><span>1 байт (B)</span><span>8 бит</span><span>Один символ ASCII «A»</span></div>
          <div class="uref-table__row"><span>1 КиБ (KiB)</span><span>1 024 Б</span><span>Короткий текстовый файл</span></div>
          <div class="uref-table__row"><span>1 МиБ (MiB)</span><span>1 048 576 Б</span><span>Книга (~1 млн символов)</span></div>
          <div class="uref-table__row"><span>1 ГиБ (GiB)</span><span>1 073 741 824 Б</span><span>~700 МБ CD</span></div>
          <div class="uref-table__row uref-table__row--note"><span>⚠ Важно</span><span>1 КБ = 1000 Б (SI), 1 КиБ = 1024 Б (IEC). Производители дисков используют SI!</span></div>
        </div>
      </div>

      <div class="uref-block">
        <div class="uref-block__title">🚀 Скорость и пропускная способность</div>
        <div class="uref-widget-card">
          <div class="uref-widget-card__title">Бод vs Бит — ключевое различие</div>
          <div class="uref-baud-ctrl">
            <label>Модуляция:</label>
            <select id="baudModSelect">
              ${MODULATIONS_FOR_BAUD.map((m, i) => `<option value="${i}">${m.name} (${m.bitsPerSymbol} бит/символ)</option>`).join('')}
            </select>
          </div>
          <div class="uref-baud-ctrl">
            <label>Скорость символов: <strong id="baudRateVal">1 МБод</strong></label>
            <input type="range" id="baudRateSlider" min="1" max="1000" value="1" step="1" style="width:100%">
          </div>
          <div class="uref-baud-result" id="baudResult">
            <div class="uref-baud-result__mod"></div>
            <div class="uref-baud-result__calc"></div>
          </div>
        </div>
        <div class="uref-widget-card">
          <div class="uref-widget-card__title">Ёмкость Шеннона: C = B · log₂(1 + SNR)</div>
          <div class="uref-shannon__ctrls">
            <div>
              <label style="font-size:.8rem">Полоса B: <strong id="shannonBwVal">20 МГц</strong></label>
              <input type="range" id="shannonBwSlider" min="1" max="500" value="20" style="width:100%">
            </div>
            <div>
              <label style="font-size:.8rem">SNR: <strong id="shannonSnrVal">20 дБ</strong></label>
              <input type="range" id="shannonSnrSlider" min="-5" max="60" value="20" style="width:100%">
            </div>
          </div>
          <div class="uref-shannon__result" id="shannonResult"></div>
        </div>
      </div>

      <div class="uref-block">
        <div class="uref-block__title">📊 Децибелы — самая важная единица в телекоме</div>
        <div class="uref-db-explainer">
          <strong>Зачем логарифмическая шкала?</strong> В телекоммуникациях сигналы меняются
          в диапазоне от 50 Вт (сотовая вышка) до 0.1 пВт (тепловой шум) — это 14 порядков!
          В логарифмической шкале это всего 147 дБ.
        </div>
        <div class="uref-widget-card">
          <div class="uref-widget-card__title">Калькулятор децибел (для амплитуды)</div>
          <div class="uref-db-calc__row">
            <label>Линейное отношение амплитуд A₂/A₁:</label>
            <div class="uref-db-calc__input-row">
              <input type="number" id="dbLinInput" value="10" min="0.0001" max="1000000" step="any">
              <span class="uref-db-calc__arrow">→</span>
              <strong id="dbResultAmpl">20.0 дБ</strong>
            </div>
          </div>
          <div class="uref-db-calc__row" style="margin-top:8px">
            <label>Или введите дБ:</label>
            <div class="uref-db-calc__input-row">
              <input type="number" id="dbDbInput" value="20" step="0.1">
              <span class="uref-db-calc__arrow">→</span>
              <span id="dbResultLin">×10.0 амплитуда / ×100.0 мощность</span>
            </div>
          </div>
          <div id="dbAttenuationBar" style="margin-top:10px"></div>
          <div class="uref-db-rules">
            <div class="uref-db-rule"><span class="uref-db-rule__val">+3 дБ</span><span>× 2 по мощности (удвоение)</span></div>
            <div class="uref-db-rule"><span class="uref-db-rule__val">+6 дБ</span><span>× 2 по амплитуде</span></div>
            <div class="uref-db-rule"><span class="uref-db-rule__val">+10 дБ</span><span>× 10 по мощности</span></div>
            <div class="uref-db-rule"><span class="uref-db-rule__val">+20 дБ</span><span>× 100 по мощности / ×10 по амплитуде</span></div>
            <div class="uref-db-rule"><span class="uref-db-rule__val">−3 дБ</span><span>÷ 2 по мощности (−3 дБ точка фильтра)</span></div>
            <div class="uref-db-rule"><span class="uref-db-rule__val">−20 дБ</span><span>÷ 10 по амплитуде (осталось 10%)</span></div>
          </div>
        </div>
        <div class="uref-widget-card">
          <div class="uref-widget-card__title">Шкала реальных мощностей (дБм)</div>
          <div class="uref-dbm-formula">дБм = 10 · log₁₀(P / 1 мВт)</div>
          ${DB_SCALE_POINTS.map(p => `
            <div class="uref-dbm-item">
              <div class="uref-dbm-item__bar-wrap">
                <div class="uref-dbm-item__bar" style="width:${Math.max(5, ((p.dbm + 130) / 180) * 100)}%;background:${p.color}"></div>
              </div>
              <div class="uref-dbm-item__label">
                <strong style="color:${p.color};min-width:65px">${p.dbm > 0 ? '+' : ''}${p.dbm} дБм</strong>
                <span>${p.label}</span>
                <span class="uref-dbm-item__detail">(${p.detail})</span>
              </div>
            </div>
          `).join('')}
          <div style="font-size:.72rem;color:var(--text-secondary);margin-top:8px">
            Каждые +10 дБм = ×10 по мощности. +47 дБм до −100 дБм: разница 147 дБм = 50×10¹² раз!
          </div>
        </div>
      </div>

      <div class="uref-block">
        <div class="uref-block__title">📡 Частота и длина волны (λ = c/f)</div>
        <div class="uref-widget-card">
          <div class="uref-widget-card__title">Слайдер: частота → длина волны</div>
          <div class="uref-freq-ctrl">
            <label>Частота: <strong id="freqVal">2400 МГц</strong></label>
            <input type="range" id="freqSlider" min="1" max="100000" value="2400" step="1" style="width:100%">
          </div>
          <div class="uref-freq-result" id="freqResult"></div>
          <div class="uref-freq-examples">
            <button class="uref-freq-btn" data-freq="88">FM 88 МГц</button>
            <button class="uref-freq-btn" data-freq="433">LoRa 433 МГц</button>
            <button class="uref-freq-btn" data-freq="2400">Wi-Fi 2.4 ГГц</button>
            <button class="uref-freq-btn" data-freq="5000">Wi-Fi 5 ГГц</button>
            <button class="uref-freq-btn" data-freq="28000">5G 28 ГГц</button>
            <button class="uref-freq-btn" data-freq="193500000">Оптика 1550 нм</button>
          </div>
        </div>
        <div class="uref-table">
          <div class="uref-table__head"><span>Диапазон</span><span>Частота</span><span>Применение</span></div>
          <div class="uref-table__row"><span>UHF</span><span>300 МГц–3 ГГц</span><span>Wi-Fi 2.4, LTE, Bluetooth, GPS, ТВ</span></div>
          <div class="uref-table__row"><span>SHF</span><span>3–30 ГГц</span><span>Wi-Fi 5/6/7, спутник Ku/Ka, радары</span></div>
          <div class="uref-table__row"><span>EHF (mmWave)</span><span>30–300 ГГц</span><span>5G mmWave, 60 ГГц Wi-Fi</span></div>
          <div class="uref-table__row"><span>Оптика NIR</span><span>193–230 ТГц</span><span>Оптоволоконная связь (1310/1550 нм)</span></div>
        </div>
      </div>
    </div>
  `;

  attachWidgetHandlers(container);
}

function attachWidgetHandlers(container) {
  // Bit toggle
  const bits = new Uint8Array(8);
  container.querySelectorAll('.uref-bit').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      bits[i] ^= 1;
      btn.textContent = bits[i];
      btn.classList.toggle('uref-bit--on', bits[i] === 1);
      let val = 0;
      for (let j = 0; j < 8; j++) val = (val << 1) | bits[j];
      container.querySelector('#bitDecVal').textContent = val;
      container.querySelector('#bitHexVal').textContent = '0x' + val.toString(16).toUpperCase().padStart(2, '0');
      const ascii = val >= 32 && val < 127 ? String.fromCharCode(val)
        : val === 0 ? 'NUL' : val === 10 ? 'LF' : val === 13 ? 'CR' : val === 27 ? 'ESC'
        : `\\x${val.toString(16).toUpperCase().padStart(2,'0')}`;
      container.querySelector('#bitAsciiVal').textContent = ascii;
    });
  });

  // Baud widget
  const baudModSel = container.querySelector('#baudModSelect');
  const baudRateSl = container.querySelector('#baudRateSlider');
  const updateBaud = () => {
    const idx = parseInt(baudModSel.value);
    const mod = MODULATIONS_FOR_BAUD[idx];
    const rateM = parseInt(baudRateSl.value);
    container.querySelector('#baudRateVal').textContent = rateM >= 1000 ? (rateM/1000).toFixed(1) + ' ГБод' : rateM + ' МБод';
    const bitRateMbps = rateM * mod.bitsPerSymbol;
    const res = container.querySelector('#baudResult');
    if (res) {
      res.querySelector('.uref-baud-result__mod').innerHTML = `<strong>${mod.name}</strong>: ${mod.desc}`;
      res.querySelector('.uref-baud-result__calc').innerHTML =
        `${rateM} МБод × ${mod.bitsPerSymbol} бит/символ = <strong>${bitRateMbps >= 1000 ? (bitRateMbps/1000).toFixed(1)+' Гбит/с' : bitRateMbps+' Мбит/с'}</strong>
        <br><span style="color:var(--text-secondary);font-size:.78em">
          Один символ несёт ${mod.bitsPerSymbol} бит → нужно 2<sup>${mod.bitsPerSymbol}</sup> = ${Math.pow(2, mod.bitsPerSymbol)} различимых состояний сигнала
        </span>`;
    }
  };
  if (baudModSel) baudModSel.addEventListener('change', updateBaud);
  if (baudRateSl) baudRateSl.addEventListener('input', updateBaud);
  updateBaud();

  // Shannon
  const shannonBwSl = container.querySelector('#shannonBwSlider');
  const shannonSnrSl = container.querySelector('#shannonSnrSlider');
  const updateShannon = () => {
    const bw = parseInt(shannonBwSl.value);
    const snrDb = parseInt(shannonSnrSl.value);
    const snrLin = Math.pow(10, snrDb / 10);
    const cap = bw * Math.log2(1 + snrLin);
    container.querySelector('#shannonBwVal').textContent = bw + ' МГц';
    container.querySelector('#shannonSnrVal').textContent = snrDb + ' дБ';
    const res = container.querySelector('#shannonResult');
    if (res) res.innerHTML = `
      C = ${bw} × log₂(1 + ${snrLin.toFixed(1)}) = <strong>${cap >= 1000 ? (cap/1000).toFixed(2)+' Гбит/с' : cap.toFixed(0)+' Мбит/с'}</strong>
      <br><span style="font-size:.78rem;color:var(--text-secondary)">
        Реальные протоколы достигают ~70–80% этого предела.
        Для Wi-Fi 2.4 ГГц (20 МГц, SNR=25 дБ): C ≈ 166 Мбит/с → реально ~130 Мбит/с.
      </span>`;
  };
  if (shannonBwSl) shannonBwSl.addEventListener('input', updateShannon);
  if (shannonSnrSl) shannonSnrSl.addEventListener('input', updateShannon);
  updateShannon();

  // dB calculator
  const dbLinIn = container.querySelector('#dbLinInput');
  const dbDbIn = container.querySelector('#dbDbInput');
  const updateDb = (source) => {
    let lin, db;
    if (source === 'lin') {
      lin = parseFloat(dbLinIn.value) || 1;
      if (lin <= 0) lin = 0.001;
      db = 20 * Math.log10(lin);
      if (dbDbIn) dbDbIn.value = db.toFixed(2);
    } else {
      db = parseFloat(dbDbIn.value) || 0;
      lin = Math.pow(10, db / 20);
      if (dbLinIn) dbLinIn.value = lin.toFixed(4);
    }
    const powerRatio = Math.pow(10, db / 10);
    const ampRatio = Math.pow(10, db / 20);
    container.querySelector('#dbResultAmpl').textContent = db.toFixed(1) + ' дБ';
    container.querySelector('#dbResultLin').innerHTML = `×${ampRatio.toFixed(3)} амплитуда / ×${powerRatio.toFixed(3)} мощность`;
    const bar = container.querySelector('#dbAttenuationBar');
    if (bar) {
      const pctTx = 40, pctRx = Math.max(1, Math.min(40, ampRatio * 40));
      bar.innerHTML = `
        <div style="font-size:.75rem;color:var(--text-secondary);margin-bottom:4px">Визуализация затухания сигнала:</div>
        <div style="display:flex;align-items:flex-end;gap:16px;margin-bottom:4px">
          <div style="text-align:center">
            <div style="width:20px;height:${pctTx}px;background:var(--l4);border-radius:3px 3px 0 0;margin:0 auto"></div>
            <div style="font-size:.7rem">TX (1)</div>
          </div>
          <div style="text-align:center">
            <div style="width:20px;height:${Math.round(pctRx)}px;background:${ampRatio >= 1 ? '#2ecc71' : '#e74c3c'};border-radius:3px 3px 0 0;margin:0 auto"></div>
            <div style="font-size:.7rem">RX (×${ampRatio.toFixed(2)})</div>
          </div>
        </div>
        <div style="font-size:.72rem;color:var(--text-secondary)">${db >= 0 ? '+' : ''}${db.toFixed(1)} дБ → амплитуда ×${ampRatio.toFixed(3)}, мощность ×${powerRatio.toFixed(3)}</div>`;
    }
  };
  if (dbLinIn) dbLinIn.addEventListener('input', () => updateDb('lin'));
  if (dbDbIn) dbDbIn.addEventListener('input', () => updateDb('db'));
  updateDb('lin');

  // Frequency → wavelength
  const freqSl = container.querySelector('#freqSlider');
  const updateFreq = (freqMhz) => {
    const c = 3e8;
    const fHz = freqMhz * 1e6;
    const lambda = c / fHz;
    const freqStr = freqMhz >= 1e6 ? (freqMhz/1e6).toFixed(3) + ' ТГц'
      : freqMhz >= 1000 ? (freqMhz/1000).toFixed(3) + ' ГГц' : freqMhz + ' МГц';
    container.querySelector('#freqVal').textContent = freqStr;
    const lambdaStr = lambda < 1e-6 ? (lambda * 1e9).toFixed(0) + ' нм'
      : lambda < 0.01 ? (lambda * 100).toFixed(1) + ' см'
      : lambda < 1 ? (lambda * 100).toFixed(0) + ' см' : lambda.toFixed(2) + ' м';
    const res = container.querySelector('#freqResult');
    if (res) res.innerHTML = `
      <div>λ = c/f = 3×10⁸ м/с / ${fHz.toExponential(2)} Гц = <strong>${lambdaStr}</strong></div>
      <div style="margin-top:4px;font-size:.78rem;color:var(--text-secondary)">${getFreqContext(freqMhz, lambda)}</div>`;
  };
  if (freqSl) freqSl.addEventListener('input', e => updateFreq(parseInt(e.target.value)));
  container.querySelectorAll('.uref-freq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = parseInt(btn.dataset.freq);
      if (freqSl) freqSl.value = Math.min(f, 100000);
      updateFreq(f);
    });
  });
  updateFreq(2400);
}

function getFreqContext(freqMhz, lambda) {
  if (freqMhz >= 193_000_000) return `Инфракрасный свет — оптоволоконная связь. λ = ${(lambda*1e9).toFixed(0)} нм (нанометры!)`;
  if (freqMhz >= 30000) return `mmWave диапазон — 5G, поглощается дождём и листвой. Антенна ~${(lambda*1000).toFixed(1)} мм`;
  if (freqMhz >= 5000) return `Wi-Fi 5/6/7, короткие волны плохо проходят через стены. Антенна ~${(lambda*100).toFixed(1)} см`;
  if (freqMhz >= 2400) return `Wi-Fi 2.4 ГГц, Bluetooth, микроволновки. Антенна λ/4 ≈ ${(lambda/4*100).toFixed(1)} см`;
  if (freqMhz >= 400) return `UHF диапазон — ТВ, LTE, GPS. Волны хорошо огибают препятствия`;
  if (freqMhz >= 88) return `FM-радио (88–108 МГц). Антенна λ/4 ≈ ${(lambda/4).toFixed(2)} м`;
  return `Длинные волны — проникают через землю и здания`;
}
