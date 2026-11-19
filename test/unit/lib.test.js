const test = require('node:test');
const assert = require('node:assert/strict');
const { fitZoom } = require('../../src/lib/fit.js');
const { rectBetween, snapSquare, snapAngle } = require('../../src/lib/geometry.js');
const { stepNumbers } = require('../../src/lib/steps.js');
const { history } = require('../../src/lib/history.js');

test('fitZoom never upscales', () => assert.equal(fitZoom(100, 50, 800, 600), 1));
test('fitZoom fits the tighter side', () => assert.equal(fitZoom(2000, 500, 1000, 1000), 0.5));
test('fitZoom fits height', () => assert.equal(fitZoom(500, 2000, 1000, 1000), 0.5));

test('stepNumbers numbers steps in order, skips others', () =>
  assert.deepEqual(stepNumbers(['box', 'step', 'arrow', 'step', undefined, 'step']), [null, 1, null, 2, null, 3]));

test('history undo/redo round trip', () => {
  let h = history.create('a');
  h = history.record(h, 'b');
  h = history.record(h, 'c');
  h = history.undo(h);
  assert.equal(h.present, 'b');
  h = history.undo(h);
  assert.equal(h.present, 'a');
  assert.equal(history.undo(h), h, 'undo at start is a no-op');
  h = history.redo(h);
  assert.equal(h.present, 'b');
});

test('history record after undo drops redo branch', () => {
  let h = history.record(history.create('a'), 'b');
  h = history.record(history.undo(h), 'x');
  assert.equal(h.present, 'x');
  assert.equal(history.redo(h), h, 'redo after new record is a no-op');
});

test('history record ignores duplicate snapshot', () => {
  const h = history.create('a');
  assert.equal(history.record(h, 'a'), h);
});

test('rectBetween gives a center-origin rect for any corner order', () => {
  const rect = { left: 250, top: 200, width: 300, height: 200 };
  assert.deepEqual(rectBetween({ x: 100, y: 100 }, { x: 400, y: 300 }), rect);
  assert.deepEqual(rectBetween({ x: 400, y: 300 }, { x: 100, y: 100 }), rect);
  assert.deepEqual(rectBetween({ x: 400, y: 100 }, { x: 100, y: 300 }), rect);
});

const O = { x: 100, y: 100 };
const at = (dx, dy) => ({ x: O.x + dx, y: O.y + dy });

test('snapSquare makes the larger side win, in the drag direction', () => {
  assert.deepEqual(snapSquare(O, at(60, 20)), at(60, 60));
  assert.deepEqual(snapSquare(O, at(-20, 60)), at(-60, 60));
  assert.deepEqual(snapSquare(O, at(30, -50)), at(50, -50));
  assert.deepEqual(snapSquare(O, at(-50, -30)), at(-50, -50));
});

test('snapSquare with one zero side still makes a square', () => {
  assert.deepEqual(snapSquare(O, at(0, 40)), at(40, 40));
  assert.deepEqual(snapSquare(O, at(-40, 0)), at(-40, 40));
});

test('snapAngle: near horizontal keeps the mouse x', () => {
  assert.deepEqual(snapAngle(O, at(100, 30)), at(100, 0));
  assert.deepEqual(snapAngle(O, at(-100, -30)), at(-100, 0));
});

test('snapAngle: near vertical keeps the mouse y', () => {
  assert.deepEqual(snapAngle(O, at(30, 100)), at(0, 100));
  assert.deepEqual(snapAngle(O, at(-30, -100)), at(0, -100));
});

test('snapAngle: near diagonal uses the larger distance', () => {
  assert.deepEqual(snapAngle(O, at(100, 70)), at(100, 100));
  assert.deepEqual(snapAngle(O, at(-70, 100)), at(-100, 100));
});

// tan(22.5 deg) = 0.4142: the sector edge between horizontal and 45 deg.
test('snapAngle switches at 22.5 degrees', () => {
  assert.deepEqual(snapAngle(O, at(100, 41)), at(100, 0));
  assert.deepEqual(snapAngle(O, at(100, 42)), at(100, 100));
  assert.deepEqual(snapAngle(O, at(41, 100)), at(0, 100));
  assert.deepEqual(snapAngle(O, at(42, 100)), at(100, 100));
});

test('snap functions do not mutate their arguments', () => {
  const a = { ...O };
  const b = at(70, 20);
  snapSquare(a, b);
  snapAngle(a, b);
  assert.deepEqual([a, b], [O, at(70, 20)]);
});

test('snap of a zero-length drag is the start point', () => {
  assert.deepEqual(snapSquare(O, O), O);
  assert.deepEqual(snapAngle(O, O), O);
});
