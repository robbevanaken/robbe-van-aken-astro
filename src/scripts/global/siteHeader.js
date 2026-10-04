// Site header: hides on scroll down, returns on scroll up; full-screen menu on phones.
// Hooks: [data-site-header], [data-menu-toggle], [data-menu]. State classes: is-hidden, is-scrolled, is-open, html.is-menu-open.
// While the menu is open the rest of the page is inert (focus stays in the header + menu); Escape closes it and puts
// focus back on the toggle. The menu animates in (.is-in) and out (.is-out; styles/components/_site-header.css). A menu
// link to another page of the site plays the menu out and starts the page transition while that runs (LEAVE): the menu's
// background is the overlay's colour, so the two flow into each other; the next page arrives with a closed header.
// Returns a cleanup function (the header is part of every page swap).
import { getLenis } from './lenis.js';
import { navigate } from './pageTransitions.js';

const OUT = 650;   // ms the menu's out animation takes before it's hidden
const LEAVE = 340; // ms into the out animation the page transition starts (the rows are just about gone)

export function initSiteHeader(root = document) {
  const header = root.querySelector('[data-site-header]');
  if (!header) return;
  const toggle = header.querySelector('[data-menu-toggle]');
  const menu = header.querySelector('[data-menu]');
  let lastY = scrollY, open = false, hideTimer = 0;
  const ac = new AbortController(), signal = ac.signal;

  // hide on scroll down, show on scroll up (always shown near the top or while the menu is open)
  addEventListener('scroll', () => {
    const y = scrollY, dy = y - lastY;
    if (Math.abs(dy) < 4) return;
    // a jump of more than a screen is not the visitor scrolling (e.g. the endless list on /work looping back): keep the state
    if (Math.abs(dy) < innerHeight) header.classList.toggle('is-hidden', !open && dy > 0 && y > 120);
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
    clearTimeout(hideTimer);
    if (v) { menu.classList.remove('is-out'); menu.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-in'))); }
    else { menu.classList.remove('is-in'); menu.classList.add('is-out'); hideTimer = setTimeout(() => { if (!open) { menu.hidden = true; menu.classList.remove('is-out'); } }, OUT); }
    document.documentElement.classList.toggle('is-menu-open', v);
    const lenis = getLenis(); if (lenis) v ? lenis.stop() : lenis.start();
  };
  toggle.addEventListener('click', () => setMenu(!open));
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const toOtherPage = a.origin === location.origin && !a.target && a.pathname !== location.pathname;
    if (!toOtherPage) { setMenu(false); return; }
    // play the menu out, start the page transition while it runs (swup doesn't see this click: we navigate ourselves)
    e.preventDefault(); e.stopPropagation();
    menu.classList.remove('is-in'); menu.classList.add('is-out', 'is-leaving');
    document.documentElement.classList.remove('is-menu-open'); // the R may show again: it flies into the transition overlay
    setTimeout(() => navigate(a.href), LEAVE);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { setMenu(false); toggle.focus(); } }, { signal });

  return () => {
    ac.abort(); clearTimeout(hideTimer);
    if (open) { document.documentElement.classList.remove('is-menu-open'); rest().forEach((el) => { el.inert = false; }); getLenis()?.start(); }
  };
}
