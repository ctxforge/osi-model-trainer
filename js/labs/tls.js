import { sleep } from '../core/utils.js';
import { addXP } from '../core/gamification.js';

export async function runTls(labState) {
  const isTLS13 = labState.tls ? labState.tls.tlsVersion === 1 : true;
  const speed = labState.tls ? labState.tls.speed : 500;
  const result = document.getElementById('labResult-tls');

  const sessionId = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  const randomC = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  const randomS = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');

  const steps13 = [
    { icon: '📤', bg: '#3498db', title: 'Client Hello', dir: '→',
      detail: 'Клиент отправляет: поддерживаемые версии TLS, cipher suites, расширения (SNI, ALPN), свой случайный ключ и key_share (для ECDHE).',
      code: `TLS 1.3 Client Hello\nRandom: ${randomC}\nCipher Suites:\n  TLS_AES_256_GCM_SHA384\n  TLS_CHACHA20_POLY1305_SHA256\nKey Share: x25519\nSNI: example.com` },
    { icon: '📥', bg: '#2ecc71', title: 'Server Hello + EncryptedExtensions + Certificate + Finished', dir: '←',
      detail: 'TLS 1.3: сервер сразу отвечает всем — выбранный cipher, свой key_share, сертификат и Finished. Всё кроме Server Hello уже зашифровано! Рукопожатие за 1-RTT.',
      code: `TLS 1.3 Server Hello\nRandom: ${randomS}\nCipher: TLS_AES_256_GCM_SHA384\nKey Share: x25519\n--- Encrypted ---\nCertificate: CN=example.com\nCertificate Verify: ECDSA-SHA256\nFinished: HMAC verified` },
    { icon: '🔍', bg: '#e67e22', title: 'Проверка сертификата', dir: '⚙',
      detail: 'Клиент проверяет цепочку: сертификат сервера → промежуточный CA → корневой CA (встроен в ОС/браузер). Проверяется: срок действия, домен (SAN), подпись, отзыв (OCSP).',
      cert: true },
    { icon: '🔑', bg: '#9b59b6', title: 'Key Derivation (HKDF)', dir: '⚙',
      detail: 'Из ECDHE shared secret генерируются ключи через HKDF-Expand: handshake keys → traffic keys → IV. Разные ключи для клиента и сервера.',
      code: `ECDHE Shared Secret → HKDF-Extract\n→ Handshake Secret\n  → client_handshake_key (AES-256)\n  → server_handshake_key (AES-256)\n→ Master Secret\n  → client_traffic_key\n  → server_traffic_key` },
    { icon: '📤', bg: '#1abc9c', title: 'Client Finished', dir: '→',
      detail: 'Клиент отправляет Finished (HMAC от всех сообщений рукопожатия). Уже зашифровано handshake key.',
      code: 'Finished: verify_data = HMAC(handshake_secret, transcript_hash)' },
    { icon: '🔒', bg: '#2ecc71', title: 'Защищённый канал установлен', dir: '✓',
      detail: 'Все последующие данные шифруются AES-256-GCM с уникальными traffic keys. Каждый пакет имеет свой nonce (IV + sequence number). Forward Secrecy обеспечен ECDHE — даже при утечке приватного ключа прошлый трафик не расшифровать.',
      code: `Application Data ← AES-256-GCM\nKey:   client_traffic_key\nIV:    client_traffic_iv\nNonce: IV ⊕ seq_number\nAAD:   TLS record header` }
  ];

  const steps12 = [
    { icon: '📤', bg: '#3498db', title: 'Client Hello', dir: '→',
      detail: 'Клиент отправляет поддерживаемые cipher suites, TLS-версию, случайное число.',
      code: `TLS 1.2 Client Hello\nRandom: ${randomC}\nCipher Suites:\n  TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\n  TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256\nSNI: example.com` },
    { icon: '📥', bg: '#2ecc71', title: 'Server Hello', dir: '←',
      detail: 'Сервер выбирает cipher suite и отправляет свой случайный номер.',
      code: `TLS 1.2 Server Hello\nRandom: ${randomS}\nCipher: TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384\nSession ID: ${sessionId.slice(0, 16)}...` },
    { icon: '📜', bg: '#e67e22', title: 'Certificate + Server Key Exchange + Server Hello Done', dir: '←',
      detail: 'Сервер отправляет свой X.509 сертификат, параметры ECDHE (публичный ключ на кривой), и завершает свою часть Hello.',
      cert: true },
    { icon: '🔑', bg: '#9b59b6', title: 'Client Key Exchange + Change Cipher Spec + Finished', dir: '→',
      detail: 'Клиент генерирует свой ECDHE-ключ, вычисляет Pre-Master Secret, генерирует Master Secret и сессионные ключи. Переключается на шифрование.',
      code: `Client Key Exchange: ECDHE public key\nPre-Master Secret: ECDH(client_priv, server_pub)\nMaster Secret: PRF(pre_master, random_C + random_S)\n→ client_write_key + server_write_key + IVs` },
    { icon: '✅', bg: '#1abc9c', title: 'Change Cipher Spec + Finished', dir: '←',
      detail: 'Сервер переключается на шифрование и подтверждает Finished. 2-RTT рукопожатие завершено (TLS 1.3 быстрее — 1-RTT).',
      code: 'Server Finished: verify_data OK' },
    { icon: '🔒', bg: '#2ecc71', title: 'Защищённый канал установлен', dir: '✓',
      detail: 'Данные шифруются AES-256-GCM. TLS 1.2 требует 2 RTT (дольше чем TLS 1.3 с 1 RTT).',
      code: 'Application Data ← AES-256-GCM(session_key, nonce, plaintext)' }
  ];

  const steps = isTLS13 ? steps13 : steps12;

  result.innerHTML = `
    <div class="lab-result__title">${isTLS13 ? 'TLS 1.3' : 'TLS 1.2'} Handshake (${isTLS13 ? '1-RTT' : '2-RTT'})</div>
    <div class="lab-stats mb-12">
      <div class="lab-stat"><div class="lab-stat__value">${isTLS13 ? '1' : '2'} RTT</div><div class="lab-stat__label">Рукопожатие</div></div>
      <div class="lab-stat"><div class="lab-stat__value">${isTLS13 ? 'AES-256-GCM' : 'AES-256-GCM'}</div><div class="lab-stat__label">Шифр</div></div>
      <div class="lab-stat"><div class="lab-stat__value">${isTLS13 ? 'x25519' : 'ECDHE'}</div><div class="lab-stat__label">Обмен ключами</div></div>
      <div class="lab-stat"><div class="lab-stat__value">${isTLS13 ? 'ECDSA' : 'RSA'}</div><div class="lab-stat__label">Подпись</div></div>
    </div>
    ${steps.map((s, i) => `
      <div class="tls-step" id="tlsStep-${i}">
        <div class="tls-step__icon" style="background:${s.bg}">${s.icon}</div>
        <div class="tls-step__body">
          <div class="tls-step__title">${s.dir === '→' ? '🖥→🌐 ' : s.dir === '←' ? '🌐→🖥 ' : ''}${s.title}</div>
          <div class="tls-step__detail">${s.detail}</div>
          ${s.code ? `<div class="tls-step__code">${s.code}</div>` : ''}
          ${s.cert ? `
            <div class="tls-cert">
              <div class="tls-cert__title"><span class="tls-lock">🔒</span> X.509 Сертификат</div>
              <table class="pdu-fields" style="margin:0">
                <tr><td>Subject</td><td>CN=example.com</td></tr>
                <tr><td>Issuer</td><td>CN=Let's Encrypt Authority X3</td></tr>
                <tr><td>Validity</td><td>2025-01-15 — 2025-04-15</td></tr>
                <tr><td>Public Key</td><td>ECDSA P-256 (64 bytes)</td></tr>
                <tr><td>SAN</td><td>example.com, www.example.com</td></tr>
                <tr><td>Signature</td><td>SHA-256 with ECDSA</td></tr>
                <tr><td>OCSP</td><td>http://ocsp.letsencrypt.org</td></tr>
              </table>
              <div style="margin-top:6px;font-size:.68rem;color:var(--text-secondary)">Цепочка: example.com → Let's Encrypt X3 → ISRG Root X1 (корневой, встроен в ОС)</div>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  `;

  for (let i = 0; i < steps.length; i++) {
    await sleep(speed);
    const el = document.getElementById('tlsStep-' + i);
    if (el) el.classList.add('visible');
  }
  addXP(5);
}
