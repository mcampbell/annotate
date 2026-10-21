---
type: Interface
title: "Tool contract"
description: "How a tool registers with Annot.registerTool and what each field must do."
tags: [architecture, tools]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
sources:
  - id: app
    resource: "repo annotate: src/app.js"
    title: app.js
---

# Overview

Each tool file calls `Annot.registerTool(tool)`. `app.js` adds a toolbar button per tool, in script order, after a built-in **Select** button.[^app]

# Schema

| Field | Type | Description |
|---|---|---|
| `id` | string | Stored on each object as `annotTool`. Picks `applyStyle` for the selection. |
| `label` | string | Button text. |
| `create(point, style)` | function | Returns a Fabric object centered on `point` (scene coords). `style` is `{ color, size }`, size 1-10. |
| `applyStyle(obj, style)` | function | Sets color and size on `obj`. Returns `obj`. |
| `afterDrop(obj)` | function, optional | Runs after add and select. Text uses it to enter edit mode. |

# Rules

* A click drops only on empty canvas, with the left button or touch, when an image is loaded and a tool other than Select is active. A click on an object selects it.
* `annotTool` serializes for every class because `app.js` sets `fabric.BaseFabricObject.customProperties = ['annotTool']` ([pitfall](/pitfalls/fabric-7.md)).
* A custom class must call `fabric.classRegistry.setClass` and set its defaults in the constructor, not in `create`, so [undo](/modules/undo-redo.md) restores it intact.
* To add a tool: one file in `src/tools/` and one `<script>` line in `index.html`.

[^app]: src/app.js
