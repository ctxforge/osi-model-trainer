/**
 * tooltips.js — Custom tooltip system via event delegation
 *
 * Uses [data-tip] attribute instead of native title="".
 * Single DOM element, auto-positioning with flip, animated.
 */

let tipEl = null;
let showTimer = null;
const DELAY = 150; // ms before showing

export function initTooltips() {
  tipEl = document.createElement('div');
  tipEl.id = 'appTooltip';
  tipEl.setAttribute('role', 'tooltip');
  document.body.appendChild(tipEl);

  document.addEventListener('pointerenter', onEnter, true);
  document.addEventListener('pointerleave', onLeave, true);
}

function onEnter(e) {
  const target = e.target.closest?.('[data-tip]');
  if (!target) return;

  clearTimeout(showTimer);
  showTimer = setTimeout(() => show(target), DELAY);
}

function onLeave(e) {
  const target = e.target.closest?.('[data-tip]');
  if (!target) return;

  clearTimeout(showTimer);
  hide();
}

function show(anchor) {
  const text = anchor.getAttribute('data-tip');
  if (!text) return;

  tipEl.textContent = text;
  tipEl.classList.add('visible');

  // Position above the element by default
  const rect = anchor.getBoundingClientRect();
  const tipRect = tipEl.getBoundingClientRect();

  let top = rect.top - tipRect.height - 8;
  let flipDown = false;

  // Flip below if not enough space above
  if (top < 4) {
    top = rect.bottom + 8;
    flipDown = true;
  }

  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  // Clamp horizontally
  left = Math.max(6, Math.min(left, window.innerWidth - tipRect.width - 6));

  tipEl.style.top = top + window.scrollY + 'px';
  tipEl.style.left = left + window.scrollX + 'px';
  tipEl.classList.toggle('flip', flipDown);
}

function hide() {
  tipEl.classList.remove('visible');
}
