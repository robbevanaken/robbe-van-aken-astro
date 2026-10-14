# Google Analytics: setup checklist

Already in the code: the GTM container `GTM-PHRBR9CS` (`layouts/Base.astro`, production builds only), consent mode v2
(denied by default, updated from the cookie banner in `global/cookieConsent.js`), `_ga*` cookies cleared when analytics
is switched off, the privacy notice naming Google Analytics, and a `page_view_swap` event pushed to `dataLayer` on
every page swap (`mount()` in `scripts/main.js`, with `page_path` and `page_title`). What's left happens in the GA and
GTM interfaces.

## 1. GA4 property (analytics.google.com)

- [ ] Admin → Create → Property; data stream: Web, `https://robbevanaken.be`
- [ ] Note the **Measurement ID** (`G-XXXXXXXXXX`)
- [ ] Data stream → **Enhanced measurement** → gear → switch **"Page changes based on browser history events" off**
      (the site changes pages without reloading and sends its own event; with this on every page counts twice)

## 2. GTM (tagmanager.google.com → container GTM-PHRBR9CS)

Variables (Variables → New → Data Layer Variable):

- [ ] `dlv - page_path`, variable name `page_path`
- [ ] `dlv - page_title`, variable name `page_title`

Tag A, the first page view:

- [ ] Type **Google Tag**, Tag ID: the `G-…`
- [ ] Trigger: **Initialization – All Pages**

Tag B, page swaps:

- [ ] Trigger: Triggers → New → **Custom Event**, event name `page_view_swap`
- [ ] Tag: **Google Analytics: GA4 Event**, Measurement ID: the same `G-…`, event name `page_view`
- [ ] Event parameters:
  - `page_location` → `{{Page URL}}`
  - `page_path` → `{{dlv - page_path}}`
  - `page_title` → `{{dlv - page_title}}`
- [ ] **Submit → Publish**

## 3. Test

- [ ] GTM doesn't load in `npm run dev`: test on the live site, or locally with `npm run build` + `npx serve dist`
- [ ] GTM → **Preview**, open the site, **accept analytics** in the cookie banner (without consent GTM doesn't load, on
      purpose)
- [ ] Click through to /work and a project: Tag Assistant shows `page_view_swap` with Tag B fired on every swap
- [ ] GA4 → **Reports → Realtime** shows the visits

## Later

- Anything else loaded through GTM goes into the privacy notice (`privacyPage` in `src/data/pages.ts`) and
  `src/data/cookies.ts` too.
