# Project 3 — Mosaics de Barcelona: living state

Agent-facing memory between sessions. English. Update it in the same commit as any change.
Spec: [`SPEC.md`](SPEC.md). Where they disagree, this file wins.

## Status (2026-10-22): v1 built, not yet published

| Part | Status |
|---|---|
| Engines `isometries.js`, `grups.js`, `deteccio.js`, `arbre.js`, `motiu.js`, `llicons.js` (pure, Node-tested) | DONE |
| Aprèn (4 lessons × 2 challenges), Taller (editor, 7 friezes, overlay, PNG, A4 colouring sheet), Classifica (3 testers + tree) | DONE, browser-checked under `file://` |
| Photo pipeline: `tools/prepara-fotos.py`, `data/fotos.js` (empty), `tests/fotos.test.js` | DONE (no photos yet) |
| Tests (`node tests/run-all.js`) | DONE, all green |
| 17 wallpaper groups (3r–4t ESO) | PHASE 2 (user, 2026-10-22) |
| ≥ 12 real photos with a confirmed key; Classifica on photos | PENDING (user supplies photos) |
| Student photo submission via the department's Google Form | NOT IN v1 (user) |
| GitHub bootstrap (`unzip-upload.yml`, `tests.yml`, `_uploads/`), Cloudflare `mosaics.step-quiz.net` | PENDING (user) |
| Card in `ins/index.html`, link from `m/florence-cb.html` «Sanefes» | PENDING (after first public release) |

## Decisions approved by the user (2026-10-22)

1. v1 = friezes only (7 groups). Wallpaper groups in phase 2.
2. No photos yet: Classifica uses generated friezes (safe key). Pipeline ready for the user's photos.
3. No Google Form link in v1.

## Technical and pedagogical decisions (agent)

- **Frieze model.** Strip horizontal, central axis `y = 0`. The motif lives in the unit square, which is placed as
  a **fundamental domain** (`domini`), so copies never overlap. Hence the lattice period is 1 or 2 and the strip
  height 1 or 2 depending on the group (`GRUPS[id].periode`, `.franja`, `.domini`). Generators: `V` (mirror x = 0),
  `H` (mirror y = 0), `G1` (glide on y = 0 by 1), `R` (half-turn at the origin); p2mg = ⟨V, G1⟩, p2mm = ⟨V, H⟩.
- **Closure** by BFS over `generator ∘ representative`, translation x reduced mod the period, ε = 1e-9. Orders
  asserted against the spec table. Symmetry elements extracted from each representative as in spec §8.3.
  Mirror/glide angles are kept exact (rounding them to 1e-6 broke the "element leaves the pattern invariant"
  test far from the origin).
- **Independent detector** (`deteccio.js`) works on coloured point sets (vertices and edge midpoints of the motif)
  with a hash on a 1e-6 grid; it never imports `grups.js`. Candidates come from pairs of same-coloured points.
  Used by tests and at runtime: Classifica rejects random motifs that add symmetry; Taller warns
  («El teu motiu ja és simètric…») when the student's motif gives more symmetry than the chosen group.
- **Random motifs** (Classifica): a family (F, blob, fish, leaf, quarter-flower), one of the 8 D4 placements,
  shuffled palette, plus a small off-centre dot of another colour to break any self-symmetry.
- **Decision tree** (data in `arbre.js`): horizontal mirror → vertical mirror → half-turn → glide, ≤ 4 questions,
  each with a one-line explanation and its tester tool. A wrong leaf names the **first** wrong answer (compared
  with the detector's answers) and the tool to check it, and rewinds to that question.
- **Testers**: overlay = the same frieze re-drawn with the tested isometry at 55 % opacity (vector, exact).
  Taps snap to a 0.25 grid (all frieze elements lie on it). Rotation offers 180/120/90/60°. Glide: two taps for
  the axis, then drag or slider for the offset. Keyboard: arrows move a cursor, Enter taps. When photos arrive,
  the tester needs a bitmap source drawn with `B ∘ g ∘ B⁻¹` instead of the vector re-draw.
- **Aprèn**: F scaled ×2 at [−1, 1]²; window [−6, 6] × [−4, 4]. Challenge 1 with sliders (steps 0.5 / 15°),
  challenge 2 with handles (grid 0.5; the mirror axis through two grid points may have any angle). Success =
  same isometry (the F has no symmetry). «Prefereixo els controls» restores sliders for keyboard users.
- **Taller**: freehand (pointer, ≤ 600 points per stroke) and polygons (vertices on a 0.025 grid; tap the first
  vertex to close); keyboard cursor. Undo stack of whole motifs (50). Colouring sheet: outline-only render to a
  PNG data URL shown in a print-only section (5 strips, or 3 for 2-high groups).
- **Photos**: `prepara-fotos.py` applies EXIF orientation, re-creates the image (no metadata), long side ≤ 1600
  (then 1400, 1200 if needed), quality 80 → 60, < 400 KB; refuses and deletes otherwise. `fotos.test.js` parses JPEG
  segments directly (APP1 Exif → IFD0 tag 0x8825) and requires no Exif at all; it was checked against a
  hand-made JPEG with GPS and against a real Pillow JPEG with GPS.
- **Storage**: `mosaics:v1:motiu`, `mosaics:v1:grup`, `mosaics:v1:apren`, all in try/catch; stored motifs go
  through `Motiu.neteja`. No codes.
- **CSP** in `_headers`: `connect-src 'none'`, no inline scripts or styles (sizes set through CSSOM).

## Acceptance criteria (spec §8.7, v1 scope)

- [x] All 7 frieze groups generate correctly, with overlays (wallpaper: phase 2).
- [x] Classifier with the three tester tools.
- [ ] At least 12 real photos with a confirmed key (waiting for photos).
- [x] Print and PNG export.
