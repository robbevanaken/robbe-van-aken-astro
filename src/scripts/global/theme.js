// Theme: the site is light, with some sections in the dark palette as you scroll (.t-dark, the footer: _tokens.css);
// there's no light / dark choice any more (tried: a toggle for the whole visit, saved in localStorage `mode`).
// Easter egg: a hidden theme, "wild" (risograph colours, styles/base/_tokens.css, the R's in engine.js): press R (not
// while typing). It lasts for this visit only (sessionStorage `wild`, read by the inline script in Base.astro); R again
// goes back. The switch fades: a view transition cross-fades the page (the R canvas too); browsers without view
// transitions ease the colour tokens instead (html.is-theming). Reduced motion: instant. The footer's bottom row hints
// at it (Footer.astro), and so does the console.
const WILD = 'wild'; // sessionStorage: '1' while the hidden theme is on
const FADE = .6; // s, same as the ::view-transition rule and html.is-theming in styles/base/_document.css
const META = { dark: '#170e0b', light: '#f3eee8', wild: '#2323c8' }; // --bg of each theme, for the browser UI
let fading = null; // the running view transition (a quick next switch skips it)

// read by the R engine every frame (glyph colours)
const initial = document.documentElement.dataset.theme;
export const theme = { mode: initial === 'wild' ? initial : 'light' };


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
  try { if (mode === WILD) sessionStorage.setItem(WILD, '1'); else sessionStorage.removeItem(WILD); } catch {}
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

const toggleWild = () => setTheme(theme.mode === WILD ? 'light' : WILD);

// The scroll theme (global/scrollTheme.js): as a dark chapter reaches the middle of the screen the whole page eases to
// the dark palette and back (html.is-theming transitions every colour token, _document.css; the R blends its own
// palette in the engine). No view transition (a snapshot would stutter against scrolling) and nothing is saved.
let scrollFade = 0;
export function setScrollTheme(mode, instant = false) {
  if (theme.mode === WILD || mode === theme.mode) return;
  const html = document.documentElement;
  if (instant || matchMedia('(prefers-reduced-motion: reduce)').matches) return apply(mode);
  html.classList.add('is-theming');
  apply(mode);
  clearTimeout(scrollFade);
  scrollFade = setTimeout(() => html.classList.remove('is-theming'), FADE * 1000 + 50);
}

export function initTheme() {
  syncThemeMeta();
  addEventListener('keydown', (e) => {
    if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey && !e.repeat
      && !e.target.closest?.('input,textarea,select,[contenteditable]')) toggleWild();
  });
  console.log('%cR', 'font:700 40px serif;color:#c1121f', '\nLooking under the hood? Press R on the page for something else.');
}
