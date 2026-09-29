// Cookie consent (vanilla-cookieconsent v3), themed in styles/cookieconsent.css.
// Categories: "necessary" (always on) and "analytics" (off until accepted). No analytics script exists yet:
// when you add one, load it with <script type="text/plain" data-category="analytics" ...> so it only runs after consent.
// The footer button [data-cc="show-preferencesModal"] reopens the preferences.
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import '../styles/cookieconsent.css';
import * as CookieConsent from 'vanilla-cookieconsent';

export function initCookieConsent() {
  CookieConsent.run({
    guiOptions: {
      consentModal: { layout: 'box', position: 'bottom left', equalWeightButtons: true, flipButtons: false },
      preferencesModal: { layout: 'box', equalWeightButtons: true, flipButtons: false },
    },
    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: {},
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
