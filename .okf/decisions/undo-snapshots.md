---
type: Decision
title: "Undo by object snapshots"
description: "Undo stores JSON of annotation objects, not commands and not the background image."
tags: [decision]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
---

# Decision

Store full JSON snapshots of the objects in an immutable past/present/future history (`src/lib/history.js`). Exclude the background image, because it is large and only changes on a new load, which resets history.

# Consequences

* Every custom class must register with `classRegistry` and set its defaults in the constructor.
* No per-action inverse code. See [undo/redo](/modules/undo-redo.md).
