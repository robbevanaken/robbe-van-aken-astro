// /work filters ([data-work-filter]: "all" or a category, in the filter menu ui/Filter.astro) over the project cards
// ([data-fp-item] with data-tags "Development|Design", sections/ProjectGlobe.astro). The active filter has
// aria-pressed="true"; projects outside it get .is-hidden. The grid moves smoothly (GSAP Flip): cards that stay glide to
// their new place, leaving ones shrink and fade out, new ones grow in. The list's height eases from the old to the new
// one meanwhile (Flip takes the cards out of the flow while it runs, the page below would jump otherwise). Afterwards
// ScrollTrigger is refreshed (the page height changed). The page scrolls back to the top; the endless list
// (components/workLoop.js) drops its copies before ("work:filter") and rebuilds them after ("work:filtered").
// Reduced motion: instant.
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToY } from '../global/lenis.js';

gsap.registerPlugin(Flip, ScrollTrigger);

export function initWorkFilter(root = document) {
  const buttons = [...root.querySelectorAll('[data-work-filter]')];
  if (!buttons.length) return null;
  const items = [...root.querySelectorAll('[data-fp-item]')];
  const list = items[0]?.parentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ac = new AbortController();
  let flip = null;

  // the staggered list: every visible card gets its slot in the repeating pattern of four (.is-slot-0…3) and its own
  // row (--row), so the layout stays the same with fewer cards
  const layout = () => items.filter((it) => !it.classList.contains('is-hidden')).forEach((it, i) => {
    for (let s = 0; s < 4; s++) it.classList.toggle(`is-slot-${s}`, i % 4 === s);
    it.style.setProperty('--row', i + 1);
  });

  const apply = (key) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.workFilter === key)));
    const show = (it) => key === 'all' || (it.dataset.tags || '').split('|').includes(key);
    const done = () => { ScrollTrigger.refresh(); list.dispatchEvent(new Event('work:filtered')); }; // the endless list rebuilds its copies
    flip?.progress(1);
    list.dispatchEvent(new Event('work:filter')); // the endless list drops its copies first (components/workLoop.js)
    if (scrollY > 0) scrollToY(0, .8); // the filtered list from its start
    if (reduce) { items.forEach((it) => it.classList.toggle('is-hidden', !show(it))); layout(); done(); return; }
    const state = Flip.getState(items, { props: 'opacity' });
    const h0 = list.offsetHeight;
    items.forEach((it) => it.classList.toggle('is-hidden', !show(it)));
    layout();
    const h1 = list.offsetHeight;
    gsap.fromTo(list, { height: h0 }, { height: h1, duration: .8, ease: 'power3.inOut', overwrite: true, clearProps: 'height' });
    flip = Flip.from(state, {
      duration: .8, ease: 'power3.inOut', absolute: true, nested: true, // no scale: the slots change aspect ratio, sizes animate instead
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .6, ease: 'power3.out', delay: .2 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: .85, duration: .4, ease: 'power2.in' }),
      onComplete: done,
    });
  };

  buttons.forEach((b) => b.addEventListener('click', () => {
    if (b.getAttribute('aria-pressed') !== 'true') apply(b.dataset.workFilter);
  }, { signal: ac.signal }));

  return () => { ac.abort(); flip?.kill(); };
}
