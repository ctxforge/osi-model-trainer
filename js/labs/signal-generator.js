/**
 * signal-generator.js — Professional Signal Generator (Keysight 33600A style)
 *
 * Features:
 * - Dark instrument chassis with CRT-style display
 * - 8 waveforms: Sine, Square, Triangle, Sawtooth, Pulse, Noise, Arbitrary, DC
 * - Frequency: 1 mHz — 120 MHz with unit multipliers
 * - Amplitude: 1 mV — 10 V peak-to-peak
 * - Modulation: AM, FM, PM, PWM
 * - Sweep: Start→Stop, Linear/Log
 * - Burst: N cycles, trigger mode
 * - Dual channel CH1 + CH2
 * - Arbitrary waveform editor (draw + formula)
 * - Output to spectrum analyzer / channel
 */

import { addXP } from '../core/gamification.js';

/* ===== Constants ===== */
const WAVEFORMS = [
  { id: 'sine', name: 'Sine', icon: '~', tip: 'Синусоида — базовая гармоническая волна. Содержит только одну частоту (основную гармонику). Используется как несущая в радиосвязи, тестовый сигнал для измерений' },
  { id: 'square', name: 'Square', icon: '⊓', tip: 'Прямоугольный сигнал — переключается между +V и −V. Содержит нечётные гармоники (3f, 5f, 7f...). Используется в цифровых схемах, тактовых генераторах' },
  { id: 'triangle', name: 'Triangle', icon: '△', tip: 'Треугольный сигнал — линейно нарастает и спадает. Содержит нечётные гармоники с быстрым затуханием (1/n²). Применяется в VCO, широтно-импульсной модуляции' },
  { id: 'sawtooth', name: 'Saw', icon: '⟋', tip: 'Пилообразный сигнал — линейно нарастает и резко сбрасывается. Содержит ВСЕ гармоники (чётные и нечётные). Используется в развёртке осциллографов, звуковом синтезе' },
  { id: 'pulse', name: 'Pulse', icon: '⊔', tip: 'Импульсный сигнал — как прямоугольный, но с настраиваемой скважностью (Duty Cycle). При duty ≠ 50% появляются чётные гармоники. Используется в ШИМ, управлении двигателями' },
  { id: 'noise', name: 'Noise', icon: '⁓', tip: 'Белый шум — случайный сигнал с равномерным спектром на всех частотах. Используется для тестирования АЧХ систем, имитации помех в канале связи' },
  { id: 'arbitrary', name: 'Arb', icon: '✎', tip: 'Произвольная форма — задайте формулу или нарисуйте форму волны вручную. Позволяет создать любой сигнал: DTMF-тоны, OFDM, импульсы специальной формы' },
  { id: 'dc', name: 'DC', icon: '—', tip: 'Постоянное напряжение (DC) — не меняется во времени. Используется как смещение, опорное напряжение, для питания схем' }
];

const FREQ_UNITS = [
  { suffix: 'mHz', mult: 0.001, tip: 'Миллигерцы (10⁻³ Гц) — сверхнизкие частоты. 1 mHz = один период за 1000 секунд. Используется для медленных процессов (дрейф, модуляция)' },
  { suffix: 'Hz', mult: 1, tip: 'Герцы — базовая единица частоты. 1 Гц = 1 колебание в секунду. Слышимый диапазон: 20 Гц — 20 кГц' },
  { suffix: 'kHz', mult: 1e3, tip: 'Килогерцы (10³ Гц) — тысячи герц. AM-радио: 530–1700 кГц. Звуковые частоты: 1–20 кГц' },
  { suffix: 'MHz', mult: 1e6, tip: 'Мегагерцы (10⁶ Гц) — миллионы герц. FM-радио: 87.5–108 МГц. Ethernet: 125 МГц. Wi-Fi: 2400/5800 МГц' }
];

const AMP_UNITS = [
  { suffix: 'mVpp', mult: 0.001, tip: 'Милливольты peak-to-peak (10⁻³ Вpp) — от минимума до максимума сигнала. Типичный уровень сигнала на выходе датчика или микрофона' },
  { suffix: 'Vpp', mult: 1, tip: 'Вольты peak-to-peak — полный размах сигнала от минимума до максимума. 1 Vpp синусоиды = ±0.5 В = 0.354 Vrms' }
];

const MOD_TYPES = [
  { id: 'Off', tip: 'Модуляция выключена — генерируется чистый немодулированный сигнал' },
  { id: 'AM', tip: 'Амплитудная модуляция — амплитуда несущей изменяется пропорционально модулирующему сигналу. Используется в AM-радио (530–1700 кГц). Проста, но неэффективна по мощности' },
  { id: 'FM', tip: 'Частотная модуляция — частота несущей отклоняется пропорционально модулирующему сигналу. Используется в FM-радио (87.5–108 МГц). Устойчивее к помехам, чем AM' },
  { id: 'PM', tip: 'Фазовая модуляция — фаза несущей сдвигается пропорционально модулирующему сигналу. Математически связана с FM. Основа цифровых модуляций (PSK, QAM)' },
  { id: 'PWM', tip: 'Широтно-импульсная модуляция — изменяется скважность (duty cycle) импульсов. Используется для управления мощностью (двигатели, LED), ЦАП' }
];

const PRESETS = [
  { name: '1 kHz Sine', tip: 'Стандартный тестовый сигнал 1 кГц — используется для калибровки приборов и проверки аудиотракта', ch: { waveform: 'sine', freq: 1000, freqUnit: 1, amp: 1, ampUnit: 1 } },
  { name: '440 Hz (A4)', tip: 'Нота Ля первой октавы (440 Гц) — международный стандарт настройки музыкальных инструментов (камертон)', ch: { waveform: 'sine', freq: 440, freqUnit: 1, amp: 0.5, ampUnit: 1 } },
  { name: 'Square 10 kHz', tip: 'Прямоугольный сигнал 10 кГц — типичный тактовый сигнал. Содержит гармоники 30, 50, 70... кГц', ch: { waveform: 'square', freq: 10, freqUnit: 2, amp: 1, ampUnit: 1, duty: 50 } },
  { name: 'AM Radio', tip: 'AM-радиосигнал: несущая 1 кГц, модулирующий тон 100 Гц, глубина 80%. Наблюдайте огибающую на осциллограмме', ch: { waveform: 'sine', freq: 1, freqUnit: 2, amp: 1, ampUnit: 1, modType: 'AM', modDepth: 80, modFreq: 100 } },
  { name: 'FM Signal', tip: 'FM-сигнал: несущая 10 кГц, модуляция 1 кГц, девиация 2 кГц. На спектре видны боковые полосы (функции Бесселя)', ch: { waveform: 'sine', freq: 10, freqUnit: 2, amp: 1, ampUnit: 1, modType: 'FM', modDeviation: 2000, modFreq: 1000 } },
  { name: 'Sweep 20-20k', tip: 'Развёртка по всему слышимому диапазону (20 Гц — 20 кГц) за 2 секунды. Идеально для проверки АЧХ аудиосистемы', ch: { waveform: 'sine', freq: 1, freqUnit: 2, amp: 0.5, ampUnit: 1, sweepEnabled: true, sweepStart: 20, sweepStop: 20000, sweepTime: 2 } },
  { name: 'DTMF "5"', tip: 'DTMF-тон цифры «5» — сумма 770 Гц + 1336 Гц. Используется в телефонной сигнализации (тональный набор). Каждая цифра = уникальная пара частот', ch: { waveform: 'arbitrary', freq: 1, freqUnit: 2, amp: 1, ampUnit: 1, arbFormula: 'sin(2*PI*770*t)+sin(2*PI*1336*t)' } },
  { name: 'Dual Tone', tip: 'Двухтональный сигнал: 1 кГц (основной) + 3 кГц (с амплитудой 0.5). На спектре видны два чётких пика. Тест на интермодуляционные искажения', ch: { waveform: 'arbitrary', freq: 1, freqUnit: 2, amp: 0.8, ampUnit: 1, arbFormula: 'sin(2*PI*1000*t)+0.5*sin(2*PI*3000*t)' } }
];

/* ===== State ===== */
let container = null;
let worker = null;
let channels = [createDefaultChannel(), createDefaultChannel()];
let activeChannel = 0;
let sampleRate = 44100;
let numSamples = 2048;
let canvasTimeCh = [null, null];
let ctxTimeCh = [null, null];
let outputSignals = [null, null]; // Generated Float32Array per channel
let arbCanvas = null, arbCtx = null;
let arbDrawing = false;
let arbPoints = [];
let animFrame = null;
let isRunning = [true, false]; // CH1 on, CH2 off by default

// Callbacks for external consumers (spectrum analyzer, signal chain)
let onOutputChange = null;

function createDefaultChannel() {
  return {
    waveform: 'sine',
    freq: 1000,
    freqUnit: 1, // index into FREQ_UNITS
    amp: 1,
    ampUnit: 1,  // index into AMP_UNITS
    offset: 0,
    phase: 0,
    duty: 50,
    // Modulation
    modType: 'Off',
    modDepth: 50,    // AM depth %
    modFreq: 100,    // modulation frequency Hz
    modDeviation: 1000, // FM deviation Hz
    modPhase: 90,    // PM phase degrees
    // Sweep
    sweepEnabled: false,
    sweepStart: 100,
    sweepStop: 10000,
    sweepTime: 1,
    sweepMode: 'linear',
    // Burst
    burstEnabled: false,
    burstCycles: 5,
    // Arbitrary
    arbFormula: 'sin(2*PI*1000*t)',
    arbWaveform: null // Float32Array custom shape
  };
}

/* ===== Public API ===== */

export function initSignalGenerator() {
  container = document.getElementById('signalGeneratorUI');
  if (!container) return;
  worker = new Worker('js/workers/dsp-worker.js');
  worker.onmessage = handleWorkerMessage;
  buildUI();
  generateAll();
}

export function getSignalGeneratorOutput(ch = 0) {
  return outputSignals[ch];
}

export function setSignalOutputCallback(fn) {
  onOutputChange = fn;
}

export function getSignalGeneratorState() {
  return { channels, activeChannel, sampleRate, numSamples, isRunning };
}

/* ===== Worker Communication ===== */
let pendingWorker = new Map();
let workerIdCounter = 0;

function postWorker(msg) {
  return new Promise(resolve => {
    const id = ++workerIdCounter;
    msg.id = id;
    pendingWorker.set(id, resolve);
    worker.postMessage(msg);
  });
}

function handleWorkerMessage(e) {
  const { id } = e.data;
  const resolve = pendingWorker.get(id);
  if (resolve) {
    pendingWorker.delete(id);
    resolve(e.data);
  }
}

/* ===== UI Builder ===== */

function buildUI() {
  container.innerHTML = `
    <div class="sg-instrument">
      <div class="sg-instrument__top-bar">
        <span class="sg-instrument__brand">Signal Generator</span>
        <span class="sg-instrument__model">SG-2600A</span>
        <div class="sg-instrument__ch-tabs">
          <button class="sg-ch-tab sg-ch-tab--active" data-ch="0" data-tip="Канал 1 — основной выход генератора. Используйте для генерации основного сигнала, подачи на вход спектроанализатора или канала связи">CH1</button>
          <button class="sg-ch-tab" data-ch="1" data-tip="Канал 2 — второй независимый выход. Позволяет генерировать два разных сигнала одновременно для сравнения, смешивания или создания I/Q-пары">CH2</button>
        </div>
      </div>

      <div class="sg-instrument__display">
        <div class="sg-instrument__display-header">
          <span class="sg-display-ch-label" id="sgDisplayChLabel">CH1</span>
          <span class="sg-display-status" id="sgDisplayStatus">RUN</span>
        </div>
        <canvas id="sgTimeCanvas0" class="sg-display-canvas" width="600" height="160"></canvas>
        <canvas id="sgTimeCanvas1" class="sg-display-canvas" style="display:none" width="600" height="160"></canvas>
        <div class="sg-display-readout" id="sgReadout"></div>
      </div>

      <div class="sg-instrument__controls">
        <div class="sg-controls-row">
          <div class="sg-control-group">
            <div class="sg-control-group__title">Waveform</div>
            <div class="sg-waveform-btns" id="sgWaveformBtns"></div>
          </div>
        </div>

        <div class="sg-controls-row">
          <div class="sg-control-group sg-control-group--freq">
            <div class="sg-control-group__title">Frequency</div>
            <div class="sg-freq-row">
              <input type="number" class="sg-num-input sg-num-input--lg" id="sgFreqInput" value="1000" min="0.001" step="any" data-tip="Частота сигнала — количество полных колебаний в секунду. Крутите колёсико мыши для точной подстройки (Shift+колёсико = шаг ×10). Диапазон: 1 мГц — 120 МГц">
              <div class="sg-unit-btns" id="sgFreqUnits"></div>
            </div>
          </div>
          <div class="sg-control-group">
            <div class="sg-control-group__title">Amplitude</div>
            <div class="sg-freq-row">
              <input type="number" class="sg-num-input" id="sgAmpInput" value="1" min="0" step="0.01" data-tip="Амплитуда (peak-to-peak) — полный размах сигнала от минимума до максимума. 1 Vpp = сигнал колеблется от −0.5 В до +0.5 В (без смещения). Крутите колёсико мыши для точной подстройки">
              <div class="sg-unit-btns" id="sgAmpUnits"></div>
            </div>
          </div>
        </div>

        <div class="sg-controls-row">
          <div class="sg-control-group">
            <div class="sg-control-group__title">DC Offset</div>
            <input type="number" class="sg-num-input" id="sgOffsetInput" value="0" step="0.01" data-tip="Постоянное смещение (DC offset) — сдвигает весь сигнал вверх или вниз. При offset=0 сигнал симметричен относительно нуля. Offset=2В сместит синусоиду в диапазон 1.5В…2.5В (при amp=1Vpp)"> V
          </div>
          <div class="sg-control-group">
            <div class="sg-control-group__title">Phase</div>
            <input type="number" class="sg-num-input" id="sgPhaseInput" value="0" min="0" max="360" step="1" data-tip="Начальная фаза сигнала в градусах (0°–360°). Определяет с какого момента периода начинается сигнал. 90° для синусоиды = косинусоида. Важна при смешивании нескольких сигналов"> °
          </div>
          <div class="sg-control-group" id="sgDutyGroup">
            <div class="sg-control-group__title">Duty Cycle</div>
            <input type="number" class="sg-num-input" id="sgDutyInput" value="50" min="1" max="99" step="1" data-tip="Скважность (Duty Cycle) — доля периода, в течение которой сигнал находится в высоком состоянии. 50% = симметричный меандр. 10% = короткие импульсы. Применяется для Square и Pulse форм"> %
          </div>
        </div>

        <!-- Function keys row -->
        <div class="sg-fkeys" id="sgFkeys">
          <button class="sg-fkey sg-fkey--active" data-panel="main" data-tip="Основные параметры: форма волны, частота, амплитуда, смещение, фаза">F1 Main</button>
          <button class="sg-fkey" data-panel="mod" data-tip="Модуляция: наложение информационного сигнала на несущую. AM — изменение амплитуды, FM — частоты, PM — фазы, PWM — скважности">F2 Mod</button>
          <button class="sg-fkey" data-panel="sweep" data-tip="Развёртка по частоте: плавное изменение частоты от Start до Stop за заданное время. Используется для анализа АЧХ фильтров и систем">F3 Sweep</button>
          <button class="sg-fkey" data-panel="burst" data-tip="Пакетный режим: генерация ограниченного числа периодов сигнала. Имитирует импульсные передачи, пакеты данных">F4 Burst</button>
          <button class="sg-fkey" data-panel="arb" data-tip="Произвольная форма: задайте математическую формулу или нарисуйте сигнал мышью. Создавайте DTMF-тоны, сложные спектры, реальные сигналы">F5 Arb</button>
          <button class="sg-fkey" data-panel="presets" data-tip="Готовые пресеты: быстрая загрузка типичных сигналов (тестовые тоны, AM/FM, DTMF, sweep)">F6 Presets</button>
        </div>

        <!-- Modulation Panel -->
        <div class="sg-panel" id="sgPanelMod" style="display:none">
          <div class="sg-panel__title">Modulation</div>
          <div class="sg-controls-row">
            <div class="sg-control-group">
              <div class="sg-control-group__title">Type</div>
              <div class="sg-unit-btns" id="sgModTypeBtns"></div>
            </div>
          </div>
          <div id="sgModParams"></div>
        </div>

        <!-- Sweep Panel -->
        <div class="sg-panel" id="sgPanelSweep" style="display:none">
          <div class="sg-panel__title">Sweep</div>
          <label class="sg-check" data-tip="Включить/выключить режим развёртки. При включении частота плавно изменяется от Start до Stop за заданное время"><input type="checkbox" id="sgSweepEnable"> Enable Sweep</label>
          <div class="sg-controls-row">
            <div class="sg-control-group">
              <div class="sg-control-group__title">Start Freq (Hz)</div>
              <input type="number" class="sg-num-input" id="sgSweepStart" value="100" min="0.001" step="any" data-tip="Начальная частота развёртки. Сигнал начинается с этой частоты и плавно движется к Stop Freq. Для аудио-теста: 20 Гц. Для проверки фильтра: от полосы среза − запас">
            </div>
            <div class="sg-control-group">
              <div class="sg-control-group__title">Stop Freq (Hz)</div>
              <input type="number" class="sg-num-input" id="sgSweepStop" value="10000" min="0.001" step="any" data-tip="Конечная частота развёртки. Сигнал заканчивает на этой частоте, затем перезапускается с Start. Для аудио-теста: 20000 Гц. Start > Stop допустимо (обратная развёртка)">
            </div>
            <div class="sg-control-group">
              <div class="sg-control-group__title">Sweep Time (s)</div>
              <input type="number" class="sg-num-input" id="sgSweepTime" value="1" min="0.01" step="0.01" data-tip="Время развёртки — за сколько секунд частота проходит от Start до Stop. Короткое время (0.1с) — быстрый обзор. Длинное (10с) — точный анализ АЧХ. Зависит от инерции измеряемой системы">
            </div>
          </div>
          <div class="sg-controls-row">
            <div class="sg-control-group">
              <div class="sg-control-group__title">Mode</div>
              <div class="sg-unit-btns" id="sgSweepModeBtns"></div>
            </div>
          </div>
        </div>

        <!-- Burst Panel -->
        <div class="sg-panel" id="sgPanelBurst" style="display:none">
          <div class="sg-panel__title">Burst</div>
          <label class="sg-check" data-tip="Включить/выключить пакетный режим. Генерируется заданное число периодов, затем — тишина. Имитирует передачу пакетов данных, радарные импульсы, burst-трафик"><input type="checkbox" id="sgBurstEnable"> Enable Burst</label>
          <div class="sg-controls-row">
            <div class="sg-control-group">
              <div class="sg-control-group__title">Cycles</div>
              <input type="number" class="sg-num-input" id="sgBurstCycles" value="5" min="1" max="10000" step="1" data-tip="Количество полных периодов в пакете (1–10000). 1 период = один полный цикл волны. Чем больше циклов, тем длиннее пакет и уже спектр. Типично для радара: 10–1000 импульсов">
            </div>
          </div>
        </div>

        <!-- Arbitrary Panel -->
        <div class="sg-panel" id="sgPanelArb" style="display:none">
          <div class="sg-panel__title">Arbitrary Waveform</div>
          <div class="sg-control-group">
            <div class="sg-control-group__title">Formula (t = time in seconds, PI = Math.PI)</div>
            <input type="text" class="sg-num-input sg-num-input--wide" id="sgArbFormula" value="sin(2*PI*1000*t)" placeholder="sin(2*PI*1000*t)+0.5*sin(2*PI*3000*t)" data-tip="Математическая формула сигнала. t = время в секундах, PI = π. Доступны: sin, cos, tan, abs, sqrt, log, exp. Пример: sin(2*PI*1000*t) = синусоида 1 кГц. Сумма синусов = многотональный сигнал. Для DTMF '5': sin(2*PI*770*t)+sin(2*PI*1336*t)">
            <button class="sg-btn sg-btn--sm" id="sgArbApply" data-tip="Применить формулу и пересчитать сигнал. Автоматически переключает форму волны на Arbitrary">Apply Formula</button>
          </div>
          <div class="sg-control-group" style="margin-top:8px">
            <div class="sg-control-group__title">Or draw waveform (one period)</div>
            <div class="sg-arb-canvas-wrap" data-tip="Область рисования формы волны. Нарисуйте мышью один период сигнала. Горизонтальная ось = время (один период), вертикальная = амплитуда (центр = 0, верх = +1, низ = −1). Форма будет периодически повторяться">
              <canvas id="sgArbCanvas" width="400" height="120"></canvas>
            </div>
            <div style="display:flex;gap:4px;margin-top:4px">
              <button class="sg-btn sg-btn--sm" id="sgArbClear" data-tip="Очистить область рисования и начать заново">Clear</button>
              <button class="sg-btn sg-btn--sm" id="sgArbApplyDraw" data-tip="Применить нарисованную форму как сигнал. Рисунок преобразуется в 256 точек и используется как один период волны">Use Drawing</button>
            </div>
          </div>
        </div>

        <!-- Presets Panel -->
        <div class="sg-panel" id="sgPanelPresets" style="display:none">
          <div class="sg-panel__title">Presets</div>
          <div class="sg-presets-grid" id="sgPresetsGrid"></div>
        </div>

        <!-- Output / Run controls -->
        <div class="sg-controls-row sg-controls-row--output">
          <button class="sg-btn sg-btn--run" id="sgRunBtn" data-tip="Включить выход — генератор начнёт формировать сигнал и передавать его на дисплей, спектроанализатор и другие подключённые инструменты">
            <span id="sgRunIcon">▶</span> <span id="sgRunLabel">Output ON</span>
          </button>
          <button class="sg-btn sg-btn--stop" id="sgStopBtn" data-tip="Выключить выход — генерация сигнала остановлена, на выходе тишина. Настройки сохраняются">■ Output OFF</button>
        </div>
      </div>
    </div>
  `;

  // Get canvas references
  canvasTimeCh[0] = document.getElementById('sgTimeCanvas0');
  canvasTimeCh[1] = document.getElementById('sgTimeCanvas1');
  ctxTimeCh[0] = canvasTimeCh[0].getContext('2d');
  ctxTimeCh[1] = canvasTimeCh[1].getContext('2d');

  arbCanvas = document.getElementById('sgArbCanvas');
  arbCtx = arbCanvas.getContext('2d');

  buildWaveformButtons();
  buildFreqUnits();
  buildAmpUnits();
  buildModTypeButtons();
  buildSweepModeButtons();
  buildPresets();
  attachEventListeners();
  updateUI();
}

function buildWaveformButtons() {
  const el = document.getElementById('sgWaveformBtns');
  el.innerHTML = WAVEFORMS.map(w =>
    `<button class="sg-wf-btn${channels[activeChannel].waveform === w.id ? ' sg-wf-btn--active' : ''}" data-wf="${w.id}" data-tip="${w.tip}">
      <span class="sg-wf-btn__icon">${w.icon}</span><span class="sg-wf-btn__name">${w.name}</span>
    </button>`
  ).join('');
}

function buildFreqUnits() {
  const el = document.getElementById('sgFreqUnits');
  el.innerHTML = FREQ_UNITS.map((u, i) =>
    `<button class="sg-unit-btn${channels[activeChannel].freqUnit === i ? ' sg-unit-btn--active' : ''}" data-fu="${i}" data-tip="${u.tip}">${u.suffix}</button>`
  ).join('');
}

function buildAmpUnits() {
  const el = document.getElementById('sgAmpUnits');
  el.innerHTML = AMP_UNITS.map((u, i) =>
    `<button class="sg-unit-btn${channels[activeChannel].ampUnit === i ? ' sg-unit-btn--active' : ''}" data-au="${i}" data-tip="${u.tip}">${u.suffix}</button>`
  ).join('');
}

function buildModTypeButtons() {
  const el = document.getElementById('sgModTypeBtns');
  el.innerHTML = MOD_TYPES.map(m =>
    `<button class="sg-unit-btn${channels[activeChannel].modType === m.id ? ' sg-unit-btn--active' : ''}" data-mod="${m.id}" data-tip="${m.tip}">${m.id}</button>`
  ).join('');
}

function buildSweepModeButtons() {
  const el = document.getElementById('sgSweepModeBtns');
  const tips = {
    linear: 'Линейная развёртка — частота изменяется равномерно (Δf постоянна). Подходит для узкополосного анализа. Пример: 100→10000 Гц за 1с = +9900 Гц/с',
    log: 'Логарифмическая развёртка — частота изменяется по логарифмическому закону (равные октавы за равное время). Естественна для слуха и АЧХ. Пример: 100→10000 Гц = ~6.6 октав'
  };
  ['linear', 'log'].forEach(m => {
    el.innerHTML += `<button class="sg-unit-btn${channels[activeChannel].sweepMode === m ? ' sg-unit-btn--active' : ''}" data-sm="${m}" data-tip="${tips[m]}">${m === 'linear' ? 'Linear' : 'Log'}</button>`;
  });
}

function buildPresets() {
  const el = document.getElementById('sgPresetsGrid');
  el.innerHTML = PRESETS.map((p, i) =>
    `<button class="sg-preset-btn" data-preset="${i}" data-tip="${p.tip}">${p.name}</button>`
  ).join('');
}

function updateModParams() {
  const ch = channels[activeChannel];
  const el = document.getElementById('sgModParams');
  if (ch.modType === 'Off') {
    el.innerHTML = '<div style="color:var(--text-secondary);font-size:.72rem;padding:4px">Modulation disabled</div>';
    return;
  }

  let html = '<div class="sg-controls-row">';
  if (ch.modType === 'AM') {
    html += `
      <div class="sg-control-group">
        <div class="sg-control-group__title">Depth (%)</div>
        <input type="number" class="sg-num-input" id="sgModDepth" value="${ch.modDepth}" min="0" max="100" step="1" data-tip="Глубина AM-модуляции (0–100%). Определяет, насколько сильно амплитуда несущей изменяется. 100% = полная модуляция (сигнал касается нуля). >100% = перемодуляция (искажения). Типично для AM-радио: 80–95%">
      </div>
      <div class="sg-control-group">
        <div class="sg-control-group__title">Mod Freq (Hz)</div>
        <input type="number" class="sg-num-input" id="sgModFreq" value="${ch.modFreq}" min="0.1" step="any" data-tip="Частота модулирующего сигнала — определяет как быстро изменяется амплитуда несущей. Для звука: 20–20000 Гц. Полоса AM-сигнала = 2 × частота модуляции">
      </div>`;
  } else if (ch.modType === 'FM') {
    html += `
      <div class="sg-control-group">
        <div class="sg-control-group__title">Deviation (Hz)</div>
        <input type="number" class="sg-num-input" id="sgModDeviation" value="${ch.modDeviation}" min="1" step="any" data-tip="Девиация частоты — максимальное отклонение от несущей частоты. FM-радио: ±75 кГц. Чем больше девиация, тем шире полоса сигнала и выше качество, но требуется больше спектра. Индекс модуляции β = девиация / частота_модуляции">
      </div>
      <div class="sg-control-group">
        <div class="sg-control-group__title">Mod Freq (Hz)</div>
        <input type="number" class="sg-num-input" id="sgModFreq" value="${ch.modFreq}" min="0.1" step="any" data-tip="Частота модулирующего сигнала — определяет скорость изменения частоты несущей. Полоса FM по Карсону: BW ≈ 2×(девиация + частота_модуляции)">
      </div>`;
  } else if (ch.modType === 'PM') {
    html += `
      <div class="sg-control-group">
        <div class="sg-control-group__title">Phase Deviation (°)</div>
        <input type="number" class="sg-num-input" id="sgModPhase" value="${ch.modPhase}" min="0" max="360" step="1" data-tip="Девиация фазы — максимальный сдвиг фазы несущей (0°–360°). PM математически связана с FM: мгновенная частота FM = производная фазы PM. При малых индексах спектры AM и PM похожи">
      </div>
      <div class="sg-control-group">
        <div class="sg-control-group__title">Mod Freq (Hz)</div>
        <input type="number" class="sg-num-input" id="sgModFreq" value="${ch.modFreq}" min="0.1" step="any" data-tip="Частота модулирующего сигнала — определяет скорость изменения фазы несущей. В отличие от FM, полоса PM зависит от индекса модуляции нелинейно">
      </div>`;
  } else if (ch.modType === 'PWM') {
    html += `
      <div class="sg-control-group">
        <div class="sg-control-group__title">Duty Deviation (%)</div>
        <input type="number" class="sg-num-input" id="sgModDepth" value="${ch.modDepth}" min="0" max="49" step="1" data-tip="Отклонение скважности — насколько duty cycle изменяется от центрального значения. При duty=50% и deviation=30% скважность будет колебаться от 20% до 80%. Макс. 49% чтобы не выйти за 0–100%">
      </div>
      <div class="sg-control-group">
        <div class="sg-control-group__title">Mod Freq (Hz)</div>
        <input type="number" class="sg-num-input" id="sgModFreq" value="${ch.modFreq}" min="0.1" step="any" data-tip="Частота модулирующего сигнала — определяет скорость изменения скважности импульсов. Типичные значения для управления двигателями: 50–500 Гц">
      </div>`;
  }
  html += '</div>';
  el.innerHTML = html;

  // Attach mod param listeners
  const depthEl = document.getElementById('sgModDepth');
  if (depthEl) depthEl.addEventListener('change', () => { ch.modDepth = +depthEl.value; generateAll(); });
  const freqEl = document.getElementById('sgModFreq');
  if (freqEl) freqEl.addEventListener('change', () => { ch.modFreq = +freqEl.value; generateAll(); });
  const devEl = document.getElementById('sgModDeviation');
  if (devEl) devEl.addEventListener('change', () => { ch.modDeviation = +devEl.value; generateAll(); });
  const phEl = document.getElementById('sgModPhase');
  if (phEl) phEl.addEventListener('change', () => { ch.modPhase = +phEl.value; generateAll(); });
}

/* ===== Event Listeners ===== */

function attachEventListeners() {
  // Channel tabs
  container.querySelectorAll('.sg-ch-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeChannel = +btn.dataset.ch;
      container.querySelectorAll('.sg-ch-tab').forEach(b => b.classList.toggle('sg-ch-tab--active', +b.dataset.ch === activeChannel));
      canvasTimeCh[0].style.display = activeChannel === 0 ? '' : 'none';
      canvasTimeCh[1].style.display = activeChannel === 1 ? '' : 'none';
      updateUI();
    });
  });

  // Waveform buttons (delegate)
  document.getElementById('sgWaveformBtns').addEventListener('click', e => {
    const btn = e.target.closest('.sg-wf-btn');
    if (!btn) return;
    channels[activeChannel].waveform = btn.dataset.wf;
    buildWaveformButtons();
    updateUI();
    generateAll();
  });

  // Frequency input + units
  const freqInput = document.getElementById('sgFreqInput');
  freqInput.addEventListener('change', () => { channels[activeChannel].freq = +freqInput.value; generateAll(); });
  freqInput.addEventListener('wheel', e => {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    channels[activeChannel].freq = Math.max(0.001, channels[activeChannel].freq + (e.deltaY < 0 ? step : -step));
    freqInput.value = channels[activeChannel].freq;
    generateAll();
  });

  document.getElementById('sgFreqUnits').addEventListener('click', e => {
    const btn = e.target.closest('.sg-unit-btn');
    if (!btn) return;
    channels[activeChannel].freqUnit = +btn.dataset.fu;
    buildFreqUnits();
    generateAll();
  });

  // Amplitude input + units
  const ampInput = document.getElementById('sgAmpInput');
  ampInput.addEventListener('change', () => { channels[activeChannel].amp = +ampInput.value; generateAll(); });
  ampInput.addEventListener('wheel', e => {
    e.preventDefault();
    const step = e.shiftKey ? 0.1 : 0.01;
    channels[activeChannel].amp = Math.max(0, +(channels[activeChannel].amp + (e.deltaY < 0 ? step : -step)).toFixed(3));
    ampInput.value = channels[activeChannel].amp;
    generateAll();
  });

  document.getElementById('sgAmpUnits').addEventListener('click', e => {
    const btn = e.target.closest('.sg-unit-btn');
    if (!btn) return;
    channels[activeChannel].ampUnit = +btn.dataset.au;
    buildAmpUnits();
    generateAll();
  });

  // Offset, Phase, Duty
  document.getElementById('sgOffsetInput').addEventListener('change', e => { channels[activeChannel].offset = +e.target.value; generateAll(); });
  document.getElementById('sgPhaseInput').addEventListener('change', e => { channels[activeChannel].phase = +e.target.value; generateAll(); });
  document.getElementById('sgDutyInput').addEventListener('change', e => { channels[activeChannel].duty = +e.target.value; generateAll(); });

  // Function keys (panels)
  document.getElementById('sgFkeys').addEventListener('click', e => {
    const btn = e.target.closest('.sg-fkey');
    if (!btn) return;
    const panel = btn.dataset.panel;
    document.querySelectorAll('.sg-fkey').forEach(b => b.classList.toggle('sg-fkey--active', b === btn));
    ['mod', 'sweep', 'burst', 'arb', 'presets'].forEach(p => {
      const el = document.getElementById('sgPanel' + p.charAt(0).toUpperCase() + p.slice(1));
      if (el) el.style.display = panel === p ? '' : 'none';
    });
    if (panel === 'mod') updateModParams();
  });

  // Modulation type buttons
  document.getElementById('sgModTypeBtns').addEventListener('click', e => {
    const btn = e.target.closest('.sg-unit-btn');
    if (!btn) return;
    channels[activeChannel].modType = btn.dataset.mod;
    buildModTypeButtons();
    updateModParams();
    generateAll();
  });

  // Sweep controls
  document.getElementById('sgSweepEnable').addEventListener('change', e => { channels[activeChannel].sweepEnabled = e.target.checked; generateAll(); });
  document.getElementById('sgSweepStart').addEventListener('change', e => { channels[activeChannel].sweepStart = +e.target.value; generateAll(); });
  document.getElementById('sgSweepStop').addEventListener('change', e => { channels[activeChannel].sweepStop = +e.target.value; generateAll(); });
  document.getElementById('sgSweepTime').addEventListener('change', e => { channels[activeChannel].sweepTime = +e.target.value; generateAll(); });
  document.getElementById('sgSweepModeBtns').addEventListener('click', e => {
    const btn = e.target.closest('.sg-unit-btn');
    if (!btn) return;
    channels[activeChannel].sweepMode = btn.dataset.sm;
    buildSweepModeButtons();
    generateAll();
  });

  // Burst controls
  document.getElementById('sgBurstEnable').addEventListener('change', e => { channels[activeChannel].burstEnabled = e.target.checked; generateAll(); });
  document.getElementById('sgBurstCycles').addEventListener('change', e => { channels[activeChannel].burstCycles = +e.target.value; generateAll(); });

  // Arbitrary formula
  document.getElementById('sgArbApply').addEventListener('click', () => {
    channels[activeChannel].arbFormula = document.getElementById('sgArbFormula').value;
    channels[activeChannel].waveform = 'arbitrary';
    buildWaveformButtons();
    generateAll();
  });

  // Arbitrary drawing
  arbCanvas.addEventListener('mousedown', arbMouseDown);
  arbCanvas.addEventListener('mousemove', arbMouseMove);
  arbCanvas.addEventListener('mouseup', () => { arbDrawing = false; });
  arbCanvas.addEventListener('mouseleave', () => { arbDrawing = false; });
  document.getElementById('sgArbClear').addEventListener('click', () => {
    arbPoints = [];
    drawArbCanvas();
  });
  document.getElementById('sgArbApplyDraw').addEventListener('click', () => {
    if (arbPoints.length < 2) return;
    const wf = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = i / 256 * arbCanvas.width;
      const pt = arbPoints.reduce((closest, p) => Math.abs(p.x - x) < Math.abs(closest.x - x) ? p : closest, arbPoints[0]);
      wf[i] = 1 - 2 * pt.y / arbCanvas.height;
    }
    channels[activeChannel].arbWaveform = wf;
    channels[activeChannel].waveform = 'arbitrary';
    buildWaveformButtons();
    generateAll();
  });

  // Presets
  document.getElementById('sgPresetsGrid').addEventListener('click', e => {
    const btn = e.target.closest('.sg-preset-btn');
    if (!btn) return;
    const preset = PRESETS[+btn.dataset.preset];
    Object.assign(channels[activeChannel], createDefaultChannel(), preset.ch);
    updateUI();
    generateAll();
    addXP(5);
  });

  // Run/Stop
  document.getElementById('sgRunBtn').addEventListener('click', () => {
    isRunning[activeChannel] = true;
    updateRunStatus();
    generateAll();
  });
  document.getElementById('sgStopBtn').addEventListener('click', () => {
    isRunning[activeChannel] = false;
    updateRunStatus();
  });
}

/* ===== Arbitrary Drawing ===== */

function arbMouseDown(e) {
  arbDrawing = true;
  const rect = arbCanvas.getBoundingClientRect();
  arbPoints = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }];
  drawArbCanvas();
}

function arbMouseMove(e) {
  if (!arbDrawing) return;
  const rect = arbCanvas.getBoundingClientRect();
  arbPoints.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  drawArbCanvas();
}

function drawArbCanvas() {
  const w = arbCanvas.width, h = arbCanvas.height;
  arbCtx.fillStyle = '#0a0e14';
  arbCtx.fillRect(0, 0, w, h);
  // Grid
  arbCtx.strokeStyle = '#1a2a3a';
  arbCtx.lineWidth = 0.5;
  arbCtx.beginPath();
  arbCtx.moveTo(0, h / 2); arbCtx.lineTo(w, h / 2);
  arbCtx.stroke();
  // Draw points
  if (arbPoints.length < 2) return;
  arbCtx.strokeStyle = '#2ecc71';
  arbCtx.lineWidth = 2;
  arbCtx.beginPath();
  arbCtx.moveTo(arbPoints[0].x, arbPoints[0].y);
  for (let i = 1; i < arbPoints.length; i++) {
    arbCtx.lineTo(arbPoints[i].x, arbPoints[i].y);
  }
  arbCtx.stroke();
}

/* ===== UI Update ===== */

function updateUI() {
  const ch = channels[activeChannel];
  document.getElementById('sgFreqInput').value = ch.freq;
  document.getElementById('sgAmpInput').value = ch.amp;
  document.getElementById('sgOffsetInput').value = ch.offset;
  document.getElementById('sgPhaseInput').value = ch.phase;
  document.getElementById('sgDutyInput').value = ch.duty;
  document.getElementById('sgArbFormula').value = ch.arbFormula;
  document.getElementById('sgSweepEnable').checked = ch.sweepEnabled;
  document.getElementById('sgSweepStart').value = ch.sweepStart;
  document.getElementById('sgSweepStop').value = ch.sweepStop;
  document.getElementById('sgSweepTime').value = ch.sweepTime;
  document.getElementById('sgBurstEnable').checked = ch.burstEnabled;
  document.getElementById('sgBurstCycles').value = ch.burstCycles;

  const dutyGroup = document.getElementById('sgDutyGroup');
  dutyGroup.style.display = (ch.waveform === 'square' || ch.waveform === 'pulse') ? '' : 'none';

  const chLabel = document.getElementById('sgDisplayChLabel');
  chLabel.textContent = `CH${activeChannel + 1}`;
  chLabel.style.color = activeChannel === 0 ? '#2ecc71' : '#f1c40f';

  buildWaveformButtons();
  buildFreqUnits();
  buildAmpUnits();
  buildModTypeButtons();
  updateRunStatus();
  updateReadout();
}

function updateRunStatus() {
  const status = document.getElementById('sgDisplayStatus');
  const running = isRunning[activeChannel];
  status.textContent = running ? 'RUN' : 'STOP';
  status.style.color = running ? '#2ecc71' : '#e74c3c';
}

function updateReadout() {
  const ch = channels[activeChannel];
  const freqHz = ch.freq * FREQ_UNITS[ch.freqUnit].mult;
  const ampV = ch.amp * AMP_UNITS[ch.ampUnit].mult;
  const el = document.getElementById('sgReadout');
  el.innerHTML = `
    <span class="sg-readout-item"><b>Waveform:</b> ${ch.waveform}</span>
    <span class="sg-readout-item"><b>Freq:</b> ${formatFreq(freqHz)}</span>
    <span class="sg-readout-item"><b>Amp:</b> ${formatAmp(ampV)} Vpp</span>
    <span class="sg-readout-item"><b>Offset:</b> ${ch.offset.toFixed(2)} V</span>
    ${ch.modType !== 'Off' ? `<span class="sg-readout-item"><b>Mod:</b> ${ch.modType}</span>` : ''}
    ${ch.sweepEnabled ? `<span class="sg-readout-item"><b>Sweep:</b> ${ch.sweepStart}-${ch.sweepStop} Hz</span>` : ''}
  `;
}

function formatFreq(hz) {
  if (hz >= 1e6) return (hz / 1e6).toFixed(3) + ' MHz';
  if (hz >= 1e3) return (hz / 1e3).toFixed(3) + ' kHz';
  if (hz >= 1) return hz.toFixed(3) + ' Hz';
  return (hz * 1000).toFixed(3) + ' mHz';
}

function formatAmp(v) {
  if (v >= 1) return v.toFixed(3);
  return (v * 1000).toFixed(1) + ' m';
}

/* ===== Signal Generation ===== */

async function generateAll() {
  for (let ch = 0; ch < 2; ch++) {
    if (!isRunning[ch]) continue;
    await generateChannel(ch);
  }
  if (onOutputChange) onOutputChange(outputSignals);
}

async function generateChannel(chIdx) {
  const ch = channels[chIdx];
  const freqHz = ch.freq * FREQ_UNITS[ch.freqUnit].mult;
  const ampV = ch.amp * AMP_UNITS[ch.ampUnit].mult;

  let signal;

  if (ch.waveform === 'arbitrary' && ch.arbFormula) {
    signal = generateArbitraryFromFormula(ch.arbFormula, numSamples, sampleRate, ampV, ch.offset);
  } else if (ch.waveform === 'arbitrary' && ch.arbWaveform) {
    signal = generateArbitraryFromWaveform(ch.arbWaveform, freqHz, numSamples, sampleRate, ampV, ch.offset);
  } else if (ch.waveform === 'dc') {
    signal = new Float32Array(numSamples).fill(ch.offset + ampV / 2);
  } else {
    const wf = ch.waveform === 'pulse' ? 'square' : ch.waveform;
    const result = await postWorker({
      type: 'generate',
      params: {
        waveform: wf,
        freq: freqHz,
        amp: ampV,
        phase: ch.phase,
        offset: ch.offset,
        duty: ch.duty,
        samples: numSamples,
        sampleRate: sampleRate
      }
    });
    signal = result.signal;
  }

  // Apply modulation
  if (ch.modType !== 'Off' && signal) {
    signal = applyModulation(signal, ch, freqHz, ampV);
  }

  // Apply sweep
  if (ch.sweepEnabled && signal) {
    signal = applySweep(ch, numSamples, sampleRate, ampV);
  }

  // Apply burst
  if (ch.burstEnabled && signal) {
    signal = applyBurst(signal, ch, freqHz);
  }

  outputSignals[chIdx] = signal;
  drawTimeDisplay(chIdx, signal);
}

function generateArbitraryFromFormula(formula, samples, sr, amp, offset) {
  const signal = new Float32Array(samples);
  const safeFormula = formula
    .replace(/sin/g, 'Math.sin')
    .replace(/cos/g, 'Math.cos')
    .replace(/tan/g, 'Math.tan')
    .replace(/abs/g, 'Math.abs')
    .replace(/sqrt/g, 'Math.sqrt')
    .replace(/log/g, 'Math.log')
    .replace(/exp/g, 'Math.exp')
    .replace(/PI/g, 'Math.PI')
    .replace(/Math\.Math\./g, 'Math.');

  try {
    const fn = new Function('t', `return ${safeFormula};`);
    for (let n = 0; n < samples; n++) {
      const t = n / sr;
      signal[n] = fn(t) * amp + offset;
    }
  } catch {
    signal.fill(0);
  }
  return signal;
}

function generateArbitraryFromWaveform(wf, freq, samples, sr, amp, offset) {
  const signal = new Float32Array(samples);
  const len = wf.length;
  for (let n = 0; n < samples; n++) {
    const t = n / sr;
    const phase = (freq * t) % 1;
    const idx = Math.floor(phase * len) % len;
    signal[n] = wf[idx] * amp + offset;
  }
  return signal;
}

function applyModulation(signal, ch, carrierFreq, amp) {
  const out = new Float32Array(signal.length);
  const N = signal.length;

  for (let n = 0; n < N; n++) {
    const t = n / sampleRate;
    const modSignal = Math.sin(2 * Math.PI * ch.modFreq * t);

    switch (ch.modType) {
      case 'AM': {
        const m = ch.modDepth / 100;
        out[n] = signal[n] * (1 + m * modSignal);
        break;
      }
      case 'FM': {
        const phase = 2 * Math.PI * carrierFreq * t + (ch.modDeviation / ch.modFreq) * Math.sin(2 * Math.PI * ch.modFreq * t);
        out[n] = amp * Math.sin(phase) + ch.offset;
        break;
      }
      case 'PM': {
        const phDev = ch.modPhase * Math.PI / 180;
        const phase = 2 * Math.PI * carrierFreq * t + phDev * modSignal;
        out[n] = amp * Math.sin(phase) + ch.offset;
        break;
      }
      case 'PWM': {
        const duty = (ch.duty + ch.modDepth * modSignal) / 100;
        const ph = ((carrierFreq * t) % 1 + 1) % 1;
        out[n] = (ph < duty ? 1 : -1) * amp + ch.offset;
        break;
      }
      default:
        out[n] = signal[n];
    }
  }
  return out;
}

function applySweep(ch, samples, sr, amp) {
  const signal = new Float32Array(samples);
  const f0 = ch.sweepStart;
  const f1 = ch.sweepStop;
  const T = ch.sweepTime;

  for (let n = 0; n < samples; n++) {
    const t = (n / sr) % T;
    let freq;
    if (ch.sweepMode === 'log') {
      freq = f0 * Math.pow(f1 / f0, t / T);
    } else {
      freq = f0 + (f1 - f0) * t / T;
    }
    signal[n] = amp * Math.sin(2 * Math.PI * freq * t) + ch.offset;
  }
  return signal;
}

function applyBurst(signal, ch, freq) {
  const out = new Float32Array(signal.length);
  const samplesPerCycle = sampleRate / freq;
  const burstSamples = Math.floor(samplesPerCycle * ch.burstCycles);

  for (let n = 0; n < signal.length; n++) {
    out[n] = n < burstSamples ? signal[n] : ch.offset;
  }
  return out;
}

/* ===== Display Drawing ===== */

function drawTimeDisplay(chIdx, signal) {
  const canvas = canvasTimeCh[chIdx];
  const ctx = ctxTimeCh[chIdx];
  if (!canvas || !ctx || !signal) return;

  const W = canvas.width;
  const H = canvas.height;
  const color = chIdx === 0 ? '#2ecc71' : '#f1c40f';

  // Background
  ctx.fillStyle = '#050a12';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#0d1a2a';
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 10; i++) {
    const x = W * i / 10;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let i = 1; i < 8; i++) {
    const y = H * i / 8;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // Center lines
  ctx.strokeStyle = '#1a3050';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();

  // Find peak for auto-scale
  let maxVal = 0;
  for (let i = 0; i < signal.length; i++) {
    if (Math.abs(signal[i]) > maxVal) maxVal = Math.abs(signal[i]);
  }
  if (maxVal === 0) maxVal = 1;
  const scale = (H / 2 - 10) / maxVal;

  // Waveform
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const step = Math.max(1, Math.floor(signal.length / W));
  for (let x = 0; x < W; x++) {
    const idx = Math.floor(x / W * signal.length);
    const y = H / 2 - signal[idx] * scale;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Glow effect
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  ctx.stroke();
  ctx.shadowBlur = 0;
}
