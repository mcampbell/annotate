---
type: Annotation Tool
title: "Crop tool"
description: "One crop frame. Copy keeps the area inside it. The image itself does not change."
tags: [tool]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-11-19T16:00:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/tools/crop.js"
    title: crop.js
  - id: export
    resource: "repo annotate: src/export.js"
    title: export.js
---

# Overview

`class Crop extends fabric.Rect`, registered as `Crop`. Tool id `crop`, label `Crop`, key `x`. The user drags the frame corner to corner, as [Box](/tools/box.md) does. Shift keeps it square with `Annot.snapSquare` ([decision](/decisions/shift-snap.md)).[^src]

The frame is an object, not an edit to the image ([decision](/decisions/crop-frame.md)). On screen, `_render` dims the image outside the frame (an even-odd fill) and draws a black and white dashed outline 1 screen px wide. `perPixelTargetFind: true`: only the outline hits, so a press inside the frame goes to the active tool. No rotation: export needs an axis-aligned area. Color and size do not apply: `applyStyle` returns the frame unchanged.[^src]

One frame at a time: an `object:modified` listener removes the other frames when a frame commits. The removal runs in the same task as the commit, so [undo](/modules/undo-redo.md) records one step, and one undo brings the old frame back.[^src]

[Copy](/modules/clipboard-export.md) exports only the area inside the frame.[^export]

[^src]: src/tools/crop.js
[^export]: src/export.js
