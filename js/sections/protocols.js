/* ==================== PROTOCOL REFERENCE ==================== */
import { PROTOCOLS, PROTOCOL_CATEGORIES } from '../data/protocols-data.js';
import { THEORY_TOPICS } from '../data/theory-data.js';
import { navigateTo } from '../core/router.js';
import { addXP, unlockAchievement } from '../core/gamification.js';

let currentFilter = 'all';
let searchQuery = '';

function renderFilters() {
  const container = document.getElementById('protoFilters');
  if (!container) return;
  container.innerHTML = PROTOCOL_CATEGORIES.map(c =>
    `<button class="proto-filter-btn${c.id === currentFilter ? ' active' : ''}" data-filter="${c.id}">${c.label}</button>`
  ).join('');
}

function getFilteredProtocols() {
  let list = PROTOCOLS;
  if (currentFilter !== 'all') {
    list = list.filter(p => p.osi === currentFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.fullName.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q) ||
      (p.ports && p.ports.some(port => String(port).includes(q)))
    );
  }
  return list;
}

function renderGrid() {
  const grid = document.getElementById('protoGrid');
  const count = document.getElementById('protoCount');
  if (!grid) return;

  const filtered = getFilteredProtocols();
  count.textContent = `Найдено: ${filtered.length} из ${PROTOCOLS.length}`;

  grid.innerHTML = filtered.map(p => `
    <div class="proto-card" data-proto="${p.id}">
      <div class="proto-card__icon">${p.icon}</div>
      <div class="proto-card__info">
        <div class="proto-card__name">${p.name}</div>
        <div class="proto-card__full-name">${p.fullName}</div>
      </div>
      <div class="proto-card__meta">
        <span class="proto-card__layer proto-layer--${p.osi}">${p.osi}</span>
        ${p.ports && p.ports.length ? `<span class="proto-card__ports">${p.ports.join(', ')}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function renderHeaderDiagram(protocol) {
  if (!protocol.header || !protocol.header.length) return '';

  const totalBits = protocol.header.reduce((sum, f) => {
    const b = typeof f.bits === 'number' ? f.bits : 32;
    return sum + b;
  }, 0);

  return `
    <div class="proto-header-diagram">
      <div class="proto-header-diagram__title">Формат заголовка</div>
      <div class="proto-header-fields">
        ${protocol.header.map(f => {
          const bits = typeof f.bits === 'number' ? f.bits : 32;
          const pct = Math.max((bits / totalBits) * 100, 8);
          const bitsLabel = typeof f.bits === 'number' ? `${f.bits} бит` : 'переменная';
          return `<div class="proto-field" style="flex:0 0 ${pct}%;max-width:${Math.max(pct, 15)}%">
            <div class="proto-field__name">${f.name}</div>
            <div class="proto-field__bits">${bitsLabel}</div>
            <div class="proto-field__tooltip">${f.desc}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

/* ── Interactive Packet Builder ── */

function toHex(val, bytes) {
  const num = Number(val) || 0;
  return num.toString(16).toUpperCase().padStart(bytes * 2, '0');
}

function macToHex(mac) {
  return mac.replace(/[:\-]/g, '').toUpperCase().padEnd(12, '0').slice(0, 12);
}

function ipToHex(ip) {
  const parts = ip.split('.').map(p => (parseInt(p, 10) || 0) & 0xFF);
  while (parts.length < 4) parts.push(0);
  return parts.map(p => toHex(p, 1)).join('');
}

function textToHex(str) {
  return Array.from(str).map(c => {
    const code = c.charCodeAt(0);
    return code < 128 ? toHex(code, 1) : toHex(code, 2);
  }).join('');
}

function formatHexDump(hex) {
  const bytes = hex.match(/.{1,2}/g) || [];
  const lines = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const offset = toHex(i, 2);
    const hexPart = chunk.join(' ');
    const ascii = chunk.map(b => {
      const code = parseInt(b, 16);
      return (code >= 32 && code < 127) ? String.fromCharCode(code) : '.';
    }).join('');
    lines.push(`${offset}  ${hexPart.padEnd(47)}  ${ascii}`);
  }
  return lines.join('\n');
}

function buildPacketHex(proto, values) {
  switch (proto.id) {
    case 'tcp': return buildTcpHex(values);
    case 'udp': return buildUdpHex(values);
    case 'ipv4': return buildIpv4Hex(values);
    case 'dns': return buildDnsHex(values);
    case 'arp': return buildArpHex(values);
    case 'ethernet': return buildEthernetHex(values);
    case 'http': return buildHttpText(values);
    default: return null;
  }
}

function buildTcpHex(v) {
  let hex = '';
  hex += toHex(v['Source Port'], 2);
  hex += toHex(v['Destination Port'], 2);
  hex += toHex(v['Sequence Number'], 4);
  hex += toHex(v['Acknowledgment'], 4);
  // Data offset (5 = 20 bytes, no options) + reserved
  const flags = v['Flags'] || [];
  const flagMap = { CWR: 128, ECE: 64, URG: 32, ACK: 16, PSH: 8, RST: 4, SYN: 2, FIN: 1 };
  const flagByte = flags.reduce((acc, f) => acc | (flagMap[f] || 0), 0);
  hex += toHex((5 << 4), 1); // data offset + reserved
  hex += toHex(flagByte, 1);
  hex += toHex(v['Window Size'], 2);
  hex += '0000'; // checksum (placeholder)
  hex += '0000'; // urgent pointer
  return hex;
}

function buildUdpHex(v) {
  const data = v['Data (текст)'] || '';
  const dataHex = textToHex(data);
  const length = 8 + dataHex.length / 2;
  let hex = '';
  hex += toHex(v['Source Port'], 2);
  hex += toHex(v['Destination Port'], 2);
  hex += toHex(length, 2);
  hex += '0000'; // checksum
  hex += dataHex;
  return hex;
}

function buildIpv4Hex(v) {
  const proto = parseInt(v['Protocol']) || 6;
  const ttl = Number(v['TTL']) || 64;
  const dscp = Number(v['DSCP']) || 0;
  const df = v['DF flag']?.startsWith('1') ? 0x4000 : 0;
  let hex = '';
  hex += '45'; // version 4, IHL 5
  hex += toHex((dscp << 2), 1); // DSCP + ECN
  hex += toHex(20, 2); // total length (header only)
  hex += '0000'; // identification
  hex += toHex(df, 2); // flags + fragment offset
  hex += toHex(ttl, 1);
  hex += toHex(proto, 1);
  hex += '0000'; // header checksum
  hex += ipToHex(v['Source IP'] || '0.0.0.0');
  hex += ipToHex(v['Destination IP'] || '0.0.0.0');
  return hex;
}

function buildDnsHex(v) {
  const txId = Number(v['Transaction ID']) || 0;
  const qr = v['QR']?.startsWith('1') ? 0x8000 : 0;
  const rd = v['RD']?.startsWith('1') ? 0x0100 : 0;
  const flags = qr | rd;
  let hex = '';
  hex += toHex(txId, 2);
  hex += toHex(flags, 2);
  hex += '0001'; // questions: 1
  hex += '0000'; // answer RRs
  hex += '0000'; // authority RRs
  hex += '0000'; // additional RRs
  // Encode domain name
  const domain = v['Domain'] || 'example.com';
  domain.split('.').forEach(label => {
    hex += toHex(label.length, 1);
    hex += textToHex(label);
  });
  hex += '00'; // root label
  // Query type
  const typeMap = { A: 1, AAAA: 28, MX: 15, CNAME: 5, NS: 2, TXT: 16 };
  hex += toHex(typeMap[v['Type']] || 1, 2);
  hex += '0001'; // class IN
  return hex;
}

function buildArpHex(v) {
  const op = v['Operation']?.startsWith('2') ? 2 : 1;
  let hex = '';
  hex += '0001'; // hardware type: Ethernet
  hex += '0800'; // protocol type: IPv4
  hex += '06';   // hardware size: 6
  hex += '04';   // protocol size: 4
  hex += toHex(op, 2);
  hex += macToHex(v['Sender MAC'] || '00:00:00:00:00:00');
  hex += ipToHex(v['Sender IP'] || '0.0.0.0');
  hex += '000000000000'; // target MAC (unknown in request)
  hex += ipToHex(v['Target IP'] || '0.0.0.0');
  return hex;
}

function buildEthernetHex(v) {
  const etherTypes = { '0x0800 (IPv4)': '0800', '0x0806 (ARP)': '0806', '0x86DD (IPv6)': '86DD', '0x8100 (VLAN)': '8100' };
  let hex = '';
  hex += macToHex(v['Destination MAC'] || 'FF:FF:FF:FF:FF:FF');
  hex += macToHex(v['Source MAC'] || '00:00:00:00:00:00');
  hex += etherTypes[v['EtherType']] || '0800';
  return hex;
}

function buildHttpText(v) {
  const method = v['Method'] || 'GET';
  const uri = v['URI'] || '/';
  const version = v['Version'] || 'HTTP/1.1';
  const host = v['Host'] || 'example.com';
  return `${method} ${uri} ${version}\r\nHost: ${host}\r\nConnection: keep-alive\r\nAccept: */*\r\n\r\n`;
}

function renderInteractiveBuilder(container, proto) {
  if (!proto.interactive || !proto.interactive.length) return;

  const isText = proto.id === 'http';
  const section = document.createElement('div');
  section.className = 'proto-builder';

  section.innerHTML = `
    <div class="proto-builder__title">Интерактивный конструктор</div>
    <div class="proto-builder__desc">Измените параметры и наблюдайте, как формируется ${isText ? 'запрос' : 'заголовок пакета'}</div>
    <div class="proto-builder__form"></div>
    <div class="proto-builder__preview">
      <div class="proto-builder__preview-title">${isText ? 'Сформированный запрос' : 'Hex-дамп заголовка'}</div>
      <pre class="proto-builder__hex"></pre>
      ${!isText ? '<div class="proto-builder__size"></div>' : ''}
    </div>
  `;

  const form = section.querySelector('.proto-builder__form');
  const hexPre = section.querySelector('.proto-builder__hex');
  const sizeEl = section.querySelector('.proto-builder__size');

  // Current values
  const values = {};
  proto.interactive.forEach(f => {
    if (f.type === 'flags') {
      values[f.field] = [...(f.default || [])];
    } else {
      values[f.field] = f.default;
    }
  });

  function updatePreview() {
    const result = buildPacketHex(proto, values);
    if (!result) return;

    if (isText) {
      hexPre.textContent = result;
      hexPre.classList.add('proto-builder__hex--text');
    } else {
      hexPre.textContent = formatHexDump(result);
      const byteCount = result.length / 2;
      sizeEl.textContent = `${byteCount} байт (${result.length / 2 * 8} бит)`;
    }
  }

  // Render form fields
  proto.interactive.forEach(f => {
    const row = document.createElement('div');
    row.className = 'proto-builder__field';

    const label = document.createElement('label');
    label.className = 'proto-builder__label';
    label.textContent = f.field;

    row.appendChild(label);

    if (f.type === 'select') {
      const sel = document.createElement('select');
      sel.className = 'proto-builder__input';
      f.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === f.default) option.selected = true;
        sel.appendChild(option);
      });
      sel.addEventListener('change', () => {
        values[f.field] = sel.value;
        updatePreview();
      });
      row.appendChild(sel);

    } else if (f.type === 'number') {
      const input = document.createElement('input');
      input.className = 'proto-builder__input';
      input.type = 'number';
      input.min = f.min ?? 0;
      input.max = f.max ?? 65535;
      input.value = f.default ?? 0;
      input.addEventListener('input', () => {
        values[f.field] = parseInt(input.value, 10) || 0;
        updatePreview();
      });
      row.appendChild(input);

    } else if (f.type === 'text') {
      const input = document.createElement('input');
      input.className = 'proto-builder__input';
      input.type = 'text';
      input.value = f.default ?? '';
      input.addEventListener('input', () => {
        values[f.field] = input.value;
        updatePreview();
      });
      row.appendChild(input);

    } else if (f.type === 'flags') {
      const flagsWrap = document.createElement('div');
      flagsWrap.className = 'proto-builder__flags';
      f.flags.forEach(flag => {
        const flagLabel = document.createElement('label');
        flagLabel.className = 'proto-builder__flag';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = (f.default || []).includes(flag);
        cb.addEventListener('change', () => {
          if (cb.checked) {
            if (!values[f.field].includes(flag)) values[f.field].push(flag);
          } else {
            values[f.field] = values[f.field].filter(fl => fl !== flag);
          }
          updatePreview();
        });
        flagLabel.appendChild(cb);
        flagLabel.appendChild(document.createTextNode(flag));
        flagsWrap.appendChild(flagLabel);
      });
      row.appendChild(flagsWrap);
    }

    form.appendChild(row);
  });

  container.appendChild(section);
  updatePreview();
}

/* ── Detail View ── */

function showDetail(protoId) {
  const p = PROTOCOLS.find(pr => pr.id === protoId);
  if (!p) return;

  const grid = document.getElementById('protoGrid');
  const header = document.querySelector('.proto-header');
  const countEl = document.getElementById('protoCount');
  const detail = document.getElementById('protoDetail');

  grid.style.display = 'none';
  header.style.display = 'none';
  countEl.style.display = 'none';
  detail.classList.add('open');

  // Find theory topic name
  const topic = THEORY_TOPICS.find(t => t.id === p.theoryTopic);
  const theoryLink = topic
    ? `<button class="proto-theory-link" data-theory="${p.theoryTopic}">📚 ${topic.title} →</button>`
    : '';

  // Build static HTML first
  detail.innerHTML = `
    <button class="proto-detail__back" id="protoBack">← Назад к списку</button>
    <div class="proto-detail__card">
      <div class="proto-detail__top">
        <div class="proto-detail__icon">${p.icon}</div>
        <div>
          <div class="proto-detail__title">${p.name}</div>
          <div class="proto-detail__full-name">${p.fullName}</div>
        </div>
      </div>
      <div class="proto-detail__badges">
        <span class="proto-detail__badge proto-detail__badge--layer proto-layer--${p.osi}">${p.osi} ${getCategoryLabel(p.osi)}</span>
        <span class="proto-detail__badge">TCP/IP: ${p.tcpip}</span>
        ${p.rfc && p.rfc !== '-' ? `<span class="proto-detail__badge">RFC ${p.rfc}</span>` : ''}
        ${p.ports && p.ports.length ? `<span class="proto-detail__badge">Порт: ${p.ports.join(', ')}</span>` : ''}
      </div>
      <div class="proto-detail__desc">${p.desc}</div>
      <div class="proto-detail__details">${p.details}</div>

      ${p.features && p.features.length ? `
        <div class="proto-features">
          <div class="proto-features__title">Особенности</div>
          <ul class="proto-features__list">
            ${p.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${p.useCases && p.useCases.length ? `
        <div class="proto-use-cases">
          <div class="proto-use-cases__title">Применение</div>
          <div class="proto-use-cases__tags">
            ${p.useCases.map(u => `<span class="proto-use-case-tag">${u}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    ${renderHeaderDiagram(p)}

    <div id="protoBuilderMount"></div>

    ${p.related && p.related.length ? `
      <div class="proto-related">
        <div class="proto-related__title">Связанные протоколы</div>
        <div class="proto-related__list">
          ${p.related.map(rId => {
            const rel = PROTOCOLS.find(pr => pr.id === rId);
            return rel ? `<button class="proto-related__link" data-proto="${rId}">${rel.icon} ${rel.name}</button>` : '';
          }).join('')}
        </div>
      </div>
    ` : ''}

    ${theoryLink}
  `;

  // Mount interactive builder via DOM (not innerHTML) to preserve event listeners
  const builderMount = detail.querySelector('#protoBuilderMount');
  if (builderMount) {
    renderInteractiveBuilder(builderMount, p);
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function hideDetail() {
  const grid = document.getElementById('protoGrid');
  const header = document.querySelector('.proto-header');
  const countEl = document.getElementById('protoCount');
  const detail = document.getElementById('protoDetail');

  grid.style.display = '';
  header.style.display = '';
  countEl.style.display = '';
  detail.classList.remove('open');
  detail.innerHTML = '';
}

function getCategoryLabel(osi) {
  const cat = PROTOCOL_CATEGORIES.find(c => c.id === osi);
  return cat ? cat.label.replace(/^L\d\s*/, '') : '';
}

// Public: open protocol detail from outside (used by theory integration)
export function openProtocol(protoId) {
  navigateTo('protocols');
  setTimeout(() => showDetail(protoId), 50);
}

export function initProtocols() {
  renderFilters();
  renderGrid();

  const section = document.getElementById('section-protocols');
  if (!section) return;

  // Event delegation
  section.addEventListener('click', (e) => {
    const filterBtn = e.target.closest('.proto-filter-btn');
    if (filterBtn) {
      currentFilter = filterBtn.dataset.filter;
      renderFilters();
      renderGrid();
      return;
    }

    const card = e.target.closest('.proto-card');
    if (card) {
      showDetail(card.dataset.proto);
      return;
    }

    if (e.target.closest('#protoBack')) {
      hideDetail();
      return;
    }

    const relatedLink = e.target.closest('.proto-related__link');
    if (relatedLink) {
      showDetail(relatedLink.dataset.proto);
      return;
    }

    const theoryBtn = e.target.closest('.proto-theory-link');
    if (theoryBtn) {
      navigateTo('theory');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openTheoryTopic', { detail: theoryBtn.dataset.theory }));
      }, 100);
      return;
    }
  });

  // Search
  const searchInput = document.getElementById('protoSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderGrid();
    });
  }
}
