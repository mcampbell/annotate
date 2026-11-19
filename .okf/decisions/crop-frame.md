---
type: Decision
title: "Crop by frame, not by image edit"
description: "Crop is a frame object that sets the Copy area; the loaded image and the annotations do not change."
tags: [decision, tools, export]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-11-19T16:00:00Z' }
sources:
  - id: export
    resource: "repo annotate: src/export.js"
    title: export.js
  - id: crop
    resource: "repo annotate: src/tools/crop.js"
    title: crop.js
---

# Context

The owner asked for crop that keeps the selected area. [Undo](/modules/undo-redo.md) stores the annotation objects only, not the background image ([decision](/decisions/undo-snapshots.md)). A crop that cuts the image would need undo to store the image or the crop offset too.

# Decision

* Crop is a [frame object](/tools/crop.md). The loaded image and the annotations stay as they are. Undo needs no change.
* `Annot.toCanvas()` renders only the area inside the frame. `Annot.cropBounds` clamps the frame to the image and rounds its edges to whole px. The frame is hidden while the export renders.[^export]
* A frame with no overlap with the image makes Copy fail with `Copy failed: the crop frame is off the image`. A silent whole-image copy would share the part the user meant to cut.[^export]
* One frame at a time. A new frame replaces the old one.[^crop]

# Consequences

* The user can move, resize, delete, or undo the frame at any time before Copy.
* Annotations outside the frame stay on the canvas but are not in the copy.
* A frame added before other annotations sits below them, so their parts outside the frame are not dimmed on screen. The copy is still correct.

[^export]: src/export.js, `exportArea`, `toCanvas`
[^crop]: src/tools/crop.js
