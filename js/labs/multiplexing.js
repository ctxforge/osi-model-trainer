import { onLabDataChange } from '../core/lab-data.js';

export function initMuxLab() {
  const container = document.getElementById('muxUI');
  let muxType = 'tdm';
  const devColors = ['#e74c3c','#3498db','#2ecc71','#e67e22','#9b59b6','#1abc9c'];
  const devNames = ['Браузер','Почта','Видео','Игра','VoIP','Торрент'];
  let muxDevCount = 4;

  const MUX_TYPES = {
    tdm: { name: 'TDM — Time Division', full: 'Временное мультиплексирование',
      desc: 'Каждому устройству/потоку выделяется фиксированный временной слот. Все по очереди. Даже если устройству нечего передавать — слот пустует. Используется в T1/E1 (телефония), GSM.',
      how: 'Кабель: 1 → время делится на слоты → каждый получает свою долю секунды' },
    fdm: { name: 'FDM — Frequency Division', full: 'Частотное мультиплексирование',
      desc: 'Полоса частот делится на каналы, каждый передаёт на своей частоте одновременно. Радиостанции, кабельное ТВ, ADSL. Защитные полосы (guard bands) предотвращают интерференцию.',
      how: 'Кабель/эфир: 1 → частотный спектр делится → каждый на своей частоте' },
    ofdma: { name: 'OFDMA — Orthogonal FDM', full: 'Ортогональное частотное мультиплексирование',
      desc: 'Множество узких поднесущих (subcarriers) распределяются между устройствами. Поднесущие ортогональны → нет интерференции, нет guard bands. Wi-Fi 6 (802.11ax), LTE, 5G.',
      how: 'Эфир: сотни поднесущих → группы назначаются устройствам → параллельная передача' },
    csma: { name: 'CSMA/CA — Collision Avoidance', full: 'Множественный доступ с контролем несущей',
      desc: 'Все устройства делят один канал. Перед передачей слушают: занят → ждут случайное время (backoff). Свободен → передают. Если коллизия → повторяют с увеличенным backoff. Wi-Fi использует CSMA/CA.',
      how: 'Эфир: 1 канал → слушай → жди → передавай → надейся что не столкнёшься' },
    ports: { name: 'Порты TCP/UDP', full: 'Мультиплексирование через порты',
      desc: 'Один IP-адрес, один кабель — но каждое приложение использует свой порт (0-65535). ОС смотрит порт назначения в пакете и направляет данные нужному приложению. Это L4 — транспортный уровень.',
      how: 'Браузер :443 | Почта :993 | SSH :22 | DNS :53 — все через один кабель' }
  };

  let muxAnimId = null;

  function drawMux(canvas) {
    if (muxAnimId) cancelAnimationFrame(muxAnimId);
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    canvas.style.height = '200px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const w = rect.width, h = 200;
    const n = muxDevCount;

    let startTime = performance.now();

    function frame(now) {
      const t = (now - startTime) / 1000;
      ctx.clearRect(0, 0, w, h);

    if (muxType === 'tdm') {
      ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
      ctx.fillText('Время →', w - 45, 12);
      const slotW = w / (n * 3);
      for (let round = 0; round < 3; round++) {
        for (let d = 0; d < n; d++) {
          const x = (round * n + d) * slotW;
          ctx.fillStyle = devColors[d] + '30';
          ctx.fillRect(x + 1, 20, slotW - 2, h - 30);
          ctx.fillStyle = devColors[d];
          const dataH = 20 + Math.random() * (h - 60);
          ctx.fillRect(x + 3, h - 10 - dataH, slotW - 6, dataH);
          if (round === 0) { ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(devNames[d]?.charAt(0) || d, x + slotW / 2, h - 16 - dataH); ctx.textAlign = 'left'; }
        }
      }
    } else if (muxType === 'fdm' || muxType === 'ofdma') {
      ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
      ctx.fillText('Частота ↕', 2, 12); ctx.fillText('Время →', w - 45, 12);
      const bandH = (h - 30) / n;
      const guardH = muxType === 'fdm' ? 4 : 0;
      for (let d = 0; d < n; d++) {
        const y = 20 + d * bandH;
        ctx.fillStyle = devColors[d] + '20';
        ctx.fillRect(0, y + guardH, w, bandH - guardH * 2);
        for (let x = 0; x < w; x += 2) {
          const amp = (Math.sin(x * 0.05 * (d + 1)) * 0.5 + 0.5) * (bandH - guardH * 2 - 4);
          ctx.fillStyle = devColors[d] + '90';
          ctx.fillRect(x, y + guardH + (bandH - guardH * 2) / 2 - amp / 2, 1.5, amp);
        }
        ctx.fillStyle = devColors[d]; ctx.font = 'bold 9px sans-serif';
        ctx.fillText(devNames[d] || 'Dev ' + d, 4, y + bandH / 2 + 3);
      }
      if (muxType === 'fdm') {
        ctx.fillStyle = '#6c7a9640'; ctx.font = '7px sans-serif';
        for (let d = 1; d < n; d++) { const y = 20 + d * bandH; ctx.fillRect(0, y - 2, w, 4); }
      }
    } else if (muxType === 'csma') {
      ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
      ctx.fillText('Время →', w - 45, 12);
      const laneH = (h - 20) / n;
      let xPos = 0;
      const events = [];
      for (let t = 0; t < 12 && xPos < w; t++) {
        const dev = Math.floor(Math.random() * n);
        const waitW = 8 + Math.random() * 15;
        const txW = 15 + Math.random() * 25;
        events.push({ dev, x: xPos, waitW, txW });
        xPos += waitW + txW + 3;
      }
      for (let d = 0; d < n; d++) {
        const y = 20 + d * laneH;
        ctx.fillStyle = devColors[d] + '08';
        ctx.fillRect(0, y, w, laneH - 2);
        ctx.fillStyle = devColors[d]; ctx.font = '8px sans-serif';
        ctx.fillText(devNames[d] || '', 2, y + laneH / 2 + 3);
      }
      events.forEach(ev => {
        const y = 20 + ev.dev * laneH;
        ctx.fillStyle = '#f1c40f30';
        ctx.fillRect(ev.x, y, ev.waitW, laneH - 2);
        ctx.fillStyle = devColors[ev.dev];
        ctx.fillRect(ev.x + ev.waitW, y, ev.txW, laneH - 2);
      });
      ctx.fillStyle = '#6c7a96'; ctx.font = '8px sans-serif';
      ctx.fillText('█ передача   ░ ожидание (backoff)', 4, h - 4);
    } else if (muxType === 'ports') {
      const portApps = [
        { port: 443, app: 'Браузер (HTTPS)', proto: 'TCP' },
        { port: 993, app: 'Почта (IMAPS)', proto: 'TCP' },
        { port: 53, app: 'DNS', proto: 'UDP' },
        { port: 22, app: 'SSH', proto: 'TCP' },
        { port: 5060, app: 'VoIP (SIP)', proto: 'UDP' },
        { port: 51820, app: 'VPN (WireGuard)', proto: 'UDP' }
      ].slice(0, n);
      const rowH = (h - 20) / portApps.length;
      ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
      ctx.fillText('1 IP-адрес, 1 кабель →', w / 2 - 50, 12);
      portApps.forEach((p, i) => {
        const y = 20 + i * rowH;
        ctx.fillStyle = devColors[i] + '15';
        ctx.fillRect(0, y, w, rowH - 2);
        ctx.fillStyle = devColors[i];
        ctx.fillRect(0, y, 4, rowH - 2);
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`:${p.port}`, 10, y + rowH / 2 + 4);
        ctx.font = '10px sans-serif';
        ctx.fillText(`${p.app}`, 65, y + rowH / 2 + 4);
        ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
        ctx.fillText(p.proto, w - 30, y + rowH / 2 + 4);
      });
    }

    // Animated time cursor for TDM/CSMA/FDM
    if (muxType !== 'ports') {
      const cursorX = ((t * 40) % w);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(cursorX, 16); ctx.lineTo(cursorX, h - 4); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath(); ctx.arc(cursorX, 16, 4, 0, Math.PI * 2); ctx.fill();
    }

    muxAnimId = requestAnimationFrame(frame);
    }
    muxAnimId = requestAnimationFrame(frame);
  }

  function render() {
    const mt = MUX_TYPES[muxType];
    container.innerHTML = `
      <div class="sig-tabs">
        ${Object.entries(MUX_TYPES).map(([k, v]) => `<button class="sig-tab${k === muxType ? ' active' : ''}" data-mux="${k}">${v.name.split('—')[0].trim()}</button>`).join('')}
      </div>
      <div class="mux-devices">
        ${Array.from({length: muxDevCount}, (_, i) => `<div class="mux-device" style="background:${devColors[i]}20;border-color:${devColors[i]}"><div class="mux-device__dot" style="background:${devColors[i]}"></div>${devNames[i]}</div>`).join('')}
      </div>
      <div style="display:flex;gap:6px;margin-bottom:10px">
        <button class="dnd-btn" id="muxRemDev" style="flex:1;padding:8px;font-size:.75rem"${muxDevCount <= 2 ? ' disabled' : ''}>− Устройство</button>
        <button class="dnd-btn" id="muxAddDev" style="flex:1;padding:8px;font-size:.75rem"${muxDevCount >= 6 ? ' disabled' : ''}>+ Устройство</button>
      </div>
      <div class="mux-visual"><canvas id="muxCanvas"></canvas></div>
      <div class="card" style="font-size:.82rem;line-height:1.7">
        <strong>${mt.full}</strong><br>${mt.desc}<br><br>
        <strong>Принцип:</strong> ${mt.how}
      </div>
      ${muxType === 'ports' ? `<div class="card mt-12" style="font-size:.78rem;line-height:1.6">
        <strong>Как это работает:</strong> Когда ваш браузер открывает google.com, ОС назначает ему случайный порт (например, 52341). Пакет уходит на сервер: <code>192.168.1.100:52341 → 142.250.74.78:443</code>. Когда ответ приходит на :52341, ОС знает — это для браузера. Одновременно почта работает через :993, SSH через :22 — все по одному кабелю, но каждый на своём порту.
      </div>` : ''}
      ${muxType === 'csma' ? `<div class="card mt-12" style="font-size:.78rem;line-height:1.6">
        <strong>Почему Wi-Fi замедляется при множестве устройств?</strong><br>
        CSMA/CA — полудуплекс: в один момент передаёт только одно устройство. Остальные ждут. Чем больше устройств — тем больше коллизий, backoff и ожидания. Wi-Fi 6 (OFDMA) решает это: даёт каждому устройству свои поднесущие, как мини-канал.
      </div>` : ''}
    `;
    drawMux(document.getElementById('muxCanvas'));
    container.querySelectorAll('[data-mux]').forEach(t => t.addEventListener('click', () => { if (muxAnimId) cancelAnimationFrame(muxAnimId); muxType = t.dataset.mux; render(); }));
    document.getElementById('muxAddDev')?.addEventListener('click', () => { if (muxDevCount < 6) { muxDevCount++; render(); } });
    document.getElementById('muxRemDev')?.addEventListener('click', () => { if (muxDevCount > 2) { muxDevCount--; render(); } });
  }

  const obs = new MutationObserver(() => { if (document.getElementById('lab-multiplexing')?.classList.contains('active') && !container.children.length) render(); });
  obs.observe(document.getElementById('lab-multiplexing'), { attributes: true, attributeFilter: ['class'] });
  setTimeout(() => { if (document.getElementById('lab-multiplexing')?.classList.contains('active')) render(); }, 100);
  onLabDataChange(() => { if (document.getElementById('lab-multiplexing')?.classList.contains('active')) render(); });
}
