import { sleep } from '../core/utils.js';
import { addXP, unlockAchievement } from '../core/gamification.js';
import { OSI_LAYERS } from '../data/osi-layers.js';

export async function runScenario() {
  const result = document.getElementById('labResult-scenario');

  const scenarioSteps = [
    { title: 'Ввод URL в адресную строку', text: 'Пользователь вводит https://example.com в браузер и нажимает Enter.',
      layers: [7], color: '#e74c3c', icon: '⌨️' },
    { title: 'DNS-запрос', text: 'Браузер отправляет DNS-запрос (UDP:53) для определения IP-адреса example.com. DNS-сервер отвечает: 93.184.216.34.',
      layers: [7, 4, 3, 2, 1], color: '#3498db', icon: '🔍' },
    { title: 'ARP-запрос (если нужен)', text: 'Если MAC-адрес шлюза не в ARP-кэше, отправляется ARP-broadcast: «Кто имеет IP 192.168.1.1?». Шлюз отвечает своим MAC.',
      layers: [2, 3], color: '#1abc9c', icon: '📡' },
    { title: 'TCP SYN → Сервер', text: 'Браузер инициирует TCP-соединение: отправляет SYN-сегмент на 93.184.216.34:443. Пакет проходит через маршрутизаторы.',
      layers: [4, 3, 2, 1], color: '#2ecc71', icon: '🤝' },
    { title: 'TCP SYN-ACK ← Сервер', text: 'Сервер отвечает SYN-ACK. Подтверждает запрос клиента и предлагает свой Sequence Number.',
      layers: [4, 3, 2, 1], color: '#2ecc71', icon: '✅' },
    { title: 'TCP ACK → Сервер', text: 'Клиент отправляет ACK. Трёхстороннее рукопожатие завершено — TCP-соединение установлено.',
      layers: [4], color: '#2ecc71', icon: '🔗' },
    { title: 'TLS Handshake', text: 'Клиент и сервер обмениваются ключами шифрования (Client Hello → Server Hello → Certificate → Key Exchange). Устанавливается защищённый канал.',
      layers: [6, 5], color: '#e67e22', icon: '🔐' },
    { title: 'HTTP GET → Сервер', text: 'Браузер отправляет зашифрованный HTTP-запрос: GET / HTTP/1.1. Данные шифруются на уровне представления и передаются через TCP.',
      layers: [7, 6, 5, 4, 3, 2, 1], color: '#e74c3c', icon: '📤' },
    { title: 'HTTP 200 OK ← Сервер', text: 'Сервер отвечает HTTP 200 OK с HTML-страницей. Данные дешифруются и передаются браузеру.',
      layers: [7, 6, 5, 4, 3, 2, 1], color: '#e74c3c', icon: '📥' },
    { title: 'Рендеринг страницы', text: 'Браузер разбирает HTML, загружает CSS/JS/изображения (повторяя цикл DNS → TCP → HTTP для каждого ресурса) и отображает страницу.',
      layers: [7], color: '#9b59b6', icon: '🖼️' }
  ];

  result.innerHTML = `
    <div class="lab-result__title">Что происходит при открытии https://example.com</div>
    <div class="scenario-steps">
      ${scenarioSteps.map((s, i) => `
        <div class="scenario-step" id="scenarioStep-${i}">
          <div class="scenario-step__timeline">
            <div class="scenario-step__dot" style="background:${s.color}">${s.icon}</div>
            <div class="scenario-step__line"></div>
          </div>
          <div class="scenario-step__content">
            <div class="scenario-step__title">${s.title}</div>
            <div class="scenario-step__text">${s.text}</div>
            <div class="scenario-step__layers">
              ${s.layers.map(l => {
                const layer = OSI_LAYERS.find(ol => ol.number === l);
                return `<span class="scenario-step__layer-tag" style="background:${layer.color}">L${l} ${layer.name}</span>`;
              }).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  for (let i = 0; i < scenarioSteps.length; i++) {
    await sleep(500);
    const el = document.getElementById('scenarioStep-' + i);
    if (el) el.classList.add('visible');
  }
  unlockAchievement('scenario_done');
  addXP(5);
}
