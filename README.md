# Annotate

Browser app to annotate an image and copy the result to the clipboard as a PNG. One HTML file. No server.

## Features

- **Load an image**: paste (Ctrl/⌘+V), drag and drop a file, or click **Open**.
- **Tools**: each drops a movable, resizable object on the image.
  - **Box**: outlined rectangle.
  - **Arrow**: drag either end to aim it.
  - **Text**: type when it drops. Double-click to edit again. Empty text is removed.
  - **Step**: numbered bubble. Numbers update when you add or delete a step.
  - **Blur** and **Pixelate**: hide the part of the image under them. They update live as you move them.
- **Color** and **Size**: apply to new objects and to the selected object.
- **Select** tool: click an object to select it. Click empty space to clear the selection.
- **Delete** or **Backspace**: remove the selected objects.
- **Undo** (Ctrl/⌘+Z) and **Redo** (Ctrl/⌘+Shift+Z).
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

Or enter `file:///path/to/annotate/dist/annotate.html` in Chrome.

For development, open `index.html` directly. It loads the scripts from `src/` and `node_modules/`.

## Deploy

`dist/annotate.html` has no dependencies. Use one of these:

- Copy the file to any computer and open it in Chrome.
- Put it on any static host (GitHub Pages, S3, an intranet server). The clipboard needs `https` or `file://`.

## Test

```sh
npm test            # unit tests (pure logic, build inlining)
npm run test:e2e    # builds, then runs Playwright against dist/annotate.html in installed Google Chrome
```

## Layout

| Path | Role |
|---|---|
| `index.html` | Page layout, toolbar, script load order |
| `src/app.js` | Canvas, tool registry, click-to-drop, Delete key, image load |
| `src/input.js` | Paste, file picker, drag and drop |
| `src/style.js` | Color and size panel |
| `src/export.js` | Copy PNG to clipboard |
| `src/undo.js` | Undo and redo |
| `src/tools/*.js` | One file per tool |
| `src/lib/*.js` | Pure logic, unit tested in Node |
| `build.js` | Inlines scripts and CSS into `dist/annotate.html` |
| `docs/design.md` | Design and slice plan |

Each tool registers itself with `Annot.registerTool({ id, label, create, applyStyle, afterDrop? })`. To add a tool, add a file in `src/tools/` and one `<script>` line in `index.html`.
