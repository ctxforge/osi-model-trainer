// Guided laboratory work definitions
export const GUIDED_LABS = [
  {
    id: 'gl01',
    title: 'Построй офисную сеть',
    icon: '🏢',
    desc: 'Создай базовую офисную сеть с коммутатором, 4 ПК и сервером. Настрой IP-адреса и проследи путь пакета.',
    layers: 'L2–L3',
    estMinutes: 20,
    steps: [
      {
        id: 's1', title: 'Создай топологию',
        instruction: 'Открой Topology Builder. Добавь: Switch L2, 4 PC (PC-1..PC-4) и Server. Соедини все PC со Switch кабелем Cat5e. Соедини Switch с Server кабелем Fiber SM.',
        hint: 'Используй пресет "Малый офис" или создай вручную. Кликни на иконки устройств для добавления.',
        check: 'topology_has_switch_and_pcs',
        checkLabel: 'Топология содержит коммутатор и минимум 4 ПК'
      },
      {
        id: 's2', title: 'Назначь IP-адреса',
        instruction: 'Кликни на каждый PC. Назначь адреса: PC-1: 192.168.1.10/24, PC-2: 192.168.1.11/24, PC-3: 192.168.1.12/24, PC-4: 192.168.1.13/24. Server: 192.168.1.100/24.',
        hint: 'Клик на устройство → панель свойств справа → заполни поля IP/Маска.',
        check: 'devices_have_ip',
        checkLabel: 'Все устройства имеют IP-адреса'
      },
      {
        id: 's3', title: 'Запусти трафик',
        instruction: 'Нажми "Запустить трафик" в Topology Builder. Посмотри на анимацию пакетов. Затем открой Traffic Analysis и нажми "Трассировка" от PC-1 до Server.',
        hint: 'Кнопка "▶ Live Traffic" в верхней части Topology Builder.',
        check: 'traffic_started',
        checkLabel: 'Трафик запущен в топологии'
      },
      {
        id: 's4', title: 'Анализ протоколов',
        instruction: 'Открой Network Instruments → Protocol Analyzer. Посмотри на захваченные пакеты. Найди ARP-пакет и нажми на него.',
        hint: 'ARP — Address Resolution Protocol, работает на L2. Первый пакет при обмене в локальной сети.',
        check: null,
        checkLabel: null
      },
      {
        id: 's5', title: 'Вопрос: MAC-адрес назначения',
        instruction: 'В ARP Request пакете MAC назначения = FF:FF:FF:FF:FF:FF. Почему именно такой адрес?',
        hint: 'FF:FF:FF:FF:FF:FF — это broadcast в Ethernet. Он означает "доставить всем устройствам в сегменте".',
        question: 'Почему MAC назначения в ARP Request = FF:FF:FF:FF:FF:FF?',
        answers: [
          { text: 'Это broadcast — пакет получат все устройства в сегменте L2', correct: true },
          { text: 'Это адрес шлюза по умолчанию', correct: false },
          { text: 'Это ошибка — ARP не должен использовать такой адрес', correct: false },
        ],
        check: 'question_answered',
        checkLabel: 'Ответ на вопрос дан'
      },
    ]
  },
  {
    id: 'gl02',
    title: 'Сигнал через канал',
    icon: '📡',
    desc: 'Сгенерируй QPSK-сигнал, пропусти через Wi-Fi канал, проанализируй влияние расстояния на BER.',
    layers: 'L1',
    estMinutes: 15,
    steps: [
      {
        id: 's1', title: 'Создай QPSK-сигнал',
        instruction: 'Открой Физическую лабораторию → Генератор сигналов. Добавь компонент: несущая 2000 Гц, тип QPSK. Нажми "Генерировать".',
        hint: 'В блоке "Компоненты сигнала" нажми "+ Добавить" → выбери тип QPSK, установи frequency 2000.',
        check: 'has_qpsk_signal',
        checkLabel: 'Создан QPSK-сигнал'
      },
      {
        id: 's2', title: 'Выбери канал Wi-Fi',
        instruction: 'В блоке канала (⑤) выбери "Wi-Fi 2.4 ГГц". Установи расстояние 50 м. Посмотри на SNR — он должен быть > 20 дБ.',
        hint: 'SNR > 20 дБ для QPSK означает хорошее качество. Созвездие RX должно быть чётким.',
        check: 'channel_selected',
        checkLabel: 'Выбран канал и расстояние'
      },
      {
        id: 's3', title: 'Увеличь расстояние',
        instruction: 'Увеличь расстояние до 200 м. Что происходит с SNR и созвездием RX? Затем до 400 м.',
        hint: 'При SNR < 10 дБ точки созвездия расплываются → ошибки битов → BER растёт.',
        check: null,
        checkLabel: null
      },
      {
        id: 's4', title: 'Смени модуляцию на BPSK',
        instruction: 'При расстоянии 300 м смени модуляцию QPSK → BPSK. Что изменилось в созвездии?',
        question: 'Почему BPSK устойчивее к помехам чем QPSK?',
        answers: [
          { text: 'BPSK имеет 2 состояния — точки созвездия дальше друг от друга, меньше шанс ошибки', correct: true },
          { text: 'BPSK передаёт на более высокой мощности', correct: false },
          { text: 'BPSK не использует квадратурную составляющую', correct: false },
        ],
        check: 'question_answered',
        checkLabel: 'Ответ на вопрос дан'
      },
    ]
  },
  {
    id: 'gl03',
    title: 'Отладь сломанную сеть',
    icon: '🔧',
    desc: 'Используй инструменты диагностики для обнаружения и устранения проблем в сломанной топологии.',
    layers: 'L1–L3',
    estMinutes: 25,
    steps: [
      {
        id: 's1', title: 'Загрузи сломанную топологию',
        instruction: 'В Topology Builder нажми на выпадающее меню пресетов и выбери "Офисная сеть (сломанная)". Изучи топологию.',
        hint: 'В сломанной топологии есть намеренные проблемы: неправильный кабель, отсутствующий маршрут или неверный IP.',
        check: null,
        checkLabel: null
      },
      {
        id: 's2', title: 'Cable Tester — проверь кабели',
        instruction: 'Открой Network Instruments → Cable Tester. Кликни на каждый медный линк в топологии. Найди тот, где есть ошибки (Open или Short).',
        hint: 'Open = обрыв проводника, Short = замыкание. Оба дают сбой в передаче.',
        check: null,
        checkLabel: null
      },
      {
        id: 's3', title: 'BER Tester — подтверди ошибки',
        instruction: 'На линке с найденной проблемой используй BER Tester. Он должен показать высокий BER (> 10⁻³).',
        hint: 'Высокий BER означает много битовых ошибок — это подтверждает физическую проблему с кабелем.',
        check: null,
        checkLabel: null
      },
      {
        id: 's4', title: 'Исправь топологию',
        instruction: 'Удали проблемный линк в Topology Builder (клик + Delete). Добавь новый кабель Cat6. Снова запусти Cable Tester.',
        hint: 'Для удаления линка: кликни на него → появится панель свойств → кнопка "Удалить".',
        check: null,
        checkLabel: null
      },
      {
        id: 's5', title: 'Network Monitor — финальная проверка',
        instruction: 'Открой Network Monitor. Запусти трафик. Убедись, что утилизация каналов нормальная (< 80%) и нет пакетных потерь.',
        hint: 'Network Monitor показывает throughput, latency и packet loss в реальном времени.',
        question: 'Какой показатель Network Monitor говорит о перегрузке канала?',
        answers: [
          { text: 'Утилизация bandwidth > 80% и рост packet loss', correct: true },
          { text: 'Latency > 1 мс', correct: false },
          { text: 'Количество пакетов > 1000', correct: false },
        ],
        check: 'question_answered',
        checkLabel: 'Ответ на вопрос дан'
      },
    ]
  },
  {
    id: 'gl04',
    title: 'Рассчитай радиолинк',
    icon: '📡',
    desc: 'Используй радиолабораторию для расчёта link budget. Выбери антенны для обеспечения надёжной связи.',
    layers: 'L1 + Антенны',
    estMinutes: 20,
    steps: [
      {
        id: 's1', title: 'Настрой TX антенну',
        instruction: 'Открой Радиолабораторию. Выбери TX антенну: Яги (+14 дБи). RX антенна: Диполь (+2.15 дБи). Частота 5 ГГц, расстояние 1 км.',
        hint: 'Яги — направленная антенна. При расчёте убедись, что она направлена точно на RX (угол 0°).',
        check: null,
        checkLabel: null
      },
      {
        id: 's2', title: 'Рассчитай FSPL вручную',
        instruction: 'Используй формулу: FSPL ≈ 20·log₁₀(1000м) + 20·log₁₀(5 ГГц) + 92.45. Вычисли значение.',
        question: 'FSPL при d=1 км, f=5 ГГц равен:',
        answers: [
          { text: '≈ 114 дБ', correct: true },
          { text: '≈ 80 дБ', correct: false },
          { text: '≈ 150 дБ', correct: false },
        ],
        hint: 'FSPL = 20×log₁₀(1000) + 20×log₁₀(5) + 92.45 = 60 + 14 + 92.45 ≈ 166.45... Используй онлайн-расчёт в лаборатории.',
        check: 'question_answered',
        checkLabel: 'Ответ на вопрос дан'
      },
      {
        id: 's3', title: 'Добавь дождь',
        instruction: 'Измени погоду на "Дождь". Посмотри как изменился SNR. Упал ли SNR ниже минимума для 5 ГГц Wi-Fi?',
        hint: 'Дождь на 5 ГГц добавляет ~4 дБ затухания. Если SNR < 12 дБ — нет надёжной связи.',
        check: null,
        checkLabel: null
      },
      {
        id: 's4', title: 'Выбери антенну для компенсации',
        instruction: 'SNR упал из-за дождя. Замени RX антенну (Диполь) на другую чтобы SNR снова стал > 20 дБ.',
        question: 'Какую RX антенну выбрать чтобы получить +20 дБ к SNR?',
        answers: [
          { text: 'Параболическую (+35 дБи) — даёт +32 дБ к SNR по сравнению с диполем', correct: true },
          { text: 'Секторную (+17 дБи) — даёт +15 дБ', correct: false },
          { text: 'Другой диполь — усиление то же', correct: false },
        ],
        check: 'question_answered',
        checkLabel: 'Ответ на вопрос дан'
      },
    ]
  },
];
