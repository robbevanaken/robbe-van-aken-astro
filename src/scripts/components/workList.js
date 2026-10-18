// Home's projects filter ([data-work], sections/Work.astro): the filter menu's options ([data-work-filter],
// ui/Filter.astro; open / close: components/filter.js) choose a category; the rows outside it fold away (their height
// to nothing, fading), the ones in it unfold, the first one standing drops its dashed line (.is-lead), the numbers
// ("01 / 04") and the count follow, and ScrollTrigger re-measures the page once it's done (the R's stages below moved).
// If the list's top had scrolled out of view, the page comes back to it. Reduced motion: instant.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToY } from '../global/lenis.js';

export function initWorkList(root = document) {
  const section = root.querySelector('[data-work]');
  if (!section) return null;
  const items = [...section.querySelectorAll('[data-work-item]')], buttons = [...section.querySelectorAll('[data-work-filter]')];
  const count = section.querySelector('[data-work-count]'), list = items[0]?.parentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');
  const ac = new AbortController();
  let tl = null;
  // the rows' images load once the page is idle (lazy, they started only as they came near: the reveal then opened on
  // a box still loading)
  const eager = () => section.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
  if (document.readyState === 'complete') idle(eager); else addEventListener('load', () => idle(eager), { once: true, signal: ac.signal });

  const number = (show) => {
    items.forEach((it) => it.classList.remove('is-lead'));
    show[0]?.classList.add('is-lead');
    show.forEach((it, j) => { const n = it.querySelector('[data-work-n]'), t = it.querySelector('[data-work-total]'); if (n) n.textContent = pad(j + 1); if (t) t.textContent = pad(show.length); });
    if (count) count.textContent = pad(show.length);
  };
  const apply = (key) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.workFilter === key)));
    const show = items.filter((it) => key === 'all' || (it.dataset.tags || '').split('|').includes(key));
    const hide = items.filter((it) => !show.includes(it));
    tl?.progress(1);
    const done = () => { ScrollTrigger.refresh(); const top = list.getBoundingClientRect().top; if (top < 0) scrollToY(scrollY + top - innerHeight * .25, .8); };
    if (reduce) { hide.forEach((it) => { it.hidden = true; }); show.forEach((it) => { it.hidden = false; }); number(show); done(); return; }
    const leaving = hide.filter((it) => !it.hidden), coming = show.filter((it) => it.hidden);
    tl = gsap.timeline({ onComplete: done });
    // out: fade, then fold to nothing (with the line and the gap it carries)
    if (leaving.length) tl.to(leaving, { opacity: 0, duration: .25, ease: 'power1.out' })
      .to(leaving, { height: 0, marginTop: 0, paddingTop: 0, duration: .55, ease: 'power3.inOut', onComplete: () => leaving.forEach((it) => { it.hidden = true; gsap.set(it, { clearProps: 'all' }); }) });
    tl.add(() => number(show));
    // in: unfold from nothing, then fade up
    if (coming.length) tl.add(() => {
      coming.forEach((it) => { it.hidden = false; });
      number(show);
      coming.forEach((it) => { const h = it.offsetHeight, cs = getComputedStyle(it); gsap.fromTo(it, { height: 0, marginTop: 0, paddingTop: 0, opacity: 0 },
        { height: h, marginTop: cs.marginTop, paddingTop: cs.paddingTop, duration: .6, ease: 'power3.inOut', onComplete: () => gsap.to(it, { opacity: 1, duration: .35, clearProps: 'all' }) }); });
    }).to({}, { duration: .95 });
  };

  buttons.forEach((b) => b.addEventListener('click', () => { if (b.getAttribute('aria-pressed') !== 'true') apply(b.dataset.workFilter); }, { signal: ac.signal }));
  return () => { ac.abort(); tl?.kill(); };
}
