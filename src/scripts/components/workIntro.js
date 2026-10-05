// /work title ([data-work-intro], sections/WorkIntro.astro): sticky in the middle of the screen; while the first half
// screen is scrolled it fades back to a soft background title (FADE), scrubbed with the scroll, so the project texts
// that pass over it stay readable.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const FADE = .3; // opacity once the projects are over it (still readable as the page's heading)

export function initWorkIntro(root = document) {
  const title = root.querySelector('[data-work-intro]');
  if (!title) return null;
  const tween = gsap.to(title, { opacity: FADE, ease: 'none', scrollTrigger: { start: 0, end: () => innerHeight * .5, scrub: true } });
  return () => { tween.scrollTrigger?.kill(); tween.kill(); gsap.set(title, { clearProps: 'opacity' }); };
}
