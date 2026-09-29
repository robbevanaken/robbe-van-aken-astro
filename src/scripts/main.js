// Script entry for every page (loaded from layouts/Base.astro). Each init does nothing when its element isn't on the page.
// Order matters: Lenis first, the pinned projects before the R engine (the pin changes where the R anchors sit),
// text effects once the fonts are in (they split text into lines).
import './global/eases.js';
import { initSmoothScroll } from './global/lenis.js';
import { initSiteHeader } from './global/siteHeader.js';
import { initReveal } from './global/reveal.js';
import { initCookieConsent } from './global/cookieConsent.js';
import { initDebugGrid } from './global/debugGrid.js';
import { initFeaturedProjects } from './components/featuredProjects.js';
import { initScrollNext } from './components/scrollNext.js';
import { initMarquee } from './components/marquee.js';
import { initHighlight } from './components/highlightText.js';
import { initREngine } from './r-journey/engine.js';

initSmoothScroll();
initSiteHeader();
initFeaturedProjects();
// one R per <canvas data-r-canvas>; data-r-scope limits it to part of the page (subpages: header + footer)
document.querySelectorAll('[data-r-canvas]').forEach((canvas) => {
  const sel = canvas.dataset.rScope;
  initREngine({ canvas, scope: sel ? document.querySelector(sel) : document, cull: !!sel });
});
initScrollNext();
initMarquee();
initReveal();
initDebugGrid();
initCookieConsent();
document.fonts.ready.then(initHighlight);
