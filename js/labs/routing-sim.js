import { addXP } from '../core/gamification.js';

/* ============================================================
   Routing Simulator — RIP, OSPF, BGP protocol visualization
   ============================================================ */

const INF = 16; // RIP infinity

// ---- Topology ----
const NODES = [
  { id: 'R1', x: 80, y: 60, ip: '10.0.1.1', as: 1 },
  { id: 'R2', x: 240, y: 40, ip: '10.0.2.1', as: 1 },
  { id: 'R3', x: 400, y: 60, ip: '10.0.3.1', as: 2 },
  { id: 'R4', x: 160, y: 170, ip: '10.0.4.1', as: 2 },
  { id: 'R5', x: 320, y: 170, ip: '10.0.5.1', as: 2 },
  { id: 'R6', x: 80, y: 280, ip: '10.0.6.1', as: 3 },
  { id: 'R7', x: 400, y: 280, ip: '10.0.7.1', as: 3 }
];

const EDGES = [
  { from: 'R1', to: 'R2', cost: 1, bw: 100 },
  { from: 'R2', to: 'R3', cost: 3, bw: 10 },
  { from: 'R1', to: 'R4', cost: 2, bw: 50 },
  { from: 'R2', to: 'R5', cost: 2, bw: 50 },
  { from: 'R3', to: 'R5', cost: 1, bw: 100 },
  { from: 'R4', to: 'R5', cost: 1, bw: 100 },
  { from: 'R4', to: 'R6', cost: 3, bw: 10 },
  { from: 'R5', to: 'R7', cost: 2, bw: 50 },
  { from: 'R6', to: 'R7', cost: 4, bw: 10 }
];

const PROTO_INFO = {
  RIP: `<b>RIP (Routing Information Protocol)</b> — дистанционно-векторный протокол. Каждый маршрутизатор хранит вектор расстояний до всех сетей. Каждые 30 сек таблицы обмениваются с соседями (алгоритм Беллмана-Форда). Метрика — число хопов (макс. 15). <em>Проблема: count-to-infinity</em> — при обрыве связи маршрутизаторы могут долго «раскручивать» метрику до бесконечности. Split Horizon частично решает это.`,
  OSPF: `<b>OSPF (Open Shortest Path First)</b> — протокол состояния каналов. Каждый маршрутизатор рассылает LSA (Link State Advertisement) и строит полную карту сети (LSDB). Затем алгоритм Дейкстры вычисляет кратчайшие пути от выбранного корня. Метрика — стоимость = ref_bw / bw. Быстрая конвергенция, нет count-to-infinity.`,
  BGP: `<b>BGP (Border Gateway Protocol)</b> — протокол вектора путей между автономными системами (AS). eBGP работает между AS, iBGP — внутри. Каждый маршрут содержит AS_PATH — список AS, через которые он прошёл. Маршрут с коротким AS_PATH предпочтительнее. Петли обнаруживаются по наличию своей AS в пути.`
};

const AS_COLORS = { 1: '#3498db', 2: '#2ecc71', 3: '#e67e22' };

let state = null;

function initState(protocol) {
  const nodes = JSON.parse(JSON.stringify(NODES));
  const edges = JSON.parse(JSON.stringify(EDGES));
  return {
    protocol, nodes, edges,
    step: 0, running: false, timer: null, speed: 500,
    selectedRouter: 'R1', brokenEdges: new Set(),
    splitHorizon: false, completed: false,
    tables: {}, lsdb: {}, spfTree: null, bgpRoutes: {},
    packets: [], animPackets: []
  };
}

// ---- Graph helpers ----
function neighbors(nodeId, st) {
  const res = [];
  st.edges.forEach(e => {
    if (st.brokenEdges.has(e.from + '-' + e.to)) return;
    if (e.from === nodeId) res.push({ id: e.to, cost: e.cost, bw: e.bw });
    else if (e.to === nodeId) res.push({ id: e.from, cost: e.cost, bw: e.bw });
  });
  return res;
}

// ==================== RIP ====================
function ripInit(st) {
  st.tables = {};
  st.nodes.forEach(n => {
    const t = {};
    st.nodes.forEach(m => { t[m.id] = { cost: n.id === m.id ? 0 : INF, next: '-', changed: n.id === m.id ? 'new' : '' }; });
    // direct neighbors
    neighbors(n.id, st).forEach(nb => { t[nb.id] = { cost: nb.cost, next: nb.id, changed: 'new' }; });
    st.tables[n.id] = t;
  });
}

function ripStep(st) {
  let changed = false;
  const prev = JSON.parse(JSON.stringify(st.tables));
  st.nodes.forEach(n => {
    neighbors(n.id, st).forEach(nb => {
      const nbTable = prev[nb.id];
      if (!nbTable) return;
      Object.keys(nbTable).forEach(dest => {
        if (dest === n.id) return;
        if (st.splitHorizon && nbTable[dest].next === n.id) return; // split horizon
        const newCost = Math.min(nbTable[dest].cost + neighbors(n.id, st).find(x => x.id === nb.id).cost, INF);
        if (newCost < st.tables[n.id][dest].cost) {
          st.tables[n.id][dest] = { cost: newCost, next: nb.id, changed: 'updated' };
          changed = true;
          st.animPackets.push({ from: nb.id, to: n.id, color: '#f39c12', label: 'DV' });
        } else {
          if (st.tables[n.id][dest].changed) st.tables[n.id][dest].changed = '';
        }
      });
    });
  });
  if (!changed) {
    st.nodes.forEach(n => Object.values(st.tables[n.id]).forEach(r => { r.changed = ''; }));
  }
  return changed;
}

// ==================== OSPF ====================
function ospfCost(bw) { return Math.round(1000 / bw); } // ref = 1000 Mbps

function ospfInit(st) {
  st.lsdb = {};
  st.nodes.forEach(n => {
    st.lsdb[n.id] = neighbors(n.id, st).map(nb => ({ id: nb.id, cost: ospfCost(nb.bw) }));
  });
  st.spfTree = null;
  st.tables = {};
}

function ospfFloodStep(st) {
  // simulate LSA flooding wave from each router — one step = one flood round
  const packets = [];
  st.nodes.forEach(n => {
    neighbors(n.id, st).forEach(nb => {
      packets.push({ from: n.id, to: nb.id, color: '#2ecc71', label: 'LSA' });
    });
  });
  st.animPackets = packets;
  // rebuild LSDB after flood
  st.lsdb = {};
  st.nodes.forEach(n => {
    st.lsdb[n.id] = neighbors(n.id, st).map(nb => ({ id: nb.id, cost: ospfCost(nb.bw) }));
  });
}

function dijkstra(root, st) {
  const dist = {}, prev = {}, visited = new Set(), tree = [];
  st.nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
  dist[root] = 0;
  const steps = [];
  for (let i = 0; i < st.nodes.length; i++) {
    let u = null;
    st.nodes.forEach(n => { if (!visited.has(n.id) && (u === null || dist[n.id] < dist[u])) u = n.id; });
    if (u === null || dist[u] === Infinity) break;
    visited.add(u);
    steps.push({ node: u, dist: dist[u] });
    (st.lsdb[u] || []).forEach(nb => {
      if (st.brokenEdges.has(u + '-' + nb.id) || st.brokenEdges.has(nb.id + '-' + u)) return;
      const alt = dist[u] + nb.cost;
      if (alt < dist[nb.id]) { dist[nb.id] = alt; prev[nb.id] = u; }
    });
  }
  // build tree edges
  st.nodes.forEach(n => { if (prev[n.id]) tree.push({ from: prev[n.id], to: n.id }); });
  // build routing table
  const table = {};
  st.nodes.forEach(n => {
    if (n.id === root) { table[n.id] = { cost: 0, next: '-', changed: '' }; return; }
    let hop = n.id;
    while (prev[hop] && prev[hop] !== root) hop = prev[hop];
    table[n.id] = { cost: dist[n.id] === Infinity ? INF : dist[n.id], next: prev[n.id] ? hop : '-', changed: dist[n.id] < Infinity ? 'new' : '' };
  });
  return { dist, prev, tree, steps, table };
}

function ospfBuildSPF(st) {
  const result = dijkstra(st.selectedRouter, st);
  st.spfTree = result;
  st.tables[st.selectedRouter] = result.table;
}

// ==================== BGP ====================
function bgpInit(st) {
  st.bgpRoutes = {};
  st.nodes.forEach(n => {
    st.bgpRoutes[n.id] = {};
    // each router knows its own prefix
    st.bgpRoutes[n.id][n.id] = { asPath: [n.as], nextHop: '-', changed: 'new' };
  });
}

function bgpStep(st) {
  let changed = false;
  const prev = JSON.parse(JSON.stringify(st.bgpRoutes));
  st.nodes.forEach(n => {
    neighbors(n.id, st).forEach(nb => {
      const nNode = st.nodes.find(x => x.id === n.id);
      const nbNode = st.nodes.find(x => x.id === nb.id);
      const isEBGP = nNode.as !== nbNode.as;
      Object.entries(prev[nb.id] || {}).forEach(([dest, route]) => {
        if (dest === n.id) return;
        // loop detection
        if (route.asPath.includes(nNode.as)) return;
        const newPath = isEBGP ? [nNode.as, ...route.asPath] : [...route.asPath];
        const existing = st.bgpRoutes[n.id][dest];
        if (!existing || newPath.length < existing.asPath.length) {
          st.bgpRoutes[n.id][dest] = { asPath: newPath, nextHop: nb.id, changed: existing ? 'updated' : 'new' };
          changed = true;
          st.animPackets.push({ from: nb.id, to: n.id, color: isEBGP ? '#e74c3c' : '#9b59b6', label: isEBGP ? 'eBGP' : 'iBGP' });
        } else if (existing.changed) {
          existing.changed = '';
        }
      });
    });
  });
  if (!changed) {
    st.nodes.forEach(n => Object.values(st.bgpRoutes[n.id]).forEach(r => { r.changed = ''; }));
  }
  return changed;
}

// ==================== SVG Rendering ====================
function nodePos(id) { return state.nodes.find(n => n.id === id); }

function renderSVG(container) {
  const st = state;
  const W = 500, H = 340;
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="rs-svg" xmlns="http://www.w3.org/2000/svg">`;
  // AS backgrounds for BGP
  if (st.protocol === 'BGP') {
    const asBounds = {};
    st.nodes.forEach(n => {
      if (!asBounds[n.as]) asBounds[n.as] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
      const b = asBounds[n.as];
      b.minX = Math.min(b.minX, n.x); b.minY = Math.min(b.minY, n.y);
      b.maxX = Math.max(b.maxX, n.x); b.maxY = Math.max(b.maxY, n.y);
    });
    Object.entries(asBounds).forEach(([as, b]) => {
      const pad = 40;
      svg += `<rect x="${b.minX - pad}" y="${b.minY - pad}" width="${b.maxX - b.minX + pad * 2}" height="${b.maxY - b.minY + pad * 2}" rx="12" fill="${AS_COLORS[as]}15" stroke="${AS_COLORS[as]}" stroke-width="1.5" stroke-dasharray="6,3"/>`;
      svg += `<text x="${b.minX - pad + 6}" y="${b.minY - pad + 14}" fill="${AS_COLORS[as]}" font-size="11" font-weight="700">AS ${as}</text>`;
    });
  }
  // edges
  st.edges.forEach(e => {
    const a = nodePos(e.from), b = nodePos(e.to);
    const broken = st.brokenEdges.has(e.from + '-' + e.to);
    const isSpfEdge = st.spfTree && st.spfTree.tree.some(t => (t.from === e.from && t.to === e.to) || (t.from === e.to && t.to === e.from));
    const stroke = broken ? '#555' : isSpfEdge ? '#f1c40f' : '#667';
    const sw = isSpfEdge ? 3 : 1.5;
    const dash = broken ? 'stroke-dasharray="4,4"' : '';
    svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${stroke}" stroke-width="${sw}" ${dash} class="rs-edge" data-edge="${e.from}-${e.to}" style="cursor:pointer"/>`;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const label = st.protocol === 'OSPF' ? ospfCost(e.bw) : e.cost;
    svg += `<text x="${mx}" y="${my - 6}" fill="var(--text-secondary)" font-size="9" text-anchor="middle">${broken ? 'X' : label}</text>`;
  });
  // animated packets
  st.animPackets.forEach((p, i) => {
    const a = nodePos(p.from), b = nodePos(p.to);
    const t = 0.5; // midway
    const cx = a.x + (b.x - a.x) * t, cy = a.y + (b.y - a.y) * t;
    svg += `<circle cx="${cx}" cy="${cy}" r="5" fill="${p.color}" opacity="0.9"><animate attributeName="cx" from="${a.x}" to="${b.x}" dur="0.4s" fill="freeze"/><animate attributeName="cy" from="${a.y}" to="${b.y}" dur="0.4s" fill="freeze"/></circle>`;
    svg += `<text x="${cx}" y="${cy - 8}" fill="${p.color}" font-size="7" text-anchor="middle">${p.label}</text>`;
  });
  // nodes
  st.nodes.forEach(n => {
    const sel = n.id === st.selectedRouter;
    const fill = st.protocol === 'BGP' ? (AS_COLORS[n.as] || '#667') : (sel ? '#f1c40f' : '#3498db');
    svg += `<circle cx="${n.x}" cy="${n.y}" r="${sel ? 22 : 18}" fill="${fill}" opacity="${sel ? 1 : 0.85}" stroke="${sel ? '#fff' : 'none'}" stroke-width="2" class="rs-node" data-node="${n.id}" style="cursor:pointer"/>`;
    svg += `<text x="${n.x}" y="${n.y + 4}" fill="#fff" font-size="11" font-weight="700" text-anchor="middle" pointer-events="none">${n.id}</text>`;
    svg += `<text x="${n.x}" y="${n.y + 32}" fill="var(--text-secondary)" font-size="8" text-anchor="middle" pointer-events="none">${n.ip}</text>`;
  });
  svg += '</svg>';
  container.innerHTML = svg;
  // click handlers
  container.querySelectorAll('.rs-node').forEach(el => {
    el.addEventListener('click', () => { state.selectedRouter = el.dataset.node; render(); });
  });
  container.querySelectorAll('.rs-edge').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.edge;
      if (state.brokenEdges.has(key)) state.brokenEdges.delete(key);
      else state.brokenEdges.add(key);
      resetProtocol(); render();
    });
  });
}

function renderTable(container) {
  const st = state;
  const rid = st.selectedRouter;
  let html = `<div class="rs-table-title">Таблица маршрутизации: ${rid}</div>`;
  if (st.protocol === 'BGP') {
    html += '<table class="rs-table"><tr><th>Назначение</th><th>Next Hop</th><th>AS_PATH</th></tr>';
    const routes = st.bgpRoutes[rid] || {};
    Object.entries(routes).forEach(([dest, r]) => {
      const cls = r.changed === 'new' ? 'rs-new' : r.changed === 'updated' ? 'rs-upd' : '';
      html += `<tr class="${cls}"><td>${dest}</td><td>${r.nextHop}</td><td>[${r.asPath.join(', ')}]</td></tr>`;
    });
    html += '</table>';
  } else {
    const table = st.tables[rid];
    html += '<table class="rs-table"><tr><th>Назначение</th><th>Next Hop</th><th>Метрика</th></tr>';
    if (table) {
      Object.entries(table).forEach(([dest, r]) => {
        const cls = r.changed === 'new' ? 'rs-new' : r.changed === 'updated' ? 'rs-upd' : '';
        const metric = r.cost >= INF ? '∞' : r.cost;
        html += `<tr class="${cls}"><td>${dest}</td><td>${r.next}</td><td>${metric}</td></tr>`;
      });
    }
    html += '</table>';
  }
  container.innerHTML = html;
}

function render() {
  const res = document.getElementById('labResult-routingSim');
  if (!res) return;
  const st = state;
  // build full UI
  let html = `<div class="rs-info">${PROTO_INFO[st.protocol]}</div>`;
  html += '<div class="rs-controls">';
  html += `<button class="rs-btn" id="rsPlay">${st.running ? '⏸ Пауза' : '▶ Старт'}</button>`;
  html += '<button class="rs-btn" id="rsStep">⏭ Шаг</button>';
  html += '<button class="rs-btn" id="rsReset">↺ Сброс</button>';
  if (st.protocol === 'RIP') {
    html += `<label class="rs-check"><input type="checkbox" id="rsSplitH" ${st.splitHorizon ? 'checked' : ''}> Split Horizon</label>`;
  }
  html += `<span class="rs-step">Шаг: ${st.step}</span>`;
  html += '</div>';
  html += '<div class="rs-hint">Нажмите на маршрутизатор — увидите его таблицу. Нажмите на линию — обрыв/восстановление связи.</div>';
  html += '<div id="rsSvgArea"></div>';
  html += '<div id="rsTableArea"></div>';
  html += '<div class="rs-legend">';
  if (st.protocol === 'OSPF') {
    html += '<span class="rs-leg"><span class="rs-dot" style="background:#f1c40f"></span> SPF-дерево</span>';
    html += '<span class="rs-leg"><span class="rs-dot" style="background:#2ecc71"></span> LSA</span>';
  } else if (st.protocol === 'RIP') {
    html += '<span class="rs-leg"><span class="rs-dot" style="background:#f39c12"></span> Обмен DV</span>';
  } else {
    html += '<span class="rs-leg"><span class="rs-dot" style="background:#e74c3c"></span> eBGP</span>';
    html += '<span class="rs-leg"><span class="rs-dot" style="background:#9b59b6"></span> iBGP</span>';
  }
  html += '<span class="rs-leg"><span class="rs-dot" style="background:#555"></span> Обрыв</span>';
  html += '</div>';
  if (st.completed) html += '<div class="rs-done">Конвергенция достигнута!</div>';
  res.innerHTML = html;

  renderSVG(document.getElementById('rsSvgArea'));
  renderTable(document.getElementById('rsTableArea'));

  // wire controls
  document.getElementById('rsPlay')?.addEventListener('click', togglePlay);
  document.getElementById('rsStep')?.addEventListener('click', doStep);
  document.getElementById('rsReset')?.addEventListener('click', () => { resetProtocol(); render(); });
  document.getElementById('rsSplitH')?.addEventListener('change', e => { state.splitHorizon = e.target.checked; resetProtocol(); render(); });
}

function resetProtocol() {
  stopTimer();
  state.step = 0; state.completed = false; state.animPackets = [];
  if (state.protocol === 'RIP') ripInit(state);
  else if (state.protocol === 'OSPF') { ospfInit(state); ospfBuildSPF(state); }
  else bgpInit(state);
}

function doStep() {
  if (state.completed) return;
  state.animPackets = [];
  state.step++;
  let converged = false;
  if (state.protocol === 'RIP') {
    converged = !ripStep(state);
  } else if (state.protocol === 'OSPF') {
    if (state.step === 1) { ospfFloodStep(state); }
    else { ospfBuildSPF(state); converged = true; }
  } else {
    converged = !bgpStep(state);
  }
  if (converged && state.step > 1) {
    state.completed = true;
    addXP(5);
  }
  render();
}

function togglePlay() {
  if (state.running) { stopTimer(); state.running = false; }
  else {
    state.running = true;
    state.timer = setInterval(() => {
      if (state.completed) { stopTimer(); state.running = false; render(); return; }
      doStep();
    }, state.speed);
  }
  render();
}

function stopTimer() { if (state.timer) { clearInterval(state.timer); state.timer = null; } state.running = false; }

// ==================== Init / Run ====================
export function runRoutingSim(labState) {
  const s = labState.routingSim || {};
  const protocols = ['RIP', 'OSPF', 'BGP'];
  const proto = protocols[s.protocol || 0];
  state = initState(proto);
  state.speed = s.speed || 500;
  resetProtocol();
  render();
}

// CSS injected once
const STYLE_ID = 'rs-styles';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.rs-svg{width:100%;max-width:520px;margin:8px auto;display:block;background:var(--bg-card);border-radius:10px;border:1px solid var(--border)}
.rs-info{font-size:.78rem;line-height:1.65;padding:10px 12px;background:var(--bg-card);border-radius:8px;border-left:3px solid var(--l3,#3498db);margin-bottom:10px}
.rs-controls{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px}
.rs-btn{padding:6px 14px;border-radius:6px;border:1px solid var(--border);background:var(--bg-card);color:var(--text);font-size:.78rem;cursor:pointer;transition:background .15s}
.rs-btn:hover{background:var(--l3,#3498db);color:#fff}
.rs-check{font-size:.75rem;display:flex;align-items:center;gap:4px;margin-left:6px}
.rs-step{font-size:.75rem;color:var(--text-secondary);margin-left:auto}
.rs-hint{font-size:.68rem;color:var(--text-secondary);margin-bottom:8px}
.rs-table-title{font-weight:700;font-size:.82rem;margin:10px 0 4px}
.rs-table{width:100%;border-collapse:collapse;font-size:.72rem;margin-bottom:8px}
.rs-table th,.rs-table td{padding:4px 8px;border:1px solid var(--border);text-align:left}
.rs-table th{background:var(--bg-card);font-weight:600}
.rs-new{background:rgba(46,204,113,.18)}
.rs-upd{background:rgba(241,196,15,.18)}
.rs-legend{display:flex;flex-wrap:wrap;gap:10px;font-size:.7rem;margin-top:6px;color:var(--text-secondary)}
.rs-leg{display:flex;align-items:center;gap:4px}
.rs-dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.rs-done{text-align:center;font-weight:700;color:#2ecc71;margin-top:10px;font-size:.85rem}
.rs-node{transition:opacity .15s}
.rs-node:hover{opacity:1!important;filter:brightness(1.2)}
.rs-edge:hover{stroke-width:3!important;stroke:#f1c40f!important}
`;
  document.head.appendChild(style);
}
