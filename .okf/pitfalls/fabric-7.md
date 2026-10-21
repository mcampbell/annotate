---
type: Pitfall List
title: "Fabric 7 pitfalls"
description: "Fabric.js 7 behaviors that broke or nearly broke this app, each with the fix in use."
tags: [fabric, pitfall]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
sources:
  - id: fabric
    resource: "repo annotate: node_modules/fabric/dist/index.mjs"
    title: Fabric.js 7.4.0 source
---

# Overview

Each item was confirmed in `node_modules/fabric/dist/index.mjs` (7.4.0) or by an e2e test.[^fabric]

| Pitfall | Fix in this app |
|---|---|
| Default `originX`/`originY` is `center`. | Objects drop centered. The background image sets `left`/`top` origin explicitly. |
| `toObject` merges `BaseFabricObject.customProperties` plus the class's own list. A subclass list hides `fabric.FabricObject.customProperties`. | Set `annotTool` on `fabric.BaseFabricObject`. |
| Instance `type` getter returns lowercase (`'arrow'`). | Tests compare `obj.constructor.type`. |
| `exitEditing` fires `text:editing:exited`, then uses `this.canvas`. Removing the object in the handler throws. | Defer the removal with `queueMicrotask`. |
| `exitEditing` fires `object:modified` when text changed. | Undo records typed text with no extra code. |
| `toCanvasElement(m)` sizes output as `width * m`; float error can drop 1 px. | Export sets zoom 1 and passes exact width and height. |
| `mouse:down` fires for right and middle buttons; touch events have no `button`. | Guard with `e.button > 0`. |
| Cached objects do not see background changes. | Blur and Arrow use `objectCaching: false`. |
| `canvas.remove(...many)` fires `object:removed` once per object. | Undo coalesces records per task. |

[^fabric]: node_modules/fabric/dist/index.mjs
