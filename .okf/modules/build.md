---
type: Build Script
title: "Single-file build"
description: "build.js inlines every local script and stylesheet into dist/annotate.html."
tags: [module]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
sources:
  - id: src
    resource: "repo annotate: build.js"
    title: build.js
---

# Overview

`inline(html, read)` replaces `<script src="...">` and `<link rel="stylesheet" href="...">` with file contents, escaping `</script` inside code.[^src] It throws `not inlined: <tag>` if any local script or stylesheet tag remains, so the build never ships a file that breaks on `file://`. Output: `dist/annotate.html` (about 300 KB, mostly Fabric). See [single-file build](/decisions/single-file-build.md).

[^src]: build.js
