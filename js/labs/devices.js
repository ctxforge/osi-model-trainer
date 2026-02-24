import { OSI_LAYERS } from '../data/osi-layers.js';

export function initDevicesLab() {
  const result = document.getElementById('labResult-devices');

  const devicesInfo = {
    hub: {
      name: 'Хаб (Hub)', layer: 1, icon: '🔌',
      description: 'Хаб работает на L1 (физический). Он не анализирует адреса — просто повторяет электрический сигнал на ВСЕ порты, кроме входящего. Все устройства получают кадр, даже если он предназначен не им.',
      behavior: [true, true, true]
    },
    switch_: {
      name: 'Коммутатор (Switch)', layer: 2, icon: '🔀',
      description: 'Коммутатор работает на L2 (канальный). Он читает MAC-адрес назначения в кадре и отправляет его ТОЛЬКО на нужный порт. Ведёт MAC-таблицу: какой MAC на каком порту.',
      behavior: [false, false, true]
    },
    router: {
      name: 'Маршрутизатор (Router)', layer: 3, icon: '🌐',
      description: 'Маршрутизатор работает на L3 (сетевой). Он анализирует IP-адрес назначения и перенаправляет пакет в нужную подсеть. Меняет MAC-заголовок (L2) при пересылке, но IP остаётся прежним.',
      behavior: [false, false, true]
    }
  };

  let activeDevice = 'hub';

  function renderDevices() {
    const dev = devicesInfo[activeDevice];
    const layerData = OSI_LAYERS.find(l => l.number === dev.layer);

    result.innerHTML = `
      <div class="device-tabs">
        ${Object.entries(devicesInfo).map(([key, d]) => `
          <button class="device-tab${key === activeDevice ? ' active' : ''}" data-dev="${key}">
            ${d.icon} ${d.name.split(' ')[0]}
          </button>
        `).join('')}
      </div>
      <div class="device-network">
        <div class="device-nodes">
          <div class="device-node" id="devNode-0">
            <div class="device-node__icon" style="${dev.behavior[0] ? 'border-color:var(--l4);box-shadow:0 0 8px rgba(46,204,113,.3)' : ''}">💻</div>
            <div class="device-node__label">PC-A<br><span style="font-size:.55rem;color:var(--text-secondary)">192.168.1.10</span></div>
          </div>
          <div class="device-node" id="devNode-1">
            <div class="device-node__icon" style="${dev.behavior[1] ? 'border-color:var(--l4);box-shadow:0 0 8px rgba(46,204,113,.3)' : ''}">💻</div>
            <div class="device-node__label">PC-B<br><span style="font-size:.55rem;color:var(--text-secondary)">192.168.1.20</span></div>
          </div>
          <div class="device-node" id="devNode-2">
            <div class="device-node__icon" style="border-color:var(--l4);box-shadow:0 0 8px rgba(46,204,113,.3)">💻</div>
            <div class="device-node__label">PC-C<br><span style="font-size:.55rem;color:var(--text-secondary)">192.168.1.30</span></div>
          </div>
        </div>
        <div class="device-links">
          <div class="device-link ${dev.behavior[0] ? 'active' : 'inactive'}"></div>
          <div class="device-link ${dev.behavior[1] ? 'active' : 'inactive'}"></div>
          <div class="device-link active"></div>
        </div>
        <div class="device-center">
          <div class="device-center__icon">${dev.icon}</div>
          <div class="device-center__label">${dev.name}</div>
          <span style="font-size:.7rem;color:${layerData.color};font-weight:700">L${dev.layer} — ${layerData.name}</span>
        </div>
        <div style="text-align:center;font-size:.75rem;color:var(--text-secondary);margin-top:8px">
          PC-A отправляет кадр → PC-C (${activeDevice === 'hub' ? 'получают ВСЕ' : 'получает ТОЛЬКО PC-C'})
        </div>
      </div>
      <div class="card mt-12" style="font-size:.82rem;line-height:1.6">
        ${dev.description}
      </div>
      <table class="pdu-fields mt-12">
        <tr><td>Уровень OSI</td><td>L${dev.layer} — ${layerData.name}</td></tr>
        <tr><td>Анализирует</td><td>${dev.layer === 1 ? 'Ничего (электрический сигнал)' : dev.layer === 2 ? 'MAC-адрес назначения' : 'IP-адрес назначения'}</td></tr>
        <tr><td>Доменов коллизий</td><td>${dev.layer === 1 ? '1 (общий)' : 'По одному на порт'}</td></tr>
        <tr><td>Широковещательный домен</td><td>${dev.layer <= 2 ? '1 (общий)' : 'Разделяет'}</td></tr>
        <tr><td>Скорость обработки</td><td>${dev.layer === 1 ? 'Мгновенно (без анализа)' : dev.layer === 2 ? 'Быстро (аппаратные ASIC)' : 'Медленнее (анализ IP + таблица маршрутов)'}</td></tr>
      </table>
    `;

    result.querySelectorAll('.device-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeDevice = tab.dataset.dev;
        renderDevices();
      });
    });
  }

  renderDevices();
}
