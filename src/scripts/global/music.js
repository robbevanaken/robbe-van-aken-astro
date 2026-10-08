// Album of the week (ui/Music.astro): opens (.is-open) and closes the record. It's one link, so it works with every
// input:
// - mouse: opens on hover, a click goes to the album;
// - keyboard: opens on focus (Tab), Enter goes to the album, Escape closes it;
// - touch: the first tap opens it (the link waits), the second goes to the album; a tap anywhere else, scrolling on, or
//   Escape closes it. Screen readers get the whole name on the link at once (aria-label) and go straight through.
// It never opens by itself: the visitor is always in control. Outside #swup, so it runs once, not per page.

export function initMusic() {
  const el = document.querySelector('[data-music]');
  if (!el) return;
  let hover = false, focus = false, tapped = false, touch = false;
  const sync = () => el.classList.toggle('is-open', hover || focus || tapped);
  const close = () => { tapped = false; sync(); };

  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hover = true; sync(); } });
  el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hover = false; sync(); } });
  el.addEventListener('focus', () => { focus = el.matches(':focus-visible'); sync(); });
  el.addEventListener('blur', () => { focus = false; sync(); });
  // touch: remember how the coming click was started (a click event doesn't say)
  el.addEventListener('pointerdown', (e) => { touch = e.pointerType === 'touch' || e.pointerType === 'pen'; });
  el.addEventListener('click', (e) => {
    if (touch && !tapped) { e.preventDefault(); tapped = true; sync(); } // first tap: open, don't follow
    touch = false;
  });
  document.addEventListener('pointerdown', (e) => { if (tapped && !el.contains(e.target)) close(); });
  addEventListener('scroll', () => { if (tapped) close(); }, { passive: true });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('is-open')) { hover = false; close(); if (document.activeElement === el) { focus = false; sync(); } } });

}
