---
type: Architecture
title: "Annotate architecture"
description: "Classic scripts share one globalThis.Annot namespace around a single Fabric canvas."
tags: [architecture]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T21:00:00Z' }
sources:
  - id: app
    resource: "repo annotate: src/app.js"
    title: app.js
---

# Overview

Every source file is a classic `<script>`: an IIFE that reads and extends `globalThis.Annot`.[^app] ES modules are not used because Chrome blocks them on `file://` ([decision](/decisions/classic-scripts.md)). `index.html` fixes the load order: Fabric, `src/lib/*`, `src/app.js` (creates `Annot.canvas`), then modules, then tools.

# Modules

| File | Role | Concept |
|---|---|---|
| `src/app.js` | Canvas, tool registry, click-to-drop, Delete key, `loadImage`, `isTyping` | [tool contract](/architecture/tool-contract.md) |
| `src/input.js` | Paste, Open button, drag-drop | [image input](/modules/image-input.md) |
| `src/style.js` | Color and size panel | [style panel](/modules/style-panel.md) |
| `src/export.js` | Copy PNG | [clipboard export](/modules/clipboard-export.md) |
| `src/undo.js` | Undo and redo | [undo/redo](/modules/undo-redo.md) |
| `src/tools/*.js` | One file per tool | [tools](/tools/index.md) |
| `src/lib/*.js` | Pure logic (`fitZoom`, `stepNumbers`, `history`), also `require`-able from Node | [testing](/testing.md) |
| `build.js` | Inline everything into one HTML file | [build](/modules/build.md) |

# Data flow

1. An image source calls `Annot.loadImage(blob)`. It sets the image as `canvas.backgroundImage` at scene (0,0), natural size, and zooms the canvas to fit. Scene coordinates equal image pixels.
2. `loadImage` fires the custom canvas event `annot:loaded`. Export enables Copy; undo resets history.
3. A press with an active tool calls the tool's `create` and tags the object with `annotTool`. A click tool adds it at once; a drag tool reshapes it until mouse-up ([tool contract](/architecture/tool-contract.md)).
4. Undo listens to `object:added`, `object:modified`, `object:removed`.

[^app]: src/app.js
