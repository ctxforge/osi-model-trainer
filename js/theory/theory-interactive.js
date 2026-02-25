/* Interactive widgets for theory sections: timeline, topology, formula calculator, quiz */

// ─── Timeline ──────────────────────────────────────────────────────
export function renderTimeline(container, events) {
  const el = document.createElement('div');
  el.className = 'tl';
  events.forEach((ev, i) => {
    const item = document.createElement('div');
    item.className = 'tl__item';
    item.innerHTML = `
      <div class="tl__dot" style="background:${ev.color}"></div>
      <div class="tl__year">${ev.year}</div>
      <div class="tl__card" style="border-left:3px solid ${ev.color}">
        <div class="tl__title">${ev.title}</div>
        <div class="tl__desc">${ev.desc}</div>
      </div>`;
    item.style.animationDelay = `${i * 0.07}s`;
    el.appendChild(item);
  });
  container.appendChild(el);
}

// ─── Topology Visualizer (Canvas) ──────────────────────────────────
export function renderTopologies(container, topos) {
  const wrap = document.createElement('div');
  wrap.className = 'topo-wrap';

  const tabs = document.createElement('div');
  tabs.className = 'topo-tabs';
  topos.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'topo-tab' + (i === 0 ? ' active' : '');
    btn.textContent = t.name;
    btn.dataset.idx = i;
    tabs.appendChild(btn);
  });
  wrap.appendChild(tabs);

  const canvas = document.createElement('canvas');
  canvas.className = 'topo-canvas';
  canvas.style.height = '220px';
  wrap.appendChild(canvas);

  const desc = document.createElement('div');
  desc.className = 'topo-desc';
  wrap.appendChild(desc);

  container.appendChild(wrap);

  let current = 0;

  function draw(idx) {
    current = idx;
    const t = topos[idx];
    desc.textContent = t.desc;
    tabs.querySelectorAll('.topo-tab').forEach((b, i) => b.classList.toggle('active', i === idx));

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 220 * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const w = rect.width, h = 220;
    ctx.clearRect(0, 0, w, h);

    const scaleX = w / 600;
    const scaleY = h / 380;
    const scale = Math.min(scaleX, scaleY);
    const ox = (w - 600 * scale) / 2;
    const oy = (h - 380 * scale) / 2;

    const nodes = t.nodes.map(([x, y]) => [x * scale + ox, y * scale + oy]);
    const r = 16 * scale;

    // links
    ctx.strokeStyle = t.color + '80';
    ctx.lineWidth = 2;
    t.links.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(nodes[a][0], nodes[a][1]);
      ctx.lineTo(nodes[b][0], nodes[b][1]);
      ctx.stroke();
    });

    // nodes
    nodes.forEach(([x, y], i) => {
      const isCenter = t.center === i;
      ctx.beginPath();
      ctx.arc(x, y, isCenter ? r * 1.3 : r, 0, Math.PI * 2);
      ctx.fillStyle = t.color;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(10 * scale)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isCenter ? '★' : (i + 1), x, y);
    });
  }

  tabs.addEventListener('click', (e) => {
    const idx = e.target.dataset?.idx;
    if (idx != null) draw(+idx);
  });

  // auto-advance
  let interval = setInterval(() => {
    draw((current + 1) % topos.length);
  }, 4000);
  wrap.addEventListener('click', () => { clearInterval(interval); });

  requestAnimationFrame(() => draw(0));
}

// ─── Comparison Cards ──────────────────────────────────────────────
export function renderComparison(container, items) {
  const grid = document.createElement('div');
  grid.className = 'theory-compare';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'theory-compare__card';
    card.style.borderTopColor = item.color;
    card.innerHTML = `
      <div class="theory-compare__icon">${item.icon}</div>
      <div class="theory-compare__title">${item.title}</div>
      <ul class="theory-compare__list">
        ${item.points.map(p => `<li>${p}</li>`).join('')}
      </ul>`;
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

// ─── OSI vs TCP/IP Interactive Comparison ──────────────────────────
export function renderOsiCompare(container, data) {
  const el = document.createElement('div');
  el.className = 'osi-cmp';
  el.innerHTML = `
    <div class="osi-cmp__col">
      <div class="osi-cmp__header">Модель OSI (7 уровней)</div>
      ${data.osi.map(l => `<div class="osi-cmp__layer" data-num="${l.num}" style="background:${l.color}20;border-left:3px solid ${l.color}">
        <span class="osi-cmp__num">L${l.num}</span> ${l.name}
      </div>`).join('')}
    </div>
    <div class="osi-cmp__col">
      <div class="osi-cmp__header">Модель TCP/IP (4 уровня)</div>
      ${data.tcpip.map(t => `<div class="osi-cmp__tcp" style="background:${t.color}20;border-left:3px solid ${t.color};flex:${t.layers.length}" data-layers="${t.layers.join(',')}">
        <strong>${t.name}</strong><br><span style="font-size:.7rem;opacity:.7">${t.protocols}</span>
      </div>`).join('')}
    </div>`;

  // Highlight corresponding layers on hover
  el.addEventListener('mouseover', (e) => {
    const layer = e.target.closest('[data-num]');
    const tcp = e.target.closest('[data-layers]');
    el.querySelectorAll('.osi-cmp__layer, .osi-cmp__tcp').forEach(x => x.classList.remove('highlight'));
    if (layer) {
      const num = +layer.dataset.num;
      layer.classList.add('highlight');
      el.querySelectorAll('.osi-cmp__tcp').forEach(t => {
        if (t.dataset.layers.split(',').map(Number).includes(num)) t.classList.add('highlight');
      });
    }
    if (tcp) {
      const layers = tcp.dataset.layers.split(',').map(Number);
      tcp.classList.add('highlight');
      el.querySelectorAll('.osi-cmp__layer').forEach(l => {
        if (layers.includes(+l.dataset.num)) l.classList.add('highlight');
      });
    }
  });
  el.addEventListener('mouseleave', () => {
    el.querySelectorAll('.highlight').forEach(x => x.classList.remove('highlight'));
  });

  container.appendChild(el);
}

// ─── Info Cards Grid ───────────────────────────────────────────────
export function renderCards(container, cards) {
  const grid = document.createElement('div');
  grid.className = 'theory-cards';
  cards.forEach(c => {
    const card = document.createElement('div');
    card.className = 'theory-info-card';
    card.style.borderTopColor = c.color;
    card.innerHTML = `
      <div class="theory-info-card__title" style="color:${c.color}">${c.title}</div>
      <div class="theory-info-card__sub">${c.subtitle}</div>
      <div class="theory-info-card__desc">${c.desc}</div>`;
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

// ─── Formula Calculator ────────────────────────────────────────────
export function renderFormula(container, formula) {
  const el = document.createElement('div');
  el.className = 'formula-calc';

  const varsHtml = formula.vars.filter(v => !v.computed).map(v => `
    <div class="formula-calc__var">
      <label>${v.symbol} — ${v.name}${v.unit ? ' (' + v.unit + ')' : ''}</label>
      <div class="formula-calc__row">
        <input type="range" class="formula-calc__range" data-var="${v.symbol}" min="${v.min}" max="${v.max}" step="${v.step}" value="${v.default}">
        <input type="number" class="formula-calc__num" data-var="${v.symbol}" min="${v.min}" max="${v.max}" step="${v.step}" value="${v.default}">
      </div>
    </div>`).join('');

  const resultVar = formula.vars.find(v => v.computed);
  el.innerHTML = `
    <div class="formula-calc__name">${formula.name}</div>
    <div class="formula-calc__tex">${formula.tex}</div>
    <div class="formula-calc__desc">${formula.desc}</div>
    <div class="formula-calc__vars">${varsHtml}</div>
    <div class="formula-calc__result">
      <span class="formula-calc__result-label">${resultVar.symbol} =</span>
      <span class="formula-calc__result-value" id="fResult"></span>
      <span class="formula-calc__result-unit">${resultVar.unit}</span>
    </div>
    <div class="formula-calc__example">${formula.example}</div>`;

  container.appendChild(el);

  function compute() {
    const vals = {};
    el.querySelectorAll('.formula-calc__num').forEach(input => {
      vals[input.dataset.var] = +input.value;
    });
    const result = formula.compute(vals);
    const resultEl = el.querySelector('#fResult');
    if (result >= 1e6) resultEl.textContent = (result / 1e6).toFixed(2) + ' М';
    else if (result >= 1e3) resultEl.textContent = (result / 1e3).toFixed(1) + ' К';
    else resultEl.textContent = result.toFixed(1);
  }

  el.querySelectorAll('.formula-calc__range').forEach(range => {
    range.addEventListener('input', () => {
      el.querySelector(`.formula-calc__num[data-var="${range.dataset.var}"]`).value = range.value;
      compute();
    });
  });
  el.querySelectorAll('.formula-calc__num').forEach(num => {
    num.addEventListener('input', () => {
      const range = el.querySelector(`.formula-calc__range[data-var="${num.dataset.var}"]`);
      if (range) range.value = num.value;
      compute();
    });
  });

  compute();
}

// ─── Quiz Widget ───────────────────────────────────────────────────
export function renderQuiz(container, questions) {
  const el = document.createElement('div');
  el.className = 'theory-quiz';

  let current = 0;
  let score = 0;
  let answered = new Set();

  function renderQuestion() {
    const q = questions[current];
    const isAnswered = answered.has(current);
    el.innerHTML = `
      <div class="theory-quiz__header">
        <span>Вопрос ${current + 1} / ${questions.length}</span>
        <span class="theory-quiz__score">${score} из ${answered.size}</span>
      </div>
      <div class="theory-quiz__question">${q.q}</div>
      <div class="theory-quiz__options">
        ${q.options.map((opt, i) => {
          let cls = 'theory-quiz__opt';
          if (isAnswered) {
            if (i === q.answer) cls += ' correct';
            else if (q._selected === i) cls += ' wrong';
          }
          return `<button class="${cls}" data-idx="${i}" ${isAnswered ? 'disabled' : ''}>${opt}</button>`;
        }).join('')}
      </div>
      ${isAnswered ? `<div class="theory-quiz__explain">${q.explain}</div>` : ''}
      <div class="theory-quiz__nav">
        <button class="theory-quiz__prev" ${current === 0 ? 'disabled' : ''}>← Назад</button>
        <div class="theory-quiz__dots">
          ${questions.map((_, i) => `<span class="theory-quiz__dot${i === current ? ' active' : ''}${answered.has(i) ? (questions[i]._selected === questions[i].answer ? ' correct' : ' wrong') : ''}"></span>`).join('')}
        </div>
        <button class="theory-quiz__next" ${current === questions.length - 1 ? 'disabled' : ''}>Далее →</button>
      </div>
      ${answered.size === questions.length ? `<div class="theory-quiz__final">Результат: ${score} / ${questions.length} (${Math.round(score / questions.length * 100)}%)</div>` : ''}`;

    el.querySelectorAll('.theory-quiz__opt:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.idx;
        q._selected = idx;
        answered.add(current);
        if (idx === q.answer) score++;
        renderQuestion();
      });
    });
    el.querySelector('.theory-quiz__prev')?.addEventListener('click', () => { if (current > 0) { current--; renderQuestion(); } });
    el.querySelector('.theory-quiz__next')?.addEventListener('click', () => { if (current < questions.length - 1) { current++; renderQuestion(); } });
  }

  container.appendChild(el);
  renderQuestion();
}

// ─── Key Terms (expandable) ────────────────────────────────────────
export function renderKeyTerms(container, terms) {
  const el = document.createElement('div');
  el.className = 'theory-terms';
  el.innerHTML = `<div class="theory-terms__title">Ключевые термины</div>`;
  terms.forEach(t => {
    const item = document.createElement('div');
    item.className = 'theory-term';
    item.innerHTML = `
      <div class="theory-term__head">${t.term}<span class="theory-term__toggle">+</span></div>
      <div class="theory-term__body">${t.def}</div>`;
    item.querySelector('.theory-term__head').addEventListener('click', () => {
      item.classList.toggle('open');
      item.querySelector('.theory-term__toggle').textContent = item.classList.contains('open') ? '−' : '+';
    });
    el.appendChild(item);
  });
  container.appendChild(el);
}
