import { CHANNEL_TYPES } from '../data/channels.js';
import { NET_DEVICES, NET_PRESETS } from '../data/devices.js';
import { OSI_LAYERS } from '../data/osi-layers.js';
import { labData, getLabText } from '../core/lab-data.js';
import { sleep, formatSpeed, formatDist } from '../core/utils.js';
import { gameState, saveGame, addXP, unlockAchievement } from '../core/gamification.js';

const SPEED_OF_LIGHT = 299792458;

let nbPath = [
  { type: 'device', id: 'pc' },
  { type: 'link', id: 'wifi5', dist: 10 },
  { type: 'device', id: 'router' },
  { type: 'link', id: 'cat5e', dist: 30 },
  { type: 'device', id: 'server' }
];

function calcChannelPhysics(ch, dist, env) {
  const distUnit = ch.medium === 'fiber' ? dist / 1000 : dist / 100;
  const cableAtten = ch.attenuation * distUnit;
  const envPenalty = env === 'harsh' ? (ch.medium === 'radio' ? 18 : ch.medium === 'fiber' ? 5 : 10) : env === 'ideal' ? 0 : (ch.medium === 'radio' ? 5 : ch.medium === 'fiber' ? 1 : 3);
  const attenTotal = cableAtten + envPenalty;
  const snr = Math.max(ch.snrBase - attenTotal, -5);
  const snrLinear = Math.pow(10, snr / 10);

  const shannonMbps = ch.bandwidthMHz * Math.log2(1 + Math.max(snrLinear, 0));
  const effectiveSpeed = Math.min(ch.speed, shannonMbps) * (snr > 0 ? 1 : 0);

  const propagationDelay = (dist / (ch.propagation * SPEED_OF_LIGHT)) * 1000;
  const totalDelay = ch.latency + propagationDelay;

  let ber;
  if (snr > 30) ber = 1e-12;
  else if (snr > 20) ber = 1e-9;
  else if (snr > 15) ber = 1e-6;
  else if (snr > 10) ber = 1e-4;
  else if (snr > 5) ber = 1e-2;
  else ber = 0.5;

  let quality;
  if (snr > 30) quality = 'excellent';
  else if (snr > 20) quality = 'good';
  else if (snr > 10) quality = 'fair';
  else if (snr > 3) quality = 'poor';
  else quality = 'dead';

  const overMax = dist > ch.maxDist;

  return { attenTotal, snr, shannonMbps, effectiveSpeed, propagationDelay, totalDelay, ber, quality, overMax };
}

function signalBarHTML(quality) {
  const heights = [4, 7, 10, 14];
  const levels = { excellent: 4, good: 3, fair: 2, poor: 1, dead: 0 };
  const n = levels[quality] || 0;
  const cls = quality === 'fair' ? 'signal-bar--fair' : quality === 'poor' ? 'signal-bar--poor' : quality === 'dead' ? 'signal-bar--dead' : '';
  return `<div class="signal-bar ${cls}">${heights.map((h, i) => `<div class="signal-bar__seg${i < n ? ' on' : ''}" style="height:${h}px"></div>`).join('')}</div>`;
}

function renderNBPresets() {
  const c = document.getElementById('nbPresets');
  c.innerHTML = NET_PRESETS.map((p, i) => `<button class="nb-preset" data-preset="${i}">${p.name}</button>`).join('');
  c.querySelectorAll('.nb-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      nbPath = JSON.parse(JSON.stringify(NET_PRESETS[parseInt(btn.dataset.preset)].path));
      renderNBPath();
    });
  });
}

function renderNBPath() {
  const c = document.getElementById('nbPath');
  let html = '';
  nbPath.forEach((item, i) => {
    if (item.type === 'device') {
      const dev = NET_DEVICES.find(d => d.id === item.id);
      const isEndpoint = i === 0 || i === nbPath.length - 1;
      const lyr = OSI_LAYERS.find(l => l.number === dev.layer);
      html += `<div class="nb-device" id="nbDev-${i}" data-idx="${i}">
        <div class="nb-device__icon" style="background:${dev.color}20;border:1px solid ${dev.color}40">${dev.icon}</div>
        <div class="nb-device__info">
          <div class="nb-device__name">${dev.name}</div>
          <div class="nb-device__layer" style="color:${lyr.color}">L${dev.layer} ${lyr.name}</div>
        </div>
        ${isEndpoint ? '' : `
          <select class="nb-device__select" data-idx="${i}">
            ${NET_DEVICES.filter(d => !['pc','server'].includes(d.id)).map(d => `<option value="${d.id}"${d.id === item.id ? ' selected' : ''}>${d.icon} ${d.name}</option>`).join('')}
          </select>
          <button class="nb-device__remove" data-idx="${i}">✕</button>
        `}
      </div>`;
    } else {
      const ch = CHANNEL_TYPES.find(ct => ct.id === item.id);
      const dist = item.dist || ch.defaultDist;
      const phys = calcChannelPhysics(ch, dist, item.env || 'normal');
      html += `<div class="nb-link" id="nbLink-${i}" data-idx="${i}" style="flex-wrap:wrap">
        <div class="nb-link__line" style="background:${ch.color}" id="nbLine-${i}"></div>
        <select class="nb-link__select" data-idx="${i}">
          ${CHANNEL_TYPES.map(ct => `<option value="${ct.id}"${ct.id === item.id ? ' selected' : ''}>${ct.icon} ${ct.name}</option>`).join('')}
        </select>
        ${signalBarHTML(phys.quality)}
        <div class="nb-link__dist">
          <input type="range" min="1" max="${ch.maxDist * 2}" step="${ch.maxDist > 1000 ? 100 : 1}" value="${dist}" data-idx="${i}">
          <div class="nb-link__dist-val">${formatDist(dist)}</div>
        </div>
        <div class="nb-link__details">
          <span class="nb-link__tag">${ch.duplex === 'full' ? 'Full-duplex' : 'Half-duplex'}</span>
          <span class="nb-link__tag">${ch.encoding}</span>
          <span class="nb-link__tag">${ch.medium === 'copper' ? 'Медь' : ch.medium === 'fiber' ? 'Свет' : 'Радио'}</span>
          <span class="nb-link__tag">${ch.interference === 'high' ? 'Помехи ⚠' : ch.interference === 'medium' ? 'Помехи ~' : ch.interference === 'none' ? 'Без помех' : 'Мало помех'}</span>
          ${phys.overMax ? `<span class="nb-link__tag nb-link__tag--warn">Превышение дальности!</span>` : ''}
          <select class="nb-device__select" data-env-idx="${i}" style="margin-left:auto;max-width:100px">
            <option value="ideal"${(item.env || 'normal') === 'ideal' ? ' selected' : ''}>Идеально</option>
            <option value="normal"${(item.env || 'normal') === 'normal' ? ' selected' : ''}>Норма</option>
            <option value="harsh"${(item.env || 'normal') === 'harsh' ? ' selected' : ''}>Тяжёлые</option>
          </select>
        </div>
      </div>`;
    }
  });
  c.innerHTML = html;

  c.querySelectorAll('.nb-device__select').forEach(sel => {
    sel.addEventListener('change', () => {
      nbPath[parseInt(sel.dataset.idx)].id = sel.value;
      renderNBPath();
    });
  });

  c.querySelectorAll('.nb-link__select').forEach(sel => {
    sel.addEventListener('change', () => {
      const idx = parseInt(sel.dataset.idx);
      const newCh = CHANNEL_TYPES.find(ct => ct.id === sel.value);
      nbPath[idx].id = sel.value;
      nbPath[idx].dist = newCh.defaultDist;
      renderNBPath();
    });
  });

  c.querySelectorAll('[data-env-idx]').forEach(sel => {
    sel.addEventListener('change', () => {
      nbPath[parseInt(sel.dataset.envIdx)].env = sel.value;
      renderNBPath();
    });
  });

  c.querySelectorAll('.nb-link__dist input[type="range"]').forEach(slider => {
    slider.addEventListener('input', () => {
      const idx = parseInt(slider.dataset.idx);
      nbPath[idx].dist = parseInt(slider.value);
      renderNBPath();
    });
  });

  c.querySelectorAll('.nb-device__remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      nbPath.splice(idx - 1, 2);
      renderNBPath();
    });
  });
}

export function initNetBuilder() {
  renderNBPresets();
  renderNBPath();

  document.getElementById('nbAddHop').addEventListener('click', () => {
    const lastLinkIdx = nbPath.length - 1;
    nbPath.splice(lastLinkIdx, 0,
      { type: 'device', id: 'switch' },
      { type: 'link', id: 'cat5e', dist: 30 }
    );
    renderNBPath();
  });

  document.getElementById('nbSend').addEventListener('click', async () => {
    const result = document.getElementById('nbResult');
    let totalLatency = 0;
    let totalJitter = 0;
    let bottleneck = Infinity;
    let bottleneckName = '';
    let worstBER = 0;
    let worstSNR = 999;
    let worstQuality = 'excellent';
    const hops = [];
    const usedCh = new Set();
    const qualityOrder = ['dead', 'poor', 'fair', 'good', 'excellent'];

    for (let i = 0; i < nbPath.length; i++) {
      const item = nbPath[i];
      if (item.type === 'link') {
        const ch = CHANNEL_TYPES.find(ct => ct.id === item.id);
        const dist = item.dist || ch.defaultDist;
        const phys = calcChannelPhysics(ch, dist, item.env || 'normal');
        totalLatency += phys.totalDelay;
        totalJitter += ch.jitter;
        usedCh.add(ch.id);
        if (phys.effectiveSpeed < bottleneck) { bottleneck = phys.effectiveSpeed; bottleneckName = ch.name; }
        if (phys.ber > worstBER) worstBER = phys.ber;
        if (phys.snr < worstSNR) worstSNR = phys.snr;
        if (qualityOrder.indexOf(phys.quality) < qualityOrder.indexOf(worstQuality)) worstQuality = phys.quality;
        hops.push({
          icon: ch.icon, name: ch.name, type: 'link', idx: i, ch, dist, phys,
          latency: phys.totalDelay
        });
      } else {
        const dev = NET_DEVICES.find(d => d.id === item.id);
        totalLatency += dev.proc;
        hops.push({ icon: dev.icon, name: dev.name, latency: dev.proc, layer: dev.layer, type: 'device', desc: dev.desc, idx: i });
      }
    }

    usedCh.forEach(id => {
      if (!gameState.usedChannels.includes(id)) {
        gameState.usedChannels.push(id);
        saveGame();
      }
    });
    if (gameState.usedChannels.length >= 5) unlockAchievement('all_channels');

    const berStr = worstBER < 1e-10 ? '< 10⁻¹⁰' : worstBER < 1e-6 ? worstBER.toExponential(0) : worstBER.toExponential(1);

    result.innerHTML = `
      <div class="lab-result__title">Анализ маршрута</div>
      <div class="lab-stats">
        <div class="lab-stat">
          <div class="lab-stat__value">${totalLatency.toFixed(2)} мс</div>
          <div class="lab-stat__label">Общая задержка</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${bottleneck > 0 ? formatSpeed(bottleneck) : '0'}</div>
          <div class="lab-stat__label">Эфф. пропускная способность</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${worstSNR.toFixed(1)} дБ</div>
          <div class="lab-stat__label">Мин. SNR</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${berStr}</div>
          <div class="lab-stat__label">BER (макс.)</div>
        </div>
      </div>
      <div class="lab-stats mt-12">
        <div class="lab-stat">
          <div class="lab-stat__value">${totalJitter.toFixed(2)} мс</div>
          <div class="lab-stat__label">Джиттер (сумм.)</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${signalBarHTML(worstQuality)}</div>
          <div class="lab-stat__label">Качество сигнала</div>
        </div>
      </div>
      <div class="mt-16">
        <div class="lab-result__title">Путь пакета — детали</div>
        ${hops.map((h, idx) => {
          if (h.type === 'device') {
            const dl = h.layer;
            const isEndpoint = dl >= 7;
            const osiActions = {
              1: { action: 'Принимает электрический/оптический сигнал → усиливает → отправляет на все порты', pdu: 'Биты → Биты' },
              2: { action: 'Читает MAC-адрес назначения в кадре → ищет в MAC-таблице → отправляет на нужный порт. Не трогает IP.', pdu: 'Кадр → Кадр (новый L2 на выходе)' },
              3: { action: 'Снимает L2 → читает IP назначения → ищет маршрут → создаёт новый L2 заголовок (новый MAC) → отправляет.', pdu: 'Пакет → Пакет (MAC меняется, IP остаётся)' },
              4: { action: 'Снимает L2-L3 → анализирует порты и флаги TCP/UDP → проверяет правила → пропускает или блокирует.', pdu: 'Сегмент проверен → пакет пересобран' },
              7: { action: 'Полная обработка: L1→L7 декапсуляция / L7→L1 инкапсуляция. Приложение формирует/принимает данные.', pdu: 'Данные ↔ Биты (все 7 уровней)' }
            };
            const osi = osiActions[Math.min(dl, 7)] || osiActions[7];

            return `<div class="nb-result-row" id="nbRes-${idx}">
              <div class="nb-result-row__icon">${h.icon}</div>
              <div class="nb-result-row__text"><strong>${h.name}</strong> — L${dl}</div>
              <div class="nb-result-row__val">${h.latency > 0 ? '+' + h.latency.toFixed(2) + ' мс' : '—'}</div>
            </div>
            <div class="nb-osi-stack">
              ${[7,6,5,4,3,2,1].map(n => {
                const l = OSI_LAYERS.find(x => x.number === n);
                const active = isEndpoint || n <= dl;
                return `<div class="nb-osi-layer${active ? ' active' : ''}" style="background:${l.color}">L${n}</div>`;
              }).join('')}
            </div>
            <div class="nb-osi-action">
              <strong>${isEndpoint ? 'Все уровни L1–L7' : 'Обработка до L' + dl}:</strong> ${osi.action}<br>
              <strong>PDU:</strong> ${osi.pdu}
            </div>`;
          }
          const p = h.phys;
          return `<div class="nb-result-row" id="nbRes-${idx}">
            <div class="nb-result-row__icon">${h.icon}</div>
            <div class="nb-result-row__text"><strong>${h.name}</strong> — ${formatDist(h.dist)}</div>
            <div class="nb-result-row__val">${signalBarHTML(p.quality)}</div>
          </div>
          <div class="nb-chan-detail" id="nbResDet-${idx}">
            <div class="nb-chan-detail__grid">
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Среда</span><span class="nb-chan-detail__val">${h.ch.medium === 'copper' ? 'Медь' : h.ch.medium === 'fiber' ? 'Оптоволокно' : 'Радио'}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Дуплекс</span><span class="nb-chan-detail__val">${h.ch.duplex === 'full' ? 'Full' : 'Half'}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Затухание</span><span class="nb-chan-detail__val">${p.attenTotal.toFixed(1)} дБ</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">SNR</span><span class="nb-chan-detail__val">${p.snr.toFixed(1)} дБ</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Номинал</span><span class="nb-chan-detail__val">${formatSpeed(h.ch.speed)}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Шеннон</span><span class="nb-chan-detail__val">${formatSpeed(p.shannonMbps)}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Эффективная</span><span class="nb-chan-detail__val" style="color:${p.effectiveSpeed < h.ch.speed * 0.5 ? 'var(--l7)' : 'var(--l4)'}">${formatSpeed(p.effectiveSpeed)}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">BER</span><span class="nb-chan-detail__val">${p.ber < 1e-10 ? '< 10⁻¹⁰' : p.ber.toExponential(0)}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Задержка распр.</span><span class="nb-chan-detail__val">${p.propagationDelay.toFixed(3)} мс</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Джиттер</span><span class="nb-chan-detail__val">${h.ch.jitter} мс</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Кодирование</span><span class="nb-chan-detail__val">${h.ch.encoding}</span></div>
              <div class="nb-chan-detail__item"><span class="nb-chan-detail__label">Полоса</span><span class="nb-chan-detail__val">${h.ch.bandwidthMHz >= 1000 ? (h.ch.bandwidthMHz / 1000) + ' ГГц' : h.ch.bandwidthMHz + ' МГц'}</span></div>
            </div>
            ${p.overMax ? `<div style="color:var(--l7);font-weight:700;margin-top:6px">⚠ Расстояние (${formatDist(h.dist)}) превышает макс. дальность (${formatDist(h.ch.maxDist)})</div>` : ''}
            <div class="journey-signal" style="margin-top:6px"><canvas class="nb-sig-canvas" data-snr="${p.snr.toFixed(1)}" data-medium="${h.ch.medium}"></canvas></div>
          </div>`;
        }).join('')}
      </div>
      <div class="card mt-16" style="font-size:.82rem;line-height:1.6">
        <strong>Узкое место:</strong> ${bottleneckName} (${bottleneck > 0 ? formatSpeed(bottleneck) : 'нет сигнала'}).<br>
        ${worstQuality === 'dead' ? '<span style="color:var(--l7)"><strong>Сигнал потерян!</strong> Уменьшите расстояние или выберите канал с меньшим затуханием.</span>' :
          worstQuality === 'poor' ? '<span style="color:var(--l6)"><strong>Слабый сигнал!</strong> Высокая вероятность ошибок. Рекомендуется усилитель или смена канала.</span>' :
          totalLatency > 100 ? '<strong>Высокая задержка!</strong> Для VoIP/игр нужно < 50 мс. Спутниковый канал — основная причина.' :
          totalJitter > 5 ? '<strong>Значительный джиттер.</strong> Буферизация потребуется для потоковых приложений.' :
          'Маршрут в хорошем состоянии.'}
      </div>
    `;

    document.querySelectorAll('.nb-device, .nb-link__line').forEach(el => el.classList.remove('nb-active'));

    for (let i = 0; i < hops.length; i++) {
      await sleep(250);
      const row = document.getElementById('nbRes-' + i);
      if (row) row.classList.add('visible');
      const det = document.getElementById('nbResDet-' + i);
      if (det) det.classList.add('visible');

      const idx = hops[i].idx;
      if (hops[i].type === 'device') {
        const devEl = document.getElementById('nbDev-' + idx);
        if (devEl) devEl.classList.add('nb-active');
      } else {
        const lineEl = document.getElementById('nbLine-' + idx);
        if (lineEl) lineEl.classList.add('nb-active');
      }
    }

    // Draw signal canvases for each link
    const nbMsg = document.getElementById('nbMessage')?.value || getLabText();
    const nbMsgBytes = labData.bytes.length > 0 ? labData.bytes.slice(0, 2) : Array.from(new TextEncoder().encode(nbMsg.slice(0, 2)));
    const nbMsgBits = [];
    nbMsgBytes.forEach(b => { for (let i = 7; i >= 0; i--) nbMsgBits.push((b >> i) & 1); });

    result.querySelectorAll('.nb-sig-canvas').forEach(cv => {
      const snr = parseFloat(cv.dataset.snr);
      const medium = cv.dataset.medium;
      const dpr = window.devicePixelRatio || 1;
      const rect = cv.getBoundingClientRect();
      cv.width = rect.width * dpr;
      cv.height = 60 * dpr;
      cv.style.height = '60px';
      const ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);
      const cw = rect.width, ch = 60;
      const mid = ch / 2;
      const bitW = cw / nbMsgBits.length;

      ctx.clearRect(0, 0, cw, ch);
      ctx.setLineDash([3,3]); ctx.strokeStyle = '#1a203050'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(cw, mid); ctx.stroke(); ctx.setLineDash([]);

      const rxAmp = Math.max(Math.min(snr / 40, 1), 0.05);
      const noiseLevel = Math.max(0.01, 0.5 - snr / 60);
      const color = snr > 20 ? '#2ecc71' : snr > 10 ? '#f1c40f' : '#e74c3c';

      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath();
      if (medium === 'radio') {
        for (let x = 0; x < cw; x++) {
          const sIdx = Math.min(Math.floor(x / bitW), nbMsgBits.length - 1);
          const bit = nbMsgBits[sIdx];
          const freq = bit ? 0.22 : 0.1;
          const noise = (Math.random() - 0.5) * 2 * noiseLevel * ch * 0.3;
          const y = mid + Math.sin(x * freq) * ch * 0.3 * rxAmp + noise;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      } else {
        for (let x = 0; x < cw; x++) {
          const sIdx = Math.min(Math.floor(x / bitW), nbMsgBits.length - 1);
          const bit = nbMsgBits[sIdx];
          const val = bit ? 1 : -1;
          const noise = (Math.random() - 0.5) * 2 * noiseLevel * ch * 0.3;
          const y = mid - val * ch * 0.3 * rxAmp + noise;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.fillStyle = '#4a5568'; ctx.font = '8px sans-serif';
      ctx.fillText(medium === 'radio' ? 'FSK модуляция' : medium === 'fiber' ? 'OOK (свет)' : 'NRZ напряжение', 4, 10);
      ctx.fillText(`SNR: ${snr.toFixed(0)} дБ`, cw - 60, 10);
    });

    unlockAchievement('net_builder');
    addXP(5);
  });
}
