---
type: Decision
title: "Click to drop"
description: "A tool click drops a default-size object; the user then moves and resizes it."
tags: [decision]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
---

# Decision

No drag-to-draw. A click on empty canvas drops a default-size object centered on the click. The tool stays active. A click on an object selects it. **Select** is the default tool so an empty click clears the selection.

# Consequences

One gesture per tool, and less code: each tool only builds an object. See the [tool contract](/architecture/tool-contract.md).
