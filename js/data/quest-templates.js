/* ==================== QUEST TEMPLATES ==================== */

export const QUEST_CHAPTERS = [
  {
    id: 'ch1', name: 'Кабельный хаос', icon: '⚡',
    desc: 'Физический уровень: кабели, сигналы, помехи, кодирование',
    color: '#e74c3c', npc: 'Антон (техник)',
    npcIntro: 'Привет! Я Антон, старший техник. У нас аврал на серверной — давай разберёмся с кабелями!'
  },
  {
    id: 'ch2', name: 'Коммутационный кошмар', icon: '🔌',
    desc: 'Канальный уровень: MAC-адреса, коллизии, VLAN, STP, Ethernet',
    color: '#e67e22', npc: 'Марина (сетевой админ)',
    npcIntro: 'Привет, новенький! Я Марина, админ. Коммутаторы сбоят — поможешь разобраться?'
  },
  {
    id: 'ch3', name: 'Адресный переполох', icon: '🌐',
    desc: 'Сетевой уровень: IP-адресация, маршрутизация, TTL, NAT, фрагментация',
    color: '#2ecc71', npc: 'Олег (архитектор сети)',
    npcIntro: 'Добро пожаловать! Я Олег, сетевой архитектор. Нам нужно спланировать адресацию — ты готов?'
  },
  {
    id: 'ch4', name: 'Транспортный коллапс', icon: '📦',
    desc: 'Транспортный уровень: TCP/UDP, порты, перегрузка, скользящее окно',
    color: '#3498db', npc: 'Кирилл (DevOps)',
    npcIntro: 'Йо! Я Кирилл, DevOps-инженер. Приложение лагает — давай разберёмся с транспортным уровнем!'
  },
  {
    id: 'ch5', name: 'Цифровая крепость', icon: '🔐',
    desc: 'Безопасность: шифрование, TLS, firewall, сертификаты',
    color: '#9b59b6', npc: 'Алиса (ИБ-специалист)',
    npcIntro: 'Привет. Я Алиса, специалист по ИБ. У нас инцидент — нужна твоя помощь с защитой!'
  },
  {
    id: 'ch6', name: 'Свой провайдер', icon: '🏢',
    desc: 'Прикладной уровень + всё вместе: DNS, DHCP, HTTP, мониторинг, финальный проект',
    color: '#1abc9c', npc: 'Директор Павлов',
    npcIntro: 'Поздравляю с успехами! Теперь финальное испытание — построим сеть компании с нуля.'
  }
];

/* ---- Helpers for quest templates ---- */
const CABLE_TYPES = [
  { name: 'Cat5e UTP', maxSpeed: 1000, maxDist: 100, medium: 'copper', cost: 'низкая' },
  { name: 'Cat6 UTP', maxSpeed: 10000, maxDist: 55, medium: 'copper', cost: 'средняя' },
  { name: 'Cat6a STP', maxSpeed: 10000, maxDist: 100, medium: 'copper', cost: 'средняя' },
  { name: 'Cat7 S/FTP', maxSpeed: 10000, maxDist: 100, medium: 'copper', cost: 'высокая' },
  { name: 'SM Fiber (G.652)', maxSpeed: 100000, maxDist: 40000, medium: 'fiber', cost: 'высокая' },
  { name: 'MM Fiber OM3', maxSpeed: 10000, maxDist: 300, medium: 'fiber', cost: 'средняя' },
  { name: 'MM Fiber OM4', maxSpeed: 100000, maxDist: 150, medium: 'fiber', cost: 'высокая' }
];

const LINE_CODE_NAMES = ['NRZ', 'NRZI', 'Manchester', 'Diff. Manchester', 'AMI', 'MLT-3', '4B/5B'];

const SERVICES_BY_PORT = {
  20: 'FTP-Data', 21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP',
  53: 'DNS', 67: 'DHCP-Server', 68: 'DHCP-Client', 69: 'TFTP',
  80: 'HTTP', 110: 'POP3', 123: 'NTP', 143: 'IMAP', 161: 'SNMP',
  179: 'BGP', 443: 'HTTPS', 445: 'SMB', 587: 'SMTP-Submission',
  993: 'IMAPS', 995: 'POP3S', 3306: 'MySQL', 3389: 'RDP',
  5432: 'PostgreSQL', 6379: 'Redis', 8080: 'HTTP-Alt', 27017: 'MongoDB'
};

export const QUEST_TEMPLATES = [
  /* ====== CHAPTER 1: Кабельный хаос ====== */
  {
    id: 'ch1.1', chapter: 'ch1', title: 'Типы кабелей',
    story: (p) => `Антон: «Нужно подключить ${p.location}. Расстояние — ${p.distance} м, требуется скорость ${p.speed} Мбит/с. Какой кабель подойдёт?»`,
    generate(rng) {
      const locations = ['серверную', 'офис на 3 этаже', 'камеру видеонаблюдения', 'точку доступа Wi-Fi', 'принтер в коридоре'];
      const distance = rng.int(10, 500);
      const speed = rng.pick([100, 1000, 10000]);
      const suitable = CABLE_TYPES.filter(c => c.maxDist >= distance && c.maxSpeed >= speed);
      const best = suitable.reduce((a, b) => {
        if (a.cost === 'низкая' && b.cost !== 'низкая') return a;
        if (b.cost === 'низкая' && a.cost !== 'низкая') return b;
        if (a.cost === 'средняя' && b.cost === 'высокая') return a;
        return b;
      }, suitable[0]);
      return { location: rng.pick(locations), distance, speed, answer: best.name, suitable: suitable.map(c => c.name), allCables: CABLE_TYPES.map(c => c.name) };
    },
    validate(answer, p) {
      return p.suitable.some(name => answer.toLowerCase().includes(name.toLowerCase()));
    },
    explain: (p) => `Для ${p.distance} м и ${p.speed} Мбит/с подходят: ${p.suitable.join(', ')}. Оптимальный выбор: ${p.answer}.`,
    hints: [
      (p) => `Обрати внимание на максимальное расстояние кабелей.`,
      (p) => `Медная витая пара работает до 100 м (Cat5e–Cat7). Для ${p.distance > 100 ? 'такого расстояния нужно оптоволокно' : 'этого хватит витой пары'}.`,
      (p) => `Правильный ответ: ${p.answer}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'channelPhysics', text: 'Физика канала' },
      { section: 'lab', lab: 'signals', text: 'Сигналы L1' }
    ],
    relatedTheory: [
      { topic: 'transmission-media', text: 'Среды передачи' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch1.2', chapter: 'ch1', title: 'Сигнал на осциллографе',
    story: (p) => `Антон: «Посмотри на осциллограф — нужно определить частоту и амплитуду сигнала. Я вижу ${p.waveform}, но параметры считай сам.»`,
    generate(rng) {
      const waveforms = ['синусоиду', 'прямоугольный сигнал', 'треугольный сигнал', 'пилообразный сигнал'];
      const freq = rng.int(1, 100) * 100; // 100 Hz - 10 kHz
      const amplitude = (rng.int(1, 50) / 10).toFixed(1); // 0.1 - 5.0 V
      return { waveform: rng.pick(waveforms), freq, amplitude: parseFloat(amplitude) };
    },
    validate(answer, p) {
      if (typeof answer !== 'object') return false;
      const freqOk = Math.abs((answer.freq || 0) - p.freq) / p.freq < 0.1;
      const ampOk = Math.abs((answer.amplitude || 0) - p.amplitude) / p.amplitude < 0.15;
      return freqOk && ampOk;
    },
    explain: (p) => `Сигнал: ${p.waveform}, частота ${p.freq} Гц, амплитуда ${p.amplitude} В.`,
    hints: [
      () => `Частота = 1 / период. Измерь период по сетке осциллографа.`,
      (p) => `Период ≈ ${(1000 / p.freq).toFixed(2)} мс. Амплитуда — от нуля до пика.`,
      (p) => `Частота = ${p.freq} Гц, амплитуда = ${p.amplitude} В`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'oscilloscope', text: 'Осциллограф' },
      { section: 'lab', lab: 'signals', text: 'Сигналы L1' }
    ],
    relatedTheory: [
      { topic: 'data-transmission', text: 'Передача данных' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch1.3', chapter: 'ch1', title: 'Помехи в канале',
    story: (p) => `Антон: «Канал ${p.channelName} на расстоянии ${p.distance} м. Сигнал искажён — определи SNR и качество связи.»`,
    generate(rng) {
      const channels = [
        { name: 'Cat5e', atten: 22, snrBase: 40, dist: 100 },
        { name: 'Cat6', atten: 19.8, snrBase: 45, dist: 100 },
        { name: 'OM3 Fiber', atten: 3.5, snrBase: 50, dist: 300 },
        { name: 'Wi-Fi 2.4 GHz', atten: 0.5, snrBase: 25, dist: 50 }
      ];
      const ch = rng.pick(channels);
      const distance = rng.int(10, ch.dist);
      const noise = rng.int(0, 15);
      const attenuation = (ch.atten * distance / ch.dist).toFixed(1);
      const snr = Math.max(ch.snrBase - parseFloat(attenuation) - noise, -5);
      const quality = snr > 30 ? 'отличное' : snr > 20 ? 'хорошее' : snr > 10 ? 'среднее' : snr > 0 ? 'плохое' : 'нет связи';
      return { channelName: ch.name, distance, noise, attenuation: parseFloat(attenuation), snr: Math.round(snr), quality };
    },
    validate(answer, p) {
      if (typeof answer !== 'object') return false;
      const snrOk = Math.abs((answer.snr || 0) - p.snr) <= 3;
      const qualOk = answer.quality && answer.quality.toLowerCase() === p.quality;
      return snrOk || qualOk;
    },
    explain: (p) => `Затухание: ${p.attenuation} дБ, SNR: ${p.snr} дБ, качество: ${p.quality}.`,
    hints: [
      () => `SNR = мощность сигнала − затухание − шум.`,
      (p) => `Затухание канала: ${p.attenuation} дБ. Шум: ${p.noise} дБ.`,
      (p) => `SNR ≈ ${p.snr} дБ → качество: ${p.quality}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'channelPhysics', text: 'Физика канала' },
      { section: 'lab', lab: 'signals', text: 'Сигналы L1' },
      { section: 'lab', lab: 'oscilloscope', text: 'Осциллограф' }
    ],
    relatedTheory: [
      { topic: 'data-transmission', text: 'Передача данных' },
      { topic: 'transmission-media', text: 'Среды передачи' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch1.4', chapter: 'ch1', title: 'Кодирование',
    story: (p) => `Антон: «Данные ${p.bits} нужно закодировать кодом ${p.codeName}. Покажи результат кодирования.»`,
    generate(rng) {
      const bits = Array.from({ length: rng.int(8, 12) }, () => rng.int(0, 1)).join('');
      const codeName = rng.pick(LINE_CODE_NAMES);
      return { bits, codeName };
    },
    validate(answer, p) {
      // Simplified: check if answer mentions the correct code and some reasonable sequence
      if (typeof answer === 'string') {
        return answer.toLowerCase().includes(p.codeName.toLowerCase());
      }
      return false;
    },
    explain: (p) => `Данные "${p.bits}" кодом ${p.codeName}. Каждый бит преобразуется по правилам кода.`,
    hints: [
      (p) => `Вспомни правила кода ${p.codeName}: как кодируются 0 и 1.`,
      (p) => `${p.codeName}: ${p.codeName === 'NRZ' ? 'высокий = 1, низкий = 0' : p.codeName === 'Manchester' ? 'переход вверх = 0, вниз = 1 (по IEEE)' : 'каждый бит определяет переход уровня'}`,
      (p) => `Открой лабораторию "Сигналы L1" и выбери код ${p.codeName}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'signals', text: 'Сигналы L1' },
      { section: 'lab', lab: 'signalGenerator', text: 'Генератор сигналов' }
    ],
    relatedTheory: [
      { topic: 'data-transmission', text: 'Передача данных' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch1.5', chapter: 'ch1', title: 'Ёмкость канала',
    story: (p) => `Антон: «Канал с полосой пропускания ${p.bandwidth} МГц и SNR ${p.snr} дБ. Какая максимальная скорость передачи?»`,
    generate(rng) {
      const bandwidth = rng.pick([1, 4, 10, 20, 50, 100]);
      const snr = rng.int(10, 40);
      const snrLinear = Math.pow(10, snr / 10);
      const shannon = bandwidth * 1e6 * Math.log2(1 + snrLinear);
      const shannonMbps = Math.round(shannon / 1e6);
      const nyquist = 2 * bandwidth; // for binary signaling
      return { bandwidth, snr, shannonMbps, nyquist };
    },
    validate(answer, p) {
      const val = typeof answer === 'object' ? (answer.speed || answer.capacity || 0) : parseInt(answer);
      return Math.abs(val - p.shannonMbps) / p.shannonMbps < 0.15;
    },
    explain: (p) => `Формула Шеннона: C = B × log₂(1 + SNR) = ${p.bandwidth} МГц × log₂(1 + 10^(${p.snr}/10)) ≈ ${p.shannonMbps} Мбит/с.`,
    hints: [
      () => `Используй формулу Шеннона: C = B × log₂(1 + SNR).`,
      (p) => `B = ${p.bandwidth} МГц, SNR = ${p.snr} дБ → SNR_linear = 10^(${p.snr}/10) ≈ ${Math.round(Math.pow(10, p.snr/10))}.`,
      (p) => `C ≈ ${p.shannonMbps} Мбит/с`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'channelPhysics', text: 'Физика канала' },
      { section: 'lab', lab: 'signalGenerator', text: 'Генератор сигналов' }
    ],
    relatedTheory: [
      { topic: 'data-transmission', text: 'Передача данных' },
      { topic: 'transmission-media', text: 'Среды передачи' }
    ],
    baseXP: 20, isBoss: false
  },
  {
    id: 'ch1.boss', chapter: 'ch1', title: 'Кабельная система этажа',
    story: (p) => `Антон: «Срочное задание! Нужно спроектировать кабельную систему для ${p.floorName}. ${p.workstations} рабочих мест, минимальная скорость ${p.minSpeed} Мбит/с, максимальное расстояние до серверной — ${p.maxDistance} м. Какой тип кабеля и сколько линий нужно?»`,
    generate(rng) {
      const floors = ['офиса продаж', 'бухгалтерии', 'отдела разработки', 'колл-центра'];
      const workstations = rng.int(10, 50);
      const minSpeed = rng.pick([100, 1000, 10000]);
      const maxDistance = rng.int(30, 150);
      const suitable = CABLE_TYPES.filter(c => c.maxDist >= maxDistance && c.maxSpeed >= minSpeed);
      return {
        floorName: rng.pick(floors), workstations, minSpeed, maxDistance,
        suitable: suitable.map(c => c.name),
        cableRuns: workstations + Math.ceil(workstations * 0.2), // 20% reserve
        answer: suitable.length > 0 ? suitable[0].name : 'Нужна промежуточная коммутация'
      };
    },
    validate(answer, p) {
      if (typeof answer !== 'object') return false;
      const cableOk = p.suitable.some(name => (answer.cable || '').toLowerCase().includes(name.toLowerCase()));
      const runsOk = Math.abs((answer.runs || 0) - p.cableRuns) / p.cableRuns < 0.3;
      return cableOk && runsOk;
    },
    explain: (p) => `Кабель: ${p.answer}. Линий: ${p.workstations} + 20% резерв = ${p.cableRuns}. Подходящие типы: ${p.suitable.join(', ')}.`,
    hints: [
      (p) => `Учти расстояние ${p.maxDistance} м и скорость ${p.minSpeed} Мбит/с.`,
      (p) => `${p.maxDistance > 100 ? 'Расстояние больше 100 м — нужно оптоволокно!' : 'Витая пара подойдёт.'} Не забудь про резерв 20%.`,
      (p) => `Кабель: ${p.answer}, линий: ${p.cableRuns}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'channelPhysics', text: 'Физика канала' },
      { section: 'lab', lab: 'signals', text: 'Сигналы L1' },
      { section: 'lab', lab: 'signalGenerator', text: 'Генератор сигналов' }
    ],
    relatedTheory: [
      { topic: 'data-transmission', text: 'Передача данных' },
      { topic: 'transmission-media', text: 'Среды передачи' }
    ],
    baseXP: 30, isBoss: true
  },

  /* ====== CHAPTER 2: Коммутационный кошмар ====== */
  {
    id: 'ch2.1', chapter: 'ch2', title: 'MAC-адреса',
    story: (p) => `Марина: «В таблице коммутации ${p.entries.length} записей. Найди, на каком порту сидит устройство с MAC ${p.targetMac}.»`,
    generate(rng) {
      const portCount = rng.int(4, 8);
      const entries = [];
      for (let i = 0; i < portCount; i++) {
        entries.push({ mac: rng.mac(), port: `Fa0/${i + 1}`, vlan: 1 });
      }
      const targetIdx = rng.int(0, entries.length - 1);
      return { entries, targetMac: entries[targetIdx].mac, targetPort: entries[targetIdx].port };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : answer.port || '').toLowerCase();
      return ans.includes(p.targetPort.toLowerCase());
    },
    explain: (p) => `MAC ${p.targetMac} → порт ${p.targetPort}. Коммутатор хранит таблицу MAC → порт.`,
    hints: [
      () => `Посмотри таблицу MAC-адресов коммутатора.`,
      (p) => `Ищи MAC ${p.targetMac.substring(0, 8)}...`,
      (p) => `Ответ: порт ${p.targetPort}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'devices', text: 'Hub / Switch / Router' },
      { section: 'lab', lab: 'netBuilder', text: 'Конструктор сети' }
    ],
    relatedTheory: [
      { topic: 'ethernet', text: 'Ethernet и канальный уровень' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch2.2', chapter: 'ch2', title: 'Коллизии',
    story: (p) => `Марина: «Сеть из ${p.deviceCount} устройств на ${p.deviceType} тормозит. Нагрузка ${p.utilization}%. Что нужно сделать?»`,
    generate(rng) {
      const isHub = rng.random() > 0.5;
      const deviceCount = rng.int(5, 20);
      const utilization = rng.int(40, 95);
      const solution = isHub ? 'Заменить хаб на коммутатор' : 'Добавить коммутатор / разделить на сегменты';
      return {
        deviceType: isHub ? 'хабе' : 'коммутаторе',
        deviceCount, utilization, isHub, solution,
        collisionDomain: isHub ? 'Единый домен коллизий' : 'Отдельный домен на каждый порт'
      };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : '').toLowerCase();
      if (p.isHub) return ans.includes('коммутатор') || ans.includes('switch') || ans.includes('замен');
      return ans.includes('сегмент') || ans.includes('разделить') || ans.includes('добавить') || ans.includes('vlan');
    },
    explain: (p) => `Проблема: ${p.collisionDomain}. Решение: ${p.solution}.`,
    hints: [
      (p) => `Подумай, чем отличается ${p.isHub ? 'хаб' : 'коммутатор'} в плане доменов коллизий.`,
      (p) => `${p.isHub ? 'Хаб создаёт единый домен коллизий — все устройства конкурируют.' : 'Коммутатор изолирует порты, но при перегрузке нужно сегментирование.'}`,
      (p) => `Решение: ${p.solution}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'devices', text: 'Hub / Switch / Router' },
      { section: 'lab', lab: 'simulator', text: 'Симулятор сети' }
    ],
    relatedTheory: [
      { topic: 'ethernet', text: 'Ethernet и канальный уровень' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch2.3', chapter: 'ch2', title: 'VLAN',
    story: (p) => `Марина: «Нужно разделить сеть на ${p.departments.length} отдела: ${p.departments.map(d => d.name).join(', ')}. Назначь VLAN-ы и порты.»`,
    generate(rng) {
      const deptNames = ['Бухгалтерия', 'Разработка', 'Продажи', 'HR', 'Руководство'];
      const count = rng.int(2, 4);
      const departments = rng.shuffle(deptNames).slice(0, count).map((name, i) => ({
        name, vlan: (i + 1) * 10, devices: rng.int(3, 10)
      }));
      return { departments, totalPorts: departments.reduce((s, d) => s + d.devices, 0) };
    },
    validate(answer, p) {
      if (typeof answer !== 'object') return false;
      // Check that each dept has a unique VLAN
      const vlans = new Set();
      return p.departments.every(dept => {
        const av = answer[dept.name] || answer[dept.name.toLowerCase()];
        if (!av || vlans.has(av)) return false;
        vlans.add(av);
        return true;
      });
    },
    explain: (p) => `Назначение VLAN: ${p.departments.map(d => `${d.name} → VLAN ${d.vlan} (${d.devices} устройств)`).join(', ')}.`,
    hints: [
      () => `Каждому отделу — свой VLAN ID (обычно 10, 20, 30...).`,
      (p) => `Всего ${p.departments.length} отделов. Используй VLAN ${p.departments.map(d => d.vlan).join(', ')}.`,
      (p) => `${p.departments.map(d => `${d.name} = VLAN ${d.vlan}`).join(', ')}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'vlanSim', text: 'VLAN 802.1Q' },
      { section: 'lab', lab: 'netBuilder', text: 'Конструктор сети' }
    ],
    relatedTheory: [
      { topic: 'ethernet', text: 'Ethernet и канальный уровень' }
    ],
    baseXP: 20, isBoss: false
  },
  {
    id: 'ch2.4', chapter: 'ch2', title: 'STP',
    story: (p) => `Марина: «В сети петля! ${p.switchCount} коммутаторов соединены в кольцо. Приоритеты: ${p.switches.map(s => `${s.name}=${s.priority}`).join(', ')}. Какой станет root bridge?»`,
    generate(rng) {
      const count = rng.int(3, 5);
      const switches = [];
      const priorities = rng.shuffle([4096, 8192, 16384, 32768, 32768]).slice(0, count);
      for (let i = 0; i < count; i++) {
        switches.push({ name: `SW${i + 1}`, priority: priorities[i], mac: rng.mac() });
      }
      const root = [...switches].sort((a, b) => a.priority - b.priority || a.mac.localeCompare(b.mac))[0];
      return { switchCount: count, switches, rootBridge: root.name, rootPriority: root.priority };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : answer.root || '').toUpperCase();
      return ans.includes(p.rootBridge.toUpperCase());
    },
    explain: (p) => `Root Bridge: ${p.rootBridge} (приоритет ${p.rootPriority}). STP выбирает коммутатор с наименьшим Bridge ID (приоритет + MAC).`,
    hints: [
      () => `Root Bridge — коммутатор с наименьшим Bridge ID.`,
      (p) => `Bridge ID = приоритет + MAC. Наименьший приоритет: ${p.rootPriority}.`,
      (p) => `Root Bridge: ${p.rootBridge}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'devices', text: 'Hub / Switch / Router' },
      { section: 'lab', lab: 'netBuilder', text: 'Конструктор сети' },
      { section: 'lab', lab: 'simulator', text: 'Симулятор сети' }
    ],
    relatedTheory: [
      { topic: 'ethernet', text: 'Ethernet и канальный уровень' }
    ],
    baseXP: 20, isBoss: false
  },
  {
    id: 'ch2.5', chapter: 'ch2', title: 'Ethernet кадр',
    story: (p) => `Марина: «Собери Ethernet-кадр для отправки ${p.payloadSize} байт данных от ${p.srcMac} к ${p.dstMac}. Тип: ${p.etherType}.»`,
    generate(rng) {
      const srcMac = rng.mac();
      const dstMac = rng.mac();
      const etherTypes = [
        { code: '0x0800', name: 'IPv4' }, { code: '0x0806', name: 'ARP' },
        { code: '0x86DD', name: 'IPv6' }, { code: '0x8100', name: '802.1Q' }
      ];
      const et = rng.pick(etherTypes);
      const payloadSize = rng.int(46, 1500);
      const frameSize = 14 + payloadSize + 4; // header + payload + FCS
      return { srcMac, dstMac, etherType: et.name, etherCode: et.code, payloadSize, frameSize };
    },
    validate(answer, p) {
      if (typeof answer !== 'object') return false;
      const sizeOk = (answer.frameSize || answer.size || 0) === p.frameSize;
      return sizeOk;
    },
    explain: (p) => `Кадр: [Dst MAC: ${p.dstMac}][Src MAC: ${p.srcMac}][EtherType: ${p.etherCode} (${p.etherType})][Payload: ${p.payloadSize} Б][FCS: 4 Б] = ${p.frameSize} байт.`,
    hints: [
      () => `Ethernet кадр: 6 Б dst + 6 Б src + 2 Б type + payload + 4 Б FCS.`,
      (p) => `Заголовок = 14 Б, FCS = 4 Б, payload = ${p.payloadSize} Б.`,
      (p) => `Размер кадра: ${p.frameSize} байт`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'devices', text: 'Hub / Switch / Router' },
      { section: 'lab', lab: 'simulator', text: 'Симулятор сети' }
    ],
    relatedTheory: [
      { topic: 'ethernet', text: 'Ethernet и канальный уровень' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch2.boss', chapter: 'ch2', title: 'Коммутатор завис',
    story: (p) => `Марина: «Коммутатор завис после неправильной настройки! Проблемы: ${p.problems.join(', ')}. Восстанови конфигурацию.»`,
    generate(rng) {
      const possibleProblems = [
        { id: 'vlan_missing', desc: 'VLAN не создан', fix: 'создать VLAN' },
        { id: 'trunk_off', desc: 'Trunk-порт в access режиме', fix: 'переключить порт в trunk' },
        { id: 'stp_loop', desc: 'STP отключен — петля', fix: 'включить STP' },
        { id: 'native_mismatch', desc: 'Native VLAN не совпадает', fix: 'установить одинаковый native VLAN' }
      ];
      const count = rng.int(2, 3);
      const problems = rng.shuffle(possibleProblems).slice(0, count);
      return { problems: problems.map(p => p.desc), fixes: problems.map(p => p.fix), problemIds: problems.map(p => p.id) };
    },
    validate(answer, p) {
      if (typeof answer !== 'object' && typeof answer !== 'string') return false;
      const ans = typeof answer === 'string' ? answer.toLowerCase() : JSON.stringify(answer).toLowerCase();
      return p.fixes.filter(fix => ans.includes(fix.split(' ')[0])).length >= Math.ceil(p.fixes.length * 0.5);
    },
    explain: (p) => `Проблемы и решения:\n${p.problems.map((prob, i) => `• ${prob} → ${p.fixes[i]}`).join('\n')}`,
    hints: [
      (p) => `Обнаружено ${p.problems.length} проблем. Начни с проверки VLAN и портов.`,
      (p) => `Проблемы: ${p.problems.join('; ')}.`,
      (p) => `Решения: ${p.fixes.join('; ')}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'vlanSim', text: 'VLAN 802.1Q' },
      { section: 'lab', lab: 'devices', text: 'Hub / Switch / Router' },
      { section: 'lab', lab: 'netBuilder', text: 'Конструктор сети' }
    ],
    relatedTheory: [
      { topic: 'ethernet', text: 'Ethernet и канальный уровень' }
    ],
    baseXP: 40, isBoss: true
  },

  /* ====== CHAPTER 3: Адресный переполох ====== */
  {
    id: 'ch3.1', chapter: 'ch3', title: 'IP-адресация',
    story: (p) => `Олег: «Спланируй адресацию для сети ${p.baseNetwork}. Нужно ${p.subnets.length} подсетей: ${p.subnets.map(s => `${s.name} (${s.hosts} хостов)`).join(', ')}.»`,
    generate(rng) {
      const bases = ['10.0.0.0/16', '172.16.0.0/16', '192.168.0.0/16'];
      const baseNetwork = rng.pick(bases);
      const deptNames = ['Бухгалтерия', 'Разработка', 'Продажи', 'HR', 'Серверы', 'Wi-Fi'];
      const count = rng.int(2, 5);
      const subnets = rng.shuffle(deptNames).slice(0, count).map(name => ({
        name, hosts: rng.pick([10, 25, 30, 50, 100, 200])
      }));
      // Calculate minimum masks
      subnets.forEach(s => {
        let bits = 0;
        while ((1 << bits) - 2 < s.hosts) bits++;
        s.prefix = 32 - bits;
        s.maxHosts = (1 << bits) - 2;
      });
      return { baseNetwork, subnets };
    },
    validate(answer, p) {
      // Accept any answer that provides non-overlapping subnets with enough hosts
      if (typeof answer !== 'object') return false;
      return p.subnets.every(s => {
        const ans = answer[s.name] || answer[s.name.toLowerCase()];
        if (!ans) return false;
        // Check prefix allows enough hosts
        const prefix = parseInt((ans.match(/\/(\d+)/) || [])[1] || '0');
        return prefix > 0 && prefix <= s.prefix;
      });
    },
    explain: (p) => `Разбиение:\n${p.subnets.map(s => `• ${s.name}: /${s.prefix} (до ${s.maxHosts} хостов, нужно ${s.hosts})`).join('\n')}`,
    hints: [
      () => `Формула: хосты = 2^(32−prefix) − 2. Выбери наименьший prefix, вмещающий все хосты.`,
      (p) => `Подсказка по маскам: ${p.subnets.map(s => `${s.name} (${s.hosts} хостов) → /${s.prefix}`).join(', ')}.`,
      (p) => `${p.subnets.map(s => `${s.name} = /${s.prefix}`).join(', ')}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'ipCalc', text: 'IP-калькулятор' },
      { section: 'lab', lab: 'topologyBuilder', text: 'Конструктор топологий' }
    ],
    relatedTheory: [
      { topic: 'ip-addressing', text: 'IP-адресация' }
    ],
    baseXP: 20, isBoss: false
  },
  {
    id: 'ch3.2', chapter: 'ch3', title: 'Маски и подсети',
    story: (p) => `Олег: «Адрес ${p.ip}/${p.prefix}. Сколько хостов в подсети? Какой адрес сети и broadcast?»`,
    generate(rng) {
      const octets = [rng.int(10, 192), rng.int(0, 255), rng.int(0, 255), rng.int(1, 254)];
      const ip = octets.join('.');
      const prefix = rng.int(20, 30);
      const hostBits = 32 - prefix;
      const maxHosts = (1 << hostBits) - 2;
      const ipNum = (octets[0] << 24 | octets[1] << 16 | octets[2] << 8 | octets[3]) >>> 0;
      const mask = (0xFFFFFFFF << hostBits) >>> 0;
      const networkNum = (ipNum & mask) >>> 0;
      const broadcastNum = (networkNum | ~mask) >>> 0;
      const toIP = n => `${(n >>> 24) & 0xFF}.${(n >>> 16) & 0xFF}.${(n >>> 8) & 0xFF}.${n & 0xFF}`;
      return { ip, prefix, maxHosts, network: toIP(networkNum), broadcast: toIP(broadcastNum) };
    },
    validate(answer, p) {
      if (typeof answer !== 'object') return false;
      const hostsOk = (answer.hosts || answer.maxHosts || 0) === p.maxHosts;
      const netOk = (answer.network || '') === p.network;
      return hostsOk || netOk;
    },
    explain: (p) => `${p.ip}/${p.prefix}: сеть ${p.network}, broadcast ${p.broadcast}, хостов: ${p.maxHosts}.`,
    hints: [
      (p) => `Маска /${p.prefix} оставляет ${32 - p.prefix} бит для хостов.`,
      (p) => `Хостов = 2^${32 - p.prefix} − 2 = ${p.maxHosts}.`,
      (p) => `Сеть: ${p.network}, broadcast: ${p.broadcast}, хостов: ${p.maxHosts}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'ipCalc', text: 'IP-калькулятор' }
    ],
    relatedTheory: [
      { topic: 'ip-addressing', text: 'IP-адресация' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch3.3', chapter: 'ch3', title: 'Маршрутизация',
    story: (p) => `Олег: «Пакет от ${p.srcIP} не доходит до ${p.dstIP}. В таблице маршрутизации роутера ${p.routerName} не хватает маршрута. Исправь!»`,
    generate(rng) {
      const routers = ['R1', 'R2', 'R3'];
      const routerName = rng.pick(routers);
      const srcIP = `192.168.${rng.int(1, 10)}.${rng.int(1, 254)}`;
      const dstNet = `10.${rng.int(0, 50)}.${rng.int(0, 50)}.0`;
      const dstIP = dstNet.replace('.0', '.' + rng.int(1, 254));
      const nextHop = `192.168.${rng.int(1, 10)}.1`;
      return { routerName, srcIP, dstIP, dstNet, nextHop, missingRoute: `${dstNet}/24 via ${nextHop}` };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : JSON.stringify(answer)).toLowerCase();
      return ans.includes(p.dstNet.split('.').slice(0, 3).join('.')) && ans.includes(p.nextHop.split('.').slice(0, 3).join('.'));
    },
    explain: (p) => `Нужен маршрут: ${p.missingRoute} на ${p.routerName}.`,
    hints: [
      (p) => `Пакет к ${p.dstIP} — проверь, есть ли маршрут к сети ${p.dstNet}/24.`,
      (p) => `Добавь маршрут к ${p.dstNet}/24 через ${p.nextHop}.`,
      (p) => `ip route add ${p.missingRoute}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'routing', text: 'Маршрутизация и TTL' },
      { section: 'lab', lab: 'routingSim', text: 'Протоколы маршрутизации' }
    ],
    relatedTheory: [
      { topic: 'routing', text: 'Маршрутизация' }
    ],
    baseXP: 20, isBoss: false
  },
  {
    id: 'ch3.4', chapter: 'ch3', title: 'TTL',
    story: (p) => `Олег: «Пакет зацикливается между роутерами! TTL = ${p.ttl}. Найди, между какими роутерами петля.»`,
    generate(rng) {
      const ttl = rng.int(3, 8);
      const routerA = `R${rng.int(1, 3)}`;
      const routerB = `R${rng.int(4, 6)}`;
      return { ttl, routerA, routerB, loop: `${routerA} ↔ ${routerB}` };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : '').toUpperCase();
      return ans.includes(p.routerA) && ans.includes(p.routerB);
    },
    explain: (p) => `Петля между ${p.routerA} и ${p.routerB}. TTL ${p.ttl} → пакет пройдёт ${p.ttl} хопов и умрёт.`,
    hints: [
      () => `Используй traceroute — он покажет, где пакет зацикливается.`,
      (p) => `TTL уменьшается на 1 на каждом хопе. Петля: один из роутеров — ${p.routerA}.`,
      (p) => `Петля: ${p.loop}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'routing', text: 'Маршрутизация и TTL' },
      { section: 'lab', lab: 'topologyBuilder', text: 'Конструктор топологий' }
    ],
    relatedTheory: [
      { topic: 'routing', text: 'Маршрутизация' },
      { topic: 'ip-addressing', text: 'IP-адресация' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch3.5', chapter: 'ch3', title: 'Фрагментация',
    story: (p) => `Олег: «Файл ${p.fileSize} КБ передаётся через канал с MTU ${p.mtu}. Сколько фрагментов получится?»`,
    generate(rng) {
      const fileSize = rng.int(2, 64);
      const mtu = rng.pick([576, 1000, 1280, 1500]);
      const headerSize = 20;
      const payloadPerFragment = mtu - headerSize;
      const totalBytes = fileSize * 1024;
      const fragments = Math.ceil(totalBytes / payloadPerFragment);
      return { fileSize, mtu, headerSize, payloadPerFragment, fragments };
    },
    validate(answer, p) {
      const val = typeof answer === 'object' ? (answer.fragments || 0) : parseInt(answer);
      return val === p.fragments;
    },
    explain: (p) => `MTU ${p.mtu} − заголовок ${p.headerSize} = ${p.payloadPerFragment} Б полезных данных. Файл ${p.fileSize} КБ = ${p.fileSize * 1024} Б → ${p.fragments} фрагментов.`,
    hints: [
      () => `Полезная нагрузка = MTU − заголовок IP (20 Б). Фрагменты = ceil(данные / нагрузка).`,
      (p) => `Payload = ${p.mtu} − 20 = ${p.payloadPerFragment} Б. Данные = ${p.fileSize * 1024} Б.`,
      (p) => `Фрагментов: ${p.fragments}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'fragmentation', text: 'Фрагментация MTU' },
      { section: 'lab', lab: 'ipCalc', text: 'IP-калькулятор' }
    ],
    relatedTheory: [
      { topic: 'ip-addressing', text: 'IP-адресация' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch3.6', chapter: 'ch3', title: 'NAT',
    story: (p) => `Олег: «Внутренняя сеть ${p.internalNet}/${p.prefix}, ${p.hostCount} хостов. Внешний IP: ${p.externalIP}. Настрой NAT для выхода в интернет.»`,
    generate(rng) {
      const internalNet = `192.168.${rng.int(1, 254)}.0`;
      const prefix = rng.pick([24, 25, 26]);
      const hostCount = rng.int(5, 30);
      const externalIP = `${rng.int(80, 220)}.${rng.int(0, 255)}.${rng.int(0, 255)}.${rng.int(1, 254)}`;
      const natType = hostCount > 1 ? 'PAT (NAPT/Overload)' : 'Static NAT';
      return { internalNet, prefix, hostCount, externalIP, natType };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : JSON.stringify(answer)).toLowerCase();
      return ans.includes('nat') || ans.includes('masquerade') || ans.includes('overload') || ans.includes('pat');
    },
    explain: (p) => `Тип NAT: ${p.natType}. Внутр: ${p.internalNet}/${p.prefix} → Внеш: ${p.externalIP}. iptables: -t nat -A POSTROUTING -s ${p.internalNet}/${p.prefix} -j MASQUERADE`,
    hints: [
      () => `Для нескольких хостов за одним IP используется PAT (Port Address Translation).`,
      (p) => `Внутренняя сеть ${p.internalNet}/${p.prefix}, ${p.hostCount} хостов → нужен ${p.natType}.`,
      (p) => `${p.natType}: iptables -t nat -A POSTROUTING -s ${p.internalNet}/${p.prefix} -j MASQUERADE`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'natTraversal', text: 'NAT / PAT' },
      { section: 'lab', lab: 'ipCalc', text: 'IP-калькулятор' }
    ],
    relatedTheory: [
      { topic: 'ip-addressing', text: 'IP-адресация' },
      { topic: 'routing', text: 'Маршрутизация' }
    ],
    baseXP: 20, isBoss: false
  },
  {
    id: 'ch3.boss', chapter: 'ch3', title: 'Объединение филиалов',
    story: (p) => `Олег: «Нужно объединить ${p.branches.length} филиала в единую сеть. Филиалы: ${p.branches.map(b => `${b.name} (${b.hosts} хостов)`).join(', ')}. Каналы между ними — ${p.linkType}. Спланируй адресацию и маршрутизацию!»`,
    generate(rng) {
      const branchNames = ['Москва', 'СПб', 'Новосибирск', 'Казань', 'Екатеринбург'];
      const count = rng.int(2, 4);
      const branches = rng.shuffle(branchNames).slice(0, count).map((name, i) => ({
        name, hosts: rng.int(20, 100), subnet: `10.${i + 1}.0.0/16`
      }));
      const linkType = rng.pick(['VPN (IPsec)', 'MPLS', 'Арендованная линия']);
      return { branches, linkType, routingProtocol: rng.pick(['OSPF', 'BGP']) };
    },
    validate(answer, p) {
      if (typeof answer !== 'object') return false;
      const hasSubnets = p.branches.every(b => answer[b.name] || answer[b.name.toLowerCase()]);
      return hasSubnets;
    },
    explain: (p) => `Филиалы: ${p.branches.map(b => `${b.name}: ${b.subnet} (${b.hosts} хостов)`).join(', ')}. Связь: ${p.linkType}. Маршрутизация: ${p.routingProtocol}.`,
    hints: [
      (p) => `Каждому филиалу — своя подсеть. Связь через ${p.linkType}.`,
      (p) => `Адресация: ${p.branches.map(b => `${b.name} = ${b.subnet}`).join(', ')}.`,
      (p) => `Маршрутизация: ${p.routingProtocol}. ${p.branches.map(b => `${b.name} = ${b.subnet}`).join(', ')}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'routing', text: 'Маршрутизация и TTL' },
      { section: 'lab', lab: 'routingSim', text: 'Протоколы маршрутизации' },
      { section: 'lab', lab: 'topologyBuilder', text: 'Конструктор топологий' }
    ],
    relatedTheory: [
      { topic: 'ip-addressing', text: 'IP-адресация' },
      { topic: 'routing', text: 'Маршрутизация' }
    ],
    baseXP: 50, isBoss: true
  },

  /* ====== CHAPTER 4: Транспортный коллапс ====== */
  {
    id: 'ch4.1', chapter: 'ch4', title: 'TCP Handshake',
    story: (p) => `Кирилл: «Клиент на порту ${p.srcPort} подключается к серверу ${p.dstPort}. ISN клиента = ${p.clientISN}. Какой ISN ответит сервер и что будет в ACK?»`,
    generate(rng) {
      const srcPort = rng.int(49152, 65535);
      const dstPort = rng.pick([80, 443, 22, 3306, 8080]);
      const clientISN = rng.int(1000, 999999);
      const serverISN = rng.int(1000, 999999);
      return { srcPort, dstPort, clientISN, serverISN, expectedAck: clientISN + 1 };
    },
    validate(answer, p) {
      if (typeof answer !== 'object') return false;
      const ackOk = (answer.ack || 0) === p.expectedAck;
      return ackOk;
    },
    explain: (p) => `SYN: ISN=${p.clientISN} → SYN-ACK: ISN=${p.serverISN}, ACK=${p.expectedAck} → ACK: ACK=${p.serverISN + 1}`,
    hints: [
      () => `ACK в SYN-ACK = ISN клиента + 1.`,
      (p) => `Клиент ISN = ${p.clientISN}. Сервер ответит ACK = ${p.clientISN} + 1.`,
      (p) => `ACK = ${p.expectedAck}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'tcpHandshake', text: 'TCP Handshake' },
      { section: 'lab', lab: 'tcpVsUdp', text: 'TCP vs UDP' }
    ],
    relatedTheory: [
      { topic: 'tcp', text: 'Протокол TCP' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch4.2', chapter: 'ch4', title: 'TCP vs UDP',
    story: (p) => `Кирилл: «Для ${p.task} — какой протокол лучше: TCP или UDP? Обоснуй.»`,
    generate(rng) {
      const tasks = [
        { task: 'загрузки файла 100 МБ', answer: 'TCP', reason: 'гарантированная доставка, порядок' },
        { task: 'видеостриминга в реальном времени', answer: 'UDP', reason: 'низкая задержка важнее целостности' },
        { task: 'DNS-запроса', answer: 'UDP', reason: 'один запрос-ответ, TCP overhead излишен' },
        { task: 'онлайн-игры (шутер)', answer: 'UDP', reason: 'низкая задержка, устаревшие пакеты бесполезны' },
        { task: 'VoIP-звонка', answer: 'UDP', reason: 'реальное время, ретрансмиссия бессмысленна' },
        { task: 'электронной почты (SMTP)', answer: 'TCP', reason: 'надёжная доставка сообщения' },
        { task: 'загрузки веб-страницы', answer: 'TCP', reason: 'HTTP требует гарантированной доставки' },
        { task: 'SNMP-мониторинга', answer: 'UDP', reason: 'простые запросы, минимальный overhead' }
      ];
      const t = rng.pick(tasks);
      return { task: t.task, answer: t.answer, reason: t.reason };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : answer.protocol || '').toUpperCase();
      return ans.includes(p.answer);
    },
    explain: (p) => `Для ${p.task}: ${p.answer}. Причина: ${p.reason}.`,
    hints: [
      () => `TCP = надёжность + порядок. UDP = скорость + минимум overhead.`,
      (p) => `Подумай: для ${p.task} важнее надёжность или скорость?`,
      (p) => `Ответ: ${p.answer} (${p.reason})`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'tcpVsUdp', text: 'TCP vs UDP' },
      { section: 'lab', lab: 'tcpHandshake', text: 'TCP Handshake' }
    ],
    relatedTheory: [
      { topic: 'tcp', text: 'Протокол TCP' },
      { topic: 'udp', text: 'Протокол UDP' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch4.3', chapter: 'ch4', title: 'Порты',
    story: (p) => `Кирилл: «Определи сервисы по портам: ${p.ports.map(p => p.port).join(', ')}.»`,
    generate(rng) {
      const allPorts = Object.entries(SERVICES_BY_PORT);
      const selected = rng.shuffle(allPorts).slice(0, rng.int(5, 8));
      return { ports: selected.map(([port, service]) => ({ port: parseInt(port), service })) };
    },
    validate(answer, p) {
      if (typeof answer !== 'object') return false;
      let correct = 0;
      p.ports.forEach(({ port, service }) => {
        const ans = (answer[port] || answer[String(port)] || '').toLowerCase();
        if (ans && service.toLowerCase().includes(ans.split(/[-_ ]/)[0])) correct++;
      });
      return correct >= Math.ceil(p.ports.length * 0.7);
    },
    explain: (p) => `Порты: ${p.ports.map(pp => `${pp.port} = ${pp.service}`).join(', ')}.`,
    hints: [
      () => `Хорошо известные порты: 80=HTTP, 443=HTTPS, 22=SSH, 53=DNS...`,
      (p) => `Один из портов: ${p.ports[0].port} = ${p.ports[0].service}.`,
      (p) => `${p.ports.map(pp => `${pp.port}=${pp.service}`).join(', ')}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'terminal', text: 'Терминал' },
      { section: 'lab', lab: 'tcpVsUdp', text: 'TCP vs UDP' }
    ],
    relatedTheory: [
      { topic: 'tcp', text: 'Протокол TCP' },
      { topic: 'udp', text: 'Протокол UDP' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch4.4', chapter: 'ch4', title: 'Перегрузка',
    story: (p) => `Кирилл: «Канал: RTT ${p.rtt} мс, потери ${p.loss}%. Текущий cwnd = ${p.cwnd} MSS, ssthresh = ${p.ssthresh}. В какой фазе TCP? Что будет при потере?»`,
    generate(rng) {
      const rtt = rng.pick([10, 20, 50, 100, 200]);
      const loss = rng.int(1, 5);
      const cwnd = rng.int(1, 32);
      const ssthresh = rng.int(8, 32);
      const phase = cwnd < ssthresh ? 'Slow Start' : 'Congestion Avoidance';
      const newSsthresh = Math.max(Math.floor(cwnd / 2), 2);
      return { rtt, loss, cwnd, ssthresh, phase, newSsthresh };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : JSON.stringify(answer)).toLowerCase();
      return ans.includes(p.phase.toLowerCase().replace(' ', '')) || ans.includes(p.phase.toLowerCase());
    },
    explain: (p) => `cwnd=${p.cwnd}, ssthresh=${p.ssthresh} → фаза: ${p.phase}. При потере: ssthresh = cwnd/2 = ${p.newSsthresh}, cwnd = 1 (Tahoe) или cwnd = ssthresh (Reno).`,
    hints: [
      () => `cwnd < ssthresh → Slow Start. cwnd ≥ ssthresh → Congestion Avoidance.`,
      (p) => `cwnd = ${p.cwnd}, ssthresh = ${p.ssthresh}. ${p.cwnd < p.ssthresh ? 'cwnd < ssthresh' : 'cwnd ≥ ssthresh'}.`,
      (p) => `Фаза: ${p.phase}. При потере: ssthresh = ${p.newSsthresh}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'tcpCongestion', text: 'Перегрузка TCP' },
      { section: 'lab', lab: 'tcpWindow', text: 'Скользящее окно' }
    ],
    relatedTheory: [
      { topic: 'tcp', text: 'Протокол TCP' }
    ],
    baseXP: 20, isBoss: false
  },
  {
    id: 'ch4.5', chapter: 'ch4', title: 'Скользящее окно',
    story: (p) => `Кирилл: «Канал: BDP = ${p.bdp} Б, RTT = ${p.rtt} мс, bandwidth = ${p.bw} Мбит/с. Какой оптимальный размер окна?»`,
    generate(rng) {
      const bw = rng.pick([1, 10, 100, 1000]); // Mbps
      const rtt = rng.pick([1, 10, 50, 100, 200]); // ms
      const bdp = Math.round(bw * 1e6 / 8 * rtt / 1000); // bytes
      const windowSegments = Math.ceil(bdp / 1460);
      return { bw, rtt, bdp, windowSegments, windowBytes: bdp };
    },
    validate(answer, p) {
      const val = typeof answer === 'object' ? (answer.window || answer.bytes || 0) : parseInt(answer);
      return Math.abs(val - p.bdp) / p.bdp < 0.2 || Math.abs(val - p.windowSegments) <= 1;
    },
    explain: (p) => `BDP = bandwidth × RTT = ${p.bw} Мбит/с × ${p.rtt} мс = ${p.bdp} Б ≈ ${p.windowSegments} сегментов (MSS=1460).`,
    hints: [
      () => `BDP (Bandwidth-Delay Product) = bandwidth × RTT. Окно должно быть ≥ BDP.`,
      (p) => `${p.bw} Мбит/с = ${p.bw * 1e6 / 8} Б/с. RTT = ${p.rtt / 1000} с.`,
      (p) => `Окно = ${p.bdp} Б ≈ ${p.windowSegments} сегментов`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'tcpWindow', text: 'Скользящее окно' },
      { section: 'lab', lab: 'tcpCongestion', text: 'Перегрузка TCP' }
    ],
    relatedTheory: [
      { topic: 'tcp', text: 'Протокол TCP' }
    ],
    baseXP: 20, isBoss: false
  },
  {
    id: 'ch4.boss', chapter: 'ch4', title: 'Видеоконференция лагает',
    story: (p) => `Кирилл: «Видеоконференция лагает! Симптомы: ${p.symptoms.join(', ')}. Найди причину и предложи решение.»`,
    generate(rng) {
      const issues = [
        { symptom: 'задержка видео >500 мс', cause: 'высокий RTT', fix: 'уменьшить количество хопов / QoS' },
        { symptom: 'пиксели и артефакты', cause: 'потеря пакетов', fix: 'уменьшить загрузку канала / FEC' },
        { symptom: 'звук обрывается', cause: 'джиттер', fix: 'увеличить jitter buffer / QoS приоритет' },
        { symptom: 'видео замирает на 2-3 сек', cause: 'TCP retransmission (неправильный протокол)', fix: 'использовать UDP/RTP' }
      ];
      const count = rng.int(2, 3);
      const selected = rng.shuffle(issues).slice(0, count);
      return { symptoms: selected.map(i => i.symptom), causes: selected.map(i => i.cause), fixes: selected.map(i => i.fix) };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : JSON.stringify(answer)).toLowerCase();
      return p.causes.some(c => ans.includes(c.split(' ')[0].toLowerCase())) ||
             p.fixes.some(f => ans.includes(f.split(' ')[0].toLowerCase()));
    },
    explain: (p) => `Причины и решения:\n${p.symptoms.map((s, i) => `• ${s} → ${p.causes[i]} → ${p.fixes[i]}`).join('\n')}`,
    hints: [
      (p) => `Проанализируй каждый симптом: задержка, потери или джиттер?`,
      (p) => `Причины: ${p.causes.join(', ')}.`,
      (p) => `Решения: ${p.fixes.join('; ')}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'tcpVsUdp', text: 'TCP vs UDP' },
      { section: 'lab', lab: 'tcpCongestion', text: 'Перегрузка TCP' },
      { section: 'lab', lab: 'terminal', text: 'Терминал' }
    ],
    relatedTheory: [
      { topic: 'tcp', text: 'Протокол TCP' },
      { topic: 'udp', text: 'Протокол UDP' }
    ],
    baseXP: 40, isBoss: true
  },

  /* ====== CHAPTER 5: Цифровая крепость ====== */
  {
    id: 'ch5.1', chapter: 'ch5', title: 'Шифрование',
    story: (p) => `Алиса: «Зашифруй сообщение "${p.message}" методом ${p.method}. Ключ: ${p.key}.»`,
    generate(rng) {
      const methods = [
        { name: 'Шифр Цезаря', key: rng.int(1, 25) },
        { name: 'XOR', key: rng.int(10, 255) }
      ];
      const method = rng.pick(methods);
      const messages = ['HELLO', 'NETWORK', 'SECURITY', 'FIREWALL', 'PACKET', 'ROUTER', 'SERVER'];
      const message = rng.pick(messages);
      let encrypted;
      if (method.name === 'Шифр Цезаря') {
        encrypted = message.split('').map(c => String.fromCharCode(((c.charCodeAt(0) - 65 + method.key) % 26) + 65)).join('');
      } else {
        encrypted = message.split('').map(c => (c.charCodeAt(0) ^ method.key).toString(16).padStart(2, '0')).join(' ');
      }
      return { message, method: method.name, key: method.key, encrypted };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : '').toUpperCase().replace(/\s/g, '');
      const exp = p.encrypted.toUpperCase().replace(/\s/g, '');
      return ans === exp;
    },
    explain: (p) => `"${p.message}" + ${p.method}(ключ=${p.key}) = "${p.encrypted}"`,
    hints: [
      (p) => `${p.method}: ${p.method === 'Шифр Цезаря' ? 'сдвинь каждую букву на ' + p.key + ' позиций' : 'XOR каждого символа с ключом ' + p.key}.`,
      (p) => `Первая буква "${p.message[0]}" → "${p.encrypted.split(' ')[0] || p.encrypted[0]}".`,
      (p) => `Ответ: ${p.encrypted}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'encryption', text: 'Шифрование' },
      { section: 'lab', lab: 'tls', text: 'TLS / Сертификаты' }
    ],
    relatedTheory: [
      { topic: 'security', text: 'Безопасность' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch5.2', chapter: 'ch5', title: 'TLS',
    story: (p) => `Алиса: «Установи TLS ${p.version} соединение. Какие шаги рукопожатия и какой cipher suite будет использован?»`,
    generate(rng) {
      const v = rng.pick(['1.2', '1.3']);
      const ciphers12 = ['TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384'];
      const ciphers13 = ['TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256'];
      const cipher = v === '1.2' ? rng.pick(ciphers12) : rng.pick(ciphers13);
      const steps = v === '1.2'
        ? ['ClientHello', 'ServerHello + Certificate', 'ServerKeyExchange', 'ClientKeyExchange', 'ChangeCipherSpec', 'Finished']
        : ['ClientHello + key_share', 'ServerHello + key_share + EncryptedExtensions + Certificate + Finished', 'Client Finished'];
      return { version: v, cipher, steps, rttCount: v === '1.2' ? 2 : 1 };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : JSON.stringify(answer)).toLowerCase();
      return ans.includes('clienthello') || ans.includes(p.rttCount.toString() + '-rtt') || ans.includes(p.rttCount + ' rtt');
    },
    explain: (p) => `TLS ${p.version}: ${p.rttCount}-RTT рукопожатие. Шаги: ${p.steps.join(' → ')}. Cipher: ${p.cipher}.`,
    hints: [
      (p) => `TLS ${p.version}: сколько RTT нужно для рукопожатия?`,
      (p) => `TLS ${p.version} = ${p.rttCount}-RTT. Начинается с ClientHello.`,
      (p) => `Шаги: ${p.steps.join(' → ')}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'tls', text: 'TLS / Сертификаты' },
      { section: 'lab', lab: 'encryption', text: 'Шифрование' }
    ],
    relatedTheory: [
      { topic: 'security', text: 'Безопасность' }
    ],
    baseXP: 20, isBoss: false
  },
  {
    id: 'ch5.3', chapter: 'ch5', title: 'Firewall',
    story: (p) => `Алиса: «Атака: ${p.attackDesc}. Напиши правило iptables для защиты.»`,
    generate(rng) {
      const attacks = [
        { desc: 'порт-скан с IP 10.0.0.50', rule: 'iptables -A INPUT -s 10.0.0.50 -j DROP', ip: '10.0.0.50' },
        { desc: 'DDoS на порт 80', rule: 'iptables -A INPUT -p tcp --dport 80 -m limit --limit 50/s -j ACCEPT', port: 80 },
        { desc: 'SSH bruteforce', rule: 'iptables -A INPUT -p tcp --dport 22 -m limit --limit 3/min -j ACCEPT', port: 22 },
        { desc: 'неавторизованный доступ к MySQL', rule: 'iptables -A INPUT -p tcp --dport 3306 -s !192.168.1.0/24 -j DROP', port: 3306 }
      ];
      const attack = rng.pick(attacks);
      return { attackDesc: attack.desc, expectedRule: attack.rule, port: attack.port, ip: attack.ip };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : '').toLowerCase();
      return ans.includes('iptables') && (
        (p.port && ans.includes(String(p.port))) ||
        (p.ip && ans.includes(p.ip)) ||
        ans.includes('drop') || ans.includes('limit')
      );
    },
    explain: (p) => `Правило: ${p.expectedRule}`,
    hints: [
      (p) => `Используй iptables с цепочкой INPUT. Действие: DROP или LIMIT.`,
      (p) => `${p.port ? 'Порт: ' + p.port : 'IP: ' + p.ip}. Используй -j DROP или -m limit.`,
      (p) => `${p.expectedRule}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'firewallSim', text: 'Firewall' },
      { section: 'lab', lab: 'terminal', text: 'Терминал' }
    ],
    relatedTheory: [
      { topic: 'security', text: 'Безопасность' }
    ],
    baseXP: 20, isBoss: false
  },
  {
    id: 'ch5.4', chapter: 'ch5', title: 'Сертификаты',
    story: (p) => `Алиса: «Проверь сертификат сайта ${p.domain}. Что не так? Истекает: ${p.expires}, издатель: ${p.issuer}.»`,
    generate(rng) {
      const domains = ['example.com', 'shop.local', 'api.company.ru', 'mail.corp.net'];
      const issues = [
        { type: 'expired', desc: 'сертификат просрочен', fix: 'обновить сертификат' },
        { type: 'self-signed', desc: 'самоподписанный сертификат', fix: 'получить сертификат от CA' },
        { type: 'wrong-domain', desc: 'имя домена не совпадает', fix: 'выпустить сертификат для правильного домена' },
        { type: 'weak-key', desc: 'слабый ключ (RSA-1024)', fix: 'использовать RSA-2048 или выше' }
      ];
      const issue = rng.pick(issues);
      const domain = rng.pick(domains);
      const issuers = ['Let\'s Encrypt', 'DigiCert', 'self-signed', 'Unknown CA'];
      return {
        domain, issuer: issue.type === 'self-signed' ? 'self-signed' : rng.pick(issuers),
        expires: issue.type === 'expired' ? '2024-01-15' : '2027-06-30',
        issue: issue.desc, fix: issue.fix, issueType: issue.type
      };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : '').toLowerCase();
      return ans.includes(p.issueType) || ans.includes(p.issue.split(' ')[0]) || ans.includes(p.fix.split(' ')[0]);
    },
    explain: (p) => `Проблема: ${p.issue}. Решение: ${p.fix}.`,
    hints: [
      (p) => `Проверь: дата истечения, издатель, имя домена, длину ключа.`,
      (p) => `Обрати внимание на ${p.issueType === 'expired' ? 'дату' : p.issueType === 'self-signed' ? 'издателя' : p.issueType === 'wrong-domain' ? 'домен в сертификате' : 'длину ключа'}.`,
      (p) => `Проблема: ${p.issue}. Решение: ${p.fix}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'tls', text: 'TLS / Сертификаты' },
      { section: 'lab', lab: 'encryption', text: 'Шифрование' }
    ],
    relatedTheory: [
      { topic: 'security', text: 'Безопасность' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch5.boss', chapter: 'ch5', title: 'Взлом сети',
    story: (p) => `Алиса: «Обнаружен инцидент! Уязвимости: ${p.vulns.map(v => v.desc).join('; ')}. Устрани все!»`,
    generate(rng) {
      const allVulns = [
        { desc: 'открытый порт 23 (Telnet)', fix: 'закрыть порт / заменить на SSH' },
        { desc: 'пароль admin:admin на роутере', fix: 'сменить пароль на сложный' },
        { desc: 'HTTP без шифрования (порт 80)', fix: 'включить HTTPS (TLS)' },
        { desc: 'firewall отключен', fix: 'включить и настроить правила' },
        { desc: 'устаревший TLS 1.0', fix: 'обновить до TLS 1.2/1.3' }
      ];
      const count = rng.int(2, 4);
      const vulns = rng.shuffle(allVulns).slice(0, count);
      return { vulns };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : JSON.stringify(answer)).toLowerCase();
      return p.vulns.filter(v => {
        const keywords = v.fix.toLowerCase().split(/\s+/);
        return keywords.some(kw => kw.length > 3 && ans.includes(kw));
      }).length >= Math.ceil(p.vulns.length * 0.5);
    },
    explain: (p) => `Уязвимости:\n${p.vulns.map(v => `• ${v.desc} → ${v.fix}`).join('\n')}`,
    hints: [
      (p) => `Найдено ${p.vulns.length} уязвимостей. Начни с самой критичной.`,
      (p) => `Проблемы: ${p.vulns.map(v => v.desc).join('; ')}.`,
      (p) => `Решения: ${p.vulns.map(v => v.fix).join('; ')}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'firewallSim', text: 'Firewall' },
      { section: 'lab', lab: 'encryption', text: 'Шифрование' },
      { section: 'lab', lab: 'tls', text: 'TLS / Сертификаты' }
    ],
    relatedTheory: [
      { topic: 'security', text: 'Безопасность' }
    ],
    baseXP: 50, isBoss: true
  },

  /* ====== CHAPTER 6: Свой провайдер ====== */
  {
    id: 'ch6.1', chapter: 'ch6', title: 'DNS',
    story: (p) => `Директор: «Настрой DNS для домена ${p.domain}. Нужны записи: ${p.requiredRecords.map(r => r.type).join(', ')}.»`,
    generate(rng) {
      const domains = ['company.ru', 'myshop.com', 'school.edu', 'startup.io'];
      const domain = rng.pick(domains);
      const records = [
        { type: 'A', value: `${rng.int(80,220)}.${rng.int(0,255)}.${rng.int(0,255)}.${rng.int(1,254)}` },
        { type: 'MX', value: `mail.${domain}` },
        { type: 'NS', value: `ns1.${domain}` },
        { type: 'CNAME', value: `www.${domain} → ${domain}` }
      ];
      const count = rng.int(2, 4);
      return { domain, requiredRecords: rng.shuffle(records).slice(0, count) };
    },
    validate(answer, p) {
      if (typeof answer !== 'object') return false;
      return p.requiredRecords.every(r => {
        const val = answer[r.type] || answer[r.type.toLowerCase()];
        return val && val.length > 0;
      });
    },
    explain: (p) => `DNS записи для ${p.domain}:\n${p.requiredRecords.map(r => `• ${r.type}: ${r.value}`).join('\n')}`,
    hints: [
      () => `A = IP-адрес, MX = почтовый сервер, NS = DNS-сервер, CNAME = алиас.`,
      (p) => `Нужны записи: ${p.requiredRecords.map(r => r.type).join(', ')} для ${p.domain}.`,
      (p) => `${p.requiredRecords.map(r => `${r.type} = ${r.value}`).join(', ')}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'terminal', text: 'Терминал' },
      { section: 'lab', lab: 'topologyBuilder', text: 'Конструктор топологий' }
    ],
    relatedTheory: [
      { topic: 'application-protocols', text: 'Прикладные протоколы' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch6.2', chapter: 'ch6', title: 'DHCP',
    story: (p) => `Директор: «Настрой DHCP для ${p.clientCount} клиентов. Пул: ${p.poolStart}–${p.poolEnd}, шлюз: ${p.gateway}, DNS: ${p.dns}.»`,
    generate(rng) {
      const subnet = rng.int(1, 254);
      const clientCount = rng.int(10, 100);
      const poolStart = `192.168.${subnet}.100`;
      const poolEnd = `192.168.${subnet}.${Math.min(100 + clientCount + 10, 254)}`;
      const gateway = `192.168.${subnet}.1`;
      const dns = rng.pick(['8.8.8.8', '1.1.1.1', '77.88.8.8']);
      const lease = rng.pick([3600, 7200, 86400]);
      return { clientCount, poolStart, poolEnd, gateway, dns, lease, subnet: `192.168.${subnet}.0/24` };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : JSON.stringify(answer)).toLowerCase();
      return ans.includes(p.gateway) || ans.includes('dhcp') || ans.includes(p.poolStart);
    },
    explain: (p) => `DHCP: пул ${p.poolStart}–${p.poolEnd}, шлюз ${p.gateway}, DNS ${p.dns}, аренда ${p.lease} сек.`,
    hints: [
      () => `Укажи: пул адресов, шлюз (default-router), DNS-сервер, время аренды.`,
      (p) => `Пул: ${p.poolStart}–${p.poolEnd}. Шлюз: ${p.gateway}.`,
      (p) => `Полная конфигурация: subnet ${p.subnet}, range ${p.poolStart}–${p.poolEnd}, router ${p.gateway}, dns ${p.dns}, lease ${p.lease}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'dhcpLease', text: 'DHCP DORA' },
      { section: 'lab', lab: 'terminal', text: 'Терминал' }
    ],
    relatedTheory: [
      { topic: 'application-protocols', text: 'Прикладные протоколы' },
      { topic: 'network-management', text: 'Управление сетью' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch6.3', chapter: 'ch6', title: 'HTTP',
    story: (p) => `Директор: «Сайт возвращает ошибку ${p.code}. Что это значит и как исправить?»`,
    generate(rng) {
      const errors = [
        { code: 403, name: 'Forbidden', cause: 'нет прав доступа', fix: 'проверить права файлов / настройки сервера' },
        { code: 404, name: 'Not Found', cause: 'страница не найдена', fix: 'проверить URL / наличие файла' },
        { code: 500, name: 'Internal Server Error', cause: 'ошибка в скрипте сервера', fix: 'проверить логи / исправить код' },
        { code: 502, name: 'Bad Gateway', cause: 'upstream сервер не отвечает', fix: 'перезапустить backend / проверить proxy' },
        { code: 503, name: 'Service Unavailable', cause: 'сервер перегружен', fix: 'добавить ресурсы / масштабировать' },
        { code: 301, name: 'Moved Permanently', cause: 'ресурс перемещён', fix: 'обновить URL / настроить redirect' }
      ];
      const err = rng.pick(errors);
      return { code: err.code, name: err.name, cause: err.cause, fix: err.fix };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : '').toLowerCase();
      return ans.includes(p.cause.split(' ')[0]) || ans.includes(p.fix.split(' ')[0]) || ans.includes(p.name.toLowerCase());
    },
    explain: (p) => `${p.code} ${p.name}: ${p.cause}. Решение: ${p.fix}.`,
    hints: [
      (p) => `Код ${p.code} — это ошибка ${Math.floor(p.code / 100)}xx.`,
      (p) => `${p.code} = ${p.name}. Причина: ${p.cause}.`,
      (p) => `Решение: ${p.fix}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'terminal', text: 'Терминал' },
      { section: 'lab', lab: 'topologyBuilder', text: 'Конструктор топологий' }
    ],
    relatedTheory: [
      { topic: 'application-protocols', text: 'Прикладные протоколы' },
      { topic: 'principles', text: 'Основы сетей' }
    ],
    baseXP: 15, isBoss: false
  },
  {
    id: 'ch6.4', chapter: 'ch6', title: 'Мониторинг',
    story: (p) => `Директор: «В логах аномалия: ${p.anomaly}. Найди источник и тип проблемы.»`,
    generate(rng) {
      const anomalies = [
        { desc: '1000+ запросов с одного IP за минуту', type: 'DDoS/bruteforce', source: rng.ip('10.0.0', 254) },
        { desc: 'ошибки аутентификации каждые 2 сек', type: 'bruteforce SSH', source: rng.ip('192.168.1', 254) },
        { desc: 'DNS-запросы к неизвестному серверу', type: 'DNS tunneling / malware', source: rng.ip('172.16.0', 254) },
        { desc: 'трафик на порт 4444 ночью', type: 'reverse shell / backdoor', source: rng.ip('10.10.0', 254) }
      ];
      const a = rng.pick(anomalies);
      return { anomaly: a.desc, type: a.type, sourceIP: a.source };
    },
    validate(answer, p) {
      const ans = (typeof answer === 'string' ? answer : '').toLowerCase();
      return p.type.toLowerCase().split(/[/ ]/).some(word => word.length > 3 && ans.includes(word));
    },
    explain: (p) => `Аномалия: ${p.anomaly}. Тип: ${p.type}. Источник: ${p.sourceIP}.`,
    hints: [
      (p) => `Проанализируй паттерн: частота, время, направление трафика.`,
      (p) => `Источник: IP ${p.sourceIP}. Тип проблемы связан с ${p.type.split('/')[0]}.`,
      (p) => `Тип: ${p.type}, источник: ${p.sourceIP}`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'terminal', text: 'Терминал' },
      { section: 'lab', lab: 'routing', text: 'Маршрутизация и TTL' }
    ],
    relatedTheory: [
      { topic: 'network-management', text: 'Управление сетью' },
      { topic: 'application-protocols', text: 'Прикладные протоколы' }
    ],
    baseXP: 20, isBoss: false
  },
  {
    id: 'ch6.boss', chapter: 'ch6', title: 'Построй сеть компании',
    story: (p) => `Директор: «Финальное задание! Построй сеть для компании "${p.companyName}". ${p.departments.length} отделов: ${p.departments.map(d => `${d.name} (${d.employees} чел.)`).join(', ')}. Требования: ${p.requirements.join(', ')}. Бюджет: ${p.budget}.»`,
    generate(rng) {
      const companies = ['ТехноСфера', 'ИнноВейт', 'КиберЛаб', 'НетКом Плюс'];
      const deptNames = ['Разработка', 'Бухгалтерия', 'Продажи', 'HR', 'Серверная', 'Руководство', 'Колл-центр'];
      const count = rng.int(3, 5);
      const departments = rng.shuffle(deptNames).slice(0, count).map(name => ({
        name, employees: rng.int(5, 50)
      }));
      const totalEmployees = departments.reduce((s, d) => s + d.employees, 0);
      const requirements = [];
      if (rng.random() > 0.3) requirements.push('Wi-Fi для гостей');
      if (rng.random() > 0.3) requirements.push('VPN для удалённых сотрудников');
      if (rng.random() > 0.5) requirements.push('firewall на периметре');
      requirements.push('выход в интернет через NAT');
      const budget = rng.pick(['ограниченный', 'средний', 'неограниченный']);
      return { companyName: rng.pick(companies), departments, totalEmployees, requirements, budget };
    },
    validate(answer, p) {
      if (typeof answer !== 'object') return false;
      // Check that topology, addressing and security are mentioned
      const has = (key) => answer[key] || Object.values(answer).some(v => typeof v === 'string' && v.toLowerCase().includes(key));
      return has('subnet') || has('vlan') || has('router') || has('firewall') || has('nat');
    },
    explain: (p) => `Сеть "${p.companyName}": ${p.departments.map(d => `${d.name} (VLAN, ${d.employees} хостов)`).join(', ')}. ${p.requirements.join(', ')}. Итого: ${p.totalEmployees} рабочих мест.`,
    hints: [
      (p) => `Начни с адресации: каждому отделу — свою подсеть/VLAN. Всего ${p.totalEmployees} хостов.`,
      (p) => `Оборудование: core router, коммутаторы по отделам, ${p.requirements.includes('firewall на периметре') ? 'firewall,' : ''} AP для Wi-Fi.`,
      (p) => `${p.departments.map((d, i) => `${d.name}: VLAN ${(i+1)*10}, 192.168.${(i+1)*10}.0/24`).join('; ')}. NAT на выходе.`
    ],
    relatedLabs: [
      { section: 'lab', lab: 'topologyBuilder', text: 'Конструктор топологий' },
      { section: 'lab', lab: 'routing', text: 'Маршрутизация и TTL' },
      { section: 'lab', lab: 'dhcpLease', text: 'DHCP DORA' }
    ],
    relatedTheory: [
      { topic: 'principles', text: 'Основы сетей' },
      { topic: 'network-management', text: 'Управление сетью' }
    ],
    baseXP: 80, isBoss: true
  }
];
