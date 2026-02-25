/* ==================== DRAG & DROP ==================== */
import { OSI_LAYERS } from '../data/osi-layers.js';
import { DRAG_DROP_ITEMS, DND_PORTS, DND_HEADERS, DND_ENCAP_STACKS, DND_MODES } from '../data/dragdrop-data.js';
import { addXP, unlockAchievement } from '../core/gamification.js';

let dndCurrentItems = [];
let draggedEl = null;
let touchClone = null;
let currentMode = 'classic';
let modeStartTime = 0;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ========== Drag Handlers ========== */
function onDragStart(e) {
  draggedEl = e.target;
  e.target.classList.add('dnd-item--dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd(e) {
  e.target.classList.remove('dnd-item--dragging');
  document.querySelectorAll('.dnd-zone, .dnd-match-slot, .dnd-stack-slot, .dnd-header-slot').forEach(z => z.classList.remove('drag-over'));
}

function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function makeDropHandler(acceptFn) {
  return function onDrop(e) {
    e.preventDefault();
    const zone = e.currentTarget;
    zone.classList.remove('drag-over');
    if (!draggedEl) return;
    if (acceptFn && !acceptFn(zone, draggedEl)) return;
    const itemsArea = zone.querySelector('.dnd-zone__items') || zone;
    draggedEl.classList.remove('dnd-item--dragging');
    itemsArea.appendChild(draggedEl);
    draggedEl = null;
  };
}

function onTouchStart(e) {
  e.preventDefault();
  const el = e.target.closest('.dnd-item');
  if (!el) return;
  draggedEl = el;
  touchClone = el.cloneNode(true);
  touchClone.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;opacity:.85;transform:scale(1.08);';
  document.body.appendChild(touchClone);
  const touch = e.touches[0];
  touchClone.style.left = (touch.clientX - 40) + 'px';
  touchClone.style.top = (touch.clientY - 20) + 'px';
  el.classList.add('dnd-item--dragging');
}

function onTouchMove(e) {
  e.preventDefault();
  if (!touchClone) return;
  const touch = e.touches[0];
  touchClone.style.left = (touch.clientX - 40) + 'px';
  touchClone.style.top = (touch.clientY - 20) + 'px';
  document.querySelectorAll('.dnd-zone, .dnd-match-slot, .dnd-stack-slot, .dnd-header-slot').forEach(z => {
    const rect = z.getBoundingClientRect();
    z.classList.toggle('drag-over',
      touch.clientX >= rect.left && touch.clientX <= rect.right &&
      touch.clientY >= rect.top && touch.clientY <= rect.bottom);
  });
}

function onTouchEnd(e) {
  if (touchClone) { touchClone.remove(); touchClone = null; }
  if (!draggedEl) return;
  draggedEl.classList.remove('dnd-item--dragging');
  const touch = e.changedTouches[0];
  const dropTargets = document.querySelectorAll('.dnd-zone, .dnd-match-slot, .dnd-stack-slot, .dnd-header-slot');
  let dropped = false;
  dropTargets.forEach(z => {
    z.classList.remove('drag-over');
    const rect = z.getBoundingClientRect();
    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
      const area = z.querySelector('.dnd-zone__items') || z;
      area.appendChild(draggedEl);
      dropped = true;
    }
  });
  if (!dropped) document.getElementById('dndItems').appendChild(draggedEl);
  draggedEl = null;
}

function makeDraggable(el) {
  el.draggable = true;
  el.addEventListener('dragstart', onDragStart);
  el.addEventListener('dragend', onDragEnd);
  el.addEventListener('touchstart', onTouchStart, { passive: false });
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  el.addEventListener('touchend', onTouchEnd);
}

function makeDropZone(zone) {
  zone.addEventListener('dragover', onDragOver);
  zone.addEventListener('dragleave', onDragLeave);
  zone.addEventListener('drop', makeDropHandler());
}

/* ========== Mode: Classic ========== */
function startClassic() {
  dndCurrentItems = shuffleArray(DRAG_DROP_ITEMS).slice(0, 12);
  const itemsContainer = document.getElementById('dndItems');
  const zonesContainer = document.getElementById('dndZones');
  document.getElementById('dndScore').innerHTML = '';

  itemsContainer.innerHTML = '';
  dndCurrentItems.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = `dnd-item dnd-item--type-${item.type}`;
    el.textContent = item.name;
    el.dataset.idx = idx;
    el.dataset.layer = item.layer;
    makeDraggable(el);
    itemsContainer.appendChild(el);
  });

  zonesContainer.innerHTML = '';
  OSI_LAYERS.forEach(layer => {
    const zone = document.createElement('div');
    zone.className = 'dnd-zone';
    zone.dataset.layer = layer.number;
    zone.style.borderColor = layer.color + '60';
    zone.style.background = layer.color + '08';
    zone.innerHTML = `<div class="dnd-zone__label" style="background:${layer.color}">L${layer.number} ${layer.name}</div><div class="dnd-zone__items"></div>`;
    makeDropZone(zone);
    zonesContainer.appendChild(zone);
  });
}

function checkClassic() {
  let correct = 0, total = 0;
  document.querySelectorAll('.dnd-zone').forEach(zone => {
    const zoneLayer = parseInt(zone.dataset.layer);
    zone.querySelectorAll('.dnd-item').forEach(item => {
      total++;
      const itemLayer = parseInt(item.dataset.layer);
      item.classList.remove('dnd-item--correct', 'dnd-item--wrong');
      if (itemLayer === zoneLayer) { item.classList.add('dnd-item--correct'); correct++; }
      else item.classList.add('dnd-item--wrong');
    });
  });
  const remaining = document.querySelectorAll('#dndItems .dnd-item').length;
  if (total === 0) { showScore('Перетащите элементы на уровни OSI'); return; }
  const pct = Math.round((correct / total) * 100);
  addXP(correct);
  if (pct === 100 && remaining === 0) unlockAchievement('dnd_perfect');
  if (pct === 100 && remaining === 0 && (Date.now() - modeStartTime) < 30000) unlockAchievement('secret_speedrun');
  showScore(`${correct}/${total} — ${pct}% правильных${remaining > 0 ? ` (ещё ${remaining} не размещено)` : ''}`);
}

/* ========== Mode: Reverse ========== */
function startReverse() {
  const items = shuffleArray(DRAG_DROP_ITEMS).slice(0, 8);
  const itemsContainer = document.getElementById('dndItems');
  const zonesContainer = document.getElementById('dndZones');
  document.getElementById('dndScore').innerHTML = '';

  // Create layer labels as draggable items
  itemsContainer.innerHTML = '';
  items.forEach((item, idx) => {
    const labels = [1,2,3,4,5,6,7].map(l => {
      const layer = OSI_LAYERS.find(x => x.number === l);
      const el = document.createElement('div');
      el.className = 'dnd-item';
      el.textContent = `L${l}`;
      el.style.background = layer.color + '20';
      el.style.borderColor = layer.color;
      el.style.color = layer.color;
      el.style.fontSize = '.7rem';
      el.style.padding = '4px 10px';
      el.dataset.layer = l;
      el.dataset.target = idx;
      makeDraggable(el);
      return el;
    });
    const group = document.createElement('div');
    group.className = 'dnd-reverse-group';
    group.innerHTML = `<div class="dnd-reverse-protocol">${item.name}</div>`;
    const slot = document.createElement('div');
    slot.className = 'dnd-zone dnd-match-slot';
    slot.dataset.answer = item.layer;
    slot.dataset.idx = idx;
    slot.style.minHeight = '36px';
    slot.style.padding = '6px';
    slot.innerHTML = '<div class="dnd-zone__items"></div>';
    makeDropZone(slot);
    group.appendChild(slot);
    zonesContainer.appendChild(group);
    labels.forEach(l => itemsContainer.appendChild(l));
  });
  zonesContainer.style.display = '';
}

function checkReverse() {
  let correct = 0, total = 0;
  document.querySelectorAll('.dnd-match-slot').forEach(slot => {
    const answer = parseInt(slot.dataset.answer);
    slot.querySelectorAll('.dnd-item').forEach(item => {
      total++;
      const chosen = parseInt(item.dataset.layer);
      item.classList.remove('dnd-item--correct', 'dnd-item--wrong');
      if (chosen === answer) { item.classList.add('dnd-item--correct'); correct++; }
      else item.classList.add('dnd-item--wrong');
    });
  });
  if (total === 0) { showScore('Перетащите метки уровней на протоколы'); return; }
  const pct = Math.round((correct / total) * 100);
  addXP(correct);
  if (pct === 100) unlockAchievement('dnd_reverse');
  showScore(`${correct}/${total} — ${pct}%`);
}

/* ========== Mode: Ports ========== */
function startPorts() {
  const pairs = shuffleArray(DND_PORTS).slice(0, 10);
  const itemsContainer = document.getElementById('dndItems');
  const zonesContainer = document.getElementById('dndZones');
  document.getElementById('dndScore').innerHTML = '';

  itemsContainer.innerHTML = '<div class="dnd-match-title">Порты:</div>';
  const shuffledPorts = shuffleArray(pairs);
  shuffledPorts.forEach((p, idx) => {
    const el = document.createElement('div');
    el.className = 'dnd-item dnd-item--type-protocol';
    el.textContent = p.port;
    el.dataset.port = p.port;
    el.dataset.idx = idx;
    makeDraggable(el);
    itemsContainer.appendChild(el);
  });

  zonesContainer.innerHTML = '<div class="dnd-match-title">Сервисы:</div>';
  const shuffledServices = shuffleArray([...pairs]);
  shuffledServices.forEach(p => {
    const slot = document.createElement('div');
    slot.className = 'dnd-zone dnd-match-slot';
    slot.dataset.answer = p.port;
    slot.style.minHeight = '38px';
    slot.style.padding = '6px 10px';
    slot.style.marginBottom = '4px';
    slot.innerHTML = `<span class="dnd-match-service">${p.service}</span><span class="dnd-match-hint">${p.hint}</span><div class="dnd-zone__items" style="display:inline-flex;margin-left:8px"></div>`;
    makeDropZone(slot);
    zonesContainer.appendChild(slot);
  });
}

function checkPorts() {
  let correct = 0, total = 0;
  document.querySelectorAll('.dnd-match-slot').forEach(slot => {
    const answer = parseInt(slot.dataset.answer);
    slot.querySelectorAll('.dnd-item').forEach(item => {
      total++;
      const port = parseInt(item.dataset.port);
      item.classList.remove('dnd-item--correct', 'dnd-item--wrong');
      if (port === answer) { item.classList.add('dnd-item--correct'); correct++; }
      else item.classList.add('dnd-item--wrong');
    });
  });
  if (total === 0) { showScore('Перетащите порты к соответствующим сервисам'); return; }
  const pct = Math.round((correct / total) * 100);
  addXP(correct);
  if (pct === 100) unlockAchievement('dnd_ports');
  showScore(`${correct}/${total} — ${pct}%`);
}

/* ========== Mode: Headers ========== */
function startHeaders() {
  const proto = DND_HEADERS[Math.floor(Math.random() * DND_HEADERS.length)];
  const itemsContainer = document.getElementById('dndItems');
  const zonesContainer = document.getElementById('dndZones');
  document.getElementById('dndScore').innerHTML = '';

  itemsContainer.innerHTML = `<div class="dnd-match-title">Поля заголовка ${proto.protocol}:</div>`;
  const shuffled = shuffleArray(proto.fields);
  shuffled.forEach((field, idx) => {
    const el = document.createElement('div');
    el.className = 'dnd-item dnd-item--type-standard';
    el.textContent = field;
    el.dataset.field = field;
    el.dataset.idx = idx;
    makeDraggable(el);
    itemsContainer.appendChild(el);
  });

  zonesContainer.innerHTML = `<div class="dnd-match-title">Расставьте в правильном порядке (слева направо):</div><div class="dnd-header-slots" id="headerSlots"></div>`;
  const slotsContainer = document.getElementById('headerSlots');
  proto.fields.forEach((_, i) => {
    const slot = document.createElement('div');
    slot.className = 'dnd-zone dnd-header-slot';
    slot.dataset.order = i;
    slot.innerHTML = `<div class="dnd-header-slot__num">${i + 1}</div><div class="dnd-zone__items"></div>`;
    makeDropZone(slot);
    slotsContainer.appendChild(slot);
  });

  // Store correct order
  zonesContainer.dataset.correctOrder = JSON.stringify(proto.fields);
}

function checkHeaders() {
  const correctOrder = JSON.parse(document.getElementById('dndZones').dataset.correctOrder || '[]');
  let correct = 0, total = 0;
  document.querySelectorAll('.dnd-header-slot').forEach(slot => {
    const order = parseInt(slot.dataset.order);
    slot.querySelectorAll('.dnd-item').forEach(item => {
      total++;
      item.classList.remove('dnd-item--correct', 'dnd-item--wrong');
      if (item.dataset.field === correctOrder[order]) { item.classList.add('dnd-item--correct'); correct++; }
      else item.classList.add('dnd-item--wrong');
    });
  });
  if (total === 0) { showScore('Расставьте поля заголовка по порядку'); return; }
  const pct = Math.round((correct / total) * 100);
  addXP(correct);
  if (pct === 100) unlockAchievement('dnd_headers');
  showScore(`${correct}/${total} — ${pct}%`);
}

/* ========== Mode: Encapsulation ========== */
function startEncap() {
  const stack = DND_ENCAP_STACKS[Math.floor(Math.random() * DND_ENCAP_STACKS.length)];
  const itemsContainer = document.getElementById('dndItems');
  const zonesContainer = document.getElementById('dndZones');
  document.getElementById('dndScore').innerHTML = '';

  itemsContainer.innerHTML = `<div class="dnd-match-title">Протоколы для стека «${stack.name}»:</div>`;
  const shuffled = shuffleArray(stack.stack);
  shuffled.forEach((proto, idx) => {
    const el = document.createElement('div');
    el.className = 'dnd-item dnd-item--type-protocol';
    el.textContent = proto;
    el.dataset.proto = proto;
    el.dataset.idx = idx;
    makeDraggable(el);
    itemsContainer.appendChild(el);
  });

  zonesContainer.innerHTML = `<div class="dnd-match-title">Соберите стек (сверху = L7, снизу = L2):</div><div class="dnd-stack-slots" id="stackSlots"></div>`;
  const slotsContainer = document.getElementById('stackSlots');
  stack.stack.forEach((_, i) => {
    const slot = document.createElement('div');
    slot.className = 'dnd-zone dnd-stack-slot';
    slot.dataset.order = i;
    const layerLabels = ['L7 Application', 'L6/L5 Session', 'L4 Transport', 'L3 Network', 'L2 Data Link'];
    slot.innerHTML = `<div class="dnd-stack-slot__label">${layerLabels[i] || 'L' + (7 - i)}</div><div class="dnd-zone__items"></div>`;
    makeDropZone(slot);
    slotsContainer.appendChild(slot);
  });

  zonesContainer.dataset.correctOrder = JSON.stringify(stack.stack);
}

function checkEncap() {
  const correctOrder = JSON.parse(document.getElementById('dndZones').dataset.correctOrder || '[]');
  let correct = 0, total = 0;
  document.querySelectorAll('.dnd-stack-slot').forEach(slot => {
    const order = parseInt(slot.dataset.order);
    slot.querySelectorAll('.dnd-item').forEach(item => {
      total++;
      item.classList.remove('dnd-item--correct', 'dnd-item--wrong');
      if (item.dataset.proto === correctOrder[order]) { item.classList.add('dnd-item--correct'); correct++; }
      else item.classList.add('dnd-item--wrong');
    });
  });
  if (total === 0) { showScore('Расставьте протоколы в стек инкапсуляции'); return; }
  const pct = Math.round((correct / total) * 100);
  addXP(correct * 2);
  if (pct === 100) unlockAchievement('dnd_encap');
  showScore(`${correct}/${total} — ${pct}%`);
}

/* ========== Mode: Devices ========== */
function startDevices() {
  const devices = DRAG_DROP_ITEMS.filter(i => i.type === 'device');
  dndCurrentItems = shuffleArray(devices).slice(0, 10);
  const itemsContainer = document.getElementById('dndItems');
  const zonesContainer = document.getElementById('dndZones');
  document.getElementById('dndScore').innerHTML = '';

  itemsContainer.innerHTML = '';
  dndCurrentItems.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'dnd-item dnd-item--type-device';
    el.textContent = item.name;
    el.dataset.idx = idx;
    el.dataset.layer = item.layer;
    makeDraggable(el);
    itemsContainer.appendChild(el);
  });

  zonesContainer.innerHTML = '';
  OSI_LAYERS.forEach(layer => {
    const zone = document.createElement('div');
    zone.className = 'dnd-zone';
    zone.dataset.layer = layer.number;
    zone.style.borderColor = layer.color + '60';
    zone.style.background = layer.color + '08';
    zone.innerHTML = `<div class="dnd-zone__label" style="background:${layer.color}">L${layer.number} ${layer.name}</div><div class="dnd-zone__items"></div>`;
    makeDropZone(zone);
    zonesContainer.appendChild(zone);
  });
}

/* ========== Mode: Topology Quiz ========== */
let topoQuestion = null;

function startTopology() {
  const itemsContainer = document.getElementById('dndItems');
  const zonesContainer = document.getElementById('dndZones');
  document.getElementById('dndScore').innerHTML = '';

  const questions = [
    { q: 'Компьютер подключается к интернету через домашнюю сеть. Правильный порядок устройств:', answer: ['Компьютер', 'Коммутатор', 'Маршрутизатор', 'Модем', 'ISP'] },
    { q: 'Пакет идёт между двумя офисами через VPN. Порядок:', answer: ['ПК отправитель', 'Коммутатор', 'Маршрутизатор', 'VPN-шлюз', 'Интернет', 'VPN-шлюз', 'Маршрутизатор', 'ПК получатель'] },
    { q: 'Wi-Fi клиент подключается к серверу в дата-центре:', answer: ['Ноутбук', 'Точка доступа', 'Коммутатор', 'Маршрутизатор', 'Файрвол', 'Сервер'] },
    { q: 'Уровни инкапсуляции HTTP-запроса (сверху вниз):', answer: ['HTTP (L7)', 'TCP (L4)', 'IP (L3)', 'Ethernet (L2)', 'Биты (L1)'] },
    { q: 'Порядок обработки кадра коммутатором:', answer: ['Приём кадра', 'Проверка FCS', 'Чтение MAC-адреса', 'Поиск в таблице MAC', 'Пересылка на порт'] }
  ];

  topoQuestion = questions[Math.floor(Math.random() * questions.length)];
  itemsContainer.innerHTML = `<div class="dnd-match-title">${topoQuestion.q}</div>`;

  const shuffled = shuffleArray(topoQuestion.answer);
  zonesContainer.innerHTML = '<div class="dnd-topo-options" id="topoOptions"></div>';
  const container = document.getElementById('topoOptions');

  shuffled.forEach((item, idx) => {
    const btn = document.createElement('button');
    btn.className = 'dnd-topo-btn';
    btn.textContent = item;
    btn.dataset.value = item;
    btn.dataset.selected = '';
    btn.addEventListener('click', () => {
      const selectedDiv = document.getElementById('topoSelected');
      const chip = document.createElement('div');
      chip.className = 'dnd-topo-chip';
      chip.textContent = `${selectedDiv.children.length + 1}. ${item}`;
      chip.dataset.value = item;
      chip.addEventListener('click', () => { chip.remove(); btn.disabled = false; btn.style.opacity = '1'; });
      selectedDiv.appendChild(chip);
      btn.disabled = true;
      btn.style.opacity = '.3';
    });
    container.appendChild(btn);
  });

  const selectedArea = document.createElement('div');
  selectedArea.className = 'dnd-topo-selected';
  selectedArea.id = 'topoSelected';
  selectedArea.innerHTML = '<div class="dnd-match-title" style="margin-bottom:6px">Ваш порядок (нажмите для добавления):</div>';
  zonesContainer.appendChild(selectedArea);
}

function checkTopology() {
  if (!topoQuestion) return;
  const selected = document.getElementById('topoSelected');
  const chips = selected.querySelectorAll('.dnd-topo-chip');
  if (chips.length === 0) { showScore('Выберите элементы в правильном порядке'); return; }

  let correct = 0;
  chips.forEach((chip, i) => {
    chip.classList.remove('dnd-item--correct', 'dnd-item--wrong');
    if (chip.dataset.value === topoQuestion.answer[i]) { chip.classList.add('dnd-item--correct'); correct++; }
    else chip.classList.add('dnd-item--wrong');
  });

  const total = topoQuestion.answer.length;
  const pct = Math.round((correct / total) * 100);
  addXP(correct);
  showScore(`${correct}/${total} — ${pct}%`);
}

/* ========== Score display ========== */
function showScore(text) {
  document.getElementById('dndScore').innerHTML = `<div class="dnd-score"><div class="dnd-score__label">${text}</div></div>`;
}

/* ========== Mode switcher ========== */
function renderModes() {
  const container = document.getElementById('dndModes');
  container.innerHTML = DND_MODES.map(m =>
    `<button class="dnd-mode-btn${m.id === currentMode ? ' active' : ''}" data-mode="${m.id}" title="${m.desc}">${m.icon} ${m.label}</button>`
  ).join('');

  container.querySelectorAll('.dnd-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMode = btn.dataset.mode;
      container.querySelectorAll('.dnd-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      startCurrentMode();
    });
  });
}

function startCurrentMode() {
  modeStartTime = Date.now();
  document.getElementById('dndItems').innerHTML = '';
  document.getElementById('dndZones').innerHTML = '';
  document.getElementById('dndScore').innerHTML = '';

  switch (currentMode) {
    case 'classic': startClassic(); break;
    case 'reverse': startReverse(); break;
    case 'ports': startPorts(); break;
    case 'headers': startHeaders(); break;
    case 'encap': startEncap(); break;
    case 'devices': startDevices(); break;
    case 'topology': startTopology(); break;
  }
}

function checkCurrentMode() {
  switch (currentMode) {
    case 'classic': case 'devices': checkClassic(); break;
    case 'reverse': checkReverse(); break;
    case 'ports': checkPorts(); break;
    case 'headers': checkHeaders(); break;
    case 'encap': checkEncap(); break;
    case 'topology': checkTopology(); break;
  }
}

export function initDnD() {
  renderModes();

  document.getElementById('dndCheck').addEventListener('click', checkCurrentMode);
  document.getElementById('dndReset').addEventListener('click', startCurrentMode);

  startCurrentMode();
}
