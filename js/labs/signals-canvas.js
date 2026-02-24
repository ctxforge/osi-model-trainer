/* Canvas drawing functions for signals lab */

export function setupCanvas(canvas, h) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = h * dpr;
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, w: rect.width, h };
}

export function drawLineCode(canvas, bits, type) {
  const { ctx, w, h } = setupCanvas(canvas, 120);
  const bitW = w / bits.length;
  const mid = h / 2;
  const amp = h * 0.35;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = '#1a2030';
  ctx.lineWidth = 1;
  for (let i = 0; i <= bits.length; i++) {
    ctx.beginPath(); ctx.moveTo(i * bitW, 0); ctx.lineTo(i * bitW, h); ctx.stroke();
  }
  ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke(); ctx.setLineDash([]);

  ctx.fillStyle = '#4a5568'; ctx.font = '9px sans-serif';
  if (type === 'pam4') {
    ['+3V','+1V','−1V','−3V'].forEach((l, i) => ctx.fillText(l, 2, mid - amp + i * (amp * 2 / 3) + 4));
  } else {
    ctx.fillText('+V', 2, mid - amp + 10); ctx.fillText('0', 2, mid + 3); ctx.fillText('−V', 2, mid + amp - 2);
  }

  ctx.fillStyle = '#6c7a96'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
  bits.forEach((b, i) => ctx.fillText(b, i * bitW + bitW / 2, 12));
  ctx.textAlign = 'left';

  ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2.5; ctx.beginPath();
  let prevLevel = 0;
  let amiPolarity = 1;

  for (let i = 0; i < bits.length; i++) {
    const x0 = i * bitW;
    const x1 = (i + 1) * bitW;
    const xm = x0 + bitW / 2;
    const b = bits[i];

    if (type === 'nrz') {
      const y = b ? mid - amp : mid + amp;
      if (i === 0) ctx.moveTo(x0, y);
      else ctx.lineTo(x0, y);
      ctx.lineTo(x1, y);
    } else if (type === 'nrzi') {
      if (b) prevLevel = prevLevel === 0 ? 1 : 0;
      const y = prevLevel ? mid - amp : mid + amp;
      if (i === 0) ctx.moveTo(x0, y);
      else ctx.lineTo(x0, y);
      ctx.lineTo(x1, y);
    } else if (type === 'manchester') {
      const yH = mid - amp, yL = mid + amp;
      if (b) {
        if (i === 0) ctx.moveTo(x0, yL); else ctx.lineTo(x0, yL);
        ctx.lineTo(xm, yL); ctx.lineTo(xm, yH); ctx.lineTo(x1, yH);
      } else {
        if (i === 0) ctx.moveTo(x0, yH); else ctx.lineTo(x0, yH);
        ctx.lineTo(xm, yH); ctx.lineTo(xm, yL); ctx.lineTo(x1, yL);
      }
    } else if (type === 'diffmanch') {
      const yH = mid - amp, yL = mid + amp;
      if (b === 0) prevLevel = prevLevel ? 0 : 1;
      const startY = prevLevel ? yH : yL;
      const endY = prevLevel ? yL : yH;
      if (i === 0) ctx.moveTo(x0, startY); else ctx.lineTo(x0, startY);
      ctx.lineTo(xm, startY); ctx.lineTo(xm, endY); ctx.lineTo(x1, endY);
      prevLevel = prevLevel ? 0 : 1;
    } else if (type === 'ami') {
      if (b === 0) {
        if (i === 0) ctx.moveTo(x0, mid); else ctx.lineTo(x0, mid);
        ctx.lineTo(x1, mid);
      } else {
        const y = amiPolarity > 0 ? mid - amp : mid + amp;
        if (i === 0) ctx.moveTo(x0, mid); else ctx.lineTo(x0, mid);
        ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, mid);
        amiPolarity *= -1;
      }
    } else if (type === 'pam4') {
      const pair = (i % 2 === 0 && i + 1 < bits.length) ? bits[i] * 2 + bits[i + 1] : bits[i] * 2;
      const levels = [-3, -1, 1, 3];
      const symIdx = Math.min(pair, 3);
      const y = mid - (levels[symIdx] / 3) * amp;
      if (i === 0) ctx.moveTo(x0, y); else ctx.lineTo(x0, y);
      ctx.lineTo(x1, y);
    }
  }
  ctx.stroke();
}

export function drawModulation(canvas, bits, type, MOD_TYPES) {
  const totalH = 240;
  const { ctx, w, h } = setupCanvas(canvas, totalH);
  const bps = MOD_TYPES[type]?.bps || 1;
  const symbols = [];
  for (let i = 0; i < bits.length; i += bps) {
    let val = 0;
    for (let j = 0; j < bps && i + j < bits.length; j++) val = val * 2 + bits[i + j];
    symbols.push(val);
  }
  const symW = w / symbols.length;
  const carrierH = h * 0.28;
  const modH = h * 0.55;
  const carrierMid = carrierH / 2 + 16;
  const modMid = carrierH + 28 + modH / 2;
  const carrierAmp = carrierH * 0.38;
  const modAmp = modH * 0.4;
  const freqLow = 0.08, freqHigh = 0.24, freqMid = 0.15;

  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#4a5568'; ctx.font = 'bold 9px sans-serif';
  ctx.fillText('Несущая (carrier)', 4, 12);
  ctx.fillText('Модулированный сигнал', 4, carrierH + 24);

  ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
  const symColors = ['#e74c3c','#3498db','#2ecc71','#e67e22','#9b59b6','#1abc9c','#f1c40f','#e74c3c'];
  symbols.forEach((s, i) => {
    const bitStr = s.toString(2).padStart(bps, '0');
    ctx.fillStyle = symColors[s % symColors.length] + '30';
    ctx.fillRect(i * symW, carrierH + 28, symW, modH);
    ctx.fillStyle = symColors[s % symColors.length];
    ctx.fillText(bitStr, i * symW + symW / 2, carrierH + 24 + modH + 14);
  });
  ctx.textAlign = 'left';

  ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
  for (let i = 0; i <= symbols.length; i++) {
    ctx.beginPath(); ctx.moveTo(i * symW, carrierH + 26); ctx.lineTo(i * symW, carrierH + 28 + modH); ctx.stroke();
  }

  ctx.setLineDash([3,3]); ctx.strokeStyle = '#1a203050';
  ctx.beginPath(); ctx.moveTo(0, carrierMid); ctx.lineTo(w, carrierMid); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, modMid); ctx.lineTo(w, modMid); ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#3498db50'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const y = carrierMid + Math.sin(x * freqMid) * carrierAmp;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const changeLabel = type === 'ask' ? '↕ Амплитуда меняется' : type === 'fsk' ? '↔ Частота меняется' : type === 'bpsk' || type === 'qpsk' ? '⟲ Фаза меняется' : '↕⟲ Амплитуда + Фаза';
  ctx.fillStyle = '#e67e22'; ctx.font = 'bold 9px sans-serif';
  ctx.fillText(changeLabel, w - ctx.measureText(changeLabel).width - 4, carrierH + 24);

  ctx.lineWidth = 2.5; ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const sIdx = Math.min(Math.floor(x / symW), symbols.length - 1);
    const val = symbols[sIdx];
    const maxVal = Math.max(Math.pow(2, bps) - 1, 1);
    let y;
    ctx.strokeStyle = symColors[val % symColors.length];

    if (type === 'ask') {
      const a = val ? 1 : 0.12;
      y = modMid + Math.sin(x * freqMid) * modAmp * a;
    } else if (type === 'fsk') {
      const freq = val ? freqHigh : freqLow;
      y = modMid + Math.sin(x * freq) * modAmp * 0.85;
    } else if (type === 'bpsk') {
      const phase = val ? 0 : Math.PI;
      y = modMid + Math.sin(x * freqMid + phase) * modAmp * 0.85;
    } else if (type === 'qpsk') {
      const phases = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
      y = modMid + Math.sin(x * freqMid + phases[val % 4]) * modAmp * 0.85;
    } else {
      const norm = val / maxVal;
      const a = 0.2 + norm * 0.8;
      const phase = (val % 4) * Math.PI / 2;
      y = modMid + Math.sin(x * freqMid + phase) * modAmp * a;
    }

    if (x === 0 || Math.floor((x - 1) / symW) !== sIdx) {
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = symColors[val % symColors.length];
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}
