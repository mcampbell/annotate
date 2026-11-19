const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, dragScene, toScreen, useTool, exportedPixel } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(() => teardown(browser, errors));

// Same drag as s3-arrow: foot (520, 440), tip (680, 360), red, size 6.
const draw = async (tool) => {
  await pasteImage(page);
  await page.fill('#color', '#ff0000');
  await useTool(page, tool);
  await page.fill('#size', '6');
  await dragScene(page, 520, 440, 680, 360);
};
const isRed = ([r, g, b]) => r > 200 && g < 50 && b < 50;
// 20 px back from the tip, 8 px off the line: inside an arrow head (half-width 11.5 there), outside a size 6 line.
const besideTip = () => exportedPixel(page, 666, 376);

test('line drops with 2 point handles and panel style', async () => {
  await draw('line');
  const info = await page.evaluate(() => {
    const o = Annot.canvas.getObjects()[0];
    return { annotTool: o.annotTool, type: o.constructor.type, n: o.points.length, p0: !!o.controls.p0, p1: !!o.controls.p1, stroke: o.stroke };
  });
  assert.deepEqual(info, { annotTool: 'line', type: 'Line', n: 2, p0: true, p1: true, stroke: '#ff0000' });
});

test('export contains the line but no head', async () => {
  await draw('line');
  assert.ok(isRed(await exportedPixel(page, 600, 400)), 'shaft');
  assert.ok(!isRed(await besideTip()), 'no head');
});

test('the same pixel is red for an arrow, so the probe hits the head', async () => {
  await draw('arrow');
  assert.ok(isRed(await besideTip()));
});

test('serialization round trip keeps Line and controls', async () => {
  await draw('line');
  const r = await page.evaluate(async () => {
    const [o] = await fabric.util.enlivenObjects([Annot.canvas.getObjects()[0].toObject()]);
    return { type: o.constructor.type, p0: !!o.controls.p0, p1: !!o.controls.p1, annotTool: o.annotTool, hit: o.perPixelTargetFind };
  });
  assert.deepEqual(r, { type: 'Line', p0: true, p1: true, annotTool: 'line', hit: true });
});

test('wheel and color change the selected line', async () => {
  await draw('line');
  await useTool(page, 'select');
  await page.evaluate(() => Annot.canvas.setActiveObject(Annot.canvas.getObjects()[0]));
  await page.mouse.move(...(await toScreen(page, 1200, 800)));
  await page.mouse.wheel(0, -100);
  await page.fill('#color', '#00ff00');
  const r = await page.evaluate(() => (({ stroke, strokeWidth }) => ({ stroke, strokeWidth }))(Annot.canvas.getObjects()[0]));
  assert.deepEqual(r, { stroke: '#00ff00', strokeWidth: 7 });
});
