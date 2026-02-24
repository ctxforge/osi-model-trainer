/* ==================== DRAG & DROP ==================== */
import { OSI_LAYERS } from '../data/osi-layers.js';
import { DRAG_DROP_ITEMS } from '../data/dragdrop-data.js';
import { addXP, unlockAchievement } from '../core/gamification.js';

let dndCurrentItems = [];
let draggedItem = null;
let draggedEl = null;
let touchClone = null;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startDnD() {
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
    el.draggable = true;

    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('dragend', onDragEnd);
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

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

    zone.addEventListener('dragover', onDragOver);
    zone.addEventListener('dragleave', onDragLeave);
    zone.addEventListener('drop', onDrop);

    zonesContainer.appendChild(zone);
  });
}

function onDragStart(e) {
  draggedEl = e.target;
  draggedItem = {
    idx: e.target.dataset.idx,
    layer: e.target.dataset.layer,
    name: e.target.textContent
  };
  e.target.classList.add('dnd-item--dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd(e) {
  e.target.classList.remove('dnd-item--dragging');
  document.querySelectorAll('.dnd-zone').forEach(z => z.classList.remove('drag-over'));
}

function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const zone = e.currentTarget;
  zone.classList.remove('drag-over');
  if (!draggedEl) return;
  const itemsArea = zone.querySelector('.dnd-zone__items');
  draggedEl.classList.remove('dnd-item--dragging');
  itemsArea.appendChild(draggedEl);
  draggedEl = null;
  draggedItem = null;
}

function onTouchStart(e) {
  e.preventDefault();
  const el = e.target.closest('.dnd-item');
  if (!el) return;
  draggedEl = el;
  draggedItem = { idx: el.dataset.idx, layer: el.dataset.layer, name: el.textContent };

  touchClone = el.cloneNode(true);
  touchClone.style.cssText = `position:fixed;z-index:9999;pointer-events:none;opacity:.85;transform:scale(1.08);`;
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

  document.querySelectorAll('.dnd-zone').forEach(z => {
    const rect = z.getBoundingClientRect();
    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
      z.classList.add('drag-over');
    } else {
      z.classList.remove('drag-over');
    }
  });
}

function onTouchEnd(e) {
  if (touchClone) {
    touchClone.remove();
    touchClone = null;
  }
  if (!draggedEl) return;
  draggedEl.classList.remove('dnd-item--dragging');

  const touch = e.changedTouches[0];
  const zones = document.querySelectorAll('.dnd-zone');
  let dropped = false;

  zones.forEach(z => {
    z.classList.remove('drag-over');
    const rect = z.getBoundingClientRect();
    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
      z.querySelector('.dnd-zone__items').appendChild(draggedEl);
      dropped = true;
    }
  });

  if (!dropped) {
    document.getElementById('dndItems').appendChild(draggedEl);
  }

  draggedEl = null;
  draggedItem = null;
}

export function initDnD() {
  document.getElementById('dndCheck').addEventListener('click', () => {
    let correct = 0;
    let total = 0;

    document.querySelectorAll('.dnd-zone').forEach(zone => {
      const zoneLayer = parseInt(zone.dataset.layer);
      zone.querySelectorAll('.dnd-item').forEach(item => {
        total++;
        const itemLayer = parseInt(item.dataset.layer);
        item.classList.remove('dnd-item--correct', 'dnd-item--wrong');
        if (itemLayer === zoneLayer) {
          item.classList.add('dnd-item--correct');
          correct++;
        } else {
          item.classList.add('dnd-item--wrong');
        }
      });
    });

    const remaining = document.querySelectorAll('#dndItems .dnd-item').length;
    const scoreEl = document.getElementById('dndScore');

    if (total === 0) {
      scoreEl.innerHTML = '<div class="dnd-score"><div class="dnd-score__label">Перетащите элементы на уровни OSI</div></div>';
      return;
    }

    const pct = Math.round((correct / total) * 100);
    addXP(correct);
    if (pct === 100 && remaining === 0) unlockAchievement('dnd_perfect');
    scoreEl.innerHTML = `
      <div class="dnd-score">
        <div class="dnd-score__value">${correct}/${total}</div>
        <div class="dnd-score__label">${pct}% правильных${remaining > 0 ? ` (ещё ${remaining} не размещено)` : ''}</div>
      </div>
    `;
  });

  document.getElementById('dndReset').addEventListener('click', startDnD);

  startDnD();
}
