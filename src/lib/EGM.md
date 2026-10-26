# src/lib

## Overview

Pure logic with no DOM and no Fabric. Each file is a classic script IIFE. In the browser, it adds its export to `globalThis.Annot`. In Node, it writes to `module.exports`, so unit tests can `require` it. `index.html` loads these files before `src/app.js`.

## Interface

- `fitZoom(w, h, maxW, maxH)` (`fit.js`): returns the zoom that fits a `w` x `h` image in a `maxW` x `maxH` viewport. The result is never more than 1.
- `rectBetween(a, b)` (`geometry.js`): returns `{ left, top, width, height }` for the rect between two corner points. `left` and `top` are the center (Fabric center origin). Corner order does not matter.
- `stepNumbers(tools)` (`steps.js`): maps an array of tool ids in z-order to step numbers. Each `'step'` gets the next number from 1. Other entries get `null`.
- `history` (`history.js`): immutable undo and redo stacks.
  - `history.create(present)` returns `{ past: [], present, future: [] }`.
  - `history.record(h, snap)` pushes `present` to `past` and clears `future`. If `snap === h.present`, it returns `h` unchanged.
  - `history.undo(h)` and `history.redo(h)` move one snapshot. With an empty stack, they return `h` unchanged.

## Invariants

- No function mutates its arguments. `history` functions return new objects.
- No file may use `document`, `window`, or `fabric`. Node must be able to `require` each file.
- Keep the UMD-style wrapper `(typeof module === 'object' ? module.exports : (globalThis.Annot ??= {}))`. Do not convert to ES modules: Chrome blocks them on `file://` (see `.okf/decisions/classic-scripts.md`).
- The `history` stacks have no size limit (marked `shortcut:` in `history.js`).

## Side Effects

- None at call time. At load, each file adds one property to `globalThis.Annot` (browser) or `module.exports` (Node).

## Verification

- Run: `npm test` (`test/unit/lib.test.js`)
