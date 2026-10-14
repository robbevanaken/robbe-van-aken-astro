# Google Analytics: setup checklist

In the code (since 14 Oct 2026): the GA4 tag `G-DHBL6P1E1P` loaded straight with gtag.js, no Tag Manager
(`layouts/Base.astro`, production builds only). It only loads once a visitor accepts analytics in the cookie banner:
consent mode v2 is denied by default and updated from the banner (`global/cookieConsent.js`), `_ga*` cookies are
cleared when analytics is switched off, and the privacy notice names Google Analytics. The first page view is sent by
gtag's `config`; every page swap sends its own `page_view` (`mount()` in `scripts/main.js`).

Don't paste the snippet GA shows ("Install manually") into the site: it's already in, behind the consent. Pasted as is
it would load before any consent and count every visit twice.

## In GA4 (analytics.google.com)

- [x] Property + web data stream for `https://robbevanaken.be`, Measurement ID `G-DHBL6P1E1P`
- [ ] Data stream → **Enhanced measurement** → gear → switch **"Page changes based on browser history events" off**
      (the site changes pages without reloading and sends its own page view; with this on every page counts twice)

## Test

- [x] Locally (`npm run build` + `npx serve dist`): nothing goes to Google before consent; after "Accept all" gtag.js
      loads and a hit is sent, and a page swap sends one more (checked 14 Oct 2026)
- [ ] On the live site: GA4 → **Reports → Realtime** shows the visits; click through a few pages

## GTM

- The GTM container `GTM-PHRBR9CS` is no longer used by the site: it can be deleted or left empty in
  tagmanager.google.com.
- Anything else added later (another analytics or ads tag) goes into the privacy notice (`privacyPage` in
  `src/data/pages.ts`) and `src/data/cookies.ts` too.
