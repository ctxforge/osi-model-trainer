/* Theory section engine — renders topics with interactive elements */

import { THEORY_PARTS, THEORY_TOPICS } from '../data/theory-data.js';
import { PROTOCOLS } from '../data/protocols-data.js';
import { addXP, gameState, saveGame } from '../core/gamification.js';
import { navigateTo } from '../core/router.js';
import {
  renderTimeline, renderTopologies, renderComparison,
  renderOsiCompare, renderCards, renderFormula,
  renderQuiz, renderKeyTerms
} from './theory-interactive.js';

let currentTopicId = null;

function renderNav(container) {
  let html = '';
  THEORY_PARTS.forEach(part => {
    const topics = THEORY_TOPICS.filter(t => t.part === part.id);
    html += `<div class="theory-nav__part">
      <div class="theory-nav__part-title">${part.icon} Часть ${part.id}. ${part.title}</div>
      ${topics.map(t => `<button class="theory-nav__topic${t.id === currentTopicId ? ' active' : ''}" data-topic="${t.id}">
        <span class="theory-nav__num">${t.number}</span>
        <span class="theory-nav__name">${t.title}</span>
        ${isTopicRead(t.id) ? '<span class="theory-nav__check">✓</span>' : ''}
      </button>`).join('')}
    </div>`;
  });
  container.innerHTML = html;
  container.querySelectorAll('.theory-nav__topic').forEach(btn => {
    btn.addEventListener('click', () => selectTopic(btn.dataset.topic));
  });
}

function isTopicRead(id) {
  return gameState.theoryRead?.includes(id);
}

function markTopicRead(id) {
  if (!gameState.theoryRead) gameState.theoryRead = [];
  if (!gameState.theoryRead.includes(id)) {
    gameState.theoryRead.push(id);
    saveGame();
    addXP(5);
  }
}

function selectTopic(id) {
  currentTopicId = id;
  const topic = THEORY_TOPICS.find(t => t.id === id);
  if (!topic) return;

  const nav = document.getElementById('theoryNav');
  const content = document.getElementById('theoryContent');

  renderNav(nav);
  renderTopic(content, topic);

  // mark as read after 5 seconds of viewing
  clearTimeout(selectTopic._readTimer);
  selectTopic._readTimer = setTimeout(() => markTopicRead(id), 5000);
}

function renderTopic(container, topic) {
  container.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'theory-topic__header';
  header.innerHTML = `
    <div class="theory-topic__icon">${topic.icon}</div>
    <div>
      <div class="theory-topic__num">Тема ${topic.number}</div>
      <h2 class="theory-topic__title">${topic.title}</h2>
    </div>`;
  container.appendChild(header);

  // Summary
  const summary = document.createElement('div');
  summary.className = 'theory-topic__summary';
  summary.textContent = topic.summary;
  container.appendChild(summary);

  // Sections
  topic.sections.forEach(sec => {
    const section = document.createElement('div');
    section.className = 'theory-section';

    const title = document.createElement('div');
    title.className = 'theory-section__title';
    title.textContent = sec.title;
    section.appendChild(title);

    const body = document.createElement('div');
    body.className = 'theory-section__body';

    switch (sec.type) {
      case 'timeline':
        renderTimeline(body, sec.data);
        break;
      case 'topologies':
        renderTopologies(body, sec.data);
        break;
      case 'comparison':
        renderComparison(body, sec.items);
        break;
      case 'osi-compare':
        renderOsiCompare(body, sec.data);
        break;
      case 'cards':
        renderCards(body, sec.data);
        break;
      case 'formula':
        renderFormula(body, sec.formula);
        break;
      case 'text':
        body.innerHTML = sec.content;
        break;
      default:
        body.innerHTML = sec.content || '';
    }

    section.appendChild(body);
    container.appendChild(section);
  });

  // Key Terms
  if (topic.keyTerms?.length) {
    const termsSection = document.createElement('div');
    termsSection.className = 'theory-section';
    renderKeyTerms(termsSection, topic.keyTerms);
    container.appendChild(termsSection);
  }

  // Quiz
  if (topic.quiz?.length) {
    const quizSection = document.createElement('div');
    quizSection.className = 'theory-section';
    const quizTitle = document.createElement('div');
    quizTitle.className = 'theory-section__title';
    quizTitle.textContent = 'Проверь себя';
    quizSection.appendChild(quizTitle);
    // Reset quiz state for fresh render
    topic.quiz.forEach(q => delete q._selected);
    renderQuiz(quizSection, topic.quiz);
    container.appendChild(quizSection);
  }

  // Lab link
  if (topic.labLink) {
    const link = document.createElement('button');
    link.className = 'theory-lab-link';
    link.innerHTML = `🔬 ${topic.labLink.text}`;
    link.addEventListener('click', () => {
      navigateTo(topic.labLink.section);
    });
    container.appendChild(link);
  }

  // Related protocols from reference
  const relatedProtos = PROTOCOLS.filter(p => p.theoryTopic === topic.id);
  if (relatedProtos.length) {
    const protoSection = document.createElement('div');
    protoSection.className = 'theory-section';
    protoSection.innerHTML = `
      <div class="theory-section__title">Протоколы в этой теме</div>
      <div class="theory-proto-links">
        ${relatedProtos.map(p => `<button class="theory-proto-link" data-proto="${p.id}">
          <span>${p.icon}</span> <strong>${p.name}</strong> <span style="color:var(--text-secondary);font-size:.72rem">${p.fullName}</span>
        </button>`).join('')}
      </div>`;
    protoSection.querySelectorAll('.theory-proto-link').forEach(btn => {
      btn.addEventListener('click', () => {
        navigateTo('protocols');
        setTimeout(() => {
          import('../sections/protocols.js').then(m => m.openProtocol(btn.dataset.proto));
        }, 50);
      });
    });
    container.appendChild(protoSection);
  }

  // Topic navigation (prev/next)
  const topicIdx = THEORY_TOPICS.findIndex(t => t.id === topic.id);
  const prev = THEORY_TOPICS[topicIdx - 1];
  const next = THEORY_TOPICS[topicIdx + 1];
  const nav = document.createElement('div');
  nav.className = 'theory-topic-nav';
  nav.innerHTML = `
    ${prev ? `<button class="theory-topic-nav__btn" data-topic="${prev.id}">← ${prev.title}</button>` : '<span></span>'}
    ${next ? `<button class="theory-topic-nav__btn" data-topic="${next.id}">${next.title} →</button>` : '<span></span>'}`;
  nav.querySelectorAll('.theory-topic-nav__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectTopic(btn.dataset.topic);
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  container.appendChild(nav);
}

export function initTheory() {
  const section = document.getElementById('section-theory');
  if (!section) return;

  const nav = document.getElementById('theoryNav');
  const content = document.getElementById('theoryContent');

  // Render initial nav
  currentTopicId = THEORY_TOPICS[0]?.id || null;
  renderNav(nav);

  // Select first topic by default when section becomes visible
  const observer = new MutationObserver(() => {
    if (section.classList.contains('active') && !content.children.length) {
      selectTopic(currentTopicId);
    }
  });
  observer.observe(section, { attributes: true, attributeFilter: ['class'] });

  // Mobile: toggle nav
  const toggle = document.getElementById('theoryNavToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  // Listen for cross-navigation from protocol reference
  window.addEventListener('openTheoryTopic', (e) => {
    const topicId = e.detail;
    if (topicId && THEORY_TOPICS.find(t => t.id === topicId)) {
      selectTopic(topicId);
    }
  });
}
