// All page copy lives here, grouped per section in page order.
// Lists (clients, projects, services) have their own file next to this one.

export const meta = {
  title: "Robbe Van Aken, developer with a designer's eye",
  description: 'Digital craftsman in Ghent: Craft CMS sites, Laravel software and AI workflows, developed with a designer\'s eye.',
  email: 'hello@robbevanaken.be',
  image: '/og.png', // social preview (1200×630), in /public
};

// Social profiles: shown in the footer and the mobile menu.
export const socials = [
  { label: 'Instagram', href: 'https://www.instagram.com/robbe_vnaken/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/robbe-van-aken/?skipRedirect=true' },
];

// the page's theme as you scroll: `base` for most of the page, `chapter` for the marked chapters (.t-dark: the
// services + projects, and the footer); flip them to reverse the whole site (tried Oct 2026: a dark base with light
// chapters — light stays the default)
export const pageTheme = { base: 'light', chapter: 'dark' } as const;

export const nav = {
  name: 'Robbe Van Aken',
  role: 'Freelancer', // header + loader + JSON-LD; the hero says "Digital craftsman"
  links: [
    { label: 'Home', href: '/' }, // was "Pitch": as the home page's label it read oddly
    { label: 'Work', href: '/work' },
    { label: 'Contact', href: '/contact' },
  ],
  // light/dark toggle (footer bottom row + mobile menu foot): worded for what a click does
  theme: { dark: 'Dark mode', light: 'Light mode', back: 'Back to normal' },
  // the hidden third theme (global/theme.js): the hint in the footer's bottom row, per kind of device, and once found
  wild: { hintKeys: 'Psst… press', found: 'You found it.' },
};

// Album of the week: the record fixed bottom left (ui/Music.astro). A new week: change the album, the artist, the link
// and the cover (a square image in src/assets/music/, ~600px). Without a url it only shows in `npm run dev`.
export const music = {
  label: 'Album of the week',
  title: 'Soft Spot',
  artist: 'Honningbarna',
  cover: 'honningbarna-soft-spot.jpg', // in src/assets/music/
  url: 'https://music.apple.com/no/album/soft-spot/1790405431',
  service: 'Apple Music', // for screen readers: "… on Apple Music, opens in a new tab"
};

export const hero = {
  // Each entry is one line; `muted` lines are shown in the softer colour.
  title: [
    { text: 'Digital craftsman', muted: true },
    { text: 'Based in Ghent', muted: false },
  ],
  intro: "Freelance product development, start to finish and well after launch. Pairing a designer's eye with a developer's craft.",
  cta: { label: 'Get in touch', href: '/contact' },
};

export const marquee = {
  text: 'Taking on new projects, from Ghent to anywhere',
};

// the big blackletter band between the services and the projects (sections/CraftBand.astro), in Cloister Black
export const craftBand = {
  text: 'Thoughtful design · genuine care ·',
};

export const trustedBy = {
  label: 'Trusted by',
};

export const pitch = {
  quote: "Solid code, thoughtful design, genuine care for the craft, and AI where it actually helps. I want to build something we're both proud of. That's the whole pitch.",
  portrait: { image: '', alt: 'Robbe Van Aken', placeholder: 'Portrait or short video' },
};

export const work = {
  // like the services head: a section title (h2) and a muted intro below it
  title: 'Recent work',
  intro: 'Each one started with a good conversation and ended as something people enjoy using, and teams find easy to keep up to date.',
  cta: { label: 'View all projects', href: '/work' },
  cursor: 'View project', // on the cursor over a project card (home + /work)
  featured: 3, // how many projects home shows (the first ones in projects.ts)
};

export const servicesIntro = {
  title: 'What I build',
  text: 'Development leads, design runs through all of it. For bigger projects I bring in people I trust, so the right skills are at the table.',
};

// home, between the projects and the pricing: a big typographic block (sections/Manifesto.astro), two short paragraphs
// set large, the first line indented; highlighted on scroll. Plain and honest, never "works alone".
export const manifesto = {
  text: [
    'Robbe Van Aken is a freelance developer with a designer\u2019s eye, building websites and software from Ghent.',
    'Solid code and careful design, shaped around the people who use it, with trusted people at the table when a project asks for more. And I stick around after launch.',
  ],
  // beside the second paragraph (cols 1–2, under the R); without an image only `npm run dev` shows the placeholder
  portrait: { image: '', alt: 'Robbe Van Aken', placeholder: 'Portrait' },
};

// home, after the projects: what it costs, three packages as a fanned hand of cards in the brand's three tones
// (sections/Pricing.astro, after madewithgsap.com's colored-card fan). PRICES ARE PLACEHOLDERS: set the real numbers
// before go-live. `price.value`: digits roll in like the title-frame counter, other characters stand still.
// `tone`: paper | accent | panel (the card's ground).
export const pricing = {
  title: 'What it costs',
  intro: 'Three honest ways to work together. Clear from the start, no surprises after.',
  packages: [
    { tone: 'paper', title: 'A website', text: 'Design and build, from first sketch to launch.',
      items: ['Design & development', 'Craft CMS, pleasant to update', 'SEO, speed and hosting sorted'],
      price: { label: 'Starting from', value: '\u20ac3.500' } },
    { tone: 'accent', title: 'Something custom', text: 'Platforms, portals and internal tools, built around the way you work.',
      items: ['Scoped together first', 'Built in steps you can follow', 'Yours, no lock-in'],
      price: { label: 'Price', value: 'On quote' } },
    { tone: 'panel', title: 'Care & growth', text: 'Your site looked after: updates, fixes and improvements, month by month.',
      items: ['Hosting & monitoring', 'Small changes within days', 'Advice when you need it'],
      price: { label: 'Starting from', value: '\u20ac115/m' } },
  ],
  note: 'Whatever you pick: built to last, made with care, yours to keep.',
};

// home, below the services: how I work, a horizontal reel of five cards; the R rides along below it as an arrow
export const approach = {
  title: 'How I work',
  intro: 'What I care about on every project, and what happens after launch.',
  items: [
    { title: 'Built the way it was designed', text: "I read a design the way it was meant and build it that way. The details that matter survive the build, and technical limits are on the table early, not late." },
    { title: 'Built to be handed over', text: "A site is only finished when your team can run it without me. Clear content structures, a CMS that's pleasant to use, and code someone else can pick up." },
    { title: 'AI where it saves time', text: "I use AI where it saves real time, for you or for me, and leave it out where it doesn't. No gimmicks, just less tedious work." },
    { title: 'The right people at the table', text: "For bigger projects I bring in specialists I trust, from copywriting to illustration, so you get the right skills without managing a crowd." },
    { title: 'Looked after, long after launch', text: 'Reliable hosting and deploys, fast pages on any connection, usable for everyone, and a hand whenever you need one.' },
  ],
};

// PARKED (off the home page for now): the closing statement. Lines of big words (`muted`: in the grey) and small
// ones hung beside them (`lead` before, `small` after); `gif`: a funny GIF between the big and the small words, a GIPHY id
// (served from GIPHY's own CDN as its MP4 + still: media.giphy.com/media/<id>/giphy.mp4) and its crop focus in the 3:2 box
export const statement = [
  { big: 'Built to last,', small: 'not just to launch', muted: true, gif: { id: 'l1KXqoOC36VeCbjtC', pos: '50% 100%' } }, // Plankton: "It's indestructible!"
  { lead: 'made with', big: 'care', gif: { id: '8OJdqYqN1Nii3UTD6l', pos: '50% 30%' } },                                 // Bob Ross holding a baby deer
  { big: 'Yours', small: 'to keep.', gif: { id: 'nIkkvyLzkZoQ9E4TGC', pos: '50% 50%' } },                                 // an otter handed an egg to keep // not a call to action: the footer's band and title right after it are
];

export const footer = {
  // Each part in order; `muted` parts are shown in the grey (like "Freelance Dev" in the hero).
  title: [
    { text: "Let's build", muted: true },
    { text: ' what comes next.', muted: false },
  ],
  marquee: "Let's work together", // the red band above the footer
  company: 'Robbe Van Aken BV',
  location: 'Ghent, Belgium',
  legal: [
    { label: 'Privacy notice', href: '/privacy' },
  ],
  cookieSettings: 'Cookie settings',
};
