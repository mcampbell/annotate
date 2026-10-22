---
type: Playbook
title: "Testing"
description: "How Annotate is tested: Node unit tests for pure logic, Playwright e2e in installed Chrome over file://."
tags: [testing]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-22T19:50:00Z' }
sources:
  - id: pkg
    resource: "repo annotate: package.json"
    title: package.json
---

# Overview

* Unit: `npm test` runs `node --test test/unit/*.test.js` over `src/lib/*` and `build.js`.[^pkg]
* E2E: `npm run test:e2e` builds, then runs `test/e2e/*.test.js` one file at a time with a 60 s per-test timeout. Playwright uses `channel: 'chrome'` (installed Google Chrome), not a downloaded Chromium, and grants clipboard permissions.
* Helpers in `test/e2e/helpers.js`: a checkerboard PNG maker, `pasteImage` (waits for the expected size), `toScreen` (scene to screen via zoom), `clickScene`, `dragScene` and `dragRect` (press, move in steps, release), `exportedPixel`, and `teardown`, which closes Chrome in a `finally`. An open browser keeps node alive and the run hangs.

# Rules

* Test our code only. Do not add tests that prove Fabric or the browser does what it documents; settle those questions by reading the source.
* Every e2e test fails on any uncaught page error.
* Mutation check new logic by hand: flip it, run its tests, confirm a failure, revert.
* One e2e file per slice: `s1-core` to `s13-tool-size`.
* `page.mouse.wheel` reports `wheelDeltaY` 120 for any `deltaY`, so it cannot act as a trackpad. Dispatch a synthetic `WheelEvent` on `#stage` and set `wheelDeltaY` with `Object.defineProperty` (`s11-wheel.test.js`).
* With a drag tool active, a press adds a preview object, and its `object:added` records an undo snapshot. That can hide a missing undo record. Test undo-record paths under the Select tool.
* `page.fill('#size', ...)` under Select stores no tool size. Pick the tool first, then set the size.

[^pkg]: package.json
