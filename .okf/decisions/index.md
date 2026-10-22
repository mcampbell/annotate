# Decisions

* [Classic scripts, no ES modules](classic-scripts.md) - Use classic scripts and one global namespace because Chrome blocks module scripts on file://.
* [Use the latest Fabric.js](fabric-latest.md) - Fabric.js 7 gives select, move, resize, and serialization for free; track the latest release.
* [Click to drop](click-to-drop.md) - (deprecated) A tool click drops a default-size object; the user then moves and resizes it.
* [Undo by object snapshots](undo-snapshots.md) - Undo stores JSON of annotation objects, not commands and not the background image.
* [Single-file build](single-file-build.md) - Ship one self-contained HTML file that opens from file://.
* [Drag to draw](drag-to-draw.md) - Box, Arrow, Blur, Pixelate draw by click-drag; supersedes click-to-drop.
* [Outline-only hit](outline-hit.md) - Box and Arrow hit only where they draw pixels; a press inside a box goes to the active tool.
* [Tool hotkeys](tool-hotkeys.md) - One letter key selects each tool; Escape selects Select or cancels a drag.
