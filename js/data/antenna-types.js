export const ANTENNA_TYPES = [
  /* ========= Всенаправленные (Omnidirectional) ========= */
  {
    id: 'dipole', name: 'Диполь (λ/2)', icon: '—',
    gain_dbi: 2.15, pattern: 'omnidirectional',
    bandwidth: 'narrow', polarization: 'linear',
    desc: 'Полуволновый диполь. Эталонная антенна (0 дБд = 2.15 дБи). Распределяет энергию равномерно в горизонтальной плоскости (тор). Длина = λ/2.',
    use: 'FM-радио, базовые Wi-Fi-антенны, LW/MW/HF вещание',
    beamwidth_h: 360, beamwidth_v: 75
  },
  {
    id: 'monopole', name: 'Монополь (λ/4)', icon: '↑',
    gain_dbi: 5.15, pattern: 'omnidirectional',
    bandwidth: 'narrow', polarization: 'vertical',
    desc: 'Четвертьволновой монополь над плоскостью земли/противовесами. Длина = λ/4. Широко используется в автомобильных и портативных устройствах.',
    use: 'Автомобильные антенны, CB-радио, ручные рации, AM/FM',
    beamwidth_h: 360, beamwidth_v: 48
  },
  {
    id: 'collinear', name: 'Коллинеарная (2×λ/2)', icon: '||',
    gain_dbi: 6.5, pattern: 'omnidirectional',
    bandwidth: 'medium', polarization: 'vertical',
    desc: 'Несколько диполей в фазе на одной оси. Сжимает паттерн по вертикали → больше энергии в горизонтальной плоскости. Длинная и стройная.',
    use: 'Базовые станции Wi-Fi, VHF/UHF ретрансляторы, AIS/ADS-B',
    beamwidth_h: 360, beamwidth_v: 30
  },
  {
    id: 'discone', name: 'Дисконус (широкополосная)', icon: '◇',
    gain_dbi: 0, pattern: 'omnidirectional',
    bandwidth: 'very_wide', polarization: 'vertical',
    desc: 'Сочетание диска и конуса. Сверхширокополосная: перекрывает в 10× и более по частоте (напр. 25 МГц–1.3 ГГц). Малое усиление, зато всеядная.',
    use: 'Сканеры и приёмники (SDR), мониторинг авиа/морской связи',
    beamwidth_h: 360, beamwidth_v: 70
  },
  {
    id: 'loop_small', name: 'Рамочная (малая петля)', icon: '○',
    gain_dbi: -5, pattern: 'figure8',
    bandwidth: 'narrow', polarization: 'horizontal',
    desc: 'Петля << λ. Острая диаграмма в виде восьмёрки — два нуля, два пика. Отличный DF (пеленгатор). Хорошо принимает LW/MW при малых размерах.',
    use: 'Пеленгация LW/MW, приёмные петли AM-радио, RFID',
    beamwidth_h: 360, beamwidth_v: 360  // special figure-8
  },
  {
    id: 'ferrite_rod', name: 'Ферритовый стержень (bar antenna)', icon: '═',
    gain_dbi: -8, pattern: 'figure8',
    bandwidth: 'narrow', polarization: 'horizontal',
    desc: 'Многовитковая катушка на ферритовом сердечнике. Компактная LW/MW антенна. Встроена в каждый AM-приёмник. Диаграмма — восьмёрка.',
    use: 'Встроенные приёмники AM/LW/MW, портативные радиоприёмники',
    beamwidth_h: 360, beamwidth_v: 360
  },

  /* ========= Направленные (Directional) ========= */
  {
    id: 'yagi_3el', name: 'Яги 3 эл.', icon: '→',
    gain_dbi: 7.5, pattern: 'directional',
    bandwidth: 'narrow', polarization: 'linear',
    desc: 'Яги-Уда из 3 элементов: рефлектор + вибратор + директор. Базовая направленная антенна. Полоса ~2-4%. Простая конструкция.',
    use: 'Любительское радио, ТВ (эфирное), Wi-Fi на небольших расстояниях',
    beamwidth_h: 100, beamwidth_v: 100
  },
  {
    id: 'yagi', name: 'Яги 10 эл.', icon: '→→→',
    gain_dbi: 14, pattern: 'directional',
    bandwidth: 'narrow', polarization: 'linear',
    desc: 'Яги-Уда из 10 элементов. Классическая ТВ-антенна. Узкий луч, высокое усиление. Механически простая. Полоса ~3-5%.',
    use: 'Эфирное ТВ (DVB-T2), point-to-point Wi-Fi, HF/VHF направленная связь',
    beamwidth_h: 50, beamwidth_v: 50
  },
  {
    id: 'yagi_20el', name: 'Яги 20 эл.', icon: '→→→→→',
    gain_dbi: 19, pattern: 'directional',
    bandwidth: 'narrow', polarization: 'linear',
    desc: 'Длинная Яги. 20+ элементов, высокое усиление при малой стоимости. Физически большая (3+ метра на 433 МГц).',
    use: 'EME (лунное эхо), дальняя связь UHF/VHF, слабосигнальные линки',
    beamwidth_h: 25, beamwidth_v: 25
  },
  {
    id: 'log_periodic', name: 'Логопериодическая (LPDA)', icon: '▶▶',
    gain_dbi: 8, pattern: 'directional',
    bandwidth: 'very_wide', polarization: 'linear',
    desc: 'Широкополосная направленная антенна. Перекрывает 3:1 и более по частоте при постоянных характеристиках. Не нужно перестраивать.',
    use: 'Ультраширокополосный приём HF/VHF/UHF, ТВ (широкополосная), EMC-тесты',
    beamwidth_h: 65, beamwidth_v: 65
  },
  {
    id: 'patch', name: 'Патч (микрополосковая)', icon: '▣',
    gain_dbi: 8, pattern: 'directional',
    bandwidth: 'medium', polarization: 'linear',
    desc: 'Плоская антенна на диэлектрической подложке. Угол обзора ~60-80°. Малая толщина, легко интегрируется в устройства.',
    use: 'GPS/GNSS, встроенные антенны ноутбуков/телефонов, Wi-Fi AP',
    beamwidth_h: 75, beamwidth_v: 65
  },
  {
    id: 'helix', name: 'Спиральная (Helix)', icon: '🌀',
    gain_dbi: 12, pattern: 'directional',
    bandwidth: 'medium', polarization: 'circular',
    desc: 'Металлическая спираль перед отражателем. Круговая поляризация (RHCP/LHCP). Не требует точной ориентации. Широко используется для спутников.',
    use: 'Спутниковая связь, кубсаты CubeSat, GPS L1/L2, ракетная телеметрия',
    beamwidth_h: 60, beamwidth_v: 60
  },
  {
    id: 'horn', name: 'Рупорная (Horn)', icon: '📯',
    gain_dbi: 18, pattern: 'directional',
    bandwidth: 'wide', polarization: 'linear',
    desc: 'Расширяющийся прямоугольный волновод (рупор). Предсказуемые характеристики, низкий КСВ. Референсная антенна для измерений.',
    use: 'Измерительные стенды, WiFi 60 ГГц, спутниковые фидеры, радары',
    beamwidth_h: 25, beamwidth_v: 25
  },

  /* ========= Высокоусилительные ========= */
  {
    id: 'parabolic', name: 'Параболическая (0.6 м)', icon: '()',
    gain_dbi: 30, pattern: 'highly_directional',
    bandwidth: 'wide', polarization: 'any',
    desc: 'Параболический рефлектор Ø60 см с облучателем в фокусе. Эффективная площадь пропорциональна D². Требует точного наведения (1-3°).',
    use: 'Спутниковое ТВ (DVB-S2) на C/Ku-диапазоне, VSAT',
    beamwidth_h: 4, beamwidth_v: 4
  },
  {
    id: 'parabolic_large', name: 'Параболическая (1.8 м)', icon: '(()',
    gain_dbi: 35, pattern: 'highly_directional',
    bandwidth: 'wide', polarization: 'any',
    desc: 'Параболический рефлектор Ø180 см. Высокое усиление, очень узкий луч (~0.5°). Требует точного привода для слежения.',
    use: 'VSAT Ka/Ku, точные радиолинки, Earth Station',
    beamwidth_h: 1.5, beamwidth_v: 1.5
  },
  {
    id: 'parabolic_vsat', name: 'Параболическая VSAT (0.9 м)', icon: '(◉)',
    gain_dbi: 38, pattern: 'highly_directional',
    bandwidth: 'wide', polarization: 'any',
    desc: 'Ø90 см. Стандартная тарелка VSAT/спутникового ТВ с LNB. Gain ~38 дБи на 12 ГГц. Оффсетная (feedhorn смещён).',
    use: 'DVB-S2 (спутниковое ТВ), VSAT интернет, HTS Ka-band',
    beamwidth_h: 2, beamwidth_v: 2
  },

  /* ========= Базовые станции ========= */
  {
    id: 'omni_vertical', name: 'Всенаправленная вертикальная', icon: '⟇',
    gain_dbi: 5, pattern: 'omnidirectional',
    bandwidth: 'wide', polarization: 'vertical',
    desc: 'Вертикальный диполь/монополь с усилением в горизонтальной плоскости. Типичная антенна на крыше или мачте.',
    use: 'Сотовые базовые станции (старые), Wi-Fi AP, PMR/TETRA ретрансляторы',
    beamwidth_h: 360, beamwidth_v: 22
  },
  {
    id: 'sector', name: 'Секторная 120°', icon: '◔',
    gain_dbi: 17, pattern: 'sector_90deg',
    bandwidth: 'wide', polarization: 'cross',
    desc: 'Панельная антенна с усилением в секторе 60-120°. 3 антенны × 120° = 360° покрытие. Кросс-поляризация (+45°/-45°) для MIMO.',
    use: 'Сотовые вышки LTE/5G/NR (3 сектора), Wi-Fi Hotspot',
    beamwidth_h: 65, beamwidth_v: 12
  },
  {
    id: 'sector_narrow', name: 'Секторная 30° (узкая)', icon: '◑',
    gain_dbi: 23, pattern: 'sector_30deg',
    bandwidth: 'wide', polarization: 'cross',
    desc: 'Высокоусилительная секторная антенна 6–30° раствора. Для стадионов, вокзалов — плотное покрытие малой площади.',
    use: 'Стадионы, вокзалы, 5G mmWave секторы, Hot-zone',
    beamwidth_h: 30, beamwidth_v: 8
  },
  {
    id: 'mimo_8t8r', name: 'Массив MIMO 8T8R', icon: '⊞',
    gain_dbi: 21, pattern: 'sector_90deg',
    bandwidth: 'wide', polarization: 'cross',
    desc: '8 горизонтальных × 2 поляризации = 16 портов. Massive MIMO для LTE-A/5G NR. Beamforming + spatial multiplexing.',
    use: 'LTE-A, 5G NR Sub-6 ГГц, Massive MIMO базовые станции',
    beamwidth_h: 65, beamwidth_v: 8
  },
  {
    id: 'phased_array', name: 'Фазированная решётка (AAS)', icon: '⊟',
    gain_dbi: 26, pattern: 'adaptive',
    bandwidth: 'wide', polarization: 'cross',
    desc: '64+ элементов с цифровым beamforming. Луч управляется электронно (мкс). Full 3D beamforming, multi-beam.',
    use: '5G NR mmWave (28/39 ГГц), военные радары, спутниковые терминалы Starlink',
    beamwidth_h: 15, beamwidth_v: 15
  },
  {
    id: 'flat_panel_5g', name: 'Плоская панель 5G mmWave', icon: '▦',
    gain_dbi: 30, pattern: 'highly_directional',
    bandwidth: 'wide', polarization: 'cross',
    desc: '64- или 256-элементная плоская решётка для 28/39 ГГц. Компактная (8×8 см на 28 ГГц). Электронное сканирование ±30°.',
    use: '5G mmWave CPE, FWA (Fixed Wireless Access), O2I penetration',
    beamwidth_h: 20, beamwidth_v: 20
  },
];

export const FSPL_FORMULA = {
  text: 'FSPL = 20·log₁₀(d) + 20·log₁₀(f) + 20·log₁₀(4π/c)',
  simplified: 'FSPL(дБ) ≈ 20·log₁₀(d, км) + 20·log₁₀(f, ГГц) + 92.45',
};

/** Рассчитать FSPL в дБ по расстоянию (м) и частоте (ГГц) */
export function calcFSPL(distM, freqGHz) {
  const distKm = Math.max(distM, 1) / 1000;
  return 20 * Math.log10(distKm) + 20 * Math.log10(Math.max(freqGHz, 0.001)) + 92.45;
}

export const WEATHER_EFFECTS = [
  { id: 'clear', name: 'Ясно', penaltyDb: 0 },
  { id: 'foggy', name: 'Туман', penaltyDb: 1 },
  { id: 'cloudy', name: 'Облачно', penaltyDb: 1.5 },
  { id: 'rain_light', name: 'Слабый дождь', penaltyDb: 3 },
  { id: 'rain', name: 'Умеренный дождь', penaltyDb: 6 },
  { id: 'heavy_rain', name: 'Ливень (20 мм/ч)', penaltyDb: 12 },
  { id: 'snow', name: 'Снегопад', penaltyDb: 4 },
  { id: 'tropical_rain', name: 'Тропический ливень', penaltyDb: 25 },
];

export const FREQ_BANDS = [
  /* ===== Низкочастотные / Радиовещание ===== */
  {
    id: 'lw', name: 'ДВ (Длинные волны, LW)', freqGHz: 0.0003, minSnr: 3,
    category: 'broadcast',
    desc: 'Дальнее распространение (до 1000 км), следует кривизне Земли. Проникает в море.',
    examples: 'Наземные маяки LORAN, NDB, военные ELF/VLF (подводные лодки)',
    lambda: '1 км – 10 км'
  },
  {
    id: 'mw', name: 'СВ (Средние волны, MW / AM)', freqGHz: 0.001, minSnr: 3,
    category: 'broadcast',
    desc: 'AM-радиовещание 526–1606 кГц. Ночью ионосферный слой E отражает сигнал — дальность до 2000 км.',
    examples: 'AM-радио (Маяк, Радио России), беспроводные телефоны',
    lambda: '200 м – 600 м'
  },
  {
    id: 'sw_hf', name: 'КВ (Короткие волны, HF/SW)', freqGHz: 0.01, minSnr: 5,
    category: 'broadcast',
    desc: 'Ионосферное отражение F2-слоем. Глобальная связь без ретрансляторов! Дальность — весь земной шар.',
    examples: 'Голос России, BBC World, SWBC, любительское радио (20/40/80 м), морская/авиационная связь',
    lambda: '10 м – 100 м'
  },
  {
    id: 'vhf_fm', name: 'ОВЧ FM-радио (87.5–108 МГц)', freqGHz: 0.098, minSnr: 8,
    category: 'broadcast',
    desc: 'FM-стерео вещание. Прямая видимость, λ≈3 м. Дальность зависит от высоты антенны (50–300 км от мачты).',
    examples: 'Радио Европа+, Авторадио, Энергия. Также метеорный рассеяв (MS) для связи DX.',
    lambda: '2.8 м – 3.4 м'
  },
  {
    id: 'dab', name: 'DAB/DAB+ цифровое радио (174–240 МГц)', freqGHz: 0.207, minSnr: 8,
    category: 'broadcast',
    desc: 'Цифровое звуковое вещание. COFDM-модуляция, мультиплексирование нескольких каналов в одной полосе. Лучше AM/FM.',
    examples: 'DAB+ (Великобритания, Германия, Австралия), T-DAB',
    lambda: '1.25 м – 1.72 м'
  },
  {
    id: 'uhf_dvbt', name: 'ЦТВ DVB-T2 (470–790 МГц)', freqGHz: 0.626, minSnr: 15,
    category: 'broadcast',
    desc: 'Цифровое эфирное ТВ (DVB-T2). OFDM 8K/32K, QAM-256, HEVC/H.265. Мультиплекс: 3–5 каналов в 8 МГц полосе.',
    examples: 'Первый канал, Россия-1, НТВ, Матч ТВ — 20 каналов в 3 мультиплексах (Россия)',
    lambda: '38 см – 64 см'
  },
  {
    id: 'sat_tv', name: 'Спутниковое ТВ DVB-S2 (10.7–12.75 ГГц)', freqGHz: 11.7, minSnr: 10,
    category: 'satellite_tv',
    desc: 'DVB-S2 через GEO-спутник (36 Мбит/с / транспондер 36 МГц). Ku-band. Мультиплекс каналов в одном потоке (MPTS).',
    examples: 'НТВ-Плюс, Триколор, Eutelsat Hotbird, SES Astra. Тарелка 0.6–1.8 м.',
    lambda: '2.56 см'
  },
  {
    id: 'sat_tv_c', name: 'Спутниковое ТВ C-band (3.4–4.2 ГГц)', freqGHz: 3.8, minSnr: 8,
    category: 'satellite_tv',
    desc: 'C-диапазон: менее подвержен дождевому затуханию, чем Ku. Большая тарелка (1.8–3 м). Преобладает в Азии, Африке.',
    examples: 'ABS-2, Measat, Hot Bird (C-band). Телерадиовещание без дождевых потерь.',
    lambda: '7.1 см – 8.8 см'
  },

  /* ===== Навигация и авиация ===== */
  {
    id: 'gps_l1', name: 'GPS/GNSS L1 (1575.42 МГц)', freqGHz: 1.57542, minSnr: 5,
    category: 'navigation',
    desc: 'Основной гражданский сигнал GPS. CDMA (BPSK-R(1)). Мощность спутника −130 дБм у поверхности. GLONASS L1 рядом.',
    examples: 'Смартфоны, навигаторы, авиация, геодезия (SBAS/DGPS)',
    lambda: '19 см'
  },
  {
    id: 'adsb', name: 'ADS-B авиационный (1090 МГц)', freqGHz: 1.090, minSnr: 10,
    category: 'navigation',
    desc: 'Автоматическое зависимое наблюдение (широковещание). Самолёты транслируют своё положение каждую секунду.',
    examples: 'Flightradar24 работает именно на этом. Можно принимать SDR-донглом.',
    lambda: '27.5 см'
  },
  {
    id: 'ils_vhf', name: 'Авиационная связь VHF (118–137 МГц)', freqGHz: 0.127, minSnr: 10,
    category: 'aviation',
    desc: 'Авиационный диапазон: управление воздушным движением, пилот↔диспетчер. AM-DSB, 25/8.33 кГц сетка каналов.',
    examples: 'Каналы Земля-борт, ATIS, VOLMET. Также здесь: ILS Localizer.',
    lambda: '2.2 м – 2.5 м'
  },

  /* ===== Морская связь ===== */
  {
    id: 'marine_vhf', name: 'Морская связь VHF (156–174 МГц)', freqGHz: 0.157, minSnr: 8,
    category: 'marine',
    desc: 'Морской VHF-диапазон. Канал 16 — вызов и спасение (156.8 МГц). AIS на каналах 87/88. Дальность ~50 км (открытое море).',
    examples: 'ГМССБ, AIS (отслеживание судов), DSC-вызов. Обязателен для всех судов.',
    lambda: '1.72 м – 1.92 м'
  },
  {
    id: 'marine_hf', name: 'Морская КВ связь (4–22 МГц)', freqGHz: 0.012, minSnr: 5,
    category: 'marine',
    desc: 'Глобальная морская связь через ионосферу. SSB (однополосная), GMDSS. Работает там где нет спутника.',
    examples: 'Navtex (518 кГц — метеосводки), GMDSS, морские метеорологические прогнозы',
    lambda: '13 м – 75 м'
  },

  /* ===== Профессиональные радиослужбы ===== */
  {
    id: 'pmr_vhf', name: 'Радиолюбители / PMR VHF (144–146 МГц)', freqGHz: 0.145, minSnr: 5,
    category: 'amateur',
    desc: '2-метровый любительский диапазон. Местная (FM) и дальняя (SSB/CW) связь. Ретрансляторы (репитеры). EME и метеорное рассеяние.',
    examples: 'Любительское радио 2 м, APRS (автоматическое позиционирование), D-STAR, DMR',
    lambda: '2.06 м'
  },
  {
    id: 'pmr_uhf', name: 'PMR/TETRA UHF (380–470 МГц)', freqGHz: 0.430, minSnr: 8,
    category: 'professional',
    desc: 'Профессиональные мобильные радиосети. TETRA — цифровой стандарт полиции/МЧС. PMR446 — свободный диапазон рации.',
    examples: 'Полиция, МЧС, Скорая (TETRA), стройки/охрана (PMR446), любительский 70 см',
    lambda: '63 см – 79 см'
  },
  {
    id: 'dect', name: 'DECT радиотелефоны (1.88–1.90 ГГц)', freqGHz: 1.89, minSnr: 15,
    category: 'professional',
    desc: 'Цифровой стандарт радиотелефонов. 10 каналов по 1.728 МГц, TDMA, шифрование. Дальность ~300 м.',
    examples: 'Домашние телефоны (DECT 6.0), офисные АТС, промышленные радиофоны',
    lambda: '15.8 см'
  },
  {
    id: 'lora', name: 'LoRa/LoRaWAN (433/868/915 МГц)', freqGHz: 0.868, minSnr: -15,
    category: 'iot',
    desc: 'LPWAN — сеть малого потребления на большие расстояния. SF7-SF12, полоса 125/250/500 кГц. Дальность 2–40 км! BW очень мал (250 бит/с).',
    examples: 'IoT счётчики, датчики умного города, трекеры, The Things Network',
    lambda: '34.5 см (868 МГц)'
  },
  {
    id: 'zigbee', name: 'Zigbee/Z-Wave/Thread (2.4 ГГц)', freqGHz: 2.4, minSnr: 10,
    category: 'iot',
    desc: 'Маломощные mesh-сети для умного дома. IEEE 802.15.4, канал 2 МГц, до 250 кбит/с. Mesh топология — многоскачковая.',
    examples: 'Умный дом Philips Hue, IKEA Tradfri, Home Assistant Zigbee',
    lambda: '12.5 см'
  },

  /* ===== Сотовые сети ===== */
  {
    id: 'gsm_900', name: 'GSM 900 (880–960 МГц)', freqGHz: 0.900, minSnr: 3,
    category: 'cellular',
    desc: '2G сотовая сеть. FDMA+TDMA, 8 слотов. Дальность до 35 км. Голос и данные GPRS/EDGE (до 384 кбит/с). Всё ещё работает!',
    examples: 'Голос/SMS, резервный канал банковских терминалов, M2M/IoT',
    lambda: '33 см'
  },
  {
    id: 'lte_700', name: '4G LTE Band 28 (700 МГц)', freqGHz: 0.700, minSnr: 3,
    category: 'cellular',
    desc: 'Низкочастотный LTE — отличное проникновение в здания, дальность до 100 км от вышки. "Цифровой дивиденд" после отказа от АТ-ТВ.',
    examples: 'Покрытие сельских районов, подвалы и метро, M2M/NB-IoT',
    lambda: '42.8 см'
  },
  {
    id: 'lte', name: '4G LTE (1.8 ГГц)', freqGHz: 1.800, minSnr: 5,
    category: 'cellular',
    desc: '4G LTE Band 3 — самый распространённый диапазон. OFDMA, до 150 Мбит/с (DL). Дальность 5–20 км. CA (Carrier Aggregation).',
    examples: 'МТС, Мегафон, Билайн, Теле2 — основной диапазон',
    lambda: '16.7 см'
  },
  {
    id: '5g_sub6', name: '5G NR Sub-6 (3.5 ГГц)', freqGHz: 3.500, minSnr: 8,
    category: 'cellular',
    desc: '5G основной диапазон. 100 МГц полоса, Massive MIMO 8T8R+, OFDMA. Дальность 1–5 км. eMBB и URLLC. NSA/SA.',
    examples: '5G сети операторов (где развёрнуто). Фиксированный беспроводной доступ (FWA)',
    lambda: '8.6 см'
  },
  {
    id: '5g_mmwave', name: '5G NR mmWave (28 ГГц)', freqGHz: 28, minSnr: 20,
    category: 'cellular',
    desc: '5G миллиметровый диапазон. Полоса до 800 МГц → гигабитные скорости. Дальность 100–300 м, плохо проходит стены.',
    examples: 'Плотные городские сети, стадионы, вокзалы (США, Япония). Verizon mmWave.',
    lambda: '1.07 см'
  },

  /* ===== Wi-Fi и WLAN ===== */
  {
    id: 'wifi24', name: 'Wi-Fi 2.4 ГГц (802.11n/ax)', freqGHz: 2.437, minSnr: 10,
    category: 'wifi',
    desc: 'Wi-Fi 2.4 ГГц. 3 неперекрывающихся канала по 20 МГц. Далеко проходит стены. Сильно загружен (Bluetooth, микроволновки).',
    examples: 'Wi-Fi 4 (n) до 300 Мбит/с, Wi-Fi 6 (ax) до 1.1 Гбит/с',
    lambda: '12.3 см'
  },
  {
    id: 'wifi5', name: 'Wi-Fi 5 ГГц (802.11ac)', freqGHz: 5.180, minSnr: 12,
    category: 'wifi',
    desc: 'Wi-Fi 5 ГГц. 25 каналов по 20 МГц, объединяются до 160 МГц. Хуже проходит стены, но быстрее. Чище (меньше помех).',
    examples: '802.11ac до 3.5 Гбит/с (3 потока), 802.11ax (Wi-Fi 6)',
    lambda: '5.8 см'
  },
  {
    id: 'wifi6e', name: 'Wi-Fi 6E (6 ГГц)', freqGHz: 6.0, minSnr: 15,
    category: 'wifi',
    desc: 'Wi-Fi 6E/7 — новый диапазон 5.925–7.125 ГГц. 1.2 ГГц спектра! 59 каналов по 20 МГц. Только Wi-Fi — нет конкуренции.',
    examples: '802.11ax Wi-Fi 6E, Wi-Fi 7 (802.11be) — до 46 Гбит/с',
    lambda: '5 см'
  },
  {
    id: 'wigig_60', name: 'WiGig 60 ГГц (802.11ad/ay)', freqGHz: 60, minSnr: 25,
    category: 'wifi',
    desc: 'Ближний Wi-Fi. 2.16 ГГц полоса на канал. До 7 Гбит/с. Дальность 1–10 м — сильно поглощается кислородом воздуха.',
    examples: 'Замена кабеля HDMI/USB в пределах комнаты, VR/AR, дата-центры',
    lambda: '5 мм'
  },

  /* ===== Спутниковая связь ===== */
  {
    id: 'starlink_leo', name: 'Starlink LEO (Ku/Ka)', freqGHz: 14.0, minSnr: 10,
    category: 'satellite',
    desc: 'Starlink — LEO-созвездие SpaceX на 540–570 км. Ku-band UP, Ka-band DOWN. Фазированная антенна (авто-наведение). ~30 мс RTT.',
    examples: 'Starlink Basic: 50–200 Мбит/с, Priority: до 1 Гбит/с',
    lambda: '2.1 см'
  },
  {
    id: 'vsat_ku', name: 'VSAT GEO Ku-band (12–18 ГГц)', freqGHz: 14.0, minSnr: 8,
    category: 'satellite',
    desc: 'VSAT через GEO-спутник. Тарелка 0.75–1.8 м. SCPC или TDMA. Задержка 600 мс RTT. Надёжно, но дорого. Rain fade на Ka.',
    examples: 'Корпоративные каналы, банкоматы/POS, газовые месторождения, суда',
    lambda: '2.1 см – 2.5 см'
  },
  {
    id: 'inmarsat', name: 'Inmarsat / BGAN (L-band)', freqGHz: 1.64, minSnr: 6,
    category: 'satellite',
    desc: 'GEO L-band спутниковая связь. Всегда доступна при открытом небе. Небольшая антенна (даже ручная). 492 кбит/с (BGAN).',
    examples: 'Судовая/авиационная связь, аварийные EPIRB/PLB, военные терминалы',
    lambda: '18.3 см'
  },
  {
    id: 'iridium', name: 'Iridium (LEO L-band)', freqGHz: 1.616, minSnr: 5,
    category: 'satellite',
    desc: '66 LEO-спутников, 780 км орбита. Глобальное покрытие (включая полюса). Межспутниковые линки. Маленькая всенаправленная антенна.',
    examples: 'Iridium GO!, Iridium Certus: до 700 кбит/с. Арктика, глубокий океан.',
    lambda: '18.6 см'
  },
  {
    id: 'o3b_meo', name: 'O3b mPOWER (MEO Ka)', freqGHz: 20.0, minSnr: 12,
    category: 'satellite',
    desc: 'SES O3b MEO-созвездие, 8062 км. Ka-band, до 10 Гбит/с на луч. Задержка ~130 мс. Луч отслеживает абонента автоматически.',
    examples: 'Операторские сети, морские суда премиум-класса, острова',
    lambda: '1.5 см'
  },
  {
    id: 'dvb_rcs', name: 'DVB-RCS2 (обратный канал спутника)', freqGHz: 29.5, minSnr: 8,
    category: 'satellite',
    desc: 'Обратный канал VSAT Ka-band (Ku для некоторых). MF-TDMA. VSAT → спутник → хаб. Тарелка 0.74–1.2 м.',
    examples: 'Hughes HughesNet, ViaSat/Exede, Eutelsat KA-SAT (Tooway)',
    lambda: '1.02 см'
  },

  /* ===== Радиолокация и специальные ===== */
  {
    id: 'radar_s', name: 'Корабельный радар S-band (2–4 ГГц)', freqGHz: 3.0, minSnr: 15,
    category: 'radar',
    desc: 'Морская навигационная РЛС. Вращающаяся щелевая антенна (слот-антенна). Дальность обнаружения до 96 морских миль.',
    examples: 'Furuno, JRC, Garmin — стандарт навигации на судах',
    lambda: '10 см'
  },
  {
    id: 'radar_x', name: 'Авиационный радар X-band (8–12 ГГц)', freqGHz: 9.4, minSnr: 20,
    category: 'radar',
    desc: 'X-band РЛС: авиационные (обзорные и метеорологические), береговая охрана, сухопутные РЛС обнаружения.',
    examples: 'Метеорологические радары (доплеровские), АС-РЛС, системы охраны периметра',
    lambda: '3.2 см'
  },
  {
    id: 'rfid_uhf', name: 'RFID UHF (860–960 МГц)', freqGHz: 0.915, minSnr: 5,
    category: 'iot',
    desc: 'Пассивный RFID UHF (EPC Gen2 / ISO 18000-63). Читатель посылает ЭМП → тег запитывается и отвечает. Дальность до 15 м.',
    examples: 'Логистика (склады Amazon), розница, авиабагаж, библиотеки',
    lambda: '32.8 см'
  },
  {
    id: 'nfc', name: 'NFC (13.56 МГц)', freqGHz: 0.01356, minSnr: 5,
    category: 'iot',
    desc: 'Near Field Communication. Индуктивная связь, дальность 1–20 см. ISO 14443, NFC Forum. Магнитное поле — не распространяется далеко.',
    examples: 'Бесконтактные карты, Apple Pay, Android Pay, метро',
    lambda: '22.1 м (но работает индуктивно)'
  },
];

export const RADIO_EXPERIMENTS = [
  {
    id: 'rx01', title: 'Разверни антенну',
    task: 'Поверни TX антенну (Яги 10 эл.) на 90° — как изменится SNR?',
    insight: 'Направленные антенны теряют усиление вне главного лепестка. Поворот Яги на 90° → потеря ~14 дБи → SNR падает на 14 дБ. Именно поэтому точное наведение критично!'
  },
  {
    id: 'rx02', title: 'FM-радио: почему такие большие антенны?',
    task: 'Выбери FM-радио (98 МГц). Рассчитай длину λ/4 монополя.',
    insight: 'FM: λ = c/f = 300 000 000 / 98 000 000 ≈ 3.06 м. Монополь λ/4 ≈ 76 см. Именно такой длины делают автомобильные антенны! На 2.4 ГГц Wi-Fi λ/4 = 3.1 см — помещается на плате.'
  },
  {
    id: 'rx03', title: 'Дождь vs спутниковое ТВ',
    task: 'Выбери DVB-S2 (спутниковое ТВ, 11.7 ГГц) + ливень. Почему пропадает сигнал?',
    insight: 'Ku-band (11.7 ГГц) сильно поглощается дождём — атмосферные потери до 10-25 дБ при ливне. C-band (3.8 ГГц) устойчивее. Именно поэтому в тропиках используют C-band тарелки.'
  },
  {
    id: 'rx04', title: 'Параболическая vs диполь',
    task: 'Замени TX антенну с диполя (+2.15 дБи) на параболу (1.8 м, +35 дБи). На сколько выросла дальность?',
    insight: 'Разница +32.85 дБ. Каждые +6 дБ → вдвое дальше. 32.85/6 ≈ 5.5 удвоений → 2^5.5 ≈ 44× по расстоянию! Именно так дистанционные телескопы видят объекты в миллиардах км.'
  },
  {
    id: 'rx05', title: 'LoRa vs Wi-Fi: IoT на большие расстояния',
    task: 'Сравни LoRa 868 МГц и Wi-Fi 2.4 ГГц при равных условиях. Почему LoRa дальше?',
    insight: 'LoRa: чувствительность −148 дБм (SNR до −15 дБ!), полоса 125 кГц. Wi-Fi: чувствительность −90 дБм. Разница 58 дБ → LoRa работает в 800× худших условиях. Цена: скорость 250 бит/с.'
  },
  {
    id: 'rx06', title: '5G mmWave: близко и быстро',
    task: 'Включи 5G mmWave (28 ГГц). Проверь максимальную дальность при фазированной решётке.',
    insight: '28 ГГц: FSPL на 100 м = 112 дБ. Дождь добавляет 8 дБ/км. Стены блокируют полностью. Но +30 дБи AAS антенна компенсирует! Дальность ~300 м на улице, ~50 м с одной стеной.'
  },
];
