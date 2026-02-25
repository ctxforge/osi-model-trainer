/* ==================== HOME SECTION ==================== */
import { gameState, getCurrentLevel, getNextLevel } from '../core/gamification.js';
import { ACHIEVEMENTS } from '../data/gamification-data.js';
import { THEORY_TOPICS } from '../data/theory-data.js';
import { navigateTo } from '../core/router.js';
import { getProgress } from '../core/quest-engine.js';
import { QUEST_TEMPLATES } from '../data/quest-templates.js';

function renderProgress() {
  const container = document.getElementById('homeProgress');
  if (!container) return;

  if (gameState.xp <= 0) {
    container.innerHTML = '';
    return;
  }

  const lvl = getCurrentLevel();
  const next = getNextLevel();
  const pct = next.minXp > lvl.minXp
    ? ((gameState.xp - lvl.minXp) / (next.minXp - lvl.minXp)) * 100
    : 100;

  const theoryRead = (gameState.theoryRead || []).length;
  const theoryTotal = THEORY_TOPICS.length;
  const osiStudied = (gameState.studiedLayers || []).length;
  const achUnlocked = (gameState.achievements || []).length;
  const achTotal = ACHIEVEMENTS.length;

  container.innerHTML = `
    <div class="home-progress">
      <div class="home-progress__header">
        <div class="home-progress__icon">${lvl.icon}</div>
        <div class="home-progress__info">
          <div class="home-progress__level">Уровень ${lvl.level}: ${lvl.name}</div>
          <div class="home-progress__xp-text">${gameState.xp} XP${next.minXp > lvl.minXp ? ` / ${next.minXp} до «${next.name}»` : ' — максимум!'}</div>
        </div>
      </div>
      <div class="home-progress__bar">
        <div class="home-progress__bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="home-progress__metrics">
        <div class="home-progress__metric">
          <div class="home-progress__metric-value">${theoryRead}/${theoryTotal}</div>
          <div class="home-progress__metric-label">Теорий</div>
        </div>
        <div class="home-progress__metric">
          <div class="home-progress__metric-value">${osiStudied}/7</div>
          <div class="home-progress__metric-label">OSI-уровней</div>
        </div>
        <div class="home-progress__metric">
          <div class="home-progress__metric-value">${achUnlocked}/${achTotal}</div>
          <div class="home-progress__metric-label">Достижений</div>
        </div>
        <div class="home-progress__metric">
          <div class="home-progress__metric-value">${Object.values(getProgress()).filter(v => v.completed).length}/${QUEST_TEMPLATES.length}</div>
          <div class="home-progress__metric-label">Квестов</div>
        </div>
      </div>
    </div>
  `;
}

function updateBadges() {
  const theoryBadge = document.getElementById('badgeTheory');
  const studyBadge = document.getElementById('badgeStudy');

  if (theoryBadge) {
    const read = (gameState.theoryRead || []).length;
    theoryBadge.textContent = read > 0 ? `${read}/${THEORY_TOPICS.length}` : '';
  }

  if (studyBadge) {
    const studied = (gameState.studiedLayers || []).length;
    studyBadge.textContent = studied > 0 ? `${studied}/7` : '';
  }
}

export function initHome() {
  renderProgress();
  updateBadges();

  // Feature card navigation
  document.querySelectorAll('.feature-card[data-nav]').forEach(card => {
    card.addEventListener('click', () => navigateTo(card.dataset.nav));
  });
}
