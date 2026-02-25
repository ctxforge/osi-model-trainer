/* ==================== QUEST ENGINE ==================== */
import { addXP, unlockAchievement, showToast, gameState, saveGame } from './gamification.js';

/* ---- Seed-based PRNG (Mulberry32) ---- */
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  const next = mulberry32(seed);
  return {
    random: () => next(),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    ip: (base, range) => {
      const parts = base.split('.').map(Number);
      parts[3] = 1 + Math.floor(next() * range);
      return parts.join('.');
    },
    mac: () => {
      const h = () => Math.floor(next() * 256).toString(16).padStart(2, '0');
      return `${h()}:${h()}:${h()}:${h()}:${h()}:${h()}`;
    },
    port: () => {
      const common = [20,21,22,23,25,53,67,68,69,80,110,119,123,143,161,162,179,443,445,465,514,587,636,993,995,1433,1521,3306,3389,5432,5900,6379,8080,8443,27017];
      return common[Math.floor(next() * common.length)];
    },
    subnet: () => {
      const bases = ['10.0','172.16','192.168'];
      const b = bases[Math.floor(next() * bases.length)];
      const octet = Math.floor(next() * 254) + 1;
      return b === '10.0' ? `10.${octet}.0.0` : b === '172.16' ? `172.${16 + Math.floor(next()*16)}.${octet}.0` : `192.168.${octet}.0`;
    }
  };
}

/* ---- Quest State Machine ---- */
const QUEST_STATES = ['IDLE', 'BRIEFING', 'ACTIVE', 'CHECKING', 'RESULT'];

const questState = {
  mode: 'free',          // 'free' | 'campaign'
  state: 'IDLE',
  currentChapter: null,
  currentQuest: null,
  seed: 0,
  params: null,          // generated quest parameters
  answer: null,          // user's answer
  hintsUsed: 0,
  startTime: 0,
  attempts: 0,
  result: null           // { stars, xp, correct, explanation }
};

/* ---- Progress persistence ---- */
const STORAGE_KEY = 'osi-quest-progress';

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function saveProgress(data) {
  const current = loadProgress();
  Object.assign(current, data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function getProgress() {
  return loadProgress();
}

export function getQuestResult(questId) {
  const prog = loadProgress();
  return prog[questId] || null;
}

export function getChapterProgress(chapterId) {
  const prog = loadProgress();
  const keys = Object.keys(prog).filter(k => k.startsWith(chapterId + '.'));
  const completed = keys.filter(k => prog[k].completed);
  const totalStars = completed.reduce((s, k) => s + (prog[k].bestStars || 0), 0);
  return { total: keys.length, completed: completed.length, totalStars };
}

/* ---- Scoring ---- */
function calcStars(hintsUsed, isFirstAttempt, elapsedMs, avgMs) {
  let multiplier = 1.0;

  // Hint penalties
  if (hintsUsed === 1) multiplier = 0.8;
  else if (hintsUsed === 2) multiplier = 0.6;
  else if (hintsUsed >= 3) multiplier = 0.4;

  // Speed bonus
  if (avgMs > 0 && elapsedMs < avgMs) multiplier += 0.2;

  // First attempt bonus
  if (isFirstAttempt) multiplier += 0.1;

  multiplier = Math.min(multiplier, 1.3);

  // Stars based on multiplier
  if (multiplier >= 1.0) return { stars: 3, multiplier };
  if (multiplier >= 0.7) return { stars: 2, multiplier };
  if (multiplier >= 0.4) return { stars: 1, multiplier };
  return { stars: 0, multiplier };
}

/* ---- Quest lifecycle ---- */

export function getQuestState() {
  return { ...questState };
}

export function getMode() {
  return questState.mode;
}

export function setMode(mode) {
  questState.mode = mode;
  if (mode === 'free') {
    questState.state = 'IDLE';
    questState.currentQuest = null;
  }
}

export function startBriefing(questTemplate, chapter) {
  questState.state = 'BRIEFING';
  questState.currentQuest = questTemplate;
  questState.currentChapter = chapter;
  questState.seed = Date.now() ^ (Math.random() * 0xFFFFFFFF >>> 0);
  questState.hintsUsed = 0;
  questState.attempts = 0;
  questState.answer = null;
  questState.result = null;

  // Generate parameters from seed
  const rng = createRng(questState.seed);
  questState.params = questTemplate.generate(rng);

  return {
    title: questTemplate.title,
    story: typeof questTemplate.story === 'function'
      ? questTemplate.story(questState.params) : questTemplate.story,
    chapter: chapter,
    params: questState.params,
    isBoss: questTemplate.isBoss || false
  };
}

export function startQuest() {
  if (questState.state !== 'BRIEFING') return false;
  questState.state = 'ACTIVE';
  questState.startTime = Date.now();
  questState.attempts++;
  return true;
}

export function getHint(level) {
  if (questState.state !== 'ACTIVE') return null;
  if (level < 1 || level > 3) return null;
  if (level > questState.hintsUsed + 1) return null; // must get hints in order

  const quest = questState.currentQuest;
  if (!quest.hints || !quest.hints[level - 1]) return null;

  questState.hintsUsed = Math.max(questState.hintsUsed, level);

  const hintFn = quest.hints[level - 1];
  return typeof hintFn === 'function' ? hintFn(questState.params) : hintFn;
}

export function submitAnswer(answer) {
  if (questState.state !== 'ACTIVE') return null;
  questState.state = 'CHECKING';
  questState.answer = answer;

  const quest = questState.currentQuest;
  const elapsed = Date.now() - questState.startTime;
  const avgTime = 120000; // 2 min average estimate

  const correct = quest.validate(answer, questState.params);
  const isFirstAttempt = questState.attempts === 1;
  const { stars, multiplier } = correct
    ? calcStars(questState.hintsUsed, isFirstAttempt, elapsed, avgTime)
    : { stars: 0, multiplier: 0 };

  const baseXP = quest.baseXP || 20;
  const isBoss = quest.isBoss || false;
  const bossMultiplier = isBoss ? 2.0 : 1.0;

  // Check if replay
  const progress = loadProgress();
  const prevResult = progress[quest.id];
  const isReplay = prevResult && prevResult.completed;
  const replayMultiplier = isReplay ? 0.5 : 1.0;

  const xpEarned = correct ? Math.round(baseXP * multiplier * bossMultiplier * replayMultiplier) : 0;

  const explanation = quest.explain
    ? quest.explain(questState.params)
    : '';

  questState.result = {
    correct,
    stars,
    xp: xpEarned,
    explanation,
    elapsed,
    hintsUsed: questState.hintsUsed,
    isFirstAttempt,
    isBoss,
    isReplay,
    multiplier
  };

  questState.state = 'RESULT';

  // Save progress
  if (correct) {
    const bestStars = prevResult ? Math.max(prevResult.bestStars || 0, stars) : stars;
    saveProgress({
      [quest.id]: {
        completed: true,
        bestStars,
        lastSeed: questState.seed,
        lastStars: stars,
        lastXP: xpEarned,
        attempts: (prevResult?.attempts || 0) + questState.attempts
      }
    });

    addXP(xpEarned);

    // Achievement checks
    const prog = loadProgress();
    const completedCount = Object.values(prog).filter(v => v.completed).length;
    if (completedCount >= 1) unlockAchievement('quest_first');
    if (completedCount >= 10) unlockAchievement('quest_10');
    if (completedCount >= 35) unlockAchievement('quest_all');
    if (stars === 3 && questState.hintsUsed === 0) unlockAchievement('quest_perfect');
    if (isBoss && correct) unlockAchievement('quest_boss');

    // Chapter completion check
    const chapterQuests = getChapterQuestIds(questState.currentChapter);
    const allDone = chapterQuests.every(qid => prog[qid]?.completed);
    if (allDone) {
      unlockAchievement('quest_chapter_' + questState.currentChapter);
      showToast('🏆', `Глава "${questState.currentChapter}" пройдена!`, `+${xpEarned} XP`);
    }
  }

  return questState.result;
}

export function retryQuest() {
  if (questState.state !== 'RESULT') return false;
  // New seed for new parameters
  questState.seed = Date.now() ^ (Math.random() * 0xFFFFFFFF >>> 0);
  const rng = createRng(questState.seed);
  questState.params = questState.currentQuest.generate(rng);
  questState.state = 'BRIEFING';
  questState.hintsUsed = 0;
  questState.answer = null;
  questState.result = null;
  return true;
}

export function exitQuest() {
  questState.state = 'IDLE';
  questState.currentQuest = null;
  questState.currentChapter = null;
  questState.params = null;
  questState.result = null;
}

/* ---- Chapter helpers (will be populated by quest-templates) ---- */
let _questTemplates = [];
let _chapters = [];

export function registerTemplates(templates) {
  _questTemplates = templates;
}

export function registerChapters(chapters) {
  _chapters = chapters;
}

export function getChapters() {
  return _chapters;
}

export function getQuestTemplates() {
  return _questTemplates;
}

export function getChapterQuests(chapterId) {
  return _questTemplates.filter(q => q.chapter === chapterId);
}

function getChapterQuestIds(chapterId) {
  return _questTemplates.filter(q => q.chapter === chapterId).map(q => q.id);
}

export function getQuestTemplate(questId) {
  return _questTemplates.find(q => q.id === questId);
}

export function isChapterUnlocked(chapterId) {
  const idx = _chapters.findIndex(c => c.id === chapterId);
  if (idx <= 0) return true; // first chapter always unlocked
  // Previous chapter must have at least 50% quests completed
  const prevChapter = _chapters[idx - 1];
  const prevQuests = getChapterQuests(prevChapter.id);
  const prog = loadProgress();
  const completed = prevQuests.filter(q => prog[q.id]?.completed).length;
  return completed >= Math.ceil(prevQuests.length * 0.5);
}
