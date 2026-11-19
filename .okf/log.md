# Update Log

## 2026-11-19
* **Creation**: [Crop tool](tools/crop.md), key `x`, and [Crop by frame](decisions/crop-frame.md). [Clipboard export](modules/clipboard-export.md) copies only the area inside the frame.
* **Update**: [Testing](testing.md) - mutation check is now `npm run test:mutate` with entries in `test/mutations.js`.
* **Creation**: [Circle tool](tools/circle.md), key `c`, class type `Oval`.
* **Creation**: [Shift snaps while drawing](decisions/shift-snap.md). The [tool contract](architecture/tool-contract.md) gains an optional `snap(start, end)`.
* **Creation**: [Line tool](tools/line.md), key `l`. [Arrow](tools/arrow.md) now extends Line.

## 2026-10-21
* **Superseded**: [click-to-drop](decisions/click-to-drop.md) is deprecated, superseded by [drag-to-draw](decisions/drag-to-draw.md).
* **Creation**: Scaffolded the Annotate bundle with `okf_init.py` — see [getting started](getting-started.md).
