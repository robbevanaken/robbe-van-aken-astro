// Home: the page's background eases to --panel while the featured projects are on screen (their section from its top to
// its bottom, at the middle of the screen) and back to the page colour after: html.is-tinted switches --page, and
// html.is-tint-easing transitions it (styles/base/_document.css). Not on load inside the zone: no ease then.
// Hook: [data-page-tint] (the section).
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initPageTint(root = document) {
  const el = root.querySelector('[data-page-tint]');
  if (!el) return null;
  const html = document.documentElement;
  html.classList.add('is-tint-easing');
  const st = ScrollTrigger.create({ trigger: el, start: 'top 50%', end: 'bottom 50%', onToggle: (self) => html.classList.toggle('is-tinted', self.isActive) });
  if (st.isActive) { html.classList.remove('is-tint-easing'); html.classList.add('is-tinted'); requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('is-tint-easing'))); }
  return () => { st.kill(); html.classList.remove('is-tinted', 'is-tint-easing'); };
}
