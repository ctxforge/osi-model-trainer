import { labData, getLabText, onLabDataChange } from '../core/lab-data.js';

export function initEncryptLab() {
  const container = document.getElementById('encryptUI');
  let encType = 'xor';
  let encText = '';
  let encKey = 'Key';
  let caesarShift = 3;

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

  const ENC_TYPES = {
    xor: { name: 'XOR (побитовый)', desc: 'Простейшее шифрование: каждый бит текста XOR-ится с битом ключа. Тот же ключ расшифровывает обратно. Основа всех современных шифров.' },
    caesar: { name: 'Шифр Цезаря', desc: 'Каждая буква сдвигается на N позиций в алфавите. Юлий Цезарь использовал сдвиг 3. Легко взломать перебором (26 вариантов).' },
    sym: { name: 'AES (симметричный)', desc: 'AES-256: один ключ для шифрования и дешифрования. 14 раундов трансформации: SubBytes → ShiftRows → MixColumns → AddRoundKey. Стандарт для TLS, дисков, VPN.' },
    asym: { name: 'RSA (асимметричный)', desc: 'Два ключа: публичный (шифрует) и приватный (расшифровывает). Основан на сложности факторизации больших чисел. Используется для обмена ключами в TLS.' },
    hash: { name: 'Хеширование (SHA-256)', desc: 'Одностороннее преобразование: из данных любого размера → фиксированный хеш 256 бит. Невозможно восстановить исходные данные. Пароли, цифровые подписи, блокчейн.' }
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
          <div class="enc-bits">${textBytes.map((b, i) => `<span title="${encText[i] || '?'}">${toBin(b)}</span>`).join(' ')}</div>
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
    container.querySelectorAll('[data-enc]').forEach(t => t.addEventListener('click', () => { encType = t.dataset.enc; render(); }));
  }

  const obs = new MutationObserver(() => { if (document.getElementById('lab-encryption')?.classList.contains('active') && !container.children.length) render(); });
  obs.observe(document.getElementById('lab-encryption'), { attributes: true, attributeFilter: ['class'] });
  setTimeout(() => { if (document.getElementById('lab-encryption')?.classList.contains('active')) render(); }, 100);
  onLabDataChange(() => { encText = ''; if (document.getElementById('lab-encryption')?.classList.contains('active')) render(); });
}
