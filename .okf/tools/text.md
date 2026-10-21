---
type: Annotation Tool
title: "Text tool"
description: "IText that enters edit mode on drop; emptied text is removed."
tags: [tool]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/tools/text.js"
    title: text.js
---

# Overview

`fabric.IText('Text')`. Color is `fill`, font size is `12 + 4 * size`.[^src] `afterDrop` enters editing with all text selected, so typing replaces it. A canvas-level `text:editing:exited` listener removes the object when its text is blank. The removal is deferred with `queueMicrotask` ([pitfall](/pitfalls/fabric-7.md)).

See the [tool contract](/architecture/tool-contract.md).

[^src]: src/tools/text.js
