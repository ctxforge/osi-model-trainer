/* ==================== THEME ==================== */

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').textContent = theme === 'dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
  localStorage.setItem('osi-theme', theme);
}

function initTheme() {
  setTheme(localStorage.getItem('osi-theme') || 'dark');
  document.getElementById('themeToggle').addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}

export { setTheme, initTheme };
