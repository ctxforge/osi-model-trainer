import { addXP } from '../core/gamification.js';

/* ============================================================
   Topology Builder — Canvas-based visual network editor
   ============================================================ */

const DEVICE_TYPES = [
  { type: 'pc', icon: '\u{1F5A5}\uFE0F', name: 'PC', layer: 7, hasIP: true, maxPorts: 1 },
  { type: 'server', icon: '\u{1F5C4}\uFE0F', name: 'Server', layer: 7, hasIP: true, maxPorts: 4 },
  { type: 'laptop', icon: '\u{1F4BB}', name: 'Laptop', layer: 7, hasIP: true, maxPorts: 2 },
  { type: 'phone', icon: '\u{1F4F1}', name: 'Smartphone', layer: 7, hasIP: true, maxPorts: 1 },
  { type: 'hub', icon: '\u2B1C', name: 'Hub', layer: 1, hasIP: false, maxPorts: 8 },
  { type: 'switch_l2', icon: '\u{1F7E6}', name: 'Switch L2', layer: 2, hasIP: false, maxPorts: 24 },
  { type: 'switch_l3', icon: '\u{1F7EA}', name: 'Switch L3', layer: 3, hasIP: true, maxPorts: 24 },
  { type: 'router', icon: '\u{1F7E7}', name: 'Router', layer: 3, hasIP: true, maxPorts: 8 },
  { type: 'ap', icon: '\u{1F4F6}', name: 'Access Point', layer: 2, hasIP: true, maxPorts: 1 },
  { type: 'firewall', icon: '\u{1F6E1}\uFE0F', name: 'Firewall', layer: 4, hasIP: true, maxPorts: 4 },
  { type: 'modem', icon: '\u{1F4DE}', name: 'Modem', layer: 1, hasIP: true, maxPorts: 2 },
  { type: 'loadbalancer', icon: '\u2696\uFE0F', name: 'Load Balancer', layer: 7, hasIP: true, maxPorts: 8 },
  { type: 'dns_server', icon: '\u{1F4D6}', name: 'DNS Server', layer: 7, hasIP: true, maxPorts: 2 },
  { type: 'dhcp_server', icon: '\u{1F4CB}', name: 'DHCP Server', layer: 7, hasIP: true, maxPorts: 2 },
  { type: 'cloud', icon: '\u2601\uFE0F', name: 'Cloud', layer: 3, hasIP: false, maxPorts: 8 }
];

const LINK_TYPES = [
  { id: 'ethernet', name: 'Ethernet', color: '#3498db', dash: [], bw: 1000, latency: 0.5, loss: 0 },
  { id: 'fiber', name: 'Fiber', color: '#2ecc71', dash: [], bw: 10000, latency: 0.2, loss: 0 },
  { id: 'wifi', name: 'Wi-Fi', color: '#9b59b6', dash: [6, 4], bw: 300, latency: 2, loss: 0.01 },
  { id: 'wan', name: 'WAN', color: '#7f8c8d', dash: [8, 4], bw: 100, latency: 20, loss: 0.001 }
];

/* Helper to build device objects concisely: [id, type, name, x, y, ip?, mask?, gw?] */
const D = (id, type, name, x, y, ip, mask, gw) => ({ id, type, name, x, y, ip: ip || '', mask: mask || '', gw: gw || '' });
const L = (from, to, type) => ({ from, to, type });

const PRESETS = {
  home: { name: '\u{1F3E0} \u0414\u043E\u043C\u0430\u0448\u043D\u044F\u044F \u0441\u0435\u0442\u044C',
    devices: [D(1,'cloud','Internet',400,40), D(2,'router','Router',400,140,'192.168.1.1','255.255.255.0'),
      D(3,'pc','PC',200,280,'192.168.1.10','255.255.255.0','192.168.1.1'),
      D(4,'laptop','Laptop',400,280,'192.168.1.11','255.255.255.0','192.168.1.1'),
      D(5,'phone','Phone',600,280,'192.168.1.12','255.255.255.0','192.168.1.1')],
    links: [L(1,2,'wan'), L(2,3,'ethernet'), L(2,4,'wifi'), L(2,5,'wifi')]
  },
  office: { name: '\u{1F3E2} \u041C\u0430\u043B\u044B\u0439 \u043E\u0444\u0438\u0441',
    devices: [D(1,'router','Router',400,40,'10.0.0.1','255.255.255.0'), D(2,'switch_l2','Switch',400,160),
      D(3,'pc','PC-1',100,300,'10.0.0.10','255.255.255.0','10.0.0.1'), D(4,'pc','PC-2',250,300,'10.0.0.11','255.255.255.0','10.0.0.1'),
      D(5,'pc','PC-3',400,300,'10.0.0.12','255.255.255.0','10.0.0.1'), D(6,'pc','PC-4',550,300,'10.0.0.13','255.255.255.0','10.0.0.1'),
      D(7,'server','Server',650,160,'10.0.0.2','255.255.255.0','10.0.0.1'), D(8,'server','Printer',700,300,'10.0.0.3','255.255.255.0','10.0.0.1')],
    links: [L(1,2,'ethernet'), L(2,3,'ethernet'), L(2,4,'ethernet'), L(2,5,'ethernet'), L(2,6,'ethernet'), L(2,7,'fiber'), L(2,8,'ethernet')]
  },
  campus: { name: '\u{1F3EB} 3-Tier Campus',
    devices: [D(1,'router','Core Router',400,30,'10.0.0.1','255.255.0.0'),
      D(2,'switch_l3','Dist-SW1',220,130,'10.0.1.1','255.255.255.0'), D(3,'switch_l3','Dist-SW2',580,130,'10.0.2.1','255.255.255.0'),
      D(4,'switch_l2','Acc-SW1',100,240), D(5,'switch_l2','Acc-SW2',340,240), D(6,'switch_l2','Acc-SW3',460,240), D(7,'switch_l2','Acc-SW4',700,240),
      ...[8,9,10,11].map((id,i) => D(id,'pc','PC-'+( i+1),[40,160,280,400][i],360,'10.0.1.'+(10+i),'255.255.255.0','10.0.1.1')),
      ...[12,13,14,15].map((id,i) => D(id,'pc','PC-'+(i+5),[400,520,640,760][i], i===0?420:360,'10.0.2.'+(10+i),'255.255.255.0','10.0.2.1'))],
    links: [L(1,2,'fiber'), L(1,3,'fiber'), L(2,4,'ethernet'), L(2,5,'ethernet'), L(3,6,'ethernet'), L(3,7,'ethernet'),
      L(4,8,'ethernet'), L(4,9,'ethernet'), L(5,10,'ethernet'), L(5,11,'ethernet'),
      L(6,12,'ethernet'), L(6,13,'ethernet'), L(7,14,'ethernet'), L(7,15,'ethernet')]
  }
};

/* ---- State ---- */
let devices = [], links = [], nextId = 1;
let selectedId = null, connectingFrom = null, dragging = null, dragOff = { x: 0, y: 0 };
let canvas, ctx, currentLinkType = 'ethernet', animPacket = null;
const DW = 80, DH = 50;

/* ---- Helpers ---- */
const devById = id => devices.find(d => d.id === id);
const typeInfo = type => DEVICE_TYPES.find(t => t.type === type);
const linkInfo = id => LINK_TYPES.find(l => l.id === id);

function hitTest(mx, my) {
  for (let i = devices.length - 1; i >= 0; i--) {
    const d = devices[i];
    if (mx >= d.x - DW/2 && mx <= d.x + DW/2 && my >= d.y - DH/2 && my <= d.y + DH/2) return d;
  }
  return null;
}

function roundRect(c, x, y, w, h, r, fill, stroke) {
  c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y);
  c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h-r);
  c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h);
  c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r);
  c.quadraticCurveTo(x,y,x+r,y); c.closePath();
  if (fill) c.fill(); if (stroke) c.stroke();
}

/* ---- Drawing ---- */
function draw() {
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr, h = canvas.height / dpr;
  ctx.save(); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);

  // grid
  ctx.strokeStyle = 'rgba(120,120,140,0.12)'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

  // links
  links.forEach(l => {
    const a = devById(l.from), b = devById(l.to); if (!a || !b) return;
    const lt = linkInfo(l.type);
    ctx.strokeStyle = lt.color; ctx.lineWidth = 2; ctx.setLineDash(lt.dash);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '9px sans-serif'; ctx.fillStyle = lt.color; ctx.textAlign = 'center';
    ctx.fillText(lt.name, (a.x+b.x)/2, (a.y+b.y)/2 - 5);
  });

  // devices
  devices.forEach(d => {
    const ti = typeInfo(d.type), sel = d.id === selectedId;
    const rx = d.x - DW/2, ry = d.y - DH/2;
    if (sel) { ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 14; }
    ctx.fillStyle = sel ? 'rgba(79,195,247,0.15)' : 'rgba(40,44,60,0.75)';
    ctx.strokeStyle = sel ? '#4fc3f7' : 'rgba(120,120,140,0.4)';
    ctx.lineWidth = sel ? 2 : 1;
    roundRect(ctx, rx, ry, DW, DH, 8, true, true);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText(ti.icon, d.x, d.y - 6);
    ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = '#ccc'; ctx.fillText(d.name, d.x, d.y + 18);
  });

  // connecting indicator
  if (connectingFrom !== null) {
    ctx.font = '11px sans-serif'; ctx.fillStyle = '#f1c40f'; ctx.textAlign = 'left';
    ctx.fillText('\u25B6 \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0446\u0435\u043B\u044C \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F...', 10, h - 10);
  }

  // packet animation
  if (animPacket && animPacket.idx < animPacket.path.length - 1) {
    const a = animPacket.path[animPacket.idx], b = animPacket.path[animPacket.idx + 1];
    const px = a.x + (b.x - a.x) * animPacket.t, py = a.y + (b.y - a.y) * animPacket.t;
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#f39c12'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.restore();
}

/* ---- Resize canvas ---- */
function resizeCanvas() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1, parent = canvas.parentElement;
  const w = parent.clientWidth, h = Math.max(400, Math.min(500, window.innerHeight * 0.55));
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  canvas.width = w * dpr; canvas.height = h * dpr;
  draw();
}

/* ---- Properties panel ---- */
function renderProps(container) {
  const panel = container.querySelector('.tb-props');
  if (!panel) return;
  if (selectedId === null) {
    panel.innerHTML = '<div style="padding:12px;color:var(--text-secondary);font-size:.78rem">\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u043D\u0430 \u0445\u043E\u043B\u0441\u0442\u0435</div>'; return;
  }
  const d = devById(selectedId); if (!d) return;
  const ti = typeInfo(d.type), conns = links.filter(l => l.from === d.id || l.to === d.id);
  const field = (lbl, key, ph) => `<label style="display:block;margin-bottom:4px;font-size:.72rem;color:var(--text-secondary)">${lbl}</label>
    <input type="text" class="sim-input" value="${d[key]||''}" data-field="${key}" style="margin-bottom:6px;padding:6px 8px;font-size:.78rem" placeholder="${ph||''}">`;

  panel.innerHTML = `<div style="padding:10px;font-size:.8rem">
    <div style="font-weight:700;margin-bottom:8px">${ti.icon} \u0421\u0432\u043E\u0439\u0441\u0442\u0432\u0430</div>
    ${field('\u0418\u043C\u044F','name','')}
    ${ti.hasIP ? field('IP-\u0430\u0434\u0440\u0435\u0441','ip','192.168.1.x') + field('\u041C\u0430\u0441\u043A\u0430','mask','255.255.255.0')
      + (ti.layer >= 7 ? field('\u0428\u043B\u044E\u0437','gw','') : '') : ''}
    <div style="margin-top:8px;font-size:.72rem;color:var(--text-secondary)">\u0422\u0438\u043F: ${ti.name} (L${ti.layer}) | \u041F\u043E\u0440\u0442\u044B: ${conns.length}/${ti.maxPorts}</div>
    <div style="margin-top:4px;font-size:.7rem;color:var(--text-secondary)">\u0421\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F:</div>
    ${conns.length === 0 ? '<div style="font-size:.7rem;color:var(--text-secondary);">\u041D\u0435\u0442</div>' :
      conns.map(c => { const o = devById(c.from === d.id ? c.to : c.from); return `<div style="font-size:.7rem">\u2022 ${linkInfo(c.type).name} \u2192 ${o?o.name:'?'}</div>`; }).join('')}
    <button class="lab-run-btn" data-action="delete" style="background:#e74c3c;margin-top:10px;padding:6px;font-size:.75rem">\u2716 \u0423\u0434\u0430\u043B\u0438\u0442\u044C</button>
  </div>`;
  panel.querySelectorAll('input[data-field]').forEach(inp => inp.addEventListener('input', () => { d[inp.dataset.field] = inp.value; draw(); }));
  panel.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
    devices = devices.filter(dd => dd.id !== d.id);
    links = links.filter(l => l.from !== d.id && l.to !== d.id);
    selectedId = null; renderProps(container); draw();
  });
}

/* ---- Packet tracing ---- */
function findPath(srcId, dstId) {
  const visited = new Set([srcId]), queue = [[srcId]];
  while (queue.length) {
    const path = queue.shift(), last = path[path.length - 1];
    if (last === dstId) return path;
    links.forEach(l => {
      const n = l.from === last ? l.to : l.to === last ? l.from : null;
      if (n !== null && !visited.has(n)) { visited.add(n); queue.push([...path, n]); }
    });
  }
  return null;
}

function deviceAction(dev) {
  const layer = typeInfo(dev.type).layer;
  const typeActions = {
    modem: '\u{1F4DE} Modem: \u043C\u043E\u0434\u0443\u043B\u0438\u0440\u0443\u0435\u0442/\u0434\u0435\u043C\u043E\u0434\u0443\u043B\u0438\u0440\u0443\u0435\u0442 \u0441\u0438\u0433\u043D\u0430\u043B',
    loadbalancer: '\u2696\uFE0F LB: \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0435\u0442 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0443 \u043C\u0435\u0436\u0434\u0443 \u0441\u0435\u0440\u0432\u0435\u0440\u0430\u043C\u0438',
    dns_server: '\u{1F4D6} DNS: \u0440\u0430\u0437\u0440\u0435\u0448\u0430\u0435\u0442 \u0434\u043E\u043C\u0435\u043D\u043D\u043E\u0435 \u0438\u043C\u044F \u0432 IP',
    dhcp_server: '\u{1F4CB} DHCP: \u0432\u044B\u0434\u0430\u0451\u0442 IP-\u0430\u0434\u0440\u0435\u0441 \u043A\u043B\u0438\u0435\u043D\u0442\u0443'
  };
  if (typeActions[dev.type]) return typeActions[dev.type];
  const actions = {
    1: '\u{1F4E2} Hub: \u0440\u0430\u0441\u0441\u044B\u043B\u0430\u0435\u0442 \u043A\u0430\u0434\u0440 \u043D\u0430 \u0432\u0441\u0435 \u043F\u043E\u0440\u0442\u044B (broadcast)',
    2: '\u{1F4CB} Switch L2: \u043F\u0435\u0440\u0435\u0441\u044B\u043B\u0430\u0435\u0442 \u043F\u043E MAC-\u0430\u0434\u0440\u0435\u0441\u0443',
    3: '\u{1F5FA}\uFE0F Router/L3: \u043C\u0430\u0440\u0448\u0440\u0443\u0442\u0438\u0437\u0438\u0440\u0443\u0435\u0442 \u043F\u043E IP',
    4: '\u{1F6E1}\uFE0F Firewall: \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u0442 \u043F\u0440\u0430\u0432\u0438\u043B\u0430, \u043F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442'
  };
  return actions[layer] || '\u{1F4E5} \u041F\u043E\u043B\u0443\u0447\u0430\u0435\u0442/\u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0435 (\u0432\u0441\u0435 \u0443\u0440\u043E\u0432\u043D\u0438)';
}

async function tracePacket(container) {
  const logEl = container.querySelector('.tb-trace-log');
  if (devices.length < 2) { logEl.innerHTML = '<div style="color:#e74c3c">\u26A0\uFE0F \u041D\u0443\u0436\u043D\u043E \u043C\u0438\u043D\u0438\u043C\u0443\u043C 2 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430</div>'; return; }
  const srcId = parseInt(container.querySelector('[data-role="src"]').value);
  const dstId = parseInt(container.querySelector('[data-role="dst"]').value);
  if (srcId === dstId) { logEl.innerHTML = '<div style="color:#e74c3c">\u26A0\uFE0F \u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0438 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u044E\u0442</div>'; return; }
  const path = findPath(srcId, dstId);
  if (!path) { logEl.innerHTML = '<div style="color:#e74c3c">\u274C \u041C\u0430\u0440\u0448\u0440\u0443\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D! \u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 \u043D\u0435 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u044B.</div>'; return; }

  const pts = path.map(id => { const d = devById(id); return { x: d.x, y: d.y }; });
  animPacket = { path: pts, idx: 0, t: 0 };
  logEl.innerHTML = '';

  for (let i = 0; i < path.length; i++) {
    const d = devById(path[i]);
    if (i < path.length - 1) {
      animPacket.idx = i;
      await new Promise(resolve => {
        const segDuration = 500; // ms per segment
        const startTime = performance.now();
        function animateFrame(now) {
          const elapsed = now - startTime;
          animPacket.t = Math.min(elapsed / segDuration, 1);
          draw();
          if (animPacket.t < 1) requestAnimationFrame(animateFrame);
          else resolve();
        }
        requestAnimationFrame(animateFrame);
      });
    }
    const line = document.createElement('div');
    line.style.cssText = 'font-size:.75rem;padding:3px 0;border-bottom:1px solid rgba(120,120,140,0.15)';
    line.innerHTML = `<strong>${typeInfo(d.type).icon} ${d.name}</strong>: ${deviceAction(d)}`;
    logEl.appendChild(line);
  }
  animPacket = null; draw();
  const ok = document.createElement('div');
  ok.style.cssText = 'margin-top:8px;font-weight:700;color:#2ecc71;font-size:.82rem';
  ok.textContent = '\u2705 \u041F\u0430\u043A\u0435\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D!';
  logEl.appendChild(ok);
  addXP(5);
}

/* ---- Random topology generator ---- */
function generateRandomTopology() {
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const topoTypes = ['home', 'small_office', 'corporate', 'campus', 'isp', 'datacenter'];
  const topoType = pick(topoTypes);
  const totalTarget = topoType === 'home' ? rand(5, 8) : topoType === 'small_office' ? rand(8, 15) : topoType === 'corporate' ? rand(15, 30) : topoType === 'campus' ? rand(20, 40) : topoType === 'isp' ? rand(10, 20) : rand(15, 30);

  const genDevices = [];
  const genLinks = [];
  let idCounter = 1;

  /* --- IP assignment helpers --- */
  const isLarge = totalTarget > 10;
  const baseNet = isLarge ? '10.0' : '192.168';
  let subnetIdx = 1;
  let hostIdx = 10;

  function nextSubnet() {
    const sub = subnetIdx;
    subnetIdx++;
    hostIdx = 10;
    return sub;
  }

  function assignIP(subnet) {
    const ip = isLarge
      ? `${baseNet}.${subnet}.${hostIdx}`
      : `${baseNet}.${subnet}.${hostIdx}`;
    hostIdx++;
    return ip;
  }

  function gwIP(subnet) {
    return isLarge
      ? `${baseNet}.${subnet}.1`
      : `${baseNet}.${subnet}.1`;
  }

  function maskStr() {
    return '255.255.255.0';
  }

  /* --- Add device helper --- */
  function addDev(type, name, x, y, ip, mask, gw) {
    const d = D(idCounter++, type, name, x, y, ip, mask, gw);
    genDevices.push(d);
    return d;
  }

  /* --- Link type selection helpers --- */
  function linkBetween(a, b) {
    const tA = a.type, tB = b.type;
    if (tA === 'cloud' || tB === 'cloud') return 'wan';
    const isRouterA = tA === 'router' || tA === 'firewall';
    const isRouterB = tB === 'router' || tB === 'firewall';
    if (isRouterA && isRouterB) return pick(['fiber', 'wan']);
    const isSwitchA = tA.startsWith('switch') || tA === 'hub';
    const isSwitchB = tB.startsWith('switch') || tB === 'hub';
    if (isSwitchA && isSwitchB) return pick(['fiber', 'ethernet']);
    const isWireless = t => t === 'phone' || t === 'laptop' || t === 'ap';
    if (isWireless(tA) || isWireless(tB)) {
      if (tA === 'ap' || tB === 'ap') return 'wifi';
      return pick(['ethernet', 'wifi']);
    }
    return 'ethernet';
  }

  function addLink(a, b) {
    genLinks.push(L(a.id, b.id, linkBetween(a, b)));
  }

  /* --- Layout helpers (800x500 canvas) --- */
  const CW = 800, CH = 500;
  const PAD = 60;

  function spreadX(count, y) {
    const positions = [];
    const usable = CW - PAD * 2;
    const step = count > 1 ? usable / (count - 1) : 0;
    const startX = count > 1 ? PAD : CW / 2;
    for (let i = 0; i < count; i++) {
      positions.push({ x: startX + step * i, y });
    }
    return positions;
  }

  /* --- Endpoint device types --- */
  const endpointTypes = ['pc', 'laptop', 'server', 'phone'];
  const optionalInfra = ['ap', 'firewall', 'cloud'];

  /* ===== TOPOLOGY GENERATORS ===== */

  function generateStar() {
    const sub = nextSubnet();
    const center = addDev('router', 'Router-1', CW / 2, 80, gwIP(sub), maskStr());
    const endCount = Math.min(totalTarget - 1, rand(4, 12));
    const useSwitch = endCount > 3;
    let parent = center;
    if (useSwitch) {
      parent = addDev('switch_l2', 'Switch-1', CW / 2, 200);
      addLink(center, parent);
    }
    const positions = spreadX(endCount, useSwitch ? 360 : 280);
    for (let i = 0; i < endCount; i++) {
      const t = pick(endpointTypes);
      const d = addDev(t, `${typeInfo(t).name}-${i + 1}`, positions[i].x, positions[i].y,
        assignIP(sub), maskStr(), gwIP(sub));
      addLink(parent, d);
    }
    // optional cloud
    if (genDevices.length < totalTarget && Math.random() > 0.5) {
      const cl = addDev('cloud', 'Internet', CW / 2, 20);
      addLink(cl, center);
    }
  }

  function generateTree() {
    const tiers = rand(2, 3);
    // Core tier
    const coreSub = nextSubnet();
    const coreRouter = addDev('router', 'Core-Router', CW / 2, 40, gwIP(coreSub), maskStr());

    // Optional cloud
    if (Math.random() > 0.4) {
      const cl = addDev('cloud', 'Internet', CW / 2 - 120, 20);
      addLink(cl, coreRouter);
    }

    // Distribution tier
    const distCount = rand(2, 3);
    const distPositions = spreadX(distCount, 150);
    const distDevices = [];
    for (let i = 0; i < distCount; i++) {
      const sub = nextSubnet();
      const dtype = tiers >= 3 ? 'switch_l3' : 'switch_l2';
      const sw = addDev(dtype, `Dist-SW${i + 1}`, distPositions[i].x, distPositions[i].y,
        tiers >= 3 ? gwIP(sub) : undefined, tiers >= 3 ? maskStr() : undefined);
      addLink(coreRouter, sw);
      distDevices.push({ dev: sw, sub });
    }

    if (tiers >= 3) {
      // Access tier
      const accPerDist = Math.max(1, Math.floor((totalTarget - genDevices.length) / (distCount * 2)));
      const accY = 270;
      let accXOffset = 0;
      const accDevices = [];
      for (let di = 0; di < distCount; di++) {
        const accCount = rand(1, Math.min(accPerDist, 3));
        const sectionW = CW / distCount;
        const accPositions = spreadX(accCount, accY).map((p, i) => ({
          x: di * sectionW + PAD + (sectionW - PAD * 2) * (accCount > 1 ? i / (accCount - 1) : 0.5),
          y: accY
        }));
        for (let ai = 0; ai < accCount; ai++) {
          const accSw = addDev('switch_l2', `Acc-SW${accXOffset + ai + 1}`,
            accPositions[ai].x, accPositions[ai].y);
          addLink(distDevices[di].dev, accSw);
          accDevices.push({ dev: accSw, sub: distDevices[di].sub });
        }
        accXOffset += accCount;
      }

      // Endpoints
      const remaining = Math.max(2, totalTarget - genDevices.length);
      const perAcc = Math.max(1, Math.ceil(remaining / accDevices.length));
      for (let ai = 0; ai < accDevices.length; ai++) {
        const epCount = Math.min(perAcc, totalTarget - genDevices.length);
        if (epCount <= 0) break;
        const sectionW = CW / accDevices.length;
        for (let ei = 0; ei < epCount; ei++) {
          if (genDevices.length >= totalTarget) break;
          const t = pick(endpointTypes);
          const ex = accDevices[ai].dev.x - 40 + ei * 80;
          const d = addDev(t, `${typeInfo(t).name}-${genDevices.length}`,
            Math.max(PAD, Math.min(CW - PAD, ex)), rand(380, 440),
            assignIP(accDevices[ai].sub), maskStr(), gwIP(accDevices[ai].sub));
          addLink(accDevices[ai].dev, d);
        }
      }
    } else {
      // 2-tier: endpoints directly off distribution switches
      const remaining = Math.max(2, totalTarget - genDevices.length);
      const perDist = Math.ceil(remaining / distCount);
      for (let di = 0; di < distCount; di++) {
        const epCount = Math.min(perDist, totalTarget - genDevices.length);
        if (epCount <= 0) break;
        for (let ei = 0; ei < epCount; ei++) {
          if (genDevices.length >= totalTarget) break;
          const t = pick(endpointTypes);
          const ex = distDevices[di].dev.x - 60 + ei * 70;
          const d = addDev(t, `${typeInfo(t).name}-${genDevices.length}`,
            Math.max(PAD, Math.min(CW - PAD, ex)), rand(300, 380),
            assignIP(distDevices[di].sub), maskStr(), gwIP(distDevices[di].sub));
          addLink(distDevices[di].dev, d);
        }
      }
    }
  }

  function generateMesh() {
    // Routers in partial mesh
    const routerCount = rand(3, 5);
    const routerPositions = spreadX(routerCount, 80);
    const routers = [];
    for (let i = 0; i < routerCount; i++) {
      const sub = nextSubnet();
      const r = addDev('router', `Router-${i + 1}`, routerPositions[i].x, routerPositions[i].y,
        gwIP(sub), maskStr());
      routers.push({ dev: r, sub });
    }
    // Partial mesh: connect each router to 2-3 neighbors
    for (let i = 0; i < routers.length; i++) {
      for (let j = i + 1; j < routers.length; j++) {
        if (j === i + 1 || Math.random() > 0.5) {
          addLink(routers[i].dev, routers[j].dev);
        }
      }
    }

    // Switches + endpoints per router
    const remaining = Math.max(2, totalTarget - genDevices.length);
    const perRouter = Math.ceil(remaining / routerCount);
    for (let ri = 0; ri < routers.length; ri++) {
      if (genDevices.length >= totalTarget) break;
      const sw = addDev('switch_l2', `Switch-${ri + 1}`, routers[ri].dev.x, 220);
      addLink(routers[ri].dev, sw);
      const epCount = Math.min(rand(1, perRouter), totalTarget - genDevices.length);
      for (let ei = 0; ei < epCount; ei++) {
        if (genDevices.length >= totalTarget) break;
        const t = pick(endpointTypes);
        const ex = sw.x - 40 + ei * 80;
        const d = addDev(t, `${typeInfo(t).name}-${genDevices.length}`,
          Math.max(PAD, Math.min(CW - PAD, ex)), rand(340, 420),
          assignIP(routers[ri].sub), maskStr(), gwIP(routers[ri].sub));
        addLink(sw, d);
      }
    }

    // Optional cloud
    if (genDevices.length < totalTarget) {
      const cl = addDev('cloud', 'Internet', CW / 2, 20);
      addLink(cl, routers[0].dev);
    }
  }

  function generateRing() {
    // Ring of routers/switches
    const ringSize = rand(3, 5);
    const sub = nextSubnet();
    const ringDevices = [];
    const cx = CW / 2, cy = 180, radius = 120;
    for (let i = 0; i < ringSize; i++) {
      const angle = (2 * Math.PI * i) / ringSize - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const isRouter = i === 0;
      const d = isRouter
        ? addDev('router', 'Router-1', x, y, gwIP(sub), maskStr())
        : addDev('switch_l2', `Switch-${i}`, x, y);
      ringDevices.push(d);
    }
    // Connect ring
    for (let i = 0; i < ringSize; i++) {
      addLink(ringDevices[i], ringDevices[(i + 1) % ringSize]);
    }

    // Endpoints on leaf switches
    const endpointsNeeded = Math.max(2, totalTarget - genDevices.length);
    const perNode = Math.ceil(endpointsNeeded / (ringSize - 1));
    for (let i = 1; i < ringSize; i++) {
      const epCount = Math.min(perNode, totalTarget - genDevices.length);
      if (epCount <= 0) break;
      for (let ei = 0; ei < epCount; ei++) {
        if (genDevices.length >= totalTarget) break;
        const t = pick(endpointTypes);
        const ex = ringDevices[i].x - 30 + ei * 60;
        const d = addDev(t, `${typeInfo(t).name}-${genDevices.length}`,
          Math.max(PAD, Math.min(CW - PAD, ex)), rand(360, 440),
          assignIP(sub), maskStr(), gwIP(sub));
        addLink(ringDevices[i], d);
      }
    }

    // Optional cloud
    if (genDevices.length < totalTarget && Math.random() > 0.4) {
      const cl = addDev('cloud', 'Internet', ringDevices[0].x, 20);
      addLink(cl, ringDevices[0]);
    }
  }

  function generateHybrid() {
    // Hybrid: core routers + star branches + optional ring segment
    const sub1 = nextSubnet();
    const sub2 = nextSubnet();
    const r1 = addDev('router', 'Router-1', CW / 3, 60, gwIP(sub1), maskStr());
    const r2 = addDev('router', 'Router-2', (CW * 2) / 3, 60, gwIP(sub2), maskStr());
    addLink(r1, r2);

    // Optional firewall
    if (Math.random() > 0.5 && genDevices.length < totalTarget - 4) {
      const fw = addDev('firewall', 'Firewall', CW / 2, 60, `${baseNet}.${nextSubnet()}.1`, maskStr());
      addLink(r1, fw);
      addLink(fw, r2);
    }

    // Left branch: star
    const sw1 = addDev('switch_l2', 'Switch-1', CW / 3, 190);
    addLink(r1, sw1);
    const leftCount = rand(2, Math.max(2, Math.floor((totalTarget - genDevices.length) / 2)));
    const leftPositions = spreadX(leftCount, 340);
    for (let i = 0; i < leftCount; i++) {
      if (genDevices.length >= totalTarget) break;
      const t = pick(endpointTypes);
      const d = addDev(t, `${typeInfo(t).name}-${genDevices.length}`,
        Math.max(PAD, Math.min(CW / 2 - 20, leftPositions[i].x - 80)), rand(320, 400),
        assignIP(sub1), maskStr(), gwIP(sub1));
      addLink(sw1, d);
    }

    // Right branch: small ring or star
    if (Math.random() > 0.5 && totalTarget - genDevices.length >= 3) {
      // Small ring segment
      const sw2 = addDev('switch_l2', 'Switch-2', (CW * 2) / 3 - 60, 190);
      const sw3 = addDev('switch_l2', 'Switch-3', (CW * 2) / 3 + 60, 190);
      addLink(r2, sw2);
      addLink(r2, sw3);
      addLink(sw2, sw3);
      const parents = [sw2, sw3];
      const rightCount = Math.max(2, totalTarget - genDevices.length);
      for (let i = 0; i < rightCount; i++) {
        if (genDevices.length >= totalTarget) break;
        const t = pick(endpointTypes);
        const parent = parents[i % parents.length];
        const d = addDev(t, `${typeInfo(t).name}-${genDevices.length}`,
          Math.max(CW / 2 + 20, Math.min(CW - PAD, parent.x - 30 + (i % 3) * 60)), rand(320, 400),
          assignIP(sub2), maskStr(), gwIP(sub2));
        addLink(parent, d);
      }
    } else {
      // Star
      const sw2 = addDev('switch_l2', 'Switch-2', (CW * 2) / 3, 190);
      addLink(r2, sw2);
      const rightCount = Math.max(2, totalTarget - genDevices.length);
      for (let i = 0; i < rightCount; i++) {
        if (genDevices.length >= totalTarget) break;
        const t = pick(endpointTypes);
        const d = addDev(t, `${typeInfo(t).name}-${genDevices.length}`,
          Math.max(CW / 2 + 20, Math.min(CW - PAD, sw2.x - 60 + i * 70)), rand(320, 400),
          assignIP(sub2), maskStr(), gwIP(sub2));
        addLink(sw2, d);
      }
    }

    // Optional cloud
    if (genDevices.length < totalTarget) {
      const cl = addDev('cloud', 'Internet', CW / 2, 10);
      addLink(cl, r1);
    }
  }

  /* ===== ISP topology (mesh of routers + customers) ===== */
  function generateISP() {
    // Core backbone: mesh of routers
    const coreCount = rand(3, 5);
    const corePositions = spreadX(coreCount, 80);
    const routers = [];
    for (let i = 0; i < coreCount; i++) {
      const sub = nextSubnet();
      const r = addDev('router', `PE-R${i + 1}`, corePositions[i].x, corePositions[i].y,
        gwIP(sub), maskStr());
      routers.push({ dev: r, sub });
    }
    // Partial mesh among core routers
    for (let i = 0; i < routers.length; i++) {
      for (let j = i + 1; j < routers.length; j++) {
        if (j === i + 1 || Math.random() > 0.4) addLink(routers[i].dev, routers[j].dev);
      }
    }
    // Border router + cloud
    const cl = addDev('cloud', 'Internet', CW / 2, 20);
    addLink(cl, routers[0].dev);
    // Customer branches
    for (let ri = 0; ri < routers.length; ri++) {
      if (genDevices.length >= totalTarget) break;
      const sw = addDev('switch_l2', `CE-SW${ri + 1}`, routers[ri].dev.x, 220);
      addLink(routers[ri].dev, sw);
      const epCount = Math.min(rand(1, 3), totalTarget - genDevices.length);
      for (let ei = 0; ei < epCount; ei++) {
        if (genDevices.length >= totalTarget) break;
        const t = pick(endpointTypes);
        const ex = sw.x - 40 + ei * 80;
        addDev(t, `Cust-${genDevices.length}`,
          Math.max(PAD, Math.min(CW - PAD, ex)), rand(340, 420),
          assignIP(routers[ri].sub), maskStr(), gwIP(routers[ri].sub));
        addLink(sw, genDevices[genDevices.length - 1]);
      }
    }
  }

  /* ===== Data Center topology (spine-leaf) ===== */
  function generateDataCenter() {
    const spineCount = rand(2, 3);
    const leafCount = rand(3, 5);
    // Spines
    const spinePositions = spreadX(spineCount, 60);
    const spines = [];
    for (let i = 0; i < spineCount; i++) {
      const s = addDev('switch_l3', `Spine-${i + 1}`, spinePositions[i].x, spinePositions[i].y,
        `${baseNet}.${nextSubnet()}.1`, maskStr());
      spines.push(s);
    }
    // Leaves
    const leafPositions = spreadX(leafCount, 200);
    const leaves = [];
    for (let i = 0; i < leafCount; i++) {
      const sub = nextSubnet();
      const l = addDev('switch_l2', `Leaf-${i + 1}`, leafPositions[i].x, leafPositions[i].y);
      leaves.push({ dev: l, sub });
      // Full mesh: every leaf connects to every spine
      spines.forEach(sp => addLink(l, sp));
    }
    // Servers under each leaf
    for (let li = 0; li < leaves.length; li++) {
      if (genDevices.length >= totalTarget) break;
      const srvCount = Math.min(rand(2, 4), totalTarget - genDevices.length);
      for (let si = 0; si < srvCount; si++) {
        if (genDevices.length >= totalTarget) break;
        const ex = leaves[li].dev.x - 50 + si * 60;
        const srv = addDev('server', `Srv-${genDevices.length}`,
          Math.max(PAD, Math.min(CW - PAD, ex)), rand(320, 400),
          assignIP(leaves[li].sub), maskStr(), gwIP(leaves[li].sub));
        addLink(leaves[li].dev, srv);
      }
    }
    // Optional load balancer
    if (genDevices.length < totalTarget) {
      const lb = addDev('loadbalancer', 'LB-1', CW / 2, 140,
        `${baseNet}.${nextSubnet()}.1`, maskStr());
      addLink(spines[0], lb);
    }
  }

  /* ===== Execute selected topology type ===== */
  switch (topoType) {
    case 'home':         generateStar();       break;
    case 'small_office': generateHybrid();     break;
    case 'corporate':    generateTree();       break;
    case 'campus':       generateTree();       break;
    case 'isp':          generateISP();        break;
    case 'datacenter':   generateDataCenter(); break;
  }

  /* Ensure minimum 2 endpoints */
  const epTypes = new Set(['pc', 'laptop', 'server', 'phone']);
  const epCount = genDevices.filter(d => epTypes.has(d.type)).length;
  if (epCount < 2) {
    const parent = genDevices.find(d => d.type.startsWith('switch') || d.type === 'router');
    const sub = 1;
    for (let i = epCount; i < 2; i++) {
      const t = pick([...epTypes]);
      const d = addDev(t, `${typeInfo(t).name}-extra${i + 1}`,
        rand(PAD, CW - PAD), rand(380, 460),
        assignIP(sub), maskStr(), gwIP(sub));
      if (parent) addLink(parent, d);
    }
  }

  /* Apply to module state */
  devices = genDevices.map(d => ({ ...d }));
  links = genLinks.map(l => ({ ...l }));
  nextId = Math.max(...devices.map(d => d.id)) + 1;
  selectedId = null;
  connectingFrom = null;
  draw();
}

/* ---- Export / Load ---- */
function getTopology() {
  return JSON.stringify({ devices: devices.map(d => ({ ...d })), links: links.map(l => ({ ...l })) }, null, 2);
}

function loadPreset(key) {
  const p = PRESETS[key]; if (!p) return;
  devices = p.devices.map(d => ({ ...d }));
  links = p.links.map(l => ({ ...l }));
  nextId = Math.max(...devices.map(d => d.id)) + 1;
  selectedId = null; connectingFrom = null; draw();
}

function updateSelects(container) {
  ['src','dst'].forEach(role => {
    const sel = container.querySelector(`[data-role="${role}"]`); if (!sel) return;
    sel.innerHTML = devices.map(d => `<option value="${d.id}">${typeInfo(d.type).icon} ${d.name}</option>`).join('');
  });
  if (devices.length >= 2) {
    const s = container.querySelector('[data-role="src"]'), t = container.querySelector('[data-role="dst"]');
    if (s) s.value = devices[0].id; if (t) t.value = devices[devices.length - 1].id;
  }
}

/* ---- Build UI ---- */
function buildUI(container) {
  container.innerHTML = `
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
      <span style="font-size:.75rem;color:var(--text-secondary);align-self:center;margin-right:4px">\u041F\u0440\u0435\u0441\u0435\u0442\u044B:</span>
      ${Object.entries(PRESETS).map(([k,v]) => `<button class="dnd-btn tb-preset" data-preset="${k}" style="padding:6px 10px;font-size:.72rem">${v.name}</button>`).join('')}
      <button class="dnd-btn tb-preset" data-preset="random" style="padding:6px 10px;font-size:.72rem">\u{1F3B2} \u0421\u043B\u0443\u0447\u0430\u0439\u043D\u0430\u044F</button>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;padding:8px;background:var(--bg-card);border-radius:8px;border:1px solid var(--border)">
      <span style="font-size:.72rem;color:var(--text-secondary);width:100%;margin-bottom:2px">\u{1F4E6} \u041F\u0430\u043B\u0438\u0442\u0440\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432 (\u043D\u0430\u0436\u043C\u0438\u0442\u0435 = \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C):</span>
      ${DEVICE_TYPES.map(t => `<button class="dnd-btn tb-add-dev" data-type="${t.type}" style="padding:5px 8px;font-size:.72rem" title="${t.name} (L${t.layer})">${t.icon} ${t.name}</button>`).join('')}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;align-items:center">
      <span style="font-size:.72rem;color:var(--text-secondary)">\u{1F517} \u0422\u0438\u043F \u0441\u0432\u044F\u0437\u0438:</span>
      ${LINK_TYPES.map(lt => `<button class="dnd-btn tb-link-type${lt.id===currentLinkType?' active':''}" data-link="${lt.id}" style="padding:5px 8px;font-size:.72rem;border-color:${lt.color}">${lt.name}</button>`).join('')}
      <span style="font-size:.68rem;color:var(--text-secondary);margin-left:auto">\u0414\u0432\u043E\u0439\u043D\u043E\u0439 \u043A\u043B\u0438\u043A \u043F\u043E \u0443\u0441\u0442\u0440-\u0432\u0443 \u2192 \u043A\u043B\u0438\u043A \u043F\u043E \u0446\u0435\u043B\u0438 = \u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u044C | Esc = \u043E\u0442\u043C\u0435\u043D\u0430</span>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <div style="flex:1;min-width:280px">
        <canvas class="tb-canvas" style="background:var(--bg-card);border-radius:8px;border:1px solid var(--border);cursor:crosshair;display:block;width:100%"></canvas>
      </div>
      <div class="tb-props" style="width:220px;min-width:180px;background:var(--bg-card);border-radius:8px;border:1px solid var(--border);max-height:500px;overflow-y:auto"></div>
    </div>
    <div style="margin-top:10px;padding:10px;background:var(--bg-card);border-radius:8px;border:1px solid var(--border)">
      <div style="font-weight:700;font-size:.82rem;margin-bottom:8px">\u{1F4E1} \u0422\u0440\u0430\u0441\u0441\u0438\u0440\u043E\u0432\u043A\u0430 \u043F\u0430\u043A\u0435\u0442\u0430</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
        <label style="font-size:.72rem">\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A:</label>
        <select class="ch-phy-select" data-role="src" style="font-size:.75rem;padding:4px 6px;max-width:140px"></select>
        <label style="font-size:.72rem">\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435:</label>
        <select class="ch-phy-select" data-role="dst" style="font-size:.75rem;padding:4px 6px;max-width:140px"></select>
        <button class="lab-run-btn tb-send-pkt" style="padding:6px 14px;font-size:.78rem;margin:0">\u25B6 \u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043F\u0430\u043A\u0435\u0442</button>
      </div>
      <div class="tb-trace-log" style="max-height:180px;overflow-y:auto"></div>
    </div>
    <div style="display:flex;gap:6px;margin-top:8px">
      <button class="dnd-btn tb-export" style="padding:6px 12px;font-size:.72rem">\u{1F4BE} \u042D\u043A\u0441\u043F\u043E\u0440\u0442 JSON</button>
      <button class="dnd-btn tb-clear" style="padding:6px 12px;font-size:.72rem">\u{1F5D1}\uFE0F \u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C</button>
    </div>`;

  canvas = container.querySelector('.tb-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();

  /* -- Presets -- */
  container.querySelectorAll('.tb-preset').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.preset === 'random') {
      generateRandomTopology();
    } else {
      loadPreset(btn.dataset.preset);
    }
    updateSelects(container); renderProps(container);
  }));

  /* -- Add device from palette -- */
  container.querySelectorAll('.tb-add-dev').forEach(btn => btn.addEventListener('click', () => {
    const ti = typeInfo(btn.dataset.type), dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr, h = canvas.height / dpr;
    devices.push({
      id: nextId++, type: btn.dataset.type,
      name: ti.name + '-' + (devices.filter(dd => dd.type === btn.dataset.type).length + 1),
      x: 60 + Math.random() * (w - 120), y: 60 + Math.random() * (h - 120),
      ip: ti.hasIP ? '' : undefined, mask: ti.hasIP ? '255.255.255.0' : undefined,
      gw: (ti.hasIP && ti.layer >= 7) ? '' : undefined
    });
    selectedId = devices[devices.length - 1].id;
    updateSelects(container); renderProps(container); draw();
  }));

  /* -- Link type -- */
  container.querySelectorAll('.tb-link-type').forEach(btn => btn.addEventListener('click', () => {
    currentLinkType = btn.dataset.link;
    container.querySelectorAll('.tb-link-type').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }));

  /* -- Canvas mouse -- */
  canvas.addEventListener('mousedown', e => {
    const mx = e.offsetX, my = e.offsetY, hit = hitTest(mx, my);
    if (connectingFrom !== null && hit && hit.id !== connectingFrom) {
      if (!links.some(l => (l.from===connectingFrom && l.to===hit.id) || (l.from===hit.id && l.to===connectingFrom)))
        links.push({ from: connectingFrom, to: hit.id, type: currentLinkType });
      connectingFrom = null; updateSelects(container); renderProps(container); draw(); return;
    }
    if (hit) { selectedId = hit.id; dragging = hit; dragOff = { x: mx - hit.x, y: my - hit.y }; }
    else { selectedId = null; connectingFrom = null; }
    renderProps(container); draw();
  });

  canvas.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dpr = window.devicePixelRatio || 1;
    dragging.x = Math.max(DW/2, Math.min(canvas.width/dpr - DW/2, e.offsetX - dragOff.x));
    dragging.y = Math.max(DH/2, Math.min(canvas.height/dpr - DH/2, e.offsetY - dragOff.y));
    draw();
  });
  canvas.addEventListener('mouseup', () => { dragging = null; });
  canvas.addEventListener('mouseleave', () => { dragging = null; });

  canvas.addEventListener('dblclick', e => {
    const hit = hitTest(e.offsetX, e.offsetY);
    if (hit) { connectingFrom = hit.id; draw(); }
  });

  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    const hit = hitTest(e.offsetX, e.offsetY);
    if (hit) { selectedId = hit.id; renderProps(container); draw(); }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { connectingFrom = null; draw(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      devices = devices.filter(d => d.id !== selectedId);
      links = links.filter(l => l.from !== selectedId && l.to !== selectedId);
      selectedId = null; updateSelects(container); renderProps(container); draw();
    }
  });

  container.querySelector('.tb-send-pkt').addEventListener('click', () => tracePacket(container));

  container.querySelector('.tb-export').addEventListener('click', () => {
    const blob = new Blob([getTopology()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'topology.json'; a.click(); URL.revokeObjectURL(a.href);
  });

  container.querySelector('.tb-clear').addEventListener('click', () => {
    devices = []; links = []; nextId = 1; selectedId = null; connectingFrom = null;
    updateSelects(container); renderProps(container); draw();
  });

  window.addEventListener('resize', () => resizeCanvas());
  renderProps(container); loadPreset('home'); updateSelects(container);
}

/* ---- Init (MutationObserver pattern) ---- */
export function initTopologyBuilder() {
  const container = document.getElementById('labResult-topologyBuilder');
  if (!container) return;
  let built = false;
  const observer = new MutationObserver(() => {
    const parent = document.getElementById('lab-topologyBuilder');
    if (parent && parent.classList.contains('active') && !built) { built = true; buildUI(container); }
    if (parent && parent.classList.contains('active') && canvas) resizeCanvas();
  });
  observer.observe(document.getElementById('section-lab') || document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
}
