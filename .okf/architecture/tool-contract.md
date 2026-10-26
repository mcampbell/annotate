---
type: Interface
title: "Tool contract"
description: "How a tool registers with Annot.registerTool and what each field must do."
tags: [architecture, tools]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-22T18:10:00Z' }
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
| `key` | string | One lowercase character that selects the tool ([decision](/decisions/tool-hotkeys.md)). Required. A missing key throws at load. A key that another tool has throws `Tool <id>: key "<k>" is taken by <other>`. The button gets `title="<label> (<K>)"` and `aria-keyshortcuts`. |
| `create(point, style)` | function | Returns a Fabric object at `point` (scene coords). `style` is `{ color, size }`, size 1-10. |
| `drag(obj, start, end)` | function, optional | Makes it a drag tool. Reshapes `obj` to span `start` to `end` on every mouse move. |
| `applyStyle(obj, style)` | function | Sets color and size on `obj`. Returns `obj`. |
| `afterDrop(obj)` | function, optional | Runs after add and select. Text uses it to enter edit mode. |

# Rules

* A press starts only on empty canvas, with the left button or touch, when an image is loaded and a tool other than Select is active. A press on an object selects it.
* Click tool (no `drag`): the press places the object. Drag tool: the press adds a preview with `excludeFromExport` (so undo ignores it); mouse-up commits it and fires `object:modified`, or removes it if the drag is under 5 screen px ([decision](/decisions/drag-to-draw.md)). The release point sets the final shape. A `touchcancel`, a new press after a lost mouse-up, or an undo or image load mid-drag drops the preview.
* `annotTool` and `annotSize` serialize for every class because `app.js` sets `fabric.BaseFabricObject.customProperties = ['annotTool', 'annotSize']` ([pitfall](/pitfalls/fabric-7.md)).
* Box and Arrow set `perPixelTargetFind: true`: they hit only where they draw pixels ([decision](/decisions/outline-hit.md)).
* A custom class must call `fabric.classRegistry.setClass` and set its defaults in the constructor, not in `create`, so [undo](/modules/undo-redo.md) restores it intact.
* To add a tool: one file in `src/tools/` with a free `key`, and one `<script>` line in `index.html`. Select owns `v`.

[^app]: src/app.js
