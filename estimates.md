# Estimates

Scale: trivial/easy/medium/hard = 0.5/1/2/4 points. Relative within session 2026-10-21.

## Slices

| Slice | Size | Points |
|---|---|---|
| S1 Paste + Box + style + Delete + Copy (incl. clipboard spike) | medium | 2 |
| S2 Upload + drag-drop | trivial | 0.5 |
| S3 Arrow | medium | 2 |
| S4 Text | easy | 1 |
| S5 Step bubbles + renumber | easy | 1 |
| S6 Blur / pixelate | medium | 2 |
| S7 Undo / redo | medium | 2 |

## Merge conflicts

| ID | Cost | Points |
|---|---|---|
| C1 `index.html` script tags, S3-S6 | trivial | 0.5 |
| C2 `src/input.js`, S2 vs S1 | trivial | 0.5 |

## Rework

| ID | Cost | Points |
|---|---|---|
| R1 serialization added to arrow/step/blur in S7 | easy | 1 |
| R2 renumber recheck under undo reload | trivial | 0.5 |

**Total: 13 points** (slices 10.5, conflicts 1, rework 1.5)

## S9 tool hotkeys (2026-10-22)

Relative within session 2026-10-22.

| Item | Size | Points |
|---|---|---|
| S9 Tool hotkeys + tooltips + E2E | easy | 1 |
| Merge conflicts | none (one slice) | 0 |
| Rework | none | 0 |

**Total: 1 point**

## S10 outline-only hit for Box and Arrow (2026-10-22)

Relative within session 2026-10-22. S9 = 1 point.

| Item | Size | Points |
|---|---|---|
| S10 Box class + Arrow flag + tolerance + E2E | easy | 1 |
| Merge conflicts | none (one slice) | 0 |
| Rework | none | 0 |

**Total: 1 point**

## S11 wheel size, S12 slider follows selection (2026-10-22)

Relative within session 2026-10-22. S9 = 1, S10 = 1.

| Item | Size | Points |
|---|---|---|
| S11 Wheel changes size (target rule, accumulator, debounced commit, E2E with timing) | medium | 2 |
| S12 Slider shows selected size (`annotSize`, selection listener, E2E) | easy | 1 |
| S13 Size per tool (`sizes`, `annot:tool` event, clear restore, E2E) | easy | 1 |
| C3 `src/style.js`, three-way S11/S12/S13 | easy | 1 |
| C4 `src/app.js`, three-way S11/S12/S13 (one line each) | trivial | 0.5 |
| C5 `README.md`, `.okf/modules/style-panel.md`, three-way docs lines | trivial | 0.5 |
| Rework | none | 0 |

**Total: 6 points** (slices 4, conflicts 2)
