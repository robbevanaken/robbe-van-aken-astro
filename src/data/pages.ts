// Copy for the subpages. Each page is empty for now: a label, a title and an intro.
// Project detail pages (/work/<slug>) take their copy from projects.ts.

export const workPage = {
  label: 'Work',
  title: 'Selected projects',
  intro: 'Websites, platforms and tools, built with care from first sketch to final deploy.',
};

export const aboutPage = {
  label: 'About',
  title: "Developer with a designer's eye",
  intro: 'More about me and how I work is coming soon.',
};

export const contactPage = {
  label: 'Contact',
  title: "Let's build something we're both proud of.",
  intro: 'Tell me about your project, or just say hi.',
};

export const privacyPage = {
  label: 'Legal',
  title: 'Privacy notice',
  intro: 'How this site handles your data. The full notice is coming soon.',
};

export const notFoundPage = {
  label: '404',
  title: "This page doesn't exist.",
  intro: 'It may have moved, or the link is off. The home page is a good place to start again.',
  cta: { label: 'Back to home', href: '/' },
};

export const projectPage = {
  label: 'Project',
  service: 'Service',    // label above the service next to the title
  year: 'Year',          // label above the year next to the service
  placeholder: 'Case study coming soon',
  next: 'Next project',  // label above the title in the scroll-to-next section
  back: 'All projects',
};
