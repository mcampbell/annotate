# Tasks: Annotate

Design: `docs/design.md`

S1-S7 are done (see the Tasks list in the design doc). This file covers S9 only.

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

## Questions and answers

- Q (T9.2): What should a key press during a drag do?
  A: Nothing.
- Q (T9.2): Should Esc cancel a drag in progress?
  A: Yes. (Mine: the tool stays, so `canvas.selection` does not turn on while the mouse is down.)
- Q (general): Support non-Latin keyboard layouts?
  A: No. This is a personal project with one user.
