import { sleep } from '../core/utils.js';
import { addXP } from '../core/gamification.js';
import { labData, getLabText } from '../core/lab-data.js';

export function initJourney() {
  const container = document.getElementById('lab-journey');
  if (!container) return;
  let built = false;

  function build() {
    if (built) return;
    built = true;
    _initJourneyInner();
  }

  const obs = new MutationObserver(() => {
    if (container.classList.contains('active') && !built) build();
  });
  obs.observe(container, { attributes: true, attributeFilter: ['class'] });
  if (container.classList.contains('active')) build();
}

function _initJourneyInner() {
  let journeyFile = null;
  let journeyImgData = null;

  const jFileDrop = document.getElementById('journeyFileDrop');
  const jFileInput = document.getElementById('journeyFileInput');
  jFileDrop.addEventListener('click', () => jFileInput.click());
  jFileInput.addEventListener('change', () => {
    if (jFileInput.files.length) loadJourneyFile(jFileInput.files[0]);
  });
  jFileDrop.addEventListener('dragover', e => { e.preventDefault(); jFileDrop.style.borderColor = 'var(--accent)'; });
  jFileDrop.addEventListener('dragleave', () => { jFileDrop.style.borderColor = ''; });
  jFileDrop.addEventListener('drop', e => { e.preventDefault(); jFileDrop.style.borderColor = ''; if (e.dataTransfer.files.length) loadJourneyFile(e.dataTransfer.files[0]); });

  function loadJourneyFile(file) {
    journeyFile = file;
    const preview = document.getElementById('journeyPreview');
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        journeyImgData = reader.result;
        preview.innerHTML = `<img src="${reader.result}" class="journey-img-preview" style="margin-top:8px;max-height:100px">
          <div style="font-size:.72rem;color:var(--text-secondary);margin-top:4px">${file.name} (${(file.size/1024).toFixed(1)} КБ)</div>`;
      };
      reader.readAsDataURL(file);
    } else {
      journeyImgData = null;
      preview.innerHTML = `<div style="font-size:.8rem;margin-top:8px">📄 ${file.name} (${(file.size/1024).toFixed(1)} КБ)</div>`;
    }
  }

  function animateSignal(canvas, duration) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 70 * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const w = rect.width, h = 70;
    const bits = [1,0,1,1,0,0,1,0,1,1,0,1,0,1,1,0,0,1,0,1];
    let offset = 0;
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      if (elapsed > duration) return;
      offset = (elapsed / duration) * w * 2;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#2ecc7140'; ctx.lineWidth = 1;
      ctx.setLineDash([3,3]); ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke(); ctx.setLineDash([]);

      const bitW = 18;
      ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const bx = x + offset;
        const bitIdx = Math.floor(bx / bitW) % bits.length;
        const inBit = (bx % bitW) / bitW;
        let val = bits[bitIdx] ? 1 : -1;
        const edge = 0.1;
        if (inBit < edge) val *= inBit / edge;
        else if (inBit > 1 - edge) val *= (1 - inBit) / edge;
        const noise = (Math.random() - 0.5) * 0.15;
        const y = h / 2 - (val + noise) * h * 0.3;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const headX = Math.min((elapsed / duration) * w, w);
      ctx.fillStyle = '#2ecc71'; ctx.beginPath();
      ctx.arc(headX, h/2, 4, 0, Math.PI * 2); ctx.fill();

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  document.getElementById('journeyRun').addEventListener('click', async () => {
    const msg = document.getElementById('journeyMsg').value || getLabText();
    const result = document.getElementById('journeyResult');
    const hasFile = labData.type === 'file';
    const dataSize = labData.size || new TextEncoder().encode(msg).length;
    const dataDesc = hasFile ? `${labData.fileName} (${(dataSize/1024).toFixed(1)} КБ)` : `"${msg}"`;
    const mtu = 1500;
    const segments = Math.ceil(dataSize / (mtu - 40));
    const srcPort = 49000 + Math.floor(Math.random() * 16000);
    const seqNum = 1000 + Math.floor(Math.random() * 9000);

    const hexPreview = hasFile
      ? `[бинарные данные ${dataSize} байт]`
      : Array.from(new TextEncoder().encode(msg)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

    const steps = [
      { icon: '⌨️', color: '#e74c3c', title: 'Клавиатура / Файл → Приложение', sub: 'Пользователь вводит данные',
        data: hasFile ? `File: ${journeyFile.name}\nType: ${journeyFile.type}\nSize: ${dataSize} bytes` : `User input: "${msg}"`,
        desc: 'Вы набираете текст или выбираете файл. Приложение (браузер) формирует данные для отправки.' },
      { icon: '🌐', color: '#e74c3c', title: 'L7 Прикладной — HTTP запрос', sub: 'Формирование HTTP-запроса',
        data: `POST /send HTTP/1.1\r\nHost: receiver.com\r\nContent-Type: ${hasFile ? journeyFile.type : 'text/plain'}\r\nContent-Length: ${dataSize}\r\n\r\n${hasFile ? '[binary data]' : msg}`,
        desc: 'Приложение оборачивает данные в HTTP-запрос с заголовками.' },
      { icon: '🔐', color: '#e67e22', title: 'L6 Представления — TLS шифрование', sub: 'AES-256-GCM шифрование',
        data: `TLS Record:\n  Content Type: Application Data (23)\n  Version: TLS 1.3\n  Cipher: AES-256-GCM\n  Encrypted: ${Array.from({length: Math.min(dataSize, 20)}, () => Math.floor(Math.random()*256).toString(16).padStart(2,'0')).join(' ')}...`,
        desc: 'Данные шифруются ключом сессии (AES-256-GCM). Никто в канале не может прочитать содержимое.' },
      { icon: '🔗', color: '#f1c40f', title: 'L5 Сеансовый — TCP сессия', sub: 'Управление соединением',
        data: `Session: ESTABLISHED\nSocket: 192.168.1.100:${srcPort} → 93.184.216.34:443`,
        desc: 'TCP-соединение уже установлено (3-way handshake). Данные передаются внутри сессии.' },
      { icon: '📦', color: '#2ecc71', title: `L4 Транспортный — TCP сегментация (${segments} сегм.)`, sub: `Порт ${srcPort} → 443, Seq=${seqNum}`,
        data: `TCP Segment:\n  Src Port: ${srcPort}\n  Dst Port: 443\n  Seq: ${seqNum}\n  Flags: PSH, ACK\n  Window: 65535\n  Payload: ${Math.min(dataSize, mtu-40)} bytes\n  ${segments > 1 ? `(всего ${segments} сегментов)` : ''}`,
        desc: `Данные (${dataSize} байт) разбиваются на ${segments} TCP-сегментов по ${mtu-40} байт. Каждый получает порт источника/назначения и номер последовательности.` },
      { icon: '🗺️', color: '#1abc9c', title: 'L3 Сетевой — IP-пакет, маршрутизация', sub: '192.168.1.100 → 93.184.216.34',
        data: `IP Header:\n  Version: 4  IHL: 5  TTL: 64\n  Protocol: TCP (6)\n  Src: 192.168.1.100\n  Dst: 93.184.216.34\n  Total: ${Math.min(dataSize + 40, mtu)} bytes`,
        desc: 'Добавляется IP-заголовок с адресами. Маршрутизатор определит путь по таблице маршрутов.' },
      { icon: '🔀', color: '#3498db', title: 'L2 Канальный — Ethernet кадр', sub: 'MAC: AA:BB:CC:11:22:33 → FF:EE:DD:44:55:66',
        data: `Ethernet Frame:\n  Dst MAC: FF:EE:DD:44:55:66\n  Src MAC: AA:BB:CC:11:22:33\n  Type: 0x0800 (IPv4)\n  Payload: IP packet\n  FCS: CRC-32`,
        desc: 'Пакет помещается в Ethernet-кадр с MAC-адресами. ARP определил MAC шлюза.' },
      { icon: '⚡', color: '#9b59b6', title: 'L1 Физический — Биты → Сигнал', sub: 'Manchester / OFDM / Лазер',
        data: `Bits: ${Array.from({length: 32}, () => Math.round(Math.random())).join('')}...\nEncoding: Manchester (Ethernet) / OFDM (Wi-Fi)\nSignal: электрический / радио / оптический`,
        desc: 'Биты кадра преобразуются в физический сигнал: электрические импульсы (медь), световые импульсы (оптоволокно) или радиоволны (Wi-Fi).', signal: true },
      { icon: '📡', color: '#34495e', title: 'Канал связи — сигнал в среде', sub: 'Затухание, шум, задержка распространения',
        data: `Medium: copper / fiber / radio\nAttenuation: signal weakens\nNoise: environmental interference\nPropagation: ~2/3 speed of light`,
        desc: 'Сигнал проходит по среде: затухает с расстоянием, подвергается помехам. Приёмник должен выделить данные из шума.', signal: true },
      { icon: '⚡', color: '#9b59b6', title: 'L1 Получатель — Сигнал → Биты', sub: 'Демодуляция, восстановление тактов',
        data: `Received signal → Clock recovery → Bit decisions\nBER: < 10⁻¹⁰ (no errors detected)`,
        desc: 'Приёмник восстанавливает тактовую частоту, определяет пороги «0» и «1», извлекает биты из сигнала.' },
      { icon: '🔀', color: '#3498db', title: 'L2 Получатель — Проверка CRC', sub: 'Целостность кадра OK',
        data: `CRC check: PASS\nDst MAC matches: YES\nExtract IP packet`,
        desc: 'Проверяется контрольная сумма кадра (CRC-32). MAC-адрес совпадает — кадр принимается.' },
      { icon: '🗺️', color: '#1abc9c', title: 'L3 Получатель — IP проверка', sub: 'IP назначения совпадает',
        data: `Dst IP: 93.184.216.34 → matches local\nTTL: 58 (was 64, -6 hops)\nExtract TCP segment`,
        desc: 'IP-адрес назначения совпадает с локальным. Пакет принят, IP-заголовок снимается.' },
      { icon: '📦', color: '#2ecc71', title: `L4 Получатель — Сборка ${segments} сегментов`, sub: 'TCP ACK → отправителю',
        data: `Port 443 → deliver to application\nReassemble ${segments} segments\nSend ACK seq=${seqNum + dataSize}`,
        desc: `TCP собирает все ${segments} сегментов в правильном порядке, отправляет ACK отправителю.` },
      { icon: '🔗', color: '#f1c40f', title: 'L5 Получатель — Сессия активна', sub: 'Данные для приложения',
        data: `Session: ESTABLISHED\nDeliver to application layer`, desc: 'Сессионный уровень передаёт данные приложению.' },
      { icon: '🔓', color: '#e67e22', title: 'L6 Получатель — Расшифровка', sub: 'AES-256-GCM → открытый текст',
        data: `Decrypt: AES-256-GCM(session_key)\nVerify: HMAC integrity OK\nResult: ${hasFile ? '[binary data restored]' : msg}`,
        desc: 'Зашифрованные данные расшифровываются ключом сессии. Проверяется целостность (HMAC).' },
      { icon: '🖥️', color: '#e74c3c', title: 'L7 Получатель — Данные приложению', sub: 'HTTP 200 OK → отображение',
        data: `HTTP/1.1 200 OK\nContent received: ${dataDesc}\nRender on screen`,
        desc: 'Приложение получает данные и отображает их на экране получателя.' }
    ];

    result.innerHTML = `<div class="mt-16">${steps.map((s, i) => `
      <div class="journey-step" id="jStep-${i}">
        <div class="journey-step__timeline">
          <div class="journey-step__icon" style="color:${s.color}">${s.icon}</div>
          ${i < steps.length - 1 ? '<div class="journey-step__wire"></div>' : ''}
        </div>
        <div class="journey-step__body">
          <div class="journey-step__title" style="color:${s.color}">${s.title}</div>
          <div class="journey-step__sub">${s.sub}</div>
          <div style="font-size:.72rem;color:var(--text-secondary);line-height:1.5;margin-bottom:4px">${s.desc}</div>
          <div class="journey-step__data">${s.data}</div>
          ${s.signal ? '<div class="journey-signal"><canvas class="journey-signal-canvas"></canvas></div>' : ''}
        </div>
      </div>
    `).join('')}
    <div class="journey-received" id="jReceived" style="display:none">
      <div class="journey-received__icon">✅</div>
      <div class="journey-received__msg">${hasFile && journeyImgData ? '' : (hasFile ? '📄 ' + journeyFile.name : msg)}</div>
      ${hasFile && labData.imgPreview ? `<img src="${labData.imgPreview}" style="max-width:100%;max-height:120px;border-radius:8px;margin-top:8px">` : ''}
      <div style="font-size:.72rem;color:var(--text-secondary);margin-top:6px">Доставлено за ${segments} сегментов через 7 уровней OSI</div>
    </div></div>`;

    for (let i = 0; i < steps.length; i++) {
      await sleep(450);
      const el = document.getElementById('jStep-' + i);
      if (el) {
        el.classList.add('visible');
        if (steps[i].signal) {
          const cv = el.querySelector('.journey-signal-canvas');
          if (cv) animateSignal(cv, 2000);
        }
      }
      result.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }

    await sleep(500);
    const recv = document.getElementById('jReceived');
    if (recv) recv.style.display = 'block';
    result.scrollIntoView({ block: 'end', behavior: 'smooth' });
    addXP(10);
  });
}
