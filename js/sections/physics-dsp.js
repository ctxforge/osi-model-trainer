/* ==================== DSP: Signal Generation, FFT, Drawing ==================== */
import { CHANNEL_TYPES } from '../data/channels.js';

export function fft(re, im) {
  const n = re.length;
  if (n <= 1) return;
  const hre = new Float64Array(n / 2), him = new Float64Array(n / 2);
  const gre = new Float64Array(n / 2), gim = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    hre[i] = re[2 * i]; him[i] = im[2 * i];
    gre[i] = re[2 * i + 1]; gim[i] = im[2 * i + 1];
  }
  fft(hre, him); fft(gre, gim);
  for (let k = 0; k < n / 2; k++) {
    const angle = -2 * Math.PI * k / n;
    const wr = Math.cos(angle), wi = Math.sin(angle);
    const tr = wr * gre[k] - wi * gim[k];
    const ti = wr * gim[k] + wi * gre[k];
    re[k] = hre[k] + tr; im[k] = him[k] + ti;
    re[k + n / 2] = hre[k] - tr; im[k + n / 2] = him[k] - ti;
  }
}

export function genSamples(sgComponents, sgImportedSamples, sgFs, sgN) {
  if (sgImportedSamples) return sgImportedSamples;
  const samples = new Float64Array(sgN);
  sgComponents.forEach(c => {
    for (let n = 0; n < sgN; n++) {
      const t = n / sgFs;
      const w = 2 * Math.PI * c.freq;
      let v = 0;
      if (c.type === 'sin') v = Math.sin(w * t + c.phase * Math.PI / 180);
      else if (c.type === 'cos') v = Math.cos(w * t + c.phase * Math.PI / 180);
      else if (c.type === 'square') v = Math.sin(w * t + c.phase * Math.PI / 180) >= 0 ? 1 : -1;
      else if (c.type === 'sawtooth') v = 2 * ((c.freq * t + c.phase / 360) % 1) - 1;
      else if (c.type === 'triangle') { const p = (c.freq * t + c.phase / 360) % 1; v = p < 0.5 ? 4 * p - 1 : 3 - 4 * p; }
      else if (c.type === 'noise') v = (Math.random() - 0.5) * 2;
      let baseband = v * c.amp + c.dc;

      if (c.carrier > 0 && c.modType !== 'none') {
        const wc = 2 * Math.PI * c.carrier;
        if (c.modType === 'am') {
          samples[n] += (1 + c.modDepth * baseband) * Math.cos(wc * t);
        } else if (c.modType === 'fm') {
          let integral = 0;
          for (let k = 0; k <= n; k++) { const tk = k / sgFs; let vk = 0;
            if (c.type === 'sin') vk = Math.sin(2*Math.PI*c.freq*tk); else vk = baseband;
            integral += vk / sgFs;
          }
          samples[n] += c.amp * Math.cos(wc * t + 2 * Math.PI * c.modDepth * integral);
        } else if (c.modType === 'pm') {
          samples[n] += c.amp * Math.cos(wc * t + c.modDepth * baseband);
        }
      } else if (c.carrier > 0) {
        samples[n] += baseband * Math.cos(2 * Math.PI * c.carrier * t);
      } else {
        samples[n] += baseband;
      }
    }
  });
  return samples;
}

export function applyChannel(samples, chId, dist, sgFs, sgN) {
  if (chId === 'none') return { rx: samples.slice(), snr: 999, atten: 0, bw: sgFs / 2 };
  const ch = CHANNEL_TYPES.find(c => c.id === chId);
  if (!ch) return { rx: samples.slice(), snr: 999, atten: 0, bw: sgFs / 2 };
  const distUnit = ch.medium === 'fiber' ? dist / 1000 : dist / 100;
  const atten = ch.attenuation * distUnit;
  const snr = Math.max(ch.snrBase - atten, -5);
  const gain = Math.pow(10, -atten / 20);
  const noiseStd = gain / Math.max(Math.pow(10, snr / 20), 0.01);
  const bw = Math.min(ch.bandwidthMHz * 1e6, sgFs / 2);
  const bwNorm = bw / (sgFs / 2);
  const rx = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    rx[i] = samples[i] * gain + (Math.random() - 0.5) * 2 * noiseStd * 0.3;
  }
  if (bwNorm < 1) {
    const cutoff = Math.floor(samples.length * bwNorm / 2);
    const re = new Float64Array(sgN), im = new Float64Array(sgN);
    for (let i = 0; i < sgN; i++) re[i] = rx[i];
    fft(re, im);
    for (let i = cutoff; i < sgN - cutoff; i++) { re[i] = 0; im[i] = 0; }
    const re2 = new Float64Array(sgN), im2 = new Float64Array(sgN);
    for (let i = 0; i < sgN; i++) { re2[i] = re[i]; im2[i] = -im[i]; }
    fft(re2, im2);
    for (let i = 0; i < sgN; i++) rx[i] = re2[i] / sgN;
  }
  return { rx, snr, atten, bw, ch };
}

export function drawTimeDomain(canvas, samples) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 140 * dpr;
  canvas.style.height = '140px';
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const w = rect.width, h = 140, mid = h / 2;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke(); ctx.setLineDash([]);
  for (let v = -1; v <= 1; v += 0.5) { if (v === 0) continue; ctx.strokeStyle = '#1a203040'; ctx.beginPath(); ctx.moveTo(0, mid - v * mid * 0.8); ctx.lineTo(w, mid - v * mid * 0.8); ctx.stroke(); }

  let maxA = 0;
  for (let i = 0; i < samples.length; i++) if (Math.abs(samples[i]) > maxA) maxA = Math.abs(samples[i]);
  if (maxA === 0) maxA = 1;

  ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 1.5; ctx.beginPath();
  const show = Math.min(samples.length, 256);
  for (let i = 0; i < show; i++) {
    const x = (i / show) * w;
    const y = mid - (samples[i] / maxA) * mid * 0.85;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#4a5568'; ctx.font = '9px sans-serif';
  ctx.fillText(`${(maxA).toFixed(2)}`, 2, 12);
  ctx.fillText(`-${(maxA).toFixed(2)}`, 2, h - 4);
}

export function drawSpectrum(canvas, samples, sgFs, sgN, sgSpectrumScale, sgSpectrumWindow) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 160 * dpr;
  canvas.style.height = '160px';
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const w = rect.width, h = 160;
  const scale = sgSpectrumScale;
  ctx.clearRect(0, 0, w, h);

  const re = new Float64Array(sgN);
  const im = new Float64Array(sgN);
  for (let i = 0; i < sgN; i++) {
    let win = 1;
    if (sgSpectrumWindow === 'hann') win = 0.5 * (1 - Math.cos(2 * Math.PI * i / (sgN - 1)));
    else if (sgSpectrumWindow === 'hamming') win = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (sgN - 1));
    re[i] = (samples[i] || 0) * win;
  }
  fft(re, im);

  const mag = new Float64Array(sgN / 2);
  let maxM = 0;
  for (let i = 0; i < sgN / 2; i++) {
    mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]) / sgN * 2;
    if (mag[i] > maxM) maxM = mag[i];
  }
  if (maxM === 0) maxM = 1;

  // Grid
  ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 1;
  for (let db = 0; db >= -scale; db -= 10) {
    const y = h * 0.04 + (h * 0.88) * (-db / scale);
    ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(w, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#4a5568'; ctx.font = '8px sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(db + '', 26, y + 3);
  }
  ctx.textAlign = 'left';

  // Frequency grid
  for (let f = 0; f <= sgFs / 2; f += 500) {
    const x = 28 + (f / (sgFs / 2)) * (w - 32);
    ctx.strokeStyle = '#1a203030'; ctx.beginPath(); ctx.moveTo(x, h * 0.04); ctx.lineTo(x, h * 0.92); ctx.stroke();
  }

  // Spectrum fill + line
  const plotW = w - 32;
  const barW = plotW / (sgN / 2);
  ctx.fillStyle = '#e67e2230';
  ctx.beginPath();
  ctx.moveTo(28, h * 0.92);
  for (let i = 0; i < sgN / 2; i++) {
    const dbVal = mag[i] > 0 ? 20 * Math.log10(mag[i] / maxM) : -scale;
    const barH = Math.max((-dbVal) / scale, 0);
    const x = 28 + i * barW;
    const y = h * 0.04 + barH * h * 0.88;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(28 + plotW, h * 0.92);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < sgN / 2; i++) {
    const dbVal = mag[i] > 0 ? 20 * Math.log10(mag[i] / maxM) : -scale;
    const barH = Math.max((-dbVal) / scale, 0);
    const x = 28 + i * barW;
    const y = h * 0.04 + barH * h * 0.88;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Peak markers
  for (let i = 1; i < sgN / 2 - 1; i++) {
    if (mag[i] > mag[i-1] && mag[i] > mag[i+1] && mag[i] > maxM * 0.1) {
      const freq = (i / (sgN / 2)) * sgFs / 2;
      const dbVal = 20 * Math.log10(mag[i] / maxM);
      const x = 28 + i * barW;
      const y = h * 0.04 + Math.max((-dbVal) / scale, 0) * h * 0.88;
      ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(Math.round(freq) + 'Hz', x, y - 6);
      ctx.fillText(dbVal.toFixed(1) + 'dB', x, y - 14);
      ctx.textAlign = 'left';
    }
  }

  // Axis labels
  ctx.fillStyle = '#4a5568'; ctx.font = '8px sans-serif';
  const freqs = [0, sgFs / 8, sgFs / 4, sgFs * 3 / 8, sgFs / 2];
  freqs.forEach((f, i) => { ctx.fillText(f + '', 28 + (i / (freqs.length - 1)) * plotW - 8, h - 2); });
  ctx.fillText('дБ', 2, 12);
}
