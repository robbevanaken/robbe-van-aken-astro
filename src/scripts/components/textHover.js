// Hover on [data-text-hover]: while the pointer is on it, the letters dim one after another from left to right; when
// it leaves they come back (also left to right). Nothing keeps playing after the pointer has left.
// Only on a real hover: the pointer has to come in from outside the element (so a cursor that happens to rest on it
// when the page loads doesn't trigger it), and focus only counts when it comes from the keyboard.
// data-text-hover="card": the hover (and focus) of the whole project card it sits in counts (/work's card titles).
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
    const trigger = (el.dataset.textHover === 'card' && el.closest('[data-fp-card]')) || el;
    let outside = false;
    const dim = () => gsap.to(split.chars, { opacity: DIM, duration: 0.2, ease: 'power2.out', stagger: 0.007, overwrite: true });
    const undim = () => gsap.to(split.chars, { opacity: 1, duration: 0.3, ease: 'punch', stagger: 0.006, overwrite: true });
    // the pointer has been seen outside the element at least once since the page loaded
    addEventListener('pointermove', (e) => { if (!trigger.contains(e.target)) outside = true; }, { passive: true, signal });
    trigger.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && outside) dim(); }, { signal });
    trigger.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') undim(); }, { signal });
    trigger.addEventListener('focus', () => { if (trigger.matches(':focus-visible')) dim(); }, { signal });
    trigger.addEventListener('blur', undim, { signal });
  });
  return () => { ac.abort(); splits.forEach((s) => s.revert()); };
}
