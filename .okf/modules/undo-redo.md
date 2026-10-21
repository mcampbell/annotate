---
type: Module
title: "Undo and redo"
description: "Object-only JSON snapshots, coalesced per task, restored with enlivenObjects."
tags: [module]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
sources:
  - id: src
    resource: "repo annotate: src/undo.js"
    title: src/undo.js
---

# Overview

Ctrl/Cmd+Z undoes, with Shift redoes. Skipped while the user types text.[^src]

* Snapshot: `JSON.stringify(canvas.toObject().objects)`. The background image is not in it ([decision](/decisions/undo-snapshots.md)). `canvas.toObject()` puts objects inside a multi-selection back into scene coords.
* Record: on add, modify, remove, at most once per task (`queueMicrotask`), so a multi-object delete is one step. Equal snapshots are dropped.
* Restore: enliven first, then swap objects, then move the history pointer. A `busy` flag blocks records and key presses during restore. A failure shows `Undo failed: ...`.
* `annot:loaded` resets history. Stacks are unbounded (marked shortcut in `src/lib/history.js`).

[^src]: src/undo.js
