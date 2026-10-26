# src/tools

## Overview

One file per annotation tool. Each file calls `Annot.registerTool(tool)` at load. `src/app.js` then adds a toolbar button and a key for the tool. The full contract is in `.okf/architecture/tool-contract.md`. Per-tool notes are in `.okf/tools/`.

## Interface

| File | Tool id | Key | Kind | Fabric class | Size sets |
|---|---|---|---|---|---|
| `box.js` | `box` | `b` | drag | `Box` (extends `fabric.Rect`) | stroke width |
| `arrow.js` | `arrow` | `a` | drag | `Arrow` (extends `fabric.Polyline`) | stroke width |
| `text.js` | `text` | `t` | click | `fabric.IText` | font size (`12 + size * 4`) |
| `step.js` | `step` | `n` | click | `Step` (extends `fabric.Group`) | scale (`(size + 2) / 5`) |
| `blur.js` | `blur`, `pixelate` | `u`, `p` | drag | `Blur` (extends `fabric.Rect`) | strength |

Each tool object has these fields: `id`, `label`, `key`, `create(point, style)`, `applyStyle(obj, style)`, and optional `drag(obj, start, end)` and `afterDrop(obj)`. `style` is `{ color, size }`, with `size` from 1 to 10.

## Invariants

- Each `key` is one lowercase character that no other tool uses. Select owns `v`. A duplicate key throws at load.
- A custom class must call `fabric.classRegistry.setClass` and must set its defaults in its constructor, not in `create`. Undo rebuilds objects from JSON, so a flag set only in `create` is lost.
- `Box` and `Arrow` set `perPixelTargetFind: true`. A press inside a box goes to the active tool, not to the box.
- `Blur` renders from `canvas.backgroundImage` in `_render`. It keeps `objectCaching: false`, so it re-renders live as it moves. It serializes `mode` and `strength` through `static customProperties`.
- `blur.js` shares one scratch canvas for all pixelate renders. This is safe only while rendering stays synchronous.
- `Step` hides its resize handles. Its scale comes from `size`, so a handle resize would snap back on the next size change.
- `applyStyle` must return `obj`.
- To add a tool, add one file here and one `<script>` line in `index.html`. Script order sets the toolbar order.

## Side Effects

- Each file registers a toolbar button and a key through `Annot.registerTool`.
- `step.js` listens to `object:added` and `object:removed` on `Annot.canvas`. It renumbers every step by z-order.
- `text.js` listens to `text:editing:exited` on `Annot.canvas`. It removes text that is empty after trim, in a microtask.

## Verification

- Run: `npm run test:e2e`
