/* ============================================================
   Traffic Simulation — Path analysis & performance metrics
   ============================================================ */

const MSS = 1460;  // Maximum Segment Size (bytes)
const MATHIS_C = 1.22;  // Mathis formula constant

/**
 * Analyze a traffic path through the topology.
 * @param {number[]} path - Array of device IDs forming the path
 * @param {Array} topoLinks - All links in the topology
 * @param {Array} topoDevices - All devices in the topology
 * @param {Function} linkInfoFn - Function to get link type info by ID
 * @param {Function} devByIdFn - Function to get device by ID
 * @param {Function} typeInfoFn - Function to get device type info
 * @returns {Object} Analysis result
 */
export function analyzeTrafficPath(path, topoLinks, topoDevices, linkInfoFn, devByIdFn, typeInfoFn) {
  if (!path || path.length < 2) return null;

  const hops = [];
  let totalLatency = 0;
  let effectiveBandwidth = Infinity;
  let cumulativeLossComplement = 1; // Product of (1 - loss_i)
  let bottleneck = null;
  let pathLength = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const fromDev = devByIdFn(path[i]);
    const toDev = devByIdFn(path[i + 1]);
    if (!fromDev || !toDev) continue;

    // Find the link between these devices
    const link = topoLinks.find(l =>
      (l.from === path[i] && l.to === path[i + 1]) ||
      (l.from === path[i + 1] && l.to === path[i])
    );
    if (!link) continue;

    const lt = linkInfoFn(link.type);
    if (!lt) continue;

    const fromInfo = typeInfoFn(fromDev.type);
    const toInfo = typeInfoFn(toDev.type);

    const hop = {
      from: fromDev.name,
      to: toDev.name,
      fromIcon: fromInfo?.icon || '',
      toIcon: toInfo?.icon || '',
      linkType: lt.name,
      linkId: lt.id,
      bw: lt.bw,
      latency: lt.latency,
      loss: lt.loss || 0,
      color: lt.color
    };

    hops.push(hop);
    totalLatency += lt.latency;
    cumulativeLossComplement *= (1 - (lt.loss || 0));

    // Distance between devices (pixel-based approximation)
    const dx = fromDev.x - toDev.x;
    const dy = fromDev.y - toDev.y;
    pathLength += Math.sqrt(dx * dx + dy * dy);

    if (lt.bw < effectiveBandwidth) {
      effectiveBandwidth = lt.bw;
      bottleneck = { linkId: lt.id, linkName: lt.name, bw: lt.bw, hopIndex: i, from: fromDev.name, to: toDev.name };
    }
  }

  const cumulativeLoss = 1 - cumulativeLossComplement;

  // Mathis formula: Throughput ≈ (MSS / RTT) × (C / √loss)
  const rtt = totalLatency * 2; // RTT = 2 × one-way latency (ms)
  let estimatedThroughput = effectiveBandwidth; // Default to BW if no loss
  if (cumulativeLoss > 0 && rtt > 0) {
    // Throughput in bits/s, then convert to Mbit/s
    const throughputBps = (MSS * 8 / (rtt / 1000)) * (MATHIS_C / Math.sqrt(cumulativeLoss));
    estimatedThroughput = Math.min(effectiveBandwidth, throughputBps / 1e6);
  }

  return {
    hops,
    bottleneck,
    totalLatency,
    rtt,
    effectiveBandwidth,
    cumulativeLoss,
    estimatedThroughput,
    hopCount: hops.length,
    pathLength: Math.round(pathLength)
  };
}

/**
 * Render traffic analysis statistics as HTML.
 * @param {HTMLElement} container - Container element for the stats
 * @param {Object} analysis - Result from analyzeTrafficPath
 */
export function renderTrafficStats(container, analysis) {
  if (!analysis || !container) return;

  let html = '<div style="font-size:.78rem">';

  // Per-hop table
  html += `<table style="width:100%;border-collapse:collapse;font-size:.72rem;margin-bottom:10px">
    <thead>
      <tr style="border-bottom:2px solid var(--border);text-align:left">
        <th style="padding:4px 6px">#</th>
        <th style="padding:4px 6px">От → До</th>
        <th style="padding:4px 6px">Канал</th>
        <th style="padding:4px 6px;text-align:right">BW</th>
        <th style="padding:4px 6px;text-align:right">Задержка</th>
        <th style="padding:4px 6px;text-align:right">Потери</th>
      </tr>
    </thead>
    <tbody>`;

  analysis.hops.forEach((hop, i) => {
    const isBottleneck = analysis.bottleneck && analysis.bottleneck.hopIndex === i;
    const rowStyle = isBottleneck ? 'background:rgba(231,76,60,0.12);' : '';
    html += `<tr style="border-bottom:1px solid var(--border);${rowStyle}">
      <td style="padding:4px 6px">${i + 1}</td>
      <td style="padding:4px 6px">${hop.fromIcon} ${hop.from} → ${hop.toIcon} ${hop.to}</td>
      <td style="padding:4px 6px"><span style="color:${hop.color};font-weight:600">${hop.linkType}</span>${isBottleneck ? ' <span style="color:#e74c3c;font-weight:700">⚠ bottleneck</span>' : ''}</td>
      <td style="padding:4px 6px;text-align:right">${formatBW(hop.bw)}</td>
      <td style="padding:4px 6px;text-align:right">${hop.latency} мс</td>
      <td style="padding:4px 6px;text-align:right">${(hop.loss * 100).toFixed(2)}%</td>
    </tr>`;
  });

  html += '</tbody></table>';

  // Summary
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;padding:10px;background:rgba(120,120,140,0.06);border-radius:8px">
    <div>
      <div style="font-size:.65rem;color:var(--text-secondary)">Эффективная пропускная способность</div>
      <div style="font-weight:700;color:${analysis.bottleneck ? '#e74c3c' : '#2ecc71'}">${formatBW(analysis.effectiveBandwidth)}
        ${analysis.bottleneck ? `<span style="font-weight:400;font-size:.65rem"> (bottleneck: ${analysis.bottleneck.from} → ${analysis.bottleneck.to} [${analysis.bottleneck.linkName}])</span>` : ''}</div>
    </div>
    <div>
      <div style="font-size:.65rem;color:var(--text-secondary)">Общая задержка (one-way)</div>
      <div style="font-weight:700">${analysis.totalLatency.toFixed(1)} мс <span style="font-weight:400;font-size:.65rem">(RTT: ${analysis.rtt.toFixed(1)} мс)</span></div>
    </div>
    <div>
      <div style="font-size:.65rem;color:var(--text-secondary)">Совокупные потери</div>
      <div style="font-weight:700;color:${analysis.cumulativeLoss > 0.01 ? '#e74c3c' : '#2ecc71'}">${(analysis.cumulativeLoss * 100).toFixed(2)}%</div>
    </div>
    <div>
      <div style="font-size:.65rem;color:var(--text-secondary)">Оценка throughput (Mathis)</div>
      <div style="font-weight:700;color:#3498db">~ ${analysis.estimatedThroughput.toFixed(1)} Мбит/с</div>
    </div>
    <div>
      <div style="font-size:.65rem;color:var(--text-secondary)">Хопов</div>
      <div style="font-weight:700">${analysis.hopCount}</div>
    </div>
  </div>`;

  // Mathis formula note
  if (analysis.cumulativeLoss > 0) {
    html += `<div style="margin-top:8px;font-size:.65rem;color:var(--text-secondary);font-style:italic">
      Формула Mathis: Throughput ≈ (MSS / RTT) × (C / √loss) = (${MSS} × 8 / ${(analysis.rtt / 1000).toFixed(4)}с) × (${MATHIS_C} / √${analysis.cumulativeLoss.toFixed(6)}) ≈ ${analysis.estimatedThroughput.toFixed(1)} Мбит/с
    </div>`;
  }

  html += '</div>';
  container.innerHTML = html;
}

function formatBW(bw) {
  if (bw >= 1000) return `${(bw / 1000).toFixed(bw % 1000 === 0 ? 0 : 1)} Гбит/с`;
  return `${bw} Мбит/с`;
}

/* ============================================================
   Live Traffic Engine — animated packet flow and real-time metrics
   ============================================================ */

const PROTO_COLORS = {
  TCP: '#3498db',
  UDP: '#2ecc71',
  ARP: '#f1c40f',
  ICMP: '#e74c3c',
  DNS: '#9b59b6',
  DHCP: '#e67e22',
  HTTP: '#1abc9c',
  broadcast: '#f39c12'
};

const TRAFFIC_SCENARIOS = [
  { id: 'idle', name: 'Idle', tip: 'Minimal background traffic — only ARP and occasional pings. Links mostly quiet.', intensity: 0.1 },
  { id: 'normal', name: 'Normal', tip: 'Typical office traffic — web browsing, DNS queries, periodic ARP. Links 20-40% utilized.', intensity: 0.4 },
  { id: 'busy', name: 'Busy', tip: 'Heavy usage — file transfers, streaming, many concurrent connections. Links 60-80% utilized.', intensity: 0.8 },
  { id: 'storm', name: 'Broadcast Storm', tip: 'Network failure: broadcast packets flood all links. Switches forward broadcasts to all ports, causing exponential amplification.', intensity: 1.0, broadcastRatio: 0.8 },
  { id: 'ddos', name: 'DDoS Attack', tip: 'Distributed Denial of Service: many sources flood one target with SYN/UDP packets, exhausting its resources.', intensity: 1.0, targetFocused: true },
  { id: 'dnsflood', name: 'DNS Flood', tip: 'DNS amplification attack: small queries generate large responses, flooding the victim with DNS traffic.', intensity: 0.9, dnsHeavy: true }
];

/**
 * Live Traffic Engine state and control.
 * Call startLiveTraffic(devices, links, ...) to begin simulation.
 */

let liveState = {
  running: false,
  scenario: 'normal',
  intensity: 0.4,
  packets: [],       // active animated packets on canvas
  metrics: new Map(), // linkKey -> { pps, bps, utilization, latency, loss }
  deviceMetrics: new Map(), // deviceId -> { txPps, rxPps, txBps, rxBps }
  intervalId: null,
  animFrameId: null,
  tick: 0,
  // References to topology data (set by startLiveTraffic)
  devices: [],
  links: [],
  linkInfoFn: null,
  devByIdFn: null,
  canvas: null,
  ctx: null,
  drawCallback: null // callback to redraw topology under packets
};

export function startLiveTraffic(devices, links, linkInfoFn, devByIdFn, canvas, drawCallback) {
  liveState.devices = devices;
  liveState.links = links;
  liveState.linkInfoFn = linkInfoFn;
  liveState.devByIdFn = devByIdFn;
  liveState.canvas = canvas;
  liveState.ctx = canvas?.getContext('2d');
  liveState.drawCallback = drawCallback;
  liveState.running = true;
  liveState.packets = [];
  liveState.tick = 0;

  // Generate initial metrics
  updateMetrics();

  // Packet generation interval (100ms ticks)
  liveState.intervalId = setInterval(() => {
    if (!liveState.running) return;
    liveState.tick++;
    generateTrafficTick();
    updateMetrics();
  }, 100);

  // Animation loop
  animatePackets();
}

export function stopLiveTraffic() {
  liveState.running = false;
  if (liveState.intervalId) clearInterval(liveState.intervalId);
  if (liveState.animFrameId) cancelAnimationFrame(liveState.animFrameId);
  liveState.packets = [];
  liveState.intervalId = null;
  liveState.animFrameId = null;
}

export function setTrafficScenario(scenarioId) {
  const scenario = TRAFFIC_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) return;
  liveState.scenario = scenarioId;
  liveState.intensity = scenario.intensity;
}

export function getLiveMetrics() {
  return {
    linkMetrics: liveState.metrics,
    deviceMetrics: liveState.deviceMetrics,
    packets: liveState.packets,
    scenario: liveState.scenario,
    running: liveState.running
  };
}

export function getTrafficScenarios() {
  return TRAFFIC_SCENARIOS;
}

export { PROTO_COLORS };

/* ---- Packet Generation ---- */

function generateTrafficTick() {
  const { devices, links, intensity, scenario } = liveState;
  if (devices.length < 2 || links.length === 0) return;

  const scenarioObj = TRAFFIC_SCENARIOS.find(s => s.id === scenario);

  // Number of packets to generate this tick
  const basePackets = Math.floor(intensity * links.length * 0.5) + 1;
  const count = Math.floor(basePackets * (0.5 + Math.random()));

  for (let i = 0; i < count; i++) {
    const link = links[Math.floor(Math.random() * links.length)];
    const fromDev = liveState.devByIdFn(link.from);
    const toDev = liveState.devByIdFn(link.to);
    if (!fromDev || !toDev) continue;

    // Direction (randomly forward or backward)
    const forward = Math.random() > 0.5;
    const src = forward ? fromDev : toDev;
    const dst = forward ? toDev : fromDev;

    // Protocol selection based on scenario
    let proto;
    if (scenarioObj?.broadcastRatio && Math.random() < scenarioObj.broadcastRatio) {
      proto = 'broadcast';
    } else if (scenarioObj?.dnsHeavy && Math.random() < 0.6) {
      proto = 'DNS';
    } else if (scenarioObj?.targetFocused && Math.random() < 0.7) {
      proto = 'TCP'; // SYN flood
    } else {
      const protos = ['TCP', 'TCP', 'TCP', 'UDP', 'ARP', 'DNS', 'HTTP', 'ICMP'];
      proto = protos[Math.floor(Math.random() * protos.length)];
    }

    // Create animated packet
    liveState.packets.push({
      srcX: src.x, srcY: src.y,
      dstX: dst.x, dstY: dst.y,
      progress: 0, // 0 to 1
      speed: 0.02 + Math.random() * 0.03, // progress per frame
      proto,
      color: PROTO_COLORS[proto] || '#888',
      linkFrom: link.from,
      linkTo: link.to,
      size: proto === 'ARP' ? 28 : proto === 'ICMP' ? 64 : 200 + Math.floor(Math.random() * 1200)
    });
  }

  // Limit total active packets to prevent memory issues
  if (liveState.packets.length > 200) {
    liveState.packets = liveState.packets.slice(-150);
  }
}

/* ---- Metrics Update ---- */

function updateMetrics() {
  const { links, packets, devices } = liveState;

  // Per-link metrics
  liveState.metrics = new Map();
  links.forEach(link => {
    const key = `${Math.min(link.from, link.to)}-${Math.max(link.from, link.to)}`;
    const lt = liveState.linkInfoFn?.(link.type);
    const linkPackets = packets.filter(p =>
      (p.linkFrom === link.from && p.linkTo === link.to) ||
      (p.linkFrom === link.to && p.linkTo === link.from)
    );

    const pps = linkPackets.length * 10; // extrapolate from 100ms window
    const bps = linkPackets.reduce((sum, p) => sum + p.size * 8, 0) * 10;
    const maxBps = (lt?.bw || 1000) * 1e6;
    const utilization = Math.min(100, (bps / maxBps) * 100);
    const latency = (lt?.latency || 1) * (1 + utilization / 200); // congestion adds latency
    const loss = (lt?.loss || 0) + (utilization > 80 ? (utilization - 80) * 0.01 : 0);

    liveState.metrics.set(key, { pps, bps, utilization, latency, loss: loss * 100 });
  });

  // Per-device metrics
  liveState.deviceMetrics = new Map();
  devices.forEach(dev => {
    const txPackets = packets.filter(p => {
      const src = liveState.devByIdFn(p.linkFrom);
      return src && src.id === dev.id;
    });
    const rxPackets = packets.filter(p => {
      const dst = liveState.devByIdFn(p.linkTo);
      return dst && dst.id === dev.id;
    });

    liveState.deviceMetrics.set(dev.id, {
      txPps: txPackets.length * 10,
      rxPps: rxPackets.length * 10,
      txBps: txPackets.reduce((s, p) => s + p.size * 8, 0) * 10,
      rxBps: rxPackets.reduce((s, p) => s + p.size * 8, 0) * 10
    });
  });
}

/* ---- Animation Loop ---- */

function animatePackets() {
  if (!liveState.running) return;
  liveState.animFrameId = requestAnimationFrame(animatePackets);

  // Update packet positions
  liveState.packets = liveState.packets.filter(p => {
    p.progress += p.speed;
    return p.progress < 1;
  });

  // Redraw
  if (liveState.drawCallback) liveState.drawCallback();
  drawPackets();
}

function drawPackets() {
  const ctx = liveState.ctx;
  if (!ctx) return;

  liveState.packets.forEach(p => {
    const x = p.srcX + (p.dstX - p.srcX) * p.progress;
    const y = p.srcY + (p.dstY - p.srcY) * p.progress;
    const radius = 3;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();

    // Glow
    ctx.beginPath();
    ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = p.color + '33';
    ctx.fill();
  });
}

/**
 * Draw link utilization overlays on topology canvas.
 * Call this after drawing links but before drawing devices.
 */
export function drawLinkUtilization(ctx, links, devByIdFn) {
  if (!liveState.running) return;

  links.forEach(link => {
    const key = `${Math.min(link.from, link.to)}-${Math.max(link.from, link.to)}`;
    const metrics = liveState.metrics.get(key);
    if (!metrics) return;

    const from = devByIdFn(link.from);
    const to = devByIdFn(link.to);
    if (!from || !to) return;

    // Draw utilization indicator as line thickness/color
    const util = metrics.utilization;
    const color = util < 50 ? '#2ecc7144' : util < 80 ? '#f1c40f44' : '#e74c3c44';
    const width = 2 + util / 10;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  });
}

/**
 * Build live traffic control panel HTML.
 * @returns {string} HTML for the control panel
 */
export function buildLiveTrafficControls() {
  return `
    <div class="lt-controls">
      <div class="lt-controls__header">
        <span data-tip="Live Traffic Engine simulates realistic network activity with animated packets">Live Traffic</span>
        <button class="sg-btn sg-btn--sm" id="ltToggle" data-tip="Start or stop the live traffic simulation">${liveState.running ? '■ Stop' : '▶ Start'}</button>
      </div>
      <div class="lt-controls__row">
        <div class="lt-field">
          <label data-tip="Traffic pattern determines what types of packets are generated and how intensely">Scenario</label>
          <select class="sa-select" id="ltScenario">
            ${TRAFFIC_SCENARIOS.map(s => `<option value="${s.id}" data-tip="${s.tip}"${s.id === liveState.scenario ? ' selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="lt-field">
          <label data-tip="Controls how many packets are generated per second. Higher = more traffic on all links.">Intensity</label>
          <input type="range" id="ltIntensity" min="0" max="1" step="0.05" value="${liveState.intensity}" data-tip="0 = no traffic, 0.5 = moderate, 1.0 = maximum">
        </div>
      </div>
      <div class="lt-legend" data-tip="Protocol color coding for animated packets">
        ${Object.entries(PROTO_COLORS).map(([proto, color]) =>
          `<span class="lt-legend__item"><span class="lt-legend__dot" style="background:${color}" data-tip="${proto} packets are shown in this color"></span>${proto}</span>`
        ).join('')}
      </div>
    </div>
  `;
}

/**
 * Render real-time metrics panel.
 * @param {HTMLElement} container
 */
export function renderLiveMetrics(container) {
  if (!container || !liveState.running) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = '<div class="lt-metrics" style="font-size:.72rem">';
  html += '<div class="lt-metrics__title" data-tip="Per-link network performance metrics updated in real-time">Link Metrics</div>';

  html += '<table style="width:100%;border-collapse:collapse;font-size:.68rem">';
  html += '<thead><tr>';
  html += '<th style="padding:3px 4px;text-align:left" data-tip="Link identifier">Link</th>';
  html += '<th style="padding:3px 4px;text-align:right" data-tip="Packets per second on this link">PPS</th>';
  html += '<th style="padding:3px 4px;text-align:right" data-tip="Bandwidth utilization as percentage of link capacity">Util%</th>';
  html += '<th style="padding:3px 4px;text-align:right" data-tip="Current latency including congestion delay">Latency</th>';
  html += '<th style="padding:3px 4px;text-align:right" data-tip="Packet loss percentage — increases with congestion">Loss%</th>';
  html += '</tr></thead><tbody>';

  liveState.metrics.forEach((m, key) => {
    const utilColor = m.utilization < 50 ? '#2ecc71' : m.utilization < 80 ? '#f1c40f' : '#e74c3c';
    html += `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:3px 4px">${key}</td>
      <td style="padding:3px 4px;text-align:right">${m.pps}</td>
      <td style="padding:3px 4px;text-align:right;color:${utilColor};font-weight:600">${m.utilization.toFixed(1)}%</td>
      <td style="padding:3px 4px;text-align:right">${m.latency.toFixed(1)} ms</td>
      <td style="padding:3px 4px;text-align:right;color:${m.loss > 1 ? '#e74c3c' : 'inherit'}">${m.loss.toFixed(2)}%</td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}
