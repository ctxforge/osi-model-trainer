import { GUIDED_LABS } from '../data/guided-labs.js';
import {
  engineState, startLab, getActiveLab, getCurrentStep,
  answerQuestion, advanceStep, checkStepAuto, getElapsedMinutes,
  onStepChanged
} from '../core/guided-lab-engine.js';
import { addXP } from '../core/gamification.js';

let glContainer = null;

export function initGuidedLabs() {
  glContainer = document.getElementById('guidedLabsUI');
  if (!glContainer) return;

  onStepChanged((lab, stepIdx) => renderActiveLab(lab, stepIdx));

  const sectionEl = document.getElementById('section-guided-labs');
  if (sectionEl) {
    const observer = new MutationObserver(() => {
      if (sectionEl.classList.contains('active') && !glContainer.children.length) renderLabList();
    });
    observer.observe(sectionEl, { attributes: true, attributeFilter: ['class'] });
  }
  setTimeout(() => {
    if (document.getElementById('section-guided-labs')?.classList.contains('active')) renderLabList();
  }, 200);
}

function renderLabList() {
  glContainer.innerHTML = `
    <div class="gl-header">
      <div class="gl-header__title">🧪 Комплексные лабораторные работы</div>
      <div class="gl-header__desc">Пошаговые практические работы, объединяющие несколько инструментов.</div>
    </div>
    <div class="gl-lab-grid">
      ${GUIDED_LABS.map(lab => `
        <div class="gl-lab-card ${engineState.completed.includes(lab.id) ? 'gl-lab-card--done' : ''}">
          <div class="gl-lab-card__icon">${lab.icon}</div>
          <div class="gl-lab-card__body">
            <div class="gl-lab-card__title">${lab.title} ${engineState.completed.includes(lab.id) ? '✅' : ''}</div>
            <div class="gl-lab-card__desc">${lab.desc}</div>
            <div class="gl-lab-card__meta">
              <span class="gl-lab-card__layers">${lab.layers}</span>
              <span class="gl-lab-card__time">~${lab.estMinutes} мин</span>
              <span class="gl-lab-card__steps">${lab.steps.length} шагов</span>
            </div>
          </div>
          <button class="gl-start-btn" data-lab="${lab.id}">
            ${engineState.completed.includes(lab.id) ? '🔄 Повторить' : '▶ Начать'}
          </button>
        </div>
      `).join('')}
    </div>
  `;

  glContainer.querySelectorAll('.gl-start-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      startLab(btn.dataset.lab);
      const lab = getActiveLab();
      if (lab) renderActiveLab(lab, 0);
    });
  });
}

function renderActiveLab(lab, stepIdx) {
  if (!lab) {
    // Lab completed or quit — show completion or return to list
    glContainer.innerHTML = `
      <div class="gl-complete">
        <div class="gl-complete__icon">🎉</div>
        <div class="gl-complete__title">Лабораторная работа завершена!</div>
        <div class="gl-complete__msg">Вы заработали <strong>50 XP</strong>. Время: ${getElapsedMinutes()} мин.</div>
        <button class="lab-run-btn" id="glBackBtn">← Вернуться к списку</button>
      </div>
    `;
    glContainer.querySelector('#glBackBtn')?.addEventListener('click', renderLabList);
    return;
  }

  const steps = lab.steps;
  const step = steps[stepIdx];

  glContainer.innerHTML = `
    <div class="gl-active-header">
      <button class="gl-back-btn" id="glBackBtn">← К списку</button>
      <div class="gl-active-title">${lab.icon} ${lab.title}</div>
      <div class="gl-active-progress">Шаг ${stepIdx + 1} / ${steps.length}</div>
    </div>

    <div class="gl-progress-bar">
      <div class="gl-progress-bar__fill" style="width:${((stepIdx) / steps.length * 100).toFixed(0)}%"></div>
    </div>

    <div class="gl-steps-row">
      ${steps.map((s, i) => `
        <div class="gl-step-dot ${i < stepIdx ? 'gl-step-dot--done' : i === stepIdx ? 'gl-step-dot--active' : ''}" title="${s.title}">
          ${i < stepIdx ? '✓' : i + 1}
        </div>
      `).join('<div class="gl-step-line"></div>')}
    </div>

    <div class="gl-step-card">
      <div class="gl-step-card__num">Шаг ${stepIdx + 1}</div>
      <div class="gl-step-card__title">${step.title}</div>
      <div class="gl-step-card__instruction">${step.instruction}</div>
      ${step.hint ? `
        <details class="gl-hint">
          <summary>💡 Подсказка</summary>
          <div>${step.hint}</div>
        </details>` : ''}
      ${step.question ? renderQuestion(step) : ''}
      <div class="gl-step-actions">
        ${stepIdx > 0 ? `<button class="gl-prev-btn" id="glPrevBtn">← Назад</button>` : ''}
        <button class="lab-run-btn gl-next-btn" id="glNextBtn" ${step.question && !(step.id in engineState.answers) ? 'disabled' : ''}>
          ${stepIdx === steps.length - 1 ? '✅ Завершить' : 'Далее →'}
        </button>
      </div>
    </div>
  `;

  glContainer.querySelector('#glBackBtn')?.addEventListener('click', () => {
    engineState.activeLab = null;
    renderLabList();
  });

  glContainer.querySelector('#glPrevBtn')?.addEventListener('click', () => {
    if (engineState.currentStep > 0) {
      engineState.currentStep--;
      renderActiveLab(lab, engineState.currentStep);
    }
  });

  glContainer.querySelector('#glNextBtn')?.addEventListener('click', () => {
    const result = advanceStep();
    if (result === 'completed') {
      renderActiveLab(null, 0);
    } else {
      renderActiveLab(lab, engineState.currentStep);
    }
  });

  // Question answer buttons
  if (step.question) {
    glContainer.querySelectorAll('.gl-answer-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const correct = answerQuestion(step.id, i);
        glContainer.querySelectorAll('.gl-answer-btn').forEach((b, j) => {
          if (step.answers[j]?.correct) b.classList.add('gl-answer-btn--correct');
          else if (j === i && !correct) b.classList.add('gl-answer-btn--wrong');
          b.disabled = true;
        });
        const feedback = glContainer.querySelector('#glAnswerFeedback');
        if (feedback) {
          feedback.textContent = correct ? '✅ Правильно! +10 XP' : '❌ Неверно. Правильный ответ выделен зелёным.';
          feedback.style.color = correct ? 'var(--l4)' : 'var(--l7)';
        }
        const nextBtn = glContainer.querySelector('#glNextBtn');
        if (nextBtn) nextBtn.disabled = false;
      });
    });
  }
}

function renderQuestion(step) {
  const answered = step.id in engineState.answers;
  return `
    <div class="gl-question">
      <div class="gl-question__text">${step.question}</div>
      <div class="gl-question__answers">
        ${step.answers.map((ans, i) => `
          <button class="gl-answer-btn ${answered && ans.correct ? 'gl-answer-btn--correct' : answered && engineState.answers[step.id] === i && !ans.correct ? 'gl-answer-btn--wrong' : ''}"
                  ${answered ? 'disabled' : ''}>
            ${String.fromCharCode(65 + i)}) ${ans.text}
          </button>
        `).join('')}
      </div>
      <div id="glAnswerFeedback" style="font-size:.8rem;margin-top:6px"></div>
    </div>
  `;
}
