---
type: Annotation Tool
title: "Box tool"
description: "Outlined rectangle. Size is stroke width."
tags: [tool]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-22T18:40:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/tools/box.js"
    title: box.js
---

# Overview

`class Box extends fabric.Rect`, registered as `Box`, dragged corner to corner (`Annot.rectBetween`, pure and unit tested), transparent fill, `strokeUniform: true` so the stroke keeps its width on resize. Color is `stroke`, size is `strokeWidth`.[^src] `perPixelTargetFind: true` in the constructor: the box hits only on its outline ([decision](/decisions/outline-hit.md)).

See the [tool contract](/architecture/tool-contract.md).

[^src]: src/tools/box.js
