// Looks for the big R's (the small ones keep their two-tone cells): one screen grid of cells, a little over one particle
// each (`cell`: in particle pitches, [most stages, the two biggest R's: pitch + footer]); every cell of the front face is
// drawn as `face`, of the side walls as `wall`, in four tones (`FINE`). `dither`: ordered dithering of the tones (0: none,
// flat areas stay flat: calmer); `two`: the face in two tones only (lit / shaded); `edge`: the outline's cells drawn as
// crosses in the darkest tone (a crisp, digital edge around a quieter inside). Shapes: x (cross), sq (square), dot (small
// square), half (a square sized by the light: halftone), alt (crosses and dots in a checker). `glyph` / `pixels`: the
// older renderers. Chosen from these side by side (a dev page, since removed): LOOK is the site's. Plain data, so
// pages can import it at build time.
export const LOOKS = {
  fine:     { label: 'A · Fine (now)', cell: [1.12, 1.3], face: 'x', wall: 'sq', dither: .9 },
  flat:     { label: 'B · Fine, no dither', cell: [1.25, 1.4], face: 'x', wall: 'sq', dither: 0 },
  calm:     { label: 'C · Calm crosses', cell: [1.45, 1.6], face: 'x', wall: 'sq', dither: 0, two: true },
  edge:     { label: 'D · Cross edge, dots inside', cell: [1.2, 1.35], face: 'dot', wall: 'dot', dither: 0, two: true, edge: true },
  halftone: { label: 'E · Halftone', cell: [1.25, 1.4], face: 'half', wall: 'dot', dither: 0 },
  quiet:    { label: 'F · Checker, cross edge', cell: [1.2, 1.35], face: 'alt', wall: 'sq', dither: 0, two: true, edge: true },
  glyph:    { label: 'G · Glyph (old)', render: 0 },
};
export const LOOK = 'halftone';

// Looks for the small R's (under 140px: the header's, the projects', the loader's), compared on a lab page (since
// removed; `data-r-small` on a canvas picks one per engine). `now`: the
// old way (crosses of at least 3 device px, boosted to mostly bright: the holes and hairlines filled in). The others draw
// solid cells, shaded (the face in the two darkest / brightest tones by its light, the side walls in the two quietest),
// so the letter's counters and hairlines stay open: `min` the smallest cell in device px, `rows` how many cells tall
// (none: as fine as `min` allows), `fill` the share of the cell drawn (under 1: a hairline gap, a pixel grid),
// `walls` false: the front face only (a flat letter that still turns).
export const SMALLS = {
  now:   { label: 'A · Now: crosses, boosted bright' },
  solid: { label: 'B · Solid cells, shaded (~40 tall)', min: 3, rows: 40, fill: 1, walls: true },
  fine:  { label: 'C · Finest cells (2 device px), shaded', min: 2, fill: 1, walls: true },
  face:  { label: 'D · Finest, front face only', min: 2, fill: 1, walls: false },
  grid:  { label: 'E · Fine pixels with a hairline gap', min: 3, fill: .72, walls: true },
  pixel: { label: 'F · Pixels (~30 tall), small gap', min: 3, rows: 30, fill: .84, walls: true },
  chunk: { label: 'G · Pixels (~30 tall), face only, small gap', min: 3, rows: 30, fill: .84, walls: false },
};
export const SMALL = 'fine'; // C: chosen side by side on a lab page (since removed)
