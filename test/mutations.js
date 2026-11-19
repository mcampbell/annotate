// Mutations for `npm run test:mutate`. Each entry breaks the code on purpose; some test must then fail.
// To add one: copy an entry. `from` must occur exactly once in `file`. `test` is 'unit' or an e2e test file.
module.exports = [
  // Shift snap (S15)
  { file: 'src/lib/geometry.js', from: 'Math.tan(Math.PI / 8)', to: 'Math.tan(Math.PI / 6)', test: 'unit' },
  { file: 'src/lib/geometry.js', from: '(b.x < a.x ? -side : side)', to: 'side', test: 'unit' },
  { file: 'src/lib/geometry.js', from: 'if (dx <= dy * TAN_HALF_45) return { x: a.x, y: b.y };', to: '', test: 'unit' },
  { file: 'src/app.js', from: 'e.shiftKey && tool.snap ?', to: 'tool.snap ?', test: 'test/e2e/s8-drag.test.js' },
  { file: 'src/app.js', from: "document.addEventListener('keyup', onShift);", to: '', test: 'test/e2e/s15-snap.test.js' },
  { file: 'src/tools/box.js', from: '    snap: Annot.snapSquare,\n', to: '', test: 'test/e2e/s15-snap.test.js' },
  { file: 'src/tools/arrow.js', from: 'snap: Annot.snapAngle, ', to: '', test: 'test/e2e/s15-snap.test.js' },
  { file: 'src/tools/circle.js', from: 'rx: width / 2', to: 'rx: width', test: 'test/e2e/s15-snap.test.js' },
  // Crop frame (S16)
  { file: 'src/lib/geometry.js', from: 'Math.max(0, Math.round(left))', to: 'Math.round(left)', test: 'unit' },
  { file: 'src/lib/geometry.js', from: 'x1 > x0 && y1 > y0 ?', to: 'x1 >= x0 && y1 >= y0 ?', test: 'unit' },
  { file: 'src/export.js', from: 'if (frame) frame.visible = false;', to: '', test: 'test/e2e/s16-crop.test.js' },
  { file: 'src/export.js', from: 'if (frame) frame.visible = true;', to: '', test: 'test/e2e/s16-crop.test.js' },
  { file: 'src/export.js', from: "if (!area) throw new Error('the crop frame is off the image');", to: '', test: 'test/e2e/s16-crop.test.js' },
  { file: 'src/export.js', from: 'canvas.toCanvasElement(1, area)', to: 'canvas.toCanvasElement(1, { width: area.width, height: area.height })', test: 'test/e2e/s16-crop.test.js' },
  { file: 'src/export.js', from: "if (!frame) return { frame, area: { left: 0, top: 0, width, height } };", to: "if (!frame) return { frame, area: { left: 0, top: 0, width: 1, height } };", test: 'test/e2e/s16-crop.test.js' },
  { file: 'src/tools/crop.js', from: "o instanceof Crop && o !== target", to: 'o instanceof Crop', test: 'test/e2e/s16-crop.test.js' },
  { file: 'src/tools/crop.js', from: 'if (old.length) canvas.remove(...old);', to: '', test: 'test/e2e/s16-crop.test.js' },
  { file: 'src/tools/crop.js', from: "ctx.fill('evenodd');", to: "ctx.fill();", test: 'test/e2e/s16-crop.test.js' },
  { file: 'src/tools/crop.js', from: '    snap: Annot.snapSquare,\n', to: '', test: 'test/e2e/s16-crop.test.js' },
  { file: 'src/tools/crop.js', from: 'perPixelTargetFind: true, lockRotation', to: 'perPixelTargetFind: false, lockRotation', test: 'test/e2e/s16-crop.test.js' },
];
