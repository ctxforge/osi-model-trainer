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
      how: 'Браузер :443 | Почта :993 | SSH :22 | DNS :53 — все через один кабель' },
    wdm: { name: 'WDM/DWDM — Wavelength', full: 'Волновое мультиплексирование (WDM / DWDM)',
      desc: 'Каждый канал передаёт на своей длине волны (цвете) света через одно оптоволокно. CWDM: 20 нм между каналами, до 18 каналов. DWDM: 0.8/0.4/0.2 нм (100/50/25 ГГц), до 96+ каналов в C-диапазоне (1530–1565 нм). Используется в магистральных оптических сетях.',
      how: 'Волокно: 1 → лазеры на разных λ → мультиплексор → волокно → демультиплексор → разделение по λ' },
    cdm: { name: 'CDM/CDMA — Code Division', full: 'Кодовое мультиплексирование (CDMA)',
      desc: 'Каждый пользователь передаёт одновременно на одной частоте, но использует уникальный ортогональный код (код Уолша). Сигнал «размазывается» по широкой полосе. Приёмник умножает на тот же код и восстанавливает данные. Кросс-корреляция ортогональных кодов = 0. Используется в 3G (WCDMA), GPS.',
      how: 'Эфир: все одновременно → каждый × свой код → сумма в канале → приёмник × код → данные' },
    statmux: { name: 'Стат. мультипл.', full: 'Статистическое мультиплексирование',
      desc: 'Общий канал разделяется динамически: кто передаёт — тот и получает полосу. Буфер (очередь) сглаживает всплески. В отличие от TDM, пустые слоты не пропадают — канал используется эффективнее. Основа Ethernet, IP-сетей, Frame Relay, ATM.',
      how: 'Источники → буфер/очередь → общий канал. Кто активен — тот передаёт. Нет пустых слотов.' }
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
    } else if (muxType === 'wdm') {
      // --- WDM / DWDM visualization ---
      const wdmChannels = Math.min(n, 6);
      const lambdaColors = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6'];
      const lambdaNm = [1530, 1535, 1540, 1545, 1550, 1555]; // C-band wavelengths

      // Draw fiber cross-section on the left
      const fiberCx = 50, fiberCy = h / 2, fiberR = 35;
      // Cladding
      ctx.beginPath(); ctx.arc(fiberCx, fiberCy, fiberR + 8, 0, Math.PI * 2);
      ctx.fillStyle = '#34495e'; ctx.fill();
      ctx.fillStyle = '#6c7a96'; ctx.font = '7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('оболочка', fiberCx, fiberCy + fiberR + 18); ctx.textAlign = 'left';
      // Core
      ctx.beginPath(); ctx.arc(fiberCx, fiberCy, fiberR, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a2e'; ctx.fill();
      // Wavelengths inside the core as dots
      for (let i = 0; i < wdmChannels; i++) {
        const angle = (Math.PI * 2 / wdmChannels) * i + t * 0.5;
        const r = fiberR * 0.55;
        const cx = fiberCx + Math.cos(angle) * r;
        const cy = fiberCy + Math.sin(angle) * r;
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = lambdaColors[i]; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#6c7a96'; ctx.font = '7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('сердцевина', fiberCx, fiberCy + fiberR + 26); ctx.textAlign = 'left';

      // Draw wavelength lanes on the right
      const laneLeft = 110, laneW = w - laneLeft - 10;
      const laneH2 = (h - 30) / wdmChannels;
      ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
      ctx.fillText('λ (нм)  Каналы DWDM →', laneLeft, 14);
      for (let i = 0; i < wdmChannels; i++) {
        const y = 20 + i * laneH2;
        ctx.fillStyle = lambdaColors[i] + '15';
        ctx.fillRect(laneLeft, y, laneW, laneH2 - 2);
        // Sine wave for each wavelength
        ctx.strokeStyle = lambdaColors[i]; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.8;
        ctx.beginPath();
        for (let x = 0; x < laneW; x++) {
          const freq = 0.03 * (i + 2);
          const amp = (laneH2 - 8) / 2 * 0.7;
          const py = y + laneH2 / 2 + Math.sin((x + t * 60) * freq) * amp;
          x === 0 ? ctx.moveTo(laneLeft + x, py) : ctx.lineTo(laneLeft + x, py);
        }
        ctx.stroke(); ctx.globalAlpha = 1;
        // Label
        ctx.fillStyle = lambdaColors[i]; ctx.font = 'bold 9px monospace';
        ctx.fillText(`${lambdaNm[i]} нм`, laneLeft + 4, y + 12);
        ctx.font = '8px sans-serif'; ctx.fillStyle = '#8899aa';
        ctx.fillText(`100 ГГц`, laneLeft + laneW - 48, y + 12);
      }
      // Total bandwidth info
      const totalBw = wdmChannels * 10;
      ctx.fillStyle = '#2ecc71'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`${wdmChannels} × 10 Гбит/с = ${totalBw} Гбит/с суммарно`, laneLeft + 4, h - 4);

    } else if (muxType === 'cdm') {
      // --- CDM / CDMA visualization ---
      const users = Math.min(n, 4);
      // Walsh codes for 4 users (length 4)
      const walshCodes = [[1,1,1,1],[1,-1,1,-1],[1,1,-1,-1],[1,-1,-1,1]].slice(0, users);
      const cdmColors = devColors.slice(0, users);
      const cdmNames = ['Польз. A','Польз. B','Польз. C','Польз. D'];
      // Data bits cycle over time for animation
      const bitCycle = Math.floor(t) % 4;
      const dataBitPatterns = [[1,-1,1,-1],[-1,1,-1,1],[1,1,-1,-1],[-1,-1,1,1]];
      const dataBits = dataBitPatterns[bitCycle];

      const colW = w / 5; // 5 columns: data | code | spread | sum | despread
      const rowH = (h - 28) / users;
      const labels = ['Бит','Код Уолша','Размазанный','Сумма','Восстановл.'];

      // Column headers
      ctx.fillStyle = '#6c7a96'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      for (let c = 0; c < 5; c++) ctx.fillText(labels[c], colW * c + colW / 2, 12);
      ctx.textAlign = 'left';

      // Compute spread signals and sum
      const spreadSignals = [];
      for (let u = 0; u < users; u++) {
        spreadSignals.push(walshCodes[u].map(c => dataBits[u] * c));
      }
      const sumSignal = [0,0,0,0];
      for (let u = 0; u < users; u++) for (let j = 0; j < 4; j++) sumSignal[j] += spreadSignals[u][j];

      for (let u = 0; u < users; u++) {
        const y = 20 + u * rowH;
        const midY = y + rowH / 2;
        ctx.fillStyle = cdmColors[u]; ctx.font = '8px sans-serif';
        ctx.fillText(cdmNames[u], 2, midY + 3);

        // Col 0: data bit
        const chipW = (colW - 16) / 4;
        ctx.fillStyle = dataBits[u] > 0 ? cdmColors[u] : cdmColors[u] + '50';
        ctx.fillRect(colW * 0 + 8, midY - 8, colW - 16, 16);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(dataBits[u] > 0 ? '+1' : '-1', colW * 0 + colW / 2, midY + 4); ctx.textAlign = 'left';

        // Col 1: Walsh code chips
        for (let j = 0; j < 4; j++) {
          const cx = colW * 1 + 8 + j * chipW;
          ctx.fillStyle = walshCodes[u][j] > 0 ? '#2ecc71' : '#e74c3c';
          ctx.fillRect(cx, midY - 8, chipW - 2, 16);
          ctx.fillStyle = '#fff'; ctx.font = '7px monospace'; ctx.textAlign = 'center';
          ctx.fillText(walshCodes[u][j] > 0 ? '+1' : '-1', cx + chipW / 2, midY + 3); ctx.textAlign = 'left';
        }

        // Col 2: spread signal (data × code)
        for (let j = 0; j < 4; j++) {
          const cx = colW * 2 + 8 + j * chipW;
          const val = spreadSignals[u][j];
          ctx.fillStyle = val > 0 ? cdmColors[u] : cdmColors[u] + '40';
          ctx.fillRect(cx, midY - 8, chipW - 2, 16);
          ctx.fillStyle = '#fff'; ctx.font = '7px monospace'; ctx.textAlign = 'center';
          ctx.fillText(val > 0 ? '+1' : '-1', cx + chipW / 2, midY + 3); ctx.textAlign = 'left';
        }

        // Col 4: despread (sum × code / N)
        let despreadVal = 0;
        for (let j = 0; j < 4; j++) despreadVal += sumSignal[j] * walshCodes[u][j];
        despreadVal /= 4;
        ctx.fillStyle = despreadVal > 0 ? cdmColors[u] : cdmColors[u] + '50';
        ctx.fillRect(colW * 4 + 8, midY - 8, colW - 16, 16);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(despreadVal > 0 ? '+1' : '-1', colW * 4 + colW / 2, midY + 4); ctx.textAlign = 'left';
      }

      // Col 3: combined sum signal (shared column)
      const sumMidY = 20 + (users * rowH) / 2;
      const sumChipW = (colW - 16) / 4;
      for (let j = 0; j < 4; j++) {
        const cx = colW * 3 + 8 + j * sumChipW;
        const val = sumSignal[j];
        const intensity = Math.abs(val) / users;
        ctx.fillStyle = val >= 0 ? `rgba(46,204,113,${0.3 + intensity * 0.7})` : `rgba(231,76,60,${0.3 + intensity * 0.7})`;
        ctx.fillRect(cx, sumMidY - 14, sumChipW - 2, 28);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(val > 0 ? `+${val}` : `${val}`, cx + sumChipW / 2, sumMidY + 4); ctx.textAlign = 'left';
      }

      // Arrow indicators between columns
      ctx.strokeStyle = '#6c7a96'; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
      for (let c = 0; c < 4; c++) {
        const ax = colW * (c + 1) + 2;
        ctx.beginPath(); ctx.moveTo(ax, h * 0.3); ctx.lineTo(ax + 4, h * 0.5); ctx.lineTo(ax, h * 0.7); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Animated highlight: pulse on the despread column
      const pulseAlpha = 0.15 + 0.1 * Math.sin(t * 3);
      ctx.fillStyle = `rgba(46,204,113,${pulseAlpha})`;
      ctx.fillRect(colW * 4, 18, colW, h - 22);

    } else if (muxType === 'statmux') {
      // --- Statistical Multiplexing visualization ---
      const sources = Math.min(n, 6);
      const bufferSize = 8;
      // Pseudo-random bursty traffic per source
      const seed = Math.floor(t * 2);

      // Layout: sources on left, buffer in middle, output on right
      const srcW = 80, bufX = srcW + 30, bufW = 50, outX = bufX + bufW + 30;
      const srcRowH = (h - 30) / sources;

      ctx.fillStyle = '#6c7a96'; ctx.font = '9px sans-serif';
      ctx.fillText('Источники', 4, 14);
      ctx.fillText('Буфер', bufX + 4, 14);
      ctx.fillText('Выход →', outX, 14);

      // Draw sources with bursty activity
      const buffer = [];
      for (let s = 0; s < sources; s++) {
        const y = 22 + s * srcRowH;
        ctx.fillStyle = devColors[s] + '15';
        ctx.fillRect(0, y, srcW, srcRowH - 3);
        ctx.fillStyle = devColors[s]; ctx.font = '8px sans-serif';
        ctx.fillText(devNames[s] || `Src ${s}`, 4, y + srcRowH / 2 + 3);

        // Bursty packets (pseudo-random based on time)
        const burstPhase = Math.sin(seed * 0.7 + s * 2.1) > 0;
        const pktsNow = burstPhase ? 2 + Math.floor(Math.abs(Math.sin(seed * 0.3 + s * 1.7)) * 3) : 0;
        for (let p = 0; p < pktsNow && p < 4; p++) {
          const px = srcW - 12 - p * 14;
          ctx.fillStyle = devColors[s];
          ctx.fillRect(px, y + 4, 10, srcRowH - 11);
          // Arrow to buffer
          if (p === 0) {
            ctx.strokeStyle = devColors[s]; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
            ctx.beginPath(); ctx.moveTo(srcW + 2, y + srcRowH / 2);
            ctx.lineTo(bufX - 2, y + srcRowH / 2); ctx.stroke(); ctx.globalAlpha = 1;
          }
        }
        if (burstPhase && buffer.length < bufferSize) {
          buffer.push(s);
        }
      }

      // Fill buffer with more packets based on time
      const extraPkts = Math.floor(t * 3) % (sources + 2);
      for (let i = 0; i < extraPkts && buffer.length < bufferSize; i++) {
        buffer.push(Math.floor(Math.abs(Math.sin(t + i * 1.3)) * sources));
      }

      // Draw buffer / queue
      ctx.strokeStyle = '#6c7a96'; ctx.lineWidth = 2;
      ctx.strokeRect(bufX, 22, bufW, h - 30);
      ctx.fillStyle = '#0d1117'; ctx.fillRect(bufX + 1, 23, bufW - 2, h - 32);
      const pktH = (h - 34) / bufferSize;
      for (let i = 0; i < buffer.length; i++) {
        const py = h - 10 - (i + 1) * pktH;
        ctx.fillStyle = devColors[buffer[i]];
        ctx.fillRect(bufX + 4, py, bufW - 8, pktH - 2);
      }
      // Buffer fill indicator
      const fillPct = Math.round(buffer.length / bufferSize * 100);
      ctx.fillStyle = fillPct > 75 ? '#e74c3c' : fillPct > 50 ? '#e67e22' : '#2ecc71';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`${fillPct}%`, bufX + bufW / 2 - 10, h - 2);

      // Draw output stream
      const outW = w - outX - 10;
      ctx.strokeStyle = '#6c7a96'; ctx.lineWidth = 1;
      ctx.strokeRect(outX, 22, outW, h - 30);
      // Packets leaving the buffer, streaming right
      const outPktW = 14;
      const outPkts = Math.min(Math.floor(outW / (outPktW + 2)), 12);
      for (let i = 0; i < outPkts; i++) {
        const srcIdx = Math.floor(Math.abs(Math.sin((t * 2 + i) * 0.8)) * sources);
        const ox = outX + 4 + i * (outPktW + 2);
        const scrollOffset = (t * 40) % (outPktW + 2);
        const finalX = ox - scrollOffset;
        if (finalX >= outX && finalX + outPktW <= outX + outW) {
          ctx.fillStyle = devColors[srcIdx];
          ctx.fillRect(finalX, 30, outPktW, h - 48);
        }
      }

      // Comparison bar at bottom: TDM vs StatMux utilization
      const barY = h - 8;
      ctx.fillStyle = '#6c7a96'; ctx.font = '7px sans-serif';
      const activeSrc = buffer.length > 0 ? Math.min(sources, buffer.length) : 1;
      const tdmUtil = Math.round((activeSrc / sources) * 60 + 20);
      const statUtil = Math.min(98, tdmUtil + 20 + Math.floor(Math.abs(Math.sin(t)) * 10));
      ctx.fillText(`TDM: ~${tdmUtil}% | Стат.мукс: ~${statUtil}% использования канала`, outX + 4, barY);

    }

    // Animated time cursor for TDM/CSMA/FDM
    if (['tdm','fdm','ofdma','csma'].includes(muxType)) {
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
      ${muxType === 'wdm' ? `<div class="card mt-12" style="font-size:.78rem;line-height:1.6">
        <strong>CWDM vs DWDM:</strong><br>
        <strong>CWDM</strong> (Coarse) — расстояние между каналами 20 нм, до 18 каналов (1270–1610 нм). Дешевле, без охлаждения лазеров. Для коротких расстояний (до 80 км).<br>
        <strong>DWDM</strong> (Dense) — расстояние 0.8 нм (100 ГГц) или меньше. До 96 каналов в C-диапазоне (1530–1565 нм). Каждый канал 10/40/100 Гбит/с. Суммарно до 9.6 Тбит/с на одном волокне. Используется на магистралях (тысячи км с EDFA-усилителями).<br><br>
        <strong>ITU-T сетка частот:</strong> Стандарт G.694.1 определяет точные частоты каналов. Центральная частота C-диапазона: 193.1 ТГц (1552.52 нм). Шаг: 100 ГГц (DWDM), 50 ГГц (Dense DWDM), 25 ГГц (Ultra-Dense).
      </div>` : ''}
      ${muxType === 'cdm' ? `<div class="card mt-12" style="font-size:.78rem;line-height:1.6">
        <strong>Как работают коды Уолша:</strong><br>
        Каждый пользователь получает уникальный код длины N. Бит данных (+1 или -1) умножается на код — сигнал «размазывается» по N чипам. Все пользователи передают одновременно, их сигналы складываются в эфире. Приёмник умножает сумму на код нужного пользователя и суммирует: ортогональные коды дают 0 (подавление), а код «своего» пользователя — исходный бит.<br><br>
        <strong>Кросс-корреляция = 0:</strong> Для любых двух разных кодов Уолша W<sub>i</sub> и W<sub>j</sub>: &sum;(W<sub>i</sub>[k] &times; W<sub>j</sub>[k]) = 0. Именно это позволяет разделять пользователей без интерференции.
      </div>` : ''}
      ${muxType === 'statmux' ? `<div class="card mt-12" style="font-size:.78rem;line-height:1.6">
        <strong>Почему стат. мультиплексирование эффективнее TDM:</strong><br>
        В TDM каждый источник получает фиксированный слот — даже если ему нечего передавать. При пульсирующем (bursty) трафике большая часть слотов пустует. Статистическое мультиплексирование выделяет канал по требованию: кто активен — тот передаёт. Буфер сглаживает пики.<br><br>
        <strong>Формула выигрыша:</strong> Если каждый из N источников активен с вероятностью p, TDM даёт каждому 1/N полосы. Стат. мукс даёт активному источнику до 100% полосы. При p=0.1 и N=10: TDM утилизация ~10%, стат. мукс ~95%.<br><br>
        <strong>Риск:</strong> Если все источники активны одновременно — буфер переполняется, пакеты теряются. Поэтому нужен QoS и контроль потока.
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
