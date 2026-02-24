import { addXP, unlockAchievement } from '../core/gamification.js';

export function runIpCalc(labState) {
  unlockAchievement('ip_calc');
  addXP(3);
  const s = labState.ipCalc;
  const ipStr = s.ip;
  const cidr = s.cidr;

  const octets = ipStr.split('.').map(Number);
  if (octets.length !== 4 || octets.some(o => isNaN(o) || o < 0 || o > 255)) {
    document.getElementById('labResult-ipCalc').innerHTML = '<div class="card" style="color:#e74c3c">Неверный IP-адрес. Формат: 0-255.0-255.0-255.0-255</div>';
    return;
  }

  const ipNum = (octets[0] << 24 | octets[1] << 16 | octets[2] << 8 | octets[3]) >>> 0;
  const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | ~maskNum) >>> 0;
  const firstHost = (networkNum + 1) >>> 0;
  const lastHost = (broadcastNum - 1) >>> 0;
  const totalHosts = Math.pow(2, 32 - cidr) - 2;

  function numToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }

  function numToBin(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
      .map(o => o.toString(2).padStart(8, '0')).join('.');
  }

  const ipBin = numToBin(ipNum);
  const netBits = ipBin.replace(/\./g, '').substring(0, cidr);
  const hostBits = ipBin.replace(/\./g, '').substring(cidr);

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
