import { OSI_LAYERS } from '../data/osi-layers.js';

export function runFragmentation(labState) {
  const s = labState.fragmentation;
  const payload = s.mtu - s.headerSize;
  const fragments = Math.ceil(s.messageSize / payload);
  const lastSize = s.messageSize % payload || payload;

  const pieces = [];
  for (let i = 0; i < fragments; i++) {
    const size = (i === fragments - 1) ? lastSize : payload;
    pieces.push({
      id: i + 1,
      offset: i * payload,
      size: size,
      totalSize: size + s.headerSize,
      moreFragments: i < fragments - 1
    });
  }

  const result = document.getElementById('labResult-fragmentation');
  const widthScale = 100 / s.messageSize;

  result.innerHTML = `
    <div class="lab-result__title">Результат фрагментации</div>
    <div class="lab-stats">
      <div class="lab-stat">
        <div class="lab-stat__value">${fragments}</div>
        <div class="lab-stat__label">Фрагментов</div>
      </div>
      <div class="lab-stat">
        <div class="lab-stat__value">${s.messageSize} Б</div>
        <div class="lab-stat__label">Размер данных</div>
      </div>
      <div class="lab-stat">
        <div class="lab-stat__value">${payload} Б</div>
        <div class="lab-stat__label">Полезная нагрузка</div>
      </div>
      <div class="lab-stat">
        <div class="lab-stat__value">${fragments * s.headerSize} Б</div>
        <div class="lab-stat__label">Накладные расходы</div>
      </div>
    </div>
    <div class="lab-frag-visual mt-16">
      <div class="lab-frag-original">Исходное сообщение: ${s.messageSize} байт</div>
      <div class="lab-frag-arrow">↓ MTU = ${s.mtu} байт ↓</div>
      <div class="lab-frag-pieces">
        ${pieces.map((p, i) => {
          const w = Math.max(p.size * widthScale, 8);
          return `<div class="lab-frag-piece" style="width:${w}%;min-width:60px;background:${OSI_LAYERS.find(l => l.number === 3).color};animation:slideIn .3s ease ${i * 0.08}s both">
            #${p.id} (${p.totalSize}Б)
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="lab-packets mt-16">
      ${pieces.map((p, i) => `
        <div class="lab-packet" style="animation:slideIn .3s ease ${i * 0.06}s both">
          <div class="lab-packet__status lab-packet__status--ok"></div>
          <div class="lab-packet__label">Фрагмент #${p.id}: offset=${p.offset}, size=${p.size}, MF=${p.moreFragments ? 1 : 0}</div>
          <div class="lab-packet__size">${p.totalSize} Б</div>
        </div>
      `).join('')}
    </div>
    <div class="card mt-16" style="font-size:.82rem;line-height:1.6">
      <strong>Эффективность:</strong> ${((s.messageSize / (s.messageSize + fragments * s.headerSize)) * 100).toFixed(1)}% полезной нагрузки.
      ${fragments > 1 ? `При MTU=${s.mtu} сообщение в ${s.messageSize} байт разбивается на ${fragments} фрагментов. Каждый фрагмент получает собственный IP-заголовок (${s.headerSize} байт), что увеличивает накладные расходы.` : 'Фрагментация не требуется — сообщение помещается в один пакет.'}
    </div>
  `;
}
