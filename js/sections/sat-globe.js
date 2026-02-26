/**
 * Satellite Globe — 3D (Three.js WebGL) + 2D (Canvas NASA Mission Control)
 */
import * as THREE from '../libs/three.module.min.js';
import { twoline2satrec, propagate, gstime, eciToGeodetic, degreesLat, degreesLong } from '../libs/satellite.es.js';
import { CONSTELLATIONS, getConstellationById } from '../data/sat-constellations.js';
import { loadTLE, clearTleCache, refreshAllTLE, BUNDLED_TLE_DATE } from '../data/sat-tle-data.js';
import { WORLD_COASTLINES } from '../data/world-coastlines.js';
import { addXP } from '../core/gamification.js';

/* ------------------------------------------------------------------ */
const EARTH_R    = 1.0;          // Three.js units = Earth radius
const EARTH_R_KM = 6371;
const TO3D       = 1 / EARTH_R_KM;

/* ------------------------------------------------------------------ */
/* STATE                                                                */
/* ------------------------------------------------------------------ */
let st = {
  mode: '3d',
  activeId: 'gps-ops',
  simTime: new Date(),
  simSpeed: 1,
  lastTick: Date.now(),
  paused: false,
  userLat: 55.75, userLon: 37.62,
  showCoverage: true, showTracks: true, showOnlyVis: false,
  selIdx: -1,
  sats: [],        // [{ name, satrec }]
  pos: [],         // [{ lat,lon,altKm, x,y,z, vis, el } | null]
};

/* ------------------------------------------------------------------ */
/* THREE.JS                                                            */
/* ------------------------------------------------------------------ */
let scene, camera, renderer, animId;
let earthMesh, atmosMesh;
let satPoints = null;
let selMesh   = null;
let trackLines = [];
let sigLines   = [];
let userPin    = null;
let orbitRing  = null;

/* camera orbit */
let orb = { theta:0.5, phi:1.1, r:7.5, targetR:7.5, drag:false, lx:0, ly:0 };

/* ------------------------------------------------------------------ */
/* SHADERS                                                             */
/* ------------------------------------------------------------------ */
const EARTH_VERT = `
  varying vec2 vUv; varying vec3 vNorm;
  void main(){vUv=uv;vNorm=normalize(normalMatrix*normal);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`;
const EARTH_FRAG = `
  varying vec2 vUv; varying vec3 vNorm;
  uniform vec3 uSun;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){
    float lat=(vUv.y-.5)*3.14159, lon=vUv.x*6.28318-3.14159;
    vec3 deep=vec3(.02,.06,.22), shallow=vec3(.05,.13,.38);
    float no=n2(vUv*18.)*.3+n2(vUv*55.)*.08;
    vec3 col=mix(deep,shallow,no+.45);
    /* grid */
    float grd=30.*.01745, lw=.005;
    if(mod(abs(lat),grd)<lw||mod(abs(lon),grd)<lw) col=mix(col,vec3(.18,.35,.7),.35);
    if(abs(lat)<.015) col=mix(col,vec3(.3,.6,.95),.55);
    if(abs(lon)<.015) col=mix(col,vec3(.3,.6,.95),.45);
    float diff=max(0.,dot(vNorm,normalize(uSun)));
    col*=.15+(1.-.15)*diff;
    float rim=1.-clamp(dot(vNorm,vec3(0,0,1)),0.,1.);
    col=mix(col,vec3(.15,.45,.95),pow(rim,5.)*.4);
    gl_FragColor=vec4(col,1.);}
`;
const ATMOS_FRAG = `
  varying vec2 vUv; varying vec3 vNorm;
  uniform vec3 uSun;
  void main(){
    float rim=1.-clamp(dot(vNorm,vec3(0,0,1)),0.,1.);
    float sun=dot(normalize(uSun),vNorm)*.5+.5;
    vec3 a=mix(vec3(.1,.3,.8),vec3(.5,.8,1.),sun);
    gl_FragColor=vec4(a,pow(rim,3.)*.65);}
`;
const SAT_VERT = `
  attribute float size; attribute vec3 col; varying vec3 vC; varying float vSel;
  void main(){
    vC=col; vSel=size>7.0?1.0:0.0;
    vec4 mv=modelViewMatrix*vec4(position,1.);
    /* Fixed pixel size — never bigger than 9px, never smaller than 3px */
    float dist=max(-mv.z,0.5);
    gl_PointSize=clamp(size*(12./dist),3.0,9.0);
    if(vSel>0.5) gl_PointSize=clamp(size*(12./dist),6.0,14.0);
    gl_Position=projectionMatrix*mv;}
`;
const SAT_FRAG = `
  varying vec3 vC; varying float vSel;
  void main(){
    vec2 uv=gl_PointCoord-vec2(.5);
    float d=length(uv);
    if(d>.5)discard;
    float core=1.-smoothstep(.0,.32,d);
    float edge=1.-smoothstep(.32,.5,d);
    float a=core*.95+edge*.4;
    /* Selected: add bright ring */
    if(vSel>.5){float ring=smoothstep(.38,.45,d)*(1.-smoothstep(.45,.5,d));a+=ring*2.0;}
    gl_FragColor=vec4(vC,a);}
`;

/* ------------------------------------------------------------------ */
/* INIT                                                                */
/* ------------------------------------------------------------------ */
export function initSatGlobe() {
  const sec = document.getElementById('section-sat-globe');
  if (!sec) return;
  const obs = new MutationObserver(() => {
    if (sec.classList.contains('active') && !document.getElementById('sgCanvas3d')) boot();
  });
  obs.observe(sec, { attributes:true, attributeFilter:['class'] });
  setTimeout(() => { if (sec.classList.contains('active')) boot(); }, 200);
}

function boot() {
  const ui = document.getElementById('satGlobeUI');
  if (!ui || document.getElementById('sgCanvas3d')) return;
  ui.innerHTML = html();
  bindEvents(ui);
  build3D(ui.querySelector('#sgCanvas3d'));
  loadCons('gps-ops');
}

/* ------------------------------------------------------------------ */
/* HTML                                                                */
/* ------------------------------------------------------------------ */
function html() {
  const byCat = {};
  CONSTELLATIONS.forEach(c => { (byCat[c.category] = byCat[c.category]||[]).push(c); });
  const cats = {
    navigation: '🧭 Навигация (GNSS)', broadband_leo: '🚀 LEO широкополосные',
    voice_maritime: '📞 Голос / Морская', meo_broadband: '⚡ MEO', geo_broadband: '🛰️ GEO',
    iot: '📦 IoT / M2M', weather: '🌩️ Метеорология', stations: '🏠 Орбитальные станции',
  };
  return `
<div class="sg-layout">
  <div class="sg-toolbar">
    <div class="sg-tb-left">
      <button class="sg-mode-btn sg-mode-btn--on" id="sgBtn3d">🌍 3D</button>
      <button class="sg-mode-btn" id="sgBtn2d">🗺 2D</button>
    </div>
    <div class="sg-tb-mid">
      <button class="sg-tb-btn" id="sgPause">⏸</button>
      <button class="sg-tb-btn" id="sgSlower">◀</button>
      <span class="sg-speed" id="sgSpeed">×1</span>
      <button class="sg-tb-btn" id="sgFaster">▶</button>
      <span class="sg-clock" id="sgClock"></span>
    </div>
    <div class="sg-tb-right">
      <button class="sg-tb-btn" id="sgRefresh" title="Обновить TLE с CelesTrak">↺ TLE</button>
      <button class="sg-tb-btn" id="sgLoc" title="Моя позиция">📍</button>
    </div>
  </div>
  <div class="sg-body">
    <div class="sg-viewport" id="sgViewport">
      <canvas id="sgCanvas3d"></canvas>
      <canvas id="sgCanvas2d" style="display:none;position:absolute;inset:0;width:100%;height:100%"></canvas>
      <div class="sg-loading" id="sgLoad" style="display:none"><div class="sg-spin"></div><span id="sgLoadTxt">Загружаю…</span></div>
      <div class="sg-tip" id="sgTip" style="display:none"></div>
    </div>
    <div class="sg-panel">
      <div class="sg-panel-block">
        <div class="sg-panel-head">Группировка</div>
        <div class="sg-cons-list" id="sgConsList">
          ${Object.entries(cats).map(([cat,lbl]) => `
            <div class="sg-cat-label">${lbl}</div>
            ${(byCat[cat]||[]).map(c=>`
              <button class="sg-cons-item ${c.id===st.activeId?'sg-cons-item--on':''}" data-id="${c.id}">
                <span style="background:${c.color}" class="sg-cons-dot"></span>${c.icon} ${c.name}
              </button>`).join('')}
          `).join('')}
        </div>
      </div>
      <div class="sg-panel-block">
        <div class="sg-panel-stat"><span>Спутников:</span><b id="sgTotal">–</b></div>
        <div class="sg-panel-stat"><span>Видимых:</span><b id="sgVis">–</b></div>
        <div class="sg-panel-stat"><span>Орбита:</span><b id="sgOrbit">–</b></div>
      </div>
      <div class="sg-panel-block sg-toggles">
        <label><input type="checkbox" id="sgChkCov" checked> Зоны покрытия</label>
        <label><input type="checkbox" id="sgChkTrk" checked> Траектории</label>
        <label><input type="checkbox" id="sgChkOnlyVis"> Только над горизонтом</label>
      </div>
      <div id="sgInfo"></div>
    </div>
  </div>
</div>`;
}

/* ------------------------------------------------------------------ */
/* EVENTS                                                              */
/* ------------------------------------------------------------------ */
const SPEEDS = [0.1, 0.5, 1, 2, 5, 10, 30, 60, 300, 600];
let speedIdx = 2;

function bindEvents(ui) {
  ui.querySelector('#sgBtn3d').onclick = () => setMode('3d');
  ui.querySelector('#sgBtn2d').onclick = () => setMode('2d');
  ui.querySelector('#sgPause').onclick = () => {
    st.paused = !st.paused;
    ui.querySelector('#sgPause').textContent = st.paused ? '▶' : '⏸';
  };
  ui.querySelector('#sgFaster').onclick = () => {
    speedIdx = Math.min(speedIdx+1, SPEEDS.length-1);
    st.simSpeed = SPEEDS[speedIdx];
    ui.querySelector('#sgSpeed').textContent = '×'+st.simSpeed;
  };
  ui.querySelector('#sgSlower').onclick = () => {
    speedIdx = Math.max(speedIdx-1, 0);
    st.simSpeed = SPEEDS[speedIdx];
    ui.querySelector('#sgSpeed').textContent = '×'+st.simSpeed;
  };
  ui.querySelector('#sgRefresh').onclick = async () => {
    const btn = ui.querySelector('#sgRefresh'); btn.disabled=true; btn.textContent='⌛';
    setLoad(true,'Обновляю все TLE…');
    await refreshAllTLE(g => setLoad(true,`Обновляю: ${g}…`));
    setLoad(false); btn.disabled=false; btn.textContent='↺ TLE';
    loadCons(st.activeId); addXP(5);
  };
  ui.querySelector('#sgLoc').onclick = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(p => {
      st.userLat = p.coords.latitude; st.userLon = p.coords.longitude;
      placeUserPin();
    }, () => {});
  };
  ui.querySelector('#sgConsList').onclick = e => {
    const btn = e.target.closest('.sg-cons-item'); if (!btn) return;
    ui.querySelectorAll('.sg-cons-item').forEach(b => b.classList.remove('sg-cons-item--on'));
    btn.classList.add('sg-cons-item--on');
    loadCons(btn.dataset.id);
  };
  ui.querySelector('#sgChkCov').onchange  = e => { st.showCoverage = e.target.checked; };
  ui.querySelector('#sgChkTrk').onchange  = e => { st.showTracks   = e.target.checked; };
  ui.querySelector('#sgChkOnlyVis').onchange = e => { st.showOnlyVis = e.target.checked; };
}

/* ------------------------------------------------------------------ */
/* BUILD 3D                                                            */
/* ------------------------------------------------------------------ */
function build3D(canvas) {
  const vp = canvas.parentElement;
  const W = vp.clientWidth  || 800;
  const H = vp.clientHeight || 600;

  renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x020915);

  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, W/H, 0.01, 200);

  /* Sun */
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(8,4,6); scene.add(sun);
  scene.add(new THREE.AmbientLight(0x112244, 1.0));

  /* Stars */
  const sg = new THREE.BufferGeometry();
  const sv = new Float32Array(9000);
  for (let i=0; i<9000; i+=3) {
    const t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1), r=55+Math.random()*15;
    sv[i]=r*Math.sin(p)*Math.cos(t); sv[i+1]=r*Math.cos(p); sv[i+2]=r*Math.sin(p)*Math.sin(t);
  }
  sg.setAttribute('position', new THREE.BufferAttribute(sv,3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xffffff,size:0.08,sizeAttenuation:true})));

  /* Earth */
  const eg = new THREE.SphereGeometry(EARTH_R,72,54);
  const su = new THREE.Vector3(8,4,6).normalize();
  earthMesh = new THREE.Mesh(eg, new THREE.ShaderMaterial({
    vertexShader: EARTH_VERT, fragmentShader: EARTH_FRAG,
    uniforms:{ uSun:{value:su} }
  }));
  scene.add(earthMesh);

  /* Atmosphere */
  atmosMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_R*1.03, 32, 24),
    new THREE.ShaderMaterial({
      vertexShader: EARTH_VERT, fragmentShader: ATMOS_FRAG,
      uniforms:{ uSun:{value:su} }, transparent:true, side:THREE.FrontSide,
      depthWrite:false, blending:THREE.AdditiveBlending
    })
  );
  scene.add(atmosMesh);

  /* User pin */
  userPin = new THREE.Mesh(
    new THREE.SphereGeometry(0.014,8,8),
    new THREE.MeshBasicMaterial({color:0xffea00})
  );
  scene.add(userPin);
  placeUserPin();

  /* Controls */
  orbitControls(canvas);

  /* Resize observer */
  new ResizeObserver(() => {
    const w2 = vp.clientWidth, h2 = vp.clientHeight;
    if (!w2||!h2) return;
    renderer.setSize(w2,h2);
    camera.aspect = w2/h2;
    camera.updateProjectionMatrix();
  }).observe(vp);

  /* Hover / click */
  satInteract(canvas);

  loop3D();
}

/* ------------------------------------------------------------------ */
/* ORBIT CONTROLS                                                      */
/* ------------------------------------------------------------------ */
function orbitControls(canvas) {
  const down = e => { orb.drag=true; orb.lx=e.clientX||e.touches?.[0]?.clientX||0; orb.ly=e.clientY||e.touches?.[0]?.clientY||0; };
  const up   = () => { orb.drag=false; };
  const move = e => {
    if(!orb.drag) return;
    const cx=e.clientX??(e.touches?.[0]?.clientX??0);
    const cy=e.clientY??(e.touches?.[0]?.clientY??0);
    orb.theta -= (cx-orb.lx)*0.006;
    orb.phi    = Math.max(0.08,Math.min(Math.PI-0.08, orb.phi+(cy-orb.ly)*0.006));
    orb.lx=cx; orb.ly=cy;
  };
  canvas.addEventListener('mousedown',down);
  canvas.addEventListener('touchstart',down,{passive:true});
  window.addEventListener('mouseup',up);
  window.addEventListener('touchend',up);
  window.addEventListener('mousemove',move);
  canvas.addEventListener('touchmove', e=>{ e.preventDefault(); move(e); },{passive:false});
  canvas.addEventListener('wheel', e=>{
    orb.targetR = Math.max(1.2, Math.min(15, orb.targetR + e.deltaY*0.003));
  },{passive:true});
  /* Pinch zoom */
  let pd=0;
  canvas.addEventListener('touchstart', e=>{ if(e.touches.length===2) pd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); },{passive:true});
  canvas.addEventListener('touchmove', e=>{
    if(e.touches.length===2){
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      orb.targetR=Math.max(1.2,Math.min(15,orb.targetR*(pd/d)));pd=d;
    }
  },{passive:false});
}

function moveCam() {
  orb.r += (orb.targetR - orb.r)*0.12;
  camera.position.set(
    orb.r*Math.sin(orb.phi)*Math.cos(orb.theta),
    orb.r*Math.cos(orb.phi),
    orb.r*Math.sin(orb.phi)*Math.sin(orb.theta)
  );
  camera.lookAt(0,0,0);
}

/* ------------------------------------------------------------------ */
/* SAT INTERACTION                                                     */
/* ------------------------------------------------------------------ */
const ray = new THREE.Raycaster();
const mp  = new THREE.Vector2();
let hovIdx = -1;

function satInteract(canvas) {
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mp.x = ((e.clientX-r.left)/r.width)*2-1;
    mp.y = -((e.clientY-r.top)/r.height)*2+1;
    doHover(e.clientX-r.left, e.clientY-r.top);
  });
  canvas.addEventListener('click', () => { if(hovIdx>=0) selectSat(hovIdx); });
}

function doHover(px,py) {
  if(!satPoints||!st.sats.length) return;
  ray.setFromCamera(mp, camera);
  let best=0.045, idx=-1;
  for(let i=0;i<st.sats.length;i++){
    const p=st.pos[i]; if(!p) continue;
    if(st.showOnlyVis&&!p.vis) continue;
    const d=ray.ray.distanceToPoint(new THREE.Vector3(p.x,p.y,p.z));
    if(d<best){best=d;idx=i;}
  }
  hovIdx=idx;
  const tip=document.getElementById('sgTip');
  if(!tip) return;
  if(idx>=0){
    const p=st.pos[idx];
    tip.style.display='block'; tip.style.left=(px+14)+'px'; tip.style.top=(py-10)+'px';
    tip.innerHTML=`<b>${st.sats[idx].name}</b><br>${p.altKm.toFixed(0)} км · El ${p.el.toFixed(1)}°`;
  } else { tip.style.display='none'; }
}

/* ------------------------------------------------------------------ */
/* LOAD CONSTELLATION                                                  */
/* ------------------------------------------------------------------ */
async function loadCons(id) {
  st.activeId=id; st.sats=[]; st.pos=[]; st.selIdx=-1;
  document.getElementById('sgInfo').innerHTML='';
  clearSatMesh(); clearTracks();
  const cons = getConstellationById(id);

  /* Auto camera distance based on orbit type */
  const orbitCamDist = (() => {
    if(!cons) return 4;
    if(cons.orbit.includes('GEO')) return 9.5;
    if(cons.orbit.includes('MEO') && cons.altKm>15000) return 7.5;
    if(cons.orbit.includes('MEO')) return 4.5;
    if(cons.altKm && cons.altKm < 1000) return 3.0;
    return 3.5;
  })();
  orb.targetR = orbitCamDist;

  setLoad(true,'Загружаю TLE…');
  const max = id==='starlink'||id==='oneweb'? 200 : 500;
  const tles = await loadTLE(id, max);
  setLoad(false);
  if(!tles.length){
    setLoad(true,'⚠ Нет данных'); setTimeout(()=>setLoad(false),3000); return;
  }

  for(const t of tles){
    try{ st.sats.push({name:t.name, satrec:twoline2satrec(t.tle1,t.tle2)}); }catch{}
  }
  propagateAll(st.simTime);
  buildSatPoints();
  drawOrbitRing(cons);
  updateStats();
  document.getElementById('sgOrbit').textContent =
    cons ? `${cons.orbit} ~${cons.altKm>=1000?(cons.altKm/1000).toFixed(0)+' тыс.':cons.altKm} км` : '–';
}

/* ------------------------------------------------------------------ */
/* PROPAGATION                                                         */
/* ------------------------------------------------------------------ */
function propagateAll(date) {
  const gst = gstime(date);
  st.pos = st.sats.map(s => {
    try {
      const pv = propagate(s.satrec, date);
      if(!pv.position||typeof pv.position.x!=='number') return null;
      const g   = eciToGeodetic(pv.position, gst);
      const lat = degreesLat(g.latitude);
      const lon = degreesLong(g.longitude);
      const alt = g.height;
      const {x,y,z} = ll2xyz(lat,lon,alt);
      const el  = elevAngle(st.userLat, st.userLon, lat, lon, alt);
      return {lat,lon,altKm:alt, x,y,z, vis:el>-3, el};
    } catch{ return null; }
  });
}

/* ------------------------------------------------------------------ */
/* SAT POINTS GEOMETRY                                                 */
/* ------------------------------------------------------------------ */
function buildSatPoints() {
  clearSatMesh();
  const n = st.sats.length;
  const pos = new Float32Array(n*3), col = new Float32Array(n*3), siz = new Float32Array(n);
  const c = new THREE.Color(getConstellationById(st.activeId)?.color||'#00e5ff');
  for(let i=0;i<n;i++){
    const p=st.pos[i];
    if(p){pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z;}
    col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
    siz[i]=5.5;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('col',new THREE.BufferAttribute(col,3));
  geo.setAttribute('size',new THREE.BufferAttribute(siz,1));
  satPoints=new THREE.Points(geo,new THREE.ShaderMaterial({
    vertexShader:SAT_VERT, fragmentShader:SAT_FRAG,
    transparent:true, vertexColors:false, depthWrite:false,
    blending:THREE.NormalBlending
  }));
  scene.add(satPoints);
}

function updateSatPoints() {
  if(!satPoints) return;
  const pos = satPoints.geometry.getAttribute('position');
  const col = satPoints.geometry.getAttribute('col');
  const siz = satPoints.geometry.getAttribute('size');
  const c   = new THREE.Color(getConstellationById(st.activeId)?.color||'#00e5ff');
  const dim = new THREE.Color(0x223344);
  for(let i=0;i<st.sats.length;i++){
    const p=st.pos[i];
    if(!p){pos.setXYZ(i,0,0,0);continue;}
    const hide=st.showOnlyVis&&!p.vis;
    pos.setXYZ(i,hide?0:p.x,hide?0:p.y,hide?0:p.z);
    const cc=p.vis?c:dim; col.setXYZ(i,cc.r,cc.g,cc.b);
    siz.setX(i,i===st.selIdx?10:5.5);
  }
  pos.needsUpdate=true; col.needsUpdate=true; siz.needsUpdate=true;
}

function clearSatMesh(){
  if(satPoints){scene.remove(satPoints);satPoints.geometry.dispose();satPoints=null;}
  if(selMesh){scene.remove(selMesh);selMesh=null;}
  if(orbitRing){scene.remove(orbitRing);orbitRing=null;}
}

/* ------------------------------------------------------------------ */
/* ORBIT RING                                                          */
/* ------------------------------------------------------------------ */
function drawOrbitRing(cons) {
  if(!cons||cons.orbit.includes('GEO')) return; // GEO satellites draw their own ring
  const r = EARTH_R + cons.altKm * TO3D;
  const pts=[];
  for(let i=0;i<=128;i++){const a=i/128*Math.PI*2; pts.push(new THREE.Vector3(r*Math.cos(a),0,r*Math.sin(a)));}
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  const mat=new THREE.LineBasicMaterial({color:new THREE.Color(cons.color), transparent:true, opacity:0.15});
  orbitRing=new THREE.Line(geo,mat);
  orbitRing.rotation.x=cons.inclinationDeg*Math.PI/180;
  scene.add(orbitRing);
}

/* ------------------------------------------------------------------ */
/* SELECT SATELLITE                                                    */
/* ------------------------------------------------------------------ */
function selectSat(idx) {
  st.selIdx=idx;
  renderInfo(idx);
  // Glowing sphere at satellite
  if(selMesh) scene.remove(selMesh);
  const p=st.pos[idx];
  if(p){
    selMesh=new THREE.Mesh(
      new THREE.SphereGeometry(0.02,12,12),
      new THREE.MeshBasicMaterial({color:new THREE.Color(getConstellationById(st.activeId)?.color||'#fff'),transparent:true,opacity:0.9})
    );
    selMesh.position.set(p.x,p.y,p.z); scene.add(selMesh);
    if(st.showTracks) drawTrack(st.sats[idx].satrec);
  }
  addXP(3);
}

/* ------------------------------------------------------------------ */
/* GROUND TRACK                                                        */
/* ------------------------------------------------------------------ */
function drawTrack(satrec) {
  clearTracks();
  const pts=[];
  let lastP=null;
  for(let i=-8;i<=92;i++){
    const t=new Date(st.simTime.getTime()+i*60000);
    try{
      const pv=propagate(satrec,t);
      if(!pv.position||typeof pv.position.x!=='number') continue;
      const g=eciToGeodetic(pv.position,gstime(t));
      const lat=degreesLat(g.latitude),lon=degreesLong(g.longitude),alt=g.height;
      const p=ll2xyz(lat,lon,alt*0.15+8); // slightly above surface
      if(lastP&&Math.abs(lon-lastP.lon)<160){
        const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(lastP.x,lastP.y,lastP.z),new THREE.Vector3(p.x,p.y,p.z)]);
        const mat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.3});
        const l=new THREE.Line(geo,mat); scene.add(l); trackLines.push(l);
      }
      lastP={x:p.x,y:p.y,z:p.z,lon};
    }catch{lastP=null;}
  }
}

function clearTracks(){trackLines.forEach(l=>{scene.remove(l);l.geometry.dispose();});trackLines=[];}

/* ------------------------------------------------------------------ */
/* SIGNAL LINE (user → satellite)                                     */
/* ------------------------------------------------------------------ */
function drawSignal(idx) {
  sigLines.forEach(l=>{scene.remove(l);l.geometry.dispose();}); sigLines=[];
  const p=st.pos[idx]; if(!p) return;
  const up=ll2xyz(st.userLat,st.userLon,5);
  const sp=new THREE.Vector3(p.x,p.y,p.z);
  const mid=new THREE.Vector3((up.x+sp.x)/2*1.12,(up.y+sp.y)/2*1.12,(up.z+sp.z)/2*1.12);
  const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(up.x,up.y,up.z),mid,sp);
  const pts=curve.getPoints(48);
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  const mat=new THREE.LineBasicMaterial({color:new THREE.Color(getConstellationById(st.activeId)?.color||'#0f0'),transparent:true,opacity:0.85,linewidth:2});
  const l=new THREE.Line(geo,mat); scene.add(l); sigLines.push(l);
}

/* ------------------------------------------------------------------ */
/* INFO PANEL                                                          */
/* ------------------------------------------------------------------ */
function renderInfo(idx) {
  const sat=st.sats[idx], p=st.pos[idx], cons=getConstellationById(st.activeId);
  const el=document.getElementById('sgInfo'); if(!el||!sat||!p) return;
  const ec=p.el>25?'#2ecc71':p.el>10?'#f1c40f':p.el>0?'#e67e22':'#e74c3c';
  const vel=(7.91*Math.sqrt(EARTH_R_KM/(EARTH_R_KM+p.altKm))).toFixed(2);
  const dist=p.altKm/Math.max(Math.sin(Math.max(p.el,1)*Math.PI/180),0.02);
  const rtt=((dist/299792)*1000*2).toFixed(0);
  el.innerHTML=`
    <div class="sg-info-card">
      <div class="sg-info-head">
        <span class="sg-info-dot" style="background:${cons?.color}"></span>
        <b>${sat.name}</b>
        <button class="sg-info-x" id="sgInfoClose">✕</button>
      </div>
      <div class="sg-info-grid">
        <span>Высота</span><b>${p.altKm.toFixed(0)} км</b>
        <span>Скорость</span><b>~${vel} км/с</b>
        <span>Lat / Lon</span><b>${p.lat.toFixed(1)}° / ${p.lon.toFixed(1)}°</b>
        <span>Угол возвышения</span><b style="color:${ec}">${p.el.toFixed(1)}°</b>
        <span>Дальность</span><b>${dist.toFixed(0)} км</b>
        <span>RTT ~</span><b>${rtt} мс</b>
        <span>Орбита</span><b>${cons?.orbit}</b>
        <span>Наклонение</span><b>${cons?.inclinationDeg}°</b>
      </div>
      <div class="sg-info-bands">${cons?.bandList.map(b=>`<span>${b}</span>`).join('')}</div>
      <div class="sg-info-how">${cons?.howItWorks}</div>
      <div class="sg-info-spec">
        <span>↑ ${cons?.commSpec.uplink||'–'}</span>
        <span>↓ ${cons?.commSpec.downlink}</span>
        <span>${cons?.commSpec.modulation}</span>
        <span>⏱ ${cons?.commSpec.latency}</span>
      </div>
      <button class="sg-sig-btn" id="sgSigBtn">📡 Показать сигнальный путь</button>
    </div>`;
  el.querySelector('#sgInfoClose').onclick=()=>{el.innerHTML='';st.selIdx=-1;if(selMesh){scene.remove(selMesh);selMesh=null;}clearTracks();sigLines.forEach(l=>{scene.remove(l);l.geometry.dispose();});sigLines=[];};
  el.querySelector('#sgSigBtn').onclick=()=>drawSignal(idx);
}

/* ------------------------------------------------------------------ */
/* 3D RENDER LOOP                                                      */
/* ------------------------------------------------------------------ */
let fc=0;
function loop3D() {
  animId=requestAnimationFrame(loop3D);
  if(st.mode!=='3d'||!renderer) return;
  if(!st.paused){
    const now=Date.now();
    st.simTime=new Date(st.simTime.getTime()+(now-st.lastTick)*st.simSpeed);
    st.lastTick=now;
  }
  if(fc++%3===0&&st.sats.length){propagateAll(st.simTime);updateSatPoints();}
  if(selMesh&&st.selIdx>=0){
    const p=st.pos[st.selIdx];if(p)selMesh.position.set(p.x,p.y,p.z);
    selMesh.material.opacity=0.7+0.3*Math.sin(Date.now()/400);
  }
  /* Sun */
  const sa=(st.simTime.getTime()/(24*3600000))*Math.PI*2;
  const su=new THREE.Vector3(Math.cos(sa),0.3,Math.sin(sa)).normalize();
  earthMesh.material.uniforms.uSun.value.copy(su);
  atmosMesh.material.uniforms.uSun.value.copy(su);
  moveCam();
  if(fc%30===0){
    const cl=document.getElementById('sgClock');
    if(cl) cl.textContent=st.simTime.toUTCString().replace(' GMT','').slice(5,25)+' UTC';
    updateStats();
  }
  renderer.render(scene,camera);
}

/* ------------------------------------------------------------------ */
/* 2D MODE                                                             */
/* ------------------------------------------------------------------ */
let ctx2=null, anim2=null;

function setMode(m) {
  st.mode=m;
  const c3=document.getElementById('sgCanvas3d');
  const c2=document.getElementById('sgCanvas2d');
  const b3=document.getElementById('sgBtn3d');
  const b2=document.getElementById('sgBtn2d');
  b3.classList.toggle('sg-mode-btn--on',m==='3d');
  b2.classList.toggle('sg-mode-btn--on',m==='2d');
  c3.style.display=m==='3d'?'block':'none';
  c2.style.display=m==='2d'?'block':'none';
  if(m==='2d'){
    const vp=c2.parentElement;
    c2.width=vp.clientWidth; c2.height=vp.clientHeight;
    ctx2=c2.getContext('2d');
    c2.onclick=e=>{const r=c2.getBoundingClientRect();click2d(e.clientX-r.left,e.clientY-r.top);};
    if(!anim2) loop2D();
  }
}

function loop2D() {
  anim2=requestAnimationFrame(loop2D);
  if(st.mode!=='2d'||!ctx2) return;
  if(!st.paused){
    const now=Date.now();
    st.simTime=new Date(st.simTime.getTime()+(now-st.lastTick)*st.simSpeed);
    st.lastTick=now;
  }
  if(fc++%3===0&&st.sats.length) propagateAll(st.simTime);
  draw2D();
}

function draw2D() {
  const W=ctx2.canvas.width, H=ctx2.canvas.height;
  const cons=getConstellationById(st.activeId);

  /* background */
  ctx2.fillStyle='#020915'; ctx2.fillRect(0,0,W,H);

  /* grid */
  ctx2.strokeStyle='rgba(52,152,219,0.1)'; ctx2.lineWidth=1;
  for(let lat=-60;lat<=60;lat+=30){ const y=l2y(lat,H); ctx2.beginPath();ctx2.moveTo(0,y);ctx2.lineTo(W,y);ctx2.stroke(); }
  for(let lon=-180;lon<=180;lon+=30){ const x=n2x(lon,W); ctx2.beginPath();ctx2.moveTo(x,0);ctx2.lineTo(x,H);ctx2.stroke(); }

  /* equator & prime meridian */
  ctx2.strokeStyle='rgba(52,152,219,0.35)'; ctx2.lineWidth=1;
  ctx2.beginPath();ctx2.moveTo(0,l2y(0,H));ctx2.lineTo(W,l2y(0,H));ctx2.stroke();
  ctx2.beginPath();ctx2.moveTo(n2x(0,W),0);ctx2.lineTo(n2x(0,W),H);ctx2.stroke();

  /* grid labels */
  ctx2.fillStyle='rgba(100,160,220,0.45)'; ctx2.font='9px monospace'; ctx2.textAlign='left';
  for(let lat=-60;lat<=60;lat+=30) if(lat!==0) ctx2.fillText(lat+'°',3,l2y(lat,H)-2);
  for(let lon=-150;lon<=180;lon+=30) if(lon!==0) ctx2.fillText(lon+'°',n2x(lon,W)+2,H-3);

  /* WORLD COASTLINES (real data) */
  ctx2.strokeStyle='rgba(80,160,100,0.65)'; ctx2.lineWidth=1;
  for(const seg of WORLD_COASTLINES) {
    if(seg.length<2) continue;
    ctx2.beginPath();
    let jump=false;
    for(let i=0;i<seg.length;i++){
      const x=n2x(seg[i][0],W), y=l2y(seg[i][1],H);
      if(i===0||jump){ ctx2.moveTo(x,y); jump=false; }
      else {
        // Detect anti-meridian wrap
        const px=n2x(seg[i-1][0],W);
        if(Math.abs(x-px)>W*0.55){ ctx2.moveTo(x,y); }
        else ctx2.lineTo(x,y);
      }
    }
    ctx2.stroke();
  }

  /* Coverage footprints */
  if(st.showCoverage&&cons){
    const elMin=5;
    const footprintDeg=Math.acos(EARTH_R_KM/(EARTH_R_KM+cons.altKm))*180/Math.PI - elMin;
    const fpPx=(footprintDeg/180)*H;
    ctx2.globalAlpha=0.06;
    for(let i=0;i<st.sats.length;i+=Math.max(1,Math.floor(st.sats.length/15))){
      const p=st.pos[i]; if(!p||!p.vis) continue;
      const grd=ctx2.createRadialGradient(n2x(p.lon,W),l2y(p.lat,H),0,n2x(p.lon,W),l2y(p.lat,H),fpPx);
      grd.addColorStop(0,cons.color); grd.addColorStop(1,'transparent');
      ctx2.fillStyle=grd;
      ctx2.beginPath();ctx2.arc(n2x(p.lon,W),l2y(p.lat,H),fpPx,0,Math.PI*2);ctx2.fill();
    }
    ctx2.globalAlpha=1;
  }

  /* Ground track of selected sat */
  if(st.showTracks&&st.selIdx>=0) draw2dTrack(st.sats[st.selIdx].satrec, W, H);

  /* Satellites */
  for(let i=0;i<st.sats.length;i++){
    const p=st.pos[i]; if(!p) continue;
    if(st.showOnlyVis&&!p.vis) continue;
    const x=n2x(p.lon,W), y=l2y(p.lat,H);
    const sel=i===st.selIdx;
    ctx2.globalAlpha=p.vis?1:0.25;
    if(sel){
      ctx2.fillStyle='#ffffff';
      ctx2.beginPath();ctx2.arc(x,y,6,0,Math.PI*2);ctx2.fill();
      // glow
      const g=ctx2.createRadialGradient(x,y,0,x,y,14);
      g.addColorStop(0,'rgba(255,255,255,0.4)');g.addColorStop(1,'transparent');
      ctx2.fillStyle=g;ctx2.beginPath();ctx2.arc(x,y,14,0,Math.PI*2);ctx2.fill();
    } else {
      ctx2.fillStyle=cons?.color||'#00e5ff';
      ctx2.beginPath();ctx2.arc(x,y,2.5,0,Math.PI*2);ctx2.fill();
    }
    ctx2.globalAlpha=1;
  }

  /* User pin */
  const ux=n2x(st.userLon,W),uy=l2y(st.userLat,H);
  ctx2.fillStyle='#ffea00';
  ctx2.beginPath();ctx2.arc(ux,uy,5,0,Math.PI*2);ctx2.fill();
  ctx2.strokeStyle='rgba(255,234,0,0.5)'; ctx2.lineWidth=2;
  ctx2.beginPath();ctx2.arc(ux,uy,11,0,Math.PI*2);ctx2.stroke();

  /* HUD */
  ctx2.fillStyle=cons?.color||'#00e5ff'; ctx2.font='bold 12px monospace'; ctx2.textAlign='left';
  ctx2.fillText(`${cons?.icon||''} ${cons?.name||st.activeId}`, 10, 20);
  ctx2.fillStyle='rgba(180,210,255,0.5)'; ctx2.font='10px monospace';
  ctx2.fillText(`${st.sats.length} спут · ${st.pos.filter(p=>p?.vis).length} видимых`, 10, 35);
  ctx2.fillStyle='rgba(100,160,220,0.7)'; ctx2.textAlign='right';
  ctx2.fillText(st.simTime.toUTCString().replace(' GMT','').slice(4,22)+' UTC', W-8, 15);
}

function draw2dTrack(satrec, W, H) {
  ctx2.strokeStyle='rgba(255,255,255,0.45)'; ctx2.lineWidth=1.5; ctx2.setLineDash([5,3]);
  let lastX=null,lastY=null,lastLon=null;
  for(let i=-5;i<=95;i++){
    const t=new Date(st.simTime.getTime()+i*60000);
    try{
      const pv=propagate(satrec,t); if(!pv.position||typeof pv.position.x!=='number') continue;
      const g=eciToGeodetic(pv.position,gstime(t));
      const lat=degreesLat(g.latitude),lon=degreesLong(g.longitude);
      const x=n2x(lon,W),y=l2y(lat,H);
      if(lastX!==null&&Math.abs(lon-lastLon)<160){
        ctx2.beginPath();ctx2.moveTo(lastX,lastY);ctx2.lineTo(x,y);ctx2.stroke();
      }
      lastX=x;lastY=y;lastLon=lon;
    }catch{lastX=null;}
  }
  ctx2.setLineDash([]);
}

function click2d(px,py) {
  const W=ctx2.canvas.width,H=ctx2.canvas.height;
  for(let i=0;i<st.sats.length;i++){
    const p=st.pos[i]; if(!p) continue;
    if(Math.hypot(px-n2x(p.lon,W),py-l2y(p.lat,H))<10){ selectSat(i); return; }
  }
}

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */
function ll2xyz(lat, lon, altKm) {
  const r = EARTH_R + altKm * TO3D;
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return {
    x: -r * Math.sin(phi) * Math.cos(theta),
    y:  r * Math.cos(phi),
    z:  r * Math.sin(phi) * Math.sin(theta)
  };
}

function placeUserPin() {
  if(!userPin) return;
  const p=ll2xyz(st.userLat,st.userLon,8);
  userPin.position.set(p.x,p.y,p.z);
  userPin.lookAt(0,0,0); userPin.rotateX(Math.PI/2);
}

function elevAngle(ulat, ulon, slat, slon, saltKm) {
  const a=(ulat*Math.PI/180),b=(slat*Math.PI/180),dl=(slon-ulon)*Math.PI/180;
  const ca=Math.cos(a)*Math.cos(b)*Math.cos(dl)+Math.sin(a)*Math.sin(b);
  const ang=Math.acos(Math.max(-1,Math.min(1,ca)));
  return Math.atan2(Math.cos(ang)-EARTH_R_KM/(EARTH_R_KM+saltKm), Math.sin(ang))*180/Math.PI;
}

function l2y(lat,H){ return H/2-(lat/90)*(H/2.15); }
function n2x(lon,W){ return (lon+180)/360*W; }
function updateStats(){
  const t=document.getElementById('sgTotal'),v=document.getElementById('sgVis');
  if(t)t.textContent=st.sats.length;
  if(v)v.textContent=st.pos.filter(p=>p?.vis).length;
}
function setLoad(show,txt){
  const l=document.getElementById('sgLoad'); if(!l) return;
  l.style.display=show?'flex':'none';
  if(txt){const t=document.getElementById('sgLoadTxt');if(t)t.textContent=txt;}
}
