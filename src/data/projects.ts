// Featured projects shown in the pinned "scope" section, in order. Placeholders: swap in real work + images.
// Cards show the image (the same one as on the detail page), then the title and description.
export interface Project {
  slug: string;        // URL of the detail page: /work/<slug>
  title: string;       // shown in the caption, e.g. "Woonpact Gent"
  label: string;       // big word on the placeholder visual
  description: string;
  service: string;     // shown next to the title on the detail page, e.g. "Development & design"
  year: number;        // shown next to the service on the detail page
  image?: string;      // the project's visual, e.g. '/projects/woonpact.jpg' (in /public): on its card (home, /work) and its
                       // detail page alike (cover-cropped to each box), so the card → page transition is seamless
  colors: { a: string; b: string; t: string }; // placeholder gradient + text colour
}

// filter categories on /work: the parts of the service ("Development & design" → Development, Design)
export const projectTags = (p: Project) => p.service.split('&').map((s) => s.trim()).filter(Boolean).map((s) => s[0].toUpperCase() + s.slice(1));

export const projects: Project[] = [
  { slug: 'woonpact-gent', title: 'Woonpact Gent', label: 'Woonpact', image: '/projects/woonpact-gent.jpg', description: 'A distinctive design on top of a well-structured CMS, for the City of Ghent.', service: 'Development & design', year: 2026, colors: { a: '#3f5a2c', b: '#cfd8b4', t: '#f3efe2' } },
  { slug: 'toran', title: 'Toran', label: 'Toran', image: '/projects/toran.jpg', description: 'Planning and admin tooling in Laravel, for an aviation company.', service: 'Development', year: 2026, colors: { a: '#12233d', b: '#6f93c2', t: '#e8eef7' } },
  { slug: 'portaal', title: 'Portaal', label: 'Portaal', image: '/projects/portaal.jpg', description: 'A client portal for several brands at once, with AI that helps write the content.', service: 'Development & AI', year: 2026, colors: { a: '#2d2238', b: '#b69ad6', t: '#f1eaf8' } },
  { slug: 'imagoo', title: 'Imagoo', label: 'Imagoo', image: '/projects/imagoo.jpg', description: 'A brand and website for a video and photography studio.', service: 'Branding & design', year: 2026, colors: { a: '#1c1a19', b: '#c9744a', t: '#f4e7dd' } },
];
