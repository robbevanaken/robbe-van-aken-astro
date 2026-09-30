// Script entry for every page (loaded from layouts/Base.astro).
// Once: eases, Lenis, cookie consent and the page transitions (global/pageTransitions.js: loader + swup).
// Per page: mount() below, run on the first load and again after every swup page swap; every init returns a cleanup
// (or nothing), and each does nothing when its element isn't on the page.
// Order matters: the pinned projects before the R engine (the pin changes where the R anchors sit),
// text effects once the fonts are in (they split text into lines).
import './global/eases.js';
import { initSmoothScroll } from './global/lenis.js';
import { initSiteHeader } from './global/siteHeader.js';
import { initReveal } from './global/reveal.js';
import { initCookieConsent } from './global/cookieConsent.js';
import { initDebugGrid } from './global/debugGrid.js';
import { initPageTransitions } from './global/pageTransitions.js';
import { initFeaturedProjects } from './components/featuredProjects.js';
import { initScrollNext } from './components/scrollNext.js';
import { initMarquee } from './components/marquee.js';
import { initHighlight } from './components/highlightText.js';
import { initTextHover } from './components/textHover.js';
import { initREngine } from './r-journey/engine.js';

let cleanups = [], page = 0;

function mount() {
  const id = ++page;
  cleanups = [
    initSiteHeader(),
    initFeaturedProjects(),
    // one R per <canvas data-r-canvas>; data-r-scope limits it to part of the page (subpages: header + footer)
    ...[...document.querySelectorAll('[data-r-canvas]')].map((canvas) => {
      const sel = canvas.dataset.rScope;
      return initREngine({ canvas, scope: sel ? document.querySelector(sel) : document, cull: !!sel });
    }),
    initScrollNext(),
    initMarquee(),
    initReveal(),
    initDebugGrid(),
  ];
  document.fonts.ready.then(() => {
    if (id !== page) return; // swapped away in the meantime
    cleanups.push(initHighlight(), initTextHover());
  });
}

function unmount() {
  page++;
  cleanups.forEach((fn) => fn?.());
  cleanups = [];
}

initSmoothScroll();
initCookieConsent();
initPageTransitions({ mount, unmount });
