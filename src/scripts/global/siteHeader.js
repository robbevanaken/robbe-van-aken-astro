// Site header: hides on scroll down, returns on scroll up; full-screen menu on phones.
// Hooks: [data-site-header], [data-menu-toggle], [data-menu]. State classes: is-hidden, is-scrolled, is-open, html.is-menu-open.
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

  const setMenu = (v) => {
    open = v;
    toggle.setAttribute('aria-expanded', String(v));
    header.classList.toggle('is-open', v);
    if (v) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-in')); }
    else { menu.classList.remove('is-in'); setTimeout(() => { if (!open) menu.hidden = true; }, 500); }
    document.documentElement.classList.toggle('is-menu-open', v);
    const lenis = getLenis(); if (lenis) v ? lenis.stop() : lenis.start();
  };
  toggle.addEventListener('click', () => setMenu(!open));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setMenu(false); }, { signal });

  return () => {
    ac.abort();
    if (open) { document.documentElement.classList.remove('is-menu-open'); getLenis()?.start(); }
  };
}
