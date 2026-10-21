---
type: Annotation Tool
title: "Blur and Pixelate tools"
description: "Rect that re-renders the background image region under it, blurred or pixelated."
tags: [tool]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T21:00:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/tools/blur.js"
    title: blur.js
---

# Overview

One class, `Blur extends fabric.Rect`, with `mode` (`blur` or `pixelate`) and `strength` (= size) in `customProperties`. Two tools register it: **Blur** and **Pixelate**. Both are dragged corner to corner, like Box.[^src]

`_render` reads `canvas.backgroundImage` at the object's scene top-left:

* pixelate: draw the region into a small canvas (block = `strength * 4` px), draw it back with `imageSmoothingEnabled = false`.
* blur: clip to the rect, `ctx.filter = blur(strength * 2 px)`, draw the region with a margin.

`objectCaching: false` so it updates live as it moves. Rotation and flip are locked. By design it hides only the image: annotations under it stay visible. The owner prefers this; do not change it.

See the [tool contract](/architecture/tool-contract.md).

[^src]: src/tools/blur.js
