# Robbe Van Aken, portfolio site

Personal site for Robbe Van Aken, a freelance developer (Craft CMS, Laravel) with a background in design, based in Ghent. It replaces the old Booold brand. Goal: an Awwwards Site of the Day. Development leads the positioning, branding is offered more quietly, and copy should never suggest he works strictly alone (he brings in people on bigger projects).

## Stack
Astro (static), plain JS modules, GSAP + ScrollTrigger. No framework components. `npm run dev` / `npm run build`.

## The core idea: one R that travels
A blackletter R (source: `public/R.svg`, path in `src/scripts/r-journey/r-shape.js`) is sampled into particles once and then moves through the whole page on a fixed full-screen canvas (`#r-canvas`). It is one object throughout; nothing is swapped.

States are defined by elements with `data-stage` (the engine blends between them based on scroll):

| stage | section | what the R does | anchor element |
|---|---|---|---|
| 0 | Hero | big, extruded 3D, tumbles with the mouse | `#a-hero` |
| 1 | Pitch | "exploded view": fragments slightly apart, still readable | `#a-pitch` |
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
Pinned, scrubbed GSAP timeline. Each step works like a scope retargeting: current project + frame corners shrink, the row slides until the next project sits in the small frame, then it grows. Always settles on a project (label snapping + a `scrollEnd` safety net). Data lives in `src/data/projects.ts`; set `image` to use a real visual.

## Design rules
- Palette tokens in `src/styles/global.css` `:root` (dark warm brown `#170e0b`, off-white, orange `#ff4f00` accent used sparingly).
- Inter Tight for all type. The R is the one bold element; keep everything around it quiet.
- Copy: English, sentence case, plain and honest, "not salesy, not slimy". Key line: "Solid code, thoughtful design, genuine care for the craft, and AI where it actually helps. I want to build something we're both proud of. That's the whole pitch."
- Respect `prefers-reduced-motion` (engine and GSAP already do).

## Open work / ideas
- Replace placeholder projects with real work and imagery; project detail pages + page transitions.
- Port the engine to WebGL (instanced quads or a point shader + dither pass) for performance on low-end devices; Canvas 2D is near its limit.
- Mobile pass: particle counts, pin behaviour, touch interaction for the footer.
- Portrait/video in the pitch section (currently a placeholder box).
- Possibly source content from Craft CMS later (headless) if the site grows.
