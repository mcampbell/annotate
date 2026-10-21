const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, clickScene, useTool } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(() => teardown(browser, errors));

const texts = () => page.evaluate(() => Annot.canvas.getObjects().map((o) => o.item(1).text));

async function dropThree() {
  await pasteImage(page);
  await page.fill('#color', '#00ff00');
  await useTool(page, 'step');
  for (const x of [300, 600, 900]) await clickScene(page, x, 400);
}

test('steps number 1,2,3 with type Step and panel color', async () => {
  await dropThree();
  assert.deepEqual(await texts(), ['1', '2', '3']);
  const info = await page.evaluate(() => Annot.canvas.getObjects().map((o) => [o.constructor.type, o.item(0).fill]));
  assert.deepEqual(info, Array(3).fill(['Step', '#00ff00']));
});

test('deleting middle step renumbers', async () => {
  await dropThree();
  await useTool(page, 'select');
  await clickScene(page, 600, 400);
  await page.keyboard.press('Delete');
  assert.deepEqual(await texts(), ['1', '2']);
});

test('size change scales selected step', async () => {
  await pasteImage(page);
  await useTool(page, 'step');
  await clickScene(page, 600, 400);
  const before = await page.evaluate(() => Annot.canvas.getObjects()[0].scaleX);
  await page.fill('#size', '10');
  assert.notEqual(await page.evaluate(() => Annot.canvas.getObjects()[0].scaleX), before);
});

test('side controls hidden', async () => {
  await pasteImage(page);
  await useTool(page, 'step');
  await clickScene(page, 600, 400);
  assert.equal(await page.evaluate(() => Annot.canvas.getObjects()[0].isControlVisible('mt')), false);
});

test('serialization round trip', async () => {
  await pasteImage(page);
  await useTool(page, 'step');
  await clickScene(page, 600, 400);
  const r = await page.evaluate(async () => {
    const [o] = await fabric.util.enlivenObjects([Annot.canvas.getObjects()[0].toObject()]);
    return [o.constructor.type, o.annotTool, o.isControlVisible('mt')];
  });
  assert.deepEqual(r, ['Step', 'step', false]);
});
