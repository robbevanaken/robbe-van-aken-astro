// The projects, in order: home shows the first ones (work.featured in site.ts), /work all of them, each has a detail
// page (/work/<slug>). Cards show the image (the same one as on the detail page), then the title and description.
export interface Project {
  slug: string;        // URL of the detail page: /work/<slug>
  title: string;       // shown in the caption, e.g. "Woonpact Gent"
  label: string;       // big word on the placeholder visual
  description: string;
  service: string;     // shown next to the title on the detail page, e.g. "Development & design" (the filters on /work
                       // split it on "&" and ",")
  year: number;        // shown next to the service on the detail page
  // the main visual (ui/ProjectVisual.astro), the same on the card (home, /work), the detail page and the scroll-next
  // section: `image`, a photo filling the box (a device mockup, src/assets/projects/<slug>/mockup.jpg; Toran: a photo),
  // focus `position`. Also possible: `shot` (a flat screenshot, 16:10) on a `field` colour (tried for the cards and
  // dropped: the mockups felt better)
  shot?: string;
  field?: string;
  image?: string;
  position?: string;   // the crop's focus (CSS object-position), e.g. '50% 40%', for `image` and `mockup`
  mockup?: string;     // a device mockup (src/assets/projects/<slug>/mockup.jpg): the case study's first, atmospheric visual
  colors: { a: string; b: string; t: string }; // placeholder gradient + text colour
  url?: string;        // the live site ("Visit site" on the detail page)
  client?: string;     // the facts on the detail page
  stack?: string[];
  status?: string;     // e.g. "In progress"
  credit?: { label: string; value: string }; // e.g. a collaboration
  // the case study on the detail page (sections/ProjectCase.astro). DUMMY copy for now: replace with the real story.
  story?: { intro: string; challenge: string; approach: string; result: string };
  // what was made, as columns (e.g. the parts of a product suite), between the approach and the result
  parts?: { title: string; text: string }[];
  // the brand: the logo (an SVG with fill="currentColor" in src/assets/projects/<slug>/) shown on panels in the
  // brand's colours, with a short text
  brand?: { text: string; logo: string; swatches: { bg: string; fg: string }[] };
  // visuals for the case study, in src/assets/projects/<slug>/: screenshots of the site (desktop: 1440×900 @2x,
  // mobile: 390×844 @3x), or photos (when screens can't be shown: wide, two portrait, wide); with neither, placeholder
  // panels in the project's colours
  screens?: { desktop: string; mobile: [string, string] }; // desktop: a long page (1440 wide @2x, ~3 screens), it scrolls inside its window
  // one moment of its own per project, after the approach: `strip` (stills in a row: video work), `grid` (photos of
  // the work), `suite` (the parts as numbered columns: uses `parts`)
  moment?: { kind: 'strip' | 'grid' | 'suite'; title: string; text: string; images?: string[] };
  photos?: [string, string, string, string];
}

// filter categories on /work: the parts of the service ("Branding, design & development" → Branding, Design, Development)
export const projectTags = (p: Project) => p.service.split(/[&,]/).map((s) => s.trim()).filter(Boolean).map((s) => s[0].toUpperCase() + s.slice(1));

// screenshots of a project's site, by convention in src/assets/projects/<slug>/
const screens = (slug: string): Project['screens'] => ({
  desktop: `/projects/${slug}/desktop-long.jpg`,
  mobile: [`/projects/${slug}/mobile-1.jpg`, `/projects/${slug}/mobile-2.jpg`],
});

// DUMMY: the stories, parts, stacks and years below are placeholder copy to fill the detail pages; replace them.
export const projects: Project[] = [
  {
    slug: 'woonpact-gent', title: 'Woonpact Gent', label: 'Woonpact', image: '/projects/woonpact-gent/mockup.jpg', position: '50% 36%',
    description: 'A brand and website for the City of Ghent\'s housing pact.', service: 'Branding, design & development', year: 2026,
    colors: { a: '#3f5a2c', b: '#cfd8b4', t: '#f3efe2' }, url: 'https://woonpact.gent', client: 'Stad Gent', stack: ['Craft CMS', 'Twig', 'Vite'],
    credit: { label: 'Design with', value: 'Nick Slemsbrouck, Studio Uruku' },
    story: {
      intro: 'Ghent needs more affordable homes than the city can build alone. The housing pact brings owners, developers and residents to the table, and it needed a voice of its own to do that.',
      challenge: 'A lot of information, many audiences and a subject that can feel heavy. The pact needed an identity that is approachable without losing any of the substance, and a site the city\'s team can keep up to date themselves.',
      approach: 'The brand came first, made together with Nick Slemsbrouck of Studio Uruku, then the site grew out of it: a clearly structured Craft CMS setup with a bold, typographic design, and news, a timeline and video as building blocks the team can combine freely.',
      result: 'An identity that feels like a campaign and a site that works like a reference: easy to read on every screen, quick to update, and built to grow with the pact.',
    },
    brand: {
      text: 'A house drawn as a label: one bold roof over the words, simple enough for a sticker, a building site fence or a favicon. Warm, pale colours keep a serious subject friendly, with black type that holds its own next to them.',
      logo: '/projects/woonpact-gent/logo.svg',
      swatches: [{ bg: '#f8e6c4', fg: '#000000' }, { bg: '#eed0e1', fg: '#000000' }, { bg: '#000000', fg: '#f8e6c4' }],
    },
    screens: screens('woonpact-gent'),
  },
  {
    slug: 'imagoo', title: 'Imagoo', label: 'Imagoo', image: '/projects/imagoo/mockup.jpg', position: '50% 54%',
    description: 'A redesign of the website of a video and photography studio.', service: 'Design & development', year: 2026,
    colors: { a: '#1c1a19', b: '#c9744a', t: '#f4e7dd' }, url: 'https://www.imagoo.be', client: 'Imagoo', stack: ['Craft CMS', 'Vimeo', 'GSAP'],
    story: {
      intro: 'Imagoo makes video and photography for brands, and its work had outgrown its website. The redesign had one job: let the footage do the talking, and make the content package easy to say yes to.',
      challenge: 'The old site no longer matched the work. The footage had to carry the site, and the content package, their key offer, had to be clear to companies that are new to working with a studio.',
      approach: 'Keeping what worked, rethinking the rest: a wide wordmark and a calm grid around big, full-bleed video, the package in its own spot from the first screen, the services as short, scannable blocks, and the work itself always one scroll away.',
      result: 'A site that sells the studio the way the studio sells its clients: by showing, not telling.',
    },
    moment: { kind: 'strip', title: 'The footage first', text: 'Their hero is a reel of their own work, no stock, no slogans: every visit starts with what the studio actually makes.',
      images: [1, 2, 3, 4, 5, 6].map((n) => `/projects/imagoo/still-${n}.jpg`) },
    screens: screens('imagoo'),
  },
  {
    slug: 'dewilde-braems', title: 'De Wilde-Braems', label: 'De Wilde-Braems', image: '/projects/dewilde-braems/mockup.jpg', position: '50% 22%',
    description: 'A clear, calm website for a family-run construction company.', service: 'Design & development', year: 2025,
    colors: { a: '#0b2f57', b: '#9db7d6', t: '#eef3f9' }, url: 'https://dewilde-braems.be', client: 'De Wilde-Braems BV', stack: ['WordPress', 'Tailwind CSS'],
    story: {
      intro: 'De Wilde-Braems builds homes in and around Wachtebeke, a family business now in its fourth generation. Most of their clients find them through people they built for; the website had to feel just as trustworthy.',
      challenge: 'Their best argument is the work itself. The site had to show it at its best, make the three services easy to tell apart, and lead straight to a conversation, without the noise of a typical builder\'s site.',
      approach: 'A calm layout in their own deep blue, big photography of finished projects, and a portfolio grouped by style, so visitors quickly find homes like the one they have in mind. Contact is never more than a tap away.',
      result: 'A site as solid and straightforward as the company behind it, easy for them to fill with new projects.',
    },
    screens: screens('dewilde-braems'),
  },
  {
    slug: 'toran', title: 'Toran', label: 'Toran', image: '/projects/toran/mockup.jpg', position: '42% 44%',
    description: 'The Toran Suite: planning software and a mobile app for a helicopter operator and flight school.', service: 'Development', year: 2026,
    colors: { a: '#12233d', b: '#6f93c2', t: '#e8eef7' }, client: 'Toran Heli Services & Academy', stack: ['Laravel', 'React Native', 'Craft CMS'], status: 'In progress',
    story: {
      intro: 'A helicopter operator and flight school runs on planning: aircraft, instructors, students and weather, all depending on each other. Toran wanted one system for it, instead of a dozen spreadsheets.',
      challenge: 'Flights, students, instructors, aircraft and bookings all depend on each other, and they lived in spreadsheets, inboxes and separate tools. The software had to bring them together: strict where safety and planning demand it, quick everywhere else.',
      approach: 'One Laravel core with two faces. The web app came first, built step by step alongside the people who plan the flights every day; the mobile app follows on the same data, so a change in the planning reaches a student\'s pocket the moment it\'s made.',
      result: 'Less double work, fewer surprises, and a single source of truth from the first booking to the last entry in the logbook.',
    },
    parts: [
      { title: 'Web app', text: 'For the team: planning and admin in one place, with aircraft, instructors, students and flights linked together, and checks where a mistake would be expensive.' },
      { title: 'Mobile app', text: 'For students and pilots: their flights, bookings and training progress in their pocket, with a notification the moment the planning changes.' },
      { title: 'Website link', text: 'Bookings, vouchers and shop orders from the new website flow straight into the planning, instead of into an inbox.' },
    ],
    moment: { kind: 'suite', title: 'One core, three faces', text: 'Everything reads from and writes to the same Laravel core, so a change made anywhere shows up everywhere.' },
    // no screens of the software or the app (legal): photos from Toran's own site only
    photos: ['/projects/toran/photo-1.jpg', '/projects/toran/photo-2.jpg', '/projects/toran/photo-3.jpg', '/projects/toran/photo-4.jpg'],
  },
];
