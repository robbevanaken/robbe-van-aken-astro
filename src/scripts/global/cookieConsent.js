// Cookie consent (vanilla-cookieconsent v3), themed in styles/vendor/_cookieconsent.css.
// Categories: "necessary" (always on) and "analytics" (off until accepted): Google Tag Manager (layouts/Base.astro,
// production only) is a <script type="text/plain" data-category="analytics">, so it only runs after consent.
// The footer button [data-cookie-settings] reopens the preferences (delegated, so it keeps working after page swaps).
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import * as CookieConsent from 'vanilla-cookieconsent';

export function initCookieConsent() {
  document.addEventListener('click', (e) => { if (e.target.closest('[data-cookie-settings]')) CookieConsent.showPreferences(); });
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
      analytics: { autoClear: { cookies: [{ name: /^_ga/ }, { name: '_gid' }] } },
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
              { title: 'Necessary', description: 'Needed for the site to work, for example to remember your cookie choice.', linkedCategory: 'necessary' },
              { title: 'Analytics', description: 'Help me understand how visitors use the site. Only set when you allow it.', linkedCategory: 'analytics' },
              { title: 'More information', description: 'Read the <a href="/privacy">privacy notice</a> or mail me with any questions.' },
            ],
          },
        },
      },
    },
  });
}
