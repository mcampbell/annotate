---
type: Annotation Tool
title: "Circle tool"
description: "Outlined ellipse, dragged corner to corner. Shift makes it a circle. Size is stroke width."
tags: [tool]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-11-19T14:00:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/tools/circle.js"
    title: circle.js
---

# Overview

`class Oval extends fabric.Ellipse`, registered as `Oval`. Tool id `circle`, label `Circle`, key `c`. The drag sets the bounding box corner to corner, as [Box](/tools/box.md) does: `drag` takes `Annot.rectBetween` and sets `rx` and `ry` to half the width and height. With Shift, `snap: Annot.snapSquare` makes the box square, so the shape is a circle ([decision](/decisions/shift-snap.md)).[^src]

The type is `Oval`, not `Circle`. [Step](/tools/step.md) builds on `fabric.Circle`, and `classRegistry.setClass` with type `Circle` would replace that class when undo rebuilds a step.[^src]

The constructor sets transparent fill, `strokeUniform: true`, and `perPixelTargetFind: true`: the circle hits only on its outline ([decision](/decisions/outline-hit.md)). Color is `stroke`, size is `strokeWidth`.

See the [tool contract](/architecture/tool-contract.md).

[^src]: src/tools/circle.js
