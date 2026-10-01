// Dev only: column overlay ([data-debug-grid], only rendered in `npm run dev`). Toggle with Shift+G, L or the HUD "Grid" button.
const KEY = 'rva-grid';

export function initDebugGrid(root = document) {
  const el = root.querySelector('[data-debug-grid]');
  if (!el) return;
  const btn = root.querySelector('#grid-toggle');
  const set = (on) => {
    el.classList.toggle('is-on', on);
    btn?.classList.toggle('is-off', !on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch {}
  };
  const ac = new AbortController();
  let on = false;
  try { on = localStorage.getItem(KEY) === '1'; } catch {}
  set(on);
  btn?.addEventListener('click', () => set(!el.classList.contains('is-on')));
  addEventListener('keydown', (e) => {
    const hit = e.key === 'l' || e.key === 'L' || (e.shiftKey && (e.key === 'G' || e.key === 'g'));
    if (hit && !e.target.closest('input,textarea')) set(!el.classList.contains('is-on'));
  }, { signal: ac.signal });
  return () => ac.abort();
}
