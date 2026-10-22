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
| S9 | Tool hotkeys | by input (keyboard) | Pick a tool without the mouse | app.js, tools/*.js |
| S10 | Outline-only hit for Box and Arrow | by business case | Draw inside a box or near an arrow without selecting it | app.js, tools/box.js, tools/arrow.js |
| S11 | Wheel changes size | by input (wheel) | Resize without the slider | style.js |
| S12 | Slider shows the selected object's size | by business case | See and adjust the size of what you selected | style.js, app.js |
| S13 | Size per tool | by business case | Each tool keeps its own size | style.js, app.js |

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

### S9 - tool hotkeys

Added 2026-10-22. One slice: the change is one handler plus one field per tool. Too small to split.

Key selects the tool, same as a button click. It does not place anything.

| Key | Tool | Why this letter |
|---|---|---|
| V | Select | Figma/Photoshop convention |
| B | Box | first letter |
| A | Arrow | first letter |
| T | Text | first letter |
| N | Step | Number. S is taken by Select's first letter. |
| U | Blur | blUr. B is taken by Box. |
| P | Pixelate | first letter |
| Esc | Select | |

Decisions (mine):
- Tool contract gains required `key` (one lowercase char). Changed from optional in build: every tool has one, and a missing key throws at load. `registerTool` passes it to `addButton`. Select passes `'v'` direct.
- `addButton(id, label, key)` records `key -> id` in a map, sets `title = "Arrow (A)"` and `aria-keyshortcuts = "A"`.
- Duplicate key throws at load. E2E `pageerror` check catches it. No silent overwrite.
- One `keydown` listener in `app.js`, beside the Delete listener:
  - return when `isTyping(e)` or `metaKey` / `ctrlKey` / `altKey` held. Keeps Cmd+V, Cmd+Z, Cmd+C, and text entry intact.
  - while `drawing` (drag in progress): `Escape` -> `cancelDrawing()`, tool stays. Every other key -> no-op (owner request).
  - else `Escape` -> `'select'`. Else `keys[e.key.toLowerCase()]`. Lowercase covers Caps Lock and Shift.
  - hit -> `selectTool(id)`. Miss -> do nothing, no `preventDefault`.
- Esc mid-drag keeps the tool: a switch to Select would set `canvas.selection = true` while the mouse is still down. After cancel, `mouse:move` / `mouse:up` return early (`drawing` is null), so the release makes nothing. Same path as `touchcancel`.
- `blur.js` helper `tool(id, label, mode)` gains `key` arg.
- No unit test: no pure logic. E2E only (`test/e2e/s9-keys.test.js`).

E2E cases:
- each key -> matching button `aria-pressed="true"`.
- Esc after Box -> Select pressed.
- typing `a` in a Text object -> text gets `a`, tool unchanged.
- Cmd+A / Ctrl+A -> tool unchanged.
- each button has `title` and `aria-keyshortcuts`.
- tool key mid-drag (Box, press `a`, release) -> one box, Box still pressed.
- Esc mid-drag (Box, press Esc, release) -> no object, Box still pressed.

Out of scope (S9):
- Non-Latin keyboard layouts. Personal project, one user, Latin layout.

### S10 - outline-only hit for Box and Arrow

Added 2026-10-22. Owner irritant: a press inside a box selects the box, so you cannot draw inside it. Same for the empty bounding box of a diagonal arrow. One slice: about 10 lines in 3 files.

Fabric 7.4 facts (read in `node_modules/fabric/dist/index.mjs`):
- `_checkTarget`: with `perPixelTargetFind`, a point inside the bounding box hits only if the rendered pixel there is not transparent. Box fill is `transparent`, so the interior misses.
- `findTarget`: with `preserveObjectStacking` (set in `app.js`), a selected object wins only on its controls, or with the Alt key. Its interior goes through the same pixel check, so a selected box does not catch interior presses.
- `isTargetTransparent` checks a square of `targetFindTolerance` viewport px around the point. Only per-pixel objects use it.
- `toObject` does not serialize `perPixelTargetFind`. Undo restores from JSON, so the flag must be a constructor default ([tool contract rule](/.okf/architecture/tool-contract.md)).

Decisions (mine):
- Box becomes `class Box extends fabric.Rect`, `static type = 'Box'`, registered with `fabric.classRegistry.setClass`. Constructor defaults: `fill: 'transparent'`, `strokeUniform: true`, `perPixelTargetFind: true`. `create` calls `new Box()`. No code or test depends on type `Rect`.
- Arrow constructor defaults gain `perPixelTargetFind: true`.
- `app.js` canvas options gain `targetFindTolerance: 4` (screen px). Reason: a size-1 outline at zoom < 1 is under 1 screen px wide.
- Blur, Pixelate, Step, Text keep bounding-box hit (owner choice). Their interior is content.
- Result: a press inside a box or beside an arrow line goes to the active tool. With Select, it starts a rubber-band selection. The move cursor shows only over the outline or line.

E2E cases (`test/e2e/s10-hit.test.js`):
- Box drawn, Arrow tool, drag inside the box -> 2 objects (the irritant).
- Select tool, click box interior -> no active object.
- Select tool, click on the box outline -> box active.
- Box selected, Box tool, drag inside it -> 2 boxes (selected-object path).
- Box drawn, second object drawn, undo -> click box interior -> no active object (flag survives restore).
- Diagonal arrow, Select tool, click the empty corner of its bounding box -> no active object. Click the line midpoint -> arrow active.
- Size 1 box, click 3 screen px inside the outline -> box active (tolerance).

Deferred edge cases (S10):
- A press just outside the outline misses: Fabric checks the bounding box before the pixel check. Fix if it irritates: Box `padding` in screen px. Cost: the selection frame draws that far out. Owner: no padding now (2026-10-22).
- Hit-test cost: Fabric renders the object once per hover hit-test inside its bounding box. Box and Arrow render cheaply. Not measured.

### S11 - wheel changes size

Added 2026-10-22. Run order: S11, S12, and S13 run in parallel (conflicts C3, C4).

The wheel moves the size slider, the same as a user drag. The slider stays in sync by construction: it is the one store of the size.

Target (owner rule):
- An object is selected: the wheel changes its size, and the slider. The selected object wins over the active tool.
- Else a drawing tool is active: the wheel changes the slider, so the next object uses it. With S13, that is the active tool's own size.
- Else (Select tool, nothing selected): the wheel does nothing.

Decisions (mine):
- One `wheel` listener on `#stage` in `style.js`, `{ passive: false }`. It acts only for the target above, and only then calls `preventDefault`.
- `ctrlKey` wheel is a trackpad pinch: ignore it, so browser zoom still works.
- Mouse: one step per wheel event (owner choice). Trackpad: add `deltaY` to an accumulator, one step per `STEP_PX` (100) of travel.
- Mouse or trackpad: an event whose `wheelDeltaY` is a non-zero multiple of 120 is a mouse notch. Unverified on the owner's Mac. A hands-on check with the owner's mouse and trackpad is part of the slice.
- Direction: `deltaY < 0` is up and calls `size.stepUp()`; else `size.stepDown()`. Natural scrolling is off on the owner's Mac (`com.apple.swipescrolldirection = 0`). The native range clamps to 1..10. After each step, dispatch `input`: the existing handler applies it to the selection live.
- `app.js` exports `Annot.activeTool()`, the active tool id, or `null` for Select.
- One undo step per spin: 300 ms after the last wheel event, dispatch `change` (the existing commit fires `object:modified`) and reset the accumulator.

E2E cases (`test/e2e/s11-wheel.test.js`, `page.mouse.wheel` over the stage):
- Box tool, nothing selected: wheel up 100 -> slider 4. Wheel down 200 -> slider 2.
- Clamp: 20 notches up -> slider 10. 20 down -> slider 1.
- Select tool, nothing selected: wheel up -> slider unchanged.
- Box selected: wheel up 100 -> slider 4 and box `strokeWidth` 4.
- Mouse: one event of `deltaY -120` -> slider 4. Trackpad: 10 events of `deltaY -10` -> slider 4.
- One spin of 3 notches on a selected box, wait 400 ms, undo once -> `strokeWidth` back to 3.
- Ctrl + wheel -> slider unchanged.
- Wheel over the toolbar -> slider unchanged.

Deferred edge cases (S11):
- Wheel during a drag: changes the slider only; the preview keeps its size until the next object.
- Wheel while editing text: resizes the text live. Accepted.
- Firefox line-mode deltas: Chrome only, so not handled.

### S12 - slider shows the selected object's size

Size maps to different properties per tool, and some maps lose data ([tools](/.okf/tools/index.md)). A Step resize handle changes `scale`, which also carries size. So read the size from a stored value, not from the object's geometry.

Decisions (mine):
- New custom property `annotSize`. Add it to `fabric.BaseFabricObject.customProperties` in `app.js`, so undo keeps it.
- Set it where size is applied: in `app.js` on create (`obj.annotSize = style.size`, beside `annotTool`), and in `style.js` `applyToSelection`.
- On `selection:created` and `selection:updated`: if every selected object has the same `annotSize`, set `size.value` to it. Mixed sizes: leave the slider. Set the value only, with no `input` event, so the selection does not restyle itself.
- Color stays as it is. The owner asked for size only.

### S13 - size per tool

Owner answers (2026-10-22): each tool keeps its own size. Editing a selected object changes only that object. Sizes reset on reload.

Decisions (mine):
- `style.js` keeps `sizes` (tool id -> size) in memory. Every tool starts at the slider default (`size.defaultValue`, 3).
- `app.js` `selectTool` fires `canvas.fire('annot:tool', { id })`. `style.js` listens: when nothing is selected, it sets `size.value` to the new tool's size.
- On slider `input` (user or wheel) with nothing selected and a drawing tool active, `sizes[Annot.activeTool()] = size.value`.
- On `selection:cleared`, `size.value` returns to the active tool's size. So after an object edit the slider shows the tool's size again.
- Select has no size. With Select active and nothing selected, the slider keeps its value and stores nothing.

E2E cases (`test/e2e/s13-tool-size.test.js`):
- Box, slider to 7; Text, slider to 2; Box again -> slider 7; Text again -> slider 2.
- Box at 7 draws a box with `strokeWidth` 7 after a detour to Text at 2.
- Box at 7, select an object of size 4 and change it to 5, deselect -> slider 7.
- With an object selected, a tool key changes the tool but the slider keeps the object's size.

E2E cases (`test/e2e/s12-select-size.test.js`):
- Box at size 7, slider moved to 2, click the box outline -> slider 7.
- Step at size 2, then Box at size 8 selected, then click the step -> slider 2.
- Two objects of size 4 selected together -> slider 4. Sizes 4 and 6 -> slider unchanged.
- Box at size 7, undo then redo, select it -> slider 7.

## Expected merge conflicts

| ID | Where | Cause | Slices |
|---|---|---|---|
| C1 | `index.html` script tag block | each tool adds one `<script>` line at same spot | S3, S4, S5, S6 concurrent |
| C2 | `src/input.js` | S2 edits paste-only file from S1 | S2 vs any S1 fix |
| - | none | S9 is one slice, no parallel stream | S9 |
| - | none | S10 is one slice, no parallel stream | S10 |
| C3 | `src/style.js` | S11 adds the wheel listener; S12 adds `annotSize` in `applyToSelection` and a selection listener; S13 adds `sizes` and tool and clear listeners | S11, S12, S13 |
| C4 | `src/app.js` | S11 adds `activeTool` to the `Object.assign` export; S12 adds `annotSize` to `customProperties` and on create; S13 fires `annot:tool` in `selectTool` | S11, S12, S13 |
| C5 | `README.md`, `.okf/modules/style-panel.md` | each slice adds its own docs line | S11, S12, S13 |

C1 unlocks four parallel tool streams. Resolve by keeping all lines.

## Expected rework

| ID | What | Why taken |
|---|---|---|
| R1 | S7 adds serialization to arrow, step, blur files | Undo last lets every tool ship without serialization code first. Cheaper than each tool writing it blind. |
| R2 | S5 renumber must stay correct under S7 reload | Event-driven renumber; verify again in S7 |
| - | none for S9 | one slice |
| - | none for S10 | one slice |
| - | none for S11, S12 | the wheel goes through the slider `input` event, so S12's `annotSize` update covers wheel changes with no S11 rework |

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
- Changed after first build (owner request): Box, Arrow, Blur, Pixelate draw by click-drag (start to end); Step and Text stay click-to-place. Drags under 5 screen px make nothing. Tool contract gains optional `drag(obj, start, end)`.
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
- [x] S9 tool hotkeys (`app.js`, `tools/*.js`, `test/e2e/s9-keys.test.js`)
- [x] S9 README key table + `.okf/` sync
- [x] S10 outline-only hit for Box and Arrow (`app.js`, `tools/box.js`, `tools/arrow.js`, `test/e2e/s10-hit.test.js`)
- [x] S10 README + `.okf/` sync
- [ ] S11 wheel changes size (`style.js`, `test/e2e/s11-wheel.test.js`)
- [ ] S12 slider shows selected size (`style.js`, `app.js`, `test/e2e/s12-select-size.test.js`)
- [ ] S13 size per tool (`style.js`, `app.js`, `test/e2e/s13-tool-size.test.js`)
- [ ] S11 hands-on wheel check with the owner's mouse and trackpad
- [ ] S11-S13 README + `.okf/` sync
