import { OSI_LAYERS } from '../data/osi-layers.js';

export function buildTower(container, onClick) {
  if (typeof container === 'string') container = document.getElementById(container);
  container.innerHTML = '';
  OSI_LAYERS.forEach(layer => {
    const el = document.createElement('div');
    el.className = 'osi-layer';
    el.dataset.layer = layer.number;
    el.style.setProperty('--lc', layer.color);
    el.innerHTML = `
      <div class="osi-layer__number" style="background:${layer.color}">${layer.number}</div>
      <div class="osi-layer__info">
        <div class="osi-layer__name">${layer.name}</div>
        <div class="osi-layer__name-en">${layer.nameEn}</div>
      </div>
      <span class="osi-layer__arrow">›</span>
    `;
    el.style.cssText += `border-color: transparent;`;
    el.querySelector('.osi-layer__number').style.background = layer.color;
    el.addEventListener('click', () => onClick(layer.number));
    container.appendChild(el);

    const style = el.style;
    style.setProperty('background', `${layer.color}10`);
  });
}
