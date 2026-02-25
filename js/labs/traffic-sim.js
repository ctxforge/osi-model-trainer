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
