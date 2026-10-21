---
type: Playbook
title: "Testing"
description: "How Annotate is tested: Node unit tests for pure logic, Playwright e2e in installed Chrome over file://."
tags: [testing]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
sources:
  - id: pkg
    resource: "repo annotate: package.json"
    title: package.json
---

# Overview

* Unit: `npm test` runs `node --test test/unit/*.test.js` over `src/lib/*` and `build.js`.[^pkg]
* E2E: `npm run test:e2e` builds, then runs `test/e2e/*.test.js` one file at a time with a 60 s per-test timeout. Playwright uses `channel: 'chrome'` (installed Google Chrome), not a downloaded Chromium, and grants clipboard permissions.
* Helpers in `test/e2e/helpers.js`: a checkerboard PNG maker, `pasteImage` (waits for the expected size), `clickScene` (scene to screen via zoom), `exportedPixel`, and `teardown`, which closes Chrome in a `finally`. An open browser keeps node alive and the run hangs.

# Rules

* Test our code only. Do not add tests that prove Fabric or the browser does what it documents; settle those questions by reading the source.
* Every e2e test fails on any uncaught page error.
* Mutation check new logic by hand: flip it, run its tests, confirm a failure, revert.

[^pkg]: package.json
