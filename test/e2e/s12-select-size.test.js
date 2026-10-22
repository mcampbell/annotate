const test = require('node:test');
const assert = require('node:assert/strict');
const { open, teardown, pasteImage, clickScene, dragScene, useTool } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(() => teardown(browser, errors));

const slider = () => page.evaluate(() => document.getElementById('size').value);
// fill fires input, so it also restyles a selection. Deselect before moving the slider.
const setSize = (v) => page.fill('#size', String(v));
const deselect = () => page.evaluate(() => Annot.canvas.discardActiveObject());
const drawBox = async (x1, y1, x2, y2, size) => {
  await useTool(page, 'box');
  await setSize(size);
  await dragScene(page, x1, y1, x2, y2);
  await deselect();
};

test('selecting a box shows its size', async () => {
  await pasteImage(page);
  await drawBox(100, 100, 400, 300, 7);
  await setSize(2);
  await useTool(page, 'select');
  await clickScene(page, 100, 200);
  assert.equal(await slider(), '7');
});

test('switching between objects follows each size', async () => {
  await pasteImage(page);
  await useTool(page, 'step');
  await setSize(2);
  await clickScene(page, 600, 500);
  await deselect();
  await drawBox(100, 100, 400, 300, 8);
  await useTool(page, 'select');
  await clickScene(page, 100, 200);
  assert.equal(await slider(), '8');
  await clickScene(page, 600, 500);
  assert.equal(await slider(), '2');
});

test('multi-select: same size shows it, mixed sizes leave the slider', async () => {
  await pasteImage(page);
  await drawBox(100, 100, 400, 300, 4);
  await drawBox(500, 100, 800, 300, 4);
  await drawBox(100, 400, 400, 600, 6);
  const select = (idx) =>
    page.evaluate((idx) => {
      const { canvas } = Annot;
      canvas.setActiveObject(new fabric.ActiveSelection(idx.map((n) => canvas.getObjects()[n]), { canvas }));
    }, idx);
  await setSize(1);
  await select([0, 1]);
  assert.equal(await slider(), '4');
  await deselect();
  await setSize(1);
  await select([0, 2]);
  assert.equal(await slider(), '1');
});

test('undo and redo keep annotSize', async () => {
  await pasteImage(page);
  await drawBox(100, 100, 400, 300, 7);
  await setSize(2);
  const settle = () => page.waitForFunction(() => !Annot.undoBusy());
  await page.keyboard.press('ControlOrMeta+z');
  await settle();
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await settle();
  await useTool(page, 'select');
  await clickScene(page, 100, 200);
  assert.equal(await slider(), '7');
});
