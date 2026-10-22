# Tasks: Annotate

Design: `docs/design.md`

S1-S7 are done (see the Tasks list in the design doc). This file covers S9 and S10.

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
