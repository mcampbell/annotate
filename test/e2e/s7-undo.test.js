const test = require('node:test');
const assert = require('node:assert/strict');
const { open, pasteImage, clickScene, useTool, objects } = require('./helpers');

let browser, page, errors;
test.beforeEach(async () => ({ browser, page, errors } = await open()));
test.afterEach(async () => {
  assert.deepEqual(errors, []);
  await browser.close();
});

const undo = () => page.keyboard.press('ControlOrMeta+z');
const redo = () => page.keyboard.press('ControlOrMeta+Shift+z');
const count = async () => (await objects(page)).length;
const settle = () => page.waitForFunction(() => !Annot.undoBusy());

async function twoBoxes() {
  await pasteImage(page);
  await useTool(page, 'box');
  await clickScene(page, 400, 400);
  await clickScene(page, 1200, 400);
}

test('undo and redo object adds', async () => {
  await twoBoxes();
  await undo(); await settle();
  assert.equal(await count(), 1);
  await undo(); await settle();
  assert.equal(await count(), 0);
  await redo(); await settle();
  assert.equal(await count(), 1);
});

test('undo restores a deleted object with its style', async () => {
  await pasteImage(page);
  await page.fill('#color', '#00ff00');
  await useTool(page, 'box');
  await clickScene(page, 600, 400);
  await page.keyboard.press('Delete');
  await undo(); await settle();
  assert.deepEqual((await objects(page)).map((o) => o.stroke), ['#00ff00']);
});

test('undo reverts a style change', async () => {
  await pasteImage(page);
  await page.fill('#color', '#00ff00');
  await useTool(page, 'box');
  await clickScene(page, 600, 400);
  await page.fill('#color', '#0000ff');
  await undo(); await settle();
  assert.equal((await objects(page))[0].stroke, '#00ff00');
});

test('multi-selection move records scene coords', async () => {
  await twoBoxes();
  const lefts = () => page.evaluate(() => Annot.canvas.getObjects().map((o) => Math.round(o.left)));
  const before = await lefts();
  await page.evaluate(() => {
    const { canvas } = Annot;
    const sel = new fabric.ActiveSelection(canvas.getObjects(), { canvas });
    canvas.setActiveObject(sel);
    sel.set({ left: sel.left + 100 }).setCoords();
    canvas.fire('object:modified', { target: sel });
    canvas.discardActiveObject();
  });
  await undo(); await settle();
  assert.deepEqual(await lefts(), before);
  await redo(); await settle();
  assert.deepEqual(await lefts(), before.map((x) => x + 100));
});

test('loading a new image clears history', async () => {
  await twoBoxes();
  await pasteImage(page, 800, 600);
  await page.waitForFunction(() => Annot.canvas.backgroundImage.width === 800);
  await undo(); await settle();
  assert.equal(await count(), 0);
});

test('undo/redo restores custom objects with their behavior', async () => {
  await pasteImage(page);
  await useTool(page, 'step');
  await clickScene(page, 400, 400);
  await clickScene(page, 800, 400);
  await useTool(page, 'pixelate');
  await clickScene(page, 1600, 800);
  await page.keyboard.press('Delete');
  await undo(); await settle();
  const restored = await page.evaluate(() =>
    Annot.canvas.getObjects().map((o) => ({
      type: o.constructor.type,
      text: o.annotTool === 'step' ? o.item(1).text : undefined,
      sideControl: o.isControlVisible('mt'),
      objectCaching: o.objectCaching,
    })));
  assert.deepEqual(restored.map((o) => [o.type, o.text]), [['Step', '1'], ['Step', '2'], ['Blur', undefined]]);
  assert.equal(restored[0].sideControl, false);
  assert.equal(restored[2].objectCaching, false);
});
