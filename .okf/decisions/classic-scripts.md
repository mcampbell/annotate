---
type: Decision
title: "Classic scripts, no ES modules"
description: "Use classic scripts and one global namespace because Chrome blocks module scripts on file://."
tags: [decision]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
---

# Context

The app must open from a `file://` URL. Chrome treats module scripts on `file://` as cross-origin and refuses them.

# Decision

Each file is an IIFE over `globalThis.Annot`. Load order lives in `index.html`. `src/lib/*` also exports via `module.exports` so Node tests can `require` it.

# Consequences

* No bundler is needed; the [build](/modules/build.md) only inlines.
* Load order is an implicit contract (commented in `index.html`).
* A 2026-10-21 spike confirmed `isSecureContext === true` on `file://` in Chrome, and `navigator.clipboard.write` of `image/png` works there.
