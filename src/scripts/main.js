// Script entry for every page (loaded from layouts/Base.astro).
// Once: eases, theme (light/dark), Lenis, cookie consent and the page transitions (global/pageTransitions.js: loader + swup).
// Per page: mount() below, run on the first load and again after every swup page swap; every init returns a cleanup
// (or nothing), and each does nothing when its element isn't on the page. unmount() runs the cleanups just before swup
// replaces the page.
// Order matters: the pinned projects before the R engine (the pin changes where the R anchors sit),
// text effects once the fonts are in (they split text into lines).
import './global/eases.js';
import { initSmoothScroll } from './global/lenis.js';
import { initSiteHeader } from './global/siteHeader.js';
import { initReveal } from './global/reveal.js';
import { initCookieConsent } from './global/cookieConsent.js';
import { initTheme, syncThemeMeta } from './global/theme.js';
import { initDebugGrid } from './global/debugGrid.js';
import { initPageTransitions } from './global/pageTransitions.js';
import { initScrollNext } from './components/scrollNext.js';
import { initMarquee } from './components/marquee.js';
import { initServices } from './components/services.js';
import { initContactForm } from './components/contactForm.js';
import { initWorkFilter } from './components/workFilter.js';
import { initFilter } from './components/filter.js';
import { initWorkIntro } from './components/workIntro.js';
import { initWorkLoop } from './components/workLoop.js';
import { initCardCursor } from './components/cardCursor.js';
import { initHighlight } from './components/highlightText.js';
import { initTextHover } from './components/textHover.js';
import { initREngine } from './r-journey/engine.js';

let cleanups = [], page = 0;

// every init only looks inside the page's own container (root)
function mount() {
  const id = ++page, root = document.getElementById('swup');
  syncThemeMeta();
  cleanups = [
    initSiteHeader(root),
    // one R per <canvas data-r-canvas>; data-r-scope limits it to part of the page (subpages: header + footer).
    // data-r-intro (home: the R, subpages: the header's) also plays the R in the page loader and page swaps.
    ...[...root.querySelectorAll('[data-r-canvas]')].map((canvas) => {
      const sel = canvas.dataset.rScope;
      return initREngine({ canvas, scope: sel ? root.querySelector(sel) : root, cull: !!sel, intro: canvas.hasAttribute('data-r-intro') });
    }),
    initScrollNext(root),
    initServices(root),
    initContactForm(root),
    initWorkFilter(root),
    initWorkLoop(root),
    initCardCursor(root),
    initFilter(root),
    initWorkIntro(root),
    initMarquee(root),
    initReveal(root),
    initDebugGrid(root),
  ];
  document.fonts.ready.then(() => {
    if (id !== page) return; // swapped away in the meantime
    cleanups.push(initHighlight(root), initTextHover(root));
  });
}

function unmount() {
  page++;
  cleanups.forEach((fn) => fn?.());
  cleanups = [];
}

initTheme();
initSmoothScroll();
initCookieConsent();
initPageTransitions({ mount, unmount });
