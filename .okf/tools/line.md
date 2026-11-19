---
type: Annotation Tool
title: "Line tool"
description: "Two-point polyline with draggable ends and no head. Arrow extends it."
tags: [tool]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-11-19T12:00:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/tools/arrow.js"
    title: arrow.js
---

# Overview

`class Line extends fabric.Polyline`, registered as `Line`. Tool id `line`, key `l`. It lives in `arrow.js` because [Arrow](/tools/arrow.md) extends it: Arrow adds only the head in `_render`.[^src]

The constructor sets the defaults that both classes share: `fill: ''`, `strokeLineCap: 'round'`, `objectCaching: false`, `perPixelTargetFind: true`, and poly controls (one handle per end). The user drags from the first point to the last. Line and Arrow share `drag`, `snap` (`Annot.snapAngle`: Shift snaps to 0, 45, or 90 degrees, see [decision](/decisions/shift-snap.md)), and `applyStyle`, so **Size** (slider or wheel) sets the stroke width and **Color** sets the stroke.[^src]

`perPixelTargetFind`: the line hits only on its pixels ([decision](/decisions/outline-hit.md)).

See the [tool contract](/architecture/tool-contract.md).

[^src]: src/tools/arrow.js
