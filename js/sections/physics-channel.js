/* ==================== CHANNEL SIMULATOR ==================== */
import { CHANNEL_TYPES } from '../data/channels.js';
import { addXP } from '../core/gamification.js';
import { formatSpeed } from '../core/utils.js';
import { labData } from '../core/lab-data.js';
import { physicsState } from '../core/router.js';

let chSrcBytes = null;
let chSrcImgData = null;
let chSrcFileName = null;
let chSrcType = 'text';
let chNoiseMode = 'awgn';

export function initChannelSimulator() {
  document.getElementById('chSrcFileBtn')?.addEventListener('click', () => document.getElementById('chSrcFileInput')?.click());
  document.getElementById('chSrcLabData')?.addEventListener('click', () => {
    chSrcBytes = labData.bytes.slice();
    chSrcImgData = labData.imgPreview;
    chSrcFileName = labData.fileName || labData.text;
    chSrcType = labData.type;
    document.getElementById('chSrcText').value = labData.text;
    const p = document.getElementById('chSrcPreview');
    p.innerHTML = chSrcImgData ? `<img src="${chSrcImgData}" style="max-width:100%;max-height:80px;border-radius:6px;margin-top:6px">` : `<div style="font-size:.72rem;color:var(--l4);margin-top:4px">Загружено ${chSrcBytes.length} байт</div>`;
  });

  document.getElementById('chSrcText')?.addEventListener('input', (e) => {
    chSrcBytes = Array.from(new TextEncoder().encode(e.target.value));
    chSrcImgData = null; chSrcFileName = null; chSrcType = 'text';
    document.getElementById('chSrcPreview').innerHTML = '';
  });

  document.getElementById('chSrcFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 50 * 1024 * 1024) return;
    chSrcFileName = file.name;
    chSrcType = file.type.startsWith('image/') ? 'image' : 'file';
    if (file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = () => { chSrcImgData = r.result; document.getElementById('chSrcPreview').innerHTML = `<img src="${r.result}" style="max-width:100%;max-height:80px;border-radius:6px;margin-top:6px"><div style="font-size:.72rem;color:var(--text-secondary);margin-top:2px">${file.name}</div>`; };
      r.readAsDataURL(file);
    } else { chSrcImgData = null; }
    const r2 = new FileReader();
    r2.onload = () => { chSrcBytes = Array.from(new Uint8Array(r2.result)); document.getElementById('chSrcText').value = file.name; };
    r2.readAsArrayBuffer(file);
  });

  document.getElementById('chTransmit')?.addEventListener('click', () => {
    const sgChannelId = physicsState.channelId;
    const sgChDistance = physicsState.chDistance;

    if (sgChannelId === 'none') {
      document.getElementById('chResult').innerHTML = '<div class="card mt-16" style="color:var(--l7)">⚠ Сначала выберите канал на вкладке «Генератор + Канал» (блок ⑤)</div>';
      return;
    }

    if (!chSrcBytes || chSrcBytes.length === 0) {
      const txt = document.getElementById('chSrcText')?.value || 'Hello';
      chSrcBytes = Array.from(new TextEncoder().encode(txt));
      chSrcType = 'text';
    }

    const ch = CHANNEL_TYPES.find(c => c.id === sgChannelId);
    const distUnit = ch.medium === 'fiber' ? sgChDistance / 1000 : sgChDistance / 100;
    const atten = ch.attenuation * distUnit;
    const snr = Math.max(Math.round(ch.snrBase - atten), -5);
    const txBytes = chSrcBytes.slice(0, 4096);
    const txBits = [];
    txBytes.forEach(b => { for (let i = 7; i >= 0; i--) txBits.push((b >> i) & 1); });

    let ber;
    if (snr > 30) ber = 1e-10;
    else if (snr > 20) ber = 1e-7;
    else if (snr > 15) ber = 1e-4;
    else if (snr > 10) ber = 5e-3;
    else if (snr > 5) ber = 5e-2;
    else if (snr > 0) ber = 0.15;
    else ber = 0.35;

    const rxBits = txBits.slice();
    let errCount = 0;
    const errPositions = [];

    if (chNoiseMode === 'awgn') {
      for (let i = 0; i < rxBits.length; i++) {
        if (Math.random() < ber) { rxBits[i] ^= 1; errCount++; errPositions.push(i); }
      }
    } else if (chNoiseMode === 'impulse') {
      for (let i = 0; i < rxBits.length; i++) {
        if (Math.random() < ber * 0.3) {
          const burstLen = 4 + Math.floor(Math.random() * 12);
          for (let j = 0; j < burstLen && i + j < rxBits.length; j++) {
            rxBits[i + j] ^= 1; errCount++; errPositions.push(i + j);
          }
          i += burstLen;
        }
      }
    } else {
      for (let i = 0; i < rxBits.length; i++) {
        const fade = Math.sin(i / 50) * 0.5 + 0.5;
        const effectiveBer = ber * (1 + fade * 3);
        if (Math.random() < effectiveBer) { rxBits[i] ^= 1; errCount++; errPositions.push(i); }
      }
    }

    const rxBytes = [];
    for (let i = 0; i < rxBits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8 && i + j < rxBits.length; j++) byte = (byte << 1) | rxBits[i + j];
      rxBytes.push(byte);
    }

    const actualBer = txBits.length > 0 ? (errCount / txBits.length) : 0;

    let rxImgHtml = '';
    if (chSrcType === 'image' && chSrcImgData) {
      const origBytes = atob(chSrcImgData.split(',')[1]);
      const mime = chSrcImgData.split(';')[0].split(':')[1];
      const arr = new Uint8Array(origBytes.length);
      for (let i = 0; i < origBytes.length; i++) arr[i] = origBytes.charCodeAt(i);
      const headerSafe = Math.min(20, arr.length);
      for (let i = headerSafe; i < Math.min(arr.length, txBytes.length); i++) arr[i] = rxBytes[i] !== undefined ? rxBytes[i] : arr[i];
      try {
        const blob = new Blob([arr], { type: mime });
        const url = URL.createObjectURL(blob);
        rxImgHtml = `<img src="${url}" class="ch-compare__img" onerror="this.style.display='none';this.nextSibling.style.display='block'" alt=""><div style="display:none;font-size:.75rem;color:var(--l7);padding:8px">Файл повреждён слишком сильно для отображения</div>`;
      } catch(e) { rxImgHtml = '<div style="font-size:.75rem;color:var(--l7)">Ошибка реконструкции</div>'; }
    }

    const showBits = Math.min(txBits.length, 256);
    let bitsHtml = '';
    for (let i = 0; i < showBits; i++) {
      const isErr = errPositions.includes(i);
      bitsHtml += `<span class="bit-${isErr ? 'err' : 'ok'}">${rxBits[i]}</span>`;
      if ((i + 1) % 8 === 0) bitsHtml += ' ';
    }
    if (txBits.length > 256) bitsHtml += ' …';

    const showBytes = Math.min(txBytes.length, 32);
    let hexCompHtml = '';
    for (let i = 0; i < showBytes; i++) {
      const isErr = txBytes[i] !== rxBytes[i];
      hexCompHtml += `<div class="ch-hex-byte ch-hex-byte--${isErr ? 'err' : 'ok'}">${txBytes[i].toString(16).toUpperCase().padStart(2, '0')}${isErr ? '→' + rxBytes[i].toString(16).toUpperCase().padStart(2, '0') : ''}</div>`;
    }

    const rxText = chSrcType === 'text' ? new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(rxBytes)) : null;

    const result = document.getElementById('chResult');
    result.innerHTML = `
      <div class="lab-stats mt-16">
        <div class="lab-stat"><div class="lab-stat__value">${txBits.length.toLocaleString()}</div><div class="lab-stat__label">Бит передано</div></div>
        <div class="lab-stat"><div class="lab-stat__value" style="color:${errCount > 0 ? 'var(--l7)' : 'var(--l4)'}">${errCount}</div><div class="lab-stat__label">Бит повреждено</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${(actualBer * 100).toFixed(actualBer > 0.01 ? 1 : 4)}%</div><div class="lab-stat__label">BER</div></div>
        <div class="lab-stat"><div class="lab-stat__value">${txBytes.length}</div><div class="lab-stat__label">Байт</div></div>
      </div>

      ${chSrcType === 'image' && chSrcImgData ? `
        <div class="lab-result__title mt-16">Оригинал vs Полученное</div>
        <div class="ch-compare">
          <div class="ch-compare__side" style="border-color:var(--l4)">
            <div class="ch-compare__title" style="color:var(--l4)">📤 Отправлено</div>
            <img src="${chSrcImgData}" class="ch-compare__img">
          </div>
          <div class="ch-compare__side" style="border-color:${errCount > 0 ? 'var(--l7)' : 'var(--l4)'}">
            <div class="ch-compare__title" style="color:${errCount > 0 ? 'var(--l7)' : 'var(--l4)'}">📥 Получено ${errCount > 0 ? '(повреждено)' : '(OK)'}</div>
            ${rxImgHtml}
          </div>
        </div>
      ` : ''}

      ${rxText !== null ? `
        <div class="lab-result__title mt-16">Текст: оригинал vs полученный</div>
        <div class="ch-compare">
          <div class="ch-compare__side" style="border-color:var(--l4)">
            <div class="ch-compare__title" style="color:var(--l4)">📤 Отправлено</div>
            <div class="ch-compare__text">${document.getElementById('chSrcText').value || ''}</div>
          </div>
          <div class="ch-compare__side" style="border-color:${errCount > 0 ? 'var(--l7)' : 'var(--l4)'}">
            <div class="ch-compare__title" style="color:${errCount > 0 ? 'var(--l7)' : 'var(--l4)'}">📥 Получено</div>
            <div class="ch-compare__text">${rxText}</div>
          </div>
        </div>
      ` : ''}

      <div class="lab-result__title mt-16">Биты (повреждённые <span style="color:var(--l7)">красным</span>)</div>
      <div class="ch-bits-compare">${bitsHtml}</div>

      <div class="lab-result__title">Байты TX vs RX (первые ${showBytes})</div>
      <div class="ch-hex-compare">${hexCompHtml}</div>

      <div class="card mt-12" style="font-size:.78rem;line-height:1.6">
        <strong>Канал:</strong> ${ch.icon} ${ch.name}, расстояние ${sgChDistance >= 1000 ? (sgChDistance/1000).toFixed(1)+' км' : sgChDistance+' м'}, SNR = ${snr} дБ, затухание ${atten.toFixed(1)} дБ.<br>
        <strong>Результат:</strong> из ${txBits.length.toLocaleString()} бит повреждено ${errCount} (BER = ${(actualBer * 100).toFixed(4)}%).
        ${errCount === 0 ? ' Идеальная передача!' : errCount < 10 ? ' Минимальные повреждения.' : errCount < 100 ? ' Заметные повреждения.' : ' Серьёзное повреждение данных!'}
        ${chSrcType === 'image' && errCount > 0 ? '<br>Артефакты на изображении — результат повреждённых байтов.' : ''}
      </div>
    `;
    addXP(5);
  });
}

/* ==================== FILE UPLOAD (simulator section) ==================== */
export function initFileUpload() {
  const fileDrop = document.getElementById('fileDrop');
  const fileInput = document.getElementById('fileInput');
  if (!fileDrop || !fileInput) return;
  const MAX_FILE = 50 * 1024 * 1024;

  fileDrop.addEventListener('click', () => fileInput.click());
  fileDrop.addEventListener('dragover', (e) => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
  fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag-over'));
  fileDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDrop.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleUploadFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files.length) handleUploadFile(fileInput.files[0]); });

  function handleUploadFile(file) {
    const result = document.getElementById('fileResult');
    if (file.size > MAX_FILE) {
      result.innerHTML = '<div class="card mt-12" style="color:var(--l7)">Файл слишком большой. Максимум 50 МБ.</div>';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result);
      const preview = bytes.slice(0, 128);
      let hexLines = '';
      for (let off = 0; off < preview.length; off += 16) {
        const chunk = preview.slice(off, off + 16);
        let hex = '', ascii = '';
        for (let i = 0; i < 16; i++) {
          if (i < chunk.length) {
            hex += chunk[i].toString(16).toUpperCase().padStart(2, '0') + ' ';
            ascii += (chunk[i] >= 32 && chunk[i] < 127) ? String.fromCharCode(chunk[i]) : '.';
          } else { hex += '   '; ascii += ' '; }
          if (i === 7) hex += ' ';
        }
        hexLines += off.toString(16).toUpperCase().padStart(4, '0') + '  ' + hex + ' ' + ascii + '\n';
      }

      const mtu = 1500;
      const tcpPayload = mtu - 20 - 20;
      const segments = Math.ceil(file.size / tcpPayload);
      const ipPackets = segments;
      const frames = segments;
      const totalOverhead = segments * (14 + 20 + 20 + 4);
      const totalOnWire = file.size + totalOverhead;
      const overheadPct = ((totalOverhead / totalOnWire) * 100).toFixed(1);

      const sizeStr = file.size >= 1048576 ? (file.size / 1048576).toFixed(2) + ' МБ'
        : file.size >= 1024 ? (file.size / 1024).toFixed(1) + ' КБ' : file.size + ' Б';

      const icon = file.type.startsWith('image/') ? '🖼️' :
        file.type.startsWith('video/') ? '🎬' : file.type.startsWith('audio/') ? '🎵' :
        file.type.includes('pdf') ? '📄' : file.type.includes('zip') || file.type.includes('rar') ? '📦' : '📄';

      let channelRows = '';
      CHANNEL_TYPES.forEach(ch => {
        const timeSec = (totalOnWire * 8) / (ch.speed * 1e6);
        const timeStr = timeSec >= 60 ? (timeSec / 60).toFixed(1) + ' мин' : timeSec >= 1 ? timeSec.toFixed(2) + ' с' : (timeSec * 1000).toFixed(1) + ' мс';
        channelRows += `<tr><td>${ch.icon} ${ch.name}</td><td>${formatSpeed(ch.speed)}</td><td>${timeStr}</td></tr>`;
      });

      result.innerHTML = `
        <div class="file-info">
          <div class="file-info__header">
            <div class="file-info__icon">${icon}</div>
            <div>
              <div class="file-info__name">${file.name}</div>
              <div class="file-info__meta">${file.type || 'unknown'} — ${sizeStr} — ${file.size.toLocaleString()} байт</div>
            </div>
          </div>
          <div class="study-section__title">Hex-превью (первые ${preview.length} байт)</div>
          <div class="file-hex">${hexLines}</div>
          <div class="lab-stats">
            <div class="lab-stat"><div class="lab-stat__value">${segments.toLocaleString()}</div><div class="lab-stat__label">TCP-сегментов</div></div>
            <div class="lab-stat"><div class="lab-stat__value">${ipPackets.toLocaleString()}</div><div class="lab-stat__label">IP-пакетов</div></div>
            <div class="lab-stat"><div class="lab-stat__value">${frames.toLocaleString()}</div><div class="lab-stat__label">Ethernet-кадров</div></div>
            <div class="lab-stat"><div class="lab-stat__value">${overheadPct}%</div><div class="lab-stat__label">Overhead заголовков</div></div>
          </div>
          <div class="pdu-fields mt-12">
            <tr><td>Payload данных</td><td>${sizeStr}</td></tr>
            <tr><td>+ TCP заголовки</td><td>${(segments * 20).toLocaleString()} Б (${segments} × 20)</td></tr>
            <tr><td>+ IP заголовки</td><td>${(segments * 20).toLocaleString()} Б (${segments} × 20)</td></tr>
            <tr><td>+ Ethernet + CRC</td><td>${(segments * 18).toLocaleString()} Б (${segments} × 18)</td></tr>
            <tr><td><strong>Итого на линии</strong></td><td><strong>${(totalOnWire / 1024).toFixed(1)} КБ</strong></td></tr>
          </div>
          <div class="study-section__title mt-16">Время передачи по каналам</div>
          <div style="overflow-x:auto">
            <table class="file-transfer-table">
              <thead><tr><th>Канал</th><th>Скорость</th><th>Время</th></tr></thead>
              <tbody>${channelRows}</tbody>
            </table>
          </div>
        </div>
      `;
      addXP(5);
    };
    reader.readAsArrayBuffer(file);

    if (file.type.startsWith('image/')) {
      const imgReader = new FileReader();
      imgReader.onload = () => {
        const imgEl = document.createElement('div');
        imgEl.innerHTML = `<img src="${imgReader.result}" style="max-width:100%;max-height:100px;border-radius:8px;margin:8px 0;display:block">`;
        document.getElementById('fileResult').prepend(imgEl);
      };
      imgReader.readAsDataURL(file);
    }
  }
}
