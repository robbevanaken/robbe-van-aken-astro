// Site header: hides on scroll down, returns on scroll up; full-screen menu on phones.
// Hooks: [data-site-header], [data-menu-toggle], [data-menu]. State classes: is-hidden, is-scrolled, is-open, html.is-menu-open.
// While the menu is open the rest of the page is inert (focus stays in the header + menu); Escape closes it and puts
// focus back on the toggle. A menu link to another page of the site keeps the menu open: only its items fade out
// (is-leaving) while the page transition fades everything; the next page arrives with a fresh, closed header.
// Returns a cleanup function (the header is part of every page swap).
import { getLenis } from './lenis.js';

export function initSiteHeader(root = document) {
  const header = root.querySelector('[data-site-header]');
  if (!header) return;
  const toggle = header.querySelector('[data-menu-toggle]');
  const menu = header.querySelector('[data-menu]');
  let lastY = scrollY, open = false;
  const ac = new AbortController(), signal = ac.signal;

  // hide on scroll down, show on scroll up (always shown near the top or while the menu is open)
  addEventListener('scroll', () => {
    const y = scrollY, dy = y - lastY;
    if (Math.abs(dy) < 4) return;
    header.classList.toggle('is-hidden', !open && dy > 0 && y > 120);
    header.classList.toggle('is-scrolled', y > 40);
    lastY = y;
  }, { passive: true, signal });

  // everything on the page next to the header (main, footer, canvases) and the skip link
  const rest = () => [...header.parentElement.children, ...document.querySelectorAll('[data-skip-link]')].filter((el) => el !== header);
  const setMenu = (v) => {
    open = v;
    rest().forEach((el) => { el.inert = v; });
    toggle.setAttribute('aria-expanded', String(v));
    header.classList.toggle('is-open', v);
    if (v) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-in')); }
    else { menu.classList.remove('is-in'); setTimeout(() => { if (!open) menu.hidden = true; }, 500); }
    document.documentElement.classList.toggle('is-menu-open', v);
    const lenis = getLenis(); if (lenis) v ? lenis.stop() : lenis.start();
  };
  toggle.addEventListener('click', () => setMenu(!open));
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const toOtherPage = a.origin === location.origin && !a.target && a.pathname !== location.pathname;
    if (toOtherPage) menu.classList.add('is-leaving'); else setMenu(false);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { setMenu(false); toggle.focus(); } }, { signal });

  return () => {
    ac.abort();
    if (open) { document.documentElement.classList.remove('is-menu-open'); rest().forEach((el) => { el.inert = false; }); getLenis()?.start(); }
  };
}
