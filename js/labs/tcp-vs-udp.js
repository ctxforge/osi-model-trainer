import { sleep } from '../core/utils.js';
import { addXP, unlockAchievement } from '../core/gamification.js';

export async function runTcpVsUdp(labState) {
  const s = labState.tcpVsUdp || { packetLoss: 20, speed: 350 };
  const loss = s.packetLoss;
  const speed = s.speed;
  const totalPkts = 8;
  const result = document.getElementById('labResult-tcpVsUdp');

  const fate = [];
  for (let i = 0; i < totalPkts; i++) {
    fate.push(Math.random() * 100 < loss);
  }

  const tcpEvents = [];
  const udpEvents = [];

  for (let i = 0; i < totalPkts; i++) {
    if (fate[i]) {
      tcpEvents.push({ type: 'lost', label: `Пакет #${i + 1} — потерян` });
      tcpEvents.push({ type: 'retransmit', label: `Пакет #${i + 1} — повтор` });
      tcpEvents.push({ type: 'ack', label: `ACK #${i + 1}` });
      udpEvents.push({ type: 'lost', label: `Пакет #${i + 1} — потерян` });
    } else {
      tcpEvents.push({ type: 'ok', label: `Пакет #${i + 1}` });
      tcpEvents.push({ type: 'ack', label: `ACK #${i + 1}` });
      udpEvents.push({ type: 'ok', label: `Пакет #${i + 1}` });
    }
  }

  const tcpDelivered = totalPkts;
  const udpDelivered = fate.filter(f => !f).length;
  const udpLost = totalPkts - udpDelivered;
  const tcpRetransmits = fate.filter(f => f).length;

  result.innerHTML = `
    <div class="lab-result__title">Параллельная передача ${totalPkts} пакетов (потери: ${loss}%)</div>
    <div class="versus-grid">
      <div class="versus-col">
        <div class="versus-col__header" style="background:var(--l4)">TCP</div>
        <div class="versus-col__body" id="vsTcpBody">
          ${tcpEvents.map((e, i) => `<div class="versus-pkt versus-pkt--${e.type}" id="vsTcp-${i}"><div class="versus-pkt__dot"></div>${e.label}</div>`).join('')}
        </div>
      </div>
      <div class="versus-col">
        <div class="versus-col__header" style="background:var(--l7)">UDP</div>
        <div class="versus-col__body" id="vsUdpBody">
          ${udpEvents.map((e, i) => `<div class="versus-pkt versus-pkt--${e.type}" id="vsUdp-${i}"><div class="versus-pkt__dot"></div>${e.label}</div>`).join('')}
        </div>
      </div>
    </div>
    <div class="versus-summary">
      <div class="lab-stats">
        <div class="lab-stat">
          <div class="lab-stat__value" style="color:var(--l4)">${tcpDelivered}/${totalPkts}</div>
          <div class="lab-stat__label">TCP доставлено</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value" style="color:var(--l7)">${udpDelivered}/${totalPkts}</div>
          <div class="lab-stat__label">UDP доставлено</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${tcpRetransmits}</div>
          <div class="lab-stat__label">TCP повторов</div>
        </div>
        <div class="lab-stat">
          <div class="lab-stat__value">${udpLost}</div>
          <div class="lab-stat__label">UDP потеряно</div>
        </div>
      </div>
      <div class="card mt-12" style="font-size:.82rem;line-height:1.6">
        <strong>TCP:</strong> Гарантировал доставку всех ${totalPkts} пакетов${tcpRetransmits > 0 ? `, выполнив ${tcpRetransmits} повторных передач` : ''}. Каждый пакет подтверждается (ACK). Надёжно, но медленнее.<br><br>
        <strong>UDP:</strong> Доставил ${udpDelivered} из ${totalPkts}. ${udpLost > 0 ? `Потерял ${udpLost} пакетов безвозвратно.` : 'Все пакеты дошли (повезло).'} Без подтверждений и повторов — быстро, но ненадёжно. Используется для видео, VoIP, игр.
      </div>
    </div>
  `;

  let ti = 0, ui = 0;
  const maxLen = Math.max(tcpEvents.length, udpEvents.length);
  for (let step = 0; step < maxLen; step++) {
    await sleep(speed);
    if (ti < tcpEvents.length) {
      const el = document.getElementById('vsTcp-' + ti);
      if (el) el.classList.add('visible');
      ti++;
    }
    if (ui < udpEvents.length) {
      const el = document.getElementById('vsUdp-' + ui);
      if (el) el.classList.add('visible');
      ui++;
    }
  }
  while (ti < tcpEvents.length) {
    await sleep(speed);
    const el = document.getElementById('vsTcp-' + ti);
    if (el) el.classList.add('visible');
    ti++;
  }
  unlockAchievement('tcp_vs_udp');
  addXP(5);
}
