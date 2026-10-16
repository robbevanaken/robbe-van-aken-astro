// /work: an endless list. Below the projects come copies of the visible ones ([data-fp-clone], same slots, rows
// continuing); once the first copy reaches the top of where the list starts, the page jumps back by exactly one list
// (the period P), so the same view shows and the list never ends. The DOM stays the same size. With Lenis the jump
// shifts its whole state (target, animated value, the running animation) so a smooth scroll goes on through it.
// Copies are aria-hidden with unfocusable links (screen readers and the keyboard get the list once) but clickable.
// Only while "All" is chosen: with a filter active the list just ends and the footer follows (with the loop it sits
// below the copies, which the jump never reaches). Filtering (components/workFilter.js) dispatches "work:filter" on the list before it changes the cards (the copies go)
// and "work:filtered" after (they're rebuilt). Hooks: [data-fp-item] (the originals), [data-fp-clone].
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from '../global/lenis.js';

export function initWorkLoop(root = document) {
  const items = [...root.querySelectorAll('[data-fp-item]')];
  const list = items[0]?.parentElement;
  if (!list || !root.querySelector('[data-work-filter]')) return null; // /work only (the page with the filter)
  const ac = new AbortController();
  let clones = [], period = 0, busy = false, sets = 0;
  // touch: the scroll is native (Lenis leaves touch alone) and a jump in the middle of a fling stutters or kills its
  // momentum (iOS), so there the page only jumps once the scroll has come to rest, finger lifted: more copies below
  // give a fling room to run (BUFFER screens), and only running out of them jumps mid-scroll
  const touch = matchMedia('(pointer: coarse)').matches, BUFFER = touch ? 4 : 1.5;
  let down = false, idle = 0, lastW = innerWidth;

  const clear = () => { clones.forEach((c) => c.remove()); clones = []; period = 0; };
  const build = () => {
    clear(); sets = 0;
    // only with "All": a filtered list simply ends
    if (!root.querySelector('[data-work-filter="all"][aria-pressed="true"]')) { ScrollTrigger.refresh(); return; }
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
    let set = 2;
    for (; period > 0 && (set - 1) * period < period + innerHeight * BUFFER; set++) clones.push(...make(set));
    sets = set - 1;
    ScrollTrigger.refresh();
  };

  const shift = (d) => {
    const l = getLenis();
    if (!l) { window.scrollTo(0, scrollY + d); return; }
    l.targetScroll += d; l.animatedScroll += d;
    if (l.animate) { l.animate.value += d; l.animate.from += d; l.animate.to += d; }
    l.setScroll(l.animatedScroll);
  };
  const start = () => items.find((it) => !it.classList.contains('is-hidden')).getBoundingClientRect().top + scrollY; // where the list starts on the page
  const jump = () => { // back by whole lists, to the same view in the first one
    if (busy || !period || !clones.length) return;
    const n = Math.floor((scrollY - start()) / period);
    if (n >= 1) shift(-n * period);
  };
  const onScroll = () => {
    if (busy || !period || !clones.length) return;
    if (!touch) { if (scrollY >= start() + period) shift(-period); return; }
    clearTimeout(idle); idle = setTimeout(() => { if (!down) jump(); }, 160);
    if (scrollY >= start() + period * (sets - .5)) jump(); // a fling running out of copies: jump anyway
  };

  addEventListener('scroll', onScroll, { passive: true, signal: ac.signal });
  if (touch) {
    addEventListener('scrollend', () => { if (!down) jump(); }, { signal: ac.signal });
    addEventListener('touchstart', () => { down = true; }, { passive: true, signal: ac.signal });
    addEventListener('touchend', () => { down = false; clearTimeout(idle); idle = setTimeout(jump, 160); }, { passive: true, signal: ac.signal });
  }
  list.addEventListener('work:filter', () => { busy = true; clear(); }, { signal: ac.signal });
  list.addEventListener('work:filtered', () => { build(); busy = false; }, { signal: ac.signal });
  let rt = 0;
  // only a real width change rebuilds: on phones the toolbar sliding in and out fires resize while scrolling, and a
  // rebuild (copies + ScrollTrigger.refresh) there made the list stutter
  addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rt); rt = setTimeout(build, 200); }, { signal: ac.signal });
  document.fonts?.ready.then(() => { if (!ac.signal.aborted) build(); });
  build();

  return () => { ac.abort(); clearTimeout(rt); clearTimeout(idle); clear(); };
}
