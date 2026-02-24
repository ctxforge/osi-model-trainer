import { sleep } from '../core/utils.js';
import { addXP, unlockAchievement } from '../core/gamification.js';

export async function runTcpHandshake(labState) {
  const speed = labState.tcpHandshake ? labState.tcpHandshake.speed : 600;
  const result = document.getElementById('labResult-tcpHandshake');

  const clientSeq = 1000 + Math.floor(Math.random() * 9000);
  const serverSeq = 5000 + Math.floor(Math.random() * 9000);

  const steps = [
    { dir: 'right', label: 'SYN', detail: `Seq=${clientSeq}`, color: '#3498db',
      desc: 'Клиент отправляет SYN — запрос на установку соединения. Указывает начальный Sequence Number.' },
    { dir: 'left', label: 'SYN-ACK', detail: `Seq=${serverSeq}, Ack=${clientSeq + 1}`, color: '#2ecc71',
      desc: 'Сервер подтверждает (ACK) и отправляет свой SYN. Указывает свой Sequence Number и подтверждает клиентский +1.' },
    { dir: 'right', label: 'ACK', detail: `Seq=${clientSeq + 1}, Ack=${serverSeq + 1}`, color: '#1abc9c',
      desc: 'Клиент подтверждает SYN сервера. Соединение установлено (ESTABLISHED). Трёхстороннее рукопожатие завершено.' },
    { dir: 'right', label: 'PSH+ACK [Data]', detail: `Seq=${clientSeq + 1}, Len=11`, color: '#e67e22',
      desc: 'Клиент отправляет данные (HTTP-запрос). Флаг PSH указывает серверу передать данные приложению немедленно.' },
    { dir: 'left', label: 'ACK', detail: `Ack=${clientSeq + 12}`, color: '#2ecc71',
      desc: 'Сервер подтверждает получение данных. Acknowledgment = Seq клиента + длина данных.' },
    { dir: 'left', label: 'PSH+ACK [Data]', detail: `Seq=${serverSeq + 1}, Len=42`, color: '#e67e22',
      desc: 'Сервер отправляет ответ (HTTP 200 OK с данными).' },
    { dir: 'right', label: 'ACK', detail: `Ack=${serverSeq + 43}`, color: '#1abc9c',
      desc: 'Клиент подтверждает получение ответа.' },
    { dir: 'right', label: 'FIN+ACK', detail: `Seq=${clientSeq + 12}`, color: '#e74c3c',
      desc: 'Клиент инициирует завершение соединения — отправляет FIN.' },
    { dir: 'left', label: 'FIN+ACK', detail: `Seq=${serverSeq + 43}, Ack=${clientSeq + 13}`, color: '#e74c3c',
      desc: 'Сервер подтверждает FIN клиента и отправляет свой FIN.' },
    { dir: 'right', label: 'ACK', detail: `Ack=${serverSeq + 44}`, color: '#9b59b6',
      desc: 'Клиент подтверждает FIN сервера. Соединение закрыто (CLOSED).' }
  ];

  result.innerHTML = `
    <div class="seq-diagram">
      <div class="seq-cols">
        <div class="seq-col">💻 Клиент</div>
        <div class="seq-col">🖥️ Сервер</div>
      </div>
      <div class="seq-lines" id="seqLines">
        ${steps.map((s, i) => `
          <div class="seq-step" id="seqStep-${i}">
            <div class="seq-arrow seq-arrow--${s.dir}">
              <div class="seq-arrow__line" style="background:${s.color};border-color:${s.color}"></div>
              <div class="seq-arrow__label" style="color:${s.color}">${s.label}</div>
              <div class="seq-arrow__detail">${s.detail}</div>
            </div>
          </div>
          <div class="seq-desc" id="seqDesc-${i}">${s.desc}</div>
        `).join('')}
      </div>
    </div>
  `;

  for (let i = 0; i < steps.length; i++) {
    await sleep(speed);
    const step = document.getElementById('seqStep-' + i);
    const desc = document.getElementById('seqDesc-' + i);
    if (step) step.classList.add('visible');
    if (desc) desc.classList.add('visible');
  }
  unlockAchievement('tcp_hand');
  addXP(5);
}
