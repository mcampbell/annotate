# Annotate Blueprint

## System Overview

Annotate is a browser app. It loads one image, adds annotations on a Fabric.js canvas, and copies the result to the clipboard as a PNG at natural image size. There is no server. `build.js` inlines all scripts and CSS into one file, `dist/annotate.html`, which opens from `file://` in Chrome or Edge. For development, open `index.html`. It loads `src/` and `node_modules/fabric` directly.

Read `.okf/index.md` for the knowledge bundle (architecture, decisions, Fabric 7 pitfalls). Read `README.md` for features and usage.

## Local Interface & Invariants

- `build.js`
  - `inline(html, read)`: replaces each `<script src>` and `<link rel="stylesheet">` with its inlined file content. It escapes `</script` in scripts. It throws `not inlined: <tag>` if a script or stylesheet tag is left.
  - Run as `node build.js` (`npm run build`): writes `dist/annotate.html`.
- `index.html`: page layout, toolbar, and the script load order. A new script needs one `<script src>` line here.
- `.fallowrc.jsonc`: fallow config. It marks `src/**/*.js` and `src/**/*.css` as entry points, because `index.html` loads them and fallow does not read HTML. It skips duplication checks in `test/`.
- `package.json`: one runtime dependency, `fabric` 7. One dev dependency, `playwright`.

## Subdirectories & System Boundaries

- src: [./src/EGM.md](./src/EGM.md) - app code. Classic scripts that share `globalThis.Annot` and one canvas.
  - src/lib: [./src/lib/EGM.md](./src/lib/EGM.md) - pure logic, also `require`-able from Node.
  - src/tools: [./src/tools/EGM.md](./src/tools/EGM.md) - one file per annotation tool.
- docs: `docs/design.md` and `docs/design-tasks.md` - design and slice plan. No code.
- test: `test/unit/` (Node `node:test`), `test/e2e/` (Playwright, one file per slice), and `test/mutations.js` (mutation list). No contract file.
- scripts: `scripts/mutate.js` - mutation check. No contract file.
- `.okf/`: knowledge bundle (OKF v0.2). Read it as a source.
- `dist/` and `node_modules/`: generated. Do not edit.

## Global Invariants

- The built file must have no external references. `inline` throws if a tag stays.
- Use classic scripts only. Chrome blocks ES modules on `file://`.
- Test our code only. Do not add tests that prove what Fabric or the browser documents.
- E2E tests run in installed Google Chrome (`channel: 'chrome'`), not in a downloaded Chromium.

## Global Side Effects

- `npm run build` writes `dist/annotate.html`.
- `npm run test:mutate` rewrites one source file at a time and restores it after each test run, also on Ctrl-C. It rebuilds `dist/annotate.html` at the end.
- At run time, the app writes to the system clipboard and reads files from paste, drag-drop, and the file picker. It sends nothing over the network.

## System Verification

- Run: `npm test` (unit: `src/lib/*` and `build.js`)
- Run: `npm run test:e2e` (builds, then runs Playwright e2e)
- Run: `fallow audit --base main` (quality check: dead code, complexity, duplication; fallow is installed globally, not in `package.json`)
- Run: `npm run test:mutate [filter]` (applies each entry in `test/mutations.js`, runs its test, expects a failure, restores the file; exit 1 if a mutation survives or an entry is invalid)
