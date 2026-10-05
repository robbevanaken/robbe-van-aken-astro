// All page copy lives here, grouped per section in page order.
// Lists (clients, projects, services) have their own file next to this one.

export const meta = {
  title: "Robbe Van Aken, developer with a designer's eye",
  description: 'Freelance developer in Ghent, building Craft CMS sites, Laravel software and AI workflows with a designer\'s eye.',
  email: 'robbe.vanaken@gmail.com',
  image: '/og.png', // social preview (1200×630), in /public
};

// Social profiles: shown in the footer and the mobile menu.
export const socials = [
  { label: 'Instagram', href: 'https://www.instagram.com/robbe_vnaken/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/robbe-van-aken/?skipRedirect=true' },
];

export const nav = {
  name: 'Robbe Van Aken',
  role: 'Freelance Developer',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Work', href: '/work' },
    { label: 'Contact', href: '/contact' },
  ],
  // light/dark toggle (screen readers; the button itself is an icon)
  theme: { toLight: 'Switch to light mode', toDark: 'Switch to dark mode' },
};

export const hero = {
  // Each entry is one line; `muted` lines are shown in the softer colour.
  title: [
    { text: 'Freelance Dev', muted: true },
    { text: 'Based in Ghent', muted: false },
  ],
  intro: "A one-person studio for full-cycle product development. Pairing a designer's eye with a developer's craft.",
  cta: { label: 'Get in touch', href: '/contact' },
};

export const marquee = {
  text: 'Open to work for projects worldwide',
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

// home, below the services: how I work, as three lists (a title, then rows: titled entries (items) or lists (groups));
// the R turns into an arrow that points at the row in the middle of the screen
export const approach = {
  title: 'How I work',
  intro: 'What I care about on every project, what I build with, and what happens after launch.',
  sections: [
    { label: 'How I build',
      items: [
        { title: 'Built the way it was designed', text: "I read a design the way it was meant and build it that way. The details that matter survive the build, and technical limits are on the table early, not late." },
        { title: 'Built to be handed over', text: "A site is only finished when your team can run it without me. Clear content structures, a CMS that's pleasant to use, and code someone else can pick up." },
        { title: 'AI where it actually helps', text: "I use AI where it saves real time, for you or for me, and leave it out where it doesn't. No gimmicks, just less tedious work." },
        { title: 'The right people at the table', text: "For bigger projects I bring in specialists I trust, from copywriting to illustration, so you get the right skills without managing a crowd." },
      ] },
    // no favourites: what I can work with, the project decides
    { label: 'Stack',
      groups: [
        { label: 'Web', items: ['Craft CMS', 'Laravel', 'PHP', 'Next.js', 'Astro', 'JavaScript', 'TypeScript'] },
        { label: 'Apps & motion', items: ['Flutter', 'GSAP', 'WebGL'] },
        { label: 'Design', items: ['Figma', 'Typography', 'Brand identity', 'Motion'] },
      ] },
    { label: 'Ship',
      items: [
        { title: 'Hosting & deploys', text: 'A reliable setup, automated deploys, and backups you never have to think about.' },
        { title: 'Performance', text: 'Fast on a slow connection, light on the device in your pocket.' },
        { title: 'Accessibility', text: 'Usable with a keyboard and a screen reader, readable for everyone.' },
        { title: 'Maintenance', text: 'Updates, small changes and a hand when you need one, long after launch.' },
      ] },
  ],
};

export const footer = {
  // Each part in order; `muted` parts are shown in the grey (like "Freelance Dev" in the hero).
  title: [
    { text: "Let's build", muted: true },
    { text: ' what comes next.', muted: false },
  ],
  marquee: "Let's work together", // the orange band above the footer (with two overlapping circles)
  company: 'Robbe Van Aken BV',
  location: 'Ghent, Belgium',
  legal: [
    { label: 'Privacy notice', href: '/privacy' },
  ],
  cookieSettings: 'Cookie settings',
};
