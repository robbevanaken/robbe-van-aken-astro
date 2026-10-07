// Everything the site stores in the visitor's browser, per consent category. One list for both the cookie preferences
// (scripts/global/cookieConsent.js, a table per category) and the privacy notice (privacyPage in pages.ts): keep it in
// step with what the site really does.
export interface StoredItem { name: string; text: string; kept: string }

export const cookies: Record<'necessary' | 'analytics', StoredItem[]> = {
  necessary: [
    { name: 'cc_cookie', text: 'Remembers your cookie choice, so the banner does not come back on every page.', kept: '6 months' },
    { name: 'mode', text: 'Remembers whether you chose the light or the dark theme (local storage, never sent to the server).', kept: 'Until you clear it' },
    { name: 'wild', text: 'Remembers that you found the hidden colour theme, for this visit only (session storage).', kept: 'Until you close the tab' },
    { name: 'loaded', text: 'Notes that the opening animation has played, so it only plays once per visit (session storage).', kept: 'Until you close the tab' },
  ],
  analytics: [
    { name: '_ga', text: 'Google Analytics: tells visits apart, so I can see how the site is used. Only set when you allow analytics.', kept: '2 years' },
    { name: '_ga_*', text: 'Google Analytics: keeps track of your current visit (pages seen, how long). Only set when you allow analytics.', kept: '2 years' },
  ],
};
