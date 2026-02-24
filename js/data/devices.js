export const NET_DEVICES = [
  { id: 'pc', name: 'Компьютер', layer: 7, icon: '💻', color: '#95a5a6', proc: 0, desc: 'Конечное устройство. Работает на всех 7 уровнях OSI.' },
  { id: 'server', name: 'Сервер', layer: 7, icon: '🖥️', color: '#7f8c8d', proc: 0, desc: 'Серверное оборудование. Принимает и обрабатывает запросы.' },
  { id: 'hub', name: 'Хаб', layer: 1, icon: '🔌', color: '#9b59b6', proc: 0, desc: 'L1. Повторяет сигнал на все порты без анализа. Общий домен коллизий.' },
  { id: 'switch', name: 'Коммутатор', layer: 2, icon: '🔀', color: '#3498db', proc: 0.01, desc: 'L2. Читает MAC-адрес, пересылает кадр только на нужный порт.' },
  { id: 'router', name: 'Маршрутизатор', layer: 3, icon: '🌐', color: '#1abc9c', proc: 0.1, desc: 'L3. Анализирует IP, выбирает маршрут, меняет MAC-заголовок.' },
  { id: 'ap', name: 'Точка доступа', layer: 2, icon: '📡', color: '#2ecc71', proc: 0.02, desc: 'L2. Мост между проводной и беспроводной сетью.' },
  { id: 'modem', name: 'Модем', layer: 1, icon: '📟', color: '#e67e22', proc: 0.5, desc: 'L1. Преобразует цифровой сигнал в аналоговый и обратно.' },
  { id: 'firewall', name: 'Файрвол', layer: 4, icon: '🛡️', color: '#e74c3c', proc: 0.2, desc: 'L3-L7. Анализирует пакеты и фильтрует по правилам безопасности.' }
];

export const NET_PRESETS = [
  { name: '🏠 Домашняя', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: 'wifi5', dist: 8 },
    { type: 'device', id: 'router' }, { type: 'link', id: 'cat5e', dist: 5 },
    { type: 'device', id: 'modem' }, { type: 'link', id: 'fiber_mm', dist: 200 },
    { type: 'device', id: 'router' }, { type: 'link', id: 'fiber_sm', dist: 12000 },
    { type: 'device', id: 'server' }
  ]},
  { name: '🏢 Офис', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: 'cat6', dist: 15 },
    { type: 'device', id: 'switch' }, { type: 'link', id: 'cat6', dist: 30 },
    { type: 'device', id: 'firewall' }, { type: 'link', id: 'cat6', dist: 5 },
    { type: 'device', id: 'server' }
  ]},
  { name: '📱 Мобильный', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: '5g', dist: 400 },
    { type: 'device', id: 'router' }, { type: 'link', id: 'fiber_sm', dist: 50000 },
    { type: 'device', id: 'router' }, { type: 'link', id: 'cat6', dist: 10 },
    { type: 'device', id: 'server' }
  ]},
  { name: '🛰️ Спутник', path: [
    { type: 'device', id: 'pc' }, { type: 'link', id: 'cat5e', dist: 10 },
    { type: 'device', id: 'modem' }, { type: 'link', id: 'satellite', dist: 35786 },
    { type: 'device', id: 'modem' }, { type: 'link', id: 'cat5e', dist: 10 },
    { type: 'device', id: 'router' }, { type: 'link', id: 'fiber_sm', dist: 5000 },
    { type: 'device', id: 'server' }
  ]}
];
