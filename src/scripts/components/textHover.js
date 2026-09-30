// Hover on [data-text-hover]: while the pointer is on it, the letters dim one after another from left to right; when
// it leaves they come back (also left to right). Nothing keeps playing after the pointer has left.
// Only on a real hover: the pointer has to come in from outside the element (so a cursor that happens to rest on it
// when the page loads doesn't trigger it), and focus only counts when it comes from the keyboard.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

const DIM = 0.3; // letter opacity while hovered

export function initTextHover(root = document) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const ac = new AbortController(), signal = ac.signal, splits = [];
  root.querySelectorAll('[data-text-hover]').forEach((el) => {
    const split = new SplitText(el.children.length ? [...el.children] : el, { type: 'chars' });
    splits.push(split);
    let outside = false;
    const dim = () => gsap.to(split.chars, { opacity: DIM, duration: 0.2, ease: 'power2.out', stagger: 0.007, overwrite: true });
    const undim = () => gsap.to(split.chars, { opacity: 1, duration: 0.3, ease: 'punch', stagger: 0.006, overwrite: true });
    // the pointer has been seen outside the element at least once since the page loaded
    addEventListener('pointermove', (e) => { if (!el.contains(e.target)) outside = true; }, { passive: true, signal });
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && outside) dim(); });
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') undim(); });
    el.addEventListener('focus', () => { if (el.matches(':focus-visible')) dim(); });
    el.addEventListener('blur', undim);
  });
  return () => { ac.abort(); splits.forEach((s) => s.revert()); };
}
