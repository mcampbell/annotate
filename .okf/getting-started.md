---
type: Reference
title: "Getting started \u2014 Annotate"
description: "Entry point: what Annotate is, how to build, run, and test it."
tags: [getting-started]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
sources:
  - id: readme
    resource: "repo annotate: README.md"
    title: README
---

# Overview

Annotate is a browser app. It loads an image (paste, file picker, drag-drop), adds movable and resizable annotations, and copies the result to the clipboard as a PNG at native size.[^readme] It runs from a `file://` URL in Chrome or Edge.

# Commands

| Command | Result |
|---|---|
| `npm install` | Installs Fabric.js 7 and Playwright |
| `npm run build` | Writes the single file `dist/annotate.html` |
| `npm test` | Unit tests for pure logic and the build |
| `npm run test:e2e` | Builds, then runs Playwright against `dist/annotate.html` in installed Chrome |

# Where to go next

* [Architecture](/architecture/overview.md) and the [tool contract](/architecture/tool-contract.md).
* [Tools](/tools/index.md), [modules](/modules/index.md), [decisions](/decisions/index.md).
* [Fabric 7 pitfalls](/pitfalls/fabric-7.md) before you change canvas code.
* [Testing](/testing.md).

[^readme]: README.md
