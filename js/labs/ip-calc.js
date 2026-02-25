import { addXP, unlockAchievement } from '../core/gamification.js';

/* ========== Helpers ========== */
function numToIp(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function numToBin(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
    .map(o => o.toString(2).padStart(8, '0')).join('.');
}

function ipToNum(ipStr) {
  const o = ipStr.split('.').map(Number);
  return (o[0] << 24 | o[1] << 16 | o[2] << 8 | o[3]) >>> 0;
}

/* ========== IPv4 Calculator (original) ========== */
export function runIpCalc(labState) {
  unlockAchievement('ip_calc');
  addXP(3);
  const mode = labState.ipCalc?.mode ?? 0;

  if (mode === 1) return runIpv6Calc(labState);
  if (mode === 2) return runVlsmCalc(labState);
  if (mode === 3) return runSummarize(labState);

  const s = labState.ipCalc;
  const ipStr = s.ip;
  const cidr = s.cidr;

  const octets = ipStr.split('.').map(Number);
  if (octets.length !== 4 || octets.some(o => isNaN(o) || o < 0 || o > 255)) {
    document.getElementById('labResult-ipCalc').innerHTML = '<div class="card" style="color:#e74c3c">Неверный IP-адрес. Формат: 0-255.0-255.0-255.0-255</div>';
    return;
  }

  const ipNum = ipToNum(ipStr);
  const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | ~maskNum) >>> 0;
  const firstHost = (networkNum + 1) >>> 0;
  const lastHost = (broadcastNum - 1) >>> 0;
  const totalHosts = Math.pow(2, 32 - cidr) - 2;
  const wildcardNum = (~maskNum) >>> 0;

  const ipBin = numToBin(ipNum);
  const netBits = ipBin.replace(/\./g, '').substring(0, cidr);
  const hostBits = ipBin.replace(/\./g, '').substring(cidr);

  // Determine class
  const firstOctet = octets[0];
  let ipClass = 'E';
  if (firstOctet < 128) ipClass = 'A';
  else if (firstOctet < 192) ipClass = 'B';
  else if (firstOctet < 224) ipClass = 'C';
  else if (firstOctet < 240) ipClass = 'D (multicast)';

  const result = document.getElementById('labResult-ipCalc');
  result.innerHTML = `
    <div class="lab-result__title">Результат расчёта</div>
    <div class="ip-result-grid">
      <div class="ip-result-row">
        <span class="ip-result-row__label">IP-адрес</span>
        <span class="ip-result-row__value">${ipStr}/${cidr}</span>
      </div>
      <div class="ip-result-row">
        <span class="ip-result-row__label">Маска подсети</span>
        <span class="ip-result-row__value">${numToIp(maskNum)}</span>
      </div>
      <div class="ip-result-row">
        <span class="ip-result-row__label">Wildcard-маска</span>
        <span class="ip-result-row__value">${numToIp(wildcardNum)}</span>
      </div>
      <div class="ip-result-row">
        <span class="ip-result-row__label">Адрес сети</span>
        <span class="ip-result-row__value">${numToIp(networkNum)}</span>
      </div>
      <div class="ip-result-row">
        <span class="ip-result-row__label">Широковещательный</span>
        <span class="ip-result-row__value">${numToIp(broadcastNum)}</span>
      </div>
      <div class="ip-result-row">
        <span class="ip-result-row__label">Первый хост</span>
        <span class="ip-result-row__value">${numToIp(firstHost)}</span>
      </div>
      <div class="ip-result-row">
        <span class="ip-result-row__label">Последний хост</span>
        <span class="ip-result-row__value">${numToIp(lastHost)}</span>
      </div>
      <div class="ip-result-row">
        <span class="ip-result-row__label">Хостов в подсети</span>
        <span class="ip-result-row__value">${totalHosts > 0 ? totalHosts.toLocaleString() : 0}</span>
      </div>
      <div class="ip-result-row">
        <span class="ip-result-row__label">Класс</span>
        <span class="ip-result-row__value">${ipClass}</span>
      </div>
    </div>
    <div class="ip-binary mt-16">
      <div style="margin-bottom:6px;color:var(--text-secondary);font-size:.7rem">IP в двоичном виде (сеть | хост):</div>
      <span class="ip-binary__net">${netBits}</span><span class="ip-binary__host">${hostBits}</span>
      <div style="margin-top:6px;font-size:.68rem;color:var(--text-secondary)">
        <span class="ip-binary__net">■</span> Сетевая часть (${cidr} бит) &nbsp;
        <span class="ip-binary__host">■</span> Хостовая часть (${32 - cidr} бит)
      </div>
    </div>
  `;
}

/* ========== IPv6 Calculator ========== */
function runIpv6Calc(labState) {
  const s = labState.ipCalc;
  const input = (s.ipv6 || '2001:db8::1').trim();
  const prefix = parseInt(s.ipv6prefix) || 64;

  const result = document.getElementById('labResult-ipCalc');

  // Expand IPv6
  let full;
  try { full = expandIPv6(input); } catch {
    result.innerHTML = '<div class="card" style="color:#e74c3c">Неверный IPv6-адрес</div>';
    return;
  }

  const short = shortenIPv6(full);

  // Determine type
  let addrType = 'Global Unicast';
  if (full.startsWith('fe80')) addrType = 'Link-Local';
  else if (full.startsWith('ff')) addrType = 'Multicast';
  else if (full === '0000:0000:0000:0000:0000:0000:0000:0001') addrType = 'Loopback (::1)';
  else if (full === '0000:0000:0000:0000:0000:0000:0000:0000') addrType = 'Unspecified (::)';
  else if (full.startsWith('fc') || full.startsWith('fd')) addrType = 'Unique Local (ULA)';

  // Network prefix
  const groups = full.split(':');
  const allBits = groups.map(g => parseInt(g, 16).toString(2).padStart(16, '0')).join('');
  const netPart = allBits.substring(0, prefix);
  const hostPart = allBits.substring(prefix);
  const netHex = [];
  for (let i = 0; i < 128; i += 16) {
    const bits = (netPart + '0'.repeat(128)).substring(i, i + 16);
    netHex.push(parseInt(bits, 2).toString(16).padStart(4, '0'));
  }

  result.innerHTML = `
    <div class="lab-result__title">IPv6 — Результат</div>
    <div class="ip-result-grid">
      <div class="ip-result-row"><span class="ip-result-row__label">Полный адрес</span><span class="ip-result-row__value" style="font-size:.72rem">${full}</span></div>
      <div class="ip-result-row"><span class="ip-result-row__label">Сокращённый</span><span class="ip-result-row__value">${short}/${prefix}</span></div>
      <div class="ip-result-row"><span class="ip-result-row__label">Тип адреса</span><span class="ip-result-row__value">${addrType}</span></div>
      <div class="ip-result-row"><span class="ip-result-row__label">Префикс сети</span><span class="ip-result-row__value" style="font-size:.72rem">${shortenIPv6(netHex.join(':'))}/${prefix}</span></div>
      <div class="ip-result-row"><span class="ip-result-row__label">Хостов</span><span class="ip-result-row__value">${prefix >= 128 ? '1' : '2^' + (128 - prefix)}</span></div>
    </div>
    <div class="ip-binary mt-16">
      <div style="margin-bottom:6px;color:var(--text-secondary);font-size:.7rem">Двоичное представление (префикс | идентификатор):</div>
      <div style="word-break:break-all;font-family:monospace;font-size:.62rem;line-height:1.6">
        <span class="ip-binary__net">${netPart}</span><span class="ip-binary__host">${hostPart}</span>
      </div>
      <div style="margin-top:6px;font-size:.68rem;color:var(--text-secondary)">
        <span class="ip-binary__net">■</span> Сетевой префикс (${prefix} бит) &nbsp;
        <span class="ip-binary__host">■</span> Идентификатор интерфейса (${128 - prefix} бит)
      </div>
    </div>
  `;
}

function expandIPv6(addr) {
  if (addr.includes('::')) {
    const parts = addr.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    const mid = Array(missing).fill('0000');
    const all = [...left, ...mid, ...right];
    return all.map(g => g.padStart(4, '0')).join(':');
  }
  return addr.split(':').map(g => g.padStart(4, '0')).join(':');
}

function shortenIPv6(full) {
  let groups = full.split(':').map(g => g.replace(/^0+/, '') || '0');
  // Find longest run of '0' groups
  let best = { start: -1, len: 0 }, cur = { start: -1, len: 0 };
  groups.forEach((g, i) => {
    if (g === '0') {
      if (cur.start === -1) cur.start = i;
      cur.len++;
      if (cur.len > best.len) { best.start = cur.start; best.len = cur.len; }
    } else { cur = { start: -1, len: 0 }; }
  });
  if (best.len > 1) {
    const before = groups.slice(0, best.start).join(':');
    const after = groups.slice(best.start + best.len).join(':');
    return (before || '') + '::' + (after || '');
  }
  return groups.join(':');
}

/* ========== VLSM Planner ========== */
function runVlsmCalc(labState) {
  const s = labState.ipCalc;
  const baseNet = s.vlsmBase || '192.168.1.0/24';
  const subnetsInput = s.vlsmSubnets || '50,30,10,5';

  const result = document.getElementById('labResult-ipCalc');

  const match = baseNet.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  if (!match) { result.innerHTML = '<div class="card" style="color:#e74c3c">Формат: IP/CIDR (напр. 192.168.1.0/24)</div>'; return; }

  const baseIp = ipToNum(match[1]);
  const baseCidr = parseInt(match[2]);
  const hostsNeeded = subnetsInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);

  if (hostsNeeded.length === 0) { result.innerHTML = '<div class="card" style="color:#e74c3c">Введите количество хостов через запятую</div>'; return; }

  // Sort descending
  const sorted = hostsNeeded.map((h, i) => ({ hosts: h, idx: i })).sort((a, b) => b.hosts - a.hosts);

  let currentIp = baseIp;
  const subnets = [];
  let error = null;

  for (const sub of sorted) {
    // Find smallest CIDR that fits
    let bits = 1;
    while (Math.pow(2, bits) - 2 < sub.hosts) bits++;
    const cidr = 32 - bits;
    if (cidr < baseCidr) { error = `Подсеть для ${sub.hosts} хостов (/${cidr}) не помещается в /${baseCidr}`; break; }

    const blockSize = Math.pow(2, bits);
    // Align to block boundary
    const alignedIp = (Math.ceil(currentIp / blockSize) * blockSize) >>> 0;
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const broadcast = (alignedIp | ~mask) >>> 0;
    const wildcard = (~mask) >>> 0;

    subnets.push({
      name: `Подсеть ${sub.idx + 1}`,
      needed: sub.hosts,
      network: numToIp(alignedIp),
      cidr,
      mask: numToIp(mask),
      wildcard: numToIp(wildcard),
      broadcast: numToIp(broadcast),
      firstHost: numToIp((alignedIp + 1) >>> 0),
      lastHost: numToIp((broadcast - 1) >>> 0),
      available: Math.pow(2, 32 - cidr) - 2
    });

    currentIp = broadcast + 1;
  }

  let html = `<div class="lab-result__title">VLSM-планировщик</div>
    <div style="font-size:.75rem;color:var(--text-secondary);margin-bottom:10px">База: ${baseNet} | Подсети: ${hostsNeeded.join(', ')} хостов</div>`;

  if (error) html += `<div class="card" style="color:#e74c3c;margin-bottom:10px">${error}</div>`;

  subnets.forEach(s => {
    html += `<div class="card" style="margin-bottom:8px;padding:10px">
      <div style="font-weight:700;margin-bottom:6px">${s.name} (нужно ${s.needed}, доступно ${s.available})</div>
      <div class="ip-result-grid" style="gap:4px">
        <div class="ip-result-row"><span class="ip-result-row__label">Сеть</span><span class="ip-result-row__value">${s.network}/${s.cidr}</span></div>
        <div class="ip-result-row"><span class="ip-result-row__label">Маска</span><span class="ip-result-row__value">${s.mask}</span></div>
        <div class="ip-result-row"><span class="ip-result-row__label">Wildcard</span><span class="ip-result-row__value">${s.wildcard}</span></div>
        <div class="ip-result-row"><span class="ip-result-row__label">Диапазон</span><span class="ip-result-row__value" style="font-size:.72rem">${s.firstHost} — ${s.lastHost}</span></div>
        <div class="ip-result-row"><span class="ip-result-row__label">Broadcast</span><span class="ip-result-row__value">${s.broadcast}</span></div>
      </div>
    </div>`;
  });

  result.innerHTML = html;
}

/* ========== Route Summarization ========== */
function runSummarize(labState) {
  const s = labState.ipCalc;
  const input = s.summarizeNets || '192.168.1.0/24, 192.168.2.0/24, 192.168.3.0/24';
  const result = document.getElementById('labResult-ipCalc');

  const networks = input.split(',').map(n => n.trim()).filter(n => n.match(/^\d+\.\d+\.\d+\.\d+\/\d+$/));
  if (networks.length < 2) { result.innerHTML = '<div class="card" style="color:#e74c3c">Введите минимум 2 подсети через запятую (напр. 192.168.1.0/24, 192.168.2.0/24)</div>'; return; }

  const netNums = networks.map(n => {
    const [ip, cidr] = n.split('/');
    const num = ipToNum(ip);
    return { ip, cidr: parseInt(cidr), num };
  });

  // Find common prefix bits
  let commonBits = 32;
  for (let i = 0; i < netNums.length - 1; i++) {
    const xor = netNums[i].num ^ netNums[i + 1].num;
    if (xor === 0) continue;
    const diffBit = 31 - Math.floor(Math.log2(xor));
    commonBits = Math.min(commonBits, diffBit);
  }

  const summaryMask = commonBits === 0 ? 0 : (~0 << (32 - commonBits)) >>> 0;
  const summaryNet = (netNums[0].num & summaryMask) >>> 0;

  let html = `<div class="lab-result__title">Суммаризация маршрутов</div>
    <div style="font-size:.75rem;color:var(--text-secondary);margin-bottom:10px">Исходные подсети:</div>
    <div class="ip-result-grid" style="margin-bottom:12px">
      ${networks.map(n => `<div class="ip-result-row"><span class="ip-result-row__value">${n}</span></div>`).join('')}
    </div>
    <div style="text-align:center;font-size:1.2rem;color:var(--text-secondary);margin:8px 0">↓ Агрегированный маршрут ↓</div>
    <div class="card" style="text-align:center;padding:16px;border-color:var(--accent)">
      <div style="font-size:1.3rem;font-weight:800;color:var(--accent);font-family:monospace">${numToIp(summaryNet)}/${commonBits}</div>
      <div style="font-size:.75rem;color:var(--text-secondary);margin-top:4px">Маска: ${numToIp(summaryMask)} | Покрывает ${Math.pow(2, 32 - commonBits).toLocaleString()} адресов</div>
    </div>
    <div class="ip-binary mt-16">
      <div style="margin-bottom:6px;color:var(--text-secondary);font-size:.7rem">Двоичное сравнение (совпадающие биты выделены):</div>
      ${netNums.map(n => {
        const bin = numToBin(n.num).replace(/\./g, '');
        return `<div style="font-family:monospace;font-size:.62rem;line-height:1.6"><span class="ip-binary__net">${bin.substring(0, commonBits)}</span><span class="ip-binary__host">${bin.substring(commonBits)}</span> <span style="color:var(--text-secondary)">${n.ip}/${n.cidr}</span></div>`;
      }).join('')}
    </div>
  `;

  result.innerHTML = html;
}
