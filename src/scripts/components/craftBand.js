// The type band (sections/CraftBand.astro) sits exactly between the end of the services and "Recent work". Its top
// margin counts on --sb: how far below the services' last card the band's wrapper begins. CSS can only estimate it
// (the stage's bottom padding); on phones the cards end higher up in their pinned screen, by an amount that depends
// on the screen's height, so the gap above came out larger than the gap below. This measures it — the distance from
// the cards' foot to the services section's end, the same at any scroll position (both live in the stage or below it)
// — and refreshes ScrollTrigger when it changes, since everything after the band moves with it.
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initCraftBand(root = document) {
  const band = root.querySelector('.c-craft-band');
  const services = root.querySelector('[data-services]') || root.querySelector('.c-services');
  if (!band || !services) return null;
  const stage = services.querySelector('.c-services__stage'), pin = services.querySelector('[data-services-pin]');
  const items = [...services.querySelectorAll('.c-services__item')];
  if (!stage || !items.length) return null;
  const ac = new AbortController();
  let last = -1, t = 0;
  const measure = () => {
    const st = stage.getBoundingClientRect(), sec = services.getBoundingClientRect(), pn = (pin || stage).getBoundingClientRect();
    const foot = Math.max(...items.map((i) => i.getBoundingClientRect().bottom));
    // the cards' foot to the stage's foot (the stage ends on the pin's end once it lets go), then on to the section's end
    const sb = Math.max(0, (st.bottom - foot) + (sec.bottom - pn.bottom));
    if (Math.abs(sb - last) < 1) return;
    last = sb;
    band.style.setProperty('--sb', `${sb.toFixed(1)}px`);
    ScrollTrigger.refresh();
  };
  const later = () => { clearTimeout(t); t = setTimeout(measure, 200); };
  addEventListener('resize', later, { signal: ac.signal });
  document.fonts?.ready.then(later);
  later();
  return () => { ac.abort(); clearTimeout(t); band.style.removeProperty('--sb'); };
}
