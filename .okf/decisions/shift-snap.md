---
type: Decision
title: "Shift snaps while drawing"
description: "Shift during a drag makes Box, Circle, and Crop square and snaps Line and Arrow to 0, 45, or 90 degrees."
tags: [decision, tools, keyboard]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-11-19T14:00:00Z' }
sources:
  - id: app
    resource: "repo annotate: src/app.js"
    title: app.js
  - id: geometry
    resource: "repo annotate: src/lib/geometry.js"
    title: geometry.js
---

# Context

The owner wanted Shift to snap shapes while drawing: square boxes, round circles, and straight or 45-degree lines and arrows. Text, Step, Blur, and Pixelate do nothing special.

# Decision

* A tool opts in with an optional `snap(start, end)` in the [tool contract](/architecture/tool-contract.md). It returns a new end. `app.js` calls it in place of the raw end when Shift is down.[^app]
* Box, [Circle](/tools/circle.md), and [Crop](/tools/crop.md): `snapSquare`. The side is the larger of the two drag distances, in the drag direction from the start corner.[^geometry]
* [Line](/tools/line.md) and [Arrow](/tools/arrow.md): `snapAngle`. The end stays under the mouse on one axis: horizontal keeps the mouse x, vertical keeps the mouse y, and 45 degrees uses the larger distance. The sectors split at 22.5 degrees.[^geometry]
* Snap applies only while drawing. A later handle edit stays free.
* The Shift state at each moment decides. A Shift press or release mid-drag redraws the preview with no mouse move, so the shape does not jump at mouse-up.[^app]
* The 5 screen px short-drag check uses the raw mouse distance, not the snapped end. It tells a click from a drag. A snapped end is never shorter than 0.92 of the raw drag.

# Consequences

A new drag tool gets no snap unless it declares `snap`. The snap functions are pure and live in `src/lib/geometry.js`, with unit tests.

[^app]: src/app.js, `dragEnd`, `redraw`, `onShift`
[^geometry]: src/lib/geometry.js
