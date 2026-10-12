// Home's projects as stacking cards (ProjectGlobe layout="stories", [data-stack-card], _stories.css), after Osmo's
// "Stacking cards parallax": while a card scrolls up over the one before it (from its top at the bottom of the screen
// to its top at the top), the one beneath sinks back at half the speed (yPercent 0 → 50, so it seems to stay behind),
// its image lifts a little (no rotation: tried, not needed), and its story fades back. Scrubbed with the scroll, flat (no 3D).
// Reduced motion: the cards just scroll.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initStackCards(root = document) {
  const cards = [...root.querySelectorAll('[data-stack-card]')];
  if (cards.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const tls = cards.slice(1).map((card, i) => {
    const prev = cards[i];
    const tl = gsap.timeline({
      defaults: { ease: 'none', duration: 1 },
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true },
    });
    tl.fromTo(prev, { yPercent: 0 }, { yPercent: 50 })
      .fromTo(prev.querySelector('[data-stack-card-media]'), { yPercent: 0 }, { yPercent: -12 }, '<')
      .fromTo(prev.querySelector('[data-stack-card-body]'), { autoAlpha: 1 }, { autoAlpha: .25 }, '<');
    return tl;
  });
  return () => tls.forEach((tl) => { tl.scrollTrigger?.kill(); tl.kill(); });
}
