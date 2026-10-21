---
type: Decision
title: "Single-file build"
description: "Ship one self-contained HTML file that opens from file://."
tags: [decision]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
---

# Decision

`npm run build` inlines Fabric and all app scripts and CSS into `dist/annotate.html`. Deploy = copy the file, or host it on any static `https` host.

# Consequences

No server and no network at run time. See [build](/modules/build.md).
