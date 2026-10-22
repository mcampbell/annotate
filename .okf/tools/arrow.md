---
type: Annotation Tool
title: "Arrow tool"
description: "Two-point polyline with draggable ends and a filled head."
tags: [tool]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-22T18:40:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/tools/arrow.js"
    title: arrow.js
---

# Overview

`class Arrow extends fabric.Polyline`, registered as `Arrow`. The user drags from the foot (first point) to the tip (last point); `drag` sets both points and calls `setBoundingBox(true)` to recenter. The constructor replaces the controls with `fabric.controlsUtils.createPolyControls(this)`, so the user drags each end; there are no box resize handles.[^src] `_render` draws the head at the last point. Head length = `4 * strokeWidth + 8`. `objectCaching: false` because the head draws outside the bounding box. `perPixelTargetFind: true` in the constructor: the arrow hits only on its line and head ([decision](/decisions/outline-hit.md)).

See the [tool contract](/architecture/tool-contract.md).

[^src]: src/tools/arrow.js
