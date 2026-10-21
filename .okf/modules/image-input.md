---
type: Module
title: "Image input"
description: "Paste, Open button, and drag-drop all feed Annot.loadImage."
tags: [module]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/input.js"
    title: src/input.js
---

# Overview

* Paste: the first `image/*` file in `clipboardData`. No image shows `Clipboard has no image.` Skipped while the user types text.[^src]
* Open: a button that clicks a hidden `<input type=file>`. The value resets so the same file reopens.
* Drag-drop: on `window`. A non-image shows `Not an image: <name>`.

`loadImage` replaces the image and clears all annotations and history. A newer load wins over a slower older one (sequence token). A decode failure shows `Could not load image: ...`.

[^src]: src/input.js
