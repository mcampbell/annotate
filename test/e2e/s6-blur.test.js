const test = require('node:test');
const assert = require('node:assert/strict');
const { open, pasteImage, clickScene, useTool, exportedPixel } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(async () => {
  assert.deepEqual(errors, []);
  await browser.close();
});

// Object drops centered on the click: region 500..700 x 340..460.
const sample = (pts) => Promise.all(pts.map(([x, y]) => exportedPixel(page, x, y)));
const grid = [];
for (let x = 510; x < 690; x += 20) for (let y = 350; y < 450; y += 20) grid.push([x, y]);
const changed = (a, b) => a.filter((p, i) => p.some((v, k) => Math.abs(v - b[i][k]) > 8)).length;

async function dropAndCompare(tool) {
  await pasteImage(page);
  const before = await sample(grid);
  const outside = await exportedPixel(page, 100, 100);
  await useTool(page, tool);
  await clickScene(page, 600, 400);
  const after = await sample(grid);
  assert.deepEqual(await exportedPixel(page, 100, 100), outside);
  assert.ok(changed(before, after) > grid.length / 2, `changed ${changed(before, after)}/${grid.length}`);
}

test('pixelate changes region, leaves outside, pixels in a block are equal', async () => {
  await dropAndCompare('pixelate');
  const [a, b] = await sample([[601, 401], [602, 401]]);
  assert.deepEqual(a, b);
});

test('blur changes region, leaves outside', async () => {
  await dropAndCompare('blur');
});

test('moving re-renders from new location', async () => {
  await pasteImage(page);
  await useTool(page, 'pixelate');
  await clickScene(page, 600, 400);
  const pts = [[1210, 810], [1215, 805], [1223, 817], [1237, 829], [1245, 801]];
  const before = await sample(pts);
  await page.evaluate(() => {
    const o = Annot.canvas.getObjects()[0];
    o.set({ left: 1200, top: 800 });
    o.setCoords();
    Annot.canvas.renderAll();
  });
  assert.ok(changed(before, await sample(pts)) > 0);
});

test('size change on selected sets strength', async () => {
  await pasteImage(page);
  await useTool(page, 'blur');
  await clickScene(page, 600, 400);
  await page.fill('#size', '7');
  assert.equal(await page.evaluate(() => Annot.canvas.getObjects()[0].strength), 7);
});

test('serialization round trip keeps mode, strength, annotTool', async () => {
  await pasteImage(page);
  await page.fill('#size', '3');
  await useTool(page, 'pixelate');
  await clickScene(page, 600, 400);
  const r = await page.evaluate(async () => {
    const [o] = await fabric.util.enlivenObjects([Annot.canvas.getObjects()[0].toObject()]);
    return { type: o.constructor.type, mode: o.mode, strength: o.strength, annotTool: o.annotTool };
  });
  assert.deepEqual(r, { type: 'Blur', mode: 'pixelate', strength: 3, annotTool: 'pixelate' });
});
