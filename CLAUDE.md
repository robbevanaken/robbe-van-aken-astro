# Robbe Van Aken, portfolio site

Personal site for Robbe Van Aken, a freelance developer (Craft CMS, Laravel) with a background in design, based in Ghent. It replaces the old Booold brand. Goal: an Awwwards Site of the Day. Development leads the positioning, branding is offered more quietly, and copy should never suggest he works strictly alone (he brings in people on bigger projects).

## Stack
Astro (static), plain JS modules, GSAP (ScrollTrigger, ScrambleText, SplitText) + Lenis. No framework components. `npm run dev` / `npm run build`.

## File structure
- `src/data/` all copy. `site.ts` (per section, in page order), `clients.ts`, `projects.ts`, `services.ts`. Change text here, not in components.
- `src/components/sections/` one file per page section (Hero, TrustedBy, Pitch, Projects, Services, Footer), each with its own scoped `<style>`.
- `src/components/ui/` small reusable pieces: Button, Icon (brand arrow, globe), Corners (bracket frame, animatable via `--pull-x/--pull-y/--corner-opacity`), Marquee.
- The dev HUD (Glyph/Grid, bottom right) and the grid overlay only render in `npm run dev`, never in the build.
- `src/components/layout/` Nav (fixed, hides on scroll down / shows on scroll up, full-screen menu below 640px behind a "Menu" toggle with two lines that turn into a cross), and dev-only DevHud + GridOverlay.
- `src/scripts/` `eases.js`, `smooth-scroll.js` (Lenis on the GSAP ticker; use `scrollToY()` for programmatic scrolls), `reveal.js` (`data-reveal` → `.is-in` once in view), `highlight.js` (Osmo highlight text), `projects-scope.js`, `r-journey/`.
- `public/clients/` client logos (white SVG, one file per logo).

## Pages
- `/` home (`src/pages/index.astro`, the only page with the R canvas).
- `/work`, `/work/<slug>` (one per project, slug in `projects.ts`), `/about`, `/contact`, `/privacy`: empty templates on `src/layouts/Page.astro` (Nav + content + Footer). On subpages the R has one stage: small and calm, centred in the header (`<Nav withR>` renders `#a-craft` there; the engine falls back to `#a-craft` for every anchor a page doesn't have). The footer there has no R stage (`<Footer rStage={false}>`).
- Project detail pages end in "scroll to next project" (`sections/ScrollNext.astro` + `scripts/scroll-next.js`, Osmo resource in our style: next project's visual full-screen, corners closing in, a 6-column progress line; at 100% it opens the next project). These pages have no footer (`<Page footer={false}>`). Copy in `src/data/pages.ts`; `PageIntro.astro` renders label/title/intro, `ui/Placeholder.astro` marks unwritten content.
- In the featured projects, clicking the active project (or the caption label) opens its detail page; clicking a side project scrolls it in.

## Cookie consent
`vanilla-cookieconsent` v3, started from `Base.astro` (all pages) via `src/scripts/cookie-consent.js`; theme in `src/styles/cookieconsent.css`. Categories: necessary + analytics (no analytics script exists yet; load one with `type="text/plain" data-category="analytics"`). Footer "Cookie settings" reopens the preferences (`data-cc="show-preferencesModal"`). The banner is hidden from bots (`hideFromBots`, default), so headless test browsers won't show it unless `navigator.webdriver` is spoofed.

## Motion
- Text scramble: only on the project caption label (`01 — TITLE`), when the active project changes (GSAP ScrambleText in `projects-scope.js`). Removed everywhere else on purpose.
- Highlight text on scroll (Osmo Supply resource, kept as delivered, `src/scripts/highlight.js`): `data-highlight-text` on longer texts (pitch quote, projects title, services intro + descriptions, footer title); letters go from 0.2 to full opacity, scrubbed with scroll.
- Hovers use the "punch" ease (`--ease-punch` in CSS, `CustomEase 'punch'` in GSAP via `scripts/eases.js`, same curve).
- Button hover: scales down slightly, brand arrow turns from 45° to 0°, four corner brackets slide out of the button's corners.
- Nav links: underline that wipes in from the left. Footer email: light underline, orange one wipes in on hover.
- The R canvas (`#r-canvas`, z 35) always renders above the fixed header (z 30).
- Hero: the hero is `100svh - --marquee-h`, so the orange banner sits just above the fold; the scroll hint has a looping scrollbar thumb.
- Trusted by: corners start around the logo and move apart to the cell edges, then the logo fades in (staggered).
- Everything is off or instant with `prefers-reduced-motion`.
- `src/styles/` `tokens.css` (colours, grid, type scale, spacing), `base.css` (reset + `.t-*` type classes), `grid.css` (`.grid` + overlay). `global.css` only imports them.

## Layout grid (Figma frame 1440 wide)
12 columns, 60px margin, 20px gutter at 1440, fluid in vw (tokens `--cols`, `--margin`, `--gutter`). 6 columns below 1024px, 4 below 640px. Every section is a `.grid` and places children with `grid-column`; nested rows use `subgrid`. Press `L` in dev (or the HUD "Grid" button) for the column overlay.
Placement @1440: hero title cols 1–4, R 5–8, intro 10–12 · trusted-by logos 4 × 3 cols · pitch R 1–6, quote 7–12, portrait 7–9 · projects title 1–5 (lead size), image exactly 6 columns (cols 4–9), 4 columns on short screens, corner brackets one gutter outside; caption always on the 6-column span, next project parked on col 12.

## Type scale (`tokens.css`, sizes @1440, measured from Figma)
display 58 · h2 48 · lead 32 · body-l 20 · body 16 · ui 15 · label 12 (uppercase, medium, tracked). Use the `.t-display/.t-h2/.t-lead/.t-body-l/.t-ui/.t-label` classes instead of one-off sizes.

## The core idea: one R that travels
A blackletter R (source: `public/R.svg`, path in `src/scripts/r-journey/r-shape.js`) is sampled into particles once and then moves through the whole page on a fixed full-screen canvas (`#r-canvas`). It is one object throughout; nothing is swapped.

States are defined by elements with `data-stage` (the engine blends between them based on scroll):

| stage | section | what the R does | anchor element |
|---|---|---|---|
| 0 | Hero | big, extruded 3D, tumbles with the mouse | `#a-hero` |
| 1 | Pitch (`#about`) | "exploded view": fragments slightly apart, still readable | `#a-pitch` |
| 2 | Projects (pinned) | small and calm at the top center | `#a-craft` |
| 3 | Services | splits in 4 quarters that rebuild into 3D icons | `.svc-slot` (4x) |
| 4 | Footer | big again, pixels get pushed away by the cursor | `#a-foot` |

Between stages the R does a full turn around its Y axis. The pinned projects section uses stage 2 twice (`.pwrap` is also `data-stage="2"`), so the R holds still during the pin. Anchors are plain empty elements in the layout, so positions come from CSS and stay responsive.

## Engine (`src/scripts/r-journey/engine.js`)
- `build()`: rasterize the R, create cap particles (front/back face) + side-wall particles (extrusion layers), Voronoi fragments for stage 1, quadrant split + icon assignment for stage 3. Icons are drawn in `drawIcon` (gothic window, split lozenge, star, shield).
- `frame()`: compute scroll state `s`, per-stage rotation matrices, per-particle 3D targets with springs, lighting (light dir `LX/LY/LZ`), then draw.
- Rendering: **glyph dither** by default (Unicorn Studio "Glyph Dither" look: screen grid, each cell empty / dim cross / bright cross). Fallback raw pixel mode exists; toggle with the dev HUD or `G`.

Tunables worth knowing:
- `DEPTH` extrusion thickness; `RY/RX/RZ[...]` rotation amounts per stage (in `frame`).
- `DENS[]` particle size per stage (lower = looser, e.g. icons at .48).
- Glyph look: `G_GAMMA`, `G_COLORS`, sprite `pad` / `lineWidth` in `sprites()`, grid size `CELL` in the glyph draw block.
- `PAL` colour ramp for pixel mode.

## Projects (`src/scripts/projects-scope.js`)
Pinned section, continuous (no stepped timeline): one smoothed value `cur` (project index, fractional in between) drives card position/scale/opacity, a small image parallax, the frame "breathing" in between projects, and the caption (label scrambles, description cross-fades). When scrolling stops in between it glides to the nearest project in the scroll direction; clicking a side project brings it in. Sizes come from the grid: hidden rulers `.rcol1/.rcol2` (column + gutter width) and `.pnext` (resting column of the next project) in `Projects.astro`; the image takes the widest centred span (6, else 4 columns) that fits the height with breathing room; on very short screens it shrinks further with a minimum size. `RATIO`/`MAX_RATIO` set the image aspect. Data lives in `src/data/projects.ts`; set `image` to use a real visual.

## Design rules
- `::selection` is orange with dark text.
- Palette tokens in `src/styles/tokens.css` `:root` (dark warm brown `#170e0b`, orange `#ff4a00` accent used sparingly). Text is only ever white `#FFFFFF` (`--fg`) or grey `#B2B2B2` (`--muted`, `.t-muted`), as in Figma.
- Inter Tight for all type. The R is the one bold element; keep everything around it quiet.
- Copy: English, sentence case, plain and honest, "not salesy, not slimy". Key line: "Solid code, thoughtful design, genuine care for the craft, and AI where it actually helps. I want to build something we're both proud of. That's the whole pitch."
- Respect `prefers-reduced-motion` (engine and GSAP already do).
- Extreme heights: R anchors use `clamp(min, Nvh, max)` heights, the pitch R is also capped by its box width, the projects section tightens its spacing below 700px height.

## Open work / ideas
- Replace placeholder projects with real work and imagery; project detail pages + page transitions.
- Port the engine to WebGL (instanced quads or a point shader + dither pass) for performance on low-end devices; Canvas 2D is near its limit.
- Mobile pass: particle counts, pin behaviour, touch interaction for the footer.
- Portrait/video in the pitch section (currently a placeholder box).
- Possibly source content from Craft CMS later (headless) if the site grows.
