// Light/dark theme. Dark is the default: the inline script in layouts/Base.astro sets html[data-theme] before the first
// paint (the saved choice, else dark); this module keeps it in sync. The toggle ([data-theme-toggle], delegated, so it
// survives page swaps) switches and saves the choice.
// The switch fades: the page cross-fades from the old colours to the new ones in a view transition (the R canvas too);
// browsers without view transitions ease the colour tokens instead (html.is-theming). Reduced motion: instant.
const KEY = 'theme';
const FADE = .6; // s, same as the ::view-transition rule and html.is-theming in styles/base/_document.css
const META = { dark: '#170e0b', light: '#f3eee8' }; // --bg of each theme, for the browser UI

// read by the R engine every frame (glyph colours)
export const theme = { mode: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark' };

// the browser UI colour; swup's head plugin puts the page's own <meta> back on every swap, so mount() calls this again
export function syncThemeMeta() {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[theme.mode]);
}

function apply(mode) {
  theme.mode = mode;
  document.documentElement.dataset.theme = mode;
  syncThemeMeta();
}

function setTheme(mode) {
  try { localStorage.setItem(KEY, mode); } catch {}
  if (mode === theme.mode) return;
  const html = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return apply(mode);
  if (document.startViewTransition) {
    html.classList.add('is-theme-fading');
    document.startViewTransition(() => apply(mode)).finished.finally(() => html.classList.remove('is-theme-fading'));
    return;
  }
  html.classList.add('is-theming');
  apply(mode);
  setTimeout(() => html.classList.remove('is-theming'), FADE * 1000 + 50);
}

export function initTheme() {
  syncThemeMeta();
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-theme-toggle]')) setTheme(theme.mode === 'light' ? 'dark' : 'light');
  });
}
