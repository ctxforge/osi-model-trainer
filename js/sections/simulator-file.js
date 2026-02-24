/* File upload handler for the simulator section */
import { formatSpeed } from '../core/utils.js';
import { addXP } from '../core/gamification.js';
import { simState } from '../core/lab-data.js';
import { CHANNEL_TYPES } from '../data/channels.js';

function handleFile(file) {
  const result = document.getElementById('fileResult');
  const MAX_FILE = 50 * 1024 * 1024;
  if (file.size > MAX_FILE) {
    result.innerHTML = '<div class="card mt-12" style="color:var(--l7)">Файл слишком большой. Максимум 50 МБ.</div>';
    return;
  }

  simState.uploadedFile = file;

  if (file.type.startsWith('image/')) {
    const imgReader = new FileReader();
    imgReader.onload = () => {
      simState.uploadedImg = imgReader.result;
      const imgEl = document.createElement('div');
      imgEl.innerHTML = `<img src="${imgReader.result}" style="max-width:100%;max-height:100px;border-radius:8px;margin:8px 0;display:block">`;
      document.getElementById('fileResult').prepend(imgEl);
    };
    imgReader.readAsDataURL(file);
  } else {
    simState.uploadedImg = null;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const bytes = new Uint8Array(reader.result);
    simState.uploadedBytes = Array.from(bytes);
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
}

export function initFileUpload() {
  const fileDrop = document.getElementById('fileDrop');
  const fileInput = document.getElementById('fileInput');

  fileDrop.addEventListener('click', () => fileInput.click());
  fileDrop.addEventListener('dragover', (e) => { e.preventDefault(); fileDrop.classList.add('drag-over'); });
  fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag-over'));
  fileDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDrop.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });
}
