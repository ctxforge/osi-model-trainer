/**
 * TLE Data Manager
 *
 * Порядок приоритетов:
 *   1. localStorage кэш (если свежее 12 ч)
 *   2. BUNDLED_TLE  — встроенные данные (всегда работает офлайн)
 *   3. CelesTrak    — живой fetch (обновляет кэш при наличии интернета)
 *
 * Кнопка «🔄 TLE» → clearTleCache() → следующий loadTLE пойдёт в CelesTrak
 */

import { getBundledTLE, BUNDLED_TLE_DATE } from './sat-tle-bundled.js';

export { BUNDLED_TLE_DATE };

const CACHE_KEY = 'osi_tle_v3';
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 часов

// URL для фонового обновления (не блокирует загрузку)
const CELESTRAK_URL = {
  'gps-ops':      'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=TLE',
  'glo-ops':      'https://celestrak.org/NORAD/elements/gp.php?GROUP=glo-ops&FORMAT=TLE',
  'galileo':      'https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=TLE',
  'beidou':       'https://celestrak.org/NORAD/elements/gp.php?GROUP=beidou&FORMAT=TLE',
  'starlink':     'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=TLE',
  'oneweb':       'https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=TLE',
  'iridium-next': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-next&FORMAT=TLE',
  'globalstar':   'https://celestrak.org/NORAD/elements/gp.php?GROUP=globalstar&FORMAT=TLE',
  'orbcomm':      'https://celestrak.org/NORAD/elements/gp.php?GROUP=orbcomm&FORMAT=TLE',
  'intelsat':     'https://celestrak.org/NORAD/elements/gp.php?GROUP=intelsat&FORMAT=TLE',
  'ses':          'https://celestrak.org/NORAD/elements/gp.php?GROUP=ses&FORMAT=TLE',
  'weather':      'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=TLE',
  'stations':     'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=TLE',
};

// Session-level memory cache (parsed satrecs-ready arrays)
const memCache = new Map();

/* ──────────────────────────────────────────────────────────
   Парсинг TLE-текста в массив { name, tle1, tle2 }
   ────────────────────────────────────────────────────────── */
function parseTleText(text) {
  const sats = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i + 2 < lines.length; ) {
    const name = lines[i];
    const tle1 = lines[i + 1];
    const tle2 = lines[i + 2];
    if (tle1.startsWith('1 ') && tle2.startsWith('2 ')) {
      sats.push({ name, tle1, tle2 });
      i += 3;
    } else {
      i += 1;
    }
  }
  return sats;
}

/* ──────────────────────────────────────────────────────────
   localStorage helpers
   ────────────────────────────────────────────────────────── */
function cacheRead(groupId) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${groupId}`);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.ts > CACHE_TTL) return null;
    return obj.sats; // [{ name, tle1, tle2 }, ...]
  } catch { return null; }
}

function cacheWrite(groupId, sats) {
  try {
    localStorage.setItem(`${CACHE_KEY}_${groupId}`, JSON.stringify({ ts: Date.now(), sats }));
  } catch { /* хранилище переполнено */ }
}

/* ──────────────────────────────────────────────────────────
   Фоновое обновление с CelesTrak (не блокирует UI)
   ────────────────────────────────────────────────────────── */
async function backgroundRefresh(groupId, maxCount) {
  const url = CELESTRAK_URL[groupId];
  if (!url) return;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return;
    let sats = parseTleText(await resp.text());
    if (sats.length === 0) return;
    if (maxCount) sats = sats.slice(0, maxCount);
    cacheWrite(groupId, sats);
    memCache.set(groupId, sats);
    console.log(`[TLE] Updated ${groupId}: ${sats.length} sats from CelesTrak`);
  } catch { /* offline or timeout — not a problem */ }
}

/* ──────────────────────────────────────────────────────────
   Маппинг constellation ID → group ID
   ────────────────────────────────────────────────────────── */
const CONS_TO_GROUP = {
  'gps-ops':      'gps-ops',
  'glo-ops':      'glo-ops',
  'galileo':      'galileo',
  'beidou':       'beidou',
  'iridium-next': 'iridium-next',
  'globalstar':   'globalstar',
  'orbcomm':      'orbcomm',
  'goes':         'weather',
  'noaa-polar':   'weather',
  'stations':     'stations',
  'starlink':     'starlink',
  'oneweb':       'oneweb',
  'geo-intelsat': 'intelsat',
  'geo-ses':      'ses',
  'geo-eutelsat': 'ses',
  'o3b':          'ses',
};

/* ──────────────────────────────────────────────────────────
   ГЛАВНАЯ ФУНКЦИЯ: loadTLE
   Возвращает данные мгновенно (из bundled или кэша),
   параллельно обновляет в фоне.
   ────────────────────────────────────────────────────────── */
export async function loadTLE(constellationId, maxCount = 500) {
  const groupId = CONS_TO_GROUP[constellationId] || constellationId;
  const limit = (groupId === 'starlink' || groupId === 'oneweb') ? Math.min(maxCount, 200) : maxCount;

  // 1. Memory cache (fastest)
  if (memCache.has(groupId)) return memCache.get(groupId).slice(0, limit);

  // 2. localStorage (recent fetch)
  const cached = cacheRead(groupId);
  if (cached && cached.length > 0) {
    const sats = cached.slice(0, limit);
    memCache.set(groupId, cached);
    // Refresh in background silently
    backgroundRefresh(groupId, limit);
    return sats;
  }

  // 3. BUNDLED данные — всегда доступны офлайн (основной fallback)
  const bundled = getBundledTLE(constellationId);
  if (bundled.length > 0) {
    const sats = bundled.slice(0, limit);
    memCache.set(groupId, sats);
    // Refresh in background (обновит кэш для следующего запуска)
    backgroundRefresh(groupId, limit);
    return sats;
  }

  // 4. Последний шанс: прямой fetch (если bundled почему-то пустой)
  try {
    const url = CELESTRAK_URL[groupId];
    if (!url) return [];
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    let sats = parseTleText(await resp.text()).slice(0, limit);
    cacheWrite(groupId, sats);
    memCache.set(groupId, sats);
    return sats;
  } catch { return []; }
}

/* ──────────────────────────────────────────────────────────
   Принудительное обновление всех данных
   ────────────────────────────────────────────────────────── */
export async function refreshAllTLE(onProgress) {
  memCache.clear();
  const groups = Object.keys(CELESTRAK_URL);
  for (const groupId of groups) {
    if (onProgress) onProgress(groupId);
    try {
      const url = CELESTRAK_URL[groupId];
      const resp = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!resp.ok) continue;
      const limit = (groupId === 'starlink' || groupId === 'oneweb') ? 200 : 500;
      const sats = parseTleText(await resp.text()).slice(0, limit);
      if (sats.length > 0) {
        cacheWrite(groupId, sats);
        memCache.set(groupId, sats);
        console.log(`[TLE] Refreshed ${groupId}: ${sats.length} sats`);
      }
    } catch (e) {
      console.warn(`[TLE] Failed to refresh ${groupId}:`, e.message);
    }
  }
}

/**
 * Очистить кэш (следующий loadTLE подтянет свежие данные)
 */
export function clearTleCache() {
  for (const id of Object.keys(CELESTRAK_URL)) {
    try { localStorage.removeItem(`${CACHE_KEY}_${id}`); } catch {}
  }
  memCache.clear();
  console.log('[TLE] Cache cleared — будут использованы bundled данные + фоновое обновление');
}

/**
 * Статус кэша для отладки
 */
export function getTleStatus() {
  const s = {};
  for (const id of Object.keys(CELESTRAK_URL)) {
    try {
      const raw = localStorage.getItem(`${CACHE_KEY}_${id}`);
      if (raw) {
        const obj = JSON.parse(raw);
        s[id] = { cached: true, count: obj.sats?.length || 0, ageMin: Math.round((Date.now() - obj.ts) / 60000) };
      } else {
        const b = getBundledTLE(id);
        s[id] = { cached: false, bundled: b.length };
      }
    } catch { s[id] = { error: true }; }
  }
  return s;
}
