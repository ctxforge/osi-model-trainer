/* ==================== NAVIGATION / ROUTER ==================== */
import { CHANNEL_TYPES } from '../data/channels.js';

export const physicsState = { channelId: 'none', chDistance: 50, noiseLevel: 0 };

function navigateTo(sectionId) {
  const sections = document.querySelectorAll('.section');
  const menuItems = document.querySelectorAll('.side-menu__item');

  sections.forEach(s => s.classList.remove('active'));
  menuItems.forEach(b => b.classList.remove('active'));
  const target = document.getElementById('section-' + sectionId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  menuItems.forEach(b => {
    if (b.dataset.section === sectionId) b.classList.add('active');
  });
  closeMenu();
}

function openMenu() {
  document.getElementById('sideMenu').classList.add('open');
  document.getElementById('menuOverlay').classList.add('open');
}

function closeMenu() {
  document.getElementById('sideMenu').classList.remove('open');
  document.getElementById('menuOverlay').classList.remove('open');
}

function updateChChannelInfo() {
  const info = document.getElementById('chChannelInfo');
  if (!info) return;
  if (physicsState.channelId === 'none') {
    info.innerHTML = '<div style="color:var(--l7);font-size:.82rem;font-weight:700">\u26A0 \u041A\u0430\u043D\u0430\u043B \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D. \u041F\u0435\u0440\u0435\u0439\u0434\u0438\u0442\u0435 \u043D\u0430 \u0432\u043A\u043B\u0430\u0434\u043A\u0443 \u00AB\u0413\u0435\u043D\u0435\u0440\u0430\u0442\u043E\u0440 + \u041A\u0430\u043D\u0430\u043B\u00BB \u0438 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u0430\u043D\u0430\u043B \u0441\u0432\u044F\u0437\u0438 \u0432 \u0431\u043B\u043E\u043A\u0435 \u2464</div>';
  } else {
    const ch = CHANNEL_TYPES.find(c => c.id === physicsState.channelId);
    const distUnit = ch.medium === 'fiber' ? physicsState.chDistance / 1000 : physicsState.chDistance / 100;
    const atten = ch.attenuation * distUnit;
    const snr = Math.max(ch.snrBase - atten, -5);
    const q = snr > 30 ? '\uD83D\uDFE2 \u041E\u0442\u043B\u0438\u0447\u043D\u043E\u0435' : snr > 20 ? '\uD83D\uDFE1 \u0425\u043E\u0440\u043E\u0448\u0435\u0435' : snr > 10 ? '\uD83D\uDFE0 \u0421\u0440\u0435\u0434\u043D\u0435\u0435' : snr > 0 ? '\uD83D\uDD34 \u041F\u043B\u043E\u0445\u043E\u0435' : '\u26AB \u041D\u0435\u0442 \u0441\u0432\u044F\u0437\u0438';
    info.innerHTML = `<div class="study-section__title">\u041A\u0430\u043D\u0430\u043B \u0438\u0437 \u0433\u0435\u043D\u0435\u0440\u0430\u0442\u043E\u0440\u0430</div>
      <div style="font-size:.78rem;line-height:1.7">
        <strong>${ch.icon} ${ch.name}</strong> \u2014 \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435: ${physicsState.chDistance >= 1000 ? (physicsState.chDistance/1000).toFixed(1)+' \u043A\u043C' : physicsState.chDistance+' \u043C'}<br>
        \u0417\u0430\u0442\u0443\u0445\u0430\u043D\u0438\u0435: ${atten.toFixed(1)} \u0434\u0411 | SNR: ${snr.toFixed(1)} \u0434\u0411 ${q}<br>
        \u0428\u0443\u043C \u0433\u0435\u043D\u0435\u0440\u0430\u0442\u043E\u0440\u0430: ${physicsState.noiseLevel > 0 ? physicsState.noiseLevel.toFixed(2) : '\u043D\u0435\u0442'} | \u041F\u043E\u043C\u0435\u0445\u0438: ${ch.interference}
      </div>`;
  }
}

function initRouter() {
  document.getElementById('hamburgerBtn').addEventListener('click', openMenu);
  document.getElementById('menuOverlay').addEventListener('click', closeMenu);

  document.querySelectorAll('.side-menu__item').forEach(btn =>
    btn.addEventListener('click', () => navigateTo(btn.dataset.section))
  );
  document.querySelectorAll('.nav-card').forEach(card =>
    card.addEventListener('click', () => navigateTo(card.dataset.nav))
  );

  // Physics lab tab switching
  document.addEventListener('click', (e) => {
    if (e.target.id === 'physTabGen') {
      document.getElementById('physGenPane').style.display = 'block';
      document.getElementById('physChanPane').style.display = 'none';
      document.getElementById('physTabGen').classList.add('active');
      document.getElementById('physTabChan').classList.remove('active');
    } else if (e.target.id === 'physTabChan') {
      document.getElementById('physGenPane').style.display = 'none';
      document.getElementById('physChanPane').style.display = 'block';
      document.getElementById('physTabGen').classList.remove('active');
      document.getElementById('physTabChan').classList.add('active');
      updateChChannelInfo();
    }
  });
}

export { navigateTo, initRouter, physicsState, updateChChannelInfo };
