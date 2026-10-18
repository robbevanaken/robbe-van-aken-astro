// Script entry for every page (loaded from layouts/Base.astro).
// Once: eases, theme (light/dark toggle), Lenis, cookie consent and the page transitions (global/pageTransitions.js: loader + swup).
// Per page: mount() below, run on the first load and again after every swup page swap; every init returns a cleanup
// (or nothing), and each does nothing when its element isn't on the page. unmount() runs the cleanups just before swup
// replaces the page.
// Order matters: the pinned projects before the R engine (the pin changes where the R anchors sit),
// text effects once the fonts are in (they split text into lines) and the page is visible (whenUncovered).
import './global/eases.js';
import { initSmoothScroll, getLenis } from './global/lenis.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSiteHeader } from './global/siteHeader.js';
import { initReveal } from './global/reveal.js';
import { initCookieConsent } from './global/cookieConsent.js';
import { initTheme, syncThemeMeta } from './global/theme.js';
import { initMusic } from './global/music.js';
import { initDebugGrid } from './global/debugGrid.js';
import { initPageTransitions } from './global/pageTransitions.js';
import { initScrollNext } from './components/scrollNext.js';
import { initMarquee } from './components/marquee.js';
import { initServices } from './components/services.js';
import { initCaseMotion } from './components/caseMotion.js';
import { initTitleFrame } from './components/titleFrame.js';
import { initLocalTime } from './components/localTime.js';
import { initScrollTheme } from './global/scrollTheme.js';
import { initSound } from './global/sound.js';
import { initPixelTrail } from './global/pixelTrail.js';
import { initContactModal } from './global/contactModal.js';
import { initStackCards } from './components/stackCards.js';
import { initPricing } from './components/pricing.js';
import { initWorkStrips } from './components/workStrips.js';
import { initWorkList } from './components/workList.js';
import { initFilter } from './components/filter.js';
import { initCraftBand } from './components/craftBand.js';
import { initPreviewFollower } from './components/previewFollower.js';
import { initContactForm } from './components/contactForm.js';
import { initMaskReveal } from './components/maskReveal.js';
import { initCardCursor } from './components/cardCursor.js';
import { initHighlight } from './components/highlightText.js';
import { initTextHover } from './components/textHover.js';
import { initREngine } from './r-journey/engine.js';

let cleanups = [], page = 0;

// resolves once the page isn't covered by a page swap (html.is-covered hides #swup with visibility:hidden). Text
// effects start after it: GSAP reads an element under visibility:hidden as opacity 0, so a highlight set up then would
// fade its letters out instead of in.
function whenUncovered() {
  const html = document.documentElement;
  if (!html.classList.contains('is-covered')) return Promise.resolve();
  return new Promise((resolve) => {
    const mo = new MutationObserver(() => { if (!html.classList.contains('is-covered')) { mo.disconnect(); resolve(); } });
    mo.observe(html, { attributes: true, attributeFilter: ['class'] });
  });
}

// every init only looks inside the page's own container (root)
function mount({ remount = false } = {}) {
  const id = ++page, root = document.getElementById('swup');
  // a page view for Google Analytics on every page swap (the first load counts itself via gtag's config); only once
  // analytics has been allowed (window.__ga is set by the tag in layouts/Base.astro), so nothing queues up before
  if (id > 1 && !remount && window.__ga && typeof window.gtag === 'function') window.gtag('event', 'page_view', { page_location: location.href, page_path: location.pathname, page_title: document.title });
  syncThemeMeta();
  cleanups = [
    initSiteHeader(root),
    // one R per <canvas data-r-canvas>; data-r-scope limits it to part of the page (subpages: header + footer).
    // data-r-intro (home: the R, subpages: the header's) also plays the R in the page loader and page swaps.
    ...[...root.querySelectorAll('[data-r-canvas]')].map((canvas) => {
      const sel = canvas.dataset.rScope;
      return initREngine({ canvas, scope: sel ? root.querySelector(sel) : root, cull: !!sel, intro: canvas.hasAttribute('data-r-intro'), char: canvas.dataset.rChar || '', turn: +(canvas.dataset.rTurn || 1), small: canvas.dataset.rSmall || undefined });
    }),
    initScrollNext(root),
    initServices(root),
    initCaseMotion(root),
    initTitleFrame(root),
    initLocalTime(root),
    initScrollTheme(root),
    initStackCards(root),
    initPricing(root),
    initWorkStrips(root),
    initWorkList(root),
    initFilter(root),
    initCraftBand(root),
    initPreviewFollower(root),
    initContactForm(root),
    initCardCursor(root),
    initMarquee(root),
    initReveal(root),
    initDebugGrid(root),
  ];
  Promise.all([document.fonts.ready, whenUncovered()]).then(() => {
    if (id !== page) return; // swapped away in the meantime
    cleanups.push(initHighlight(root), initTextHover(root), initMaskReveal(root));
  });
}

function unmount() {
  page++;
  cleanups.forEach((fn) => fn?.());
  cleanups = [];
}

initTheme();
initSound();
initPixelTrail();
initContactModal();

initMusic();
initSmoothScroll();
// the cookie banner waits for the first-visit loader to finish (it would sit on top of it)
if (document.documentElement.classList.contains('is-loading')) {
  const mo = new MutationObserver(() => { if (!document.documentElement.classList.contains('is-loading')) { mo.disconnect(); initCookieConsent(); } });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
} else initCookieConsent();
initPageTransitions({ mount, unmount });

// crossing a breakpoint (phone ↔ tablet ↔ desktop, by resizing or turning a tablet) remounts the page: several inits
// choose their behaviour once at setup (the pricing's pin and throw, the services' staircase vs the row, the strips'
// accordion, the pins' lengths), so a resize alone left them in the other layout's state. Unmount + mount puts every
// one in its own layout, the visitor stays on the same spot (same share of the page). Not while a page swap runs.
const BREAKPOINTS = ['(min-width: 640px)', '(min-width: 1024px)'];
let remountTimer = 0;
const remount = () => {
  const html = document.documentElement;
  if (html.classList.contains('is-transitioning') || html.classList.contains('is-loading')) { remountTimer = setTimeout(remount, 300); return; }
  const max = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const at = scrollY / max();
  unmount();
  mount({ remount: true });
  ScrollTrigger.refresh();
  const y = Math.round(at * max());
  getLenis()?.scrollTo(y, { immediate: true, force: true });
  if (!getLenis()) scrollTo(0, y);
};
const layout = () => BREAKPOINTS.map((q) => +matchMedia(q).matches).join('');
let shownLayout = layout();
// on resize (matchMedia's change events don't reach a page that isn't rendering, e.g. an inactive tab), settled
addEventListener('resize', () => {
  clearTimeout(remountTimer);
  remountTimer = setTimeout(() => { const now = layout(); if (now !== shownLayout) { shownLayout = now; remount(); } }, 250);
});
