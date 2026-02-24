import { labData, getLabBytes } from '../core/lab-data.js';

export function runPacketTransmission(labState) {
  const s = labState.packetTransmission;
  const isTCP = s.protocol === 0;
  const mss = 1460;
  const dataBytes = getLabBytes();
  const dataSize = labData.size;
  const totalSegments = Math.max(Math.ceil(dataSize / mss), 1);
  const segments = [];
  let seqBase = 1000 + Math.floor(Math.random() * 5000);
  let delivered = 0, lost = 0, retransmitted = 0;

  for (let i = 0; i < totalSegments; i++) {
    const offset = i * mss;
    const segSize = Math.min(mss, dataSize - offset);
    const segBytes = dataBytes.slice(offset, offset + segSize);
    const hexPreview = segBytes.slice(0, 12).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    const seq = seqBase + offset;
    const isLost = Math.random() * 100 < s.packetLoss;

    if (isLost) {
      lost++;
      segments.push({ id: i + 1, status: 'lost', seq, size: segSize, hex: hexPreview, offset });
      if (isTCP) {
        retransmitted++;
        segments.push({ id: i + 1, status: 'retransmit', seq, size: segSize, hex: hexPreview, offset });
        delivered++;
      }
    } else {
      delivered++;
      segments.push({ id: i + 1, status: 'ok', seq, size: segSize, hex: hexPreview, offset });
    }
    if (isTCP) {
      segments.push({ id: i + 1, status: 'ack', seq: seq + segSize, size: 0, hex: '', offset });
    }
  }

  const totalTime = (totalSegments * (s.latency / 2) + retransmitted * s.latency).toFixed(0);
  const result = document.getElementById('labResult-packetTransmission');

  result.innerHTML = `
    <div class="lab-result__title">Передача «${labData.type === 'file' ? labData.fileName : labData.text.slice(0, 20)}» (${isTCP ? 'TCP' : 'UDP'})</div>
    <div class="lab-stats">
      <div class="lab-stat"><div class="lab-stat__value">${dataSize}</div><div class="lab-stat__label">Байт данных</div></div>
      <div class="lab-stat"><div class="lab-stat__value">${totalSegments}</div><div class="lab-stat__label">Сегментов</div></div>
      <div class="lab-stat"><div class="lab-stat__value">${delivered}/${totalSegments}</div><div class="lab-stat__label">Доставлено</div></div>
      <div class="lab-stat"><div class="lab-stat__value">${totalTime} мс</div><div class="lab-stat__label">Время</div></div>
    </div>
    <div class="lab-packets">
      ${segments.map((seg, idx) => {
        if (seg.status === 'ack') {
          return `<div class="lab-packet" style="animation:slideIn .3s ease ${idx * 0.04}s both;border-left:3px solid var(--l3)">
            <div class="lab-packet__status lab-packet__status--ok"></div>
            <div class="lab-packet__label" style="color:var(--text-secondary);font-style:italic">← ACK ${seg.seq}</div>
          </div>`;
        }
        const stLabel = seg.status === 'ok' ? '✓ Доставлен' : seg.status === 'lost' ? '✗ Потерян' : '↻ Повтор';
        const stColor = seg.status === 'ok' ? 'var(--l4)' : seg.status === 'lost' ? 'var(--l7)' : 'var(--l5)';
        return `<div class="lab-packet" style="animation:slideIn .3s ease ${idx * 0.04}s both;border-left:3px solid ${stColor}">
          <div class="lab-packet__status lab-packet__status--${seg.status}"></div>
          <div class="lab-packet__label">
            <strong>Seg #${seg.id}</strong> ${stLabel}<br>
            <span style="font-size:.65rem;color:var(--text-secondary)">Seq=${seg.seq} Len=${seg.size}Б [${seg.offset}:${seg.offset + seg.size}]</span><br>
            <span style="font-size:.62rem;font-family:monospace;color:var(--accent)">${seg.hex}${seg.size > 12 ? ' …' : ''}</span>
          </div>
          <div class="lab-packet__size">${seg.size} Б</div>
        </div>`;
      }).join('')}
    </div>
    <div class="card mt-16" style="font-size:.82rem;line-height:1.6">
      <strong>Нарезка:</strong> Ваше сообщение (${dataSize} байт) разрезано на ${totalSegments} TCP-сегментов по ${mss} байт (MSS).
      Каждый сегмент получает Sequence Number = номер первого байта в потоке.
      ${isTCP ? `<br><strong>TCP:</strong> Потеряно ${lost}, повторено ${retransmitted}. Каждый сегмент подтверждается ACK.` : `<br><strong>UDP:</strong> Потеряно ${lost} навсегда. Нет ACK, нет повторов.`}
    </div>
  `;
}
