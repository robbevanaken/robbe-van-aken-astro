// Marquee: a constant loop that speeds up while scrolling (up or down) and eases back to its base speed.
// Hooks: [data-marquee] on the band, [data-marquee-track] on the row (content is doubled, so -50% loops seamlessly).
import gsap from 'gsap';

const BASE = 1 / 30;   // base speed: half the track per 30 s
const BOOST = 0.012;   // extra speed per px/frame of scroll velocity
const MAX = 7;         // cap: at most 1 + MAX times the base speed

export function initMarquee() {
  const bands = [...document.querySelectorAll('[data-marquee]')];
  if (!bands.length) return null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = bands.map((el) => ({ track: el.querySelector('[data-marquee-track]'), x: 0, half: 0 }));
  const measure = () => items.forEach((m) => { m.half = m.track.scrollWidth / 2; });
  measure();
  addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
  const off = () => removeEventListener('resize', measure);
  if (reduce) return off;

  let lastY = scrollY, boost = 0;
  const tick = (time, dt) => {
    const v = Math.abs(scrollY - lastY) * (16.67 / Math.max(dt, 1)); // px per 60fps frame
    lastY = scrollY;
    const target = Math.min(v * BOOST * 60, MAX);
    boost += (target - boost) * (target > boost ? .25 : .05); // quick to speed up, slow to settle
    const step = (dt / 1000) * BASE * (1 + boost);
    items.forEach((m) => {
      if (!m.half) return;
      m.x = (m.x + step * m.half) % m.half;
      m.track.style.transform = `translate3d(${-m.x}px,0,0)`;
    });
  };
  gsap.ticker.add(tick);
  return () => { off(); gsap.ticker.remove(tick); };
}
