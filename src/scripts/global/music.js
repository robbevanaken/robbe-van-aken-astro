// Album of the week (ui/Music.astro): opens (.is-open) and closes the record. It's one link, so it works with every
// input:
// - mouse: opens on hover, a click goes to the album;
// - keyboard: opens on focus (Tab), Enter goes to the album, Escape closes it;
// - touch: the first tap opens it (the link waits), the second goes to the album; a tap anywhere else, scrolling on, or
//   Escape closes it. Screen readers get the whole name on the link at once (aria-label) and go straight through.
// Once per page load it also opens by itself for a few seconds, a moment after the loader (not on phones on /work,
// where the filter sits fixed at the bottom). Outside #swup, so it runs once, not per page. Reduced motion: no peek.
const DELAY = 1800, SHOW = 3600; // ms

export function initMusic() {
  const el = document.querySelector('[data-music]');
  if (!el) return;
  const html = document.documentElement;
  let hover = false, focus = false, tapped = false, peeking = false, touch = false, peekTimer = 0;
  const sync = () => el.classList.toggle('is-open', hover || focus || tapped || peeking);
  const close = () => { tapped = false; peeking = false; clearTimeout(peekTimer); sync(); };

  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hover = true; sync(); } });
  el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hover = false; peeking = false; sync(); } });
  el.addEventListener('focus', () => { focus = el.matches(':focus-visible'); sync(); });
  el.addEventListener('blur', () => { focus = false; sync(); });
  // touch: remember how the coming click was started (a click event doesn't say)
  el.addEventListener('pointerdown', (e) => { touch = e.pointerType === 'touch' || e.pointerType === 'pen'; });
  el.addEventListener('click', (e) => {
    if (touch && !tapped) { e.preventDefault(); tapped = true; peeking = false; sync(); } // first tap: open, don't follow
    touch = false;
  });
  document.addEventListener('pointerdown', (e) => { if (tapped && !el.contains(e.target)) close(); });
  addEventListener('scroll', () => { if (tapped) close(); }, { passive: true });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('is-open')) { hover = false; close(); if (document.activeElement === el) { focus = false; sync(); } } });

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const peek = () => {
    if (html.classList.contains('show--consent')) return; // the cookie banner is up (the record hides meanwhile)
    if (matchMedia('(max-width: 639px)').matches) return; // phones: the record lives in the menu there (layout/Nav.astro)
    peeking = true; sync();
    peekTimer = setTimeout(() => { peeking = false; sync(); }, SHOW);
  };
  const start = () => setTimeout(peek, DELAY);
  if (!html.classList.contains('is-loading')) return start();
  const mo = new MutationObserver(() => { if (!html.classList.contains('is-loading')) { mo.disconnect(); start(); } });
  mo.observe(html, { attributes: true, attributeFilter: ['class'] });
}
