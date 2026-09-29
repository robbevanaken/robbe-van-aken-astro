// All page copy lives here, grouped per section in page order.
// Lists (clients, projects, services) have their own file next to this one.

export const meta = {
  title: "Robbe Van Aken, developer with a designer's eye",
  description: 'Freelance developer in Ghent. Websites, custom software and AI workflows.',
  email: 'robbe.vanaken@gmail.com',
};

export const nav = {
  name: 'Robbe Van Aken',
  role: 'Freelance Developer',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Work', href: '/work' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
};

export const hero = {
  // Each entry is one line; `muted` lines are shown in the softer colour.
  title: [
    { text: 'Freelance Dev', muted: true },
    { text: 'Based in Ghent', muted: false },
  ],
  intro: "A one-person studio for full-cycle product development. Pairing a designer's eye with a developer's craft.",
  cta: { label: 'Get in touch', href: '/contact' },
  scrollHint: 'Scroll down',
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
  label: 'Some recent projects',
  title: 'Made with technical expertise, and a well trained eye for design',
  cta: { label: 'View all projects', href: '/work' },
};

export const servicesIntro = {
  title: 'What I build',
  text: 'Development leads, design runs through all of it. For bigger projects I bring in the right people.',
};

export const footer = {
  title: "Let's build something we're both proud of.",
  company: 'Robbe Van Aken BV',
  location: 'Ghent, Belgium',
  backToTop: 'Back to top',
  legal: [
    { label: 'Privacy notice', href: '/privacy' },
  ],
  cookieSettings: 'Cookie settings',
};
