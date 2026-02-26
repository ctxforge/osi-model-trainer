/**
 * Satellite Globe — 3D (Three.js) + 2D (Canvas / NASA Mission Control style)
 */
import * as THREE from '../libs/three.module.min.js';
import { twoline2satrec, propagate, gstime, eciToGeodetic, degreesLat, degreesLong } from '../libs/satellite.es.js';
import { CONSTELLATIONS, CONSTELLATION_CATEGORIES, getConstellationById } from '../data/sat-constellations.js';
import { loadTLE, clearTleCache, refreshAllTLE, BUNDLED_TLE_DATE } from '../data/sat-tle-data.js';
import { addXP } from '../core/gamification.js';

/* ================================================================
   CONSTANTS
   ================================================================ */
const EARTH_R = 1.0;          // Three.js units
const EARTH_R_KM = 6371;
const SAT_SCALE = 1 / EARTH_R_KM; // km → Three.js units
const DEFAULT_CONSTELLATION = 'gps-ops';

/* ================================================================
   STATE
   ================================================================ */
let state = {
  mode: '3d',          // '3d' | '2d'
  activeId: DEFAULT_CONSTELLATION,
  simTime: new Date(),
  simSpeed: 1,
  lastTick: Date.now(),
  paused: false,
  userLat: 55.75,   // Moscow default
  userLon: 37.62,
  showCoverage: true,
  showTracks: true,
  showOnlyVisible: false,
  selectedSat: null,   // { name, satrec, index }
  sats: [],            // [{ name, satrec }]
  positions: [],       // [{ lat, lon, altKm, x, y, z, visible, el }] (updated each frame)
  abortLoading: null,
};

/* ================================================================
   THREE.JS SCENE
   ================================================================ */
let scene, camera, renderer, animId;
let earthMesh, atmosphereMesh, starsMesh;
let satPointsMesh = null;
let selectedSatMesh = null;
let trackLines = [];
let coverageMesh = null;
let signalLines = [];
let userMarker = null;
let sunLight, ambientLight;

// Camera orbit control
let orbit = { theta: 0.3, phi: 1.2, r: 2.5, isDragging: false, lx: 0, ly: 0, targetR: 2.5 };

/* ================================================================
   CONTINENT OUTLINES (simplified, for 2D map)
   ================================================================ */
const CONTINENTS_2D = [
  // North America
  [[72,-140],[72,-90],[60,-65],[47,-52],[30,-80],[15,-85],[8,-77],[10,-75],[20,-87],[22,-105],[32,-117],[60,-140],[72,-140]],
  // South America
  [[12,-72],[5,-52],[-5,-35],[-15,-39],[-25,-48],[-38,-57],[-55,-65],[-42,-73],[-30,-71],[-15,-75],[-5,-80],[10,-73],[12,-72]],
  // Europe
  [[71,28],[70,14],[58,5],[50,-5],[43,-9],[37,-9],[36,-5],[37,10],[43,14],[45,14],[44,17],[42,20],[41,29],[45,35],[47,37],[60,25],[65,25],[70,28],[71,28]],
  // Africa
  [[37,10],[37,37],[22,37],[12,43],[0,42],[-10,40],[-20,35],[-35,18],[-35,27],[-25,33],[-15,35],[0,10],[4,7],[4,-9],[15,-17],[22,-17],[37,-5],[37,10]],
  // Asia (simplified)
  [[70,60],[70,105],[68,140],[55,140],[45,135],[38,140],[30,120],[22,120],[18,110],[10,105],[5,105],[1,110],[12,110],[18,92],[22,90],[22,72],[30,60],[35,48],[28,37],[37,36],[41,36],[46,37],[50,60],[56,60],[60,57],[70,60]],
  // Australia
  [[-15,130],[-12,136],[-13,142],[-25,152],[-37,150],[-38,145],[-35,138],[-32,136],[-32,116],[-22,114],[-17,122],[-15,130]],
  // Greenland
  [[83,-45],[76,-15],[72,-18],[65,-38],[62,-42],[64,-52],[70,-53],[78,-72],[83,-45]],
  // Japan (rough)
  [[45,141],[40,142],[34,131],[31,131],[33,131],[38,141],[41,141],[44,145],[45,141]],
  // UK/Ireland
  [[58,-5],[57,2],[52,2],[51,1],[50,-5],[53,-6],[55,-5],[58,-5]],
];

/* ================================================================
   EARTH SHADER (procedural — no external textures)
   ================================================================ */
const EARTH_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EARTH_FRAG = `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;
  uniform vec3 uSunDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }

  void main() {
    float lat = (vUv.y - 0.5) * 3.14159;
    float lon = (vUv.x) * 6.28318 - 3.14159;

    // Ocean base
    vec3 deepOcean = vec3(0.02, 0.06, 0.22);
    vec3 shallowOcean = vec3(0.06, 0.15, 0.40);
    float oceanNoise = smoothNoise(vUv * 20.0) * 0.3 + smoothNoise(vUv * 60.0) * 0.1;
    vec3 color = mix(deepOcean, shallowOcean, oceanNoise);

    // Lat/lon grid lines
    float gridLat = 30.0 * 0.01745;
    float gridLon = 30.0 * 0.01745;
    float lineW = 0.005;
    bool onGrid = mod(abs(lat), gridLat) < lineW || mod(abs(lon), gridLon) < lineW;
    if (onGrid) color = mix(color, vec3(0.15, 0.30, 0.65), 0.35);

    // Equator & prime meridian brighter
    bool isEquator = abs(lat) < 0.012;
    bool isPrime = abs(lon) < 0.012;
    if (isEquator || isPrime) color = mix(color, vec3(0.3, 0.55, 0.95), 0.5);

    // Lighting
    float diff = max(0.0, dot(vNormal, normalize(uSunDir)));
    float ambient = 0.18;
    color *= (ambient + (1.0 - ambient) * diff);

    // Atmospheric rim
    float rim = 1.0 - clamp(dot(vNormal, normalize(vec3(0.0, 0.0, 1.0))), 0.0, 1.0);
    color = mix(color, vec3(0.15, 0.45, 0.95), pow(rim, 5.0) * 0.4);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const ATMOS_FRAG = `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform vec3 uSunDir;
  void main() {
    float rim = 1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
    float alpha = pow(rim, 3.0) * 0.6;
    float sunFactor = dot(normalize(uSunDir), vNormal) * 0.5 + 0.5;
    vec3 atmos = mix(vec3(0.1, 0.3, 0.8), vec3(0.5, 0.8, 1.0), sunFactor);
    gl_FragColor = vec4(atmos, alpha);
  }
`;

/* ================================================================
   INIT PUBLIC
   ================================================================ */
export function initSatGlobe() {
  const sectionEl = document.getElementById('section-sat-globe');
  if (!sectionEl) return;
  const observer = new MutationObserver(() => {
    if (sectionEl.classList.contains('active') && !document.getElementById('satGlobeCanvas')) bootstrap();
  });
  observer.observe(sectionEl, { attributes: true, attributeFilter: ['class'] });
  setTimeout(() => { if (sectionEl.classList.contains('active')) bootstrap(); }, 200);
}

/* ================================================================
   BOOTSTRAP
   ================================================================ */
function bootstrap() {
  const container = document.getElementById('satGlobeUI');
  if (!container || document.getElementById('satGlobeCanvas')) return;

  container.innerHTML = buildLayout();
  setupEventHandlers(container);
  init3D(container.querySelector('#satGlobeCanvas'));
  loadConstellation(state.activeId);
}

/* ================================================================
   LAYOUT HTML
   ================================================================ */
function buildLayout() {
  const consByCat = {};
  CONSTELLATIONS.forEach(c => {
    if (!consByCat[c.category]) consByCat[c.category] = [];
    consByCat[c.category].push(c);
  });

  return `
    <div class="sg-layout">
      <!-- Top toolbar -->
      <div class="sg-toolbar">
        <div class="sg-toolbar__left">
          <button class="sg-mode-btn sg-mode-btn--active" id="sgMode3d">🌍 3D Globe</button>
          <button class="sg-mode-btn" id="sgMode2d">🗺 2D Mission Control</button>
        </div>
        <div class="sg-toolbar__center">
          <button class="sg-time-btn" id="sgPause" title="Пауза">⏸</button>
          <button class="sg-time-btn" id="sgSpeedDown">◀</button>
          <span class="sg-speed-label" id="sgSpeedLabel">×1</span>
          <button class="sg-time-btn" id="sgSpeedUp">▶</button>
          <span class="sg-time-display" id="sgTimeDisplay"></span>
        </div>
        <div class="sg-toolbar__right">
          <button class="sg-icon-btn" id="sgRefreshTle" title="Обновить TLE данные с CelesTrak">🔄 TLE</button>
          <button class="sg-icon-btn" id="sgLocBtn" title="Определить моё местоположение">📍 Позиция</button>
        </div>
      </div>

      <!-- Main area -->
      <div class="sg-main">
        <!-- Globe canvas (3D + 2D) -->
        <div class="sg-canvas-wrap" id="sgCanvasWrap">
          <canvas id="satGlobeCanvas"></canvas>
          <canvas id="satGlobe2dCanvas" style="display:none"></canvas>
          <div class="sg-loading" id="sgLoading" style="display:none">
            <div class="sg-loading__spinner"></div>
            <div class="sg-loading__text" id="sgLoadingText">Загружаю TLE…</div>
          </div>
          <div class="sg-hover-tooltip" id="sgHoverTooltip" style="display:none"></div>
        </div>

        <!-- Right sidebar -->
        <div class="sg-sidebar">
          <!-- Constellation selector -->
          <div class="sg-sidebar__section">
            <div class="sg-sidebar__title">Группировка</div>
            <div class="sg-cons-filter">
              ${Object.entries(CONSTELLATION_CATEGORIES).map(([catId, cat]) => `
                <div class="sg-cat-header">${cat.name}</div>
                ${(consByCat[catId] || []).map(c => `
                  <button class="sg-cons-btn ${c.id === state.activeId ? 'sg-cons-btn--active' : ''}" data-cons="${c.id}">
                    <span class="sg-cons-btn__dot" style="background:${c.color}"></span>
                    ${c.icon} ${c.name}
                  </button>
                `).join('')}
              `).join('')}
            </div>
          </div>

          <!-- Stats -->
          <div class="sg-sidebar__section">
            <div class="sg-stats" id="sgStats">
              <div class="sg-stat-row"><span>Спутников загружено:</span><strong id="sgStatTotal">–</strong></div>
              <div class="sg-stat-row"><span>Видимых из позиции:</span><strong id="sgStatVisible">–</strong></div>
              <div class="sg-stat-row"><span>Орбита:</span><strong id="sgStatOrbit">–</strong></div>
            </div>
          </div>

          <!-- Toggles -->
          <div class="sg-sidebar__section">
            <label class="sg-toggle-row"><input type="checkbox" id="sgShowCoverage" checked> Зоны покрытия</label>
            <label class="sg-toggle-row"><input type="checkbox" id="sgShowTracks" checked> Траектории</label>
            <label class="sg-toggle-row"><input type="checkbox" id="sgOnlyVisible"> Только над горизонтом</label>
          </div>

          <!-- Selected satellite info -->
          <div class="sg-sidebar__section" id="sgSatInfo" style="display:none"></div>
        </div>
      </div>
    </div>
  `;
}

/* ================================================================
   EVENT HANDLERS
   ================================================================ */
function setupEventHandlers(container) {
  // Mode switch
  container.querySelector('#sgMode3d').addEventListener('click', () => setMode('3d'));
  container.querySelector('#sgMode2d').addEventListener('click', () => setMode('2d'));

  // Time controls
  const SPEEDS = [0.1, 0.5, 1, 2, 5, 10, 30, 60, 300, 600];
  let speedIdx = SPEEDS.indexOf(1);
  container.querySelector('#sgPause').addEventListener('click', () => {
    state.paused = !state.paused;
    container.querySelector('#sgPause').textContent = state.paused ? '▶' : '⏸';
  });
  container.querySelector('#sgSpeedUp').addEventListener('click', () => {
    speedIdx = Math.min(speedIdx + 1, SPEEDS.length - 1);
    state.simSpeed = SPEEDS[speedIdx];
    container.querySelector('#sgSpeedLabel').textContent = `×${state.simSpeed}`;
  });
  container.querySelector('#sgSpeedDown').addEventListener('click', () => {
    speedIdx = Math.max(speedIdx - 1, 0);
    state.simSpeed = SPEEDS[speedIdx];
    container.querySelector('#sgSpeedLabel').textContent = `×${state.simSpeed}`;
  });

  // Refresh TLE — full update from CelesTrak
  container.querySelector('#sgRefreshTle').addEventListener('click', async () => {
    const btn = container.querySelector('#sgRefreshTle');
    btn.textContent = '⏳ Загружаю…';
    btn.disabled = true;
    showLoading(true, 'Обновляю TLE с CelesTrak…');
    await refreshAllTLE(groupId => {
      showLoading(true, `Обновляю: ${groupId}…`);
    });
    showLoading(false);
    btn.textContent = '🔄 TLE';
    btn.disabled = false;
    loadConstellation(state.activeId);
    addXP(5);
  });

  // Show bundled date hint
  const tleBtn = container.querySelector('#sgRefreshTle');
  if (tleBtn && BUNDLED_TLE_DATE) tleBtn.title = `Встроенные данные от: ${BUNDLED_TLE_DATE}\nНажмите для обновления с CelesTrak`;

  // Geolocation
  container.querySelector('#sgLocBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        state.userLat = pos.coords.latitude;
        state.userLon = pos.coords.longitude;
        updateUserMarker();
      }, () => {
        const latStr = prompt('Широта (°):', state.userLat.toFixed(2));
        const lonStr = prompt('Долгота (°):', state.userLon.toFixed(2));
        if (latStr && lonStr) {
          state.userLat = parseFloat(latStr) || 55.75;
          state.userLon = parseFloat(lonStr) || 37.62;
          updateUserMarker();
        }
      });
    }
  });

  // Constellation buttons
  container.addEventListener('click', e => {
    const btn = e.target.closest('.sg-cons-btn');
    if (!btn) return;
    const id = btn.dataset.cons;
    container.querySelectorAll('.sg-cons-btn').forEach(b => b.classList.remove('sg-cons-btn--active'));
    btn.classList.add('sg-cons-btn--active');
    loadConstellation(id);
  });

  // Toggles
  container.querySelector('#sgShowCoverage').addEventListener('change', e => { state.showCoverage = e.target.checked; });
  container.querySelector('#sgShowTracks').addEventListener('change', e => { state.showTracks = e.target.checked; });
  container.querySelector('#sgOnlyVisible').addEventListener('change', e => { state.showOnlyVisible = e.target.checked; });
}

/* ================================================================
   3D SCENE INIT
   ================================================================ */
function init3D(canvas) {
  const w = canvas.parentElement.clientWidth - 300;
  const h = canvas.parentElement.clientHeight || 500;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x030a1a);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
  camera.position.set(0, 0, orbit.r);

  // Sun light
  sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
  sunLight.position.set(5, 3, 5);
  scene.add(sunLight);
  ambientLight = new THREE.AmbientLight(0x112244, 0.8);
  scene.add(ambientLight);

  // Stars
  const starsGeo = new THREE.BufferGeometry();
  const starsVerts = new Float32Array(6000);
  for (let i = 0; i < 6000; i += 3) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 50 + Math.random() * 10;
    starsVerts[i] = r * Math.sin(phi) * Math.cos(theta);
    starsVerts[i+1] = r * Math.cos(phi);
    starsVerts[i+2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starsVerts, 3));
  const starSizes = new Float32Array(2000);
  for (let i = 0; i < 2000; i++) starSizes[i] = 0.5 + Math.random() * 1.5;
  starsGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
  const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, sizeAttenuation: true, vertexColors: false });
  starsMesh = new THREE.Points(starsGeo, starsMat);
  scene.add(starsMesh);

  // Earth
  const earthGeo = new THREE.SphereGeometry(EARTH_R, 64, 48);
  const earthMat = new THREE.ShaderMaterial({
    vertexShader: EARTH_VERT,
    fragmentShader: EARTH_FRAG,
    uniforms: { uTime: { value: 0 }, uSunDir: { value: new THREE.Vector3(5, 3, 5).normalize() } }
  });
  earthMesh = new THREE.Mesh(earthGeo, earthMat);
  scene.add(earthMesh);

  // Atmosphere
  const atmosGeo = new THREE.SphereGeometry(EARTH_R * 1.025, 32, 24);
  const atmosMat = new THREE.ShaderMaterial({
    vertexShader: EARTH_VERT,
    fragmentShader: ATMOS_FRAG,
    uniforms: { uSunDir: { value: new THREE.Vector3(5, 3, 5).normalize() } },
    transparent: true, side: THREE.FrontSide, depthWrite: false, blending: THREE.AdditiveBlending
  });
  atmosphereMesh = new THREE.Mesh(atmosGeo, atmosMat);
  scene.add(atmosphereMesh);

  // User position marker
  userMarker = createUserMarker();
  scene.add(userMarker);

  // Orbit controls
  attachOrbitControls(canvas);

  // Resize
  window.addEventListener('resize', () => {
    const w2 = canvas.parentElement.clientWidth - 300;
    const h2 = canvas.parentElement.clientHeight || 500;
    renderer.setSize(w2, h2);
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
  });

  // Click / hover on satellites
  attachSatInteraction(canvas);

  // Start render loop
  render3D();
}

function createUserMarker() {
  const group = new THREE.Group();
  // Dot on surface
  const geo = new THREE.SphereGeometry(0.012, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
  const dot = new THREE.Mesh(geo, mat);
  group.add(dot);
  // Vertical spike
  const spikeGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.06, 6);
  const spikeMat = new THREE.MeshBasicMaterial({ color: 0xffea00, transparent: true, opacity: 0.7 });
  const spike = new THREE.Mesh(spikeGeo, spikeMat);
  spike.position.y = 0.03;
  group.add(spike);
  updateUserMarker(group);
  return group;
}

function updateUserMarker(marker) {
  const m = marker || userMarker;
  if (!m) return;
  const pos = latLonAltToXYZ(state.userLat, state.userLon, 10);
  m.position.copy(pos);
  m.lookAt(new THREE.Vector3(0, 0, 0));
  m.rotateX(Math.PI / 2);
}

/* ================================================================
   ORBIT CAMERA CONTROLS
   ================================================================ */
function attachOrbitControls(canvas) {
  canvas.addEventListener('mousedown', e => { orbit.isDragging = true; orbit.lx = e.clientX; orbit.ly = e.clientY; });
  window.addEventListener('mouseup', () => { orbit.isDragging = false; });
  window.addEventListener('mousemove', e => {
    if (!orbit.isDragging) return;
    const dx = (e.clientX - orbit.lx) * 0.005;
    const dy = (e.clientY - orbit.ly) * 0.005;
    orbit.theta -= dx;
    orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbit.phi + dy));
    orbit.lx = e.clientX; orbit.ly = e.clientY;
  });
  canvas.addEventListener('wheel', e => {
    orbit.targetR = Math.max(1.15, Math.min(8, orbit.targetR + e.deltaY * 0.002));
  }, { passive: true });
  // Touch
  let lastTouchDist = 0;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { orbit.isDragging = true; orbit.lx = e.touches[0].clientX; orbit.ly = e.touches[0].clientY; }
    if (e.touches.length === 2) { lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && orbit.isDragging) {
      const dx = (e.touches[0].clientX - orbit.lx) * 0.007;
      const dy = (e.touches[0].clientY - orbit.ly) * 0.007;
      orbit.theta -= dx; orbit.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbit.phi + dy));
      orbit.lx = e.touches[0].clientX; orbit.ly = e.touches[0].clientY;
    }
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      orbit.targetR = Math.max(1.15, Math.min(8, orbit.targetR * (lastTouchDist / d)));
      lastTouchDist = d;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', () => { orbit.isDragging = false; });
}

function updateOrbitCamera() {
  orbit.r += (orbit.targetR - orbit.r) * 0.1; // smooth zoom
  const x = orbit.r * Math.sin(orbit.phi) * Math.cos(orbit.theta);
  const y = orbit.r * Math.cos(orbit.phi);
  const z = orbit.r * Math.sin(orbit.phi) * Math.sin(orbit.theta);
  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 0);
}

/* ================================================================
   SATELLITE CLICK / HOVER
   ================================================================ */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredSatIdx = -1;

function attachSatInteraction(canvas) {
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    handleHover(e.clientX - rect.left, e.clientY - rect.top);
  });
  canvas.addEventListener('click', () => {
    if (hoveredSatIdx >= 0) selectSatellite(hoveredSatIdx);
  });
}

function handleHover(px, py) {
  if (!satPointsMesh || state.sats.length === 0) return;
  raycaster.setFromCamera(mouse, camera);
  const positions = satPointsMesh.geometry.getAttribute('position');
  let minDist = 0.04;
  hoveredSatIdx = -1;
  for (let i = 0; i < state.sats.length; i++) {
    const p = state.positions[i];
    if (!p || !p.visible) continue;
    const pt = new THREE.Vector3(p.x, p.y, p.z);
    const dist = raycaster.ray.distanceToPoint(pt);
    if (dist < minDist) { minDist = dist; hoveredSatIdx = i; }
  }
  const tooltip = document.getElementById('sgHoverTooltip');
  if (!tooltip) return;
  if (hoveredSatIdx >= 0) {
    const s = state.sats[hoveredSatIdx];
    const p = state.positions[hoveredSatIdx];
    tooltip.style.display = 'block';
    tooltip.style.left = (px + 12) + 'px';
    tooltip.style.top = (py - 10) + 'px';
    tooltip.innerHTML = `<strong>${s.name}</strong><br>Alt: ${p.altKm.toFixed(0)} км · El: ${p.el.toFixed(1)}°`;
  } else {
    tooltip.style.display = 'none';
  }
}

function selectSatellite(idx) {
  state.selectedSat = { ...state.sats[idx], index: idx };
  renderSatInfoPanel(idx);
  updateSelectedMarker(idx);
  if (state.showTracks) drawGroundTrack(state.sats[idx].satrec);
  addXP(3);
}

/* ================================================================
   SATELLITE INFO PANEL
   ================================================================ */
function renderSatInfoPanel(idx) {
  const sat = state.sats[idx];
  const p = state.positions[idx];
  const cons = getConstellationById(state.activeId);
  const panel = document.getElementById('sgSatInfo');
  if (!panel || !sat || !p) return;
  panel.style.display = 'block';

  const elColor = p.el > 30 ? '#2ecc71' : p.el > 10 ? '#f1c40f' : p.el > 0 ? '#e67e22' : '#e74c3c';
  const elLabel = p.el > 30 ? 'Отлично' : p.el > 10 ? 'Хорошо' : p.el > 0 ? 'Слабый' : 'Под горизонтом';

  // Compute velocity (~approx)
  const velKms = cons.orbit === 'GEO' ? 3.07 : cons.orbit === 'MEO' ? (cons.altKm > 15000 ? 3.9 : 5.2) : (7.9 * Math.sqrt(6371 / (6371 + p.altKm)));

  panel.innerHTML = `
    <div class="sg-sat-card">
      <div class="sg-sat-card__header">
        <span class="sg-sat-card__dot" style="background:${cons.color}"></span>
        <strong class="sg-sat-card__name">${sat.name}</strong>
        <button class="sg-sat-card__close" id="sgCloseInfo">✕</button>
      </div>
      <div class="sg-sat-card__section">
        <div class="sg-sat-row"><span>📍 Lat/Lon</span><strong>${p.lat.toFixed(2)}° / ${p.lon.toFixed(2)}°</strong></div>
        <div class="sg-sat-row"><span>🔼 Высота</span><strong>${p.altKm.toFixed(0)} км</strong></div>
        <div class="sg-sat-row"><span>💨 Скорость</span><strong>~${velKms.toFixed(2)} км/с</strong></div>
      </div>
      <div class="sg-sat-card__section">
        <div class="sg-sat-row"><span>📐 Угол возвышения</span><strong style="color:${elColor}">${p.el.toFixed(1)}° — ${elLabel}</strong></div>
        <div class="sg-sat-row"><span>🎯 Наклонение</span><strong>${cons.inclinationDeg}°
          <span class="sg-hint" title="Угол между плоскостью орбиты и экватором. 0° = экваториальная, 90° = полярная.">?</span>
        </strong></div>
        <div class="sg-sat-row"><span>🌍 Орбита</span><strong>${cons.orbit} (${cons.altKm >= 1000 ? (cons.altKm/1000).toFixed(0)+' тыс. км' : cons.altKm+' км'})</strong></div>
      </div>
      <div class="sg-sat-card__section">
        <div class="sg-sat-card__sub">Частоты</div>
        ${cons.bandList.map(b => `<div class="sg-sat-band">${b}</div>`).join('')}
      </div>
      <div class="sg-sat-card__how">
        <div class="sg-sat-card__sub">Как работает связь</div>
        <div class="sg-sat-card__how-text">${cons.howItWorks}</div>
      </div>
      <div class="sg-sat-card__spec">
        ${cons.commSpec.uplink ? `<div class="sg-sat-row"><span>UL</span><strong>${cons.commSpec.uplink}</strong></div>` : ''}
        <div class="sg-sat-row"><span>DL</span><strong>${cons.commSpec.downlink}</strong></div>
        <div class="sg-sat-row"><span>Задержка</span><strong>${cons.commSpec.latency}</strong></div>
        <div class="sg-sat-row"><span>Модуляция</span><strong>${cons.commSpec.modulation}</strong></div>
      </div>
      <button class="sg-sim-btn" id="sgSimBtn">📡 Симулировать связь через ${sat.name}</button>
    </div>
  `;
  panel.querySelector('#sgCloseInfo').addEventListener('click', () => {
    panel.style.display = 'none';
    state.selectedSat = null;
    if (selectedSatMesh) { scene.remove(selectedSatMesh); selectedSatMesh = null; }
    clearTracks();
  });
  panel.querySelector('#sgSimBtn').addEventListener('click', () => {
    showSignalSim(idx);
  });
}

/* ================================================================
   LOAD CONSTELLATION
   ================================================================ */
async function loadConstellation(id) {
  if (state.abortLoading) state.abortLoading();
  let aborted = false;
  state.abortLoading = () => { aborted = true; };

  state.activeId = id;
  state.sats = [];
  state.positions = [];
  state.selectedSat = null;

  // Hide sat info panel
  const panel = document.getElementById('sgSatInfo');
  if (panel) panel.style.display = 'none';

  // Clear old geometry
  if (satPointsMesh) { scene.remove(satPointsMesh); satPointsMesh.geometry.dispose(); satPointsMesh = null; }
  clearTracks();

  showLoading(true, 'Загружаю TLE…');

  const cons = getConstellationById(id);
  const maxSats = cons?.orbit === 'LEO' && cons?.countNominal > 500 ? 200 : 500;

  const tles = await loadTLE(id, maxSats);
  if (aborted) return;

  if (tles.length === 0) {
    showLoading(true, '⚠️ Нет данных. Проверьте интернет.');
    setTimeout(() => showLoading(false), 3000);
    return;
  }

  showLoading(true, `Обрабатываю ${tles.length} спутников…`);

  // Parse satrecs
  for (const t of tles) {
    try {
      const satrec = twoline2satrec(t.tle1, t.tle2);
      state.sats.push({ name: t.name, satrec });
    } catch (e) { /* skip bad TLEs */ }
  }

  showLoading(false);

  // Initial propagation
  propagateAll(state.simTime);

  // Build Three.js points geometry
  buildSatPoints();

  // Update stats
  updateStats();

  document.getElementById('sgStatOrbit').textContent = cons ? `${cons.orbit} ~${cons.altKm >= 1000 ? (cons.altKm/1000).toFixed(0)+' тыс.' : cons.altKm} км` : '–';
}

/* ================================================================
   PROPAGATION
   ================================================================ */
function propagateAll(date) {
  const gmst = gstime(date);
  state.positions = [];
  for (const sat of state.sats) {
    try {
      const pv = propagate(sat.satrec, date);
      if (!pv.position || typeof pv.position.x !== 'number') {
        state.positions.push(null); continue;
      }
      const geo = eciToGeodetic(pv.position, gmst);
      const lat = degreesLat(geo.latitude);
      const lon = degreesLong(geo.longitude);
      const altKm = geo.height;
      const { x, y, z } = latLonAltToXYZ(lat, lon, altKm);
      const el = calcElevation(state.userLat, state.userLon, lat, lon, altKm);
      state.positions.push({ lat, lon, altKm, x, y, z, visible: el >= -5, el });
    } catch (e) {
      state.positions.push(null);
    }
  }
}

/* ================================================================
   THREE.JS POINTS GEOMETRY
   ================================================================ */
function buildSatPoints() {
  const n = state.sats.length;
  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  const sizes = new Float32Array(n);
  const cons = getConstellationById(state.activeId);
  const col = new THREE.Color(cons?.color || '#00e5ff');

  for (let i = 0; i < n; i++) {
    const p = state.positions[i];
    if (p) {
      positions[i*3] = p.x; positions[i*3+1] = p.y; positions[i*3+2] = p.z;
    }
    colors[i*3] = col.r; colors[i*3+1] = col.g; colors[i*3+2] = col.b;
    sizes[i] = 3.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.3, 0.5, d);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true, vertexColors: true, depthWrite: false
  });

  satPointsMesh = new THREE.Points(geo, mat);
  scene.add(satPointsMesh);
}

function updateSatPoints() {
  if (!satPointsMesh) return;
  const pos = satPointsMesh.geometry.getAttribute('position');
  const col = satPointsMesh.geometry.getAttribute('color');
  const siz = satPointsMesh.geometry.getAttribute('size');
  const cons = getConstellationById(state.activeId);
  const baseCol = new THREE.Color(cons?.color || '#00e5ff');
  const dimCol = new THREE.Color(0x334455);

  for (let i = 0; i < state.sats.length; i++) {
    const p = state.positions[i];
    if (!p) continue;
    const hide = state.showOnlyVisible && !p.visible;
    pos.setXYZ(i, hide ? 0 : p.x, hide ? 0 : p.y, hide ? 0 : p.z);
    const c = p.visible ? baseCol : dimCol;
    col.setXYZ(i, c.r, c.g, c.b);
    const isSelected = state.selectedSat && state.selectedSat.index === i;
    siz.setX(i, isSelected ? 8 : 3.5);
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
  siz.needsUpdate = true;
}

/* ================================================================
   SELECTED SAT MARKER (glowing sphere)
   ================================================================ */
function updateSelectedMarker(idx) {
  if (selectedSatMesh) scene.remove(selectedSatMesh);
  const p = state.positions[idx];
  if (!p) return;
  const cons = getConstellationById(state.activeId);
  const geo = new THREE.SphereGeometry(0.018, 12, 12);
  const mat = new THREE.MeshBasicMaterial({ color: cons?.color || 0x00e5ff, transparent: true, opacity: 0.9 });
  selectedSatMesh = new THREE.Mesh(geo, mat);
  selectedSatMesh.position.set(p.x, p.y, p.z);
  scene.add(selectedSatMesh);
}

/* ================================================================
   GROUND TRACK
   ================================================================ */
function drawGroundTrack(satrec) {
  clearTracks();
  const points = [];
  const dt = 60 * 1000; // 1 min steps
  const steps = 90; // 90 min = one orbit
  for (let i = -10; i < steps; i++) {
    const t = new Date(state.simTime.getTime() + i * dt);
    try {
      const pv = propagate(satrec, t);
      if (!pv.position || typeof pv.position.x !== 'number') continue;
      const geo = eciToGeodetic(pv.position, gstime(t));
      const lat = degreesLat(geo.latitude);
      const lon = degreesLong(geo.longitude);
      const alt = geo.height;
      const p = latLonAltToXYZ(lat, lon, alt * 0.3 + 5); // slightly above surface
      points.push(new THREE.Vector3(p.x, p.y, p.z));
    } catch (e) { /* skip */ }
  }

  if (points.length < 2) return;

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, linewidth: 1 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  trackLines.push(line);
}

function clearTracks() {
  trackLines.forEach(l => { scene.remove(l); l.geometry.dispose(); });
  trackLines = [];
}

/* ================================================================
   SIGNAL SIMULATION PANEL
   ================================================================ */
function showSignalSim(satIdx) {
  const sat = state.sats[satIdx];
  const p = state.positions[satIdx];
  const cons = getConstellationById(state.activeId);
  if (!sat || !p) return;

  // Draw signal line from user → satellite
  signalLines.forEach(l => { scene.remove(l); l.geometry.dispose(); });
  signalLines = [];

  const userPos = latLonAltToXYZ(state.userLat, state.userLon, 5);
  const satPos = new THREE.Vector3(p.x, p.y, p.z);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(userPos.x, userPos.y, userPos.z),
    new THREE.Vector3((userPos.x + satPos.x)/2 * 1.15, (userPos.y + satPos.y)/2 * 1.15, (userPos.z + satPos.z)/2 * 1.15),
    satPos
  ]);
  const pts = curve.getPoints(40);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: cons?.color || 0x00ff88, transparent: true, opacity: 0.8 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  signalLines.push(line);

  // Show info panel
  const distKm = p.altKm / Math.sin(Math.max(p.el, 5) * Math.PI / 180);
  const delayMs = (distKm / 299792) * 1000;
  const fspl = 20 * Math.log10(distKm / 1000) + 20 * Math.log10((cons?.altKm > 10000 ? 1.5 : 12)) + 92.45;

  const infoEl = document.getElementById('sgSatInfo');
  if (!infoEl) return;
  infoEl.innerHTML += `
    <div class="sg-sim-result">
      <div class="sg-sat-card__sub">📡 Связь через ${sat.name}</div>
      <div class="sg-sat-row"><span>Дальность</span><strong>${distKm.toFixed(0)} км</strong></div>
      <div class="sg-sat-row"><span>Задержка one-way</span><strong>${delayMs.toFixed(1)} мс</strong></div>
      <div class="sg-sat-row"><span>FSPL</span><strong>${fspl.toFixed(1)} дБ</strong></div>
      <div class="sg-sat-row"><span>RTT ~</span><strong>${(delayMs * 2).toFixed(0)} мс</strong></div>
      <div class="sg-sat-row sg-sat-row--note">
        ${cons?.orbit === 'GEO' ? '⚠️ GEO: высокая задержка (600+ мс RTT) — не для онлайн-игр и VoIP' :
          cons?.orbit === 'LEO' ? '✅ LEO: низкая задержка, близко к кабельному интернету' :
          '📡 MEO: средняя задержка'}
      </div>
    </div>
  `;
}

/* ================================================================
   RENDER LOOP (3D)
   ================================================================ */
let frameCount = 0;
function render3D() {
  animId = requestAnimationFrame(render3D);
  if (state.mode !== '3d') return;

  // Advance simulation time
  if (!state.paused) {
    const now = Date.now();
    const dt = (now - state.lastTick) * state.simSpeed;
    state.simTime = new Date(state.simTime.getTime() + dt);
    state.lastTick = now;
  }

  // Propagate (every 3rd frame = ~20fps at 60fps)
  frameCount++;
  if (frameCount % 3 === 0 && state.sats.length > 0) {
    propagateAll(state.simTime);
    updateSatPoints();
    if (state.selectedSat) {
      const p = state.positions[state.selectedSat.index];
      if (selectedSatMesh && p) selectedSatMesh.position.set(p.x, p.y, p.z);
    }
  }

  // Sun position (approx)
  const sunAngle = (state.simTime.getTime() / (24 * 3600000)) * Math.PI * 2;
  const sunDir = new THREE.Vector3(Math.cos(sunAngle), 0.3, Math.sin(sunAngle)).normalize();
  earthMesh.material.uniforms.uSunDir.value.copy(sunDir);
  atmosphereMesh.material.uniforms.uSunDir.value.copy(sunDir);
  sunLight.position.copy(sunDir.multiplyScalar(10));

  // Earth rotation (visual only — real rotation handled by satellite propagation)
  earthMesh.rotation.y = ((state.simTime.getTime() / 1000) % 86400) / 86400 * Math.PI * 2;

  // Camera
  updateOrbitCamera();

  // Pulse selected sat
  if (selectedSatMesh) {
    const t = Date.now() / 500;
    selectedSatMesh.material.opacity = 0.6 + 0.4 * Math.sin(t);
  }

  // Update time display
  if (frameCount % 30 === 0) {
    const el = document.getElementById('sgTimeDisplay');
    if (el) el.textContent = state.simTime.toUTCString().replace(' GMT', ' UTC').slice(0, 22);
  }

  updateStats();
  renderer.render(scene, camera);
}

/* ================================================================
   2D MODE — NASA Mission Control Style
   ================================================================ */
let ctx2d = null;

function setMode(mode) {
  state.mode = mode;
  const c3 = document.getElementById('satGlobeCanvas');
  const c2 = document.getElementById('satGlobe2dCanvas');
  const btn3 = document.getElementById('sgMode3d');
  const btn2 = document.getElementById('sgMode2d');

  if (mode === '3d') {
    if (c3) c3.style.display = 'block';
    if (c2) c2.style.display = 'none';
    btn3?.classList.add('sg-mode-btn--active');
    btn2?.classList.remove('sg-mode-btn--active');
  } else {
    if (c3) c3.style.display = 'none';
    if (c2) {
      c2.style.display = 'block';
      init2D(c2);
    }
    btn2?.classList.add('sg-mode-btn--active');
    btn3?.classList.remove('sg-mode-btn--active');
    render2D();
  }
}

function init2D(canvas) {
  const wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth - 300;
  canvas.height = Math.min(wrap.clientHeight || 500, 500);
  ctx2d = canvas.getContext('2d');
  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    handle2dClick(e.clientX - rect.left, e.clientY - rect.top, canvas.width, canvas.height);
  });
}

function render2D() {
  if (state.mode !== '2d') return;
  const canvas = document.getElementById('satGlobe2dCanvas');
  if (!canvas || !ctx2d) return;

  if (!state.paused) {
    const now = Date.now();
    const dt = (now - state.lastTick) * state.simSpeed;
    state.simTime = new Date(state.simTime.getTime() + dt);
    state.lastTick = now;
  }
  if (frameCount % 3 === 0 && state.sats.length > 0) {
    propagateAll(state.simTime);
  }
  frameCount++;

  const W = canvas.width, H = canvas.height;

  // Clear — dark space background
  ctx2d.fillStyle = '#050d1e';
  ctx2d.fillRect(0, 0, W, H);

  // Grid
  ctx2d.strokeStyle = 'rgba(52,152,219,0.12)';
  ctx2d.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = latToY(lat, H);
    ctx2d.beginPath(); ctx2d.moveTo(0, y); ctx2d.lineTo(W, y); ctx2d.stroke();
    ctx2d.fillStyle = 'rgba(52,152,219,0.4)'; ctx2d.font = '9px monospace';
    ctx2d.fillText(lat + '°', 3, y - 2);
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = lonToX(lon, W);
    ctx2d.beginPath(); ctx2d.moveTo(x, 0); ctx2d.lineTo(x, H); ctx2d.stroke();
    if (lon !== -180 && lon !== 180) {
      ctx2d.fillStyle = 'rgba(52,152,219,0.4)'; ctx2d.font = '9px monospace';
      ctx2d.fillText(lon + '°', x + 2, H - 4);
    }
  }

  // Equator + prime meridian
  ctx2d.strokeStyle = 'rgba(52,152,219,0.5)'; ctx2d.lineWidth = 1.5;
  ctx2d.beginPath(); ctx2d.moveTo(0, latToY(0, H)); ctx2d.lineTo(W, latToY(0, H)); ctx2d.stroke();
  ctx2d.beginPath(); ctx2d.moveTo(lonToX(0, W), 0); ctx2d.lineTo(lonToX(0, W), H); ctx2d.stroke();

  // Continents
  drawContinents2D(W, H);

  // Ground tracks (selected sat)
  if (state.selectedSat && state.showTracks) {
    draw2dGroundTrack(state.selectedSat.satrec, W, H);
  }

  // Coverage footprints
  const cons = getConstellationById(state.activeId);
  if (state.showCoverage && cons) {
    draw2dCoverage(W, H, cons);
  }

  // Satellites
  draw2dSatellites(W, H, cons);

  // User position
  const ux = lonToX(state.userLon, W);
  const uy = latToY(state.userLat, H);
  ctx2d.fillStyle = '#ffea00';
  ctx2d.beginPath(); ctx2d.arc(ux, uy, 5, 0, Math.PI*2); ctx2d.fill();
  ctx2d.strokeStyle = '#ffea00'; ctx2d.lineWidth = 1.5;
  ctx2d.beginPath(); ctx2d.arc(ux, uy, 10, 0, Math.PI*2); ctx2d.stroke();

  // Time display
  ctx2d.fillStyle = 'rgba(52,152,219,0.9)';
  ctx2d.font = 'bold 11px monospace';
  ctx2d.fillText(state.simTime.toUTCString().replace(' GMT', ' UTC'), W - 260, 16);

  // Constellation label
  ctx2d.fillStyle = cons?.color || '#00e5ff';
  ctx2d.font = 'bold 13px monospace';
  ctx2d.fillText(`${cons?.icon || '🛸'} ${cons?.name || state.activeId}`, 8, 18);
  ctx2d.fillStyle = 'rgba(255,255,255,0.5)';
  ctx2d.font = '11px monospace';
  ctx2d.fillText(`${state.sats.length} сат / ${state.positions.filter(p => p?.visible).length} видимых`, 8, 32);

  requestAnimationFrame(render2D);
}

function drawContinents2D(W, H) {
  ctx2d.strokeStyle = 'rgba(100,160,120,0.55)';
  ctx2d.lineWidth = 1;
  for (const continent of CONTINENTS_2D) {
    if (continent.length < 2) continue;
    ctx2d.beginPath();
    continent.forEach(([lat, lon], i) => {
      const x = lonToX(lon, W), y = latToY(lat, H);
      if (i === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
    });
    ctx2d.stroke();
  }
}

function draw2dSatellites(W, H, cons) {
  const col = cons?.color || '#00e5ff';
  for (let i = 0; i < state.sats.length; i++) {
    const p = state.positions[i];
    if (!p) continue;
    if (state.showOnlyVisible && !p.visible) continue;
    const x = lonToX(p.lon, W);
    const y = latToY(p.lat, H);
    const isSelected = state.selectedSat && state.selectedSat.index === i;
    const alpha = p.visible ? 1.0 : 0.3;
    ctx2d.globalAlpha = alpha;
    if (isSelected) {
      ctx2d.fillStyle = '#ffffff';
      ctx2d.beginPath(); ctx2d.arc(x, y, 5, 0, Math.PI*2); ctx2d.fill();
    } else {
      ctx2d.fillStyle = col;
      ctx2d.beginPath(); ctx2d.arc(x, y, 2.5, 0, Math.PI*2); ctx2d.fill();
    }
    ctx2d.globalAlpha = 1;
  }
}

function draw2dGroundTrack(satrec, W, H) {
  ctx2d.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx2d.lineWidth = 1.5;
  ctx2d.setLineDash([4, 3]);
  const dt = 60 * 1000;
  let lastX = null, lastY = null;
  for (let i = -5; i < 90; i++) {
    const t = new Date(state.simTime.getTime() + i * dt);
    try {
      const pv = propagate(satrec, t);
      if (!pv.position || typeof pv.position.x !== 'number') continue;
      const geo = eciToGeodetic(pv.position, gstime(t));
      const lat = degreesLat(geo.latitude);
      const lon = degreesLong(geo.longitude);
      const x = lonToX(lon, W), y = latToY(lat, H);
      if (lastX !== null) {
        if (Math.abs(x - lastX) < W * 0.6) {
          ctx2d.beginPath(); ctx2d.moveTo(lastX, lastY); ctx2d.lineTo(x, y); ctx2d.stroke();
        }
      }
      lastX = x; lastY = y;
    } catch (e) { lastX = null; }
  }
  ctx2d.setLineDash([]);
}

function draw2dCoverage(W, H, cons) {
  const maxVis = cons.orbit === 'GEO' ? 70 : Math.min(70, Math.acos(6371 / (6371 + cons.altKm)) * 180 / Math.PI);
  ctx2d.globalAlpha = 0.07;
  for (let i = 0; i < state.sats.length; i += Math.max(1, Math.floor(state.sats.length / 20))) {
    const p = state.positions[i];
    if (!p || !p.visible) continue;
    const radiusPx = (maxVis / 180) * H * 0.9;
    const grd = ctx2d.createRadialGradient(lonToX(p.lon, W), latToY(p.lat, H), 0, lonToX(p.lon, W), latToY(p.lat, H), radiusPx);
    grd.addColorStop(0, cons.color);
    grd.addColorStop(1, 'transparent');
    ctx2d.fillStyle = grd;
    ctx2d.beginPath();
    ctx2d.arc(lonToX(p.lon, W), latToY(p.lat, H), radiusPx, 0, Math.PI*2);
    ctx2d.fill();
  }
  ctx2d.globalAlpha = 1;
}

function handle2dClick(px, py, W, H) {
  for (let i = 0; i < state.sats.length; i++) {
    const p = state.positions[i];
    if (!p) continue;
    const x = lonToX(p.lon, W), y = latToY(p.lat, H);
    if (Math.hypot(px - x, py - y) < 8) { selectSatellite(i); return; }
  }
}

/* ================================================================
   HELPERS
   ================================================================ */
function latLonAltToXYZ(lat, lon, altKm) {
  const r = EARTH_R + altKm * SAT_SCALE;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function latToY(lat, H) { return H / 2 - (lat / 90) * (H / 2); }
function lonToX(lon, W) { return (lon + 180) / 360 * W; }

function calcElevation(userLat, userLon, satLat, satLon, satAltKm) {
  const Re = EARTH_R_KM;
  const rl = Re;
  const rs = Re + satAltKm;
  const dlat = (satLat - userLat) * Math.PI / 180;
  const dlon = (satLon - userLon) * Math.PI / 180;
  const a = Math.sin(dlat/2)**2 + Math.cos(userLat*Math.PI/180) * Math.cos(satLat*Math.PI/180) * Math.sin(dlon/2)**2;
  const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const el = Math.atan2(Math.cos(centralAngle) - Re/rs, Math.sin(centralAngle)) * 180 / Math.PI;
  return el;
}

function updateStats() {
  const total = document.getElementById('sgStatTotal');
  const visible = document.getElementById('sgStatVisible');
  if (total) total.textContent = state.sats.length;
  if (visible) visible.textContent = state.positions.filter(p => p?.visible).length;
}

function showLoading(show, text) {
  const el = document.getElementById('sgLoading');
  if (!el) return;
  el.style.display = show ? 'flex' : 'none';
  if (text) { const t = document.getElementById('sgLoadingText'); if (t) t.textContent = text; }
}
