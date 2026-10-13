// The statement's arrival (sections/Statement.astro, [data-statement]). It flows — no pin (tried: a scrubbed
// 2.3-screen pinned moment; after the held services stage, two sparse pinned screens in a row read as empty) — and
// reveals as it comes in: the GIFs open from their centre, in turn, while the words arrive as a masked reveal (after
// Osmo's "Masked text reveal"): each line's own box is the mask (overflow hidden in _statement.css) and every part
// slides up through its bottom edge on expo.out, a light cascade. Each part travels its own measured distance to just
// past the mask's edge (a small word shifted by its own height would still peek inside the tall line box), so
// everything really starts from nothing. Scrolling back out above plays its own exit: the parts slip back down behind
// the mask and the GIFs close again (power3.inOut), then the arrival can fire again. Reduced motion: nothing moves
// (the CSS shows everything).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initStatementReveal(root = document) {
  const sec = root.querySelector('[data-statement]');
  if (!sec || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const loops = [...sec.querySelectorAll('[data-statement-loop]')];
  const parts = [...sec.querySelectorAll('.c-statement__line')].flatMap((l) => [...l.children].filter((k) => !k.hasAttribute('data-statement-loop')));
  const D = new Map(); // per part: how far down it must sit to clear the mask's bottom edge
  const measure = () => parts.forEach((k) => {
    const held = gsap.getProperty(k, 'y');
    gsap.set(k, { y: 0 });
    D.set(k, k.parentElement.getBoundingClientRect().bottom - k.getBoundingClientRect().top + 4);
    gsap.set(k, { y: held });
  });
  measure();
  const closed = { autoAlpha: 0, clipPath: 'inset(50% 50% 50% 50%)' };
  gsap.set(parts, { y: (i, k) => D.get(k) });
  gsap.set(loops, closed);
  let anim = null;
  const show = () => {
    anim?.kill(); anim = gsap.timeline();
    loops.forEach((g, i) => anim.to(g, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'expo.out' }, i * .09));
    parts.forEach((k, i) => anim.to(k, { y: 0, duration: .9, ease: 'expo.out' }, .12 + i * .08));
  };
  const hide = () => {
    anim?.kill(); anim = gsap.timeline();
    parts.forEach((k, i) => anim.to(k, { y: () => D.get(k), duration: .55, ease: 'power3.inOut' }, i * .035));
    loops.forEach((g, i) => anim.to(g, { ...closed, duration: .45, ease: 'power3.inOut' }, .1 + i * .03));
  };
  const st = ScrollTrigger.create({
    trigger: sec, start: 'top 65%', end: 'bottom top',
    onEnter: show, onLeaveBack: hide,
    onRefreshInit: () => gsap.set(parts, { y: 0 }),
    onRefresh: (self) => {
      measure();
      if (!anim || !anim.isActive()) {
        const inView = self.progress > 0;
        gsap.set(parts, { y: (i, k) => (inView ? 0 : D.get(k)) });
        gsap.set(loops, inView ? { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)' } : closed);
      }
    },
  });
  return () => { st.kill(); anim?.kill(); gsap.set(parts, { clearProps: 'transform' }); gsap.set(loops, { clearProps: 'all' }); };
}
