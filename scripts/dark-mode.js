/**
 * Dark mode toggle for Analytics Rockstar
 * Respects system preference, allows manual override via toggle button.
 * Persists choice to localStorage.
 */

function getPreferredTheme() {
  const stored = localStorage.getItem('theme');
  if (stored) return stored;
  // Default to dark mode for new visitors
  return 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

// Apply theme immediately (before DOM ready) to prevent flash
setTheme(getPreferredTheme());

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light');
  }
});

// Export for use in header block
export { toggleTheme, getPreferredTheme, setTheme };
