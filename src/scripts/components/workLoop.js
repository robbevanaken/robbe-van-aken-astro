// /work: an endless list. Below the projects come copies of the visible ones ([data-fp-clone], same slots, rows
// continuing); once the first copy reaches the top of where the list starts, the page jumps back by exactly one list
// (the period P), so the same view shows and the list never ends. The DOM stays the same size. With Lenis the jump
// shifts its whole state (target, animated value, the running animation) so a smooth scroll goes on through it.
// Copies are aria-hidden with unfocusable links (screen readers and the keyboard get the list once) but clickable.
// Filtering (components/workFilter.js) dispatches "work:filter" on the list before it changes the cards (the copies go)
// and "work:filtered" after (they're rebuilt). Hooks: [data-fp-item] (the originals), [data-fp-clone].
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from '../global/lenis.js';

export function initWorkLoop(root = document) {
  const items = [...root.querySelectorAll('[data-fp-item]')];
  const list = items[0]?.parentElement;
  if (!list || !root.querySelector('[data-work-filter]')) return null; // /work only (the page with the filter)
  const ac = new AbortController();
  let clones = [], period = 0, busy = false;

  const clear = () => { clones.forEach((c) => c.remove()); clones = []; period = 0; };
  const build = () => {
    clear();
    const visible = items.filter((it) => !it.classList.contains('is-hidden'));
    if (!visible.length) return;
    // measure one list: from the first card to the first copy
    const make = (set) => visible.map((it, j) => {
      const c = it.cloneNode(true);
      c.removeAttribute('data-fp-item');
      c.setAttribute('data-fp-clone', '');
      c.setAttribute('aria-hidden', 'true');
      c.style.setProperty('--row', visible.length * set + j + 1);
      c.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
      list.append(c);
      return c;
    });
    clones = make(1);
    period = clones[0].getBoundingClientRect().top - visible[0].getBoundingClientRect().top;
    // enough copies to fill a screen below the jump point
    for (let set = 2; period > 0 && (set - 1) * period < period + innerHeight * 1.5; set++) clones.push(...make(set));
    ScrollTrigger.refresh();
  };

  const shift = (d) => {
    const l = getLenis();
    if (!l) { window.scrollTo(0, scrollY + d); return; }
    l.targetScroll += d; l.animatedScroll += d;
    if (l.animate) { l.animate.value += d; l.animate.from += d; l.animate.to += d; }
    l.setScroll(l.animatedScroll);
  };
  const onScroll = () => {
    if (busy || !period || !clones.length) return;
    const first = items.find((it) => !it.classList.contains('is-hidden'));
    const start = first.getBoundingClientRect().top + scrollY; // where the list starts on the page
    if (scrollY >= start + period) shift(-period);
  };

  addEventListener('scroll', onScroll, { passive: true, signal: ac.signal });
  list.addEventListener('work:filter', () => { busy = true; clear(); }, { signal: ac.signal });
  list.addEventListener('work:filtered', () => { build(); busy = false; }, { signal: ac.signal });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); }, { signal: ac.signal });
  document.fonts?.ready.then(() => { if (!ac.signal.aborted) build(); });
  build();

  return () => { ac.abort(); clearTimeout(rt); clear(); };
}
