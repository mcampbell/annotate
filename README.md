# Annotate

Browser app to annotate an image and copy the result to the clipboard as a PNG. One HTML file. No server.

## Features

- **Load an image**: paste (Ctrl/⌘+V), drag and drop a file, or click **Open**.
- **Tools**: each makes a movable, resizable object on the image. Box, Arrow, Line, Circle, Blur, and Pixelate: click and drag. Hold **Shift** while you drag to snap: Box and Circle stay square, and Line and Arrow snap to horizontal, vertical, or 45 degrees. Step and Text: click.
  - **Box**: outlined rectangle, corner to corner. Select it by its outline: a press inside goes to the active tool, so you can draw inside a box.
  - **Arrow**: drag from the foot to the tip. Drag either end later to aim it. Select it by its line or head, not the empty space beside it.
  - **Line**: as Arrow, with no head.
  - **Circle**: ellipse, corner to corner. Hold Shift for a circle. Select it by its outline, as a Box.
  - **Text**: type when it drops. Double-click to edit again. Empty text is removed.
  - **Step**: numbered bubble. Numbers update when you add or delete a step. Resize it with **Size** or the wheel; it has no resize handles.
  - **Blur** and **Pixelate**: drag corner to corner to hide that part of the image. Annotations stay visible. They update live as you move them.
- **Color** and **Size**: apply to new objects and to the selected object. Each tool keeps its own size until you reload the page. When you select objects of one size, the slider shows that size. A color change keeps each object's size.
- **Mouse wheel** over the image: changes the size, as if you moved the slider. It changes the selected object if there is one, else the active tool's size. With the Select tool and nothing selected, it does nothing. One mouse notch is one step. A trackpad changes one step per 100 px of scroll. One spin is one undo step.
- **Select** tool: click an object to select it. Click empty space to clear the selection.
- **Tool keys**: press a key to pick a tool. Each button tooltip shows its key. Keys do nothing while you type text or drag.

  | Key | Tool | Key | Tool |
  |---|---|---|---|
  | V or Esc | Select | N | Step |
  | B | Box | U | Blur |
  | A | Arrow | P | Pixelate |
  | L | Line | T | Text |
  | C | Circle | | |

  Esc during a drag cancels the drag.
- **Delete** or **Backspace**: remove the selected objects.
- **Undo** (Ctrl/⌘+Z) and **Redo** (Ctrl/⌘+Shift+Z, or Ctrl/⌘+Y).
- **Copy**: puts the annotated image on the clipboard as a PNG at the original image size.

Supported browsers: Chrome and Edge.

## Build

Requires Node.js 22+.

```sh
npm install
npm run build
```

The build writes one self-contained file: `dist/annotate.html`. It inlines Fabric.js and all app scripts.

Open it from disk:

```sh
open dist/annotate.html          # macOS
```

On Windows (cmd or PowerShell):

```bat
start dist\annotate.html
```

Or double-click the file, or enter its `file://` URL in Chrome or Edge: `file:///path/to/annotate/dist/annotate.html` (macOS), `file:///C:/path/to/annotate/dist/annotate.html` (Windows). Windows is not tested.

For development, open `index.html` directly. It loads the scripts from `src/` and `node_modules/`.

## Deploy

`dist/annotate.html` has no dependencies. Use one of these:

- Copy the file to any computer and open it in Chrome.
- Put it on any static host (GitHub Pages, S3, an intranet server). The clipboard needs `https` or `file://`.

## Test

```sh
npm test            # unit tests (pure logic, build inlining)
npm run test:e2e    # builds, then runs Playwright against dist/annotate.html in installed Google Chrome
npm run test:mutate # breaks the code on purpose (test/mutations.js) and expects a test to fail each time
```

## Layout

| Path | Role |
|---|---|
| `index.html` | Page layout, toolbar, script load order |
| `src/app.js` | Canvas, tool registry, click-to-place and drag-to-draw, Shift snap, Delete key, tool keys, image load |
| `src/input.js` | Paste, file picker, drag and drop |
| `src/style.js` | Color and size panel |
| `src/export.js` | Copy PNG to clipboard |
| `src/undo.js` | Undo and redo |
| `src/tools/*.js` | One file per tool |
| `src/lib/*.js` | Pure logic, unit tested in Node |
| `build.js` | Inlines scripts and CSS into `dist/annotate.html` |
| `scripts/mutate.js` | Mutation check. The entries are in `test/mutations.js` |
| `docs/design.md` | Design and slice plan |
| `.okf/` | Knowledge bundle (OKF v0.2): architecture, decisions, Fabric 7 pitfalls. Start at `.okf/index.md` |

Each tool registers itself with `Annot.registerTool({ id, label, key, create, applyStyle, drag?, snap?, afterDrop? })`. A tool with `drag` draws by click-drag; without it, a click places it. A drag tool with `snap` snaps its end while Shift is down. `key` is one free lowercase letter; a duplicate throws at load. To add a tool, add a file in `src/tools/` and one `<script>` line in `index.html`.
