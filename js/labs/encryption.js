import { labData, getLabText, onLabDataChange } from '../core/lab-data.js';

export function initEncryptLab() {
  const container = document.getElementById('encryptUI');
  let encType = 'xor';
  let encText = '';
  let encKey = 'Key';
  let caesarShift = 3;
  let dhA = 6, dhB = 15;

  function toBin(n) { return n.toString(2).padStart(8, '0'); }

  function xorEncrypt(text, key) {
    const textBytes = Array.from(new TextEncoder().encode(text));
    const keyBytes = Array.from(new TextEncoder().encode(key));
    const result = textBytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
    return { textBytes, keyBytes, result };
  }

  function caesarEncrypt(text, shift) {
    const chars = [];
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) chars.push({ from: ch, to: String.fromCharCode((code - 65 + shift) % 26 + 65), shifted: true });
      else if (code >= 97 && code <= 122) chars.push({ from: ch, to: String.fromCharCode((code - 97 + shift) % 26 + 97), shifted: true });
      else if (code >= 0x410 && code <= 0x42F) chars.push({ from: ch, to: String.fromCharCode((code - 0x410 + shift) % 32 + 0x410), shifted: true });
      else if (code >= 0x430 && code <= 0x44F) chars.push({ from: ch, to: String.fromCharCode((code - 0x430 + shift) % 32 + 0x430), shifted: true });
      else chars.push({ from: ch, to: ch, shifted: false });
    }
    return chars;
  }

  function simpleHash(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    const hex = (h >>> 0).toString(16).padStart(8, '0');
    return hex + hex.split('').reverse().join('') + ((h >>> 0) ^ 0xDEADBEEF).toString(16).padStart(8, '0') + ((h >>> 0) ^ 0xCAFEBABE).toString(16).padStart(8, '0');
  }

  function modPow(base, exp, mod) {
    let r = 1n, b = BigInt(base) % BigInt(mod), e = BigInt(exp);
    while (e > 0n) { if (e & 1n) r = r * b % BigInt(mod); e >>= 1n; b = b * b % BigInt(mod); }
    return Number(r);
  }

  const ENC_TYPES = {
    xor: { name: 'XOR (побитовый)', desc: 'Простейшее шифрование: каждый бит текста XOR-ится с битом ключа. Тот же ключ расшифровывает обратно. Основа всех современных шифров.' },
    caesar: { name: 'Шифр Цезаря', desc: 'Каждая буква сдвигается на N позиций в алфавите. Юлий Цезарь использовал сдвиг 3. Легко взломать перебором (26 вариантов).' },
    sym: { name: 'AES (симметричный)', desc: 'AES-256: один ключ для шифрования и дешифрования. 14 раундов трансформации: SubBytes → ShiftRows → MixColumns → AddRoundKey. Стандарт для TLS, дисков, VPN.' },
    asym: { name: 'RSA (асимметричный)', desc: 'Два ключа: публичный (шифрует) и приватный (расшифровывает). Основан на сложности факторизации больших чисел. Используется для обмена ключами в TLS.' },
    hash: { name: 'Хеширование (SHA-256)', desc: 'Одностороннее преобразование: из данных любого размера → фиксированный хеш 256 бит. Невозможно восстановить исходные данные. Пароли, цифровые подписи, блокчейн.' },
    des: { name: 'DES (Фейстеля)', desc: 'Data Encryption Standard: 64-бит блок, 56-бит ключ, 16 раундов сети Фейстеля. Каждый раунд: расширение R до 48 бит → XOR с подключом → S-box (6→4 бит) → P-перестановка. Сейчас устарел, используют 3DES (EDE) или AES.' },
    dh: { name: 'Diffie-Hellman', desc: 'Протокол обмена ключами: два абонента создают общий секрет по открытому каналу. Безопасность основана на сложности дискретного логарифмирования. Используется в TLS, SSH, IPsec.' },
    ecdh: { name: 'ECDH (эллиптические)', desc: 'Diffie-Hellman на эллиптических кривых. Та же безопасность при меньших ключах: 256-бит ECDH = 3072-бит RSA. Стандарт в TLS 1.3, Signal, Bitcoin (secp256k1).' },
    hmac: { name: 'HMAC', desc: 'Keyed-Hash Message Authentication Code. Гарантирует и целостность, и подлинность сообщения. Без секретного ключа невозможно подделать MAC. Используется в JWT, API-авторизации, TLS.' },
    signature: { name: 'Цифровая подпись', desc: 'Подпись хеша приватным ключом. Любой с публичным ключом может проверить, но подписать может только владелец приватного. Неотказуемость: автор не может отрицать подпись.' }
  };

  function render() {
    const et = ENC_TYPES[encType];
    let resultHTML = '';

    if (encType === 'xor') {
      const { textBytes, keyBytes, result } = xorEncrypt(encText || 'Hi', encKey || 'K');
      resultHTML = `
        <div class="enc-key-row"><label>Ключ</label><input type="text" id="encKeyInput" value="${encKey}" placeholder="Ключ"></div>
        <div class="enc-step">
          <div class="enc-step__title">Шаг 1: Текст → биты</div>
          <div class="enc-bits">${textBytes.map((b, i) => `<span data-tip="${encText[i] || '?'}">${toBin(b)}</span>`).join(' ')}</div>
        </div>
        <div class="enc-step">
          <div class="enc-step__title">Шаг 2: Ключ → биты (повторяется циклически)</div>
          <div class="enc-bits">${textBytes.map((_, i) => `<span class="bk">${toBin(keyBytes[i % keyBytes.length])}</span>`).join(' ')}</div>
        </div>
        <div class="enc-step">
          <div class="enc-step__title">Шаг 3: Текст XOR Ключ = Шифротекст</div>
          <div class="enc-bits">${textBytes.map((b, i) => {
            const k = keyBytes[i % keyBytes.length];
            const r = b ^ k;
            return toBin(b).split('').map((bit, j) => {
              const kb = toBin(k)[j];
              const rb = toBin(r)[j];
              return `<span class="${rb === '1' ? 'br' : 'b0'}">${rb}</span>`;
            }).join('');
          }).join(' ')}</div>
        </div>
        <div class="enc-step">
          <div class="enc-step__title">Результат (hex)</div>
          <div class="enc-bits" style="font-size:.85rem"><span class="br">${result.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}</span></div>
        </div>
        <div class="card mt-12" style="font-size:.78rem">
          <strong>Расшифровка:</strong> Применяем XOR с тем же ключом ещё раз → получаем исходный текст. <code>A ⊕ K ⊕ K = A</code>
        </div>`;
    } else if (encType === 'caesar') {
      const chars = caesarEncrypt(encText || 'Привет', caesarShift);
      resultHTML = `
        <div class="enc-key-row"><label>Сдвиг</label><input type="range" id="encCaesarShift" min="1" max="25" value="${caesarShift}"><span style="font-weight:700;color:var(--accent);min-width:24px">${caesarShift}</span></div>
        <div class="enc-step">
          <div class="enc-step__title">Каждая буква сдвигается на ${caesarShift}</div>
          <div class="enc-char-grid">
            ${chars.map(c => `<div class="enc-char" style="background:${c.shifted ? 'var(--accent)' : 'var(--bg-surface)'}; color:${c.shifted ? '#fff' : 'var(--text-secondary)'}">
              ${c.to}<div class="enc-char__from">${c.shifted ? c.from + '→' : ''}</div>
            </div>`).join('')}
          </div>
        </div>
        <div class="enc-step">
          <div class="enc-step__title">Результат</div>
          <div style="font-family:monospace;font-size:1rem;font-weight:700;color:var(--l7)">${chars.map(c => c.to).join('')}</div>
        </div>`;
    } else if (encType === 'sym') {
      const hexCipher = Array.from(new TextEncoder().encode(encText || 'Hi')).map((b, i) => ((b ^ 0xA5 ^ (i * 37)) & 0xFF).toString(16).padStart(2, '0').toUpperCase()).join(' ');
      resultHTML = `
        <div class="enc-key-row"><label>Ключ AES-256</label><input type="text" value="2b7e151628aed2a6abf7158809cf4f3c" readonly style="font-size:.65rem;color:var(--accent)"></div>
        <div class="enc-step"><div class="enc-step__title">Открытый текст</div><div style="font-family:monospace">${encText}</div></div>
        <div class="enc-step"><div class="enc-step__title">14 раундов AES-256</div>
          <div style="font-size:.72rem;color:var(--text-secondary);line-height:1.8">
            Round 1: SubBytes → ShiftRows → MixColumns → AddRoundKey<br>
            Round 2: SubBytes → ShiftRows → MixColumns → AddRoundKey<br>
            <span style="color:var(--text-secondary)">... (раунды 3-13 аналогичны) ...</span><br>
            Round 14: SubBytes → ShiftRows → AddRoundKey (без MixColumns)
          </div>
        </div>
        <div class="enc-step"><div class="enc-step__title">Шифротекст (hex)</div><div class="enc-bits"><span class="br">${hexCipher}</span></div></div>
        <div class="card mt-12" style="font-size:.78rem;line-height:1.6">
          <strong>SubBytes:</strong> замена байтов по S-Box (нелинейность)<br>
          <strong>ShiftRows:</strong> циклический сдвиг строк состояния<br>
          <strong>MixColumns:</strong> умножение столбцов в поле Галуа GF(2⁸)<br>
          <strong>AddRoundKey:</strong> XOR с раундовым ключом (из исходного через Key Schedule)
        </div>`;
    } else if (encType === 'asym') {
      const p = 61, q = 53;
      const n = p * q;
      const phi = (p - 1) * (q - 1);
      const e = 17;
      const d = 2753;
      const m = (encText || 'A').charCodeAt(0) % n;
      const c = Number(BigInt(m) ** BigInt(e) % BigInt(n));
      resultHTML = `
        <div class="enc-step"><div class="enc-step__title">Шаг 1: Генерация ключей</div>
          <div style="font-size:.75rem;line-height:1.8">
            p = ${p}, q = ${q} (простые числа)<br>
            n = p × q = <span style="color:var(--accent);font-weight:700">${n}</span><br>
            φ(n) = (p−1)(q−1) = ${phi}<br>
            e = ${e} (публичная экспонента, взаимно проста с φ)<br>
            d = ${d} (приватная, d × e ≡ 1 mod φ)
          </div>
        </div>
        <div class="lab-stats">
          <div class="lab-stat"><div class="lab-stat__value" style="font-size:1rem">(${e}, ${n})</div><div class="lab-stat__label">Публичный ключ</div></div>
          <div class="lab-stat"><div class="lab-stat__value" style="font-size:1rem">(${d}, ${n})</div><div class="lab-stat__label">Приватный ключ 🔒</div></div>
        </div>
        <div class="enc-step mt-12"><div class="enc-step__title">Шаг 2: Шифрование (публичным ключом)</div>
          <div style="font-size:.75rem">m = '${String.fromCharCode(m)}' = ${m}<br>c = m<sup>e</sup> mod n = ${m}<sup>${e}</sup> mod ${n} = <span class="br" style="font-size:.9rem">${c}</span></div>
        </div>
        <div class="enc-step"><div class="enc-step__title">Шаг 3: Дешифрование (приватным ключом)</div>
          <div style="font-size:.75rem">m = c<sup>d</sup> mod n = ${c}<sup>${d}</sup> mod ${n} = <span class="term-ok" style="font-size:.9rem;font-weight:700">${m} = '${String.fromCharCode(m)}'</span></div>
        </div>
        <div class="card mt-12" style="font-size:.78rem;line-height:1.6">
          <strong>Безопасность:</strong> зная публичный ключ (e=${e}, n=${n}), нужно разложить n на множители p и q. Для n=${n} это легко, но для реального RSA-2048 (n из 617 цифр) — невозможно за разумное время.
        </div>`;
    } else if (encType === 'hash') {
      const hashVal = simpleHash(encText || '');
      const hashVal2 = simpleHash((encText || '') + '!');
      resultHTML = `
        <div class="enc-step"><div class="enc-step__title">Входные данные</div><div style="font-family:monospace">"${encText}"</div></div>
        <div class="enc-step"><div class="enc-step__title">Хеш (SHA-256 симуляция)</div><div class="enc-bits"><span class="br" style="font-size:.8rem">${hashVal}</span></div></div>
        <div class="enc-step"><div class="enc-step__title">Эффект лавины: "${encText}!" (добавлен !)</div><div class="enc-bits"><span class="br" style="font-size:.8rem">${hashVal2}</span></div></div>
        <div class="card mt-12" style="font-size:.78rem;line-height:1.6">
          <strong>Лавинный эффект:</strong> изменение 1 бита входа → изменение ~50% битов хеша. Невозможно предсказать хеш, невозможно найти вход по хешу.<br><br>
          <strong>Применение:</strong> хранение паролей (bcrypt), цифровые подписи, проверка целостности файлов (checksum), блокчейн (Bitcoin).
        </div>`;
    } else if (encType === 'des') {
      const input = encText || 'Hi';
      const bits = Array.from(new TextEncoder().encode(input)).slice(0, 8).map(b => toBin(b)).join('');
      const padded = bits.padEnd(64, '0');
      const ip = padded.split('').sort(() => 0.3 - Math.random()).join('').slice(0, 64);
      const L0 = ip.slice(0, 32), R0 = ip.slice(32);
      resultHTML = `
        <div class="enc-step"><div class="enc-step__title">Вход: 64-бит блок</div>
          <div class="enc-bits" style="font-size:.65rem">${padded.match(/.{8}/g).map(g => `<span>${g}</span>`).join(' ')}</div></div>
        <div class="enc-step"><div class="enc-step__title">Начальная перестановка (IP)</div>
          <div class="enc-bits" style="font-size:.65rem">${ip.match(/.{8}/g).map(g => `<span class="bk">${g}</span>`).join(' ')}</div></div>
        <div class="enc-step"><div class="enc-step__title">Раунд 1 из 16 (детально)</div>
          <div style="font-size:.72rem;line-height:1.8">
            L<sub>0</sub> = <span style="color:var(--l4)">${L0.slice(0,16)}...</span><br>
            R<sub>0</sub> = <span style="color:var(--l5)">${R0.slice(0,16)}...</span><br>
            E(R<sub>0</sub>) = расширение 32→48 бит<br>
            E(R<sub>0</sub>) XOR K<sub>1</sub> → 48 бит → 8 групп по 6 бит<br>
            S-box: каждая группа 6 бит → 4 бит<br>
            P-перестановка 32 бит → f(R<sub>0</sub>, K<sub>1</sub>)<br>
            <strong>L<sub>1</sub> = R<sub>0</sub></strong>, <strong>R<sub>1</sub> = L<sub>0</sub> ⊕ f(R<sub>0</sub>, K<sub>1</sub>)</strong>
          </div></div>
        <div class="enc-step"><div class="enc-step__title">S-Box (пример S1): 6 бит → 4 бит</div>
          <div style="font-size:.62rem;overflow-x:auto"><table style="border-collapse:collapse;width:100%">
            <tr>${['','0000','0001','0010','0011'].map(c => `<td style="padding:2px 4px;border:1px solid var(--border);color:var(--text-secondary);font-weight:700">${c}</td>`).join('')}</tr>
            <tr>${['00','14','4','13','1'].map((c,i) => `<td style="padding:2px 4px;border:1px solid var(--border);${i?'color:var(--accent)':'font-weight:700'}">${c}</td>`).join('')}</tr>
            <tr>${['01','0','15','7','4'].map((c,i) => `<td style="padding:2px 4px;border:1px solid var(--border);${i?'color:var(--accent)':'font-weight:700'}">${c}</td>`).join('')}</tr>
          </table></div></div>
        <div class="enc-step"><div class="enc-step__title">Раунды 2-16</div>
          <div style="font-size:.72rem;color:var(--text-secondary)">Аналогичны раунду 1, каждый с подключом K<sub>i</sub> из Key Schedule</div></div>
        <div class="enc-step"><div class="enc-step__title">Финальная перестановка (IP<sup>-1</sup>) → шифротекст</div>
          <div class="enc-bits"><span class="br" style="font-size:.65rem">${Array.from({length:8}, () => Math.floor(Math.random()*256).toString(16).padStart(2,'0').toUpperCase()).join(' ')}</span></div></div>
        <div class="card mt-12" style="font-size:.78rem;line-height:1.6"><strong>3DES (EDE):</strong> Encrypt(K1) → Decrypt(K2) → Encrypt(K1). Удваивает эффективную длину ключа до 112 бит. Используется в банковских системах и EMV-чипах.</div>`;
    } else if (encType === 'dh') {
      const p = 23, g = 5;
      const A = modPow(g, dhA, p), B = modPow(g, dhB, p);
      const sA = modPow(B, dhA, p), sB = modPow(A, dhB, p);
      resultHTML = `
        <div class="enc-step"><div class="enc-step__title">Публичные параметры</div>
          <div style="font-size:.8rem">p = <strong style="color:var(--accent)">${p}</strong> (простое), g = <strong style="color:var(--accent)">${g}</strong> (генератор)</div></div>
        <div class="enc-key-row"><label>Секрет Алисы (a)</label><input type="range" id="dhSliderA" min="2" max="20" value="${dhA}"><span style="font-weight:700;color:var(--l4);min-width:24px">${dhA}</span></div>
        <div class="enc-key-row"><label>Секрет Боба (b)</label><input type="range" id="dhSliderB" min="2" max="20" value="${dhB}"><span style="font-weight:700;color:var(--l5);min-width:24px">${dhB}</span></div>
        <div class="lab-stats">
          <div class="lab-stat"><div class="lab-stat__value">${A}</div><div class="lab-stat__label">A = g<sup>a</sup> mod p = ${g}<sup>${dhA}</sup> mod ${p}</div></div>
          <div class="lab-stat"><div class="lab-stat__value">${B}</div><div class="lab-stat__label">B = g<sup>b</sup> mod p = ${g}<sup>${dhB}</sup> mod ${p}</div></div>
        </div>
        <div class="enc-step mt-12"><div class="enc-step__title">Обмен по открытому каналу</div>
          <div style="font-size:.75rem">Алиса → Бобу: <strong>A = ${A}</strong><br>Боб → Алисе: <strong>B = ${B}</strong></div></div>
        <div class="enc-step"><div class="enc-step__title">Вычисление общего секрета</div>
          <div style="font-size:.75rem">
            Алиса: B<sup>a</sup> mod p = ${B}<sup>${dhA}</sup> mod ${p} = <span style="color:var(--l4);font-weight:700;font-size:.9rem">${sA}</span><br>
            Боб: A<sup>b</sup> mod p = ${A}<sup>${dhB}</sup> mod ${p} = <span style="color:var(--l4);font-weight:700;font-size:.9rem">${sB}</span>
          </div></div>
        <div class="enc-step" style="border-color:${sA === sB ? 'var(--l4)' : 'var(--l7)'}"><div class="enc-step__title">Результат</div>
          <div style="font-size:.85rem;font-weight:700;color:var(--l4)">Общий секрет = ${sA}</div></div>
        <div class="card mt-12" style="font-size:.78rem;line-height:1.6"><strong>Подслушивающий видит:</strong> p=${p}, g=${g}, A=${A}, B=${B}. Чтобы найти секрет, нужно решить ${g}<sup>x</sup> ≡ ${A} (mod ${p}) — задача дискретного логарифмирования. Для малых чисел тривиально, для 2048-бит — невозможно.</div>`;
    } else if (encType === 'ecdh') {
      resultHTML = `
        <div class="enc-step"><div class="enc-step__title">Эллиптическая кривая</div>
          <div style="font-size:.8rem;margin-bottom:8px">y<sup>2</sup> = x<sup>3</sup> + ax + b (над конечным полем F<sub>p</sub>)</div>
          <svg viewBox="-5 -5 10 10" style="width:100%;max-width:240px;height:160px;display:block;margin:0 auto">
            <line x1="-5" y1="0" x2="5" y2="0" stroke="var(--border)" stroke-width=".04"/>
            <line x1="0" y1="-5" x2="0" y2="5" stroke="var(--border)" stroke-width=".04"/>
            <path d="M-1.3,0 C-1.3,2.2 -0.5,3.8 1,4.2 C2.5,4.6 4,3 4,0 C4,-3 2.5,-4.6 1,-4.2 C-0.5,-3.8 -1.3,-2.2 -1.3,0Z" fill="none" stroke="var(--accent)" stroke-width=".08"/>
            <circle cx="0.5" cy="1.9" r=".18" fill="var(--l4)"/><text x="0.8" y="1.9" fill="var(--l4)" font-size=".6">P</text>
            <circle cx="2" cy="2.4" r=".18" fill="var(--l5)"/><text x="2.3" y="2.4" fill="var(--l5)" font-size=".6">Q</text>
            <line x1="0.5" y1="1.9" x2="2" y2="2.4" stroke="var(--text-secondary)" stroke-width=".04" stroke-dasharray=".15"/>
            <circle cx="1.6" cy="-1.2" r=".18" fill="var(--l7)"/><text x="1.9" y="-1.2" fill="var(--l7)" font-size=".6">R=P+Q</text>
          </svg></div>
        <div class="enc-step"><div class="enc-step__title">Сложение точек P + Q = R</div>
          <div style="font-size:.72rem;line-height:1.8">1. Провести прямую через P и Q<br>2. Найти третью точку пересечения с кривой<br>3. Отразить по оси X → R</div></div>
        <div class="enc-step"><div class="enc-step__title">Скалярное умножение</div>
          <div style="font-size:.72rem;line-height:1.8">nP = P + P + ... + P (n раз)<br>Зная n и P → легко вычислить nP<br>Зная P и nP → <strong>невозможно найти n</strong> (ECDLP)</div></div>
        <div class="enc-step"><div class="enc-step__title">ECDH: обмен ключами</div>
          <div style="font-size:.72rem;line-height:1.8">Кривая и базовая точка G — публичны<br>Алиса: секрет a → A = aG<br>Боб: секрет b → B = bG<br>Общий секрет: a(bG) = b(aG) = abG</div></div>
        <div class="enc-step"><div class="enc-step__title">Сравнение размеров ключей</div>
          <table style="width:100%;font-size:.72rem;border-collapse:collapse">
            <tr style="border-bottom:1px solid var(--border)"><th style="padding:4px;text-align:left">Уровень</th><th style="padding:4px">RSA</th><th style="padding:4px">ECC</th><th style="padding:4px">Разница</th></tr>
            <tr><td style="padding:4px">128 бит</td><td style="padding:4px;text-align:center">3072</td><td style="padding:4px;text-align:center;color:var(--l4);font-weight:700">256</td><td style="padding:4px;text-align:center">12x</td></tr>
            <tr><td style="padding:4px">192 бит</td><td style="padding:4px;text-align:center">7680</td><td style="padding:4px;text-align:center;color:var(--l4);font-weight:700">384</td><td style="padding:4px;text-align:center">20x</td></tr>
            <tr><td style="padding:4px">256 бит</td><td style="padding:4px;text-align:center">15360</td><td style="padding:4px;text-align:center;color:var(--l4);font-weight:700">512</td><td style="padding:4px;text-align:center">30x</td></tr>
          </table></div>`;
    } else if (encType === 'hmac') {
      const key = encKey || 'Key';
      const msg = encText || 'Hello';
      const innerHash = simpleHash(key + '\x36' + msg);
      const outerHash = simpleHash(key + '\x5c' + innerHash);
      const plainHash = simpleHash(msg);
      resultHTML = `
        <div class="enc-key-row"><label>Ключ</label><input type="text" id="encKeyInput" value="${encKey}" placeholder="Секретный ключ"></div>
        <div class="enc-step"><div class="enc-step__title">Формула HMAC</div>
          <div style="font-family:monospace;font-size:.72rem;color:var(--accent)">HMAC(K, m) = H((K ⊕ opad) || H((K ⊕ ipad) || m))</div>
          <div style="font-size:.68rem;color:var(--text-secondary);margin-top:4px">ipad = 0x36..36, opad = 0x5C..5C (повторение до длины блока)</div></div>
        <div class="enc-step"><div class="enc-step__title">Шаг 1: Дополнение ключа</div>
          <div style="font-size:.72rem">K → дополнить нулями до размера блока (64 байт для SHA-256)</div></div>
        <div class="enc-step"><div class="enc-step__title">Шаг 2: Внутренний хеш</div>
          <div style="font-size:.72rem">H((K ⊕ ipad) || "${msg}")</div>
          <div class="enc-bits"><span class="bk" style="font-size:.7rem">${innerHash}</span></div></div>
        <div class="enc-step"><div class="enc-step__title">Шаг 3: Внешний хеш (HMAC)</div>
          <div style="font-size:.72rem">H((K ⊕ opad) || inner_hash)</div>
          <div class="enc-bits"><span class="br" style="font-size:.7rem">${outerHash}</span></div></div>
        <div class="enc-step"><div class="enc-step__title">Обычный хеш (без ключа)</div>
          <div class="enc-bits"><span style="font-size:.7rem;color:var(--text-secondary)">${plainHash}</span></div></div>
        <div class="card mt-12" style="font-size:.78rem;line-height:1.6"><strong>Разница:</strong> без ключа любой может вычислить хеш и подделать сообщение. HMAC гарантирует, что MAC создал владелец ключа.<br><br><strong>Применение:</strong> JWT-токены (HS256), API-подписи (AWS Signature V4), проверка целостности в TLS, webhook-верификация.</div>`;
    } else if (encType === 'signature') {
      const p = 61, q = 53, n = p * q, e = 17, d = 2753;
      const msg = encText || 'Hello';
      const hashVal = simpleHash(msg);
      const hashNum = parseInt(hashVal.slice(0, 4), 16) % n;
      const sig = modPow(hashNum, d, n);
      const verified = modPow(sig, e, n);
      resultHTML = `
        <div class="enc-step"><div class="enc-step__title">Шаг 1: Хешируем сообщение</div>
          <div style="font-size:.72rem">"${msg}" → SHA-256:</div>
          <div class="enc-bits"><span class="bk" style="font-size:.7rem">${hashVal}</span></div>
          <div style="font-size:.72rem;margin-top:4px">hash mod n = ${hashNum}</div></div>
        <div class="enc-step"><div class="enc-step__title">Шаг 2: Подпись приватным ключом</div>
          <div style="font-size:.72rem">sig = hash<sup>d</sup> mod n = ${hashNum}<sup>${d}</sup> mod ${n} = <span class="br" style="font-size:.9rem;font-weight:700">${sig}</span></div>
          <div style="font-size:.68rem;color:var(--text-secondary);margin-top:4px">Приватный ключ: d=${d} (только у отправителя)</div></div>
        <div class="enc-step"><div class="enc-step__title">Шаг 3: Проверка публичным ключом</div>
          <div style="font-size:.72rem">hash' = sig<sup>e</sup> mod n = ${sig}<sup>${e}</sup> mod ${n} = <span class="term-ok" style="font-size:.9rem;font-weight:700">${verified}</span></div>
          <div style="font-size:.72rem;margin-top:4px">${verified === hashNum ? '<span style="color:var(--l4);font-weight:700">hash\' = hash  — подпись верна!</span>' : '<span style="color:var(--l7);font-weight:700">hash\' != hash — подпись неверна!</span>'}</div></div>
        <div class="lab-stats">
          <div class="lab-stat"><div class="lab-stat__value" style="font-size:.9rem">(${d}, ${n})</div><div class="lab-stat__label">Подписывает (приватный)</div></div>
          <div class="lab-stat"><div class="lab-stat__value" style="font-size:.9rem">(${e}, ${n})</div><div class="lab-stat__label">Проверяет (публичный)</div></div>
        </div>
        <div class="card mt-12" style="font-size:.78rem;line-height:1.6"><strong>Неотказуемость:</strong> только владелец приватного ключа мог создать подпись, но проверить может любой с публичным ключом. Автор не может отрицать авторство.<br><br><strong>Применение:</strong> TLS-сертификаты, подпись кода (Apple/Google), электронный документооборот, Git-коммиты (GPG).</div>`;
    }

    container.innerHTML = `
      <div class="sig-tabs">
        ${Object.entries(ENC_TYPES).map(([k, v]) => `<button class="sig-tab${k === encType ? ' active' : ''}" data-enc="${k}">${v.name.split('(')[0].trim()}</button>`).join('')}
      </div>
      <div class="sig-section-title">Источник: ${labData.type === 'file' ? '📎 ' + labData.fileName : labData.type === 'random' ? '🎲 Случайные данные' : '✏️ Текст'} (${labData.size} Б)</div>
      <input type="text" class="enc-input" id="encTextInput" value="${encText || getLabText()}" placeholder="Или введите текст...">
      ${resultHTML}
      <div class="card mt-12" style="font-size:.82rem;line-height:1.7"><strong>${et.name}</strong><br>${et.desc}</div>
    `;

    container.querySelector('#encTextInput').addEventListener('input', (e) => { encText = e.target.value; render(); });
    container.querySelector('#encKeyInput')?.addEventListener('input', (e) => { encKey = e.target.value; render(); });
    container.querySelector('#encCaesarShift')?.addEventListener('input', (e) => { caesarShift = parseInt(e.target.value); render(); });
    container.querySelector('#dhSliderA')?.addEventListener('input', (e) => { dhA = parseInt(e.target.value); render(); });
    container.querySelector('#dhSliderB')?.addEventListener('input', (e) => { dhB = parseInt(e.target.value); render(); });
    container.querySelectorAll('[data-enc]').forEach(t => t.addEventListener('click', () => { encType = t.dataset.enc; render(); }));
  }

  const obs = new MutationObserver(() => { if (document.getElementById('lab-encryption')?.classList.contains('active') && !container.children.length) render(); });
  obs.observe(document.getElementById('lab-encryption'), { attributes: true, attributeFilter: ['class'] });
  setTimeout(() => { if (document.getElementById('lab-encryption')?.classList.contains('active')) render(); }, 100);
  onLabDataChange(() => { encText = ''; if (document.getElementById('lab-encryption')?.classList.contains('active')) render(); });
}
