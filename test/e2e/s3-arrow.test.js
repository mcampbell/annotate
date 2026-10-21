const test = require('node:test');
const assert = require('node:assert/strict');
const { open, pasteImage, clickScene, useTool, exportedPixel } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(async () => {
  assert.deepEqual(errors, []);
  await browser.close();
});

const dropArrow = async () => {
  await pasteImage(page);
  await page.fill('#color', '#ff0000');
  await page.fill('#size', '6');
  await useTool(page, 'arrow');
  await clickScene(page, 600, 400);
};

test('arrow drops with 2 point handles and panel style', async () => {
  await dropArrow();
  const info = await page.evaluate(() => {
    const o = Annot.canvas.getObjects()[0];
    return { annotTool: o.annotTool, type: o.constructor.type, n: o.points.length, p0: !!o.controls.p0, p1: !!o.controls.p1, stroke: o.stroke };
  });
  assert.deepEqual(info, { annotTool: 'arrow', type: 'Arrow', n: 2, p0: true, p1: true, stroke: '#ff0000' });
});

test('export contains the arrow shaft', async () => {
  await dropArrow();
  const [r, g, b] = await exportedPixel(page, 600, 400);
  assert.ok(r > 200 && g < 50 && b < 50, `expected red, got ${[r, g, b]}`);
});

test('dragging p1 handle moves the endpoint', async () => {
  await dropArrow();
  const before = await page.evaluate(() => ({ ...Annot.canvas.getObjects()[0].points[1] }));
  const box = await page.locator('.upper-canvas').boundingBox();
  const { x, y } = await page.evaluate(() => Annot.canvas.getObjects()[0].oCoords.p1);
  await page.mouse.move(box.x + x, box.y + y);
  await page.mouse.down();
  await page.mouse.move(box.x + x + 40, box.y + y + 60, { steps: 5 });
  await page.mouse.up();
  const after = await page.evaluate(() => ({ ...Annot.canvas.getObjects()[0].points[1] }));
  assert.notDeepEqual(after, before);
});

test('serialization round trip keeps Arrow and controls', async () => {
  await dropArrow();
  const r = await page.evaluate(async () => {
    const [o] = await fabric.util.enlivenObjects([Annot.canvas.getObjects()[0].toObject()]);
    return { type: o.constructor.type, p0: !!o.controls.p0, p1: !!o.controls.p1, annotTool: o.annotTool };
  });
  assert.deepEqual(r, { type: 'Arrow', p0: true, p1: true, annotTool: 'arrow' });
});
