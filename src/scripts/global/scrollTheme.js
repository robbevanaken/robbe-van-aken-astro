// Section themes (after bymonolog.com): the page is light; while a dark chapter (.t-dark: the projects on home, the
// statement; the footer) sits on the middle of the screen, the whole page is dark. The switch is a fade, never a hard
// edge: setScrollTheme eases every colour token (global/theme.js) and the R blends its palette in the engine. Chapters
// that touch (statement → footer) read as one run. On arriving (and after a swap, which lands at the top) the theme is
// set instantly, so nothing fades on a fresh page. The wild theme pauses it (setScrollTheme ignores it).
// The zones are measured once (and again on resize / load / once everything has settled), so the scroll handler does
// no layout work at all: it compares cached ranges against scrollY, coalesced to one check per frame.
import { setScrollTheme } from './theme.js';

export function initScrollTheme(root = document) {
  const els = [...root.querySelectorAll('.t-dark, [data-site-footer]')];
  if (!els.length) { setScrollTheme('light', true); return; }
  const ac = new AbortController();
  let ranges = [], raf = 0, settle = 0;

  const measure = () => {
    ranges = els.map((el) => { const r = el.getBoundingClientRect(); return [r.top + scrollY, r.bottom + scrollY]; });
  };
  const check = () => {
    raf = 0;
    const y = scrollY + innerHeight * .55;
    setScrollTheme(ranges.some(([a, b]) => a <= y && b > y) ? 'dark' : 'light');
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
  const remeasure = () => { measure(); queue(); };

  addEventListener('scroll', queue, { passive: true, signal: ac.signal });
  addEventListener('resize', remeasure, { signal: ac.signal });
  addEventListener('load', remeasure, { once: true, signal: ac.signal });
  settle = setTimeout(remeasure, 1500); // fonts and images in: heights are final
  measure();
  const y = scrollY + innerHeight * .55;
  setScrollTheme(ranges.some(([a, b]) => a <= y && b > y) ? 'dark' : 'light', true);
  return () => { ac.abort(); cancelAnimationFrame(raf); clearTimeout(settle); };
}
