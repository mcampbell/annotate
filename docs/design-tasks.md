# Tasks: Annotate

Design: `docs/design.md`

S1-S7 are done (see the Tasks list in the design doc). This file covers S9 to S13.

## Slice 9: Tool hotkeys

Run the tasks in order. T9.1 and T9.2 both edit `src/app.js` and `test/e2e/s9-keys.test.js`.

- [x] **T9.1: Tool keys and button hints**
  - Why: S9 value. The user can see the key for each tool, and the key map exists for T9.2 to use.
  - Where: `src/app.js` (`addButton`, `registerTool`, `addButton('select', ...)`), `src/tools/box.js`, `src/tools/arrow.js`, `src/tools/text.js`, `src/tools/step.js`, `src/tools/blur.js` (`tool(id, label, mode)` helper), new `test/e2e/s9-keys.test.js`
  - What: Add a required `key` field to the tool contract (changed from optional: every tool has one, and a missing key throws at load). Keys: `v` Select, `b` Box, `a` Arrow, `t` Text, `n` Step, `u` Blur, `p` Pixelate. `registerTool` passes `tool.key` to `addButton(id, label, key)`. `addButton` records `key -> id` in a `keys` map. It throws on a duplicate key. It sets `title = "Arrow (A)"` and `aria-keyshortcuts = "A"` on the button. The `blur.js` helper gets a `key` argument.
  - Options: none
  - Done when: `npm run test:e2e` passes. `s9-keys.test.js` asserts that each of the 7 buttons has the expected `title` and `aria-keyshortcuts`. The suite has no `pageerror`, so there is no duplicate key.

- [x] **T9.2: Keydown handler**
  - Why: S9 value. The user picks a tool without the mouse. A key press never places anything and never breaks a drag in progress.
  - Where: `src/app.js` (new `keydown` listener beside the Delete listener; uses `isTyping`, `drawing`, `cancelDrawing`, `selectTool`, `keys`), `test/e2e/s9-keys.test.js`
  - What: Add one `keydown` listener:
    1. Return when `isTyping(e)`, or when `metaKey`, `ctrlKey`, or `altKey` is held.
    2. While `drawing` is set: `Escape` calls `cancelDrawing()` and the tool stays. Every other key does nothing.
    3. Otherwise, `Escape` selects `'select'`. Any other key looks up `keys[e.key.toLowerCase()]`.
    4. On a hit, call `selectTool(id)`. On a miss, do nothing and do not call `preventDefault`.
  - Options: none
  - Done when: `npm run test:e2e` passes, with these cases in `s9-keys.test.js`:
    - Each of the 7 keys makes the matching button `aria-pressed="true"`.
    - Uppercase `A` (Shift held) selects Arrow.
    - Esc after Box makes Select pressed.
    - Typing `a` into a Text object adds `a` to the text, and Text stays pressed.
    - Meta+A and Control+A leave the tool unchanged.
    - During a Box drag, pressing `a` and then releasing gives one box, and Box stays pressed.
    - During a Box drag, pressing Esc and then releasing gives zero objects, and Box stays pressed.

- [x] **T9.3: Docs sync**
  - Why: The README and the OKF bundle match the shipped behavior. Earlier slices kept both in sync.
  - Where: `README.md` (feature list near line 8, tool contract near line 73), `.okf/` (modules, getting-started), `docs/design.md` Tasks list
  - What: Add a key table to the README. Add `key?` to the `registerTool` contract line. Update the matching `.okf/` concepts. Tick S9 in the `docs/design.md` Tasks list.
  - Options: none
  - Done when: `grep -n "label, key," README.md` finds the contract line (key is required, so no `key?`). `/okf:validate` reports the bundle as valid. The `docs/design.md` S9 items are ticked.

## Slice 10: Outline-only hit for Box and Arrow

Run the tasks in order. T10.1 and T10.2 both edit `test/e2e/s10-hit.test.js`.

- [x] **T10.1: Box hit only on its outline**
  - Why: S10 value. The user draws inside a box without selecting the box.
  - Where: `src/tools/box.js`, `src/app.js` (canvas options, line 5), new `test/e2e/s10-hit.test.js`
  - What: Replace the plain `fabric.Rect` with `class Box extends fabric.Rect`, `static type = 'Box'`. Put the defaults in the constructor: `fill: 'transparent'`, `strokeUniform: true`, `perPixelTargetFind: true`. Register it with `fabric.classRegistry.setClass(Box)`. `create` calls `new Box()`. Add `targetFindTolerance: 4` to the `fabric.Canvas` options in `app.js`.
  - Options: none (Box `padding` rejected: see Q and A)
  - Done when: `npm run test:e2e` passes, with these cases in `s10-hit.test.js`:
    - With a box drawn, an Arrow drag inside the box gives 2 objects.
    - With the Select tool, a click on the box interior leaves no active object.
    - With the Select tool, a click on the box outline makes the box active.
    - With the box selected, a Box drag inside it gives 2 boxes.
    - After a box, then a second object, then undo, a click on the box interior leaves no active object.
    - With a size 1 box, a click 3 screen px inside the outline makes the box active.

- [x] **T10.2: Arrow hit only on its line and head**
  - Why: S10 value. The user draws beside a diagonal arrow without selecting the arrow.
  - Where: `src/tools/arrow.js` (Arrow constructor defaults, line 7), `test/e2e/s10-hit.test.js`
  - What: Add `perPixelTargetFind: true` to the Arrow constructor defaults.
  - Options: none
  - Done when: `npm run test:e2e` passes, with these cases in `s10-hit.test.js`:
    - With a diagonal arrow and the Select tool, a click on the empty corner of its bounding box leaves no active object.
    - A click on the line midpoint makes the arrow active.
    - The existing endpoint-drag tests in `s3-arrow.test.js` still pass.

- [x] **T10.3: Docs sync**
  - Why: The README and the OKF bundle match the shipped behavior.
  - Where: `README.md` (Box and Arrow feature lines), `.okf/architecture/tool-contract.md`, `.okf/decisions/` (new `outline-hit.md`, `index.md`), `docs/design.md` Tasks list
  - What: State in the README that you select a Box by its outline and an Arrow by its line. Add an OKF decision for outline-only hit, with the Fabric facts and the serialization reason. Tick S10 in `docs/design.md`.
  - Options: none
  - Done when: `grep -n "outline" README.md` finds the new line. The OKF validator reports the bundle as conformant under `--strict`. The `docs/design.md` S10 items are ticked.

## Slice 11: Wheel changes size

S11, S12, and S13 run in parallel. Expected conflicts: C3 (`src/style.js`), C4 (`src/app.js`), C5 (`README.md`, `.okf/modules/style-panel.md`). See `docs/design.md`.

- [ ] **T11.1: Wheel handler**
  - Why: S11 value. The user changes the size with the wheel, as if they moved the slider, and the slider shows it.
  - Where: `src/style.js` (new `wheel` listener on `#stage`), `src/app.js` (`Object.assign(Annot, ...)` at line 144: add `activeTool`), new `test/e2e/s11-wheel.test.js`
  - What:
    1. `app.js`: export `Annot.activeTool = () => activeTool?.id ?? null`.
    2. `style.js`: add a `wheel` listener on `#stage` with `{ passive: false }`. Return on `ctrlKey`. Target: a selection exists, or `Annot.activeTool()` is not null. Else return, with no `preventDefault`.
    3. Mouse notch (`wheelDeltaY` a non-zero multiple of 120): one step per event. Else add `deltaY` to an accumulator, one step per `STEP_PX = 100`.
    4. A step: `deltaY < 0` calls `size.stepUp()`, else `size.stepDown()`. Then dispatch `input`.
    5. 300 ms after the last wheel event: dispatch `change` and reset the accumulator.
  - Options: If Playwright's `page.mouse.wheel` gives no `wheelDeltaY` that is a multiple of 120, dispatch a synthetic `WheelEvent` in the test, or move the mouse check into a small function and give it a unit test. Record the choice here.
  - Done when: `npm run test:e2e` passes, with the S11 cases from `docs/design.md` in `s11-wheel.test.js`: tool up and down, clamp at 1 and 10, Select with nothing selected unchanged, selected box resized, mouse event, trackpad events, one undo per spin, Ctrl+wheel unchanged, wheel over the toolbar unchanged.

- [ ] **T11.2: Hands-on wheel check**
  - Why: S11 value depends on the mouse check and the 100 px trackpad step, which no test can confirm on real hardware.
  - Where: `dist/annotate.html`, the owner's mouse and trackpad
  - What: Build. Ask the owner to open the build, pick Box, and (1) turn the wheel one notch up and one notch down, and (2) swipe two fingers slowly up on the trackpad. If a notch gives 0 or 2 steps, or the trackpad jumps, add a temporary `console.log` of `deltaY` and `wheelDeltaY`, get the values from the owner, and fix the check or `STEP_PX`.
  - Options: none
  - Done when: the owner confirms that one notch is one size step in each direction, and that a slow trackpad swipe changes the size steadily.

- [ ] **T11.3: S11 docs**
  - Why: The README and OKF describe the wheel.
  - Where: `README.md` (feature list), `.okf/modules/style-panel.md`
  - What: Add the wheel rule (selected object, else active tool, else nothing), mouse and trackpad steps, and one undo step per spin.
  - Options: none
  - Done when: `grep -n -i "wheel" README.md .okf/modules/style-panel.md` finds both. The OKF validator reports the bundle as conformant under `--strict`.

## Slice 12: Slider shows the selected object's size

- [ ] **T12.1: Store and show annotSize**
  - Why: S12 value. The user sees the size of the object they select, and the slider stays in sync with it.
  - Where: `src/app.js` (line 4 `customProperties`; line 84 beside `obj.annotTool = tool.id`), `src/style.js` (`applyToSelection`; new `selection:created` and `selection:updated` listener), new `test/e2e/s12-select-size.test.js`
  - What: Add `'annotSize'` to `customProperties`. Set `obj.annotSize` on create and in `applyToSelection`. On `selection:created` and `selection:updated`, if all selected objects have one `annotSize`, set `size.value` to it with no `input` event. Mixed sizes: leave the slider.
  - Options: none
  - Done when: `npm run test:e2e` passes, with the S12 cases from `docs/design.md` in `s12-select-size.test.js`: select shows size, switch between objects, same and mixed multi-select, undo and redo keep `annotSize`.

- [ ] **T12.2: S12 docs**
  - Why: The README and OKF describe the slider sync.
  - Where: `README.md` (Color and Size line), `.okf/modules/style-panel.md`, `.okf/modules/undo-redo.md` (custom properties)
  - What: State that selecting objects of one size moves the slider to that size. Record `annotSize` as a serialized custom property.
  - Options: none
  - Done when: `grep -n "annotSize" .okf/modules/*.md` finds it. The OKF validator reports the bundle as conformant under `--strict`.

## Slice 13: Size per tool

- [ ] **T13.1: Per-tool sizes**
  - Why: S13 value. Each tool keeps its own size, so switching tools does not lose a size the user set.
  - Where: `src/app.js` (`selectTool`, line 25), `src/style.js`, new `test/e2e/s13-tool-size.test.js`
  - What:
    1. `app.js` `selectTool`: `canvas.fire('annot:tool', { id })`.
    2. `style.js`: keep `sizes` (tool id -> size). On `annot:tool` with nothing selected, set `size.value` to `sizes[id] ?? size.defaultValue`.
    3. On slider `input` with nothing selected and `Annot.activeTool()` not null, store `sizes[Annot.activeTool()]`.
    4. On `selection:cleared`, set `size.value` back to the active tool's size.
    5. If S11 has not landed yet, add `Annot.activeTool` in `app.js` exactly as in T11.1 (conflict C4).
  - Options: none
  - Done when: `npm run test:e2e` passes, with the S13 cases from `docs/design.md` in `s13-tool-size.test.js`: sizes kept per tool, a new object uses its tool's size, deselect restores the tool's size, a tool key with a selection keeps the object's size.

- [ ] **T13.2: S13 docs**
  - Why: The README and OKF describe per-tool size.
  - Where: `README.md` (Color and Size line), `.okf/modules/style-panel.md`, `docs/design.md` Tasks list
  - What: State that each tool keeps its own size until reload. Tick S11 to S13 in `docs/design.md` once all three have landed.
  - Options: none
  - Done when: `grep -n -i "each tool keeps" README.md` finds the line. The OKF validator reports the bundle as conformant under `--strict`. The `docs/design.md` S11 to S13 items are ticked.

## Questions and answers

- Q (T9.2): What should a key press during a drag do?
  A: Nothing.
- Q (T9.2): Should Esc cancel a drag in progress?
  A: Yes. (Mine: the tool stays, so `canvas.selection` does not turn on while the mouse is down.)
- Q (general): Support non-Latin keyboard layouts?
  A: No. This is a personal project with one user.
- Q (T10.1): Give Box padding, so that presses just outside the outline also select it?
  A: No padding now. Add it later if the miss is a problem.
- Q (general): Which objects get outline-only hit?
  A: Box and Arrow. Blur, Pixelate, Step, and Text keep bounding-box hit.
- Q (T11.1): Is macOS natural scrolling on?
  A: Off, read from the system (`com.apple.swipescrolldirection = 0`). `deltaY < 0` is wheel up.
- Q (general): One shared size, or a size per tool?
  A: A size per tool. This added S13.
- Q (T13.1): With an object selected, does a size change also set the tool's size?
  A: No. It changes only the object. Deselect returns the slider to the tool's size.
- Q (T13.1): Keep the tool sizes across a reload?
  A: No. They reset on reload.
- Q (T11.1, T11.2): How to step for a mouse wheel?
  A: One step per wheel event for a mouse. The trackpad adds up 100 px per step. The mouse check is unverified, so T11.2 checks it on the owner's hardware.
