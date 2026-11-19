const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, clickScene, dragScene, toScreen, useTool, exportedPixel, near } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => {
  ({ browser, page, errors } = await open());
  await pasteImage(page);
});
test.afterEach(() => teardown(browser, errors));

const nearAll = (actual, expected, label = '') => Object.keys(expected).forEach((k) => near(actual[k], expected[k], `${label} ${k}`));

const shiftDrag = async (...xy) => {
  await page.keyboard.down('Shift');
  await dragScene(page, ...xy);
  await page.keyboard.up('Shift');
};
const only = () =>
  page.evaluate(() => {
    const objs = Annot.canvas.getObjects();
    const o = objs[0];
    return { n: objs.length, left: o.left, top: o.top, w: o.width * o.scaleX, h: o.height * o.scaleY, points: o.points?.map(({ x, y }) => ({ x, y })) };
  });

// Box and Circle: the drag is 300 x 150; Shift makes it 300 x 300 from the start corner.
for (const tool of ['box', 'circle']) {
  test(`Shift: ${tool} is square, from the start corner`, async () => {
    await useTool(page, tool);
    await shiftDrag(100, 100, 400, 250);
    nearAll(await only(), { n: 1, left: 250, top: 250, w: 300, h: 300 });
  });
}

// The Shift state at each moment decides: let go before mouse-up gives the raw drag, with no jump at release.
test('Shift let go before mouse-up: preview and box follow at once', async () => {
  await useTool(page, 'box');
  await page.mouse.move(...(await toScreen(page, 100, 100)));
  await page.mouse.down();
  await page.keyboard.down('Shift');
  await page.mouse.move(...(await toScreen(page, 400, 250)), { steps: 5 });
  nearAll(await only(), { n: 1, left: 250, top: 250, w: 300, h: 300 }, 'Shift down: preview is square');
  await page.keyboard.up('Shift');
  nearAll(await only(), { n: 1, left: 250, top: 175, w: 300, h: 150 }, 'Shift up: preview follows with no mouse move');
  await page.mouse.up();
  nearAll(await only(), { n: 1, left: 250, top: 175, w: 300, h: 150 }, 'release');
});

test('Shift pressed mid-drag snaps the preview with no mouse move', async () => {
  await useTool(page, 'line');
  await page.mouse.move(...(await toScreen(page, 100, 500)));
  await page.mouse.down();
  await page.mouse.move(...(await toScreen(page, 400, 440)), { steps: 5 });
  await page.keyboard.down('Shift');
  nearAll((await only()).points[1], { x: 400, y: 500 });
  await page.keyboard.up('Shift');
  await page.mouse.up();
});

test('no Shift: circle spans the drag corners as an ellipse', async () => {
  await useTool(page, 'circle');
  await dragScene(page, 100, 100, 400, 250);
  nearAll(await only(), { n: 1, left: 250, top: 175, w: 300, h: 150 });
});

// From (100, 500). Each end is 30-31 deg off its snap angle, well inside the 22.5 deg sector.
const LINE_CASES = [
  ['horizontal keeps the mouse x', [400, 440], { x: 400, y: 500 }],
  ['vertical keeps the mouse y', [130, 200], { x: 100, y: 200 }],
  ['45 deg uses the larger distance', [400, 230], { x: 400, y: 200 }],
];
for (const tool of ['line', 'arrow'])
  for (const [name, [x, y], end] of LINE_CASES)
    test(`Shift: ${tool} ${name}`, async () => {
      await useTool(page, tool);
      await shiftDrag(100, 500, x, y);
      const { n, points } = await only();
      assert.equal(n, 1);
      nearAll(points[0], { x: 100, y: 500 });
      nearAll(points[1], end);
    });

for (const tool of ['blur', 'pixelate'])
  test(`Shift: ${tool} does not snap`, async () => {
    await useTool(page, tool);
    await shiftDrag(100, 100, 400, 250);
    nearAll(await only(), { n: 1, left: 250, top: 175, w: 300, h: 150 });
  });

for (const tool of ['text', 'step'])
  test(`Shift+click: ${tool} still places one object`, async () => {
    await useTool(page, tool);
    await page.keyboard.down('Shift');
    await clickScene(page, 300, 300);
    await page.keyboard.up('Shift');
    const r = await page.evaluate(() => Annot.canvas.getObjects().map((o) => o.annotTool));
    assert.deepEqual(r, [tool]);
  });

test('circle: type Oval, outline hit, panel style, round trip', async () => {
  await page.fill('#color', '#ff0000');
  await useTool(page, 'circle');
  await page.fill('#size', '6');
  await dragScene(page, 100, 100, 400, 300);
  const r = await page.evaluate(async () => {
    const o = Annot.canvas.getObjects()[0];
    const [copy] = await fabric.util.enlivenObjects([o.toObject()]);
    const pick = (x) => ({ type: x.constructor.type, annotTool: x.annotTool, stroke: x.stroke, strokeWidth: x.strokeWidth, fill: x.fill, hit: x.perPixelTargetFind });
    return [pick(o), pick(copy)];
  });
  const want = { type: 'Oval', annotTool: 'circle', stroke: '#ff0000', strokeWidth: 6, fill: 'transparent', hit: true };
  assert.deepEqual(r, [want, want]);
});

test('circle export: outline red, center not', async () => {
  await page.fill('#color', '#ff0000');
  await useTool(page, 'circle');
  await page.fill('#size', '6');
  await dragScene(page, 100, 100, 400, 300);
  const isRed = ([r, g, b]) => r > 200 && g < 50 && b < 50;
  assert.ok(isRed(await exportedPixel(page, 250, 101)), 'top of outline');
  assert.ok(!isRed(await exportedPixel(page, 250, 200)), 'center');
});

test('circle: wheel and color change the selected circle', async () => {
  await useTool(page, 'circle');
  await page.fill('#size', '6');
  await dragScene(page, 100, 100, 400, 300);
  await page.mouse.move(...(await toScreen(page, 1200, 800)));
  await page.mouse.wheel(0, -100);
  await page.fill('#color', '#00ff00');
  const r = await page.evaluate(() => (({ stroke, strokeWidth }) => ({ stroke, strokeWidth }))(Annot.canvas.getObjects()[0]));
  assert.deepEqual(r, { stroke: '#00ff00', strokeWidth: 7 });
});
