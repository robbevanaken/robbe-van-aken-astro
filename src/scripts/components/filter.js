// Filter menu (ui/Filter.astro): opens on hover (fine pointers; closes as soon as the pointer leaves), on click / tap
// of the toggle and when keyboard focus moves in; Escape closes it (focus back on the toggle). The box animates between its closed
// size (the toggle) and its open size (toggle + options) on the punch ease, the options fade up one by one. The toggle
// shows the chosen filter ("Filter: Design"; nothing for All). Selecting is done by components/workFilter.js.
// Hooks: [data-filter], [data-filter-box], [data-filter-inner], [data-filter-toggle], [data-filter-list],
// [data-filter-current], [data-work-filter] (data-label). State: .is-open.
import gsap from 'gsap';

export function initFilter(root = document) {
  const el = root.querySelector('[data-filter]');
  if (!el) return null;
  const box = el.querySelector('[data-filter-box]'), inner = el.querySelector('[data-filter-inner]');
  const toggle = el.querySelector('[data-filter-toggle]'), list = el.querySelector('[data-filter-list]');
  const current = el.querySelector('[data-filter-current]'), items = [...list.children];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ac = new AbortController(), on = { signal: ac.signal };
  let open = false;

  // open: the natural size of toggle + options; closed: the toggle's own natural width (it stretches across the open panel,
  // so it is measured at max-content: the box shrinks back after a long filter name was shown)
  const closedWidth = () => { toggle.style.width = 'max-content'; const w = toggle.offsetWidth; toggle.style.width = ''; return w; };
  const size = () => (open ? { width: inner.offsetWidth, height: inner.offsetHeight } : { width: closedWidth(), height: toggle.offsetHeight });
  const fit = (animate) => gsap.to(box, { ...size(), duration: animate && !reduce ? (open ? .8 : .55) : 0, ease: open ? 'punch' : 'power3.inOut', overwrite: true });

  const show = (v) => {
    if (v === open) return;
    open = v;
    el.classList.toggle('is-open', v);
    toggle.setAttribute('aria-expanded', String(v));
    list.inert = !v;
    fit(true);
    if (v) gsap.fromTo(items, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: reduce ? 0 : .5, ease: 'power3.out', stagger: reduce ? 0 : .045, delay: reduce ? 0 : .08, overwrite: true });
    else gsap.to(items, { opacity: 0, duration: reduce ? 0 : .18, overwrite: true });
  };

  if (canHover) {
    el.addEventListener('pointerenter', () => show(true), on);
    el.addEventListener('pointerleave', () => show(false), on);
  }
  toggle.addEventListener('click', () => show(!open), on);
  // keyboard focus opens it (a tap or click focuses too, but the click itself toggles: it would close again at once)
  el.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) show(true); }, on);
  el.addEventListener('focusout', (e) => { if (!el.contains(e.relatedTarget)) show(false); }, on);
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { show(false); toggle.focus(); } }, on);
  // the chosen filter in the toggle; touch: close after choosing
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-work-filter]');
    if (!b) return;
    current.textContent = b.dataset.workFilter === 'all' ? '' : `: ${b.dataset.label}`;
    if (!canHover) show(false); else fit(true);
  }, on);
  addEventListener('resize', () => fit(false), on);
  document.fonts?.ready.then(() => fit(false));
  fit(false);

  return () => { ac.abort(); gsap.killTweensOf([box, ...items]); };
}
