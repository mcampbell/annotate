---
type: Module
title: "Style panel"
description: "Color and size inputs that style new objects and the selection."
tags: [module]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-22T19:30:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/style.js"
    title: src/style.js
---

# Overview

`Annot.style()` returns `{ color, size }` for new objects.[^src] On `input`, the panel applies the style to the selection live. On `change`, it fires `object:modified` once per selected object, so one slider drag is one [undo](/modules/undo-redo.md) step.

[^src]: src/style.js

# Size sources

The slider is the one store of the current size. Three things set it:

* **Selection** (`selection:created`, `selection:updated`): if every selected object has one `annotSize`, the slider shows it, with no `input` event, so nothing restyles. Mixed sizes leave the slider.[^src]
* **Active tool** (`annot:tool`, fired by `selectTool` in `app.js`; and `selection:cleared`): with nothing selected, the slider shows the tool's own size from an in-memory map. Every tool starts at the slider default (3). The map resets on reload. Select has no size.[^src]
* **User** (drag or wheel): an `input` with nothing selected stores the size for the active tool. With a selection, it changes only the selected objects.

`annotSize` is a serialized custom property (`fabric.BaseFabricObject.customProperties` in `app.js`), so [undo](/modules/undo-redo.md) keeps it. It records the last size set on the object, because some size maps lose data (Step size sets `scale`, which a resize handle also changes). A color `input` keeps each object's own `annotSize`.

# Wheel

A `wheel` listener on `#stage` steps the slider and dispatches `input`, the same path as a drag.[^src]

* Target: the selection wins, else the active tool, else nothing (no `preventDefault`). `ctrlKey` (trackpad pinch) is ignored, so browser zoom works.
* A mouse notch (`wheelDeltaY` a non-zero multiple of 120) is one step. Other events add `deltaY` up, one step per 100 px. `deltaY < 0` is up. The native range clamps to 1..10.
* One spin is one undo step: `change` fires 300 ms after the last event, or at once on `mouse:down:before`, so a press that changes the selection cannot lose the step.
* Known gaps: the mouse check is unverified on real macOS hardware. An undo within 300 ms of a spin undoes the step before it.

