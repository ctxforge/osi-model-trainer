import { CHANNEL_TYPES, ENV_EFFECTS, getChannelEnvType } from '../data/channels.js';
import { labData, getLabBits, onLabDataChange, simState } from '../core/lab-data.js';
import { formatSpeed } from '../core/utils.js';

export function initChannelPhysics() {
  const container = document.getElementById('channelPhysicsUI');
  let chState = { channelId: 'cat5e', dist: 30, env: {} };

  function calcEnvPenalty(ch, env) {
    const envType = getChannelEnvType(ch.id);
    const effects = ENV_EFFECTS[envType] || [];
    let totalDb = 0;
    let speedFactor = 1;
    effects.forEach(eff => {
      const val = env[eff.id];
      if (val === undefined) return;
      if (eff.type === 'toggle') {
        if (val && eff.dbPenalty) totalDb += eff.dbPenalty;
        if (val && eff.dbBonus) totalDb -= eff.dbBonus;
      } else if (eff.type === 'range') {
        if (eff.dbPenalty) totalDb += val * eff.dbPenalty;
        if (eff.dbPenPerDeg) totalDb += Math.max(0, val - (eff.baseline || 0)) * eff.dbPenPerDeg;
        if (eff.speedPenalty) speedFactor = Math.max(0.05, 1 - (val * eff.speedPenalty / 100));
      } else if (eff.type === 'select') {
        if (eff.dbPenalties) totalDb += eff.dbPenalties[val] || 0;
      }
    });
    return { totalDb: Math.max(totalDb, 0), speedFactor };
  }

  let chPhyAnimId = null;

  function drawSignal(canvas, txAmp, rxAmp, noiseAmp, color) {
    if (chPhyAnimId) cancelAnimationFrame(chPhyAnimId);
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx0 = canvas.getContext('2d');
    ctx0.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const midTx = h * 0.28, midRx = h * 0.72;

    const bits = getLabBits(4);

    function frame(now) {
      const offset = ((now || 0) / 60) % (w);
      const ctx = ctx0;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = '#2a2e3d'; ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#6c7a96'; ctx.font = '10px sans-serif';
      ctx.fillText('TX (передано)', 4, 14);
      ctx.fillText('RX (получено)', 4, h * 0.5 + 14);

      const bitWidth = w / bits.length;

      ctx.beginPath(); ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2;
      for (let x = 0; x < w; x++) {
        const rx = x + offset;
        const bitIdx = ((Math.floor(rx / bitWidth) % bits.length) + bits.length) % bits.length;
        const inBit = (rx % bitWidth) / bitWidth;
        let val = bits[bitIdx] ? 1 : -1;
        const edge = 0.08;
        if (inBit < edge) val *= inBit / edge;
        const y = midTx - val * txAmp * (h * 0.2);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      for (let x = 0; x < w; x++) {
        const rx = x + offset;
        const bitIdx = ((Math.floor(rx / bitWidth) % bits.length) + bits.length) % bits.length;
        const inBit = (rx % bitWidth) / bitWidth;
        let val = bits[bitIdx] ? 1 : -1;
        const edge = 0.08;
        if (inBit < edge) val *= inBit / edge;
        const signal = val * rxAmp * (h * 0.2);
        const noise = (Math.random() - 0.5) * 2 * noiseAmp * (h * 0.2);
        const y = midRx - signal - noise;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (rxAmp > 0.05) {
        ctx.strokeStyle = '#e74c3c44'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(0, midRx); ctx.lineTo(w, midRx); ctx.stroke(); ctx.setLineDash([]);
      }

      ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.arc(w * 0.85, midTx, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(w * 0.85, midRx, 3, 0, Math.PI * 2); ctx.fill();

      chPhyAnimId = requestAnimationFrame(frame);
    }
    chPhyAnimId = requestAnimationFrame(frame);
  }

  function render() {
    const ch = CHANNEL_TYPES.find(c => c.id === chState.channelId);
    const envType = getChannelEnvType(ch.id);
    const effects = ENV_EFFECTS[envType] || [];

    effects.forEach(eff => {
      if (chState.env[eff.id] === undefined) {
        chState.env[eff.id] = eff.default !== undefined ? eff.default : 0;
      }
    });

    const envPen = calcEnvPenalty(ch, chState.env);
    const distUnit = ch.medium === 'fiber' ? chState.dist / 1000 : chState.dist / 100;
    const cableAtten = ch.attenuation * distUnit;
    const envAtten = envPen.totalDb;
    const totalAtten = cableAtten + envAtten;
    const txPower = ch.snrBase + 10;
    const rxPower = txPower - totalAtten;
    const noiseFloor = -5 + (ch.interference === 'high' ? 5 : ch.interference === 'medium' ? 2 : 0);
    const snr = rxPower - noiseFloor;
    const snrLin = Math.pow(10, Math.max(snr, 0) / 10);
    const shannon = ch.bandwidthMHz * Math.log2(1 + snrLin);
    const effSpeed = Math.min(ch.speed, shannon) * envPen.speedFactor * (snr > 0 ? 1 : 0);

    let ber;
    if (snr > 30) ber = '< 10⁻¹²';
    else if (snr > 20) ber = '~10⁻⁹';
    else if (snr > 15) ber = '~10⁻⁶';
    else if (snr > 10) ber = '~10⁻⁴';
    else if (snr > 5) ber = '~10⁻²';
    else ber = '~0.5 (нет связи)';

    let quality, qualColor;
    if (snr > 30) { quality = 'Отличное'; qualColor = '#2ecc71'; }
    else if (snr > 20) { quality = 'Хорошее'; qualColor = '#1abc9c'; }
    else if (snr > 10) { quality = 'Среднее'; qualColor = '#f1c40f'; }
    else if (snr > 3) { quality = 'Плохое'; qualColor = '#e67e22'; }
    else { quality = 'Нет связи'; qualColor = '#e74c3c'; }

    const overMax = chState.dist > ch.maxDist;
    const snrPct = Math.min(Math.max(snr / 50 * 100, 0), 100);
    const propDelay = (chState.dist / (ch.propagation * 299792458)) * 1000;

    const simUploadedFile = simState.uploadedFile;
    const simUploadedBytes = simState.uploadedBytes;

    container.innerHTML = `
      <input type="text" class="enc-input" id="chPhyMsg" value="${chState.msg || 'Hi'}" placeholder="Сообщение для визуализации сигнала...">
      ${simUploadedFile && simUploadedBytes?.length ? `<div style="font-size:.72rem;color:var(--l4);margin:-6px 0 8px">📎 Файл: ${simUploadedFile.name} — биты файла отображаются на графике</div>` : ''}

      <select class="ch-phy-select" id="chPhySelect">
        ${CHANNEL_TYPES.map(c => `<option value="${c.id}"${c.id === chState.channelId ? ' selected' : ''}>${c.icon} ${c.name} — ${c.medium === 'copper' ? 'медь' : c.medium === 'fiber' ? 'оптоволокно' : 'радио'}</option>`).join('')}
      </select>

      <div class="lab-param">
        <div class="lab-param__label">
          <span>Расстояние</span>
          <span class="lab-param__value" style="${overMax ? 'color:var(--l7)' : ''}">${chState.dist >= 1000 ? (chState.dist/1000).toFixed(1) + ' км' : chState.dist + ' м'}${overMax ? ' ⚠ > макс.' : ''}</span>
        </div>
        <input type="range" id="chPhyDist" min="1" max="${Math.max(ch.maxDist * 2, 200)}" step="${ch.maxDist > 5000 ? 100 : 1}" value="${chState.dist}">
      </div>

      <div class="ch-canvas-wrap">
        <canvas id="chPhyCanvas" style="height:180px"></canvas>
        <div class="ch-canvas-legend">
          <div class="ch-canvas-legend__item"><div class="ch-canvas-legend__dot" style="background:#2ecc71"></div> Переданный</div>
          <div class="ch-canvas-legend__item"><div class="ch-canvas-legend__dot" style="background:${qualColor}"></div> Принятый</div>
          <div class="ch-canvas-legend__item"><div class="ch-canvas-legend__dot" style="background:#e74c3c"></div> Порог</div>
        </div>
      </div>

      <div class="lab-result__title">Бюджет мощности</div>
      <div class="ch-budget">
        <div class="ch-budget__row"><div class="ch-budget__icon">📡</div><div class="ch-budget__label">Мощность передатчика</div><div class="ch-budget__val ch-budget__val--good">+${txPower.toFixed(1)} дБ</div></div>
        <div class="ch-budget__row"><div class="ch-budget__icon">📉</div><div class="ch-budget__label">Затухание в среде (${chState.dist >= 1000 ? (chState.dist/1000).toFixed(1)+'км' : chState.dist+'м'})</div><div class="ch-budget__val ch-budget__val--bad">−${cableAtten.toFixed(1)} дБ</div></div>
        ${envAtten > 0 ? `<div class="ch-budget__row"><div class="ch-budget__icon">🌧️</div><div class="ch-budget__label">Потери среды (помехи, условия)</div><div class="ch-budget__val ch-budget__val--bad">−${envAtten.toFixed(1)} дБ</div></div>` : ''}
        <div class="ch-budget__row"><div class="ch-budget__icon">📥</div><div class="ch-budget__label">Мощность на приёмнике</div><div class="ch-budget__val" style="color:${qualColor}">${rxPower.toFixed(1)} дБ</div></div>
        <div class="ch-budget__row"><div class="ch-budget__icon">🔊</div><div class="ch-budget__label">Шумовая полка</div><div class="ch-budget__val">${noiseFloor.toFixed(1)} дБ</div></div>
        <div class="ch-budget__row" style="font-weight:700"><div class="ch-budget__icon">📶</div><div class="ch-budget__label">SNR (сигнал/шум)</div><div class="ch-budget__val" style="color:${qualColor}">${snr.toFixed(1)} дБ — ${quality}</div></div>
      </div>
      <div class="ch-budget__bar"><div class="ch-budget__bar-fill" style="width:${snrPct}%;background:${qualColor}"></div></div>

      <div class="lab-stats">
        <div class="lab-stat"><div class="lab-stat__value" style="color:${qualColor}">${snr.toFixed(1)} дБ</div><div class="lab-stat__label">SNR</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${ber}</div><div class="lab-stat__label">BER</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${formatSpeed(Math.max(effSpeed, 0))}</div><div class="lab-stat__label">Эфф. скорость</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${formatSpeed(shannon)}</div><div class="lab-stat__label">Ёмкость Шеннона</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${propDelay.toFixed(3)} мс</div><div class="lab-stat__label">Задержка распр.</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${ch.duplex === 'full' ? 'Full' : 'Half'}</div><div class="lab-stat__label">Дуплекс</div></div>
      </div>

      ${effects.length ? `
      <div class="ch-env-section">
        <div class="ch-env-section__title">Условия среды — ${ch.medium === 'copper' ? 'медный кабель' : ch.medium === 'fiber' ? 'оптоволокно' : ch.id === 'satellite' ? 'спутниковый канал' : 'радиоканал'}</div>
        ${effects.map(eff => {
          const val = chState.env[eff.id];
          if (eff.type === 'range') {
            return `<div class="ch-env-item">
              <div class="ch-env-item__row"><span>${eff.label}</span><span class="ch-env-item__val" id="chEnvVal-${eff.id}">${val}</span></div>
              <input type="range" min="${eff.min}" max="${eff.max}" value="${val}" data-env="${eff.id}">
              <div class="ch-env-item__desc">${eff.desc}</div>
            </div>`;
          } else if (eff.type === 'toggle') {
            return `<div class="ch-env-item">
              <label class="ch-env-toggle"><input type="checkbox" data-env="${eff.id}"${val ? ' checked' : ''}> ${eff.label}</label>
              <div class="ch-env-item__desc">${eff.desc}</div>
            </div>`;
          } else if (eff.type === 'select') {
            return `<div class="ch-env-item">
              <div class="ch-env-item__row"><span>${eff.label}</span></div>
              <select data-env="${eff.id}">${eff.options.map((o, i) => `<option value="${i}"${i === val ? ' selected' : ''}>${o}</option>`).join('')}</select>
              <div class="ch-env-item__desc">${eff.desc}</div>
            </div>`;
          }
          return '';
        }).join('')}
      </div>` : ''}

      <div class="card mt-16" style="font-size:.82rem;line-height:1.6">
        <strong>${ch.icon} ${ch.name}</strong> — ${ch.desc}
        <br><br><strong>Кодирование:</strong> ${ch.encoding} | <strong>Полоса:</strong> ${ch.bandwidthMHz >= 1000 ? ch.bandwidthMHz/1000 + ' ГГц' : ch.bandwidthMHz + ' МГц'} | <strong>Макс. дальность:</strong> ${ch.maxDist >= 1000 ? (ch.maxDist/1000).toFixed(0) + ' км' : ch.maxDist + ' м'}
      </div>
    `;

    const canvas = document.getElementById('chPhyCanvas');
    const txAmp = 1;
    const rxAmp = Math.max(Math.pow(10, -totalAtten / 40), 0.01);
    const noiseAmpVal = Math.pow(10, -snr / 30) * 0.8;
    drawSignal(canvas, txAmp, Math.min(rxAmp, 1), Math.min(noiseAmpVal, 1.2), qualColor);

    container.querySelector('#chPhyMsg').addEventListener('input', (e) => {
      chState.msg = e.target.value;
      render();
    });

    container.querySelector('#chPhySelect').addEventListener('change', (e) => {
      const newCh = CHANNEL_TYPES.find(c => c.id === e.target.value);
      chState.channelId = e.target.value;
      chState.dist = newCh.defaultDist;
      chState.env = {};
      render();
    });

    container.querySelector('#chPhyDist').addEventListener('input', (e) => {
      chState.dist = parseInt(e.target.value);
      render();
    });

    container.querySelectorAll('[data-env]').forEach(el => {
      const handler = () => {
        const key = el.dataset.env;
        if (el.type === 'checkbox') chState.env[key] = el.checked;
        else if (el.tagName === 'SELECT') chState.env[key] = parseInt(el.value);
        else { chState.env[key] = parseFloat(el.value); const valEl = document.getElementById('chEnvVal-' + key); if (valEl) valEl.textContent = el.value; }
        render();
      };
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', handler);
    });
  }

  const observer = new MutationObserver(() => {
    if (document.getElementById('lab-channelPhysics')?.classList.contains('active') && !container.children.length) render();
  });
  observer.observe(document.getElementById('lab-channelPhysics'), { attributes: true, attributeFilter: ['class'] });

  setTimeout(() => {
    if (document.getElementById('lab-channelPhysics')?.classList.contains('active')) render();
  }, 100);
  onLabDataChange(() => { if (document.getElementById('lab-channelPhysics')?.classList.contains('active')) render(); });
}
