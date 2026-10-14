// Home's featured projects as an accordion of strips (sections/Projects.astro, _work-strips.css). Desktop (≥1024px):
// hovering or focusing a strip opens it (.is-open, the list .has-open), leaving the list closes it again; touch: the
// first tap on a closed strip opens it (the link waits), the second goes, a tap elsewhere closes it. Below 1024px the
// rows are plain links: nothing to do.
export function initWorkStrips(root = document) {
  const list = root.querySelector('[data-strips-list]');
  if (!list) return null;
  const items = [...list.querySelectorAll('[data-strip]')];
  const wide = matchMedia('(min-width: 1024px)');
  const ac = new AbortController(), on = { signal: ac.signal };
  let open = null;
  const set = (item) => {
    if (item === open) return;
    open = item;
    items.forEach((it) => it.classList.toggle('is-open', it === item));
    list.classList.toggle('has-open', !!item);
  };

  items.forEach((item) => {
    const link = item.querySelector('[data-strip-link]');
    item.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && wide.matches) set(item); }, on);
    link.addEventListener('focus', () => { if (wide.matches && link.matches(':focus-visible')) set(item); }, on); // keyboard only: a tap's focus must not count as its first tap
    link.addEventListener('blur', () => { if (wide.matches && !list.matches(':hover')) set(null); }, on);
    link.addEventListener('click', (e) => { if (wide.matches && open !== item) { e.preventDefault(); set(item); } }, on);
  });
  list.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && wide.matches && !list.contains(document.activeElement)) set(null); }, on);
  document.addEventListener('pointerdown', (e) => { if (wide.matches && !list.contains(e.target)) set(null); }, on);
  wide.addEventListener('change', () => set(null), on);

  return () => { ac.abort(); set(null); };
}
