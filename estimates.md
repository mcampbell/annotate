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
