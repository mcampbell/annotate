const test = require('node:test');
const assert = require('node:assert/strict');
const { fitZoom } = require('../../src/lib/fit.js');
const { rectBetween } = require('../../src/lib/geometry.js');
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
