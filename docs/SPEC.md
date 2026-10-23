# Project 3 — Mosaics de Barcelona: specification

> Copied from `SPEC-step-quiz-9-projects.md` §8 (2026-10-22; v1 scope: friezes only, see STATE.md). The shared rules of that document
> apply and are summarised here; decisions taken later are in [`STATE.md`](STATE.md), which overrides this file.
> Where this file and `CLAUDE.md` disagree, `CLAUDE.md` wins.

## Shared rules (summary of the master spec §2–§4)

- Static only (HTML + CSS + vanilla JS), no build step, no backend. **Must work under `file://`** (double click):
  classic scripts with one namespace per file and the dual export wrapper, no ES modules, no `fetch`, no Workers.
- No network at runtime (no CDN, fonts, analytics). Privacy: no personal data; `localStorage` only, every access in
  `try/catch`, fully usable without storage. Keys `mosaics:v1:<what>`.
- Everything the student sees is in Catalan; identifiers and comments in Catalan; agent docs in English.
- Content CC BY-NC-SA 4.0, code MIT (`LICENSE`, `LLICENCIA.md` from `step-quiz-commons/fitxers/`).
- Never `[skip ci]`, `[ci skip]` or `[cf-pages-skip]` in any commit message.
- Tests before delivery; tests recompute results independently of the code under test. Docs follow code.
- Seeded RNG (FNV-1a → mulberry32, from `prova1eso/assets/js/atzar.js`); never `Math.random` for anything
  reproducible. URL readers tolerate garbage.
- Pedagogy: one action per screen state, ≤ ~40 words of instructions, feedback names the mistake (≤ 2 messages),
  no gamification noise, every route ends in a "beauty moment", hints never give the answer.
- Interaction triad (drag, tap-then-tap, keyboard); Pointer Events with `setPointerCapture`; `touch-action: none`
  only on the board; targets ≥ 44 px touch / ≥ 24 px mouse; `aria-live` feedback; colour never the only carrier;
  animations ≤ 300 ms and off under `prefers-reduced-motion`; dark mode via tokens; print black on white, A4 15 mm.
- Cache busting with `?v=<content hash>` (`tools/versio.py`), checked by a test.
- Catalan maths typography: decimal comma (inputs accept `,` and `.`), `·` and `:`, `«…»`, typographic `’`.

## 8. Project 3: Mosaics de Barcelona

**Repo:** `mosaics`. **Curriculum:** plane isometries.
- 1r–2n ESO: friezes. This connects with the Florence session «Sanefes» in `m/florence-cb.html`.
- 3r–4t ESO: wallpaper patterns («Moviments al pla», 9 h in 3r ESO; it was a gap in the item bank documented in `recu`).

### 8.1 Pedagogical intent

- **The structure.** First *make* patterns by choosing isometries (learn by doing). Then *classify* real Barcelona pavements by testing isometries with a visual overlay tool.
- **The local hook.** The panot de flor, the hexagonal paving of passeig de Gràcia, and the students' own street photos.
- **The rule stated to students:** «una isometria compta si el mosaic queda exactament igual, colors inclosos».

### 8.2 Modules

1. **Aprèn.** Four interactive micro-lessons: translation, rotation, reflection, glide reflection. Each applies the transform to an asymmetric motif (a letter F), first with sliders, then by direct manipulation.
2. **Taller (generator).**
   - The student draws a motif in a cell: freehand strokes plus polygon fill, 4-colour palette. Presets: letter F, an original asymmetric blob, a stylised quarter-flower.
   - The student picks a group and gets the infinite pattern.
   - A **symmetry overlay toggle** shows mirror lines (solid), glide axes (dashed) and rotation centres. Standard symbols: order 2 as a lens/ellipse, 3 as a triangle, 4 as a square, 6 as a hexagon.
   - Export PNG; print A4 for colouring.
3. **Classifica.** A photo plus an **isometry tester**. The student:
   - picks «gir» (180°/120°/90°/60°) and clicks a centre: a 50 %-opacity rotated copy of the photo is drawn over it;
   - or «mirall»: two clicks define the axis and a reflected copy is drawn;
   - or «lliscament»: an axis plus a dragged offset.

   The student judges coincidence visually, then answers the decision-tree questions one at a time. The tool proposes the group and compares it with the answer key.

### 8.3 Group engine (pure, `js/motor/grups.js`)

- **Representation.**
  - Affine maps `g(p) = M·p + t`, with `M` a 2 × 2 orthogonal matrix.
  - Lattice basis `a1, a2`. Friezes: one generator `a1 = (1, 0)`. Rectangular/square: `a1 = (1, 0)`, `a2 = (0, b)` or `(0, 1)`. Centred: conventional rectangular cell with an extra centring translation. Hexagonal: `a1 = (1, 0)`, `a2 = (1/2, √3/2)`.
- **Group definitions: do not hand-list all elements.** Define each group by:
  - its lattice;
  - a small set of **generators** (rotation about a point, reflection in a line, glide), taken from the standard settings in the International Tables for Crystallography / standard references;
  - its expected point-group order.

  Then compute the **coset representatives modulo the lattice** by closure: BFS over compositions, reduce the translation part to fractional coordinates mod 1, deduplicate with `ε = 1e-9`.
- **Expected orders** (assert in tests):

| Friezes | order | Wallpaper | order |
|---|---|---|---|
| p1 (p111) | 1 | p1 | 1 |
| p11g | 2 | p2, pm, pg | 2 |
| p1m1 | 2 | cm | 2 (4 in the conventional centred cell) |
| p11m | 2 | pmm, pmg, pgg | 4 |
| p2 (p112) | 2 | cmm | 4 (8 in the conventional cell) |
| p2mg | 4 | p4 | 4 |
| p2mm | 4 | p4m, p4g | 8 |
|  |  | p3 | 3 |
|  |  | p3m1, p31m | 6 |
|  |  | p6 | 6 |
|  |  | p6m | 12 |

- **Catalan display names** next to the IUC symbol. Friezes: «només translació», «lliscament», «simetria vertical», «simetria horitzontal», «gir de 180°», «gir i simetria vertical», «totes les simetries». Wallpaper: IUC symbol plus a short description.
- **Rendering.** The motif is a list of `Path2D`. For every lattice translation that intersects the viewport (plus a margin) and every coset representative, set `ctx.setTransform(...)` and draw. Overlap between copies is allowed in v1; clipping to a fundamental domain is optional in phase 2.
- **Symmetry-element extraction** for the overlay, from each representative `(M, t)`:
  - rotation, `det M = 1`, `M ≠ I`: the centre solves `(I − M)c = t`;
  - reflection or glide, `det M = −1`: the axis direction is the eigenvector of `M` for +1. Decompose `t` into parallel and perpendicular components; a parallel component that is 0 mod the lattice means a mirror, otherwise a glide. Draw every lattice translate inside the viewport.

### 8.4 Decision trees

- **Friezes:** four yes/no questions (horizontal mirror? vertical mirror? half-turn? glide?), at most 4 steps to a leaf.
- **Wallpaper:** the standard flowchart:
  1. smallest rotation (1, 2, 3, 4, 6)?
  2. any reflection?
  3. glide reflections on axes that are not mirrors?
  4. rotation centres not on mirrors? (the 4- and 3-fold disambiguations)

  As in Washburn & Crowe, *Symmetries of Culture* (1988), and Schattschneider, «The plane symmetry groups» (1978). Encode the tree as data. Each question carries a one-line explanation and links to the matching tester tool.

### 8.5 Photos

- **Only photos taken by the user, colleagues or students with consent**, never from the web. No people, faces or number plates.
- `tools/prepara-fotos.py` (Pillow):
  - resize to the long side 1600 px, JPEG quality 80, under 400 KB;
  - **strip EXIF (including GPS)**;
  - rename `fotos/<tipus>-<slug>-NN.jpg`.
- Photos should be taken perpendicular to the ground or wall. Optional phase 2: an in-browser 4-point perspective rectification.
- Metadata `data/fotos.js`:
  `{ id, fitxer, tipus: 'sanefa'|'mosaic', grup: 'p4m', lloc: 'Eixample (aprox.)', autor, data, llicencia: 'CC BY-NC-SA 4.0', notes }`.
  - `lloc` is approximate, never an address.
  - **The `grup` answer key must be set and confirmed by the user** with the tester tool. Do not infer groups of real pavements from memory.
- Designs by authors who died long ago, such as Gaudí (d. 1926), are in the public domain in Spain; the photos are the photographers' work and licensed by them.

### 8.6 Tests

- Closure orders (table above) for all 7 + 17 groups.
- **Independent symmetry detection.**
  - Render each group's pattern from an asymmetric point-set motif (as points, not pixels).
  - For each candidate isometry (rotations of orders 2, 3, 4, 6 about the computed candidate centres; reflections and glides along candidate axes), check whether the transformed point set matches the pattern, comparing point sets with a k-d tree or a hash on a rounded grid.
  - Derive the classification and check it equals the group.
  - This tests the generators without trusting them.
- The decision tree reaches each group exactly once. The answers for each group, computed from the independent detector, lead to that group.
- Every `data/fotos.js` entry has an existing file under 400 KB with no EXIF GPS: read the JPEG segments directly in Node.

### 8.7 Acceptance criteria

- [ ] All 7 frieze groups and all 17 wallpaper groups generate correctly, with overlays.
- [ ] Classifier with the three tester tools.
- [ ] At least 12 real photos with a confirmed key.
- [ ] Print and PNG export.

**Open questions for the user** (answered 2026-10-22, see STATE.md):
- Who supplies the photos, and should students be able to submit theirs via the department's Google Form?
- Friezes only for 1r–2n in v1, with wallpaper in phase 2?
