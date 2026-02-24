/* ==================== LAB DATA SOURCE ==================== */

const labData = {
  type: 'text',
  text: '\u041F\u0440\u0438\u0432\u0435\u0442, OSI!',
  bytes: Array.from(new TextEncoder().encode('\u041F\u0440\u0438\u0432\u0435\u0442, OSI!')),
  fileName: null,
  fileType: null,
  imgPreview: null,
  size: 0
};
labData.size = labData.bytes.length;

export const simState = { uploadedBytes: null, uploadedFile: null, uploadedImg: null };

const labDataListeners = [];

function onLabDataChange(fn) { labDataListeners.push(fn); }

function notifyLabDataChange() {
  labDataListeners.forEach(fn => { try { fn(); } catch(e) {} });
}

function updateLabData() {
  const sizeEl = document.getElementById('labDataSize');
  const previewEl = document.getElementById('labDataPreview');
  if (!sizeEl) return;

  const s = labData.size;
  sizeEl.textContent = s >= 1048576 ? (s / 1048576).toFixed(1) + ' \u041C\u0411' : s >= 1024 ? (s / 1024).toFixed(1) + ' \u041A\u0411' : s + ' \u0411';

  const hexPreview = labData.bytes.slice(0, 24).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  let preview = `<div class="lab-data-panel__hex">${hexPreview}${labData.bytes.length > 24 ? ' \u2026' : ''}</div>`;

  if (labData.type === 'file' && labData.imgPreview) {
    preview = `<div class="lab-data-panel__preview">
      <img src="${labData.imgPreview}">
      <div class="lab-data-panel__preview-info">${labData.fileName}<br>${labData.fileType}</div>
    </div>` + preview;
  } else if (labData.type === 'file') {
    preview = `<div class="lab-data-panel__preview">
      <span style="font-size:1.3rem">\uD83D\uDCC4</span>
      <div class="lab-data-panel__preview-info">${labData.fileName}<br>${labData.fileType}</div>
    </div>` + preview;
  }

  previewEl.innerHTML = preview;

  simState.uploadedBytes = labData.bytes;
  simState.uploadedFile = labData.fileName ? { name: labData.fileName, type: labData.fileType, size: labData.size } : null;
  simState.uploadedImg = labData.imgPreview;
  notifyLabDataChange();
}

function getLabBits(maxBytes) {
  const b = labData.bytes.slice(0, maxBytes || 4);
  const bits = [];
  b.forEach(byte => { for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1); });
  return bits;
}

function getLabText() { return labData.text || 'Hello'; }
function getLabBytes() { return labData.bytes; }

function initLabData() {
  document.getElementById('labDataText').addEventListener('input', (e) => {
    labData.type = 'text';
    labData.text = e.target.value;
    labData.bytes = Array.from(new TextEncoder().encode(e.target.value));
    labData.size = labData.bytes.length;
    labData.fileName = null; labData.fileType = null; labData.imgPreview = null;
    updateLabData();
  });

  document.getElementById('labDataFileBtn').addEventListener('click', () => {
    document.getElementById('labDataFileInput').click();
  });

  document.getElementById('labDataFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 50 * 1024 * 1024) return;
    labData.type = 'file';
    labData.fileName = file.name;
    labData.fileType = file.type;
    labData.size = file.size;

    if (file.type.startsWith('image/')) {
      const imgR = new FileReader();
      imgR.onload = () => { labData.imgPreview = imgR.result; updateLabData(); };
      imgR.readAsDataURL(file);
    } else {
      labData.imgPreview = null;
    }

    const reader = new FileReader();
    reader.onload = () => {
      labData.bytes = Array.from(new Uint8Array(reader.result)).slice(0, 65536);
      labData.text = labData.fileName;
      document.getElementById('labDataText').value = labData.fileName;
      updateLabData();
    };
    reader.readAsArrayBuffer(file);
  });

  document.getElementById('labDataRandom').addEventListener('click', () => {
    const len = 64 + Math.floor(Math.random() * 200);
    const bytes = [];
    for (let i = 0; i < len; i++) bytes.push(Math.floor(Math.random() * 256));
    labData.type = 'random';
    labData.text = `[${len} \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0445 \u0431\u0430\u0439\u0442]`;
    labData.bytes = bytes;
    labData.size = len;
    labData.fileName = null; labData.fileType = null; labData.imgPreview = null;
    document.getElementById('labDataText').value = labData.text;
    updateLabData();
  });

  updateLabData();
}

export { labData, onLabDataChange, getLabBits, getLabText, getLabBytes, simState, initLabData };
