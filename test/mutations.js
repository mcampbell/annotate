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
];
