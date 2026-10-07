// Cookie consent (vanilla-cookieconsent v3), themed in styles/vendor/_cookieconsent.css.
// Categories: "necessary" (always on) and "analytics" (off until accepted): Google Tag Manager (layouts/Base.astro,
// production only) is a <script type="text/plain" data-category="analytics">, so it only runs after consent.
// The footer button [data-cookie-settings] reopens the preferences (delegated, so it keeps working after page swaps).
// The library and its CSS load on their own, once the browser is idle (they're not needed for the first paint).
import { cookies } from '../../data/cookies';
let lib = null;
// a category's cookies and storage (data/cookies.ts, the same list as the privacy notice) as the library's table
const table = (items) => ({
  headers: { name: 'Name', text: 'What for', kept: 'Kept' },
  body: items.map(({ name, text, kept }) => ({ name, text, kept })),
});
// its CSS: a copy in public/vendor (CSS is inlined in the pages, which a lazily imported stylesheet can't be); update the
// copy with the library (node_modules/vanilla-cookieconsent/dist/cookieconsent.css)
const css = () => new Promise((resolve) => {
  if (document.querySelector('link[data-cc-css]')) return resolve();
  const l = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: '/vendor/cookieconsent.css', onload: resolve, onerror: resolve });
  l.dataset.ccCss = ''; l.dataset.swupTheme = ''; document.head.append(l); // data-swup-theme: swup's head plugin keeps it on page swaps
});
const load = () => (lib ??= Promise.all([import('vanilla-cookieconsent'), css()]).then(([m]) => m));

export function initCookieConsent() {
  document.addEventListener('click', async (e) => { if (e.target.closest('[data-cookie-settings]')) (await load()).showPreferences(); });
  const start = () => load().then(run);
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2500 }); else setTimeout(start, 1200);
}

function run(CookieConsent) {
  // Google consent mode v2 (the defaults, all denied, are set in layouts/Base.astro): follow the visitor's choice
  const consent = () => {
    if (typeof window.gtag !== 'function') return;
    const yes = CookieConsent.acceptedCategory('analytics') ? 'granted' : 'denied';
    window.gtag('consent', 'update', { analytics_storage: yes });
  };
  CookieConsent.run({
    onConsent: consent,
    onChange: ({ changedCategories }) => {
      consent();
      // analytics switched off again: reload, so the tags that already ran are gone
      if (changedCategories.includes('analytics') && !CookieConsent.acceptedCategory('analytics')) location.reload();
    },
    guiOptions: {
      consentModal: { layout: 'box', position: 'bottom left', equalWeightButtons: true, flipButtons: false },
      preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false },
    },
    categories: {
      necessary: { enabled: true, readOnly: true },
      // Google Tag Manager (production only, layouts/Base.astro); its cookies are cleared when analytics is switched off
      analytics: { autoClear: { cookies: [{ name: /^_ga/ }] } }, // GA4 sets _ga and _ga_<id> (data/cookies.ts)
    },
    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            title: 'Cookies',
            description: 'This site uses a few cookies to work properly. With your permission I also use analytics to see how the site is used. You can change this at any time.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Only necessary',
            showPreferencesBtn: 'Preferences',
            footer: '<a href="/privacy">Privacy notice</a>',
          },
          preferencesModal: {
            title: 'Cookie preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Only necessary',
            savePreferencesBtn: 'Save preferences',
            closeIconLabel: 'Close',
            sections: [
              { description: 'Choose which cookies you allow. Necessary cookies are always on because the site needs them.' },
              { title: 'Necessary', description: 'Needed for the site to work: your cookie choice, your theme and whether the opening animation has played. Nothing here is used to track you.', linkedCategory: 'necessary', cookieTable: table(cookies.necessary) },
              { title: 'Analytics', description: 'Google Analytics, loaded through Google Tag Manager: shows me how the site is used (pages visited, rough location, device), never who you are. Only set when you allow it.', linkedCategory: 'analytics', cookieTable: table(cookies.analytics) },
              { title: 'More information', description: 'Read the <a href="/privacy">privacy notice</a> or mail me with any questions.' },
            ],
          },
        },
      },
    },
  });
}
