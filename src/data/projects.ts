// Featured projects shown in the pinned "scope" section, in order. Placeholders: swap in real work + images.
// The caption shows "01 — TITLE"; the image should be about 1.37:1 (see RATIO in projects-scope.js).
export interface Project {
  title: string;       // shown in the caption, e.g. "Woonpact Gent"
  label: string;       // big word on the placeholder visual
  description: string;
  image?: string;      // e.g. '/projects/woonpact.jpg' (in /public). When set, replaces the placeholder
  colors: { a: string; b: string; t: string }; // placeholder gradient + text colour
}

export const projects: Project[] = [
  { title: 'Woonpact Gent', label: 'Woonpact', description: 'A unique design and a structured CMS behind the website, for the city of Ghent.', colors: { a: '#3f5a2c', b: '#cfd8b4', t: '#f3efe2' } },
  { title: 'Toran', label: 'Toran', description: 'Planning and admin tooling in Laravel for an aviation company.', colors: { a: '#12233d', b: '#6f93c2', t: '#e8eef7' } },
  { title: 'Portaal', label: 'Portaal', description: 'A multi-tenant client portal with AI-assisted content.', colors: { a: '#2d2238', b: '#b69ad6', t: '#f1eaf8' } },
  { title: 'Imagoo', label: 'Imagoo', description: 'Brand and website for a videography and photography studio.', colors: { a: '#1c1a19', b: '#c9744a', t: '#f4e7dd' } },
];
