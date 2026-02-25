// Units reference data for the interactive units & measurements section
export const DB_SCALE_POINTS = [
  { dbm: 47, label: 'Сотовая вышка TX', detail: '50 Вт', color: '#e74c3c' },
  { dbm: 30, label: 'Wi-Fi роутер TX (1 Вт)', detail: '1 Вт', color: '#e67e22' },
  { dbm: 20, label: 'Wi-Fi роутер (100 мВт)', detail: '100 мВт', color: '#f1c40f' },
  { dbm: -50, label: 'Отличный Wi-Fi сигнал', detail: '0.01 мкВт', color: '#2ecc71' },
  { dbm: -70, label: 'Хороший Wi-Fi', detail: '100 пВт', color: '#1abc9c' },
  { dbm: -80, label: 'Слабый Wi-Fi', detail: '10 нВт', color: '#3498db' },
  { dbm: -90, label: 'Предел надёжной связи Wi-Fi', detail: '1 нВт', color: '#9b59b6' },
  { dbm: -100, label: 'Тепловой шум (kTB + NF)', detail: '0.1 пВт', color: '#7f8c8d' },
];

export const MODULATIONS_FOR_BAUD = [
  { name: 'BPSK', bitsPerSymbol: 1, desc: 'Binary PSK — 2 состояния (0/1). Самая помехоустойчивая.' },
  { name: 'QPSK', bitsPerSymbol: 2, desc: 'Quadrature PSK — 4 состояния, 2 бит/символ.' },
  { name: 'QAM-16', bitsPerSymbol: 4, desc: '16 состояний — 4 бит/символ. Нужен SNR > 16 дБ.' },
  { name: 'QAM-64', bitsPerSymbol: 6, desc: '64 состояния — 6 бит/символ. Wi-Fi 4.' },
  { name: 'QAM-256', bitsPerSymbol: 8, desc: '256 состояний — 8 бит/символ. Wi-Fi 5.' },
  { name: 'QAM-1024', bitsPerSymbol: 10, desc: '1024 состояния — 10 бит/символ. Wi-Fi 6.' },
  { name: 'QAM-4096', bitsPerSymbol: 12, desc: '4096 состояний — 12 бит/символ. Wi-Fi 7.' },
];
