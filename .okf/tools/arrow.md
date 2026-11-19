---
type: Annotation Tool
title: "Arrow tool"
description: "Line with a filled head at the tip."
tags: [tool]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-11-19T12:00:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/tools/arrow.js"
    title: arrow.js
---

# Overview

`class Arrow extends Line` ([Line tool](/tools/line.md)), registered as `Arrow`. Line sets the constructor defaults and the poly controls, so the user drags each end; there are no box resize handles. The user drags from the foot (first point) to the tip (last point); `drag` sets both points and calls `setBoundingBox(true)` to recenter.[^src] `_render` draws the head at the last point. Head length = `4 * strokeWidth + 8`. `objectCaching: false` because the head draws outside the bounding box. `perPixelTargetFind: true` (from Line): the arrow hits only on its line and head ([decision](/decisions/outline-hit.md)).

See the [tool contract](/architecture/tool-contract.md).

[^src]: src/tools/arrow.js
