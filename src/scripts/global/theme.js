// The page's colours. No toggle: colour follows the content. Every page has a base (`theme` on layouts/Base.astro:
// html[data-theme] in the built page, and [data-page-theme] inside #swup, so a page swap can read the next page's), and
// a zone ([data-theme-zone="light"|"dark"]) turns the whole page while it's on screen: home's light chapter (projects,
// services, how I work), the footer (dark on every page). Scrolling into or out of a zone eases (the colour tokens are
// registered, @property in base/_tokens.css, so one transition on <html> moves every colour: html.is-theming); a page
// swap switches at once, under the overlay, which is always dark (--curtain), so colour never morphs during a transition.
// Reduced motion: instant.
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const FADE = .6; // s, same as html.is-theming in styles/base/_document.css
const META = { dark: '#170e0b', light: '#f3eee8' }; // --bg of each theme, for the browser UI
const html = document.documentElement;
let timer = 0;

// read by the R engine every frame (glyph colours)
export const theme = { mode: html.dataset.theme === 'light' ? 'light' : 'dark' };

// the browser UI colour; swup's head plugin puts the page's own <meta> back on every swap, so mount() calls this again
export function syncThemeMeta() {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[theme.mode]);
}

export function setTheme(mode, ease = true) {
  if (mode === theme.mode) return;
  if (ease && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    html.classList.add('is-theming');
    clearTimeout(timer);
    timer = setTimeout(() => html.classList.remove('is-theming'), FADE * 1000 + 50);
  }
  theme.mode = mode;
  html.dataset.theme = mode;
  syncThemeMeta();
}

// the theme a page asks for (root: the page's #swup)
export const pageTheme = (root = document) => (root.querySelector('[data-page-theme]')?.dataset.pageTheme === 'light' ? 'light' : 'dark');

// zones: the last one (in page order) whose top has passed 60% of the screen and whose bottom hasn't passed the middle
// wins; none: the page's base. Loading or landing inside one switches without easing.
export function initThemeZone(root = document) {
  const els = [...root.querySelectorAll('[data-theme-zone]')];
  if (!els.length) return null;
  const base = pageTheme(root);
  const sts = [];
  let ready = false;
  const pick = (ease) => {
    if (!ready) return; // onToggle can fire while the triggers are still being made
    const on = sts.filter((st) => st.isActive).pop();
    setTheme(on ? on.vars.trigger.dataset.themeZone : base, ease);
  };
  els.forEach((el) => sts.push(ScrollTrigger.create({ trigger: el, start: 'top 60%', end: 'bottom 50%', onToggle: () => pick(true) })));
  ready = true;
  pick(false);
  return () => sts.forEach((st) => st.kill());
}
