import { OSI_LAYERS, TCPIP_MAPPING } from '../data/osi-layers.js';
import { addXP, unlockAchievement, gameState, saveGame } from '../core/gamification.js';
import { buildTower } from './osi-tower.js';
import { navigateTo } from '../core/router.js';

let currentStudyLayer = 7;

function selectStudyLayer(num) {
  currentStudyLayer = num;
  const layer = OSI_LAYERS.find(l => l.number === num);

  document.querySelectorAll('#studyTower .osi-layer').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.layer) === num);
    if (parseInt(el.dataset.layer) === num) {
      el.style.borderColor = layer.color;
    } else {
      el.style.borderColor = 'transparent';
    }
  });

  const panel = document.getElementById('studyPanel');
  panel.innerHTML = `
    <div class="study-panel">
      <div class="study-panel__header" style="background:${layer.color}">
        <div class="study-panel__layer-num">L${layer.number}</div>
        <div class="study-panel__layer-name">${layer.name}</div>
        <div class="study-panel__layer-name-en">${layer.nameEn}</div>
      </div>
      <div class="study-panel__body">
        <div class="study-section">
          <div class="study-section__title">Описание</div>
          <div class="study-section__text">${layer.description}</div>
        </div>
        <div class="study-section">
          <div class="study-section__title">Основные функции</div>
          <ul class="func-list">
            ${layer.functions.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
        <div class="study-section">
          <div class="study-section__title">Протоколы</div>
          <div class="tag-list">
            ${layer.protocols.map(p => `<span class="tag" style="color:${layer.color};border-color:${layer.color}40">${p}</span>`).join('')}
          </div>
        </div>
        <div class="study-section">
          <div class="study-section__title">Устройства</div>
          <div class="tag-list">
            ${layer.devices.map(d => `<span class="tag" style="color:${layer.color};border-color:${layer.color}40">⚙ ${d}</span>`).join('')}
          </div>
        </div>
        <div class="study-section">
          <div class="study-section__title">PDU — ${layer.pdu}</div>
          ${layer.pduFields ? `<div class="pdu-diagram" style="height:auto;flex-wrap:wrap;margin-bottom:8px">
            ${layer.pduFields.map(f => `<div class="pdu-diagram__seg" style="flex:${f.size === 'N' || f.size.includes('1500') ? 4 : 1};background:${f.color};padding:6px 4px;min-height:36px;flex-direction:column;gap:1px">
              <span>${f.name}</span>
              ${f.size ? `<span style="font-size:.5rem;opacity:.7">${f.size}</span>` : ''}
            </div>`).join('')}
          </div>` : ''}
        </div>
        <div class="study-section">
          <div class="study-section__title">Инкапсуляция</div>
          <div class="study-section__text">${layer.encapsulation}</div>
        </div>
        <div class="study-section">
          <div class="study-section__title">Аналогия</div>
          <div class="analogy-box" style="border-color:${layer.color}">${layer.analogy}</div>
        </div>
        ${layer.examples && layer.examples.length ? `
        <div class="study-section">
          <div class="study-section__title">Примеры — как это выглядит</div>
          ${layer.examples.map(ex => `
            <div style="margin-bottom:8px">
              <div style="font-size:.78rem;font-weight:700;margin-bottom:4px;color:${layer.color}">${ex.name}</div>
              <div class="pdu-appdata" style="font-size:.68rem;line-height:1.5;max-height:none">${ex.code}</div>
            </div>
          `).join('')}
        </div>` : ''}
      </div>
    </div>
  `;

  document.getElementById('studyPrev').disabled = num === 7;
  document.getElementById('studyNext').disabled = num === 1;
  trackStudyLayer(num);
}

function trackStudyLayer(num) {
  if (!gameState.studiedLayers.includes(num)) {
    gameState.studiedLayers.push(num);
    saveGame();
    addXP(3);
  }
  if (gameState.studiedLayers.length === 7) unlockAchievement('study_all');
}

function buildComparisonTable() {
  const table = document.getElementById('comparisonTable');
  let html = `<thead><tr><th>OSI</th><th>Уровень</th><th>TCP/IP</th></tr></thead><tbody>`;
  const used = {};
  OSI_LAYERS.forEach(layer => {
    const tcpip = TCPIP_MAPPING.find(m => m.osiLayers.includes(layer.number));
    const rowspan = tcpip && !used[tcpip.name] ? tcpip.osiLayers.length : 0;
    if (tcpip) used[tcpip.name] = true;
    html += `<tr>
      <td style="color:${layer.color};font-weight:700">L${layer.number}</td>
      <td>${layer.name}</td>
      ${rowspan ? `<td rowspan="${rowspan}" style="color:${tcpip.color};font-weight:700">${tcpip.name}</td>` : ''}
    </tr>`;
  });
  html += '</tbody>';
  table.innerHTML = html;
}

export function initStudy() {
  // Build study tower
  buildTower(document.getElementById('studyTower'), selectStudyLayer);

  // Build home tower (it navigates to study on click)
  buildTower(document.getElementById('homeTower'), (num) => {
    navigateTo('study');
    selectStudyLayer(num);
  });

  // Initial selection
  selectStudyLayer(7);

  // Button handlers
  document.getElementById('studyPrev').addEventListener('click', () => {
    if (currentStudyLayer < 7) selectStudyLayer(currentStudyLayer + 1);
  });
  document.getElementById('studyNext').addEventListener('click', () => {
    if (currentStudyLayer > 1) selectStudyLayer(currentStudyLayer - 1);
  });

  // Keyboard handler
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('section-study').classList.contains('active')) return;
    if (e.key === 'ArrowUp' && currentStudyLayer < 7) selectStudyLayer(currentStudyLayer + 1);
    if (e.key === 'ArrowDown' && currentStudyLayer > 1) selectStudyLayer(currentStudyLayer - 1);
  });

  // Comparison table
  buildComparisonTable();
}
