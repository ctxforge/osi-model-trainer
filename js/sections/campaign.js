/* ==================== CAMPAIGN UI ==================== */
import {
  registerTemplates, registerChapters, getChapters, getChapterQuests,
  getQuestTemplate, getProgress, isChapterUnlocked, getQuestState,
  startBriefing, startQuest, getHint, submitAnswer, retryQuest, exitQuest,
  setMode, getMode
} from '../core/quest-engine.js';
import { QUEST_CHAPTERS, QUEST_TEMPLATES } from '../data/quest-templates.js';
import { navigateTo } from '../core/router.js';

/* ---- Register data ---- */
registerChapters(QUEST_CHAPTERS);
registerTemplates(QUEST_TEMPLATES);

/* ---- State ---- */
let currentView = 'map'; // 'map' | 'chapter' | 'briefing' | 'active' | 'result'
let selectedChapter = null;
let timerInterval = null;
let activeHints = [];

/* ---- Main render ---- */
function render() {
  const container = document.getElementById('campaignContent');
  if (!container) return;

  switch (currentView) {
    case 'map': renderMap(container); break;
    case 'chapter': renderChapter(container); break;
    case 'briefing': renderBriefing(container); break;
    case 'active': renderActive(container); break;
    case 'result': renderResult(container); break;
  }
}

/* ---- Map View ---- */
function renderMap(container) {
  const chapters = getChapters();
  const progress = getProgress();

  let html = '<div class="campaign-map">';
  chapters.forEach(ch => {
    const unlocked = isChapterUnlocked(ch.id);
    const quests = getChapterQuests(ch.id);
    const completed = quests.filter(q => progress[q.id]?.completed).length;
    const totalStars = quests.reduce((s, q) => s + (progress[q.id]?.bestStars || 0), 0);
    const maxStars = quests.length * 3;
    const pct = quests.length > 0 ? (completed / quests.length * 100) : 0;

    html += `<div class="chapter-card${unlocked ? '' : ' locked'}${pct === 100 ? ' completed' : ''}" data-chapter="${ch.id}">
      ${!unlocked ? '<div class="chapter-card__lock">🔒</div>' : ''}
      <div class="chapter-card__icon">${ch.icon}</div>
      <div class="chapter-card__title">${ch.name}</div>
      <div class="chapter-card__desc">${ch.desc}</div>
      <div class="chapter-card__npc">${ch.npc}</div>
      <div class="chapter-card__progress">
        <div class="chapter-card__bar">
          <div class="chapter-card__bar-fill" style="width:${pct}%;background:${ch.color}"></div>
        </div>
        <div class="chapter-card__stars">${totalStars}/${maxStars} ⭐</div>
      </div>
    </div>`;
  });
  html += '</div>';

  // Overall stats
  const totalQuests = QUEST_TEMPLATES.length;
  const completedQuests = QUEST_TEMPLATES.filter(q => progress[q.id]?.completed).length;
  const totalStars = QUEST_TEMPLATES.reduce((s, q) => s + (progress[q.id]?.bestStars || 0), 0);
  html += `<div style="text-align:center;font-size:.82rem;color:var(--text-secondary);margin-top:8px">
    Квестов: ${completedQuests}/${totalQuests} | Звёзд: ${totalStars}/${totalQuests * 3}
  </div>`;

  container.innerHTML = html;

  container.querySelectorAll('.chapter-card:not(.locked)').forEach(card => {
    card.addEventListener('click', () => {
      selectedChapter = card.dataset.chapter;
      currentView = 'chapter';
      render();
    });
  });
}

/* ---- Chapter View (Quest List) ---- */
function renderChapter(container) {
  const ch = getChapters().find(c => c.id === selectedChapter);
  if (!ch) { currentView = 'map'; render(); return; }

  const quests = getChapterQuests(ch.id);
  const progress = getProgress();

  let html = `<button class="quest-back" id="questBackToMap">← Назад к карте</button>`;
  html += `<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">
    <div style="font-size:2.2rem">${ch.icon}</div>
    <div>
      <div style="font-size:1.15rem;font-weight:700">${ch.name}</div>
      <div style="font-size:.78rem;color:var(--text-secondary)">${ch.desc}</div>
    </div>
  </div>`;

  // NPC intro
  html += `<div style="font-size:.82rem;line-height:1.5;padding:12px 16px;background:rgba(120,120,140,0.08);border-radius:10px;border-left:3px solid ${ch.color};margin-bottom:16px;font-style:italic">
    ${ch.npcIntro}
  </div>`;

  html += '<div class="quest-list">';
  quests.forEach((q, i) => {
    const result = progress[q.id];
    const isComplete = result?.completed;
    const stars = result?.bestStars || 0;

    html += `<div class="quest-item${isComplete ? ' completed' : ''}${q.isBoss ? ' boss' : ''}" data-quest="${q.id}">
      <div class="quest-item__num">${q.isBoss ? '👑' : i + 1}</div>
      <div class="quest-item__info">
        <div class="quest-item__title">${q.title}</div>
        <div class="quest-item__desc">${q.baseXP} XP${q.isBoss ? ' (×2 босс)' : ''}</div>
      </div>
      <div class="quest-item__stars">
        ${[1,2,3].map(s => `<span class="quest-item__star${s <= stars ? ' earned' : ''}">★</span>`).join('')}
      </div>
    </div>`;
  });
  html += '</div>';

  container.innerHTML = html;

  document.getElementById('questBackToMap')?.addEventListener('click', () => {
    currentView = 'map';
    render();
  });

  container.querySelectorAll('.quest-item').forEach(item => {
    item.addEventListener('click', () => {
      const template = getQuestTemplate(item.dataset.quest);
      if (!template) return;
      const briefing = startBriefing(template, selectedChapter);
      currentView = 'briefing';
      activeHints = [];
      render();
    });
  });
}

/* ---- Related Materials Helper ---- */
function renderRelatedLinks(quest) {
  if ((!quest.relatedLabs || quest.relatedLabs.length === 0) &&
      (!quest.relatedTheory || quest.relatedTheory.length === 0)) return '';

  let html = '<div class="quest-briefing__related">';
  html += '<div class="quest-briefing__related-title">Полезные материалы</div>';

  if (quest.relatedLabs && quest.relatedLabs.length > 0) {
    html += '<div class="quest-briefing__related-group">';
    html += '<div class="quest-briefing__related-label">Лаборатории:</div>';
    quest.relatedLabs.forEach(l => {
      html += `<button class="quest-related-link" data-nav-section="lab" data-nav-lab="${l.lab}">🔬 ${l.text}</button>`;
    });
    html += '</div>';
  }

  if (quest.relatedTheory && quest.relatedTheory.length > 0) {
    html += '<div class="quest-briefing__related-group">';
    html += '<div class="quest-briefing__related-label">Теория:</div>';
    quest.relatedTheory.forEach(t => {
      html += `<button class="quest-related-link quest-related-link--theory" data-nav-section="theory" data-nav-topic="${t.topic}">📚 ${t.text}</button>`;
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function bindRelatedLinks(container) {
  container.querySelectorAll('.quest-related-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.navSection;
      if (section === 'lab') {
        navigateTo('lab');
        setTimeout(() => {
          const labTab = document.querySelector(`[data-lab="${btn.dataset.navLab}"]`);
          if (labTab) labTab.click();
        }, 100);
      } else if (section === 'theory') {
        navigateTo('theory');
        setTimeout(() => {
          const topicBtn = document.querySelector(`[data-topic="${btn.dataset.navTopic}"]`);
          if (topicBtn) topicBtn.click();
        }, 100);
      }
    });
  });
}

/* ---- Briefing View ---- */
function renderBriefing(container) {
  const state = getQuestState();
  const quest = state.currentQuest;
  if (!quest) { currentView = 'map'; render(); return; }

  const ch = getChapters().find(c => c.id === state.currentChapter);
  const progress = getProgress();
  const prev = progress[quest.id];

  let html = `<button class="quest-back" id="questBackToChapter">← Назад к главе</button>`;
  html += `<div class="quest-briefing">
    <div class="quest-briefing__header">
      <div class="quest-briefing__npc-icon">${ch?.icon || '🎯'}</div>
      <div class="quest-briefing__meta">
        <div class="quest-briefing__chapter">${ch?.name || ''}</div>
        <div class="quest-briefing__title">${quest.title}${quest.isBoss ? ' 👑' : ''}</div>
      </div>
    </div>
    <div class="quest-briefing__story">
      ${typeof quest.story === 'function' ? quest.story(state.params) : quest.story}
    </div>
    <div class="quest-briefing__xp">
      <span>💎 ${quest.baseXP}${quest.isBoss ? '×2' : ''} XP</span>
      ${prev?.completed ? '<span>🔄 Перепрохождение (50% XP)</span>' : ''}
      <span>💡 3 подсказки</span>
    </div>
    ${renderRelatedLinks(quest)}
    <div class="quest-briefing__actions">
      <button class="quest-btn quest-btn--primary" id="questStart">▶ Начать квест</button>
      <button class="quest-btn quest-btn--secondary" id="questCancel">Отмена</button>
    </div>
  </div>`;

  container.innerHTML = html;
  bindRelatedLinks(container);

  document.getElementById('questBackToChapter')?.addEventListener('click', () => {
    exitQuest();
    currentView = 'chapter';
    render();
  });

  document.getElementById('questStart')?.addEventListener('click', () => {
    startQuest();
    currentView = 'active';
    startTimer();
    render();
  });

  document.getElementById('questCancel')?.addEventListener('click', () => {
    exitQuest();
    currentView = 'chapter';
    render();
  });
}

/* ---- Active Quest View ---- */
function renderActive(container) {
  const state = getQuestState();
  const quest = state.currentQuest;
  if (!quest) { currentView = 'map'; render(); return; }

  let html = '';

  // Quest panel
  html += `<div class="quest-panel">
    <div class="quest-panel__title">📋 ${quest.title}</div>
    <div class="quest-panel__timer" id="questTimer">00:00</div>
    <div class="quest-panel__hints">
      ${[1,2,3].map(level => {
        const labels = ['💡 Направление', '🔍 Намёк', '📖 Решение'];
        const costs = ['бесплатно', '−20% XP', '−40% XP'];
        const used = level <= state.hintsUsed;
        const available = level <= state.hintsUsed + 1;
        return `<button class="quest-panel__hint-btn${used ? ' used' : ''}" data-hint="${level}" ${!available ? 'disabled' : ''} title="${costs[level-1]}">${labels[level-1]}</button>`;
      }).join('')}
    </div>
    <button class="quest-panel__check-btn" id="questCheck">✓ Проверить</button>
  </div>`;

  // Hints display
  activeHints.forEach(h => {
    html += `<div class="quest-hint">
      <div class="quest-hint__level">Подсказка ${h.level}: ${['Направление', 'Намёк', 'Решение'][h.level-1]}</div>
      ${h.text}
    </div>`;
  });

  // Task description
  html += `<div class="quest-briefing__story" style="margin-bottom:14px">
    ${typeof quest.story === 'function' ? quest.story(state.params) : quest.story}
  </div>`;

  // Related materials
  html += renderRelatedLinks(quest);

  // Answer input
  html += `<div class="quest-answer">
    <div class="quest-answer__label">Ваш ответ:</div>
    <textarea class="quest-answer__input" id="questAnswerInput" rows="4" placeholder="Введите ответ..."></textarea>
  </div>`;

  // Exit button
  html += `<button class="quest-btn quest-btn--secondary" id="questExit" style="margin-top:8px">✕ Отменить квест</button>`;

  container.innerHTML = html;
  bindRelatedLinks(container);

  // Hint buttons
  container.querySelectorAll('[data-hint]').forEach(btn => {
    btn.addEventListener('click', () => {
      const level = parseInt(btn.dataset.hint);
      const hintText = getHint(level);
      if (hintText) {
        activeHints.push({ level, text: hintText });
        render();
      }
    });
  });

  // Check button
  document.getElementById('questCheck')?.addEventListener('click', () => {
    const input = document.getElementById('questAnswerInput');
    if (!input) return;

    let answer;
    try {
      answer = JSON.parse(input.value);
    } catch {
      answer = input.value.trim();
    }

    if (!answer || (typeof answer === 'string' && answer.length === 0)) return;

    stopTimer();
    const result = submitAnswer(answer);
    if (result) {
      currentView = 'result';
      render();
    }
  });

  // Exit
  document.getElementById('questExit')?.addEventListener('click', () => {
    stopTimer();
    exitQuest();
    currentView = 'chapter';
    render();
  });

  // Start timer update
  updateTimerDisplay();
}

/* ---- Result View ---- */
function renderResult(container) {
  const state = getQuestState();
  const result = state.result;
  if (!result) { currentView = 'map'; render(); return; }

  const starsDisplay = [1,2,3].map(s => s <= result.stars ? '⭐' : '☆').join('');
  const elapsed = Math.round(result.elapsed / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  let html = `<div class="quest-result">
    <div class="quest-result__stars">${starsDisplay}</div>
    <div class="quest-result__title">${result.correct ? '✅ Правильно!' : '❌ Неправильно'}</div>
    <div class="quest-result__xp">${result.xp > 0 ? `+${result.xp} XP` : 'Без XP'}${result.isReplay ? ' (перепрохождение)' : ''}</div>
    <div class="quest-result__stats">
      <span>⏱ ${mins}:${String(secs).padStart(2, '0')}</span>
      <span>💡 Подсказок: ${result.hintsUsed}/3</span>
      <span>🎯 Попытка: ${result.isFirstAttempt ? '1-я' : 'повторная'}</span>
      ${result.isBoss ? '<span>👑 Босс (×2 XP)</span>' : ''}
    </div>
    ${result.explanation ? `<div class="quest-result__explain">${result.explanation}</div>` : ''}
    <div class="quest-result__actions">
      <button class="quest-btn quest-btn--primary" id="questRetry">🔄 Пройти снова</button>
      <button class="quest-btn quest-btn--secondary" id="questToChapter">← К главе</button>
      <button class="quest-btn quest-btn--secondary" id="questToMap">🗺 К карте</button>
    </div>
  </div>`;

  container.innerHTML = html;

  document.getElementById('questRetry')?.addEventListener('click', () => {
    retryQuest();
    currentView = 'briefing';
    activeHints = [];
    render();
  });

  document.getElementById('questToChapter')?.addEventListener('click', () => {
    exitQuest();
    currentView = 'chapter';
    render();
  });

  document.getElementById('questToMap')?.addEventListener('click', () => {
    exitQuest();
    currentView = 'map';
    render();
  });
}

/* ---- Timer ---- */
function startTimer() {
  stopTimer();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function updateTimerDisplay() {
  const el = document.getElementById('questTimer');
  if (!el) return;
  const state = getQuestState();
  if (!state.startTime) return;
  const elapsed = Math.round((Date.now() - state.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/* ---- Init ---- */
export function initCampaign() {
  const container = document.getElementById('campaignContent');
  if (!container) return;

  // Mode switcher
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      setMode(mode);

      const freeContent = document.getElementById('campaignFreeContent');
      const questContent = document.getElementById('campaignContent');

      if (mode === 'free') {
        if (freeContent) freeContent.style.display = 'block';
        if (questContent) questContent.style.display = 'none';
      } else {
        if (freeContent) freeContent.style.display = 'none';
        if (questContent) questContent.style.display = 'block';
        currentView = 'map';
        render();
      }
    });
  });

  // Initial render if campaign mode is active
  render();
}
