---
type: Decision
title: "Use the latest Fabric.js"
description: "Fabric.js 7 gives select, move, resize, and serialization for free; track the latest release."
tags: [decision]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: '2026-10-21T19:31:00Z' }
---

# Decision

Use Fabric.js (7.4.0 at creation) for object interaction. The design named v6; the owner prefers the latest version and treats the design as a guide.

# Consequences

Fabric 7 changes defaults from v5/v6 knowledge. Read [Fabric 7 pitfalls](/pitfalls/fabric-7.md) and the installed source (`node_modules/fabric/dist/index.mjs`) before you trust memory.
