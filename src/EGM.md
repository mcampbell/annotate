# src

## Overview

Browser app code. Every file is a classic `<script>` IIFE that reads and extends one shared namespace, `globalThis.Annot`. All files share one Fabric canvas, `Annot.canvas`. `index.html` sets the load order: Fabric, `lib/*`, `app.js`, `input.js`, `style.js`, `export.js`, `undo.js`, then `tools/*`. A file can use only what earlier files put on `Annot`. Background: `.okf/architecture/overview.md`.

## Interface

- [lib](./lib/EGM.md): pure logic. `fitZoom`, `rectBetween`, `stepNumbers`, `history`.
- [tools](./tools/EGM.md): one file per tool. Box, Arrow, Text, Step, Blur, Pixelate.
- `app.js` adds to `Annot`:
  - `canvas`: the one `fabric.Canvas`.
  - `tools`: map of tool id to tool object.
  - `registerTool(tool)`: adds a tool, its button, and its key.
  - `loadImage(blob)`: sets the image as `canvas.backgroundImage` and zooms to fit.
  - `activeTool()`: the active tool id, or `null` for Select.
  - `status(msg, isError)`: sets the status line.
  - `isTyping(e)`: true while the user edits text.
- `style.js` adds `Annot.style()`. It returns `{ color, size }` from the panel.
- `export.js` adds `Annot.toCanvas()`. It returns the image and annotations at natural image size.
- `undo.js` adds `Annot.undoBusy()`. It is true while a restore runs.
- `input.js` adds nothing. It calls `Annot.loadImage` for paste, the Open button, and drag-drop.
- `app.css`: page styles.

## Invariants

- Do not use ES modules. Chrome blocks them on `file://`.
- Scene coordinates equal image pixels. The image sits at scene (0, 0) at natural size. Only the canvas zoom changes.
- `app.js` sets `fabric.BaseFabricObject.customProperties = ['annotTool', 'annotSize']`. Every object keeps its tool id and size in undo snapshots.
- A drag tool preview has `excludeFromExport: true`, so undo snapshots skip it until mouse-up commits it. A drag under 5 screen px makes nothing.
- Undo snapshots hold the objects only, not the background image. A new image resets the history.
- Undo records one snapshot per task (microtask batch), so a multi-object change is one undo step.
- One slider drag or one wheel spin is one undo step. `style.js` commits on `change`, and commits a pending wheel spin before a press or an undo key.
- `loadImage` ignores a decode result if a newer load has started.

## Side Effects

- DOM: reads and writes `#canvas`, `#tools`, `#status`, `#stage`, `#color`, `#size`, `#copy`, `#open`, `#file`, and `body.loaded`.
- Global listeners on `document` and `window`: `keydown` (Delete, tool keys, undo and redo), `paste`, `dragover`, `drop`.
- Custom canvas events: `annot:loaded` (after an image loads) and `annot:tool` (after a tool change).
- Clipboard: `export.js` writes a PNG with `navigator.clipboard.write`.
- Object URLs: `loadImage` creates one per load and revokes it.

## Verification

- Run: `npm test`
- Run: `npm run test:e2e`
