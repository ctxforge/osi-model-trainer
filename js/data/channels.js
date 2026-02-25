export const CHANNEL_TYPES = [
  { id: 'cat5e', name: 'Ethernet Cat5e', speed: 1000, latency: 0.01, medium: 'copper', maxDist: 100,
    icon: '🔌', color: '#3498db',
    attenuation: 22, snrBase: 40, duplex: 'full', interference: 'low', propagation: 0.64,
    encoding: 'PAM-5', jitter: 0.005, bandwidthMHz: 100, defaultDist: 30,
    desc: 'Витая пара Cat5e — 4 скрученные пары медных проводников. Стандарт для LAN. Экранирование снижает наводки.' },
  { id: 'cat6', name: 'Ethernet Cat6', speed: 10000, latency: 0.01, medium: 'copper', maxDist: 55,
    icon: '🔌', color: '#2980b9',
    attenuation: 20, snrBase: 44, duplex: 'full', interference: 'low', propagation: 0.64,
    encoding: 'PAM-16', jitter: 0.003, bandwidthMHz: 250, defaultDist: 20,
    desc: 'Cat6 — улучшенная витая пара с разделителем пар. 10 Гбит/с на коротких дистанциях, усиленная защита от перекрёстных наводок (NEXT).' },
  { id: 'cat6a', name: 'Ethernet Cat6a', speed: 10000, latency: 0.01, medium: 'copper', maxDist: 100,
    icon: '🔌', color: '#2471a3',
    attenuation: 18, snrBase: 46, duplex: 'full', interference: 'low', propagation: 0.64,
    encoding: 'PAM-16', jitter: 0.003, bandwidthMHz: 500, defaultDist: 50,
    desc: 'Cat6a — экранированная витая пара, 500 МГц полоса. 10GBASE-T на полные 100 м. Толще Cat6, требует более аккуратной прокладки.' },
  { id: 'cat7', name: 'Ethernet Cat7', speed: 10000, latency: 0.01, medium: 'copper', maxDist: 100,
    icon: '🔌', color: '#1a5276',
    attenuation: 16, snrBase: 48, duplex: 'full', interference: 'low', propagation: 0.64,
    encoding: 'PAM-16', jitter: 0.002, bandwidthMHz: 600, defaultDist: 50,
    desc: 'Cat7 — полностью экранированная (S/FTP), 600 МГц. Каждая пара в индивидуальном экране. Разъём TERA или GG45. Промышленные сети.' },
  { id: 'cat8', name: 'Ethernet Cat8', speed: 40000, latency: 0.005, medium: 'copper', maxDist: 30,
    icon: '🔌', color: '#0e3d54',
    attenuation: 24, snrBase: 50, duplex: 'full', interference: 'low', propagation: 0.64,
    encoding: 'PAM-16', jitter: 0.001, bandwidthMHz: 2000, defaultDist: 15,
    desc: 'Cat8 — 2000 МГц полоса, 25/40 Гбит/с на 30 м. Для коммутации внутри серверных стоек. Экранирование S/FTP, разъём RJ-45.' },
  { id: 'fiber_sm', name: 'Оптоволокно SM', speed: 100000, latency: 0.005, medium: 'fiber', maxDist: 80000,
    icon: '💡', color: '#e74c3c',
    attenuation: 0.2, snrBase: 55, duplex: 'full', interference: 'none', propagation: 0.67,
    encoding: 'NRZ / PAM-4', jitter: 0.001, bandwidthMHz: 100000, defaultDist: 5000,
    desc: 'Одномодовое оптоволокно — ядро 9 мкм, один луч. Минимальное затухание (0.2 дБ/км). Невосприимчиво к ЭМ-помехам. Магистральные каналы.' },
  { id: 'fiber_mm', name: 'Оптоволокно MM', speed: 10000, latency: 0.005, medium: 'fiber', maxDist: 550,
    icon: '💡', color: '#c0392b',
    attenuation: 3.0, snrBase: 48, duplex: 'full', interference: 'none', propagation: 0.67,
    encoding: '64B/66B', jitter: 0.002, bandwidthMHz: 4700, defaultDist: 100,
    desc: 'Многомодовое оптоволокно — ядро 50/62.5 мкм, несколько лучей. Модовая дисперсия ограничивает дальность. Для дата-центров.' },
  { id: 'fiber_om3', name: 'Оптоволокно OM3', speed: 10000, latency: 0.005, medium: 'fiber', maxDist: 300,
    icon: '💡', color: '#a93226',
    attenuation: 3.5, snrBase: 45, duplex: 'full', interference: 'none', propagation: 0.67,
    encoding: '64B/66B', jitter: 0.002, bandwidthMHz: 2000, defaultDist: 100,
    desc: 'OM3 — многомодовое оптоволокно с лазерной оптимизацией (LOMMF). 10GBASE-SR на 300 м. Ядро 50 мкм, aqua-цвет оболочки. Дата-центры.' },
  { id: 'wifi24', name: 'Wi-Fi 2.4 GHz', speed: 150, latency: 3, medium: 'radio', maxDist: 70,
    icon: '📶', color: '#2ecc71',
    attenuation: 60, snrBase: 35, duplex: 'half', interference: 'high', propagation: 0.99,
    encoding: 'OFDM', jitter: 2, bandwidthMHz: 20, defaultDist: 15,
    desc: 'Wi-Fi 2.4 ГГц (802.11n) — 14 каналов, 3 неперекрывающихся. Сильные помехи от микроволновок, Bluetooth, соседских сетей. Полудуплекс (CSMA/CA).' },
  { id: 'wifi5', name: 'Wi-Fi 5 GHz', speed: 866, latency: 2, medium: 'radio', maxDist: 35,
    icon: '📶', color: '#27ae60',
    attenuation: 70, snrBase: 38, duplex: 'half', interference: 'medium', propagation: 0.99,
    encoding: 'OFDM 256-QAM', jitter: 1.5, bandwidthMHz: 80, defaultDist: 10,
    desc: 'Wi-Fi 5 ГГц (802.11ac) — больше каналов, шире полоса (80/160 МГц). Хуже проходит стены (затухание ~70 дБ на 30 м). Полудуплекс.' },
  { id: 'wifi6', name: 'Wi-Fi 6 (ax)', speed: 2400, latency: 1, medium: 'radio', maxDist: 30,
    icon: '📶', color: '#1abc9c',
    attenuation: 72, snrBase: 42, duplex: 'half', interference: 'medium', propagation: 0.99,
    encoding: 'OFDMA 1024-QAM', jitter: 0.8, bandwidthMHz: 160, defaultDist: 8,
    desc: 'Wi-Fi 6 (802.11ax) — OFDMA для параллельного доступа, 1024-QAM, Target Wake Time. Лучше в плотных сетях, но всё ещё полудуплекс.' },
  { id: 'wifi7', name: 'Wi-Fi 7 (be)', speed: 46000, latency: 0.5, medium: 'radio', maxDist: 30,
    icon: '📶', color: '#0e8a6e',
    attenuation: 74, snrBase: 44, duplex: 'half', interference: 'medium', propagation: 0.99,
    encoding: 'OFDMA 4096-QAM', jitter: 0.5, bandwidthMHz: 320, defaultDist: 8,
    desc: 'Wi-Fi 7 (802.11be) — 4096-QAM, каналы 320 МГц, Multi-Link Operation (MLO). До 46 Гбит/с. 2.4+5+6 ГГц одновременно. Полудуплекс.' },
  { id: 'coax', name: 'Коаксиальный', speed: 1000, latency: 0.5, medium: 'copper', maxDist: 500,
    icon: '📺', color: '#e67e22',
    attenuation: 6, snrBase: 38, duplex: 'half', interference: 'low', propagation: 0.77,
    encoding: 'QAM-256', jitter: 0.1, bandwidthMHz: 1000, defaultDist: 100,
    desc: 'Коаксиальный кабель — центральная жила + экран. Хорошая защита от помех. DOCSIS 3.1 для кабельного интернета. Общая среда (полудуплекс).' },
  { id: 'dsl', name: 'DSL (телефон)', speed: 100, latency: 10, medium: 'copper', maxDist: 5500,
    icon: '📞', color: '#f39c12',
    attenuation: 14, snrBase: 30, duplex: 'full', interference: 'medium', propagation: 0.64,
    encoding: 'DMT (QAM)', jitter: 2, bandwidthMHz: 17, defaultDist: 2000,
    desc: 'DSL — телефонная пара. Скорость резко падает с расстоянием. ADSL: вниз до 24 Мбит/с, вверх до 3.5 Мбит/с. Наводки от других пар (crosstalk).' },
  { id: 'lte', name: '4G LTE', speed: 100, latency: 30, medium: 'radio', maxDist: 10000,
    icon: '📱', color: '#9b59b6',
    attenuation: 40, snrBase: 25, duplex: 'full', interference: 'medium', propagation: 0.99,
    encoding: 'OFDMA 64-QAM', jitter: 5, bandwidthMHz: 20, defaultDist: 2000,
    desc: '4G LTE — FDD или TDD дуплекс. MIMO-антенны. Задержка 20-50 мс. Скорость зависит от загрузки соты и расстояния до вышки.' },
  { id: '5g', name: '5G (sub-6)', speed: 1000, latency: 5, medium: 'radio', maxDist: 1000,
    icon: '📱', color: '#8e44ad',
    attenuation: 80, snrBase: 30, duplex: 'full', interference: 'low', propagation: 0.99,
    encoding: 'OFDMA 256-QAM', jitter: 1, bandwidthMHz: 100, defaultDist: 300,
    desc: '5G sub-6 ГГц — Massive MIMO, beamforming. Малый радиус, но высокая ёмкость. mmWave (28 ГГц) ещё быстрее, но всего 100-200 м.' },
  { id: 'satellite', name: 'Спутник (GEO)', speed: 100, latency: 600, medium: 'radio', maxDist: 35786,
    icon: '🛰️', color: '#34495e',
    attenuation: 200, snrBase: 15, duplex: 'half', interference: 'medium', propagation: 0.99,
    encoding: 'DVB-S2 (8PSK)', jitter: 20, bandwidthMHz: 36, defaultDist: 35786,
    desc: 'GEO-спутник на высоте 35 786 км. Задержка ~600 мс RTT (неустранима физикой). Затухание в свободном пространстве, влияние погоды (rain fade).' },

  // === Спутниковые каналы ===
  { id: 'starlink_leo', name: 'Starlink (LEO)', speed: 300, latency: 30, medium: 'satellite', maxDist: 550,
    icon: '🛰️', color: '#1e3a5f',
    attenuation: 160, snrBase: 22, duplex: 'full', interference: 'low', propagation: 0.99,
    encoding: 'OFDM (Ku/Ka)', jitter: 5, bandwidthMHz: 250, defaultDist: 550,
    desc: 'Starlink — LEO-созвездие SpaceX, орбита 550 км. Низкая задержка (~30 мс RTT), частые хэндоверы между спутниками. Ku/Ka-диапазон, фазированные антенны.' },
  { id: 'oneweb_leo', name: 'OneWeb (LEO)', speed: 195, latency: 40, medium: 'satellite', maxDist: 1200,
    icon: '🛰️', color: '#2c5282',
    attenuation: 170, snrBase: 20, duplex: 'full', interference: 'low', propagation: 0.99,
    encoding: 'DVB-S2X (Ku)', jitter: 6, bandwidthMHz: 200, defaultDist: 1200,
    desc: 'OneWeb — LEO-созвездие на орбите 1200 км. Ku-диапазон, ориентировано на B2B и удалённые регионы. Задержка ~40 мс RTT.' },
  { id: 'o3b_meo', name: 'O3b mPOWER (MEO)', speed: 10000, latency: 135, medium: 'satellite', maxDist: 8062,
    icon: '🛰️', color: '#4a5568',
    attenuation: 185, snrBase: 18, duplex: 'full', interference: 'medium', propagation: 0.99,
    encoding: 'DVB-S2X (Ka)', jitter: 10, bandwidthMHz: 4000, defaultDist: 8062,
    desc: 'O3b mPOWER — MEO-созвездие SES на 8062 км. Ka-диапазон, до 10 Гбит/с на луч. Задержка ~135 мс RTT. Для магистральных каналов и операторов.' },
  { id: 'vsat_ku', name: 'VSAT (GEO Ku)', speed: 50, latency: 600, medium: 'satellite', maxDist: 35786,
    icon: '🛰️', color: '#5a6a7e',
    attenuation: 205, snrBase: 14, duplex: 'half', interference: 'medium', propagation: 0.99,
    encoding: 'DVB-S2 (QPSK)', jitter: 25, bandwidthMHz: 36, defaultDist: 35786,
    desc: 'VSAT Ku-band — терминалы с антенной 0.75-1.2 м. Широкий луч, умеренная скорость. Для корпоративных сетей, банкоматов, удалённых офисов.' },
  { id: 'hts_ka', name: 'HTS Ka-band (GEO)', speed: 200, latency: 600, medium: 'satellite', maxDist: 35786,
    icon: '🛰️', color: '#6b7c93',
    attenuation: 210, snrBase: 16, duplex: 'half', interference: 'medium', propagation: 0.99,
    encoding: 'DVB-S2X (16APSK)', jitter: 22, bandwidthMHz: 500, defaultDist: 35786,
    desc: 'HTS Ka-band — спутники с высокой пропускной способностью (High Throughput Satellite). Много узких лучей, повторное использование частот. До 200 Мбит/с.' },
  { id: 'iridium_leo', name: 'Iridium (LEO)', speed: 0.128, latency: 25, medium: 'satellite', maxDist: 780,
    icon: '🛰️', color: '#718096',
    attenuation: 155, snrBase: 12, duplex: 'half', interference: 'low', propagation: 0.99,
    encoding: 'QPSK (L-band)', jitter: 8, bandwidthMHz: 0.0315, defaultDist: 780,
    desc: 'Iridium — 66 LEO-спутников на 780 км с межспутниковыми связями. L-band, глобальное покрытие включая полюса. Узкий канал (128 кбит/с), но работает везде.' }
];

export const ENV_EFFECTS = {
  copper: [
    { id: 'shielded', label: 'Экранирование (STP)', type: 'toggle', default: false, dbBonus: 6, desc: 'Экранированная витая пара снижает внешние наводки на ~6 дБ' },
    { id: 'bundlePairs', label: 'Пар в пучке (crosstalk)', type: 'range', min: 1, max: 50, default: 4, dbPenalty: 0.3, desc: 'Чем больше пар в кабельном канале, тем сильнее перекрёстные наводки (NEXT/FEXT)' },
    { id: 'temperature', label: 'Температура (°C)', type: 'range', min: -10, max: 70, default: 25, dbPenPerDeg: 0.04, baseline: 25, desc: 'Сопротивление меди растёт с температурой → затухание увеличивается' }
  ],
  fiber: [
    { id: 'connectors', label: 'Кол-во разъёмов', type: 'range', min: 0, max: 12, default: 2, dbPenalty: 0.5, desc: 'Каждый разъём (SC, LC) вносит ~0.3-0.75 дБ потерь из-за несовпадения осей' },
    { id: 'splices', label: 'Кол-во сварок', type: 'range', min: 0, max: 30, default: 4, dbPenalty: 0.1, desc: 'Каждая сварка (fusion splice) вносит ~0.05-0.2 дБ потерь' },
    { id: 'bendRadius', label: 'Изгибов (< мин. радиуса)', type: 'range', min: 0, max: 10, default: 0, dbPenalty: 1.0, desc: 'Изгиб меньше минимального радиуса → свет выходит из ядра → потери до 1 дБ/изгиб' }
  ],
  radio: [
    { id: 'walls', label: 'Стены на пути', type: 'range', min: 0, max: 6, default: 0, dbPenalty: 6, desc: 'Каждая бетонная стена ~6 дБ, кирпичная ~4 дБ, гипсокартон ~3 дБ' },
    { id: 'people', label: 'Людей в зоне', type: 'range', min: 0, max: 100, default: 5, dbPenalty: 0.1, desc: 'Тело человека (70% воды) поглощает радиоволны — ~0.1 дБ на человека' },
    { id: 'interference', label: 'Источники помех', type: 'range', min: 0, max: 20, default: 2, dbPenalty: 1.0, desc: 'Соседние AP, микроволновки, Bluetooth, радиотелефоны — каждый ~1 дБ к шумовой полке' },
    { id: 'weather', label: 'Погода', type: 'select', options: ['Ясно', 'Облачно', 'Дождь', 'Гроза'], dbPenalties: [0, 1, 4, 10], desc: 'Дождь и влажность поглощают радиоволны (особенно > 10 ГГц)' }
  ],
  satellite: [
    { id: 'weather', label: 'Погода (rain fade)', type: 'select', options: ['Ясно', 'Облачно', 'Дождь', 'Ливень'], dbPenalties: [0, 2, 8, 20], desc: 'Rain fade — главный враг спутниковой связи, дождь поглощает Ku/Ka-диапазон' },
    { id: 'elevation', label: 'Угол возвышения (°)', type: 'range', min: 5, max: 90, default: 45, desc: 'Низкий угол → сигнал проходит дольше через атмосферу → больше затухание' },
    { id: 'solar', label: 'Солнечная интерференция', type: 'toggle', default: false, dbPenalty: 15, desc: 'Когда Солнце за спутником — мощные помехи, потери до 15 дБ (раз в сезон)' }
  ],
  satellite_leo: [
    { id: 'weather', label: 'Погода (rain fade)', type: 'select', options: ['Ясно', 'Облачно', 'Дождь', 'Ливень'], dbPenalties: [0, 1, 5, 12], desc: 'LEO-спутники менее подвержены rain fade из-за короткого пути через атмосферу' },
    { id: 'obstruction', label: 'Препятствия', type: 'select', options: ['Открытое небо', 'Деревья', 'Здания рядом', 'Плотная застройка'], dbPenalties: [0, 3, 8, 15], desc: 'LEO-спутники низко над горизонтом — деревья и здания могут блокировать сигнал' },
    { id: 'handover', label: 'Частота хэндовера', type: 'select', options: ['Редкий', 'Средний', 'Частый'], dbPenalties: [0, 1, 3], desc: 'LEO-спутники быстро движутся — частые переключения между спутниками вносят кратковременные потери' }
  ],
  satellite_meo: [
    { id: 'weather', label: 'Погода (rain fade)', type: 'select', options: ['Ясно', 'Облачно', 'Дождь', 'Ливень'], dbPenalties: [0, 2, 7, 16], desc: 'MEO-спутники: средний путь через атмосферу, умеренный rain fade' },
    { id: 'elevation', label: 'Угол возвышения (°)', type: 'range', min: 10, max: 90, default: 40, desc: 'Низкий угол → больше атмосферного затухания, но MEO-спутники обычно выше над горизонтом чем LEO' },
    { id: 'solar', label: 'Солнечная интерференция', type: 'toggle', default: false, dbPenalty: 12, desc: 'Солнечная интерференция на MEO — до 12 дБ потерь, длится дольше чем для GEO' }
  ]
};

export function getChannelEnvType(chId) {
  if (['cat5e','cat6','cat6a','cat7','cat8','coax','dsl'].includes(chId)) return 'copper';
  if (['fiber_sm','fiber_mm','fiber_om3'].includes(chId)) return 'fiber';
  if (['satellite','vsat_ku','hts_ka'].includes(chId)) return 'satellite';
  if (['starlink_leo','oneweb_leo','iridium_leo'].includes(chId)) return 'satellite_leo';
  if (chId === 'o3b_meo') return 'satellite_meo';
  return 'radio';
}

/**
 * Рассчитывает реалистичный бюджет мощности линка (link budget).
 * TX power (дБм) − path loss (дБ) − noise floor (дБм) = SNR (дБ)
 *
 * @param {object} ch           — объект канала из CHANNEL_TYPES
 * @param {number} dist         — расстояние в метрах
 * @param {number} envPenaltyDb — дополнительные потери среды (помехи, условия), дБ
 * @returns {{ txPower, pathLoss, rxPower, noiseFloor, snr }}  все в дБм/дБ
 */
export function calcLinkBudget(ch, dist, envPenaltyDb = 0) {
  // Типичная мощность передатчика для разных сред (дБм)
  const txPower = { copper: 0, fiber: 5, radio: 23, satellite: 50 }[ch.medium] ?? 10;

  // Затухание в тракте:
  // • медь/оптика: линейная модель дБ/100м или дБ/км
  // • радио: нормировано на maxDist (доля от максимальной дальности)
  // • спутник: фиксированные потери (орбита не меняется)
  let pathLoss;
  if (ch.medium === 'copper') {
    pathLoss = ch.attenuation * (dist / 100);
  } else if (ch.medium === 'fiber') {
    pathLoss = ch.attenuation * (dist / 1000);
  } else if (ch.medium === 'satellite') {
    // LEO/MEO спутник: потери постоянны по орбите, +env
    pathLoss = 2;  // символические 2 дБ базовых потерь (учтены в snrBase)
  } else {
    // Радио (LTE, Wi-Fi, 5G, GEO satellite через радио-medium):
    // SNR деградирует от snrBase при defaultDist до ~0 при maxDist
    const maxDistM = Math.max(ch.maxDist, 1);
    const defaultRatio = (ch.defaultDist || 1) / maxDistM;
    if (defaultRatio > 0.5) {
      // Каналы с фиксированным расстоянием (GEO-спутник): SNR не зависит от dist в симуляции
      pathLoss = 0;
    } else {
      // Обычные радиоканалы: потери растут с расстоянием
      pathLoss = ch.snrBase * Math.min(dist / maxDistM, 3); // cap at 3× maxDist
    }
  }
  pathLoss += envPenaltyDb;

  // Реалистичная шумовая полка в дБм (тепловой шум kTB + шум-фигура приёмника)
  const baseNoise = { copper: -100, fiber: -110, radio: -95, satellite: -100 }[ch.medium] ?? -100;

  // Добавка от помех в среде
  const interferenceOffset = ch.interference === 'high' ? 15
    : ch.interference === 'medium' ? 7
    : ch.interference === 'none' ? -5
    : 2; // low / default

  const noiseFloor = baseNoise + interferenceOffset;
  // SNR: для радио/спутника snrBase кодирует качество при ref.расстоянии
  const snr = ch.medium === 'copper' || ch.medium === 'fiber'
    ? txPower - pathLoss - noiseFloor
    : ch.snrBase - (pathLoss - envPenaltyDb);

  const rxPower = noiseFloor + snr;

  return { txPower, pathLoss, rxPower, noiseFloor, snr };
}
