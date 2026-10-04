// "View project" on the cursor over a project card ([data-fp-card]; the text from data-cursor-label on
// [data-featured-projects]). One element for the whole visit, in <body> outside #swup (made on first use): it follows
// the pointer with a little lag (gsap.quickTo) and pops in / out on entering / leaving a card. Fine pointers only;
// reduced motion: no lag. Styles: styles/components/_card-cursor.css.
import gsap from 'gsap';

let el = null, label = null, moveX = null, moveY = null;

export function initCardCursor(root = document) {
  const section = root.querySelector('[data-featured-projects]');
  if (!section || !matchMedia('(hover: hover) and (pointer: fine)').matches) return null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!el) {
    el = document.createElement('div');
    el.className = 'c-card-cursor';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="c-card-cursor__inner u-text-ui"><span class="c-card-cursor__label"></span></span>';
    label = el.querySelector('.c-card-cursor__label');
    document.body.append(el);
    moveX = gsap.quickTo(el, 'x', { duration: reduce ? 0 : .45, ease: 'power3' });
    moveY = gsap.quickTo(el, 'y', { duration: reduce ? 0 : .45, ease: 'power3' });
  }
  label.textContent = section.dataset.cursorLabel || '';
  const ac = new AbortController(), on = { signal: ac.signal };
  let first = true;
  addEventListener('pointermove', (e) => {
    if (first) { gsap.set(el, { x: e.clientX, y: e.clientY }); first = false; } // no glide in from the corner
    moveX(e.clientX); moveY(e.clientY);
  }, { passive: true, signal: ac.signal });
  const card = (e) => e.target.closest?.('[data-fp-card]');
  section.addEventListener('pointerover', (e) => { if (card(e)) el.classList.add('is-on'); }, on);
  section.addEventListener('pointerout', (e) => { const c = card(e); if (c && !c.contains(e.relatedTarget)) el.classList.remove('is-on'); }, on);
  section.addEventListener('click', (e) => { if (card(e)) el.classList.remove('is-on'); }, on);
  return () => { ac.abort(); el.classList.remove('is-on'); };
}
