# Decisions

* [Classic scripts, no ES modules](classic-scripts.md) - Use classic scripts and one global namespace because Chrome blocks module scripts on file://.
* [Use the latest Fabric.js](fabric-latest.md) - Fabric.js 7 gives select, move, resize, and serialization for free; track the latest release.
* [Click to drop](click-to-drop.md) - (deprecated) A tool click drops a default-size object; the user then moves and resizes it.
* [Undo by object snapshots](undo-snapshots.md) - Undo stores JSON of annotation objects, not commands and not the background image.
* [Single-file build](single-file-build.md) - Ship one self-contained HTML file that opens from file://.
* [Drag to draw](drag-to-draw.md) - Box, Arrow, Blur, Pixelate draw by click-drag; supersedes click-to-drop.
