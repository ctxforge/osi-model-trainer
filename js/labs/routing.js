import { sleep } from '../core/utils.js';

export async function runRouting(labState) {
  const s = labState.routing;
  const result = document.getElementById('labResult-routing');
  const hops = s.hops;
  const ttl = s.ttl;
  const reaches = ttl > hops;

  const nodes = [{ type: 'pc', label: 'Источник', icon: '💻' }];
  for (let i = 0; i < hops; i++) {
    nodes.push({ type: 'router', label: `R${i + 1}`, icon: '🔀' });
  }
  nodes.push({ type: 'pc', label: 'Назначение', icon: '🖥️' });

  result.innerHTML = `
    <div class="lab-result__title">Маршрут пакета</div>
    <div class="lab-route-visual" id="routeVisual">
      ${nodes.map((n, i) => {
        const isLast = i === nodes.length - 1;
        return `
          <div class="lab-route-node" id="routeNode-${i}">
            <div class="lab-route-node__icon">${n.icon}</div>
            <div class="lab-route-node__label">${n.label}</div>
            <div class="lab-route-node__ttl" id="routeTTL-${i}"></div>
          </div>
          ${!isLast ? `<div class="lab-route-link" id="routeLink-${i}"></div>` : ''}
        `;
      }).join('')}
    </div>
    <div class="lab-stats" id="routeStats">
      <div class="lab-stat">
        <div class="lab-stat__value">${ttl}</div>
        <div class="lab-stat__label">Начальный TTL</div>
      </div>
      <div class="lab-stat">
        <div class="lab-stat__value">${hops}</div>
        <div class="lab-stat__label">Хопов</div>
      </div>
      <div class="lab-stat">
        <div class="lab-stat__value">${reaches ? '✓' : '✗'}</div>
        <div class="lab-stat__label">${reaches ? 'Доставлен' : 'TTL истёк'}</div>
      </div>
      <div class="lab-stat">
        <div class="lab-stat__value">${reaches ? ttl - hops : 0}</div>
        <div class="lab-stat__label">Оставшийся TTL</div>
      </div>
    </div>
  `;

  let currentTTL = ttl;
  for (let i = 0; i < nodes.length; i++) {
    await sleep(400);
    const node = document.getElementById('routeNode-' + i);
    const ttlEl = document.getElementById('routeTTL-' + i);
    if (!node) break;

    if (currentTTL <= 0 && i > 0) {
      node.classList.add('lab-route-node--dead');
      ttlEl.textContent = 'TTL=0 ✗';
      ttlEl.style.color = '#e74c3c';
      break;
    }

    node.classList.add('lab-route-node--active');
    ttlEl.textContent = `TTL=${currentTTL}`;

    if (i > 0 && i < nodes.length) {
      const link = document.getElementById('routeLink-' + (i - 1));
      if (link) link.classList.add('active');
    }

    if (i > 0 && i < nodes.length - 1) {
      currentTTL--;
    }
  }

  if (!reaches) {
    await sleep(500);
    const explanation = document.createElement('div');
    explanation.className = 'card mt-16';
    explanation.style.cssText = 'font-size:.82rem;line-height:1.6';
    explanation.innerHTML = `<strong>TTL истёк!</strong> Пакет был уничтожен на маршрутизаторе R${ttl} после ${ttl} хопов.
      Маршрутизатор отправил ICMP-сообщение «Time Exceeded» источнику. Увеличьте TTL до ${hops + 1} или больше для доставки.`;
    result.appendChild(explanation);
  } else {
    await sleep(300);
    const explanation = document.createElement('div');
    explanation.className = 'card mt-16';
    explanation.style.cssText = 'font-size:.82rem;line-height:1.6';
    explanation.innerHTML = `<strong>Доставлен!</strong> Пакет прошёл ${hops} хопов и достиг назначения с TTL=${ttl - hops}.
      Каждый маршрутизатор уменьшал TTL на 1.`;
    result.appendChild(explanation);
  }
}
