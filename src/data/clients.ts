// "Trusted by" logos. Shown 4 per row, each in a 3-column cell.
// Logos live in /public/clients/ (white SVG). `width` is the logo width in px at 1440, it scales with the viewport.
export interface Client {
  name: string;
  logo: string;
  width: number;
  url?: string;
}

export const clients: Client[] = [
  { name: 'Client', logo: '/clients/client-y.svg', width: 49 }, // TODO: real client name (used as alt text)
  { name: 'Imagoo', logo: '/clients/imagoo.svg', width: 141 },
  { name: 'NGIS', logo: '/clients/ngis.svg', width: 110 },
  { name: 'Antenna', logo: '/clients/antenna.svg', width: 122 },
];
