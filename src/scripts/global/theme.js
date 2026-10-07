// Light/dark theme: one theme for the whole visit (no colour changes on scroll or between pages). Light is the default:
// layouts/Base.astro renders html[data-theme="light"] and its inline script switches to dark before the first paint if
// that's the saved choice. The toggle ([data-theme-toggle], delegated, so it survives page swaps) switches and saves it.
// The switch fades: the page cross-fades from the old colours to the new ones in a view transition (the R canvas too);
// browsers without view transitions ease the colour tokens instead (html.is-theming). Reduced motion: instant.
// Easter egg: a third, hidden theme, "wild" (risograph colours, styles/base/_tokens.css, the R's in engine.js): press R
// (not while typing), or click the toggle three times quickly. It lasts for this visit only (sessionStorage `wild`,
// read by the inline script in Base.astro); the toggle (or R again) goes back to the saved light / dark. The footer's
// bottom row hints at it (Footer.astro), and so does the console.
const KEY = 'mode'; // localStorage: 'dark' | 'light'
const WILD = 'wild'; // sessionStorage: '1' while the hidden theme is on
const FADE = .6; // s, same as the ::view-transition rule and html.is-theming in styles/base/_document.css
const META = { dark: '#170e0b', light: '#f3eee8', wild: '#2323c8' }; // --bg of each theme, for the browser UI
let fading = null; // the running view transition (a quick next switch skips it)
const TRIPLE = 1100; // ms: three clicks on the toggle within this time switch to the hidden theme

// read by the R engine every frame (glyph colours)
const initial = document.documentElement.dataset.theme;
export const theme = { mode: initial === 'dark' || initial === 'wild' ? initial : 'light' };

// the saved light / dark choice (what the hidden theme goes back to)
const saved = () => { try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } };

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
  if (mode === WILD) { try { sessionStorage.setItem(WILD, '1'); } catch {} }
  else {
    try { sessionStorage.removeItem(WILD); localStorage.setItem(KEY, mode); } catch {}
  }
  if (mode === theme.mode) return;
  const html = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return apply(mode);
  if (document.startViewTransition) {
    html.classList.add('is-theme-fading');
    const vt = (fading = document.startViewTransition(() => apply(mode)));
    vt.finished.finally(() => { if (fading === vt) html.classList.remove('is-theme-fading'); }); // a quick next switch skips this one: it keeps the class
    return;
  }
  html.classList.add('is-theming');
  apply(mode);
  setTimeout(() => html.classList.remove('is-theming'), FADE * 1000 + 50);
}

const toggleWild = () => setTheme(theme.mode === WILD ? saved() : WILD);

export function initTheme() {
  syncThemeMeta();
  let clicks = [];
  // during a cross-fade the page is a snapshot that takes the clicks itself (they land on <html>), so a click on the
  // spot where the toggle is counts too: otherwise the second and third click of a quick triple never reach it
  const onToggle = (e) => {
    if (e.target.closest('[data-theme-toggle]')) return true;
    if (e.target !== document.documentElement) return false;
    const r = document.querySelector('[data-theme-toggle]')?.getBoundingClientRect();
    return !!r && e.clientX >= r.left - 4 && e.clientX <= r.right + 4 && e.clientY >= r.top - 4 && e.clientY <= r.bottom + 4;
  };
  document.addEventListener('click', (e) => {
    if (!onToggle(e)) return;
    const now = performance.now();
    clicks = [...clicks.filter((t) => now - t < TRIPLE), now];
    if (clicks.length >= 3 && theme.mode !== WILD) { clicks = []; return setTheme(WILD); }
    setTheme(theme.mode === WILD ? saved() : theme.mode === 'light' ? 'dark' : 'light');
  });
  addEventListener('keydown', (e) => {
    if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat
      && !e.target.closest?.('input,textarea,select,[contenteditable]')) toggleWild();
  });
  console.log('%cR', 'font:700 40px serif;color:#ff4a00', '\nLooking under the hood? Press R on the page for something else.');
}
