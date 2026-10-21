---
type: Module
title: "Clipboard export"
description: "Copy writes the annotated image as a native-size PNG to the clipboard."
tags: [module]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/export.js"
    title: src/export.js
---

# Overview

`Annot.toCanvas()` sets zoom to 1, renders `toCanvasElement(1, { width, height })` at the image's natural size, and restores the zoom.[^src] This avoids the 1 px loss of `toCanvasElement(1 / zoom)` ([pitfall](/pitfalls/fabric-7.md)). Controls are not drawn.

Copy passes a `Promise<Blob>` to `ClipboardItem` so Chrome keeps the user gesture. Failure shows `Copy failed: <reason>`. Copy is disabled until an image loads. Clipboard write works on `file://` in Chrome ([decision](/decisions/classic-scripts.md)).

[^src]: src/export.js
