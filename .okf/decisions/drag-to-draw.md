---
type: Decision
title: "Drag to draw"
description: "Box, Arrow, Blur, and Pixelate draw by click-drag from start to end; Step and Text place on click."
tags: [decision]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T21:00:00Z' }
---

# Context

With [click-to-drop](/decisions/click-to-drop.md), the user had to resize or reshape every object after it appeared. The owner asked for click-drag instead.

# Decision

* Box, Blur, Pixelate: drag corner to corner, in any direction.
* Arrow: drag from the foot to the tip.
* Step and Text: click to place. They have no natural start and end.
* A drag shorter than 5 screen px makes nothing, so a stray click leaves no object and no undo step.

# Consequences

The [tool contract](/architecture/tool-contract.md) gains an optional `drag(obj, start, end)`. During the drag the object is on the canvas as a live preview but marked `excludeFromExport`, which keeps it out of [undo](/modules/undo-redo.md) snapshots until it commits.
