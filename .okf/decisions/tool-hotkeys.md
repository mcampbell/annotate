---
type: Decision
title: "Tool hotkeys"
description: "One letter key selects each tool, as a button click does; Escape selects Select or cancels a drag."
tags: [decision, tools, keyboard]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-22T15:42:25Z' }
sources:
  - id: app
    resource: "repo annotate: src/app.js"
    title: app.js
  - id: design
    resource: "repo annotate: docs/design.md"
    title: "Design, slice S9"
---

# Context

The owner wanted to pick a tool from the keyboard, "a" for Arrow. A key selects the tool. It does not place an object.[^design]

# Decision

| Key | Tool | Why this letter |
|---|---|---|
| V | Select | Figma and Photoshop use it. |
| B | Box | First letter. |
| A | Arrow | First letter. |
| T | Text | First letter. |
| N | Step | Number. Select's first letter is S. |
| U | Blur | blUr. Box has B. |
| P | Pixelate | First letter. |
| Esc | Select | |

* Each tool declares its own `key` in the [tool contract](/architecture/tool-contract.md). A duplicate key throws at load, so a clash cannot pass silently.
* One `keydown` listener in `app.js` does nothing while the user types text, or while Cmd, Ctrl, or Alt is down. Paste, copy, and undo keep their keys.[^app]
* Shift and Caps Lock do not matter: the lookup lowercases the key.
* During a [drag](/decisions/drag-to-draw.md), tool keys do nothing. Escape cancels the drag and keeps the tool. A switch to Select would turn on Fabric's box selection under the held mouse button. The cancel path is the one `touchcancel` uses, so it adds no undo step.
* Non-Latin keyboard layouts are out of scope: one user, Latin layout.

# Consequences

Each new tool must pick a free letter. The toolbar shows the key in each button tooltip.

[^app]: src/app.js
[^design]: docs/design.md, slice S9
