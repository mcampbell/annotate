---
type: Decision
title: "Outline-only hit for Box and Arrow"
description: "Box and Arrow hit only where they draw pixels, so a press inside a box or beside an arrow goes to the active tool."
tags: [decision, tools, fabric]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-22T18:10:00Z' }
sources:
  - id: fabric
    resource: "repo annotate: node_modules/fabric/dist/index.mjs (Fabric 7.4.0)"
    title: "Fabric canvas target search"
  - id: design
    resource: "repo annotate: docs/design.md"
    title: "Design, slice S10"
---

# Context

A press inside a box selected the box, so the owner could not draw inside it. The empty bounding box of a diagonal arrow had the same problem.[^design]

# Decision

* Box and Arrow set `perPixelTargetFind: true`. Fabric then hits them only where the rendered pixel is not transparent. Box fill is `transparent`, so its interior misses.[^fabric]
* With `preserveObjectStacking`, a selected object wins only on its controls (or with Alt). Its interior goes through the same pixel check, so a selected box does not catch presses inside it either.[^fabric]
* The canvas sets `targetFindTolerance: 4` (screen px). A size 1 outline is under 1 screen px wide when the image is zoomed out. Only per-pixel objects use the tolerance.
* The flag is a constructor default. `toObject` does not serialize it, and [undo](/modules/undo-redo.md) rebuilds objects from JSON. So Box became its own class, type `Box`, registered with `classRegistry` ([tool contract](/architecture/tool-contract.md)).
* Blur, Pixelate, Step, and Text keep bounding-box hit: their interior is their content.

# Consequences

* A press just outside an outline misses: Fabric checks the bounding box before the pixels. Box `padding` would fix it, and also draw the selection frame further out. The owner chose no padding for now.
* Each hover inside a Box or Arrow bounding box renders that object once for the pixel check. Both render cheaply. Not measured.

[^fabric]: node_modules/fabric/dist/index.mjs, `findTarget`, `_checkTarget`, `isTargetTransparent`
[^design]: docs/design.md, slice S10
