/**
 * TLE Data Manager
 * - Loads from CelesTrak when online (cached to localStorage)
 * - Falls back to bundled data when offline
 *
 * CelesTrak JSON API: https://celestrak.org/NORAD/elements/gp.php?GROUP=xxx&FORMAT=JSON
 */

const CACHE_KEY = 'osi_tle_cache_v2';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Celestrak URL map per constellation id
const CELESTRAK_URLS = {
  'gps-ops':      'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=JSON',
  'glo-ops':      'https://celestrak.org/NORAD/elements/gp.php?GROUP=glo-ops&FORMAT=JSON',
  'galileo':      'https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=JSON',
  'beidou':       'https://celestrak.org/NORAD/elements/gp.php?GROUP=beidou&FORMAT=JSON',
  'starlink':     'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=JSON',
  'oneweb':       'https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=JSON',
  'iridium-next': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-next&FORMAT=JSON',
  'globalstar':   'https://celestrak.org/NORAD/elements/gp.php?GROUP=globalstar&FORMAT=JSON',
  'orbcomm':      'https://celestrak.org/NORAD/elements/gp.php?GROUP=orbcomm&FORMAT=JSON',
  'ses':          'https://celestrak.org/NORAD/elements/gp.php?GROUP=ses&FORMAT=JSON',
  'intelsat':     'https://celestrak.org/NORAD/elements/gp.php?GROUP=intelsat&FORMAT=JSON',
  'eutelsat':     'https://celestrak.org/NORAD/elements/gp.php?GROUP=eutelsat&FORMAT=JSON',
  'geo-intelsat': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=intelsat&FORMAT=JSON',
  'geo-ses':      'https://celestrak.org/NORAD/elements/gp.php?GROUP=ses&FORMAT=JSON',
  'geo-eutelsat': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=eutelsat&FORMAT=JSON',
  'o3b':          'https://celestrak.org/NORAD/elements/gp.php?GROUP=ses&FORMAT=JSON',
  'goes':         'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=JSON',
  'noaa-polar':   'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=JSON',
  'stations':     'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=JSON',
};

// Cache in memory during session
const memCache = new Map();

/**
 * Converts CelesTrak JSON GP element to TLE line pair { tle1, tle2, name }
 */
function gpToTle(gp) {
  // CelesTrak JSON format has TLE_LINE1 and TLE_LINE2
  if (gp.TLE_LINE1 && gp.TLE_LINE2) {
    return { name: gp.OBJECT_NAME || gp.SATNAME || 'UNKNOWN', tle1: gp.TLE_LINE1, tle2: gp.TLE_LINE2 };
  }
  return null;
}

/**
 * Load TLE data for a constellation.
 * Order: memCache → localStorage → CelesTrak fetch → error
 * @param {string} constellationId
 * @param {number} maxCount - max satellites to return (for large constellations)
 * @returns {Promise<Array<{name, tle1, tle2}>>}
 */
export async function loadTLE(constellationId, maxCount = 500) {
  // 1. Memory cache
  if (memCache.has(constellationId)) return memCache.get(constellationId).slice(0, maxCount);

  // 2. localStorage cache
  try {
    const cached = JSON.parse(localStorage.getItem(`${CACHE_KEY}_${constellationId}`) || 'null');
    if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS && cached.data?.length > 0) {
      const sats = cached.data.map(gpToTle).filter(Boolean);
      if (sats.length > 0) {
        memCache.set(constellationId, sats);
        return sats.slice(0, maxCount);
      }
    }
  } catch (e) { /* ignore parse errors */ }

  // 3. Fetch from CelesTrak
  const url = CELESTRAK_URLS[constellationId];
  if (url) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json) && json.length > 0) {
          // Save to localStorage
          try {
            localStorage.setItem(`${CACHE_KEY}_${constellationId}`, JSON.stringify({ ts: Date.now(), data: json }));
          } catch (e) { /* storage full, ignore */ }
          const sats = json.map(gpToTle).filter(Boolean);
          memCache.set(constellationId, sats);
          return sats.slice(0, maxCount);
        }
      }
    } catch (e) {
      console.warn(`CelesTrak fetch failed for ${constellationId}:`, e.message);
    }
  }

  // 4. Nothing available
  return [];
}

/**
 * Get cache status for all loaded constellations
 */
export function getTleStatus() {
  const status = {};
  for (const [id] of Object.entries(CELESTRAK_URLS)) {
    try {
      const cached = JSON.parse(localStorage.getItem(`${CACHE_KEY}_${id}`) || 'null');
      if (cached) {
        const ageMin = Math.round((Date.now() - cached.ts) / 60000);
        status[id] = { cached: true, count: cached.data?.length || 0, ageMin };
      } else {
        status[id] = { cached: false };
      }
    } catch (e) {
      status[id] = { cached: false, error: true };
    }
  }
  return status;
}

/**
 * Clear all TLE caches (force refresh)
 */
export function clearTleCache() {
  for (const id of Object.keys(CELESTRAK_URLS)) {
    localStorage.removeItem(`${CACHE_KEY}_${id}`);
  }
  memCache.clear();
}
