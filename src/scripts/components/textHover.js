// Hover on [data-text-hover]: the text reveal played in reverse, as a wave. The letters dim one after another
// (right to left) and come straight back, so the text is fully readable again when the wave has passed.
// Only on a real hover: the pointer has to come in from outside the element (so a cursor that happens to rest on it
// when the page loads doesn't trigger it), and focus only counts when it comes from the keyboard.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

export function initTextHover(root = document) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const ac = new AbortController(), signal = ac.signal, splits = [];
  root.querySelectorAll('[data-text-hover]').forEach((el) => {
    const split = new SplitText(el.children.length ? [...el.children] : el, { type: 'chars' });
    splits.push(split);
    let tl = null, outside = false;
    const play = () => {
      if (tl && tl.isActive()) return;
      tl = gsap.timeline()
        .to(split.chars, { opacity: 0.2, duration: 0.18, ease: 'power1.out', stagger: { each: 0.018, from: 'end' } })
        .to(split.chars, { opacity: 1, duration: 0.45, ease: 'punch', stagger: { each: 0.018, from: 'end' } }, 0.16);
    };
    // the pointer has been seen outside the element at least once since the page loaded
    addEventListener('pointermove', (e) => { if (!el.contains(e.target)) outside = true; }, { passive: true, signal });
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && outside) play(); });
    el.addEventListener('focus', () => { if (el.matches(':focus-visible')) play(); });
  });
  return () => { ac.abort(); splits.forEach((s) => s.revert()); };
}
