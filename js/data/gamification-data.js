export const XP_LEVELS = [
  { level: 1, name: 'Стажёр', minXp: 0, icon: '🌱' },
  { level: 2, name: 'Кабельщик', minXp: 50, icon: '📗' },
  { level: 3, name: 'Техник', minXp: 120, icon: '🔧' },
  { level: 4, name: 'Администратор', minXp: 200, icon: '🖥️' },
  { level: 5, name: 'Инженер', minXp: 350, icon: '⚙️' },
  { level: 6, name: 'Специалист', minXp: 500, icon: '📡' },
  { level: 7, name: 'Архитектор', minXp: 700, icon: '🏗️' },
  { level: 8, name: 'Эксперт', minXp: 1000, icon: '🎓' },
  { level: 9, name: 'Мастер', minXp: 1400, icon: '🧪' },
  { level: 10, name: 'Гуру', minXp: 1900, icon: '🧠' },
  { level: 11, name: 'Профессор', minXp: 2500, icon: '📚' },
  { level: 12, name: 'Мудрец', minXp: 3200, icon: '🔮' },
  { level: 13, name: 'Легенда', minXp: 4000, icon: '⭐' },
  { level: 14, name: 'Магистр сетей', minXp: 5000, icon: '🌐' },
  { level: 15, name: 'Архимаг OSI', minXp: 6500, icon: '👑' }
];

export const ACHIEVEMENTS = [
  // === Основные ===
  { id: 'first_encap', name: 'Первый пакет', desc: 'Запустите симулятор инкапсуляции', icon: '📦', xp: 10 },
  { id: 'study_all', name: 'Знаток OSI', desc: 'Изучите все 7 уровней', icon: '📖', xp: 20 },
  { id: 'tcp_hand', name: 'Рукопожатие', desc: 'Запустите TCP Handshake', icon: '🤝', xp: 10 },
  { id: 'scenario_done', name: 'Веб-сёрфер', desc: 'Пройдите сценарий открытия сайта', icon: '🌐', xp: 10 },
  { id: 'net_builder', name: 'Сетевой строитель', desc: 'Отправьте пакет по своей сети', icon: '🔗', xp: 15 },
  { id: 'tcp_vs_udp', name: 'Протокольный дуэлянт', desc: 'Запустите TCP vs UDP', icon: '⚔️', xp: 10 },
  { id: 'ip_calc', name: 'Подсетевик', desc: 'Рассчитайте IP-подсеть', icon: '🔢', xp: 10 },

  // === Теория ===
  { id: 'theory_first', name: 'Первая глава', desc: 'Прочитайте первую тему теории', icon: '📘', xp: 5 },
  { id: 'theory_5', name: 'Книгочей', desc: 'Прочитайте 5 тем теории', icon: '📕', xp: 15 },
  { id: 'theory_all', name: 'Теоретик', desc: 'Прочитайте все 17 тем теории', icon: '🎓', xp: 30 },
  { id: 'theory_quiz_first', name: 'Первый тест', desc: 'Пройдите квиз по любой теме', icon: '✅', xp: 5 },
  { id: 'theory_quiz_all', name: 'Отличник', desc: 'Пройдите квизы по всем темам', icon: '🏅', xp: 40 },

  // === Лаборатории ===
  { id: 'lab_physics', name: 'Физик', desc: 'Пройдите все лабораторные L1 (сигналы, канал, мультиплексирование)', icon: '⚡', xp: 15 },
  { id: 'lab_network', name: 'Сетевик', desc: 'Пройдите все лабораторные L2-L3 (устройства, маршрутизация, IP)', icon: '🌐', xp: 15 },
  { id: 'lab_transport', name: 'Транспортник', desc: 'Пройдите все лабораторные L4 (TCP, UDP, передача)', icon: '📦', xp: 15 },
  { id: 'lab_security', name: 'Безопасник', desc: 'Пройдите все лабораторные L5-L7 (шифрование, TLS)', icon: '🔐', xp: 15 },
  { id: 'all_channels', name: 'Связист', desc: 'Используйте 5 разных каналов связи', icon: '📡', xp: 20 },
  { id: 'all_codes', name: 'Кодировщик', desc: 'Просмотрите все линейные коды', icon: '〰️', xp: 15 },
  { id: 'lab_tcp_fsm', name: 'Автоматчик', desc: 'Пройдите TCP-автомат от CLOSED до TIME_WAIT', icon: '🔄', xp: 15 },
  { id: 'lab_congestion', name: 'Борец с перегрузкой', desc: 'Запустите симуляцию контроля перегрузки TCP', icon: '📈', xp: 10 },
  { id: 'lab_window', name: 'Окно возможностей', desc: 'Запустите визуализацию скользящего окна', icon: '🪟', xp: 10 },

  // === DnD ===
  { id: 'dnd_perfect', name: 'Точное попадание', desc: 'Разместите всё правильно в тренажёре', icon: '🎯', xp: 25 },
  { id: 'dnd_reverse', name: 'Инверсия', desc: 'Пройдите режим «Обратный» на 100%', icon: '🔄', xp: 15 },
  { id: 'dnd_ports', name: 'Портовый мастер', desc: 'Пройдите режим «Порты» на 100%', icon: '🔌', xp: 15 },
  { id: 'dnd_headers', name: 'Заголовочник', desc: 'Пройдите режим «Заголовки» на 100%', icon: '📋', xp: 15 },
  { id: 'dnd_encap', name: 'Стек мастер', desc: 'Пройдите режим «Инкапсуляция» на 100%', icon: '📚', xp: 15 },
  { id: 'dnd_all_modes', name: 'Мультирежимщик', desc: 'Пройдите все 7 режимов DnD', icon: '🏆', xp: 30 },

  // === Терминал ===
  { id: 'term_first', name: 'Первая команда', desc: 'Выполните первую команду в терминале', icon: '💻', xp: 5 },
  { id: 'term_10', name: 'Командир', desc: 'Выполните 10 разных команд', icon: '⌨️', xp: 10 },
  { id: 'term_all', name: 'Полный арсенал', desc: 'Используйте все 21 команду терминала', icon: '🖥️', xp: 25 },
  { id: 'term_scenario', name: 'Сценарист', desc: 'Пройдите сценарий диагностики в терминале', icon: '🎬', xp: 15 },

  // === Протоколы ===
  { id: 'proto_10', name: 'Знакомство', desc: 'Просмотрите 10 протоколов в справочнике', icon: '📋', xp: 10 },
  { id: 'proto_25', name: 'Исследователь', desc: 'Просмотрите 25 протоколов', icon: '🔍', xp: 15 },
  { id: 'proto_all', name: 'Энциклопедист', desc: 'Просмотрите все протоколы в справочнике', icon: '📖', xp: 25 },

  // === Скрытые ===
  { id: 'secret_localhost', name: '127.0.0.1', desc: 'Нет места лучше localhost', icon: '🏠', xp: 5, hidden: true },
  { id: 'secret_rmrf', name: 'rm -rf /', desc: 'Попытались удалить всё в терминале', icon: '💀', xp: 0, hidden: true },
  { id: 'secret_osi_poly', name: 'OSI-полиглот', desc: 'Используйте все разделы приложения за одну сессию', icon: '🗣️', xp: 20, hidden: true },
  { id: 'secret_night', name: 'Ночной инженер', desc: 'Учитесь после полуночи', icon: '🌙', xp: 5, hidden: true },
  { id: 'secret_speedrun', name: 'Спидраннер', desc: 'Пройдите DnD за 30 секунд', icon: '⚡', xp: 10, hidden: true },

  // === Квесты ===
  { id: 'quest_first', name: 'Первый квест', desc: 'Пройдите первый квест кампании', icon: '🏰', xp: 10 },
  { id: 'quest_10', name: 'Опытный авантюрист', desc: 'Пройдите 10 квестов', icon: '⚔️', xp: 20 },
  { id: 'quest_all', name: 'Покоритель кампании', desc: 'Пройдите все 35 квестов', icon: '🏆', xp: 50 },
  { id: 'quest_perfect', name: 'Перфекционист', desc: 'Получите 3 звезды без подсказок', icon: '⭐', xp: 15 },
  { id: 'quest_boss', name: 'Боссоубийца', desc: 'Пройдите любой босс-квест', icon: '👑', xp: 20 },
  { id: 'quest_chapter_ch1', name: 'Кабельщик', desc: 'Пройдите Главу 1 целиком', icon: '⚡', xp: 15 },
  { id: 'quest_chapter_ch2', name: 'Коммутатор', desc: 'Пройдите Главу 2 целиком', icon: '🔌', xp: 15 },
  { id: 'quest_chapter_ch3', name: 'Маршрутизатор', desc: 'Пройдите Главу 3 целиком', icon: '🌐', xp: 15 },
  { id: 'quest_chapter_ch4', name: 'Транспортёр', desc: 'Пройдите Главу 4 целиком', icon: '📦', xp: 15 },
  { id: 'quest_chapter_ch5', name: 'Защитник', desc: 'Пройдите Главу 5 целиком', icon: '🔐', xp: 15 },
  { id: 'quest_chapter_ch6', name: 'Архитектор сети', desc: 'Пройдите Главу 6 — финальную!', icon: '🏢', xp: 30 },

  // === Вехи XP ===
  { id: 'xp_100', name: 'Сотня', desc: 'Наберите 100 XP', icon: '💯', xp: 0 },
  { id: 'xp_300', name: 'Триста', desc: 'Наберите 300 XP', icon: '🏆', xp: 0 },
  { id: 'xp_1000', name: 'Тысячник', desc: 'Наберите 1000 XP', icon: '🎖️', xp: 0 },
  { id: 'xp_5000', name: 'Легенда XP', desc: 'Наберите 5000 XP', icon: '👑', xp: 0 },
  { id: 'xp_9000', name: 'It\'s over 9000', desc: 'Наберите 9000 XP', icon: '🔥', xp: 0 },

  // === Специальные (из ТЗ §7.4) ===
  { id: 'golden_campaign', name: 'Золотая кампания', desc: 'Все квесты на 3 звезды', icon: '🌟', xp: 50 },
  { id: 'speed_run_quest', name: 'Скоростной забег', desc: 'Квест за менее чем 60 секунд', icon: '⏱️', xp: 15 },
  { id: 'no_hints_chapter', name: 'Без подсказок', desc: 'Пройдите целую главу без подсказок', icon: '🧠', xp: 20 },
  { id: 'stubborn', name: 'Упрямый', desc: 'Пройдите квест с 5-й попытки', icon: '🐂', xp: 10 }
];
