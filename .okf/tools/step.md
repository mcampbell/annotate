---
type: Annotation Tool
title: "Step tool"
description: "Numbered bubble; numbers follow z-order and renumber on add and remove."
tags: [tool]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/tools/step.js"
    title: step.js
---

# Overview

`class Step extends fabric.Group` of a circle and a white number, registered as `Step`.[^src] Side handles are hidden, so resize stays uniform. Color is the circle fill. Size sets scale `(size + 2) / 5`.

On `object:added` and `object:removed`, `Annot.stepNumbers` (pure, unit tested) numbers the steps 1..n in canvas order. The renumber is idempotent, so [undo](/modules/undo-redo.md) restores correct numbers.

See the [tool contract](/architecture/tool-contract.md).

[^src]: src/tools/step.js
