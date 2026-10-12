// The statement as a pinned moment (sections/Statement.astro, [data-statement-pin]): scrubbed with the scroll, first
// ONLY the GIFs open from their centre, in turn, standing on their final spots as the screen pins. Then the words
// arrive as a masked reveal (after Osmo's "Masked text reveal"): each line's own box is the mask (overflow hidden in
// _statement.css) and every part slides up through its bottom edge on expo.out, a time-based cascade fired once the
// pin has landed. Each part travels its own measured distance to just past the mask's edge (a small word shifted by
// its own height would still peek inside the tall line box), so everything really starts from nothing. Scrolling back
// out above plays its own exit: the parts slip back down behind the mask (power3.inOut, a light cascade), then the
// arrival can fire again. Reduced motion: nothing (the CSS shows everything, unpinned).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initStatementPin(root = document) {
  const sec = root.querySelector('[data-statement-pin]');
  if (!sec || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // 1: the GIFs alone, opening from their centre, eased against the scroll (scrub with a lag: wheel steps never jerk)
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: sec, start: 'top 70%', end: 'bottom bottom', scrub: 1.2, invalidateOnRefresh: true },
  });
  [...sec.querySelectorAll('[data-statement-loop]')].forEach((g, i) =>
    tl.fromTo(g, { autoAlpha: 0, clipPath: 'inset(50% 50% 50% 50%)' }, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: .18, ease: 'power1.out' }, .02 + i * .06));
  tl.to({}, { duration: .2 }, .8); // the scrub holds the pin's length

  // 2: the words, through their line's mask
  const parts = [...sec.querySelectorAll('.c-statement__line')].flatMap((l) => [...l.children].filter((k) => !k.hasAttribute('data-statement-loop')));
  const D = new Map(); // per part: how far down it must sit to clear the mask's bottom edge
  const measure = () => parts.forEach((k) => {
    const held = gsap.getProperty(k, 'y');
    gsap.set(k, { y: 0 });
    D.set(k, k.parentElement.getBoundingClientRect().bottom - k.getBoundingClientRect().top + 4);
    gsap.set(k, { y: held });
  });
  measure();
  gsap.set(parts, { y: (i, k) => D.get(k) });
  let anim = null, shown = false;
  const show = () => { anim?.kill(); shown = true; anim = gsap.timeline(); parts.forEach((k, i) => anim.to(k, { y: 0, duration: .9, ease: 'expo.out' }, i * .08)); };
  const hide = () => { anim?.kill(); shown = false; anim = gsap.timeline(); parts.forEach((k, i) => anim.to(k, { y: () => D.get(k), duration: .55, ease: 'power3.inOut' }, i * .035)); };
  const st = ScrollTrigger.create({
    trigger: sec, start: 'top -8%', end: 'bottom top',
    onEnter: show, onLeaveBack: hide,
    onRefreshInit: () => gsap.set(parts, { y: 0 }),
    onRefresh: (self) => { measure(); if (!anim || !anim.isActive()) gsap.set(parts, { y: (i, k) => (self.progress > 0 ? 0 : D.get(k)) }); },
  });
  return () => { st.kill(); anim?.kill(); tl.scrollTrigger?.kill(); tl.kill(); gsap.set(parts, { clearProps: 'transform' }); };
}
