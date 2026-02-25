// Signal generator missions — step-by-step challenges
export const SIGNAL_MISSIONS = [
  {
    id: 'sm01', title: 'Создай чистый тон',
    desc: 'Сгенерируй синусоиду 440 Гц (нота Ля). В спектре должен быть ОДИН пик.',
    hint: 'Добавь один компонент: тип «sin», частота 440 Гц, модуляция «none». Убедись, что нет других компонентов.',
    xp: 10,
    insight: 'Идеальный тон — дельта-функция в спектре. В реальности пик чуть шире из-за конечного времени измерения.',
    validate: (components) => {
      const active = components.filter(c => c.active !== false);
      return active.length === 1
        && (active[0].type === 'sin' || active[0].type === 'cos')
        && Math.abs((active[0].freq || 440) - 440) < 50
        && (!active[0].modType || active[0].modType === 'none')
        && (active[0].noise || 0) < 0.1;
    }
  },
  {
    id: 'sm02', title: 'AM-сигнал с глубиной 80%',
    desc: 'Создай AM-сигнал: несущая 2000 Гц, модуляция 200 Гц, глубина ≈ 0.8.',
    hint: 'Один компонент: тип «sin», частота 2000 Гц, модуляция AM, carrier 2000 Гц, mod 200 Гц, глубина 0.8.',
    xp: 15,
    insight: 'При m=0.8: боковые полосы на 40% амплитуды несущей. Полоса AM = 2×200 = 400 Гц.',
    validate: (components) => {
      const c = components.filter(c => c.active !== false)[0];
      if (!c) return false;
      const isAM = c.modType === 'am';
      const goodDepth = Math.abs((c.modDepth || 0) - 0.8) < 0.2;
      return isAM && goodDepth;
    }
  },
  {
    id: 'sm03', title: 'FDM: три канала без перекрытия',
    desc: 'Создай три синусоиды с разными частотами так, чтобы они не перекрывались в спектре. Минимальное расстояние между пиками — 300 Гц.',
    hint: 'Добавь 3 компонента: например, 500, 900, 1400 Гц. Проверь в спектроанализаторе.',
    xp: 20,
    insight: 'FDM (Frequency Division Multiplexing) — несколько каналов на разных несущих. Используется в ADSL, кабельном ТВ, OFDM.',
    validate: (components) => {
      const active = components.filter(c => c.active !== false && (!c.modType || c.modType === 'none'));
      if (active.length < 3) return false;
      const freqs = active.map(c => c.freq || c.carrier || 440).sort((a, b) => a - b);
      for (let i = 1; i < freqs.length; i++) {
        if (freqs[i] - freqs[i-1] < 200) return false;
      }
      return true;
    }
  },
  {
    id: 'sm04', title: 'Найди частоту Найквиста',
    desc: 'Установи частоту дискретизации 8000 Гц. Создай синусоиду на частоте 3800 Гц и на 4100 Гц. Что произошло со второй?',
    hint: 'Частота Найквиста = Fs/2 = 4000 Гц. Сигнал выше 4000 Гц будет «отражён» в область 0-4000 Гц.',
    xp: 20,
    insight: 'Теорема Котельникова-Найквиста: для безошибочного представления нужно Fs > 2×fmax. Aliasing — ошибочное наложение спектров.',
    validate: (components) => {
      // Accept if user has signal near Nyquist range
      const active = components.filter(c => c.active !== false);
      return active.some(c => {
        const f = c.freq || c.carrier || 0;
        return f > 3000 && f < 5000;
      });
    }
  },
  {
    id: 'sm05', title: 'BPSK через плохой канал',
    desc: 'Сгенерируй BPSK-сигнал с несущей 1000 Гц. Пропусти через канал Wi-Fi 2.4 ГГц на расстоянии 100 м. Посмотри на созвездие.',
    hint: 'Используй BPSK модуляцию. Затем выбери канал Wi-Fi и увеличивай расстояние до 100 м.',
    xp: 25,
    insight: 'BPSK — два состояния (+1/-1). При высоком SNR точки на созвездии чёткие. При шуме — расплываются. BER растёт.',
    validate: (components) => {
      const c = components.filter(c => c.active !== false)[0];
      return c && c.modType === 'bpsk';
    }
  },
  {
    id: 'sm06', title: 'Меандр из синусоид',
    desc: 'Меандр = сумма нечётных гармоник. Сложи синусоиды f, 3f, 5f, 7f с амплитудами 1, 1/3, 1/5, 1/7. Базовая частота 200 Гц.',
    hint: 'Добавь 4 компонента: 200 Гц (амп 1.0), 600 Гц (амп 0.33), 1000 Гц (амп 0.2), 1400 Гц (амп 0.14).',
    xp: 30,
    insight: 'Ряд Фурье меандра: x(t) = 4/π × Σ sin(nωt)/n для нечётных n. 4 гармоники дают неплохое приближение. Это основа теории сигналов!',
    validate: (components) => {
      const active = components.filter(c => c.active !== false && (!c.modType || c.modType === 'none'));
      if (active.length < 3) return false;
      // Check if they form harmonic series (ratios ~1:3:5)
      const freqs = active.map(c => c.freq || 200).sort((a, b) => a - b);
      if (freqs.length < 3) return false;
      const ratio1 = freqs[1] / freqs[0];
      const ratio2 = freqs[2] / freqs[0];
      return Math.abs(ratio1 - 3) < 0.5 && Math.abs(ratio2 - 5) < 0.7;
    }
  },
];
