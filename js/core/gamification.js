/* ==================== GAMIFICATION ==================== */
import { XP_LEVELS, ACHIEVEMENTS } from '../data/gamification-data.js';

let gameState = JSON.parse(localStorage.getItem('osi-game') || '{}');
if (!gameState.xp) gameState.xp = 0;
if (!gameState.achievements) gameState.achievements = [];
if (!gameState.studiedLayers) gameState.studiedLayers = [];
if (!gameState.usedChannels) gameState.usedChannels = [];
if (!gameState.theoryRead) gameState.theoryRead = [];

function saveGame() { localStorage.setItem('osi-game', JSON.stringify(gameState)); }

function getCurrentLevel() {
  let lvl = XP_LEVELS[0];
  for (const l of XP_LEVELS) { if (gameState.xp >= l.minXp) lvl = l; }
  return lvl;
}

function getNextLevel() {
  const cur = getCurrentLevel();
  return XP_LEVELS.find(l => l.minXp > cur.minXp) || cur;
}

function addXP(amount) {
  const oldLevel = getCurrentLevel().level;
  gameState.xp += amount;
  saveGame();
  const newLevel = getCurrentLevel().level;
  updateXPDisplay();
  if (newLevel > oldLevel) {
    const lvl = getCurrentLevel();
    showToast(lvl.icon, `\u0423\u0440\u043e\u0432\u0435\u043d\u044c ${lvl.level}: ${lvl.name}!`, '');
  }
  if (gameState.xp >= 100) unlockAchievement('xp_100');
  if (gameState.xp >= 300) unlockAchievement('xp_300');
  if (gameState.xp >= 1000) unlockAchievement('xp_1000');
  if (gameState.xp >= 5000) unlockAchievement('xp_5000');
}

function unlockAchievement(id) {
  if (gameState.achievements.includes(id)) return;
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return;
  gameState.achievements.push(id);
  saveGame();
  showToast(ach.icon, ach.name, ach.xp > 0 ? `+${ach.xp} XP` : '');
  if (ach.xp > 0) addXP(ach.xp);
  updateXPDisplay();
}

function showToast(icon, text, xpText) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast__icon">${icon}</span><span>${text}</span>${xpText ? `<span class="toast__xp">${xpText}</span>` : ''}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function updateXPDisplay() {
  const lvl = getCurrentLevel();
  const next = getNextLevel();
  document.getElementById('xpIcon').textContent = lvl.icon;
  document.getElementById('xpValue').textContent = gameState.xp + ' XP';

  const panel = document.getElementById('xpPanel');
  const pct = next.minXp > lvl.minXp ? ((gameState.xp - lvl.minXp) / (next.minXp - lvl.minXp)) * 100 : 100;
  panel.innerHTML = `
    <div class="xp-panel__header">
      <div class="xp-panel__avatar">${lvl.icon}</div>
      <div>
        <div class="xp-panel__level-name">\u0423\u0440\u043e\u0432\u0435\u043d\u044c ${lvl.level}: ${lvl.name}</div>
        <div class="xp-panel__level-sub">${gameState.xp} XP</div>
      </div>
    </div>
    <div class="xp-bar"><div class="xp-bar__fill" style="width:${pct}%"></div></div>
    <div class="xp-bar__label">${next.minXp > lvl.minXp ? `${gameState.xp}/${next.minXp} XP \u0434\u043e \u00ab${next.name}\u00bb` : '\u041c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u044b\u0439 \u0443\u0440\u043e\u0432\u0435\u043d\u044c!'}</div>
    <div class="xp-achievements">
      <div class="xp-achievements__title">\u0414\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u044f (${gameState.achievements.length}/${ACHIEVEMENTS.length})</div>
      ${ACHIEVEMENTS.filter(a => {
        const unlocked = gameState.achievements.includes(a.id);
        return unlocked || !a.hidden;
      }).map(a => {
        const unlocked = gameState.achievements.includes(a.id);
        return `<div class="xp-ach ${unlocked ? '' : 'xp-ach--locked'}">
          <div class="xp-ach__icon">${a.icon}</div>
          <div class="xp-ach__info"><div class="xp-ach__name">${a.name}</div><div class="xp-ach__desc">${a.desc}</div></div>
          ${a.xp > 0 ? `<div class="xp-ach__xp">${unlocked ? '\u2713' : '+' + a.xp}</div>` : ''}
        </div>`;
      }).join('')}
      ${ACHIEVEMENTS.some(a => a.hidden && !gameState.achievements.includes(a.id)) ? `<div class="xp-ach xp-ach--locked" style="justify-content:center;font-style:italic;color:var(--text-secondary);font-size:.72rem">+ ${ACHIEVEMENTS.filter(a => a.hidden && !gameState.achievements.includes(a.id)).length} скрытых достижений</div>` : ''}
    </div>
  `;
}

function initGamification() {
  updateXPDisplay();

  document.getElementById('xpBadge').addEventListener('click', () => {
    const panel = document.getElementById('xpPanel');
    panel.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    const panel = document.getElementById('xpPanel');
    if (panel.classList.contains('open') && !panel.contains(e.target) && !document.getElementById('xpBadge').contains(e.target)) {
      panel.classList.remove('open');
    }
  });
}

export { gameState, saveGame, addXP, unlockAchievement, showToast, updateXPDisplay, initGamification, getCurrentLevel, getNextLevel };
