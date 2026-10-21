---
type: Module
title: "Style panel"
description: "Color and size inputs that style new objects and the selection."
tags: [module]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/style.js"
    title: src/style.js
---

# Overview

`Annot.style()` returns `{ color, size }` for new objects.[^src] On `input`, the panel applies the style to the selection live. On `change`, it fires `object:modified` once per selected object, so one slider drag is one [undo](/modules/undo-redo.md) step.

[^src]: src/style.js
