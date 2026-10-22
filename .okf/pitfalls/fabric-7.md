---
type: Pitfall List
title: "Fabric 7 pitfalls"
description: "Fabric.js 7 behaviors that broke or nearly broke this app, each with the fix in use."
tags: [fabric, pitfall]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-22T19:30:00Z' }
sources:
  - id: fabric
    resource: "repo annotate: node_modules/fabric/dist/index.mjs"
    title: Fabric.js 7.4.0 source
---

# Overview

Each item was confirmed in `node_modules/fabric/dist/index.mjs` (7.4.0) or by an e2e test.[^fabric]

| Pitfall | Fix in this app |
|---|---|
| Default `originX`/`originY` is `center`. | Click tools place centered; `rectBetween` returns center coords for drag tools. The background image sets `left`/`top` origin explicitly. |
| `toObject` merges `BaseFabricObject.customProperties` plus the class's own list. A subclass list hides `fabric.FabricObject.customProperties`. | Set `annotTool` and `annotSize` on `fabric.BaseFabricObject`. |
| Instance `type` getter returns lowercase (`'arrow'`). | Tests compare `obj.constructor.type`. |
| `exitEditing` fires `text:editing:exited`, then uses `this.canvas`. Removing the object in the handler throws. | Defer the removal with `queueMicrotask`. |
| `exitEditing` fires `object:modified` when text changed. | Undo records typed text with no extra code. |
| `toCanvasElement(m)` sizes output as `width * m`; float error can drop 1 px. | Export sets zoom 1 and passes exact width and height. |
| `mouse:down` fires for right and middle buttons; touch events have no `button`. | Guard with `e.button > 0`. |
| Cached objects do not see background changes. | Blur and Arrow use `objectCaching: false`. |
| `canvas.remove(...many)` fires `object:removed` once per object. | Undo coalesces records per task. |
| `canvas.toObject()` skips `excludeFromExport` objects. | A drag preview carries the flag, so undo ignores it until mouse-up. |
| Setting a Polyline's `points` does not move its box. | Arrow `drag` calls `setBoundingBox(true)` to recenter on the new points. |
| No `touchcancel` handling: a cancelled touch never fires `mouse:up`. | `app.js` listens for `touchcancel` on `upperCanvasEl` and drops the preview. |

[^fabric]: node_modules/fabric/dist/index.mjs
