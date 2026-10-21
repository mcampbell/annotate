# Annotate - design

Browser image annotator. Paste/upload/drop image, add annotations as movable/resizable objects, copy result as PNG to clipboard.

## Constraints (from user)

- Fabric.js 7.4.0 UMD (`node_modules/fabric/dist/index.min.js`). v7 is current; v6 was the plan.
- `npm run build` inlines all scripts into one file: `dist/annotate.html`. Opens from `file://`.
- Opened as `file://` directly. No server.
- Chrome/Edge only.
- Required basics: delete selected, undo/redo, auto-renumber step bubbles.

## Decisions (mine)

- **Classic scripts, no ES modules.** Chrome blocks `<script type="module">` on `file://` (CORS). Each file is an IIFE that attaches to `window.Annot`. Load order fixed in `index.html`.
- **Tool registry.** Each tool file calls `Annot.registerTool(...)`. Toolbar buttons come from the registry. Tool slices touch only their own file plus one `<script>` line.
- **Click-to-drop.** Click on empty canvas drops object at default size. Click on existing object selects it. Tool stays active after drop. No drag-to-draw.
- **Export at native resolution.** Canvas display uses `canvas.setZoom(fit)`. Copy uses `toBlob` via `toDataURL({ multiplier: 1 / zoom })`.
- **Base image = `canvas.backgroundImage`.** Not selectable, not deletable, not in undo stack as object.
- **All state lives on canvas objects.** No side tables. Undo (S7) snapshots `canvas.toJSON()` only.
- **Style panel = color + size.** Applies to new objects and to current selection, via each tool's `applyStyle`.
- **Delete key guard** (`obj.isEditing`) ships in S1, so text editing (S4) does not delete objects.

## Module layout

```
index.html            layout, toolbar, style panel, ordered <script> tags
node_modules/fabric   Fabric.js 7 UMD (inlined by build.js)
src/app.js            Annot namespace, canvas init, registry, active tool, click dispatch, Delete key
src/input.js          image sources -> Annot.loadImage(blob)
src/style.js          color/size controls -> new objects + selection
src/export.js         copy PNG to clipboard
src/tools/<id>.js     one file per tool
src/undo.js           undo/redo wiring (S7)
src/lib/*.js          pure logic: fit, steps, history
build.js              inline scripts/CSS into dist/annotate.html
test/unit, test/e2e   node --test; Playwright + installed Chrome
```

Tool contract:

```js
Annot.registerTool({
  id: 'box',
  label: 'Box',
  create(point, style) { /* return fabric object at point */ },
  applyStyle(obj, style) { /* set color/size on obj */ },
});
```

Each object carries `annotTool: '<id>'` so `style.js` finds the right `applyStyle`.

## Slices

Run order. S2-S6 can run as parallel work streams after S1.

| # | Slice | Dimension | Usable value | Files |
|---|---|---|---|---|
| S1 | Paste + Box + style + Delete + Copy | walking skeleton, first input, first tool | Paste screenshot, draw highlight boxes, copy to Slack/docs | index.html, app.js, input.js (paste only), style.js, export.js, tools/box.js |
| S2 | Upload + drag-drop | by input | Annotate files from disk | input.js |
| S3 | Arrow | by business case | Point at things | tools/arrow.js |
| S4 | Text | by business case | Label things | tools/text.js |
| S5 | Step bubbles + auto-renumber | by business case | Numbered walkthroughs | tools/step.js |
| S6 | Blur / pixelate | by business case | Hide secrets before sharing | tools/blur.js |
| S7 | Undo / redo | by error-handling depth | Recover from mistakes | history.js, + serialization in arrow/step/blur |

### S1 - skeleton

- `paste` event on `document` -> first `image/*` item -> `Annot.loadImage`.
- `loadImage`: `createImageBitmap` / `FabricImage.fromURL(objectURL)` -> background, canvas sized to image, zoom to fit viewport.
- Box: `Rect`, transparent fill, `stroke = color`, `strokeWidth = size`, `strokeUniform: true` (stroke does not scale on resize).
- Copy: discard selection, render, `toDataURL({ multiplier })` -> blob -> `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`.
- Fail loud: no image loaded -> Copy disabled. Clipboard reject -> visible error message with the reason.
- **First task in S1: spike clipboard write on `file://` in Chrome.** Unconfirmed that `file://` counts as secure context for `clipboard.write`. If it fails, stop and ask user (fallback: download PNG, or local server).

### S2 - more inputs

- `<input type="file" accept="image/*">` button.
- `dragover` / `drop` on window -> first image file.
- Non-image file -> visible error. Not silent.

### S3 - arrow

- Custom class extends `Path` or `Line`, renders shaft + fixed-size head from bounding box diagonal.
- On `scaling`, fold `scaleX/scaleY` into width/height, reset scale to 1. Head size stays tied to `size`, not to scale. Direction via `flipX/flipY`.

### S4 - text

- `IText`, `fill = color`, `fontSize = size * k`. Enters edit mode on drop. Double-click to re-edit.

### S5 - step bubbles

- `Group(Circle + Text)`, `annotTool: 'step'`.
- `renumber()`: steps in canvas z-order get 1..n. Runs on `object:added` and `object:removed`. Idempotent (S7 reload fires these events).
- `renumber` order logic as pure function -> assert in `tests.html`.

### S6 - blur / pixelate

- Custom `Rect` subclass. `_render` draws the background image region under its bounds:
  - pixelate: draw region at `1/size` scale to offscreen canvas, draw back with `imageSmoothingEnabled = false`.
  - blur: `ctx.filter = 'blur(<size>px)'`.
- Mode toggle (blur vs pixelate) on the object. Live: re-renders as it moves.
- Covers base image only. Annotations under it stay visible. Intended: owner prefers this.
- Region math (bounds -> source rect at native res) as pure function -> assert in `tests.html`.

### S7 - undo / redo

- Snapshot `canvas.toJSON(['annotTool', ...custom props])` on `object:added|modified|removed`. Two stacks. Ctrl+Z / Ctrl+Shift+Z.
- Suspend snapshots during `loadFromJSON`.
- Register arrow, step, blur classes in Fabric `classRegistry` with `toObject` / `fromObject`. Blur re-links background on load, does not serialize pixels.
- New image load clears history.
- Stack push/pop/truncate as pure function -> assert in `tests.html`.

## Expected merge conflicts

| ID | Where | Cause | Slices |
|---|---|---|---|
| C1 | `index.html` script tag block | each tool adds one `<script>` line at same spot | S3, S4, S5, S6 concurrent |
| C2 | `src/input.js` | S2 edits paste-only file from S1 | S2 vs any S1 fix |

C1 unlocks four parallel tool streams. Resolve by keeping all lines.

## Expected rework

| ID | What | Why taken |
|---|---|---|
| R1 | S7 adds serialization to arrow, step, blur files | Undo last lets every tool ship without serialization code first. Cheaper than each tool writing it blind. |
| R2 | S5 renumber must stay correct under S7 reload | Event-driven renumber; verify again in S7 |

## Deferred edge cases

- Images larger than Chrome max canvas size (~16k px side). Fail loud only.
- Multiple images in one paste: first wins.
- Rotation: Fabric gives it free. Not tested for arrow/blur.
- Firefox/Safari clipboard.

## Resolved questions

1. Clipboard write on `file://` in Chrome: works. Spike with Playwright + installed Chrome: `isSecureContext === true`, clipboard read back `image/png`.
2. Fallback: not needed (Q1 works).
3. Blur vs pixelate: two tools, `Blur` and `Pixelate`, one class with a `mode` prop.
4. Step bubble color: per bubble, from style panel, same as other tools.

## Implementation notes

- Default origin in Fabric 7 is `center`: objects drop centered on click.
- `Select` pseudo-tool (default) so empty-canvas click deselects instead of dropping.
- Arrow = `Polyline` subclass, 2 points, `controlsUtils.createPolyControls` for endpoint handles.
- Undo snapshots objects only (not background image). `FabricObject.customProperties = ['annotTool']`.
- New image load clears annotations and history.
- Tests: `npm test` (node unit, pure logic), `npm run test:e2e` (Playwright + installed Chrome against `dist/annotate.html`).

## Tasks

- [x] Clipboard spike on `file://`
- [x] Unit tests + pure libs (fit, steps, history, build inline)
- [x] S1 paste + box + style + delete + copy
- [x] S2 upload + drag-drop
- [x] S3 arrow
- [x] S4 text
- [x] S5 step bubbles + renumber
- [x] S6 blur / pixelate
- [x] S7 undo / redo
- [x] Build to `dist/annotate.html`
- [x] E2E tests green
- [x] Mutation check (12/12 killed)
- [x] code-reviewer loop clean (2 passes, findings fixed)
- [x] Commit on `annotate-app`
- [x] README
- [x] /okf:okf (`.okf/`, strict-valid)
