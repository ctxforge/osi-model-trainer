import { CHANNEL_TYPES } from '../data/channels.js';
import { labData, getLabText, getLabBits, onLabDataChange } from '../core/lab-data.js';
import { drawLineCode, drawModulation } from './signals-canvas.js';

export function initSignalsLab() {
  const container = document.getElementById('signalsUI');
  let sigText = '';
  let sigAnimId = null;
  let sigEncoding = 'nrz';
  let sigModulation = 'ask';
  let sigView = 'line';
  let sigChannel = 'cat5e';

  const LINE_CODES = {
    nrz:        { name: 'NRZ (Non-Return-to-Zero)', desc: 'Простейший код: 1 = высокий уровень, 0 = низкий. Используется в RS-232. Проблема: длинные последовательности одинаковых битов — потеря синхронизации.', where: 'RS-232, UART' },
    nrzi:       { name: 'NRZ-I (Inverted)', desc: 'При «1» сигнал меняет уровень, при «0» остаётся. Решает проблему длинных серий единиц. Используется в USB, FDDI.', where: 'USB, FDDI, 4B5B+NRZI' },
    manchester:  { name: 'Manchester (IEEE)', desc: 'Переход в середине каждого бита: вверх = 1, вниз = 0. Самосинхронизирующийся — тактовый сигнал встроен. Ethernet 10BASE-T.', where: '10BASE-T Ethernet' },
    diffmanch:   { name: 'Differential Manchester', desc: 'Переход в середине всегда. Переход на границе бита = 0, нет перехода = 1. Используется в Token Ring.', where: 'Token Ring' },
    ami:        { name: 'AMI (Alternate Mark Inversion)', desc: '0 = нулевой уровень, 1 = чередование +V и −V. Нет DC-составляющей. Проблема с длинными нулями.', where: 'T1/E1, ISDN' },
    pam4:       { name: 'PAM-4 (4 уровня)', desc: '4 уровня напряжения: −3V, −1V, +1V, +3V. Каждый символ = 2 бита. Удваивает пропускную способность при той же полосе.', where: '100GBASE-T, 400G Ethernet, PCIe 6.0' }
  };

  const MOD_TYPES = {
    ask:  { name: 'ASK (Amplitude)', desc: 'Амплитуда несущей изменяется: 1 = полная амплитуда, 0 = малая. Простейшая модуляция. Чувствительна к помехам.', bps: 1 },
    fsk:  { name: 'FSK (Frequency)', desc: 'Частота несущей изменяется: 1 = высокая частота, 0 = низкая. Устойчивее к помехам чем ASK. Модемы, Bluetooth.', bps: 1 },
    bpsk: { name: 'BPSK (Phase)', desc: 'Фаза несущей: 1 = 0°, 0 = 180° (инверсия). 1 бит на символ. Очень устойчива к шуму. Wi-Fi на слабом сигнале.', bps: 1 },
    qpsk: { name: 'QPSK (4 фазы)', desc: '4 значения фазы (0°, 90°, 180°, 270°). 2 бита на символ. Удвоение скорости при той же полосе. DVB-S, LTE.', bps: 2 },
    qam16:{ name: 'QAM-16', desc: '16 комбинаций амплитуды и фазы. 4 бита на символ. Кабельное ТВ, Wi-Fi на среднем сигнале.', bps: 4 },
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
